"use client";

import {getLocale,translate} from "@/lib/i18n";

export type AppMode="local"|"production";
export function appMode():AppMode{
  return process.env.NEXT_PUBLIC_APP_MODE==="production"?"production":"local";
}
export function isProductionMode(){return appMode()==="production"}

async function readResponseBody(response:Response){
  return response.json().catch(()=>({})) as Promise<Record<string,unknown>>;
}

function localizedApiError(body:Record<string,unknown>){
  const message=typeof body.error==="string"?body.error:"Anfrage fehlgeschlagen.";
  return new Error(translate(message,getLocale()));
}

export async function apiFetch<T>(input:RequestInfo|URL,init:RequestInit={}):Promise<T>{
  const response=await fetch(input,{
    ...init,
    headers:{"content-type":"application/json",...(init.headers||{})},
    credentials:"same-origin"
  });
  const body=await readResponseBody(response);
  if(!response.ok)throw localizedApiError(body);
  return body as T;
}

export async function apiFormFetch<T>(input:RequestInfo|URL,formData:FormData,init:Omit<RequestInit,"body">={}):Promise<T>{
  const response=await fetch(input,{...init,method:init.method||"POST",body:formData,credentials:"same-origin"});
  const body=await readResponseBody(response);
  if(!response.ok)throw localizedApiError(body);
  return body as T;
}

export async function apiPublicFetch<T>(input:RequestInfo|URL,init:RequestInit={}):Promise<{ok:boolean;body:T}> {
  const response=await fetch(input,{...init,credentials:"same-origin"});
  const body=await readResponseBody(response) as T;
  return {ok:response.ok,body};
}
