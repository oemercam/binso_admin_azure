"use client";

import { useEffect, useState } from "react";
import {dataRevision,publishMutation} from "./data-events";
import {invalidateClientSession,readClientSession} from "./session-cache";

export function isProductionBackendEnabled(){
  if(typeof window==="undefined") return false;
  if(document.querySelector('[data-operator-demo="true"]'))return false;
  return (window.localStorage.getItem("binso.demo.session")!=="1" || window.localStorage.getItem("binso.demo.database")==="1") && !window.location.pathname.startsWith("/preview/");
}

export function useBackendMode(){
  const [enabled,setEnabled]=useState(true);
  useEffect(()=>{
    queueMicrotask(()=>setEnabled(isProductionBackendEnabled()));
  },[]);
  return enabled;
}

export function clearDemoClientSession(){
  if(typeof window==="undefined") return;
  [
    "binso.demo.session",
    "binso.demo.database",
    "binso.demo.name",
    "binso.demo.company",
    "binso.demo.focus",
    "binso.demo.startedAt",
    "binso.demo.expiresAt",
  ].forEach(key=>window.localStorage.removeItem(key));
  invalidateClientSession();
  window.localStorage.setItem("binso.session.changed",String(Date.now()));
  for(const key of Object.keys(window.sessionStorage)){if(key.startsWith("binso.list:"))window.sessionStorage.removeItem(key);}
}

let demoStart:Promise<void>|null=null;
export function startDemoClientSession({name="Demo",company="Demo Firma",focus="overview"}:{name?:string;company?:string;focus?:string}={}):Promise<void>{
  if(typeof window==="undefined")return Promise.reject(new Error("Demo-Sitzung kann nur im Browser gestartet werden."));
  if(demoStart)return demoStart;
  const request=(async()=>{
    const response=await fetchApi("/api/demo/session",{method:"POST",headers:{"Content-Type":"application/json"}});
    const payload=await parseResponse<{ok?:boolean;databaseBacked?:boolean;expiresIn?:number}>(response,"Demo-Sitzung konnte nicht gestartet werden.");
    if(payload.ok!==true)throw new Error("Demo-Sitzung konnte nicht gestartet werden.");
    clearDemoClientSession();
    const now=Date.now();
    window.localStorage.setItem("binso.demo.session","1");
    window.localStorage.setItem("binso.demo.name",name.trim()||"Demo");
    window.localStorage.setItem("binso.demo.company",company.trim()||"Demo Firma");
    window.localStorage.setItem("binso.demo.focus",focus);
    window.localStorage.setItem("binso.demo.startedAt",String(now));
    window.localStorage.setItem("binso.demo.expiresAt",String(now+(payload.expiresIn??86400)*1000));
    if(payload.databaseBacked===true)window.localStorage.setItem("binso.demo.database","1");
  })();
  demoStart=request;
  void request.finally(()=>{if(demoStart===request)demoStart=null;}).catch(()=>{});
  return request;
}

let logoutPending:Promise<void>|null=null;
export function logoutClientSession():Promise<void>{
  if(logoutPending)return logoutPending;
  const request=(async()=>{
    const payload=await apiPost<{ok?:boolean}>("/api/auth/logout",{});
    if(payload.ok!==true)throw new Error("Abmelden konnte nicht bestätigt werden. Bitte erneut versuchen.");
    clearDemoClientSession();
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
    clearDemoClientSession();
    return payload;
  })();
  operatorLogoutPending=request;
  void request.finally(()=>{if(operatorLogoutPending===request)operatorLogoutPending=null;}).catch(()=>{});
  return request;
}

export class ClientApiError extends Error {
  constructor(message:string,public code:string,public status:number){super(message);}
}

async function fetchApi(path:string,options:RequestInit={}):Promise<Response>{
  try{return await fetch(path,{...options,signal:options.signal??AbortSignal.timeout(options.method&&options.method!=="GET"?30000:15000)});}
  catch(error){
    const timeout=error instanceof DOMException&&["TimeoutError","AbortError"].includes(error.name);
    throw new ClientApiError(timeout?"Die Anfrage dauert zu lange. Bitte den gespeicherten Stand vor einer Wiederholung prüfen.":"Keine Verbindung zum Server. Bitte die Verbindung und den gespeicherten Stand prüfen.",timeout?"request_timeout":"network_unavailable",0);
  }
}

async function parseResponse<T>(response:Response,fallback:string):Promise<T>{
  const payload=await response.json().catch(()=>{throw new ClientApiError("Die Serverantwort konnte nicht gelesen werden. Bitte den gespeicherten Stand prüfen.","invalid_response",502);});
  if(response.status===401){invalidateClientSession(false);if(typeof window!=="undefined")window.dispatchEvent(new Event("binso-session-invalid"));}
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:fallback;
    throw new ClientApiError(message,typeof payload?.error==="string"?payload.error:"request_failed",response.status);
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
  publishMutation(path);
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

export async function apiPatch<T>(path:string,body:unknown):Promise<T>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  return mutationResult<T>(response,path,"Änderung konnte nicht gespeichert werden.",revision,"PATCH");
}

export async function apiDelete<T>(path:string):Promise<T>{
  const revision=dataRevision([]);
  const response=await fetchApi(path,{method:"DELETE"});
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
