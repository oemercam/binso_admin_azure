import "server-only";
import type {PoolClient} from "pg";
import type {SessionUser} from "../session";
import {tenantCan} from "@/lib/permissions";
import {ApiError} from "../http";
import {listApiBusiness} from "./business-api";
import {financialSummary} from "./financial-summary";
import {customerActivity} from "./customer-activity";

/** Caller provides a tenant-scoped repeatable-read transaction. */
export async function customerWorkspace(c:PoolClient,s:SessionUser,id:string){
 const item=(await listApiBusiness(c,s,'customers','id=eq.'+encodeURIComponent(id)))[0];
 if(!item)throw new ApiError(404,'not_found','Kunde wurde nicht gefunden.');
 const filter='customer_id=eq.'+encodeURIComponent(String(item.id));
 const contacts=await listApiBusiness(c,s,'customer_contacts',filter+'&order=is_primary.desc,created_at.asc');
 const documents=tenantCan(s.role,'invoices:read')||tenantCan(s.role,'sales:read')?await listApiBusiness(c,s,'documents',filter):[];
 const summary=await financialSummary(c,s,String(item.id));
 const activity=await customerActivity(c,s,String(item.id));
 const statistics=tenantCan(s.role,'invoices:read')&&tenantCan(s.role,'payments:read')?(await c.query(`
  select currency,issue_date::text date,sum(total_amount) billed,count(*)::int invoice_count,0::numeric paid
  from invoices where organization_id=$1 and customer_id=$2 and archived_at is null and status not in ('draft','cancelled') group by currency,issue_date
  union all
  select i.currency,p.payment_date::text date,0::numeric billed,0::int invoice_count,sum(p.amount) paid
  from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id
  where p.organization_id=$1 and i.customer_id=$2 and p.archived_at is null and p.allocation_status='matched' group by i.currency,p.payment_date
 `,[s.organizationId,String(item.id)])).rows:null;
 return {item,contacts,documents,summary,activity,statistics};
}
