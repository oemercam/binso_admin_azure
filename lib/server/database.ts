import { ApiError } from "./http";
import { getBackendEnv } from "./env";
import { requireUser } from "./auth";

type DbMethod="GET"|"POST"|"PATCH"|"DELETE";

function headers(token:string,prefer?:string){
  const {supabaseAnonKey}=getBackendEnv();
  return {
    apikey:supabaseAnonKey,
    Authorization:"Bearer " + token,
    "Content-Type":"application/json",
    ...(prefer?{Prefer:prefer}:{}),
  };
}

async function requestDb<T>(path:string,method:DbMethod,token:string,body?:unknown,prefer?:string):Promise<T>{
  const {supabaseUrl}=getBackendEnv();
  const response=await fetch(supabaseUrl + "/rest/v1/" + path,{
    method,
    headers:headers(token,prefer),
    body:body===undefined?undefined:JSON.stringify(body),
    cache:"no-store",
  });
  if(!response.ok){
    const payload=await response.json().catch(()=>({}));
    console.error("Database request failed",response.status,typeof payload?.code==="string"?payload.code:"unknown");
    throw new ApiError(response.status===403?403:400,"database_error","Daten konnten nicht verarbeitet werden.");
  }
  if(response.status===204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function currentTenant(){
  const {user,token}=await requireUser();
  const memberships=await requestDb<Array<{tenant_id:string;role:string}>>(
    "tenant_memberships?select=tenant_id,role&user_id=eq." + encodeURIComponent(user.id) + "&limit=1",
    "GET",token
  );
  const membership=memberships[0];
  if(!membership) throw new ApiError(403,"tenant_missing","Kein Firmenzugriff vorhanden.");
  return {user,token,tenantId:membership.tenant_id,role:membership.role};
}

export async function tenantList<T>(table:string,select="*",extra=""){
  const {token,tenantId}=await currentTenant();
  const suffix=extra?"&"+extra:"";
  return requestDb<T[]>(table+"?select="+encodeURIComponent(select)+"&tenant_id=eq."+tenantId+suffix,"GET",token);
}

export async function tenantInsert<T extends Record<string,unknown>>(table:string,data:T){
  const {token,tenantId}=await currentTenant();
  return requestDb<Array<T&{id:string}>>(table,"POST",token,{...data,tenant_id:tenantId},"return=representation");
}

export async function tenantUpdate<T extends Record<string,unknown>>(table:string,id:string,data:T){
  const {token,tenantId}=await currentTenant();
  return requestDb<Array<T&{id:string}>>(table+"?id=eq."+encodeURIComponent(id)+"&tenant_id=eq."+tenantId,"PATCH",token,data,"return=representation");
}


export async function tenantRpc<T>(fn:string,args:Record<string,unknown>){
  const {token,tenantId}=await currentTenant();
  return requestDb<T>("rpc/"+fn,"POST",token,{...args,p_tenant_id:tenantId});
}

export async function userRpc<T>(fn:string,args:Record<string,unknown>={}){
  const {token}=await currentTenant();
  return requestDb<T>("rpc/"+fn,"POST",token,args);
}


export async function currentCompany(){
  const {token,tenantId}=await currentTenant();
  const rows=await requestDb<Array<Record<string,unknown>>>(
    "tenants?select=id,name,uid,street,postal_code,city,email,phone,vat_rate,payment_terms_days&" +
    "id=eq." + tenantId + "&limit=1",
    "GET",token
  );
  if(!rows[0]) throw new ApiError(404,"company_not_found","Firma wurde nicht gefunden.");
  return rows[0];
}

export async function updateCompany(data:Record<string,unknown>){
  const {token,tenantId}=await currentTenant();
  return requestDb<Array<Record<string,unknown>>>(
    "tenants?id=eq." + tenantId,
    "PATCH",token,data,"return=representation"
  );
}

export async function currentProfile(){
  const {user,token}=await requireUser();
  const rows=await requestDb<Array<Record<string,unknown>>>(
    "profiles?select=user_id,display_name,first_name,last_name,phone,job_title,language&user_id=eq." + encodeURIComponent(user.id) + "&limit=1",
    "GET",token
  );
  return rows[0] ?? null;
}

export async function updateProfile(data:Record<string,unknown>){
  const {user,token}=await requireUser();
  return requestDb<Array<Record<string,unknown>>>(
    "profiles?user_id=eq." + encodeURIComponent(user.id),
    "PATCH",token,data,"return=representation"
  );
}


export async function operatorList<T>(table:string,select="*",extra=""){
  const {token}=await import("./operator").then(module=>module.requireOperatorSession());
  const suffix=extra?"&"+extra:"";
  return requestDb<T[]>(table+"?select="+encodeURIComponent(select)+suffix,"GET",token);
}

export async function operatorInsert<T extends Record<string,unknown>>(table:string,data:T){
  const {token}=await import("./operator").then(module=>module.requireOperatorSession());
  return requestDb<Array<T&{id:string}>>(table,"POST",token,data,"return=representation");
}

export async function operatorUpdate<T extends Record<string,unknown>>(table:string,filter:string,data:T){
  const {token}=await import("./operator").then(module=>module.requireOperatorSession());
  return requestDb<Array<T>>(table+"?"+filter,"PATCH",token,data,"return=representation");
}

export async function operatorAudit(action:string,targetType?:string,targetId?:string,metadata:Record<string,unknown>={}){
  const session=await import("./operator").then(module=>module.requireOperatorSession());
  return requestDb<Array<Record<string,unknown>>>("operator_audit","POST",session.token,{
    operator_user_id:session.user.id,
    action,
    target_type:targetType??null,
    target_id:targetId??null,
    metadata,
  },"return=representation");
}


export async function operatorRpc<T>(fn:string,args:Record<string,unknown>={}){
  const {token}=await import("./operator").then(module=>module.requireOperatorSession());
  return requestDb<T>("rpc/"+fn,"POST",token,args);
}


export type TenantFeature="core"|"employees"|"expenses"|"time_tracking"|"advanced_roles";

export async function requireTenantFeature(feature:TenantFeature){
  const tenant=await currentTenant();
  const rows=await requestDb<Array<{allowed:boolean}>>(
    "rpc/tenant_has_feature","POST",tenant.token,{target:tenant.tenantId,feature}
  );
  if(rows as unknown as boolean) return tenant;
  throw new ApiError(403,"feature_not_available","Diese Funktion ist in deinem aktuellen Abonnement nicht verfügbar.");
}
