"use client";

import {useEffect,useState} from 'react';
import {hasPendingClientMutation} from '@/lib/client/backend';
import {hasProtectedDraft} from './use-browser-back-guard';
import {Toast} from './ui';

/** A worker activation does not replace already executing application code.
 * Never silently reload forms, dialogs, uploads, or an in-flight mutation. */
export function canUpdateApplication(){
 return !hasPendingClientMutation()&&!hasProtectedDraft()&&!document.querySelector(
  '[data-unsaved="true"],.app-editing,form,[aria-modal="true"],[aria-busy="true"],input:focus,textarea:focus,select:focus'
 );
}

export function PwaVersionNotice(){
 const [available,setAvailable]=useState(false),[blocked,setBlocked]=useState(false);
 useEffect(()=>{
  const current=process.env.BINSO_BUILD_SHA;
  if(process.env.NODE_ENV!=='production'||!current||!/^[a-f0-9]{40}$/i.test(current))return;
  let active=true,pending=false,lastCheck=0;
  const check=async()=>{
   if(!active||pending||document.visibilityState!=='visible'||Date.now()-lastCheck<60000)return;
   pending=true;lastCheck=Date.now();
   try{
    const response=await fetch('/api/health',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(5000)});
    if(!response.ok)return;
    const body=await response.json();
    if(active&&body.status==='ok'&&typeof body.sha==='string'&&/^[a-f0-9]{40}$/i.test(body.sha))setAvailable(body.sha!==current);
   }catch{/* An offline/resume failure is not a release change. */}
   finally{pending=false;}
  };
  // Keep this public metadata check out of the first authenticated data burst.
  const timer=window.setTimeout(()=>void check(),10000);
  const resume=()=>void check();
  document.addEventListener('visibilitychange',resume);window.addEventListener('focus',resume);
  return()=>{active=false;window.clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',resume);};
 },[]);
 if(!available)return null;
 return <Toast tone="info" title="Neue Version verfügbar" text={blocked?'Bitte offene Änderungen zuerst speichern oder verwerfen.':undefined} actionLabel="Aktualisieren" onAction={()=>{
  if(!canUpdateApplication()){setBlocked(true);return;}
  window.location.reload();
 }}/>;
}
