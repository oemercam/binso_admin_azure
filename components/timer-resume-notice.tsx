"use client";

import {useEffect,useState} from "react";
import {readTimer} from "@/lib/client/time-tracker";
import {hasBlockingModal} from "./use-dialog-focus";
import ConfirmDialog from "./confirm-dialog";

/** One authoritative check per foreground visit, never a polling loop. */
export function watchTimerResume(read:()=>Promise<{running:boolean}>,notify:(running:boolean)=>void){
 let active=true,checked=false,pending=false,revision=0,queued=false;
 const check=async()=>{
  if(!active||document.visibilityState!=="visible"||checked)return;
  if(pending){queued=true;return;}
  checked=true;pending=true;const current=revision;
  try{const state=await read();if(active&&current===revision&&document.visibilityState==="visible")notify(state.running);}
  catch{/* A failed read never proves that a timer is running. */}
  finally{pending=false;if(active&&queued){queued=false;void check();}}
 };
 const visibility=()=>{
  if(document.visibilityState!=="visible"){revision++;checked=false;notify(false);}
  else void check();
 };
 const changed=()=>{revision++;checked=true;queued=false;notify(false);};
 void check();document.addEventListener("visibilitychange",visibility);window.addEventListener("pageshow",check);window.addEventListener("binso-timer-change",changed);
 return()=>{active=false;notify(false);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("pageshow",check);window.removeEventListener("binso-timer-change",changed);};
}

export function TimerResumeNotice({enabled,onOpenTimer}:{enabled:boolean;onOpenTimer:()=>void}){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  if(!enabled)return;
  return watchTimerResume(readTimer,running=>setOpen(running&&window.location.pathname!=="/zeit"&&!hasBlockingModal()&&!document.querySelector('[data-unsaved="true"]')));
 },[enabled]);
 return <ConfirmDialog open={enabled&&open} title="Deine Zeitmessung läuft noch" message="Du kannst weiterarbeiten oder die Zeitmessung öffnen, um sie zu pausieren oder zu beenden." cancelLabel="Weiterlaufen lassen" confirmLabel="Zur Zeitmessung" onCancel={()=>setOpen(false)} onConfirm={()=>{setOpen(false);onOpenTimer();}}/>;
}
