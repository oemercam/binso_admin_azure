import "server-only";
import {listOperatorBusiness,insertOperatorBusiness,updateOperatorBusiness} from "./repositories/operator-api";
import {platformAudit} from "./operator/audit";
import { canonicalApiTables, listApiBusiness, translateBusinessWrite, mutateApiBusiness } from "./repositories/business-api";
import { ownRecordOnly } from "@/lib/permissions";
import { ApiError } from "./http";
import { authorize } from "./rbac";
import { requireSession, type SessionUser } from "./session";
import { withTenant, withPlatform } from "./db";
import { requireOperatorSession } from "./operator/session";
import { type TenantPermission } from "@/lib/permissions";

type Row=Record<string,unknown>;
const names=new Set(["customers","customer_contacts","documents","document_items","employees","expenses","notifications","payments","products","profiles","tenant_accounts","tenant_memberships","support_tickets","support_messages","time_entries"]);
const tablePermissions:Record<string,{read:TenantPermission;write:TenantPermission}>={
 customers:{read:"customers:read",write:"customers:write"},customer_contacts:{read:"customers:read",write:"customers:write"},
 documents:{read:"documents:read",write:"documents:write"},document_items:{read:"documents:read",write:"documents:write"},
 employees:{read:"employees:read",write:"employees:write"},expenses:{read:"expenses:read",write:"expenses:write"},
 payments:{read:"payments:read",write:"payments:write"},products:{read:"masterdata:read",write:"masterdata:write"},
 tenant_accounts:{read:"billing:read",write:"billing:write"},tenant_memberships:{read:"users:read",write:"users:manage"},
 support_tickets:{read:"support:read",write:"support:write"},support_messages:{read:"support:read",write:"support:write"},
 time_entries:{read:"time:read",write:"time:write"},
 notifications:{read:"organization:read",write:"organization:read"},profiles:{read:"organization:read",write:"organization:read"}
};
function assertTablePermission(session:SessionUser,table:string,action:"read"|"write"){const permission=tablePermissions[table]?.[action];if(permission)authorize(session,permission);}
const ident=(v:string)=>{if(!/^[a-z_]+$/.test(v)||!names.has(v))throw new ApiError(400,"invalid_table","Ungültige Datenquelle.");return v};
const selectCols=(v:string)=>v==="*"?"*":v.split(",").map(x=>x.trim()).filter(x=>/^[a-z_]+$/.test(x)).join(",")||"*";
export async function currentTenant(){const s=await requireSession();return {user:{id:s.userId,email:s.email},token:"",tenantId:s.organizationId,role:s.role,session:s}}
export async function tenantList<T extends Row>(table:string,select="*",extra=""){const s=await requireSession();assertTablePermission(s,table,"read");if(canonicalApiTables.has(table))return withTenant(s.organizationId,s.userId,async c=>await listApiBusiness(c,s,table,extra) as T[]);return withTenant(s.organizationId,s.userId,async c=>(await c.query<T>(`select ${selectCols(select)} from ${ident(table)} where organization_id=$1 order by created_at desc limit 1000`,[s.organizationId])).rows)}
export async function tenantInsert<T extends Row>(table:string,data:T){
 const s=await requireSession();assertTablePermission(s,table,"write");
 const translated=translateBusinessWrite(table,data,true);const fields={...translated.data,...(table==="customer_contacts"?{}:{created_by_user_id:s.userId})};
 return withTenant(s.organizationId,s.userId,async c=>{const keys=Object.keys(fields);return (await c.query(`insert into ${translated.target}(organization_id,${keys.join(',')}) values($1,${keys.map((_,i)=>'$'+(i+2)).join(',')}) returning id`,[s.organizationId,...Object.values(fields)])).rows});
}
export async function tenantUpdate<T extends Row>(table:string,id:string,data:T){
 const s=await requireSession();assertTablePermission(s,table,"write");
 const translated=translateBusinessWrite(table,data,false);const keys=Object.keys(translated.data);
 const own=table==='expenses'&&ownRecordOnly(s.role,'spesen');
 return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update ${translated.target} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')},updated_at=now() where id::text=$${keys.length+1} and organization_id=$${keys.length+2}${own?` and created_by_user_id=$${keys.length+3}`:''} returning id`,[...Object.values(translated.data),id,s.organizationId,...(own?[s.userId]:[])])).rows);
}
export async function currentCompany(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select * from organizations where id=$1",[s.organizationId])).rows[0])}
export async function updateCompany(data:Row){const s=await requireSession();authorize(s,"organization:write");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));const vals=keys.map(k=>data[k]);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update organizations set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} returning *`,[...vals,s.organizationId])).rows)}
export async function currentProfile(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select id,email,display_name,first_name,last_name,phone,job_title,language,theme from app_users where id=$1",[s.userId])).rows[0]??null)}
export async function updateProfile(data:Row){
 const s=await requireSession();const map:Row={};
 for(const key of ['display_name','first_name','last_name','phone','job_title'])if(data[key]!==undefined)map[key]=data[key];
 if(data.language!==undefined){const language=String(data.language).split('-')[0];if(!['de','fr','it','en','tr'].includes(language))throw new ApiError(400,'language_invalid','Ungültige Sprache.');map.language=language;}
 const keys=Object.keys(map);
 return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update app_users set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')},updated_at=now() where id=$${keys.length+1} returning id,email,display_name,first_name,last_name,phone,job_title,language,theme`,[...keys.map(k=>map[k]),s.userId])).rows);
}
export async function operatorList<T extends Row>(table:string,_select="*",extra=""){const s=await requireOperatorSession();return withPlatform(async c=>await listOperatorBusiness(c,s,table,extra) as T[])}
export async function operatorInsert<T extends Row>(table:string,data:T){const s=await requireOperatorSession();return withPlatform(c=>insertOperatorBusiness(c,s,table,data))}
export async function operatorUpdate<T extends Row>(table:string,filter:string,data:T){const s=await requireOperatorSession();return withPlatform(c=>updateOperatorBusiness(c,s,table,filter,data))}
export async function operatorAudit(action:string,targetType?:string,targetId?:string,metadata:Row={}){const s=await requireOperatorSession();await platformAudit({userId:s.userId,userEmail:s.email,action,entityType:targetType??"platform",entityId:targetId,metadata})}
export async function requireTenantFeature(_feature:string){return currentTenant()}
export async function tenantRpc<T>(operation:string,args:Row):Promise<T>{const s=await requireSession();if(s.organizationStatus==="read_only")throw new ApiError(403,"read_only","Der Mandant ist schreibgeschützt.");return withTenant(s.organizationId,s.userId,async c=>await mutateApiBusiness(c,s,operation,args) as T)}
export async function userRpc<T>(_fn:string,_args:Row={}):Promise<T>{throw new ApiError(501,"legacy_rpc_removed","Diese Funktion wird auf Azure PostgreSQL umgestellt.")}
export async function operatorRpc<T>(operation:string,args:Row={}):Promise<T>{
 const s=await requireOperatorSession();if(operation!=="operator_customer_overview")throw new ApiError(400,"invalid_operation","Ungültige Aktion.");
 return withPlatform(async c=>{
  const filter="id=eq."+encodeURIComponent(String(args.p_tenant_id));
  const tenant=(await listOperatorBusiness(c,s,"tenants",filter))[0];
  if(!tenant)throw new ApiError(404,"not_found","Kunde wurde nicht gefunden.");
  const users=await c.query("select count(*)::int n from organization_memberships where organization_id=$1 and status='active'",[tenant.id]);
  return {tenant,account:tenant.account,users:users.rows[0].n} as T;
 });
}
