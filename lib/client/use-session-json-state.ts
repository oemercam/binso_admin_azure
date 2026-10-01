"use client";

import {useCallback,useSyncExternalStore} from "react";
import {getBrowserStorage,readJsonStorage,readTextStorage,writeJsonStorage} from "@/lib/client/browser-storage";

const sessionStateEvent="binso:session-state-change";

type StateUpdater<T>=T|((current:T)=>T);

function parseSnapshot<T>(raw:string,fallback:T):T{
 if(!raw)return fallback;
 try{return JSON.parse(raw) as T}catch{return fallback}
}

/**
 * Hydration-safe session-backed browser state.
 *
 * useSyncExternalStore keeps the server snapshot deterministic and avoids
 * synchronously copying browser storage into React state from an effect.
 * A same-tab custom event complements the native storage event, which only
 * fires in other documents.
 */
export function useSessionJsonState<T>(key:string,fallback:T):[T,(next:StateUpdater<T>)=>void]{
 const subscribe=useCallback((onStoreChange:()=>void)=>{
  const onStorage=(event:StorageEvent)=>{if(event.storageArea===getBrowserStorage("session")&&event.key===key)onStoreChange()};
  const onSessionState=(event:Event)=>{if(event instanceof CustomEvent&&event.detail===key)onStoreChange()};
  window.addEventListener("storage",onStorage);
  window.addEventListener(sessionStateEvent,onSessionState);
  return()=>{
   window.removeEventListener("storage",onStorage);
   window.removeEventListener(sessionStateEvent,onSessionState);
  };
 },[key]);
 const getSnapshot=useCallback(()=>readTextStorage(key,"",getBrowserStorage("session")),[key]);
 const raw=useSyncExternalStore(subscribe,getSnapshot,()=>"");
 const state=parseSnapshot(raw,fallback);
 const setState=useCallback((next:StateUpdater<T>)=>{
  const storage=getBrowserStorage("session");
  const current=readJsonStorage<T>(key,fallback,storage);
  const value=typeof next==="function"?(next as (current:T)=>T)(current):next;
  writeJsonStorage(key,value,storage);
  window.dispatchEvent(new CustomEvent(sessionStateEvent,{detail:key}));
 },[key,fallback]);
 return[state,setState];
}
