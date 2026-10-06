"use client";

import { useEffect, useState } from "react";
import { startDemoClientSession } from "@/lib/client/backend";
import { Logo } from "@/components/ui";

export default function Demo(){
  const [error,setError]=useState("");

  const openDemo=async()=>{
    setError("");
    try{
      await startDemoClientSession({name:"Thomas Muster",company:"Musterwerk AG"});
      window.location.replace("/dashboard");
    }catch{
      setError("Binso One konnte nicht geöffnet werden. Bitte erneut versuchen.");
    }
  };

  useEffect(()=>{
    let active=true;
    startDemoClientSession({name:"Thomas Muster",company:"Musterwerk AG"})
      .then(()=>{if(active)window.location.replace("/dashboard");})
      .catch(()=>{if(active)setError("Binso One konnte nicht geöffnet werden. Bitte erneut versuchen.");});
    return()=>{active=false;};
  },[]);

  return <main className="app-launch-screen" aria-live="polite">
    <button className="app-launch-brand" type="button" onClick={()=>void openDemo()} aria-label="Binso One erneut öffnen">
      <Logo compact/>
      <span className="app-launch-pulse" aria-hidden="true"/>
    </button>
    {error&&<p className="app-launch-error" role="alert">{error}</p>}
    <span className="sr-only">Binso One wird vorbereitet.</span>
  </main>;
}
