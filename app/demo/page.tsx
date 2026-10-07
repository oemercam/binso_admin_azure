"use client";

import { useEffect, useState } from "react";
import { startDemoClientSession } from "@/lib/client/backend";
import { Logo } from "@/components/ui";

export default function Demo(){
  const [error,setError]=useState("");
  const [opening,setOpening]=useState(true);

  const openDemo=async()=>{
    if(opening)return;
    setOpening(true);setError("");
    try{
      await startDemoClientSession({name:"Thomas Muster",company:"Musterwerk AG"});
      window.location.replace("/dashboard");
    }catch{
      setOpening(false);setError("Binso One konnte nicht geöffnet werden. Bitte erneut versuchen.");
    }
  };

  useEffect(()=>{
    let active=true;
    startDemoClientSession({name:"Thomas Muster",company:"Musterwerk AG"})
      .then(()=>{if(active)window.location.replace("/dashboard");})
      .catch(()=>{if(active){setOpening(false);setError("Binso One konnte nicht geöffnet werden. Bitte erneut versuchen.");}});
    return()=>{active=false;};
  },[]);

  return <main className="app-launch-screen" aria-live="polite">
    <button className="app-launch-brand" type="button" disabled={opening} onClick={()=>void openDemo()} aria-label="Binso One erneut öffnen">
      <Logo compact/>
      <span className="app-launch-pulse" aria-hidden="true"/>
    </button>
    {error&&<p className="app-launch-error" role="alert">{error}</p>}
    <span className="sr-only">Binso One wird vorbereitet.</span>
  </main>;
}
