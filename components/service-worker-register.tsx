"use client";
import {emitAppEvent,subscribeAppEvent,appEvents} from "@/lib/client/app-events";

import {useEffect} from "react";

export default function ServiceWorkerRegister(){
 useEffect(()=>{
  if(!("serviceWorker" in navigator)||process.env.NODE_ENV!=="production")return;
  let registration:ServiceWorkerRegistration|undefined;
  let refreshing=false;
  const onControllerChange=()=>{if(refreshing)return;refreshing=true;window.location.reload()};
  navigator.serviceWorker.addEventListener("controllerchange",onControllerChange);
  const applyUpdate=()=>registration?.waiting?.postMessage({type:"SKIP_WAITING"});
  const unsubscribeApply=subscribeAppEvent(appEvents.pwaApplyUpdate,applyUpdate);
  void navigator.serviceWorker.register("/sw.js").then(reg=>{
   registration=reg;
   const notify=()=>emitAppEvent(appEvents.pwaUpdateAvailable);
   if(reg.waiting&&navigator.serviceWorker.controller)notify();
   reg.addEventListener("updatefound",()=>{
    const worker=reg.installing;if(!worker)return;
    worker.addEventListener("statechange",()=>{if(worker.state==="installed"&&navigator.serviceWorker.controller)notify()});
   });
  }).catch(()=>undefined);
  return()=>{navigator.serviceWorker.removeEventListener("controllerchange",onControllerChange);unsubscribeApply()};
 },[]);
 return null;
}
