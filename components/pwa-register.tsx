"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [updateAvailable,setUpdateAvailable]=useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    let active=true;
    navigator.serviceWorker.register("/sw.js").then(registration=>{
      registration.update().catch(()=>undefined);
      registration.addEventListener("updatefound",()=>{
        const worker=registration.installing;
        if(!worker)return;
        worker.addEventListener("statechange",()=>{
          if(active&&worker.state==="installed"&&navigator.serviceWorker.controller)setUpdateAvailable(true);
        });
      });
    }).catch(()=>undefined);
    return()=>{active=false;};
  }, []);

  if(!updateAvailable)return null;
  return <div className="pwa-update" role="status"><div><b>Update verfügbar</b><span>Neue Version von Binso One ist bereit.</span></div><button type="button" onClick={()=>window.location.reload()}>Aktualisieren</button></div>;
}