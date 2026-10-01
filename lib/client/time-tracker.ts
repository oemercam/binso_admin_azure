"use client";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {emitAppEvent,appEvents} from "@/lib/client/app-events";
import {storageKeys} from "@/config/storage-keys";
import {readJsonStorage,writeJsonStorage,removeStorage} from "@/lib/client/browser-storage";
import {createAppRecord} from "@/lib/client/data-service";
import {isoDate} from "@/config/domain";
import type {TimeTracker} from "@/lib/time-tracker";
import {trackerElapsedSeconds} from "@/lib/time-tracker";

function localTracker(){return readJsonStorage<TimeTracker|null>(storageKeys.timeTracker,null)}
function saveLocal(item:TimeTracker|null){if(item)writeJsonStorage(storageKeys.timeTracker,item);else removeStorage(storageKeys.timeTracker);emitAppEvent(appEvents.timeTrackerChanged)}
export async function getTimeTracker():Promise<TimeTracker|null>{if(!isProductionMode())return localTracker();const r=await apiFetch<{item:TimeTracker|null}>("/api/time-tracker");return r.item}
export async function timeTrackerAction(action:"start"|"pause"|"resume"|"stop",input:{projectId?:string;projectLabel?:string;activity?:string;billable?:boolean}={}){
 if(isProductionMode()){const r=await apiFetch<{item:TimeTracker|null;createdId?:string;workedSeconds?:number}>("/api/time-tracker",{method:"POST",body:JSON.stringify({action,...input})});emitAppEvent(appEvents.timeTrackerChanged);if(action==="stop")emitAppEvent(appEvents.dataChanged);return r}
 const current=localTracker();const now=new Date().toISOString();
 if(action==="start"){
  if(current)throw new Error("Es läuft bereits eine Zeiterfassung.");
  const item:TimeTracker={state:"running",startedAt:now,activeSince:now,accumulatedSeconds:0,projectId:input.projectId||"",projectLabel:input.projectLabel||"",activity:input.activity?.trim()||"Arbeitszeit",billable:input.billable!==false,updatedAt:now};saveLocal(item);return {item};
 }
 if(!current)return {item:null};
 if(action==="pause"&&current.state==="running"){const item={...current,state:"paused" as const,accumulatedSeconds:trackerElapsedSeconds(current),activeSince:null,updatedAt:now};saveLocal(item);return {item}}
 if(action==="resume"&&current.state==="paused"){const item={...current,state:"running" as const,activeSince:now,updatedAt:now};saveLocal(item);return {item}}
 if(action==="stop"){
  const seconds=Math.max(1,trackerElapsedSeconds(current));const hours=(seconds/3600).toFixed(2);await createAppRecord({module:"zeiterfassung",status:"Entwurf",row:[isoDate(),current.projectLabel||"Intern",current.activity,`${hours} h`,"Entwurf"],fields:{Datum:isoDate(),Mitarbeiter:"Mitarbeiter",Projekt:current.projectLabel||"Intern",Leistung:current.activity,"Dauer in Stunden":hours,"Pause Minuten":"0",Verrechenbar:current.billable?"Ja":"Nein",Status:"Entwurf",Notiz:current.activity},meta:{relations:{projectId:current.projectId}}});saveLocal(null);emitAppEvent(appEvents.dataChanged);return {item:null,workedSeconds:seconds};
 }
 return {item:current};
}
