"use client";

import {dataRevision,publishMutation} from "./data-events";
import {invalidateClientSession,readClientSession} from "./session-cache";

export function isProductionBackendEnabled(){
  return true;
}

export function useBackendMode(){
  return true;
}

export function clearClientSession(){
  if(typeof window==="undefined") return;
  invalidateClientSession();
  try{
  [
    "binso.demo.session",
    "binso.demo.database",
    "binso.demo.name",
    "binso.demo.company",
    "binso.demo.focus",
    "binso.demo.startedAt",
    "binso.demo.expiresAt",
  ].forEach(key=>window.localStorage.removeItem(key));
  window.localStorage.setItem("binso.session.changed",String(Date.now()));
  for(const key of Object.keys(window.sessionStorage)){if(key.startsWith("binso.list:"))window.sessionStorage.removeItem(key);}
  }catch{/* Browser storage can be unavailable; server revocation and the memory fence still apply. */}
}

let logoutPending:Promise<void>|null=null;
export function logoutClientSession():Promise<void>{
  if(logoutPending)return logoutPending;
  const request=(async()=>{
    const payload=await apiPost<{ok?:boolean}>("/api/auth/logout",{});
    if(payload.ok!==true)throw new Error("Abmelden konnte nicht bestätigt werden. Bitte erneut versuchen.");
    clearClientSession();
  })();
  logoutPending=request;
  void request.finally(()=>{if(logoutPending===request)logoutPending=null;}).catch(()=>{});
  return request;
}

let operatorLogoutPending:Promise<{microsoftLogoutUrl?:string|null}>|null=null;
export function logoutOperatorClientSession(){
  if(operatorLogoutPending)return operatorLogoutPending;
  const request=(async()=>{
    const payload=await apiPost<{ok?:boolean;microsoftLogoutUrl?:string|null}>("/api/operator/logout",{});
    if(payload.ok!==true)throw new Error("Abmelden konnte nicht bestätigt werden. Bitte erneut versuchen.");
    clearClientSession();
    return payload;
  })();
  operatorLogoutPending=request;
  void request.finally(()=>{if(operatorLogoutPending===request)operatorLogoutPending=null;}).catch(()=>{});
  return request;
}

export class ClientApiError extends Error {
  readonly correlationId?:string;
  constructor(message:string,public code:string,public status:number,reference?:unknown){
    const id=typeof reference==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reference)?reference.toLowerCase():undefined;
    super(message+(id?' · #'+id:''));this.correlationId=id;
  }
}

export type FreshAuthenticationRequest={action:string;confirm:()=>void;cancel:()=>void};
let freshAuthentication:Promise<void>|null=null;
export function requestFreshAuthentication(action:string):Promise<void>{
  if(freshAuthentication)return freshAuthentication;
  const pending=new Promise<void>((resolve,reject)=>{
    const timer=window.setTimeout(()=>{window.dispatchEvent(new Event('binso-fresh-authentication-expired'));reject(new ClientApiError('Die Sicherheitsbestätigung ist abgelaufen.','fresh_authentication_expired',0));},120_000);
    const finish=(confirmed:boolean)=>{window.clearTimeout(timer);if(confirmed)resolve();else reject(new ClientApiError('Sicherheitsbestätigung abgebrochen.','fresh_authentication_cancelled',0));};
    window.dispatchEvent(new CustomEvent<FreshAuthenticationRequest>('binso-fresh-authentication',{detail:{action,confirm:()=>finish(true),cancel:()=>finish(false)}}));
  });
  freshAuthentication=pending;void pending.finally(()=>{if(freshAuthentication===pending)freshAuthentication=null;}).catch(()=>{});return pending;
}

async function fetchApi(path:string,options:RequestInit={}):Promise<Response>{
  const revision=dataRevision([]);
  try{
    const fetchOnce=()=>fetch(path,{...options,signal:options.signal??AbortSignal.timeout(options.method&&options.method!=="GET"?30000:15000)});
    const response=await fetchOnce();
    if(response.status===403&&(await response.clone().json().catch(()=>null))?.error==='fresh_authentication_required'){
      await requestFreshAuthentication(path.startsWith('/api/settings/team')?'Zugriffsrechte ändern':path.startsWith('/api/auth/')?'Sicherheitseinstellungen ändern':'Geschützte Einstellungen ändern');
      if(revision!==dataRevision([]))throw new ClientApiError('Die Sitzung wurde geändert. Bitte den gespeicherten Stand prüfen.','session_changed',401);
      // Only the explicit pre-mutation denial is replayed, once, after the user
      // confirms. Network/timeouts and uncertain writes are never retried here.
      return await fetchOnce();
    }
    return response;
  }
  catch(error){
    if(error instanceof ClientApiError)throw error;
    const timeout=error instanceof DOMException&&["TimeoutError","AbortError"].includes(error.name);
    throw new ClientApiError(timeout?"Die Anfrage dauert zu lange. Bitte den gespeicherten Stand vor einer Wiederholung prüfen.":"Keine Verbindung zum Server. Bitte die Verbindung und den gespeicherten Stand prüfen.",timeout?"request_timeout":"network_unavailable",0);
  }
}

async function parseResponse<T>(response:Response,fallback:string):Promise<T>{
  const payload=await response.json().catch(()=>{throw new ClientApiError("Die Serverantwort konnte nicht gelesen werden. Bitte den gespeicherten Stand prüfen.","invalid_response",502);});
  if(response.status===401||response.status===403&&payload?.error==='mfa_enrollment_required'){invalidateClientSession(false);if(typeof window!=="undefined")window.dispatchEvent(new Event("binso-session-invalid"));}
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:fallback;
    const reference=response.status>=500&&payload?.correlationId===response.headers.get('X-Correlation-ID')?payload.correlationId:undefined;
    throw new ClientApiError(message,typeof payload?.error==="string"?payload.error:"request_failed",response.status,reference);
  }
  return payload as T;
}

