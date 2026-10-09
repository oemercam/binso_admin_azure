"use client";

import { useEffect, useState } from "react";

const reloadKey="binso.pwa.reloaded-for-controller";

export function PwaRegister() {
  const [updateAvailable,setUpdateAvailable]=useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let active=true;
    let hadController=Boolean(navigator.serviceWorker.controller);

    const handleControllerChange=()=>{
      if(!active) return;
      if(!hadController){hadController=true;return;}
      if(sessionStorage.getItem(reloadKey)==="1") return;
      sessionStorage.setItem(reloadKey,"1");
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange",handleControllerChange);

    navigator.serviceWorker.register("/sw.js",{updateViaCache:"none"}).then(registration=>{
      if(registration.waiting)setUpdateAvailable(true);
      registration.update().catch(()=>undefined);

      registration.addEventListener("updatefound",()=>{
        const worker=registration.installing;
        if(!worker)return;

        worker.addEventListener("statechange",()=>{
          if(!active)return;

          if(worker.state==="installed"){
            if(navigator.serviceWorker.controller){
              setUpdateAvailable(true);
            }else{
              sessionStorage.removeItem(reloadKey);
            }
          }
        });
      });
    }).catch(()=>undefined);

    return()=>{
      active=false;
      navigator.serviceWorker.removeEventListener("controllerchange",handleControllerChange);
    };
  }, []);

  if(!updateAvailable)return null;

  return <div className="pwa-update" role="status">
    <div>
      <b>Update verfügbar</b>
      <span>Neue Version von Binso One ist bereit.</span>
    </div>
    <button
      type="button"
      onClick={async()=>{
        const registration=await navigator.serviceWorker.getRegistration();
        if(registration?.waiting){sessionStorage.removeItem(reloadKey);registration.waiting.postMessage({type:"SKIP_WAITING"});}
        // controllerchange reloads once when the requested worker is active.
      }}
    >
      Aktualisieren
    </button>
  </div>;
}
