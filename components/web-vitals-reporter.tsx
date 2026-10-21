"use client";

import { useReportWebVitals } from "next/web-vitals";
import {readPerformanceConsent} from "@/components/privacy-consent";
import {validWebVital} from '@/lib/web-vitals';

function safeRoute(pathname:string){
  return pathname.split("/").map(segment=>{
    if(segment.length>24) return "[id]";
    if(segment.startsWith("RE-")||segment.startsWith("AN-")) return "[id]";
    return segment;
  }).join("/");
}

export function WebVitalsReporter(){
  useReportWebVitals(metric=>{
    if(!readPerformanceConsent())return;
    const record={name:metric.name,value:metric.value,rating:metric.rating,route:safeRoute(window.location.pathname)};
    // Next's installed reporter also emits obsolete FID. Do not send a metric
    // outside the ingestion contract or an uninitialized negative measurement.
    if(!validWebVital(record))return;
    const body=JSON.stringify(record);
    if(navigator.sendBeacon){
      navigator.sendBeacon("/api/telemetry/web-vitals",new Blob([body],{type:"application/json"}));
      return;
    }
    fetch("/api/telemetry/web-vitals",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:true}).catch(()=>undefined);
  });
  return null;
}
