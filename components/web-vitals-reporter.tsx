"use client";

import { useReportWebVitals } from "next/web-vitals";

function safeRoute(pathname:string){
  return pathname.split("/").map(segment=>{
    if(segment.length>24) return "[id]";
    if(segment.startsWith("RE-")||segment.startsWith("AN-")) return "[id]";
    return segment;
  }).join("/");
}

export function WebVitalsReporter(){
  useReportWebVitals(metric=>{
    const body=JSON.stringify({name:metric.name,value:metric.value,rating:metric.rating,route:safeRoute(window.location.pathname)});
    if(navigator.sendBeacon){
      navigator.sendBeacon("/api/telemetry/web-vitals",new Blob([body],{type:"application/json"}));
      return;
    }
    fetch("/api/telemetry/web-vitals",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>undefined);
  });
  return null;
}