async function mutationResult<T>(response:Response,path:string,fallback:string,revision:string,method:"POST"|"PATCH"|"DELETE"){
  const result=await parseResponse<T>(response,fallback);
  if(revision!==dataRevision([]))throw new ClientApiError("Die Sitzung wurde geändert. Bitte den gespeicherten Stand prüfen.","session_changed",401);
  // Business creates need their persisted identity before any success broadcast.
  // An unreadable or incomplete response can follow a committed transaction;
  // leave the caller's idempotency key intact for its explicit retry.
  const endpoint=path.split("?")[0];
  const createsRecord=method==="POST"&&/^\/api\/(customers|employees|products|projects|expenses|time-entries|support\/tickets|files|payments|documents)$/.test(endpoint);
  const editsRecord=method==="PATCH"&&/^\/api\/(customers|employees|products|expenses)\/[^/]+$/.test(endpoint);
  if(createsRecord||editsRecord){
    const item=(result as {item?:{id?:unknown;number?:unknown}}|null)?.item;
    if(typeof item?.id!=="string"||!item.id.trim()||endpoint==="/api/documents"&&(typeof item.number!=="string"||!item.number.trim())){
      throw new ClientApiError("Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.","invalid_response",502);
    }
  }
  if(endpoint!=='/api/auth/reauthenticate')publishMutation(path);
  return result;
}

export async function apiPost<T>(path:string,body:unknown,options:{idempotencyKey?:string}={}):Promise<T>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(options.idempotencyKey?{"Idempotency-Key":options.idempotencyKey}:{}),
    },
    body:JSON.stringify(body),
  });
  return mutationResult<T>(response,path,"Die Anfrage konnte nicht verarbeitet werden.",revision,"POST");
}

const pendingGets=new Map<string,Promise<unknown>>();
/** Authenticated exports must never save an HTML/JSON error as a business file. */
export async function apiGetFile(path:string,contentType:string):Promise<{blob:Blob;fileName?:string}>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{method:"GET",cache:"no-store",credentials:"same-origin",redirect:"error",headers:{Accept:contentType}});
  if(!response.ok)await parseResponse(response,"Daten konnten nicht geladen werden.");
  if(response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase()!==contentType.toLowerCase())throw new ClientApiError("Daten konnten nicht geladen werden.","invalid_response",502);
  const blob=await response.blob().catch(()=>{throw new ClientApiError("Daten konnten nicht geladen werden.","invalid_response",502)});
  if(revision!==dataRevision([]))throw new ClientApiError("Die Sitzung wurde geändert. Bitte erneut versuchen.","session_changed",401);
  const fileName=response.headers.get("Content-Disposition")?.match(/(?:^|;)\s*filename="([A-Za-z0-9._-]{1,120})"/i)?.[1];
  return {blob,fileName};
}
export async function apiGet<T>(path:string):Promise<T>{
  if(path==="/api/auth/session")return readClientSession() as Promise<T>;
  const sessionRevision=dataRevision([]);
  const key=dataRevision([path])+":"+path;
  const pending=pendingGets.get(key);if(pending)return pending as Promise<T>;
  const request=(async()=>{
    const response=await fetchApi(path,{method:"GET",cache:"no-store",signal:AbortSignal.timeout(15000)});
    const result=await parseResponse<T>(response,"Daten konnten nicht geladen werden.");
    if(sessionRevision!==dataRevision([]))throw new ClientApiError("Die Sitzung wurde geändert. Bitte erneut versuchen.","session_changed",401);
    return result;
  })();
  pendingGets.set(key,request);
  void request.finally(()=>{if(pendingGets.get(key)===request)pendingGets.delete(key);}).catch(()=>{});
  return request;
}

/** Explicit read-only POST for bounded previews; never broadcasts a business mutation. */
export async function apiReadPost<T>(path:string,body:unknown):Promise<T>{
 const revision=dataRevision([]),multipart=body instanceof FormData;
 const response=await fetchApi(path,{method:'POST',...(multipart?{body}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const result=await parseResponse<T>(response,'Daten konnten nicht geladen werden.');
 if(revision!==dataRevision([]))throw new ClientApiError('Die Sitzung wurde geändert. Bitte erneut versuchen.','session_changed',401);
 return result;
}

export async function apiPatch<T>(path:string,body:unknown):Promise<T>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  return mutationResult<T>(response,path,"Änderung konnte nicht gespeichert werden.",revision,"PATCH");
}

export async function apiDelete<T>(path:string,body?:unknown):Promise<T>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{method:"DELETE",...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
  return mutationResult<T>(response,path,"Löschen konnte nicht ausgeführt werden.",revision,"DELETE");
}

const uploadReplayKeys=new WeakMap<File,Map<string,string>>();
export async function apiUpload<T>(path:string,form:FormData):Promise<T>{
  const revision=dataRevision([]);
  const file=form.get("file");
  const headers:Record<string,string>={};
  if(file instanceof File){
    const scope=JSON.stringify([path,form.get("purpose"),form.get("entityId")]);
    let keys=uploadReplayKeys.get(file);if(!keys){keys=new Map();uploadReplayKeys.set(file,keys);}
    let key=keys.get(scope);if(!key){key=crypto.randomUUID();keys.set(scope,key);}
    headers["Idempotency-Key"]=key;
  }
  const response=await fetchApi(path,{method:"POST",body:form,headers});
  return mutationResult<T>(response,path,"Datei konnte nicht hochgeladen werden.",revision,"POST");
}
