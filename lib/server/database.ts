import "server-only";
import {createHash} from "node:crypto";
import {listOperatorBusiness,insertOperatorBusiness,updateOperatorBusiness} from "./repositories/operator-api";
import {platformAudit} from "./operator/audit";
import { canonicalApiTables, listApiBusiness, translateBusinessWrite, mutateApiBusiness } from "./repositories/business-api";
import { ownRecordOnly } from "@/lib/permissions";
import { audit } from "./audit";
import {requireModuleEntitlement} from "./plan-access";
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
const featureModules:Record<string,string>={customers:'kunden',customer_contacts:'kunden',employees:'personal',expenses:'spesen',payments:'zahlungen',products:'produkte',time_entries:'zeiterfassung'};
async function assertTablePermission(session:SessionUser,table:string,action:"read"|"write"){const permission=tablePermissions[table]?.[action];if(permission)authorize(session,permission);const moduleKey=featureModules[table];if(moduleKey)await requireModuleEntitlement(session.organizationId,moduleKey);}
const ident=(v:string)=>{if(!/^[a-z_]+$/.test(v)||!names.has(v))throw new ApiError(400,"invalid_table","Ungültige Datenquelle.");return v};
const selectCols=(v:string)=>v==="*"?"*":v.split(",").map(x=>x.trim()).filter(x=>/^[a-z_]+$/.test(x)).join(",")||"*";
export async function currentTenant(){const s=await requireSession();return {user:{id:s.userId,email:s.email},token:"",tenantId:s.organizationId,role:s.role,session:s}}
export async function tenantList<T extends Row>(table:string,select="*",extra=""){const s=await requireSession();await assertTablePermission(s,table,"read");if(canonicalApiTables.has(table))return withTenant(s.organizationId,s.userId,async c=>await listApiBusiness(c,s,table,extra) as T[]);return withTenant(s.organizationId,s.userId,async c=>(await c.query<T>(`select ${selectCols(select)} from ${ident(table)} where organization_id=$1 order by created_at desc limit 1000`,[s.organizationId])).rows)}
/** Canonical list endpoints share query forwarding and authorized population counts. */
export async function tenantListPage(table:string,params:URLSearchParams,defaultOrder="created_at.desc",equalFilters:Record<string,string>={}){
 const filters=new URLSearchParams({order:defaultOrder});
 for(const key of ['q','order','limit','offset']){const value=params.get(key);if(value)filters.set(key,value)}
 for(const key of ['status',...(table==='products'||table==='documents'?['kind']:[])]){const value=params.get(key);if(value)filters.set(key,'eq.'+value)}
 for(const [key,value] of Object.entries(equalFilters))if(value)filters.set(key,'eq.'+value);
 const items=await tenantList(table,'*',filters.toString());
 let total=Number(items[0]?.total_count??0);
 if(!items.length&&Number(filters.get('offset')??0)>0){filters.set('offset','0');filters.set('limit','1');const first=await tenantList(table,'*',filters.toString());total=Number(first[0]?.total_count??0)}
 return {items,total};
}
export async function tenantInsert<T extends Row>(table:string,data:T,requestKey?:string){
 const s=await requireSession();await assertTablePermission(s,table,"write");
 const translated=translateBusinessWrite(table,data,true);const fields:Row={...translated.data,...(table==="customer_contacts"?{}:{created_by_user_id:s.userId})};
 return withTenant(s.organizationId,s.userId,async c=>{
 const requestData={...translated.data};delete requestData.external_id;
 const requestHash=createHash('sha256').update(JSON.stringify({userId:s.userId,data:requestData})).digest('hex');
 if(table==='expenses'&&requestKey){
  await c.query('select pg_advisory_xact_lock(hashtext($1))',[s.organizationId+':expense:'+requestKey]);
  const previous=(await c.query("select request_hash,response_json from business_idempotency_keys where organization_id=$1 and operation='expense.create' and idempotency_key=$2",[s.organizationId,requestKey])).rows[0];
  if(previous){if(previous.request_hash!==requestHash)throw new ApiError(409,'idempotency_conflict','Die Anfragekennung wurde für andere Spesen verwendet.');return previous.response_json;}
 }
 if(table==='expenses'){
  if(ownRecordOnly(s.role,'spesen')){
   const employee=(await c.query("select id from employees where organization_id=$1 and lower(email)=lower($2) and archived_at is null",[s.organizationId,s.email])).rows[0];
   if(fields.employee_id&&fields.employee_id!==employee?.id)throw new ApiError(403,"employee_mismatch","Du kannst nur eigene Spesen einreichen.");
   fields.employee_id=employee?.id??null;
  }
  if(['approved','rejected'].includes(String(fields.status))){if(!['owner','admin','project_manager','manager'].includes(s.role))throw new ApiError(403,'approval_forbidden','Keine Berechtigung zur Freigabe.');throw new ApiError(409,'submission_required','Die Spese muss zuerst eingereicht und anschließend geprüft werden.');}
 }
 const keys=Object.keys(fields);const result=(await c.query(`insert into ${translated.target}(organization_id,${keys.join(',')}) values($1,${keys.map((_,i)=>'$'+(i+2)).join(',')}) returning id`,[s.organizationId,...Object.values(fields)])).rows;
 if(table==='expenses'){
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'expense.created',entityType:'expenses',entityId:String(result[0].id),metadata:{status:fields.status}});
  if(requestKey)await c.query("insert into business_idempotency_keys(organization_id,operation,idempotency_key,request_hash,response_json,created_by_user_id) values($1,'expense.create',$2,$3,$4::jsonb,$5)",[s.organizationId,requestKey,requestHash,JSON.stringify(result),s.userId]);
 }
 return result;});
}
export async function tenantUpdate<T extends Row>(table:string,id:string,data:T){
 const s=await requireSession();await assertTablePermission(s,table,"write");
 const translated=translateBusinessWrite(table,data,false);const keys=Object.keys(translated.data);
 const own=table==='expenses'&&ownRecordOnly(s.role,'spesen');
 return withTenant(s.organizationId,s.userId,async c=>{
 if(table==='expenses'){
  const current=(await c.query("select * from expenses where organization_id=$1 and id::text=$2 and archived_at is null for update",[s.organizationId,id])).rows[0];
  if(!current||(own&&current.created_by_user_id!==s.userId))return [];
  if(['approved','posted'].includes(current.status)||current.invoiced_invoice_id||current.reimbursed_at)throw new ApiError(409,"expense_locked","Genehmigte, erstattete oder verrechnete Spesen können nicht geändert werden.");
  if(own){const employee=(await c.query("select id from employees where organization_id=$1 and lower(email)=lower($2) and archived_at is null",[s.organizationId,s.email])).rows[0];if(data.employee_id&&data.employee_id!==employee?.id)throw new ApiError(403,"employee_mismatch","Du kannst nur eigene Spesen einreichen.");}
  const next=String(data.status??current.status);
  if(['approved','rejected'].includes(next)){
   if(!['owner','admin','project_manager','manager'].includes(s.role))throw new ApiError(403,"approval_forbidden","Keine Berechtigung zur Freigabe.");
   if(current.status!=='submitted')throw new ApiError(409,"submission_required","Die Spese muss zuerst eingereicht werden.");
   if(current.created_by_user_id===s.userId&&!['owner','admin'].includes(s.role))throw new ApiError(403,"self_approval_forbidden","Eigene Spesen müssen durch eine andere berechtigte Person geprüft werden.");
   await c.query("update expenses set reviewed_at=now(),reviewed_by_user_id=$3 where organization_id=$1 and id=$2",[s.organizationId,current.id,s.userId]);
  }
  await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'expense.updated',entityType:'expenses',entityId:current.id,metadata:{previous:current.status,status:next}});
 }
 return (await c.query(`update ${translated.target} set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')},updated_at=now() where id::text=$${keys.length+1} and organization_id=$${keys.length+2}${own?` and created_by_user_id=$${keys.length+3}`:''} returning id`,[...Object.values(translated.data),id,s.organizationId,...(own?[s.userId]:[])])).rows;});
}
export async function currentCompany(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select * from organizations where id=$1",[s.organizationId])).rows[0])}
export async function updateCompany(data:Row){const s=await requireSession();authorize(s,"organization:write");const keys=Object.keys(data).filter(k=>/^[a-z_]+$/.test(k));const vals=keys.map(k=>data[k]);return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update organizations set ${keys.map((k,i)=>k+"=$"+(i+1)).join(",")},updated_at=now() where id=$${keys.length+1} returning *`,[...vals,s.organizationId])).rows)}
export async function currentProfile(){const s=await requireSession();return withTenant(s.organizationId,s.userId,async c=>(await c.query("select id,email,display_name,first_name,last_name,phone,job_title,language,theme,avatar_url from app_users where id=$1",[s.userId])).rows[0]??null)}
export async function updateProfile(data:Row){
 const s=await requireSession();const map:Row={};
 for(const key of ['display_name','first_name','last_name','phone','job_title'])if(data[key]!==undefined)map[key]=data[key];
 if(data.language!==undefined){const language=String(data.language).split('-')[0];if(!['de','fr','it','en','tr'].includes(language))throw new ApiError(400,'language_invalid','Ungültige Sprache.');map.language=language;}
 if(data.theme!==undefined){if(!['light','dark','system'].includes(String(data.theme)))throw new ApiError(400,'theme_invalid','Ungültige Darstellung.');map.theme=data.theme;}
 const keys=Object.keys(map);if(!keys.length)throw new ApiError(400,"empty_update","Keine Änderungen angegeben.");
 return withTenant(s.organizationId,s.userId,async c=>(await c.query(`update app_users set ${keys.map((k,i)=>k+'=$'+(i+1)).join(',')},updated_at=now() where id=$${keys.length+1} returning id,email,display_name,first_name,last_name,phone,job_title,language,theme`,[...keys.map(k=>map[k]),s.userId])).rows);
}
export async function operatorList<T extends Row>(table:string,_select="*",extra=""){const s=await requireOperatorSession();return withPlatform(async c=>await listOperatorBusiness(c,s,table,extra) as T[])}
export async function operatorInsert<T extends Row>(table:string,data:T){const s=await requireOperatorSession();return withPlatform(c=>insertOperatorBusiness(c,s,table,data))}
export async function operatorUpdate<T extends Row>(table:string,filter:string,data:T){const s=await requireOperatorSession();return withPlatform(c=>updateOperatorBusiness(c,s,table,filter,data))}
export async function operatorAudit(action:string,targetType?:string,targetId?:string,metadata:Row={}){const s=await requireOperatorSession();await platformAudit({userId:s.userId,userEmail:s.email,action,entityType:targetType??"platform",entityId:targetId,metadata})}
export async function requireTenantFeature(feature:string){const tenant=await currentTenant();const moduleKey=featureModules[feature];if(moduleKey)await requireModuleEntitlement(tenant.tenantId,moduleKey);return tenant}
export async function tenantRpc<T>(operation:string,args:Row):Promise<T>{const s=await requireSession();if(s.organizationStatus==="read_only")throw new ApiError(403,"read_only","Der Mandant ist schreibgeschützt.");if(args.p_kind)await requireModuleEntitlement(s.organizationId,args.p_kind==='invoice'?'rechnungen':'offerten');return withTenant(s.organizationId,s.userId,async c=>await mutateApiBusiness(c,s,operation,args) as T)}
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
