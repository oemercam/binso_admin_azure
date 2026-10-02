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
