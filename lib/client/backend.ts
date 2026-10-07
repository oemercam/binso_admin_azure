"use client";

import { useEffect, useState } from "react";
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
    const response=await fetch("/api/demo/session",{method:"POST",headers:{"Content-Type":"application/json"}});
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

async function parseResponse<T>(response:Response,fallback:string):Promise<T>{
  const payload=await response.json().catch(()=>({}));
  if(response.status===401){invalidateClientSession();if(typeof window!=="undefined")window.dispatchEvent(new Event("binso-session-invalid"));}
  if(!response.ok){
    const message=typeof payload?.message==="string"?payload.message:fallback;
    throw new Error(message);
  }
  return payload as T;
}

export async function apiPost<T>(path:string,body:unknown,options:{idempotencyKey?:string}={}):Promise<T>{
  const response=await fetch(path,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(options.idempotencyKey?{"Idempotency-Key":options.idempotencyKey}:{}),
    },
    body:JSON.stringify(body),
  });
  return parseResponse<T>(response,"Die Anfrage konnte nicht verarbeitet werden.");
}

export async function apiGet<T>(path:string):Promise<T>{
  if(path==="/api/auth/session")return readClientSession() as Promise<T>;
  const response=await fetch(path,{method:"GET",cache:"no-store"});
  return parseResponse<T>(response,"Daten konnten nicht geladen werden.");
}

export async function apiPatch<T>(path:string,body:unknown):Promise<T>{
  const response=await fetch(path,{
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body),
  });
  return parseResponse<T>(response,"Änderung konnte nicht gespeichert werden.");
}

export async function apiDelete<T>(path:string):Promise<T>{
  const response=await fetch(path,{method:"DELETE"});
  return parseResponse<T>(response,"Löschen konnte nicht ausgeführt werden.");
}

export async function apiUpload<T>(path:string,form:FormData):Promise<T>{
  const response=await fetch(path,{method:"POST",body:form});
  return parseResponse<T>(response,"Datei konnte nicht hochgeladen werden.");
}
