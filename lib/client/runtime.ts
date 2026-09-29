"use client";

export type AppMode="local"|"production";
export function appMode():AppMode{
  return process.env.NEXT_PUBLIC_APP_MODE==="production"?"production":"local";
}
export function isProductionMode(){return appMode()==="production"}

export async function apiFetch<T>(input:RequestInfo|URL,init:RequestInit={}):Promise<T>{
  const response=await fetch(input,{
    ...init,
    headers:{"content-type":"application/json",...(init.headers||{})},
    credentials:"same-origin"
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
    const message=typeof body?.error==="string"?body.error:"Anfrage fehlgeschlagen.";
    throw new Error(message);
  }
  return body as T;
}
