import "server-only";
import type {PoolClient} from "pg";
import type {SessionUser} from "../session";
import {tenantCan} from "@/lib/permissions";
import {ApiError} from "../http";
import {listApiBusiness} from "./business-api";
import {financialSummary} from "./financial-summary";
import {customerActivity} from "./customer-activity";

/** Caller provides a tenant-scoped repeatable-read transaction. */
export async function customerWorkspace(c:PoolClient,s:SessionUser,id:string,view:'workspace'|'hub'='workspace'){
 const item=(await listApiBusiness(c,s,'customers','id=eq.'+encodeURIComponent(id)))[0];
 if(!item){
  const merged=(await c.query<{merged_into_customer_id:string}>('select merged_into_customer_id from customers where organization_id=$1 and id::text=$2 and merged_into_customer_id is not null',[s.organizationId,id])).rows[0];
  if(merged){
   const target=(await listApiBusiness(c,s,'customers','id=eq.'+encodeURIComponent(merged.merged_into_customer_id)))[0];
   if(target)return {redirectTo:String(target.id)};
  }
  throw new ApiError(404,'not_found','Kunde wurde nicht gefunden.');
 }
 const filter='customer_id=eq.'+encodeURIComponent(String(item.id));
 if(view==='hub'){
  const count=async(table:string,extra='')=>{
   const rows=await listApiBusiness(c,s,table,filter+extra+'&limit=1');
   const total=rows.length?Number(rows[0].total_count):0;
   return Number.isSafeInteger(total)&&total>=0?total:null;
  };
  const canFiles=tenantCan(s.role,'documents:read');
  const counts={
   projects:tenantCan(s.role,'projects:read')?await count('projects'):null,
   offers:tenantCan(s.role,'sales:read')?await count('documents','&kind=offer'):null,
   invoices:tenantCan(s.role,'invoices:read')?await count('documents','&kind=invoice'):null,
   payments:tenantCan(s.role,'payments:read')?await count('payments'):null,
   contacts:await count('customer_contacts'),
   files:canFiles?Number((await c.query<{count:string}>("select count(*) from file_objects where organization_id=$1 and customer_id=$2 and purpose='customer_document' and archived_at is null",[s.organizationId,String(item.id)])).rows[0].count):null,
  };
  return {item,counts,capabilities:{invoices:tenantCan(s.role,'invoices:read'),offers:tenantCan(s.role,'sales:read'),files:canFiles}};
 }
 const contacts=await listApiBusiness(c,s,'customer_contacts',filter+'&order=is_primary.desc,created_at.asc');
 const documents=tenantCan(s.role,'invoices:read')||tenantCan(s.role,'sales:read')?await listApiBusiness(c,s,'documents',filter):[];
 const openInvoices=tenantCan(s.role,'invoices:read')?await listApiBusiness(c,s,'documents',filter+'&kind=invoice&display_status=eq.open&order=due_date.asc&limit=4'):[];
 const summary=await financialSummary(c,s,String(item.id),true);
 const activity=await customerActivity(c,s,String(item.id));
 const projects=tenantCan(s.role,'projects:read')?await listApiBusiness(c,s,'projects',filter+'&limit=5&order=created_at.desc'):null;
 const payments=tenantCan(s.role,'payments:read')?await listApiBusiness(c,s,'payments',filter+'&limit=5&order=paid_on.desc'):null;
 const statistics=tenantCan(s.role,'invoices:read')&&tenantCan(s.role,'payments:read')?(await c.query(`
  select currency,issue_date::text date,0::numeric billed,count(*)::int invoice_count,0::numeric paid
  from invoices where organization_id=$1 and customer_id=$2 and archived_at is null and status not in ('draft','cancelled') and issue_date<=(now() at time zone 'Europe/Zurich')::date group by currency,issue_date
  union all
  select i.currency,p.payment_date::text date,0::numeric billed,0::int invoice_count,sum(p.amount) paid
  from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id
  where p.organization_id=$1 and i.customer_id=$2 and p.archived_at is null and p.allocation_status='matched' and p.payment_date<=(now() at time zone 'Europe/Zurich')::date group by i.currency,p.payment_date
  union all
  select i.currency,r.refund_date::text date,0::numeric billed,0::int invoice_count,-sum(r.amount) paid
  from invoice_refunds r join invoices i on i.id=r.invoice_id and i.organization_id=r.organization_id
  where r.organization_id=$1 and i.customer_id=$2 and r.refund_date<=(now() at time zone 'Europe/Zurich')::date group by i.currency,r.refund_date
 `,[s.organizationId,String(item.id)])).rows.concat(summary.invoices.flatMap(row=>(row.revenue_events??[]).map((event:{date:string;amount:unknown})=>({currency:row.currency,date:event.date,billed:event.amount,invoice_count:0,paid:0})))):null;
 return {item,contacts,documents,openInvoices,summary,activity,statistics,projects,payments,capabilities:{invoices:tenantCan(s.role,'invoices:read'),offers:tenantCan(s.role,'sales:read')}};
}
