"use client";
import { apiGet, apiPost, isProductionBackendEnabled } from "./backend";
export type TimerState={running:boolean;seconds:number;project:string};
type Tracker={state:string;seconds:number;project_label:string};
export async function readTimer():Promise<TimerState>{
  if(isProductionBackendEnabled()){
    const {tracker}=await apiGet<{tracker:Tracker|null}>("/api/time-tracker");
    return {running:tracker?.state==="running",seconds:Number(tracker?.seconds??0),project:tracker?.project_label||"Arbeitszeit"};
  }
  const running=localStorage.getItem("binso.timer.running")==="true";
  const base=Number(localStorage.getItem("binso.timer.baseSeconds")??0);
  const since=Number(localStorage.getItem("binso.timer.startedAt")??0);
  return {running,seconds:base+(running&&since?Math.max(0,Math.floor((Date.now()-since)/1000)):0),project:localStorage.getItem("binso.timer.project")||"Arbeitszeit"};
}
export async function changeTimer(action:"start"|"pause"|"project"|"finish",project?:string){
  if(isProductionBackendEnabled()){
    await apiPost("/api/time-tracker",{action,project});
  }else{
    const state=await readTimer();
    localStorage.setItem("binso.timer.baseSeconds",String(action==="finish"?0:state.seconds));
    localStorage.setItem("binso.timer.running",String(action==="start"||(action==="project"&&state.running)));
    localStorage.setItem("binso.timer.startedAt",String(Date.now()));
    if(project)localStorage.setItem("binso.timer.project",project);
  }
  window.dispatchEvent(new Event("binso-timer-change"));
  return readTimer();
}
