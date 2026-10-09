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
 return {item,contacts,documents,summary,activity};
}
