import { ApiError } from "./http";
import { getBackendEnv } from "./env";

function serviceKey(){
  const value=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!value) throw new ApiError(503,"service_role_not_configured","Serverintegration ist nicht vollständig konfiguriert.");
  return value;
}

export async function privilegedSupabase<T>(path:string,options:{method?:"GET"|"POST"|"PATCH"|"DELETE";body?:unknown;prefer?:string}={}):Promise<T>{
  const {supabaseUrl}=getBackendEnv();
  const key=serviceKey();
  const response=await fetch(supabaseUrl+"/rest/v1/"+path,{
    method:options.method??"GET",
    headers:{
      apikey:key,
      Authorization:"Bearer "+key,
      "Content-Type":"application/json",
      ...(options.prefer?{Prefer:options.prefer}:{}),
    },
    body:options.body===undefined?undefined:JSON.stringify(options.body),
    cache:"no-store",
  });
  if(!response.ok){
    const payload=await response.json().catch(()=>({}));
    console.error("Privileged Supabase request failed",response.status,typeof payload?.code==="string"?payload.code:"unknown");
    throw new ApiError(500,"privileged_database_error","Serverintegration konnte die Daten nicht verarbeiten.");
  }
  if(response.status===204) return undefined as T;
  return response.json() as Promise<T>;
}


export async function inviteSupabaseUser(email:string,data:Record<string,string>){
  const {supabaseUrl}=getBackendEnv();
  const key=serviceKey();
  const response=await fetch(supabaseUrl+"/auth/v1/invite",{
    method:"POST",
    headers:{apikey:key,Authorization:"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({email,data}),
    cache:"no-store",
  });
  if(!response.ok){
    const payload=await response.json().catch(()=>({}));
    console.error("Supabase invitation failed",response.status,typeof payload?.code==="string"?payload.code:"unknown");
    throw new ApiError(400,"invitation_failed","Einladung konnte nicht gesendet werden.");
  }
  return response.json() as Promise<{id?:string;email?:string}>;
}
