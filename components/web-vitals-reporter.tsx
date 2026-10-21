"use client";
import {lazy,Suspense,useEffect,useState} from 'react';
import {readPerformanceConsent,privacyPreferenceEvent,privacyPreferenceKey} from './privacy-consent';
// No optional measurement code or observers before a current explicit opt-in.
const ActiveReporter=lazy(()=>import('./web-vitals-active'));
export function WebVitalsReporter(){
 const [enabled,setEnabled]=useState(false);
 useEffect(()=>{
  const update=()=>setEnabled(readPerformanceConsent());update();
  const storage=(event:StorageEvent)=>{if(event.key===privacyPreferenceKey||event.key===null)update();};
  window.addEventListener(privacyPreferenceEvent,update);window.addEventListener('storage',storage);
  return()=>{window.removeEventListener(privacyPreferenceEvent,update);window.removeEventListener('storage',storage);};
 },[]);
 return enabled?<Suspense fallback={null}><ActiveReporter/></Suspense>:null;
}
