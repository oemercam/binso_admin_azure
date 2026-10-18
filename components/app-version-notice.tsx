"use client";

import {useEffect,useRef,useState} from "react";
import {LocalizedText} from "@/lib/client/locale";
import {Button} from "./ui";

/** Foreground-only version discovery. Never replace a running editor automatically. */
export function AppVersionNotice(){
 const baseline=useRef<string|null>(null);
 const [available,setAvailable]=useState(false),[blocked,setBlocked]=useState(false);
 useEffect(()=>{
  let active=true,request:AbortController|null=null;
  const check=async()=>{
   if(document.visibilityState!=="visible"||request)return;
   const controller=new AbortController();request=controller;
   const timeout=window.setTimeout(()=>controller.abort(),5000);
   try{
    const response=await fetch('/api/health',{cache:'no-store',credentials:'omit',signal:controller.signal});
    if(!response.ok)return;
    const value:unknown=await response.json();
    const sha=value&&typeof value==='object'&&'sha' in value?value.sha:null;
    if(!active||typeof sha!=='string'||!/^[a-f0-9]{40}$/.test(sha))return;
    if(baseline.current&&baseline.current!==sha)setAvailable(true);
    else baseline.current=sha;
   }catch{/* Offline/resume failure is not evidence of a new version. */}
   finally{window.clearTimeout(timeout);if(request===controller)request=null;}
  };
  void check();document.addEventListener('visibilitychange',check);window.addEventListener('pageshow',check);
  return()=>{active=false;request?.abort();document.removeEventListener('visibilitychange',check);window.removeEventListener('pageshow',check)};
 },[]);
 if(!available)return null;
 return <div className="app-version-notice" role="status"><span><LocalizedText>{blocked?"Deine Änderungen sind noch nicht gespeichert.":"Neue Version verfügbar"}</LocalizedText></span><Button variant="secondary" onClick={()=>{
  if(document.querySelector('[data-unsaved="true"]')){setBlocked(true);return;}
  window.location.reload();
 }}><LocalizedText>{"Aktualisieren"}</LocalizedText></Button></div>;
}
