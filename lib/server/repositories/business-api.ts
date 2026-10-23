import {expenseClaimStatus,isExpensePaymentKind} from '@/lib/expense-payment';
import {idempotentBusiness} from "../business-idempotency";
import "server-only";
import {offerTotalSql,offerStatusSql,invoiceCreditSql,invoiceRefundSql,invoicePaymentStatusSql,invoiceDueStatusSql,invoiceDisplayStatusSql} from "../document-amount-sql";
import {businessDate,financialStatus,openAmount,invoiceStatusAxes,customerCredit,paymentEntryIssue,paymentBalance,samePaymentBalance,maxRecordedPayment,calculateDocument,moneyMinor} from "@/lib/financial-status";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { audit } from "../audit";
import { ApiError } from "../http";
import { ownRecordOnly, tenantCan } from "@/lib/permissions";

import type { SessionUser } from "../session";

type Row=Record<string,unknown>;
const mutationArgs=(args:Row):Row=>({...args,...(Array.isArray(args.p_items)?{p_items:args.p_items.map(line=>({...line}))}:{})});
export const canonicalApiTables=new Set(['products','employees','expenses','documents','payments','customers','customer_contacts','time_entries','projects','support_tickets']);
const sqlSources:Record<string,string>={
 projects:`select id,name,customer_id,status,source_quote_id,external_id,created_at from projects where organization_id=$1 and archived_at is null`,
 time_entries:`select t.id,coalesce(p.name,t.project_label,t.description) project_name,t.description,t.work_date started_at,round(t.hours*60) duration_minutes,t.created_at from time_entries t left join projects p on p.id=t.project_id and p.organization_id=t.organization_id where t.organization_id=$1 and t.archived_at is null`,
 support_tickets:`select id,case_number,subject,case when status='waiting_for_customer' then 'waiting_customer' else status end status,category,priority,created_at,updated_at from support_cases where organization_id=$1`,
 products:`select id,name,item_type kind,sku,unit,unit_price,vat_rate,description,status,created_at,updated_at from products_services where organization_id=$1 and archived_at is null`,
 employees:`select id,name,coalesce(first_name,split_part(name,' ',1)) first_name,coalesce(last_name,substring(name from position(' ' in name)+1)) last_name,email,phone,title job_title,workload_percent,weekly_hours,vacation_days,address,start_date,start_date entry_date,end_date,work_location,case when active then 'active' else 'inactive' end status,created_at,updated_at from employees where organization_id=$1 and archived_at is null`,
 expenses:`select e.id,e.payment_kind,e.employee_id,e.customer_id,e.billable,e.invoiced_invoice_id,e.reimbursed_at,e.reimbursement_reference,e.reimbursement_paid_on::text,e.reimbursement_amount,e.reimbursement_currency,e.reviewed_at,e.reviewed_by_user_id,coalesce(e.merchant,e.description) merchant,e.expense_date,coalesce(e.category_label,e.category) category,e.quantity*e.unit_price amount,e.currency,e.vat_rate,e.description,case when e.status='open' then 'draft' else e.status end status,e.created_at,e.updated_at,e.created_by_user_id,m.name employee_name,json_build_object('first_name',split_part(m.name,' ',1),'last_name',substring(m.name from position(' ' in m.name)+1)) employee from expenses e left join employees m on m.id=e.employee_id and m.organization_id=e.organization_id where e.organization_id=$1 and e.archived_at is null`,
 payments:`select p.id,p.invoice_id,coalesce(p.payer_customer_id,i.customer_id) customer_id,p.payment_date paid_on,p.amount,i.currency,p.method,p.reference note,case when p.allocation_status='matched' then 'booked' else 'pending' end status,p.created_at,c.name customer_name,i.invoice_no invoice_number,json_build_object('name',c.name) customer,json_build_object('number',i.invoice_no,'total',i.total_amount) invoice from payments p left join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id left join customers c on c.id=coalesce(p.payer_customer_id,i.customer_id) and c.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null`,
 customers:`select id,customer_no,customer_type "customerType",name,contact_name,coalesce((select cc.name from customer_contacts cc where cc.organization_id=customers.organization_id and cc.customer_id=customers.id and cc.is_primary=true and cc.archived_at is null limit 1),contact_name) contact,email,phone,address,coalesce(street,address) street,building_number,zip,zip postal_code,city,country,sector,uid,notes,language,payment_days,payment_days "paymentDays",discount,status,trim(concat_ws(' ',zip,city)) "zipCity",created_at,created_at "createdAt",updated_at,updated_at "updatedAt" from customers where organization_id=$1 and archived_at is null`,
 customer_contacts:`select id,customer_id,coalesce(first_name,split_part(name,' ',1)) first_name,coalesce(last_name,substring(name from position(' ' in name)+1)) last_name,email,phone,role_label job_title,is_primary,created_at,updated_at from customer_contacts where organization_id=$1 and archived_at is null`
};
/** Public domain fields only: normalize number separators before the database limit. */
const searchColumns:Record<string,string[]>={
 customers:['q.name','q.customer_no','q.contact_name','q.email','q.phone','q.city'],
 documents:['q.number',"q.customer->>'name'","q.customer->>'number'",'q.title','q.qr_reference'],
 payments:["q.customer->>'name'","q.invoice->>'number'",'q.note','q.method'],
 products:['q.name','q.sku','q.description'],
 employees:['q.first_name','q.last_name','q.email','q.job_title'],
 expenses:['q.merchant','q.description','q.category',"q.employee->>'first_name'","q.employee->>'last_name'"],
 customer_contacts:['q.first_name','q.last_name','q.email','q.phone'],
 projects:['q.name','q.external_id'],
 time_entries:['q.project_name','q.description'],
 support_tickets:['q.case_number','q.subject'],
};

/** Read projection only: same issued/credit/refund definitions as financialMetricsData.
 * Correlated by tenant and customer; filtering/counting happen before pagination. */
