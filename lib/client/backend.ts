"use client";

import { useEffect, useState } from "react";

export function isProductionBackendEnabled(){
  if(typeof window==="undefined") return false;
  if(document.querySelector('[data-operator-demo="true"]'))return false;
  return window.localStorage.getItem("binso.demo.session")!=="1" && !window.location.pathname.startsWith("/preview/");
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
    "binso.demo.name",
    "binso.demo.company",
    "binso.demo.focus",
    "binso.demo.startedAt",
    "binso.demo.expiresAt",
  ].forEach(key=>window.localStorage.removeItem(key));
}

export async function startDemoClientSession({
  name="Demo",
  company="Demo Firma",
  focus="overview",
}:{
  name?:string;
  company?:string;
  focus?:string;
}={}){
  if(typeof window==="undefined") throw new Error("Demo-Sitzung kann nur im Browser gestartet werden.");

  const now=Date.now();
  window.localStorage.setItem("binso.demo.session","1");
  window.localStorage.setItem("binso.demo.name",name.trim()||"Demo");
  window.localStorage.setItem("binso.demo.company",company.trim()||"Demo Firma");
  window.localStorage.setItem("binso.demo.focus",focus);
  window.localStorage.setItem("binso.demo.startedAt",String(now));
  window.localStorage.setItem("binso.demo.expiresAt",String(now+24*60*60*1000));

  const response=await fetch("/api/demo/session",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
  });
  if(!response.ok){
    clearDemoClientSession();
    throw new Error("Demo-Sitzung konnte nicht gestartet werden.");
  }
}

async function parseResponse<T>(response:Response,fallback:string):Promise<T>{
  const payload=await response.json().catch(()=>({}));
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


export async function apiUpload<T>(path:string,form:FormData):Promise<T>{
  const response=await fetch(path,{method:"POST",body:form});
  return parseResponse<T>(response,"Datei konnte nicht hochgeladen werden.");
}
