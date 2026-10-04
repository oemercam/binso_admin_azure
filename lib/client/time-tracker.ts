"use client";
import { apiGet, apiPost, isProductionBackendEnabled } from "./backend";
export type TimerState={running:boolean;seconds:number;project:string};
type Tracker={state:string;seconds:number;project_label:string};
export async function readTimer():Promise<TimerState>{
  if(isProductionBackendEnabled()){
    const {tracker}=await apiGet<{tracker:Tracker|null}>("/api/time-tracker");
    return {running:tracker?.state==="running",seconds:Number(tracker?.seconds??0),project:tracker?.project_label||"Arbeitszeit"};
  }
  return {running:false,seconds:0,project:"Arbeitszeit"};
}
export async function changeTimer(action:"start"|"pause"|"project"|"finish",project?:string){
  if(isProductionBackendEnabled()){
    await apiPost("/api/time-tracker",{action,project});
  }else{
    throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
  }
  window.dispatchEvent(new Event("binso-timer-change"));
  return readTimer();
}