export function customerFinancialProjection(){return `select
 coalesce(json_agg(json_build_object('currency',currency,'revenue',revenue,'open_amount',open_amount) order by currency),'[]'::json) financials,
 coalesce(bool_or(open_amount>0),false) has_open from (
  select i.currency,
   sum(case when date_trunc('year',i.issue_date)=date_trunc('year',(now() at time zone 'Europe/Zurich')::date) then i.total_amount else 0 end-coalesce(n.year_credit,0)) revenue,
   sum(greatest(0,greatest(0,i.total_amount-coalesce(n.credit,0))-greatest(0,i.paid_amount-coalesce(r.refund,0)))) open_amount
  from invoices i
  left join lateral (select sum(amount) credit,sum(amount) filter(where date_trunc('year',credit_date)=date_trunc('year',(now() at time zone 'Europe/Zurich')::date)) year_credit from credit_notes where organization_id=$1 and invoice_id=i.id and credit_date<=(now() at time zone 'Europe/Zurich')::date) n on true
  left join lateral (select sum(amount) refund from invoice_refunds where organization_id=$1 and invoice_id=i.id and refund_date<=(now() at time zone 'Europe/Zurich')::date) r on true
  where i.organization_id=$1 and i.customer_id=c.id and i.archived_at is null and i.status not in ('draft','cancelled') and i.issue_date<=(now() at time zone 'Europe/Zurich')::date
  group by i.currency
 ) totals`;}
