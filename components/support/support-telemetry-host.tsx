"use client";
import {useEffect} from "react";
import {usePathname} from "next/navigation";
import {recordSupportEvent} from "@/lib/support/diagnostics";

export default function SupportTelemetryHost(){
 const pathname=usePathname();
 useEffect(()=>{recordSupportEvent("navigation",`Route geöffnet: ${pathname}`)},[pathname]);
 useEffect(()=>{
  const onError=(event:ErrorEvent)=>recordSupportEvent("error",event.message||"Unbekannter Browserfehler");
  const onReject=(event:PromiseRejectionEvent)=>recordSupportEvent("promise_rejection",event.reason instanceof Error?event.reason.message:String(event.reason||"Unbekannter Promise-Fehler"));
  const onOnline=()=>recordSupportEvent("network","Online");const onOffline=()=>recordSupportEvent("network","Offline");
  window.addEventListener("error",onError);window.addEventListener("unhandledrejection",onReject);window.addEventListener("online",onOnline);window.addEventListener("offline",onOffline);
  return()=>{window.removeEventListener("error",onError);window.removeEventListener("unhandledrejection",onReject);window.removeEventListener("online",onOnline);window.removeEventListener("offline",onOffline)};
 },[]);
 return null;
}
