"use client";

import { useEffect } from "react";

/** Updates only the offline worker. The separate version notice offers a safe,
 * explicit replacement of already running application code after a deployment. */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let active=true;
    let registration:ServiceWorkerRegistration|undefined;
    let installing:ServiceWorker|null=null;
    const activateWaiting=()=>{if(active)registration?.waiting?.postMessage({type:"SKIP_WAITING"})};
    const stateChanged=()=>{if(installing?.state==="installed")activateWaiting()};
    const updateFound=()=>{
      installing?.removeEventListener("statechange",stateChanged);
      installing=registration?.installing??null;
      installing?.addEventListener("statechange",stateChanged);
    };
    const check=()=>{if(active&&document.visibilityState==="visible")void registration?.update().catch(()=>undefined)};
    navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(value=>{
      if(!active)return;
      registration=value;
      registration.addEventListener("updatefound",updateFound);
      updateFound();activateWaiting();check();
    }).catch(()=>undefined);
    document.addEventListener("visibilitychange",check);
    return()=>{
      active=false;
      document.removeEventListener("visibilitychange",check);
      registration?.removeEventListener("updatefound",updateFound);
      installing?.removeEventListener("statechange",stateChanged);
    };
  }, []);
  return null;
}
