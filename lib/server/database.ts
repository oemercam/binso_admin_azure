import "server-only";
import { ApiError } from "./http";
import { requireSession } from "./session";
import { withTenant, withPlatform } from "./db";
import { requireOperatorSession } from "./operator/session";
import { tenantCan, type TenantPermission } from "@/lib/permissions";

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
function assertTablePermission(role:string,table:string,action:"read"|"write"){const permission=tablePermissions[table]?.[action];if(permission&&!tenantCan(role,permission))throw new ApiError(403,"forbidden","Keine Berechtigung.");}
const ident=(v:string)=>{if(!/^[a-z_]+$/.test(v)||!names.has(v))throw new ApiError(400,"invalid_table","Ungültige Datenquelle.");return v};
const selectCols=(v:string)=>v==="*"?"*":v.split(",").map(x=>x.trim()).filter(x=>/^[a-z_]+$/.test(x)).join(",")||"*";
export async function currentTenant(){const s=await requireSession();return {user:{id:s.userId,email:s.email},token:"",tenantId:s.organizationId,role:s.role,session:s}}
export async function tenantList<T extends Row>(table:string,select="*",extra=""){const s=await requireSession();assertTablePermission(s.role,table,"read");return withTenant(s.organizationId,s.userId,async c=>(await c.query<T>(`select ${selectCols(select)} from ${ident(table)} where organization_id=$1 order by created_at desc limit 1000`,[s.organizationId])).rows)}
export async function tenantInsert<T extends Row>(table:string,data:T){const s=await requireSession();assertTablePermission(s.role,table,"write");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));const vals=keys.map(k=>data[k]);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`insert into ${ident(table)}(organization_id,${keys.join(",")}) values($1,${keys.map((_,i)=>"$"+(i+2)).join(",")}) returning *`,[s.organizationId,...vals])).rows)}
export async function tenantUpdate<T extends Row>(table:string,id:string,data:T){const s=await requireSession();assertTablePermission(s.role,table,"write");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));const vals=keys.map(k=>data[k]);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update ${ident(table)} set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} and organization_id=$${keys.length+2} returning *`,[...vals,id,s.organizationId])).rows)}
export async function currentCompany(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select * from organizations where id=$1",[s.organizationId])).rows[0])}
export async function updateCompany(data:Row){const s=await requireSession();if(!tenantCan(s.role,"organization:write"))throw new ApiError(403,"forbidden","Nicht erlaubt.");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));const vals=keys.map(k=>data[k]);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update organizations set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} returning *`,[...vals,s.organizationId])).rows)}
export async function currentProfile(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select * from app_users where id=$1",[s.userId])).rows[0]??null)}
export async function updateProfile(data:Row){const s=await requireSession();const map:Row={};if(data.display_name!==undefined)map.display_name=data.display_name;if(data.language!==undefined)map.language=data.language;const keys=Object.keys(map);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update app_users set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} returning *`,[...keys.map(k=>map[k]),s.userId])).rows)}
export async function operatorList<T extends Row>(table:string,select="*",extra=""){await requireOperatorSession();return withPlatform(async c=>(await c.query<T>(`select ${selectCols(select)} from ${ident(table)} order by created_at desc limit 1000`)).rows)}
export async function operatorInsert<T extends Row>(table:string,data:T){await requireOperatorSession();const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));return withPlatform(async c=>(await c.query(`insert into ${ident(table)}(${keys.join(",")}) values(${keys.map((_,i)=>"$"+(i+1)).join(",")}) returning *`,keys.map(k=>data[k]))).rows)}
export async function operatorUpdate<T extends Row>(table:string,filter:string,data:T){await requireOperatorSession();const id=new URLSearchParams(filter).get("id")?.replace(/^eq\./,"");if(!id)throw new ApiError(400,"invalid_filter","Ungültiger Filter.");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));return withPlatform(async c=>(await c.query(`update ${ident(table)} set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} returning *`,[...keys.map(k=>data[k]),id])).rows)}
export async function operatorAudit(action:string,targetType?:string,targetId?:string,metadata:Row={}){const s=await requireOperatorSession();return withPlatform(async c=>(await c.query("insert into platform_audit_logs(actor_user_id,action,target_type,target_id,metadata) values($1,$2,$3,$4,$5::jsonb) returning *",[s.userId,action,targetType??null,targetId??null,JSON.stringify(metadata)])).rows)}
export async function requireTenantFeature(_feature:string){return currentTenant()}
export async function tenantRpc<T>(_fn:string,_args:Row):Promise<T>{throw new ApiError(501,"legacy_rpc_removed","Diese Funktion wird auf Azure PostgreSQL umgestellt.")}
export async function userRpc<T>(_fn:string,_args:Row={}):Promise<T>{throw new ApiError(501,"legacy_rpc_removed","Diese Funktion wird auf Azure PostgreSQL umgestellt.")}
export async function operatorRpc<T>(_fn:string,_args:Row={}):Promise<T>{throw new ApiError(501,"legacy_rpc_removed","Diese Funktion wird auf Azure PostgreSQL umgestellt.")}
