import "server-only";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { audit } from "../audit";
import { ApiError } from "../http";
import { ownRecordOnly, tenantCan } from "@/lib/permissions";
import { invoicePaymentIssue } from "@/lib/qr-bill";
import type { SessionUser } from "../session";

type Row=Record<string,unknown>;
export const canonicalApiTables=new Set(['products','employees','expenses','documents','payments','customers','customer_contacts','time_entries','projects','support_tickets']);
const sqlSources:Record<string,string>={
 projects:`select id,name,external_id,created_at from projects where organization_id=$1 and archived_at is null`,
 time_entries:`select t.id,coalesce(p.name,t.project_label,t.description) project_name,t.description,t.work_date started_at,round(t.hours*60) duration_minutes,t.created_at from time_entries t left join projects p on p.id=t.project_id and p.organization_id=t.organization_id where t.organization_id=$1 and t.archived_at is null`,
 support_tickets:`select id,case_number,subject,status,category,created_at,updated_at from support_cases where organization_id=$1`,
 products:`select id,name,item_type kind,sku,unit,unit_price,vat_rate,description,status,created_at,updated_at from products_services where organization_id=$1 and archived_at is null`,
 employees:`select id,coalesce(first_name,split_part(name,' ',1)) first_name,coalesce(last_name,substring(name from position(' ' in name)+1)) last_name,email,phone,title job_title,workload_percent,start_date entry_date,case when active then 'active' else 'inactive' end status,created_at,updated_at from employees where organization_id=$1 and archived_at is null`,
 expenses:`select e.id,e.employee_id,coalesce(e.merchant,e.description) merchant,e.expense_date,coalesce(e.category_label,e.category) category,e.quantity*e.unit_price amount,e.currency,e.vat_rate,e.description,case when e.status='open' then 'draft' else e.status end status,e.created_at,e.updated_at,e.created_by_user_id,json_build_object('first_name',split_part(m.name,' ',1),'last_name',substring(m.name from position(' ' in m.name)+1)) employee from expenses e left join employees m on m.id=e.employee_id and m.organization_id=e.organization_id where e.organization_id=$1 and e.archived_at is null`,
 payments:`select p.id,p.invoice_id,coalesce(p.payer_customer_id,i.customer_id) customer_id,p.payment_date paid_on,p.amount,p.method,p.reference note,case when p.allocation_status='matched' then 'booked' else 'pending' end status,p.created_at,json_build_object('name',c.name) customer,json_build_object('number',i.invoice_no,'total',i.total_amount) invoice from payments p left join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id left join customers c on c.id=coalesce(p.payer_customer_id,i.customer_id) and c.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null`,
 customers:`select id,name,contact_name,email,phone,address,address street,zip,zip postal_code,city,sector,uid,notes,language,payment_days,discount,status,created_at,updated_at from customers where organization_id=$1 and archived_at is null`,
 customer_contacts:`select id,customer_id,split_part(name,' ',1) first_name,substring(name from position(' ' in name)+1) last_name,email,phone,role_label job_title,is_primary,created_at,updated_at from customer_contacts where organization_id=$1`
};
export async function listApiBusiness(c:PoolClient,s:SessionUser,table:string,extra:string):Promise<Row[]>{
 const filters=new URLSearchParams(extra);const values:unknown[]=[s.organizationId];
 let source=sqlSources[table];
 if(table==='documents'){
  const kind=filters.get('kind')?.replace(/^eq\./,'');
  const sources:string[]=[];
  for(const [k,t,no,fk] of [['invoice','invoices','invoice_no','invoice_id'],['offer','quotes','quote_no','quote_id']]){
   if(kind&&kind!==k)continue;
   if(!tenantCan(s.role,k==='invoice'?'invoices:read':'sales:read'))continue;
   const lines=k==='invoice'?'invoice_lines':'quote_lines';
   sources.push(`select d.id,d.customer_id,'${k}' kind,d.${no} number,d.status,${k==='invoice'?'d.qr_reference':'null::text'} qr_reference,d.issue_date::text issue_date,${k==='invoice'?'d.due_date::text':'null::text'} due_date,${k==='offer'?'d.valid_until::text':'null::text'} valid_until,d.note,d.currency,d.created_at,${k==='invoice'?'d.paid_amount':'0::numeric'} paid_amount,
     coalesce((select sum(l.quantity*l.unit_price) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0) subtotal,
     coalesce((select sum(l.quantity*l.unit_price*l.vat_rate/100) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0) vat_amount,
     ${k==='invoice'?'d.total_amount':`coalesce((select sum(l.quantity*l.unit_price*(1+l.vat_rate/100)) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0)`} total,
     coalesce((select max(l.vat_rate) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),0) vat_rate,
     json_build_object('name',c.name,'street',c.address,'postal_code',c.zip,'city',c.city) customer,
     coalesce((select json_agg(json_build_object('id',l.id,'position',l.sort_order,'description',l.description,'quantity',l.quantity,'unit_price',l.unit_price,'unit',l.unit,'vat_rate',l.vat_rate,'line_total',l.quantity*l.unit_price) order by l.sort_order) from ${lines} l where l.${fk}=d.id and l.organization_id=d.organization_id),'[]'::json) items
     from ${t} d join customers c on c.id=d.customer_id and c.organization_id=d.organization_id where d.organization_id=$1 and d.archived_at is null`);
  }
  if(!sources.length)throw new ApiError(403,'forbidden','Keine Berechtigung.');source=sources.join(' union all ');
 }
 if(!source)throw new ApiError(400,'invalid_table','Ungültige Datenquelle.');
 const where:string[]=[];
 for(const key of ['id','name','number','customer_id','status',...(table==='expenses'?['employee_id']:[]),...(table==='employees'?['first_name','last_name']:[])]){
  const value=filters.get(key);if(!value)continue;
  if(!value.startsWith('eq.'))throw new ApiError(400,'invalid_filter','Ungültiger Filter.');
  values.push(value.slice(3));where.push(`q.${key}::text=$${values.length}`);
 }
 if(table==='expenses'&&ownRecordOnly(s.role,'spesen')){values.push(s.userId);where.push(`q.created_by_user_id=$${values.length}`)}
 const requested=Number(filters.get('limit')||1000);const limit=Number.isSafeInteger(requested)?Math.max(1,Math.min(1000,requested)):1000;
 const allowedOrder=new Set(['created_at',...(table==='documents'?['issue_date']:[]),...(table==='payments'?['paid_on']:[])]);
 const requestedOrder=filters.get('order')||'created_at.desc';
 const parts=requestedOrder.split('.');
 if(parts.length!==2||!allowedOrder.has(parts[0])||!['asc','desc'].includes(parts[1]))throw new ApiError(400,'invalid_order','Ungültige Sortierung.');
 const result=await c.query<Row>(`select * from (${source}) q ${where.length?'where '+where.join(' and '):''} order by q.${parts[0]} ${parts[1]},q.id desc limit ${limit}`,values);
 return result.rows;
}
export function translateBusinessWrite(table:string,data:Row,insert:boolean){
 const out:Row={};let target=table;
 if(table==='products'){target='products_services';Object.assign(out,{name:data.name,item_type:data.kind,sku:data.sku,unit:data.unit,unit_price:data.unit_price,vat_rate:data.vat_rate,description:data.description,status:data.status??'active'})}
 else if(table==='employees'){
  if(!data.email)throw new ApiError(400,'email_required','Bitte E-Mail-Adresse eingeben.');
  Object.assign(out,{name:[data.first_name,data.last_name].join(' '),first_name:data.first_name,last_name:data.last_name,email:data.email,phone:data.phone,title:data.job_title,workload_percent:data.workload_percent,start_date:data.entry_date,active:data.status!=='inactive'});
  if(insert)Object.assign(out,{role:'employee',employment_type:'salary'});
 }else if(table==='expenses'){
  const category=String(data.category??'other');
  Object.assign(out,{merchant:data.merchant,expense_date:data.expense_date,category:['expense','material','travel','other'].includes(category)?category:category==='Reise'?'travel':category==='Material'?'material':category==='Verpflegung'?'expense':'other',category_label:category,quantity:1,unit_price:data.amount,currency:data.currency,vat_rate:data.vat_rate,description:data.description||data.merchant,status:['draft','submitted','approved','posted','rejected'].includes(String(data.status))?data.status:'draft'});
  if(data.employee_id!==undefined)out.employee_id=data.employee_id;
 }else if(table==='customer_contacts'){Object.assign(out,{customer_id:data.customer_id,name:[data.first_name,data.last_name].join(' '),first_name:data.first_name,last_name:data.last_name,email:data.email,phone:data.phone,role_label:data.job_title,is_primary:data.is_primary})}
 else throw new ApiError(400,'unsupported_write','Ungültige Datenquelle.');
 if(insert)out.external_id=randomUUID();
 return {target,data:out};
}
export async function mutateApiBusiness(c:PoolClient,s:SessionUser,operation:string,args:Row):Promise<unknown>{
 if(operation==='create_payment_idempotent'){
  if(!tenantCan(s.role,'payments:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
  const key=String(args.p_idempotency_key);const hash=JSON.stringify(args);
  await c.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[s.organizationId+':payment:'+key]);
  const previous=await c.query('select request_hash,response_json from business_idempotency_keys where organization_id=$1 and operation=$2 and idempotency_key=$3',[s.organizationId,operation,key]);
  if(previous.rows[0]){
   if(previous.rows[0].request_hash!==hash)throw new ApiError(409,'idempotency_conflict','Idempotency-Key wurde bereits verwendet.');
   return previous.rows[0].response_json;
  }
  const amount=Number(args.p_amount);if(!Number.isFinite(amount)||amount<=0)throw new ApiError(400,'amount_invalid','Ungültiger Betrag.');
  const invoice=await c.query('select id,customer_id,total_amount,paid_amount,status from invoices where id::text=$1 and organization_id=$2 and archived_at is null for update',[args.p_invoice_id,s.organizationId]);
  const row=invoice.rows[0];if(!row||['draft','cancelled'].includes(row.status))throw new ApiError(400,'invoice_invalid','Bitte eine offene Rechnung auswählen.');
  if(args.p_customer_id&&String(args.p_customer_id)!==String(row.customer_id))throw new ApiError(400,'customer_mismatch','Kunde stimmt nicht mit der Rechnung überein.');
  const payment=await c.query(`insert into payments(organization_id,external_id,invoice_id,payer_customer_id,payment_date,amount,method,reference,allocation_status,created_by_user_id)
   values($1,$2,$3,$4,$5,$6,$7,$8,'matched',$9) returning id,amount,payment_date paid_on`,[s.organizationId,randomUUID(),row.id,row.customer_id,args.p_paid_on,amount,args.p_method,args.p_note,s.userId]);
  await c.query("update invoices set paid_amount=paid_amount+$1,status=case when paid_amount+$1>=total_amount then 'paid' else 'partial' end,updated_at=now() where id=$2 and organization_id=$3",[amount,row.id,s.organizationId]);
  await c.query('insert into business_idempotency_keys(organization_id,operation,idempotency_key,request_hash,response_json,created_by_user_id) values($1,$2,$3,$4,$5::jsonb,$6)',[s.organizationId,operation,key,hash,JSON.stringify(payment.rows[0]),s.userId]);
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:"payment.created",entityType:"payment",entityId:payment.rows[0].id});
  return payment.rows[0];
 }
 if(!['create_document_atomic','update_document_atomic'].includes(operation))throw new ApiError(400,'invalid_operation','Ungültige Aktion.');
 const invoice=args.p_kind==='invoice';if(!tenantCan(s.role,invoice?'invoices:write':'sales:write'))throw new ApiError(403,'forbidden','Keine Berechtigung.');
 if(invoice){
  const company=(await c.query('select name,legal_name,street,postal_code,city,country_code,iban,qr_iban from organizations where id=$1',[s.organizationId])).rows[0];
  const issue=invoicePaymentIssue(company??{});if(issue)throw new ApiError(409,'invoice_payment_setup_required',issue);
 }
 if(!args.p_number&&operation==='create_document_atomic'){
  const year=String(new Date().getFullYear());
  const sequence=await c.query(`insert into business_document_counters(organization_id,kind,period,next_value) values($1,$2,$3,2) on conflict(organization_id,kind,period) do update set next_value=business_document_counters.next_value+1 returning next_value-1 number`,[s.organizationId,invoice?'invoice':'quote',year]);
  args.p_number=(invoice?'RE-':'AN-')+year+'-'+String(sequence.rows[0].number).padStart(6,'0');
 }
 const table=invoice?'invoices':'quotes',numberColumn=invoice?'invoice_no':'quote_no',lineTable=invoice?'invoice_lines':'quote_lines',parentColumn=invoice?'invoice_id':'quote_id';
 const vat=Number(args.p_vat_rate);if(!Number.isFinite(vat)||vat<0||vat>100)throw new ApiError(400,'vat_invalid','Ungültiger MwSt.-Satz.');
 if(!['CHF','EUR'].includes(String(args.p_currency)))throw new ApiError(400,'currency_invalid','Ungültige Währung.');
 const found=await c.query('select id from customers where id::text=$1 and organization_id=$2 and archived_at is null',[args.p_customer_id,s.organizationId]);
 if(!found.rowCount)throw new ApiError(400,'customer_invalid','Kunde wurde nicht gefunden.');
 let id:string;
 if(operation==='update_document_atomic'){
  const existing=await c.query(`select id,status${invoice?',paid_amount':''} from ${table} where ${numberColumn}=$1 and organization_id=$2 and archived_at is null for update`,[args.p_current_number,s.organizationId]);
  const row=existing.rows[0];if(!row)throw new ApiError(404,'not_found','Dokument wurde nicht gefunden.');
  if((invoice&&Number(row.paid_amount)>0)||['accepted','cancelled'].includes(row.status))throw new ApiError(409,'document_locked','Dieses Dokument kann nicht mehr geändert werden.');id=row.id;
  await c.query(`update ${table} set ${numberColumn}=$1,customer_id=$2,issue_date=$3,${invoice?'due_date':'valid_until'}=$4,note=$5,currency=$6,updated_at=now() where id=$7 and organization_id=$8`,[args.p_number,args.p_customer_id,args.p_issue_date,invoice?args.p_due_date:args.p_valid_until,args.p_note,args.p_currency,id,s.organizationId]);
  await c.query(`delete from ${lineTable} where ${parentColumn}=$1 and organization_id=$2`,[id,s.organizationId]);
 }else{
  id=randomUUID();
  await c.query(`insert into ${table}(id,organization_id,external_id,${numberColumn},customer_id,${invoice?'':'title,'}issue_date,${invoice?'due_date':'valid_until'},status,note,currency,created_by_user_id)
   values($1,$2,$1::uuid::text,$3,$4,${invoice?'':'$3,'}$5,$6,'draft',$7,$8,$9)`,[id,s.organizationId,args.p_number,args.p_customer_id,args.p_issue_date,invoice?args.p_due_date:args.p_valid_until,args.p_note,args.p_currency,s.userId]);
 }
 let position=0;
 for(const raw of args.p_items as Row[]){
  const lineVat=raw.vat_rate===undefined?vat:Number(raw.vat_rate);
  if(!Number.isFinite(lineVat)||lineVat<0||lineVat>100)throw new ApiError(400,'vat_invalid','Ungültiger MwSt.-Satz.');
  await c.query(`insert into ${lineTable}(organization_id,external_id,${parentColumn},sort_order,description,quantity,unit,unit_price,vat_rate) values($1,$2,$3,$4,$5,$6,$7,$8,$9)`,[s.organizationId,randomUUID(),id,++position,raw.description,raw.quantity,String(raw.unit??"Stück").slice(0,40),raw.unit_price,lineVat]);
 }
 if(invoice)await c.query(`update invoices set subtotal=x.subtotal,vat_amount=x.vat,total_amount=x.subtotal+x.vat from (select round(sum(quantity*unit_price),2) subtotal,round(sum(quantity*unit_price*vat_rate/100),2) vat from invoice_lines where invoice_id=$1 and organization_id=$2) x where invoices.id=$1 and invoices.organization_id=$2`,[id,s.organizationId]);
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:operation==='create_document_atomic'?'document.created':'document.updated',entityType:table,entityId:id});
 return (await listApiBusiness(c,s,'documents','id=eq.'+id))[0];
}
