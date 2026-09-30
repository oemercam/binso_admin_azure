"use client";

export type BrowserStorageKind="local"|"session";

export function getBrowserStorage(kind:BrowserStorageKind="local"):Storage|undefined{
 if(typeof window==="undefined")return undefined;
 return kind==="session"?window.sessionStorage:window.localStorage;
}

export function readTextStorage(key:string,fallback="",storage:Storage|undefined=getBrowserStorage("local")){
 if(!storage)return fallback;
 try{return storage.getItem(key)??fallback}catch{return fallback}
}

export function writeTextStorage(key:string,value:string,storage:Storage|undefined=getBrowserStorage("local")){
 if(!storage)return;
 try{storage.setItem(key,value)}catch{}
}

export function readJsonStorage<T>(key:string,fallback:T,storage:Storage|undefined=getBrowserStorage("local")):T{
 if(!storage)return fallback;
 try{
  const raw=storage.getItem(key);
  return raw===null?fallback:JSON.parse(raw) as T;
 }catch{return fallback}
}

export function writeJsonStorage<T>(key:string,value:T,storage:Storage|undefined=getBrowserStorage("local")){
 if(!storage)return;
 try{storage.setItem(key,JSON.stringify(value))}catch{}
}

export function removeStorage(key:string,storage:Storage|undefined=getBrowserStorage("local")){
 if(!storage)return;
 try{storage.removeItem(key)}catch{}
}
