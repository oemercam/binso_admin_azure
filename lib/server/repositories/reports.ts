import 'server-only';
import type {PoolClient} from 'pg';
import {tenantCan,ownRecordOnly} from '@/lib/permissions';
import {planAllowsModule,type PlanId} from '@/config/plan-access';
import {authorize} from '@/lib/server/rbac';
import type {SessionUser} from '@/lib/server/session';
import type {ReportSummary,TimeReport} from '@/lib/report-export';
import {timeWorkspace} from './time-workspace';
import {financialMetricsData} from './finance';
import {sumMoney} from '@/lib/money';
import {ApiError} from '@/lib/server/http';
import {businessDate} from '@/lib/financial-status';
import {offerTotalSql,offerStatusSql} from '../document-amount-sql';

/** Reuse the live list authorization/filter owner, then explicitly remove private
 * rates, review notes, identities and provenance before any export/preview. */
export async function timeReport(c:PoolClient,s:SessionUser,period:{from:string;to:string},plan:PlanId,filters:URLSearchParams):Promise<TimeReport>{
 authorize(s,'reports:read');authorize(s,'time:read');
 if(!planAllowsModule(plan,'zeiterfassung'))throw new ApiError(403,'module_unavailable','Dieses Modul ist in deinem Tarif nicht verfügbar.');
 const groupBy=filters.get('groupBy')??'detail';if(!['detail','customer','project','employee'].includes(groupBy))throw new ApiError(400,'invalid_report_group','Ungültige Gruppierung.');
 const params=new URLSearchParams({from:period.from,to:period.to,limit:'500'});
 for(const key of ['customerId','projectId','employeeId','status','q'])if(filters.has(key))params.set(key,filters.get(key)!);
 const result=await timeWorkspace(c,s,params);
 if(result.total>500)throw new ApiError(400,'report_too_large','Bitte den Zeitraum oder die Filter weiter eingrenzen.');
 const items=result.items.map(item=>({date:String(item.started_at),customer:String(item.customer_name??''),project:String(item.project_name??''),employee:String(item.employee_name??''),activity:String(item.description??''),minutes:Number(item.duration_minutes),billable:item.billable===true}));
 // Group by entity identity, never by equal display names of different customers.
 const groups=new Map<string,{label:string;minutes:number;entries:number}>();
 if(groupBy!=='detail')result.items.forEach((row,index)=>{const column=groupBy==='customer'?'customer_id':groupBy==='project'?'project_id':'employee_id';const key=String(row[column]??(groupBy==='employee'?row.created_by_user_id:groupBy==='project'?row.project_name:'')??'');const item=items[index],previous=groups.get(key)??{label:item[groupBy as 'customer'|'project'|'employee']||'—',minutes:0,entries:0};previous.minutes+=item.minutes;previous.entries++;groups.set(key,previous);});
 return {kind:'time',period,asOf:new Date().toISOString(),totalMinutes:result.total_minutes,groupBy:groupBy as TimeReport['groupBy'],groups:[...groups.values()],items};
}
export async function reportSummary(c:PoolClient,s:SessionUser,period:{from:string;to:string},plan:PlanId):Promise<ReportSummary>{
 authorize(s,'reports:read');
 const args=[s.organizationId,period.from,period.to];
 const customers=tenantCan(s.role,'customers:read')&&planAllowsModule(plan,'kunden')?(await c.query(`select count(*)::text total,count(*) filter(where (created_at at time zone 'Europe/Zurich')::date between $2::date and $3::date)::text added from customers where organization_id=$1 and archived_at is null`,args)).rows[0]:null;
 const projects=tenantCan(s.role,'projects:read')&&planAllowsModule(plan,'projekte')?(await c.query(`select status,count(*)::text count from projects where organization_id=$1 and archived_at is null group by status order by status`,[s.organizationId])).rows:null;
 const time=tenantCan(s.role,'time:read')&&planAllowsModule(plan,'zeiterfassung')?(await c.query(`select coalesce(sum(hours),0)::text hours,coalesce(sum(hours) filter(where billable),0)::text billable_hours,coalesce(sum(hours) filter(where invoiced_invoice_id is not null),0)::text invoiced_hours from time_entries where organization_id=$1 and archived_at is null and work_date between $2::date and $3::date and ($4::boolean=false or created_by_user_id=$5)`,[...args,ownRecordOnly(s.role,'zeiterfassung'),s.userId])).rows[0]:null;
 const payments=tenantCan(s.role,'payments:read')&&planAllowsModule(plan,'zahlungen')?(await c.query(`with movements as (
  select i.currency,p.amount incoming,0::numeric refunded from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and p.payment_date between $2::date and $3::date and p.payment_date<=(now() at time zone 'Europe/Zurich')::date
  union all select i.currency,0::numeric incoming,r.amount refunded from invoice_refunds r join invoices i on i.id=r.invoice_id and i.organization_id=r.organization_id where r.organization_id=$1 and r.refund_date between $2::date and $3::date and r.refund_date<=(now() at time zone 'Europe/Zurich')::date
 ) select currency,sum(incoming)::text amount,sum(refunded)::text refund_amount,sum(incoming-refunded)::text net_amount from movements group by currency order by currency`,args)).rows:null;
 const expenses=tenantCan(s.role,'expenses:read')&&planAllowsModule(plan,'spesen')?(await c.query(`select reimbursement_currency currency,sum(reimbursement_amount)::text amount from expenses where organization_id=$1 and archived_at is null and status in ('approved','posted') and reimbursed_at is not null and reimbursement_paid_on between $2::date and $3::date and reimbursement_amount is not null and reimbursement_currency is not null group by reimbursement_currency order by reimbursement_currency`,args)).rows:null;
 const expenseCashIncomplete=expenses!==null&&!!(await c.query('select 1 from expenses where organization_id=$1 and archived_at is null and reimbursed_at is not null and (reimbursement_paid_on is null or reimbursement_amount is null or reimbursement_currency is null) limit 1',[s.organizationId])).rowCount;
 const employees=tenantCan(s.role,'employees:read')&&planAllowsModule(plan,'personal')?(await c.query(`select count(*)::text total,count(*) filter(where active)::text active from employees where organization_id=$1 and archived_at is null`,[s.organizationId])).rows[0]:null;
 let offers:ReportSummary['offers']=null;
 if(tenantCan(s.role,'sales:read')&&planAllowsModule(plan,'offerten')){
  offers=(await c.query(`with scoped as(select q.currency,${offerStatusSql('q','$4')} status,${offerTotalSql('q')} gross from quotes q where q.organization_id=$1 and q.archived_at is null and q.issue_date between $2::date and $3::date and q.issue_date<=$4::date) select currency,status,count(*)::text count,sum(gross)::text volume from scoped group by currency,status order by currency,status limit 201`,[...args,businessDate()])).rows;
  if(offers.length>200)throw new ApiError(400,'report_too_large','Bitte den Zeitraum oder die Filter weiter eingrenzen.');
 }
 // Recognized expenses use their expense date, not the reimbursement cash date.
 // Keep currencies separate and export categories only, never staff/receipt data.
 let expenseCategories:ReportSummary['expenseCategories']=null;
 if(tenantCan(s.role,'expenses:read')&&planAllowsModule(plan,'spesen')){
  expenseCategories=(await c.query(`select currency,coalesce(nullif(category_label,''),nullif(category,''),'—') category,sum(quantity*unit_price)::text amount from expenses where organization_id=$1 and archived_at is null and status in ('approved','posted') and expense_date between $2::date and $3::date and expense_date<=(now() at time zone 'Europe/Zurich')::date group by currency,coalesce(nullif(category_label,''),nullif(category,''),'—') order by currency,category limit 201`,args)).rows;
  if(expenseCategories.length>200)throw new ApiError(400,'report_too_large','Bitte den Zeitraum oder die Filter weiter eingrenzen.');
 }
 // Reuse issue/credit dates and settlement definitions from live finance charts.
 // Period volume and the current outstanding snapshot are different measures.
 let invoices:ReportSummary['invoices']=null;
 if(tenantCan(s.role,'invoices:read')&&planAllowsModule(plan,'rechnungen')){
  invoices=[];
  const currencies=(await c.query(`select distinct currency from invoices where organization_id=$1 and archived_at is null and status not in ('draft','cancelled') and issue_date<=(now() at time zone 'Europe/Zurich')::date order by currency`,[s.organizationId])).rows;
  for(const row of currencies){
   const currency=String(row.currency),metrics=await financialMetricsData(c,s.organizationId,{currency});
   invoices.push({currency,invoiced:sumMoney(metrics.revenueEvents.filter(event=>String(event.date)>=period.from&&String(event.date)<=period.to).map(event=>event.amount)).toFixed(2),open:String(metrics.snapshot.open),overdue:String(metrics.snapshot.overdue),asOf:String(metrics.snapshot.as_of)});
  }
 }
 let vat:ReportSummary['vat']=null;
 if(tenantCan(s.role,'vat:read')&&planAllowsModule(plan,'mwst')){
  // Read recorded issued amounts, including archived issued documents. Never
  // invent a tax allocation from gross-only credit notes or expense amounts.
  vat=(await c.query(`with events as (
   select i.currency,1::numeric invoice_count,i.subtotal net,i.vat_amount vat,i.total_amount gross,0::numeric credit_count,0::numeric credit_gross
   from invoices i where i.organization_id=$1 and i.status not in ('draft','cancelled') and i.issue_date between $2::date and $3::date and i.issue_date<=$4::date
   union all select i.currency,0,0,0,0,1,n.amount from credit_notes n join invoices i on i.id=n.invoice_id and i.organization_id=n.organization_id where n.organization_id=$1 and n.credit_date between $2::date and $3::date and n.credit_date<=$4::date
  ) select currency,sum(invoice_count)::text "invoiceCount",sum(net)::text "netBeforeCredits",sum(vat)::text "vatBeforeCredits",sum(gross)::text "grossBeforeCredits",sum(credit_count)::text "unallocatedCreditCount",sum(credit_gross)::text "unallocatedCreditGross" from events group by currency order by currency limit 201`,[...args,businessDate()])).rows;
  if(vat.length>200)throw new ApiError(400,'report_too_large','Bitte den Zeitraum oder die Filter weiter eingrenzen.');
 }
 return {...(expenseCashIncomplete?{expenseCashIncomplete:true}:{}),period,asOf:new Date().toISOString(),customers,projects,time,payments,expenses,expenseCategories,employees,invoices,offers,vat} as ReportSummary;
}