export async function listApiBusiness(c:PoolClient,s:SessionUser,table:string,extra:string):Promise<Row[]>{
 if(s.moduleProfile==='time_only'&&!['time_entries','support_tickets'].includes(table))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 const filters=new URLSearchParams(extra);const values:unknown[]=[s.organizationId];
 let source=sqlSources[table];
 if(s.moduleProfile==='time_only'&&source){values.push(s.userId);source+=' and '+(table==='time_entries'?'t.':'')+'created_by_user_id=$2';}
 if(table==='documents'){
  const kind=filters.get('kind')?.replace(/^eq\./,'');
  const sources:string[]=[];
  for(const [k,t,no,fk] of [['invoice','invoices','invoice_no','invoice_id'],['offer','quotes','quote_no','quote_id']]){
   if(kind&&kind!==k)continue;
   if(!tenantCan(s.role,k==='invoice'?'invoices:read':'sales:read'))continue;
   const lines=k==='invoice'?'invoice_lines':'quote_lines';
   sources.push(`select d.id,d.customer_id,'${k}' kind,d.${no} number,d.status,${k==='offer'?'d.offer_version':'null::integer'} offer_version,${k==='offer'?'d.title':'null::text'} title,d.updated_at::text document_revision,${k==='invoice'?'d.qr_reference':'null::text'} qr_reference,d.issue_date::text issue_date,${k==='invoice'?'d.due_date::text':'null::text'} due_date,${k==='offer'?'d.valid_until::text':'null::text'} valid_until,d.note,d.intro_text,d.calculation,d.issuer_snapshot,d.customer_snapshot,d.document_snapshot,${k==='invoice'?'d.payment_snapshot':"'{}'::jsonb"} payment_snapshot,d.currency,d.created_at,d.updated_at,${k==='invoice'?'d.paid_amount':'0::numeric'} paid_amount,
     ${k==='invoice'?invoiceCreditSql('d'):'0::numeric'} credit_amount,
     ${k==='invoice'?`(select v.status from document_deliveries v where v.organization_id=d.organization_id and v.kind='invoice' and v.document_id=d.id and v.purpose='document' order by v.created_at desc,v.id desc limit 1)`:'null::text'} delivery_status,
     ${k==='invoice'?`coalesce((select json_agg(json_build_object('number',n.credit_no,'date',n.credit_date::text,'amount',n.amount,'reason',n.reason) order by n.credit_date,n.created_at,n.id) from credit_notes n where n.organization_id=d.organization_id and n.invoice_id=d.id),'[]'::json)`:`'[]'::json`} credits,
     ${k==='invoice'?`coalesce((select json_agg(json_build_object('id',r.id,'stage',r.reminder_stage,'status',r.status,'recipient',r.recipient,'amount',r.balance_amount,'deadline',r.payment_deadline::text,'completed_at',r.completed_at) order by r.created_at,r.id) from document_deliveries r where r.organization_id=d.organization_id and r.document_id=d.id and r.purpose='reminder'),'[]'::json)`:`'[]'::json`} reminders,
     ${k==='invoice'?invoiceRefundSql('d'):'0::numeric'} refund_amount,
     ${k==='invoice'?`coalesce((select json_agg(json_build_object('id',r.id,'date',r.refund_date::text,'amount',r.amount,'reason',r.reason) order by r.refund_date,r.created_at,r.id) from invoice_refunds r where r.organization_id=d.organization_id and r.invoice_id=d.id),'[]'::json)`:`'[]'::json`} refunds,
     ${k==='invoice'?`(select min(x.payment_date)::text from (select p.payment_date,sum(p.amount) over(order by p.payment_date,p.created_at,p.id) accumulated,sum(p.amount) over() recorded_total from payments p where p.organization_id=d.organization_id and p.invoice_id=d.id and p.archived_at is null and p.allocation_status='matched') x where x.accumulated>=d.total_amount and x.recorded_total=d.paid_amount and d.total_amount>0 and d.paid_amount>=d.total_amount)`:'null::text'} paid_on,
     ${k==='invoice'?`(select q.quote_no from quotes q where q.id=d.source_quote_id and q.organization_id=d.organization_id)`:'null::text'} source_offer,
     ${k==='offer'?`(select q.quote_no from quotes q where q.id=d.revises_quote_id and q.organization_id=d.organization_id)`:'null::text'} revises_offer,
     ${k==='offer'?`coalesce((select json_agg(json_build_object('number',q.quote_no,'status',q.status) order by q.created_at,q.id) from quotes q where q.revises_quote_id=d.id and q.organization_id=d.organization_id and q.archived_at is null),'[]'::json)`:`'[]'::json`} revisions,
     ${k==='offer'?`(select i.invoice_no from invoices i where i.source_quote_id=d.id and i.organization_id=d.organization_id and i.archived_at is null and i.status<>'cancelled' limit 1)`:'null::text'} invoice_number,
     ${k==='offer'?`(select p.id from projects p where p.source_quote_id=d.id and p.organization_id=d.organization_id and p.archived_at is null limit 1)`:'null::uuid'} project_id,
     ${k==='invoice'?'d.subtotal':`coalesce((d.calculation->>'subtotal')::numeric,(select round(sum(l.quantity*l.unit_price),2) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0)`} subtotal,
     ${k==='invoice'?'d.vat_amount':`coalesce((d.calculation->>'vat')::numeric,(select round(sum(l.quantity*l.unit_price*l.vat_rate/100),2) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0)`} vat_amount,
     ${k==='invoice'?'d.total_amount':offerTotalSql('d')} total,
     coalesce((select max(l.vat_rate) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0) vat_rate,
     json_build_object('name',c.name,'number',c.customer_no,'street',c.address,'postal_code',c.zip,'city',c.city,'country',c.country,'language',c.language) customer,
     coalesce((select json_agg(json_build_object('id',l.id,'position',l.sort_order,'description',l.description,'quantity',l.quantity,'unit_price',l.unit_price,'unit',l.unit,'price_base_quantity',${k==='invoice'?'l.price_base_quantity':'1'},'vat_rate',l.vat_rate,'line_total',coalesce((d.calculation->'lines'->(l.sort_order-1)->>'net')::numeric,l.quantity*l.unit_price/${k==='invoice'?'l.price_base_quantity':'1'}),'discount',d.calculation->'lines'->(l.sort_order-1)->'discount','tax_exempt',d.calculation->'lines'->(l.sort_order-1)->'tax_exempt','expense_ids',${k==='invoice'?`coalesce((select json_agg(x.expense_id) from invoice_line_expenses x where x.invoice_line_id=l.id),'[]'::json)`:"'[]'::json"},'time_allocations',${k==='invoice'?`coalesce((select json_agg(json_build_object('time_entry_id',x.time_entry_id,'minutes',x.allocated_minutes,'price_source_id',x.price_source_id)) from invoice_line_time_entries x where x.invoice_line_id=l.id and x.allocated_minutes is not null),'[]'::json)`:"'[]'::json"},'time_entry_ids',${k==='invoice'?`coalesce((select json_agg(x.time_entry_id) from invoice_line_time_entries x where x.invoice_line_id=l.id and x.allocated_minutes is null),'[]'::json)`:"'[]'::json"}) order by l.sort_order) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),'[]'::json) items
     from ${t} d join customers c on c.id=d.customer_id and c.organization_id=d.organization_id where d.organization_id=$1 and d.archived_at is null`);
  }
  if(!sources.length)throw new ApiError(403,'forbidden','Keine Berechtigung.');source=sources.join(' union all ');
 }
 if(!source)throw new ApiError(400,'invalid_table','Ungültige Datenquelle.');
 const customerFinancials=table==='customers'&&filters.get('include')==='financials'&&tenantCan(s.role,'invoices:read');
 if(customerFinancials)source=`select c.*,f.financials,f.has_open from (${source}) c left join lateral (${customerFinancialProjection()}) f on true`;
 // Derive the same financial display state before filtering/pagination.
 // Persisted legacy statuses and document snapshots remain unchanged.
 if(table==='documents'){
  values.push(businessDate());
  const today=`$${values.length}`;
  source=`select d.*,case when d.kind='offer' then ${offerStatusSql('d',today)} else ${invoiceDisplayStatusSql('d',today)} end display_status,case when d.kind='invoice' then ${invoicePaymentStatusSql('d')} else null end payment_status,case when d.kind='invoice' then ${invoiceDueStatusSql('d',today)} else null end due_status from (${source}) d`;
 }
 const where:string[]=[];
 if(filters.has('review')){
  if(table!=='expenses'||filters.get('review')!=='1')throw new ApiError(400,'invalid_filter','Ungültiger Freigabefilter.');
  if(!tenantCan(s.role,'expenses:write')||!['owner','admin','project_manager','manager'].includes(s.role))throw new ApiError(403,'approval_forbidden','Keine Berechtigung für Freigaben.');
  values.push(s.userId);where.push(`q.status='submitted' and q.created_by_user_id<>$${values.length}`);
 }
 if(filters.has('outstanding')){
  if(!customerFinancials||filters.get('outstanding')!=='1')throw new ApiError(400,'invalid_filter','Ungültiger Kundenfilter.');
  where.push('q.has_open=true');
 }
 if(filters.has('payment_candidates')){
  if(table!=='documents'||filters.get('payment_candidates')!=='1')throw new ApiError(400,'invalid_filter','Ungültiger Rechnungsfilter.');
  where.push("q.kind='invoice' and q.status not in ('draft','cancelled')");
 }
 const display=filters.get('display_status');
 if(display){
  if(table!=='documents'||!/^eq\.(draft|open|partial|overdue|paid|overpaid|credited|sent|accepted|declined|expired|revised|cancelled)$/.test(display))throw new ApiError(400,'invalid_filter','Ungültiger Dokumentstatus.');
  const state=display.slice(3);if(state!=='open')values.push(state);
  where.push(state==='open'?"q.display_status in ('open','partial','overdue')":`q.display_status=$${values.length}`);
 }
 for(const [key,allowed] of [['payment_status',/^eq\.(unpaid|partial|paid|overpaid|credited)$/],['due_status',/^eq\.(not_due|due_today|overdue|unknown)$/]] as const){
  const value=filters.get(key);if(!value)continue;
  if(table!=='documents'||!allowed.test(value))throw new ApiError(400,'invalid_filter','Ungültiger Dokumentstatus.');
  values.push(value.slice(3));where.push(`q.${key}=$${values.length}`);
 }

 for(const key of ['id','name','number','customer_id','status',...(table==='products'?['kind']:[]),...(table==='expenses'?['employee_id']:[]),...(table==='employees'?['first_name','last_name']:[])]){
  const value=filters.get(key);if(!value)continue;
  if(!value.startsWith('eq.'))throw new ApiError(400,'invalid_filter','Ungültiger Filter.');
  values.push(value.slice(3));where.push(`q.${key}::text=$${values.length}`);
 }
 if(table==='expenses'&&ownRecordOnly(s.role,'spesen')){values.push(s.userId);where.push(`q.created_by_user_id=$${values.length}`)}
 const search=filters.get('q')?.trim();
 if(search){
  if(search.length>200)throw new ApiError(400,'invalid_search','Der Suchtext ist zu lang.');
  values.push(search);
  const needle=`regexp_replace(lower($${values.length}::text),'[^[:alnum:]]','','g')`;
  const fields=searchColumns[table];
  if(!fields)throw new ApiError(400,'invalid_search','Diese Datenquelle unterstützt keine Suche.');
  where.push(`${needle}<>'' and regexp_replace(lower(concat_ws(' ',${fields.join(',')})),'[^[:alnum:]]','','g') like '%'||${needle}||'%'`);
 }
 const requested=Number(filters.get('limit')||1000);const limit=Number.isSafeInteger(requested)?Math.max(1,Math.min(1000,requested)):1000;
 const allowedOrder=new Set(['created_at',...(table==='customers'?['name','city','customer_no','status']:[]),...(table==='documents'?['number','customer_name','total','display_status','due_date','issue_date','updated_at']:[]),...(table==='products'?['name','kind','unit_price','status']:[]),...(table==='employees'?['name','job_title','workload_percent','status']:[]),...(table==='payments'?['paid_on','customer_name','invoice_number','amount','status']:[]),...(table==='expenses'?['expense_date','merchant','employee_name','amount','status']:[]),...(table==='customer_contacts'?['is_primary','first_name','last_name','email']:[]),...(table==='support_tickets'?['case_number','subject','status','updated_at']:[])]);
 const requestedOrder=filters.get('order')||'created_at.desc';
 const sortTerms=requestedOrder.split(',').map(term=>{
  const parts=term.split('.');
  if(parts.length!==2||!allowedOrder.has(parts[0])||!['asc','desc'].includes(parts[1]))throw new ApiError(400,'invalid_order','Ungültige Sortierung.');
  const expression=table==='documents'&&parts[0]==='customer_name'?"q.customer->>'name'":`q.${parts[0]}`;
  return `${expression} ${parts[1]}`;
 });
 const offset=Number(filters.get('offset')||0);
 if(!Number.isSafeInteger(offset)||offset<0||offset>10_000_000)throw new ApiError(400,'invalid_offset','Ungültige Listenseite.');
 const result=await c.query<Row>(`select *,count(*) over()::int total_count from (${source}) q ${where.length?'where '+where.join(' and '):''} order by ${sortTerms.join(',')},q.id desc limit ${limit}${offset?' offset '+offset:''}`,values);
 if(table==='customers'&&['member','project_manager','manager'].includes(s.role))return result.rows.map(row=>Object.fromEntries(['id','customer_no','name','contact','contact_name','status','total_count'].filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]])));
 if(table==='expenses')return result.rows.map(row=>({...row,claim_status:expenseClaimStatus(row.payment_kind,row.status,row.reimbursed_at)}));
 return table==='documents'?result.rows.map(row=>{const axes=row.kind==='invoice'?invoiceStatusAxes(row):null;return {...row,document_status:axes?.document??row.status,payment_status:axes?.payment??null,due_status:axes?.due??null,customer_credit:axes?customerCredit(row):null,overdue:axes?.due==='overdue',display_status:financialStatus(row)};}):result.rows;
}
export function translateBusinessWrite(table:string,data:Row,insert:boolean){
 const out:Row={};let target=table;
 if(table==='products'){target='products_services';Object.assign(out,{name:data.name,item_type:data.kind,sku:data.sku,unit:data.unit,unit_price:data.unit_price,vat_rate:data.vat_rate,description:data.description,status:data.status??'active'})}
 else if(table==='employees'){
  Object.assign(out,{name:[data.first_name,data.last_name].join(' '),first_name:data.first_name,last_name:data.last_name,email:data.email,phone:data.phone,title:data.job_title,workload_percent:data.workload_percent,weekly_hours:data.weekly_hours,vacation_days:data.vacation_days,address:data.address,start_date:Object.hasOwn(data,'start_date')?data.start_date:data.entry_date,active:data.status!=='inactive'});
  if(Object.hasOwn(data,'end_date'))out.end_date=data.end_date;
  if(Object.hasOwn(data,'work_location'))out.work_location=data.work_location;
  if(insert)Object.assign(out,{role:'employee',employment_type:'salary'});
 }else if(table==='expenses'){
  const category=String(data.category??'other');
  Object.assign(out,{merchant:data.merchant,expense_date:data.expense_date,category:['expense','material','travel','other'].includes(category)?category:category==='Reise'?'travel':category==='Material'?'material':category==='Verpflegung'?'expense':'other',category_label:category,quantity:1,unit_price:data.amount,currency:data.currency,vat_rate:data.vat_rate,description:data.description||data.merchant,status:['draft','submitted','approved','posted','rejected'].includes(String(data.status))?data.status:'draft'});
  if(data.employee_id!==undefined)out.employee_id=data.employee_id;
  if(data.customer_id!==undefined)out.customer_id=data.customer_id;
  if(data.billable!==undefined)out.billable=data.billable;
  if(data.payment_kind!==undefined){if(!isExpensePaymentKind(data.payment_kind))throw new ApiError(400,'payment_kind_invalid','Bitte eine gültige Zahlungsart wählen.');out.payment_kind=data.payment_kind;}
 }else if(table==='customer_contacts'){Object.assign(out,{customer_id:data.customer_id,name:[data.first_name,data.last_name].join(' '),first_name:data.first_name,last_name:data.last_name,email:data.email,phone:data.phone,role_label:data.job_title,is_primary:data.is_primary})}
 else throw new ApiError(400,'unsupported_write','Ungültige Datenquelle.');
 if(insert)out.external_id=randomUUID();
 return {target,data:out};
}
export async function mutateApiBusiness(c:PoolClient,s:SessionUser,operation:string,args:Row):Promise<unknown>{
 if(operation==='discard_invoice_draft')return discardInvoiceDraft(c,s,args);
 if(operation==='update_document_atomic'&&(args.p_discount!==undefined||args.p_calculation_revision!==undefined||(Array.isArray(args.p_items)&&args.p_items.some((l:Row)=>l.discount!==undefined)))){
  if(!tenantCan(s.role,args.p_kind==='invoice'?'invoices:write':'sales:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const body={...args};delete body.p_idempotency_key;
  return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'document.update.'+args.p_kind,key:String(args.p_idempotency_key??''),body},()=>executeBusinessMutation(c,s,operation,mutationArgs(args)));
 }
 if(operation!=='create_document_atomic')return executeBusinessMutation(c,s,operation,mutationArgs(args));
 if(!['invoice','offer'].includes(String(args.p_kind)))throw new ApiError(400,'kind_invalid','Ungültiger Dokumenttyp.');
 if(!tenantCan(s.role,args.p_kind==='invoice'?'invoices:write':'sales:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 const body={...args};delete body.p_idempotency_key;delete body.p_number;
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'document.create.'+args.p_kind,key:String(args.p_idempotency_key??''),body},()=>executeBusinessMutation(c,s,operation,mutationArgs(args)));
}
async function executeBusinessMutation(c:PoolClient,s:SessionUser,operation:string,args:Row):Promise<unknown>{
 if(operation==='create_payment_idempotent'){
  if(!tenantCan(s.role,'payments:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const key=String(args.p_idempotency_key);const hash=JSON.stringify(args);
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':payment:'+key]);
  const previous=await c.query('select request_hash,response_json from business_idempotency_keys where organization_id=$1 and operation=$2 and idempotency_key=$3',[s.organizationId,operation,key]);
  if(previous.rows[0]){
   if(previous.rows[0].request_hash!==hash)throw new ApiError(409,'idempotency_conflict','Idempotency-Key wurde bereits verwendet.');
   return previous.rows[0].response_json;
  }
  const amount=Number(args.p_amount);if(typeof args.p_amount!=='number'||!Number.isFinite(amount)||amount<=0)throw new ApiError(400,'amount_invalid','Ungültiger Betrag.');
  const paidOn=String(args.p_paid_on??''),paidDate=new Date(paidOn+'T12:00:00Z');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(paidOn)||!Number.isFinite(paidDate.getTime())||paidDate.toISOString().slice(0,10)!==paidOn||paidOn>businessDate())throw new ApiError(400,'payment_date_invalid','Bitte ein gültiges Zahlungsdatum bis heute eingeben.');
  const invoice=await c.query('select id,customer_id,total_amount,paid_amount,status from invoices where id::text=$1 and organization_id=$2 and archived_at is null for update',[args.p_invoice_id,s.organizationId]);
  const row=invoice.rows[0];if(!row||['draft','cancelled'].includes(row.status))throw new ApiError(400,'invoice_invalid','Bitte eine ausgestellte Rechnung auswählen.');
  // Existing dated advance receipts remain valid; never relabel their cash date
  // to the later invoice date. A future date is not an actual received payment.
  const credits=(await c.query("select coalesce(sum(amount),0) amount from credit_notes where organization_id=$1 and invoice_id=$2 and credit_date<=(now() at time zone 'Europe/Zurich')::date",[s.organizationId,row.id])).rows[0].amount;
  const refunds=(await c.query("select coalesce(sum(amount),0) amount from invoice_refunds where organization_id=$1 and invoice_id=$2 and refund_date<=(now() at time zone 'Europe/Zurich')::date",[s.organizationId,row.id])).rows[0].amount;
  const remaining=openAmount({total:row.total_amount,paid_amount:row.paid_amount,credit_amount:credits,refund_amount:refunds});
  const confirmed=args.p_overpayment_confirmed===true,balance=paymentBalance({total:row.total_amount,paid_amount:row.paid_amount,credit_amount:credits,refund_amount:refunds});
  if(confirmed&&!samePaymentBalance(args.p_expected_balance,balance))throw new ApiError(409,'payment_balance_changed','Der Zahlungsstand hat sich geändert. Bitte Betrag und Überzahlung erneut prüfen.');
  const issue=paymentEntryIssue(amount,remaining,confirmed,confirmed?balance.openAmount:undefined);
  if(issue)throw new ApiError(issue==='amount_invalid'?400:409,issue,issue==='payment_balance_changed'?'Der Zahlungsstand hat sich geändert. Bitte Betrag und Überzahlung erneut prüfen.':issue==='amount_invalid'?'Bitte gültigen Betrag eingeben.':'Der Zahlungsbetrag darf den offenen Rechnungsbetrag ohne ausdrückliche Überzahlungsbestätigung nicht überschreiten.');
  if(Math.round(Number(row.paid_amount)*100)+Math.round(amount*100)>Math.round(maxRecordedPayment*100))throw new ApiError(400,'amount_invalid','Bitte gültigen Betrag eingeben.');
  if(confirmed){
   const recorded=Number((await c.query("select coalesce(sum(amount),0) amount from payments where organization_id=$1 and invoice_id=$2 and archived_at is null and allocation_status='matched'",[s.organizationId,row.id])).rows[0].amount);
   if(recorded!==Number(row.paid_amount))throw new ApiError(409,'payment_ledger_mismatch','Der Zahlungsstand muss vor der Überzahlung geprüft werden.');
  }
  if(args.p_customer_id&&String(args.p_customer_id)!==String(row.customer_id))throw new ApiError(400,'customer_mismatch','Kunde stimmt nicht mit der Rechnung überein.');
  const payment=await c.query(`insert into payments(organization_id,external_id,invoice_id,payer_customer_id,payment_date,amount,method,reference,allocation_status,created_by_user_id)
   values($1,$2,$3,$4,$5,$6,$7,$8,'matched',$9) returning id,amount,payment_date paid_on`,[s.organizationId,randomUUID(),row.id,row.customer_id,args.p_paid_on,amount,args.p_method,args.p_note,s.userId]);
  await c.query("update invoices set paid_amount=paid_amount+$1,status=case when paid_amount+$1-$5::numeric>=greatest(0,total_amount-$4::numeric) then 'paid' else 'partial' end,updated_at=now() where id=$2 and organization_id=$3",[amount,row.id,s.organizationId,credits,refunds]);
  await c.query('insert into business_idempotency_keys(organization_id,operation,idempotency_key,request_hash,response_json,created_by_user_id) values($1,$2,$3,$4,$5::jsonb,$6)',[s.organizationId,operation,key,hash,JSON.stringify(payment.rows[0]),s.userId]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:"payment.created",entityType:"payment",entityId:payment.rows[0].id,...(confirmed?{metadata:{invoiceId:row.id,overpaymentConfirmed:true,reviewedBalance:balance,overpaymentAmount:Math.round((amount-remaining)*100)/100}}:{})});
  return payment.rows[0];
 }
 if(!['create_document_atomic','update_document_atomic'].includes(operation))throw new ApiError(400,'invalid_operation','Ungültige Aktion.');
 const invoice=args.p_kind==='invoice';if(!tenantCan(s.role,invoice?'invoices:write':'sales:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 // Drafts do not require banking setup. Issue validates complete QR/payment data in document-process.
 if(operation==='create_document_atomic'){
  const year=businessDate().slice(0,4);
  const numberingTable=invoice?'invoices':'quotes',numberingColumn=invoice?'invoice_no':'quote_no';
  const pattern=(invoice?'RE-':'AN-')+year+'-([0-9]{6})$';
  const sequence=await c.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,$2,$3,coalesce((select max(substring(${numberingColumn} from $4)::integer) from ${numberingTable} where organization_id=$1),0)+2) on conflict(organization_id,kind,period) do update set next_value=greatest(business_document_counters.next_value+1,excluded.next_value) returning next_value-1 number`,[s.organizationId,invoice?'invoice':'quote',year,'^'+pattern]);
  args.p_number=(invoice?'RE-':'AN-')+year+'-'+String(sequence.rows[0].number).padStart(6,'0');
 }
 const table=invoice?'invoices':'quotes',numberColumn=invoice?'invoice_no':'quote_no',lineTable=invoice?'invoice_lines':'quote_lines',parentColumn=invoice?'invoice_id':'quote_id';
 const vat=Number(args.p_vat_rate);if(!Number.isFinite(vat)||vat<0||vat>100)throw new ApiError(400,'vat_invalid','Ungültiger MwSt.-Satz.');
 if(!['CHF','EUR'].includes(String(args.p_currency)))throw new ApiError(400,'currency_invalid','Ungültige Währung.');
 const found=await c.query('select id,discount from customers where id::text=$1 and organization_id=$2 and archived_at is null',[args.p_customer_id,s.organizationId]);
 if(!found.rowCount)throw new ApiError(400,'customer_invalid','Kunde wurde nicht gefunden.');
 let sourceQuoteId:string|null=null;
 if(invoice&&operation==='create_document_atomic'&&args.p_source_offer){
  const quote=(await c.query("select id,status,customer_id,currency,calculation from quotes where organization_id=$1 and quote_no=$2 and archived_at is null for update",[s.organizationId,args.p_source_offer])).rows[0];
  if(!quote||quote.status!=='accepted'||quote.customer_id!==args.p_customer_id||quote.currency!==args.p_currency)throw new ApiError(409,'offer_not_accepted','Für die Rechnung muss ein angenommenes Angebot desselben Kunden und derselben Währung vorliegen.');
  if((await c.query('select id from invoices where organization_id=$1 and source_quote_id=$2 and archived_at is null and status<>\'cancelled\'',[s.organizationId,quote.id])).rowCount)throw new ApiError(409,'offer_already_invoiced','Aus diesem Angebot wurde bereits eine Rechnung erstellt.');
  if(quote.calculation&&(quote.calculation.discount.kind!=='none'||quote.calculation.lines.some((l:Row)=>(l.discount as Row).kind!=='none'))&&(args.p_discount===undefined||(args.p_items as Row[]).some(l=>l.discount===undefined)))throw new ApiError(409,'discount_confirmation_required','Bitte die Rabatte des Angebots ausdrücklich übernehmen.');
  sourceQuoteId=quote.id;
 }
 let id:string;
 if(operation==='update_document_atomic'){
  const existing=await c.query(`select id,status,calculation,updated_at::text document_revision${invoice?',paid_amount':''} from ${table} where ${numberColumn}=$1 and organization_id=$2 and archived_at is null for update`,[args.p_current_number,s.organizationId]);
  if(args.p_number!==args.p_current_number)throw new ApiError(409,'number_immutable','Die bestehende Dokumentnummer kann nicht geändert werden.');
  const row=existing.rows[0];if(!row)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
  if(args.p_expected_updated_at!==undefined&&args.p_expected_updated_at!==row.document_revision)throw new ApiError(409,'document_changed','Dokument wurde inzwischen geändert. Bitte neu laden und Angaben prüfen.');
  if(row.status!=='draft')throw new ApiError(409,'document_locked','Dieses Dokument kann nicht mehr geändert werden.');id=row.id;
  if(invoice){await lockInvoiceTimeSources(c,s,args.p_items as Row[],id);await c.query("delete from invoice_line_time_entries x using invoice_lines l where x.organization_id=$1 and l.organization_id=x.organization_id and l.id=x.invoice_line_id and l.invoice_id=$2 and x.allocated_minutes is not null",[s.organizationId,id]);}
  if(row.calculation&&((row.calculation.discount?.kind!=='none'&&args.p_discount===undefined)||(row.calculation.lines.some((l:Row)=>(l.discount as Row)?.kind!=='none')&&(args.p_items as Row[]).some(l=>l.discount===undefined))||(row.calculation.lines.some((l:Row)=>l.tax_exempt===true)&&(args.p_items as Row[]).some(l=>l.tax_exempt===undefined))))throw new ApiError(409,'discount_confirmation_required','Bitte den gespeicherten Rabatt ausdrücklich übernehmen oder entfernen.');
  if((await c.query("select id from document_deliveries where organization_id=$1 and document_id=$2 and status in ('sending','uncertain','failed')",[s.organizationId,id])).rowCount)throw new ApiError(409,'delivery_pending','Ein Versand dieses Dokuments ist noch nicht bestätigt.');
  await c.query(`update ${table} set calculation=null,${numberColumn}=$1,customer_id=$2,issue_date=$3,${invoice?'due_date':'valid_until'}=$4,note=$5,currency=$6,updated_at=now() where id=$7 and organization_id=$8`,[args.p_number,args.p_customer_id,args.p_issue_date,invoice?args.p_due_date:args.p_valid_until,args.p_note,args.p_currency,id,s.organizationId]);
  if(invoice)await c.query("update expenses set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2",[s.organizationId,id]);
  if(invoice)await c.query("update time_entries set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2",[s.organizationId,id]);
  await c.query(`delete from ${lineTable} where ${parentColumn}=$1 and organization_id=$2`,[id,s.organizationId]);
 }else{
  id=randomUUID();
  await c.query(`insert into ${table}(id,organization_id,external_id,${numberColumn},customer_id,${invoice?'':'title,'}issue_date,${invoice?'due_date':'valid_until'},status,note,currency,created_by_user_id)
   values($1,$2,$1::uuid::text,$3,$4,${invoice?'':'$3,'}$5,$6,'draft',$7,$8,$9)`,[id,s.organizationId,args.p_number,args.p_customer_id,args.p_issue_date,invoice?args.p_due_date:args.p_valid_until,args.p_note,args.p_currency,s.userId]);
 }
 if(invoice&&operation!=='update_document_atomic')await lockInvoiceTimeSources(c,s,args.p_items as Row[],id);
 if(sourceQuoteId)await c.query("update invoices set source_quote_id=$3 where organization_id=$1 and id=$2",[s.organizationId,id,sourceQuoteId]);
 const claimedTime=new Set<string>(),claimedExpenses=new Set<string>();
 for(const raw of args.p_items as Row[]){for(const [field,claimed] of [["time_entry_ids",claimedTime],["expense_ids",claimedExpenses]] as const){for(const value of Array.isArray(raw[field])?raw[field] as unknown[]:[]){const id=String(value);if(claimed.has(id))throw new ApiError(409,"duplicate_service","Eine Leistung kann nur einmal auf einer Rechnung verrechnet werden.");claimed.add(id);}}}
 for(const raw of args.p_items as Row[]){for(const allocation of minuteAllocations(raw.time_allocations)){if(claimedTime.has(allocation.time_entry_id))throw new ApiError(409,'duplicate_service','Eine Leistung kann nur einmal auf einer Rechnung verrechnet werden.');claimedTime.add(allocation.time_entry_id);}}
 let position=0;
 for(const raw of args.p_items as Row[]){
  if(raw.vat_rate===undefined)raw.vat_rate=vat;
  await prepareMinuteLine(c,s,raw,args.p_customer_id,args.p_currency,invoice);
  const lineVat=Number(raw.vat_rate);
  if(!Number.isFinite(lineVat)||lineVat<0||lineVat>100)throw new ApiError(400,'vat_invalid','Ungültiger MwSt.-Satz.');
  const inserted=await c.query(`insert into ${lineTable}(organization_id,external_id,${parentColumn},sort_order,description,quantity,unit,unit_price,vat_rate${invoice?",price_base_quantity":""}) values($1,$2,$3,$4,$5,$6,$7,$8,$9${invoice?",$10":""}) returning id`,[s.organizationId,randomUUID(),id,++position,raw.description,raw.quantity,String(raw.unit??"Stück").slice(0,40),raw.unit_price,lineVat,...(invoice?[raw.price_base_quantity]:[])]);
  if(invoice)for(const allocation of minuteAllocations(raw.time_allocations))await c.query('insert into invoice_line_time_entries(organization_id,invoice_line_id,time_entry_id,allocated_minutes,price_source_id) values($1,$2,$3,$4,$5)',[s.organizationId,inserted.rows[0].id,allocation.time_entry_id,allocation.minutes,allocation.price_source_id]);
  if(invoice&&Array.isArray(raw.expense_ids)&&raw.expense_ids.length){
   const ids=raw.expense_ids.map(String).slice(0,100);
   const linked=await c.query("update expenses set invoiced_invoice_id=$3 where organization_id=$1 and id=any($2::uuid[]) and archived_at is null and customer_id=$4 and currency=$5 and billable=true and status in ('approved','posted') and (invoiced_invoice_id is null or invoiced_invoice_id=$3) returning id",[s.organizationId,ids,id,args.p_customer_id,args.p_currency]);
   if(linked.rowCount!==ids.length)throw new ApiError(409,'expenses_changed','Mindestens eine Spese ist nicht mehr verrechenbar.');
   for(const row of linked.rows)await c.query('insert into invoice_line_expenses(organization_id,invoice_line_id,expense_id) values($1,$2,$3)',[s.organizationId,inserted.rows[0].id,row.id]);
  }
  if(invoice&&Array.isArray(raw.time_entry_ids)&&raw.time_entry_ids.length){
   if(args.p_currency!=='CHF')throw new ApiError(409,'time_currency_mismatch','Stundensätze werden in CHF geführt. Diese Zeiten benötigen eine CHF-Rechnung.');
   const ids=raw.time_entry_ids.map(String).slice(0,100);
   const linked=await c.query(`update time_entries set invoiced_invoice_id=$3 where organization_id=$1 and id=any($2::uuid[]) and archived_at is null and customer_id=$4 and billable=true and approved=true and (invoiced_invoice_id is null or invoiced_invoice_id=$3) returning id`,[s.organizationId,ids,id,args.p_customer_id]);
   if(linked.rowCount!==ids.length)throw new ApiError(409,'time_entries_changed','Mindestens ein Zeiteintrag ist nicht mehr verrechenbar. Bitte Auswahl aktualisieren.');
   for(const row of linked.rows)await c.query('insert into invoice_line_time_entries(organization_id,invoice_line_id,time_entry_id) values($1,$2,$3)',[s.organizationId,inserted.rows[0].id,row.id]);
  }
 }
 let calculation:ReturnType<typeof calculateDocument>;
 try{calculation=calculateDocument((args.p_items as Row[]).map(l=>({quantity:l.quantity,unit_price:l.unit_price,vat_rate:l.vat_rate??vat,discount:l.discount,tax_exempt:l.tax_exempt,price_base_quantity:l.price_base_quantity})),String(args.p_currency),args.p_discount);}catch(error){throw new ApiError(400,'discount_invalid',error instanceof Error?error.message:'Ungültige Berechnung.');}
 calculation={...calculation,lines:calculation.lines.map((line,i)=>({...line,...((args.p_items as Row[])[i].time_allocation_sources?{time_allocations:(args.p_items as Row[])[i].time_allocation_sources}: {})}))};
 const origin=args.p_discount_origin??(calculation.discount.kind==='none'?'removed':'manual');
 if(!['removed','manual','customer'].includes(String(origin))||(origin==='removed'&&calculation.discount.kind!=='none')||(origin==='customer'&&(calculation.discount.kind!=='percent'||Number(calculation.discount.value)!==Number(found.rows[0].discount))))throw new ApiError(400,'discount_origin_invalid','Der Kundenrabatt wurde geändert. Bitte den Vorschlag erneut prüfen.');
 const documentVersion=invoice?1:Number((await c.query('select offer_version from quotes where id=$1 and organization_id=$2',[id,s.organizationId])).rows[0].offer_version);
 const calculationSnapshot={...calculation,documentVersion,discountOrigin:origin,customerProposal:operation==='create_document_atomic'?{kind:'percent',value:String(found.rows[0].discount??0),applied:origin==='customer'}:undefined};
 await c.query(`update ${table} set calculation=$3::jsonb${invoice?',subtotal=$4,vat_amount=$5,total_amount=$6':''} where id=$1 and organization_id=$2`,[id,s.organizationId,JSON.stringify(calculationSnapshot),...(invoice?[calculation.subtotal,calculation.vat,calculation.total]:[])]);
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:operation==='create_document_atomic'?'document.created':'document.updated',entityType:table,entityId:id});
 return (await listApiBusiness(c,s,'documents','id=eq.'+id))[0];
}

export type MinuteAllocation={time_entry_id:string;minutes:number;price_source_id:string};
export function minuteAllocations(value:unknown,publicNames=false):MinuteAllocation[]{
 if(value===undefined)return [];
 if(!Array.isArray(value)||value.length>100)throw new ApiError(400,'minute_allocation_invalid','Bitte gültige ganze Minuten und bestätigte Preisquellen auswählen.');
 const id=publicNames?'timeEntryId':'time_entry_id',source=publicNames?'priceSourceId':'price_source_id',seen=new Set<string>();
 return value.map(raw=>{const a=raw as Row;if(!a||typeof a!=='object'||Array.isArray(a)||Object.keys(a).some(k=>![id,source,'minutes'].includes(k))||![a[id],a[source]].every(v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v))||!Number.isInteger(a.minutes)||Number(a.minutes)<1||Number(a.minutes)>1440||seen.has(String(a[id]).toLowerCase()))throw new ApiError(400,'minute_allocation_invalid','Bitte gültige ganze Minuten und bestätigte Preisquellen auswählen.');seen.add(String(a[id]).toLowerCase());return {time_entry_id:String(a[id]).toLowerCase(),minutes:Number(a.minutes),price_source_id:String(a[source]).toLowerCase()};});
}
/** Acquire every old/new source in UUID order before changing draft reservations. */
export async function lockInvoiceTimeSources(c:PoolClient,s:SessionUser,items:Row[],invoiceId:string){
 const ids=items.flatMap(l=>[...(Array.isArray(l.time_entry_ids)?l.time_entry_ids.map(String):[]),...minuteAllocations(l.time_allocations).map(a=>a.time_entry_id)]);
 await c.query(`select id from time_entries where organization_id=$1 and (id=any($2::uuid[]) or id in(select x.time_entry_id from invoice_line_time_entries x join invoice_lines l on l.organization_id=x.organization_id and l.id=x.invoice_line_id where x.organization_id=$1 and l.invoice_id=$3)) order by id for update`,[s.organizationId,[...new Set(ids)],invoiceId]);
}
export async function prepareMinuteLine(c:PoolClient,s:SessionUser,raw:Row,customerId:unknown,currency:unknown,invoice:boolean){
 const allocations=minuteAllocations(raw.time_allocations);raw.time_allocations=allocations;delete raw.time_allocation_sources;
 if(!allocations.length){if(raw.price_base_quantity!==undefined&&raw.price_base_quantity!==1)throw new ApiError(400,'minute_allocation_invalid','Bitte gültige ganze Minuten und bestätigte Preisquellen auswählen.');raw.price_base_quantity=1;return;}
 if(!invoice||raw.price_base_quantity!==60||raw.unit!=='min'||Array.isArray(raw.time_entry_ids)&&raw.time_entry_ids.length||Array.isArray(raw.expense_ids)&&raw.expense_ids.length)throw new ApiError(400,'minute_allocation_invalid','Bitte gültige ganze Minuten und bestätigte Preisquellen auswählen.');
 const sources:Row[]=[];let total=0;let first:Row|undefined;
 for(const allocation of allocations){
  const row=(await c.query(`select t.id,t.customer_id,t.recorded_duration_minutes,p.source_snapshot from time_entries t join time_price_sources p on p.organization_id=t.organization_id and p.time_entry_id=t.id where t.organization_id=$1 and t.id=$2 and p.id=$3 and p.side='sale' and p.is_current and t.external_resource_id is not null and t.approved and t.submitted_at is not null and t.billable and t.archived_at is null`,[s.organizationId,allocation.time_entry_id,allocation.price_source_id])).rows[0];
  if(!row||row.customer_id!==customerId||allocation.minutes>row.recorded_duration_minutes)throw new ApiError(409,'minute_source_changed','Die ausgewählte Leistung oder Preisquelle ist nicht mehr verfügbar.');
  const price=row.source_snapshot as Row;
  if(price.currency!==currency)throw new ApiError(409,'minute_currency_mismatch','Leistungspreis und Rechnungswährung müssen übereinstimmen. Es erfolgt keine automatische Umrechnung.');
  const signature=(p:Row)=>JSON.stringify([p.unitPrice,p.vatRate,p.taxTreatment,p.taxReason]);
  if(first&&signature(first)!==signature(price))throw new ApiError(400,'minute_prices_differ','Unterschiedliche Preis- oder Steuerregeln benötigen getrennte Positionen.');first??=price;
  total+=allocation.minutes;sources.push({...allocation,source_snapshot:price});
 }
 const decimal=(v:unknown)=>/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(String(v));
 if(Number(raw.quantity)!==total||!decimal(raw.unit_price)||!decimal(raw.vat_rate)||moneyMinor(raw.unit_price)!==moneyMinor(first!.unitPrice)||moneyMinor(raw.vat_rate)!==moneyMinor(first!.vatRate)||(raw.tax_exempt===true)!==(first!.taxTreatment!=='taxable'))throw new ApiError(409,'minute_price_mismatch','Angezeigte Minuten, Preis und Steuer müssen der bestätigten Leistungsquelle entsprechen.');
 raw.quantity=total;raw.unit_price=first!.unitPrice;raw.vat_rate=first!.vatRate;raw.time_allocation_sources=sources;
}

async function discardInvoiceDraft(c:PoolClient,s:SessionUser,args:Row){
 if(args.p_kind!=='invoice'||!tenantCan(s.role,'invoices:write',s.moduleProfile)||s.organizationStatus==='read_only')throw new ApiError(403,'forbidden','Keine Berechtigung.');
 if(typeof args.p_expected_updated_at!=='string'||!args.p_expected_updated_at||typeof args.p_number!=='string')throw new ApiError(400,'document_revision_required','Bitte den aktuellen Rechnungsentwurf erneut laden.');
 const member=(await c.query("select m.user_id from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and m.module_profile='standard' and m.role in ('owner','admin','finance') and u.status='active' and o.status in ('trial','active','grace_period') for share of m",[s.organizationId,s.userId])).rows[0];
 if(!member)throw new ApiError(403,'forbidden','Keine Berechtigung.');
 return idempotentBusiness(c,{organizationId:s.organizationId,userId:s.userId,operation:'document.discard.invoice',key:String(args.p_idempotency_key??''),body:{number:args.p_number,revision:args.p_expected_updated_at}},async()=>{
  const row=(await c.query('select id,status,updated_at::text revision from invoices where organization_id=$1 and invoice_no=$2 and archived_at is null for update',[s.organizationId,args.p_number])).rows[0];
  if(!row)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
  if(row.status!=='draft')throw new ApiError(409,'document_locked','Dieses Dokument kann nicht mehr geändert werden.');
  if(row.revision!==args.p_expected_updated_at)throw new ApiError(409,'document_changed','Dokument wurde inzwischen geändert. Bitte neu laden und Angaben prüfen.');
  if((await c.query('select 1 from invoice_versions where organization_id=$1 and invoice_id=$2 union all select 1 from payments where organization_id=$1 and invoice_id=$2 union all select 1 from document_deliveries where organization_id=$1 and document_id=$2 limit 1',[s.organizationId,row.id])).rowCount)throw new ApiError(409,'document_locked','Dieses Dokument kann nicht mehr geändert werden.');
  await lockInvoiceTimeSources(c,s,[],row.id);
  await c.query('update invoices set archived_at=now(),updated_at=now() where organization_id=$1 and id=$2',[s.organizationId,row.id]);
  await c.query('update time_entries set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2 and external_resource_id is null',[s.organizationId,row.id]);
  await c.query('update expenses set invoiced_invoice_id=null where organization_id=$1 and invoiced_invoice_id=$2',[s.organizationId,row.id]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'document.draft.discarded',entityType:'invoices',entityId:row.id});
  return {id:row.id,number:args.p_number,discarded:true};
 });
}
