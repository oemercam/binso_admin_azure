"use client";

import { useState } from "react";
import { startDemoClientSession } from "@/lib/client/backend";
import { Logo } from "@/components/ui";

export default function Demo(){
  const [error,setError]=useState("");

  const start=async()=>{
    setError("");
    try{
      await startDemoClientSession({name:"Thomas Muster",company:"Musterwerk AG"});
      window.location.replace("/dashboard");
    }catch{
      setError("Binso One konnte nicht geöffnet werden. Bitte erneut versuchen.");
    }
  };

  return <main className="app-launch-screen" aria-live="polite">
    <button className="app-launch-brand" type="button" onClick={()=>void start()} aria-label="Binso One erneut öffnen">
      <Logo compact/>
      <span className="app-launch-pulse" aria-hidden="true"/>
    </button>
    {error&&<p className="app-launch-error" role="alert">{error}</p>}
    <span className="sr-only">Binso One wird vorbereitet.</span>
    <span className="app-launch-autostart" ref={node=>{if(node){node.remove();void start();}}} aria-hidden="true"/>
  </main>;
}
