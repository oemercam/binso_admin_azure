"use client";
import { apiGet, apiPost, isProductionBackendEnabled } from "./backend";
export type TimerState={running:boolean;seconds:number;project:string;projectId?:string|null;customerId?:string|null};
export function withIdleTimerContext(state:TimerState,context:Pick<TimerState,'project'|'projectId'|'customerId'>|null):TimerState{return !state.running&&state.seconds===0&&context?{...state,...context}:state;}
type Tracker={state:string;seconds:number;project_label:string;project_id?:string|null;customer_id?:string|null};
export async function readTimer():Promise<TimerState>{
  if(isProductionBackendEnabled()){
    const {tracker}=await apiGet<{tracker:Tracker|null}>("/api/time-tracker");
    return {running:tracker?.state==="running",seconds:Number(tracker?.seconds??0),project:tracker?.project_label||"Arbeitszeit",projectId:tracker?.project_id??null,customerId:tracker?.customer_id??null};
  }
  return {running:false,seconds:0,project:"Arbeitszeit"};
}
export async function changeTimer(action:"start"|"pause"|"project"|"finish",project?:string,projectId?:string|null,customerId?:string|null){
  if(isProductionBackendEnabled()){
    await apiPost("/api/time-tracker",{action,project,projectId,customerId});
  }else{
    throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
  }
  window.dispatchEvent(new Event("binso-timer-change"));
  return readTimer();
}
