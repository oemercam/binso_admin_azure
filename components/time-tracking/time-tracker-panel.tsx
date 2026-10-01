"use client";
import ToggleSwitch from "@/components/ui/toggle-switch";
import {useCallback,useEffect,useMemo,useState} from "react";
import {Pause,Play,Square} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/form-controls";
import RelationshipPicker from "@/components/relationship-picker";
import {getTimeTracker,timeTrackerAction} from "@/lib/client/time-tracker";
import {formatTrackerDuration,trackerElapsedSeconds,type TimeTracker} from "@/lib/time-tracker";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {notify} from "@/lib/notify";
import {useLocale} from "@/components/locale-provider";
import type {EntityOption} from "@/lib/relationships";

export default function TimeTrackerPanel(){
 const {t}=useLocale();const [tracker,setTracker]=useState<TimeTracker|null>(null);const [now,setNow]=useState(0);const [project,setProject]=useState<EntityOption|undefined>();const [activity,setActivity]=useState("");const [billable,setBillable]=useState(false);const [busy,setBusy]=useState(false);
 const load=useCallback(()=>void getTimeTracker().then(x=>{setTracker(x);setNow(Date.now())}).catch(()=>setTracker(null)),[]);
 useEffect(()=>{const timer=window.setTimeout(load,0);const unsub=subscribeAppEvent(appEvents.timeTrackerChanged,load);return()=>{window.clearTimeout(timer);unsub()}},[load]);
 useEffect(()=>{if(!tracker)return;const timer=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(timer)},[tracker]);
 const elapsed=useMemo(()=>trackerElapsedSeconds(tracker,now),[tracker,now]);
 async function act(action:"start"|"pause"|"resume"|"stop"){
  setBusy(true);try{const r=await timeTrackerAction(action,{projectId:project?.id,projectLabel:project?.label,activity:activity||t("Arbeitszeit"),billable});setTracker(r.item);setNow(Date.now());if(action==="stop")notify(t("Zeiterfassung gespeichert."));}catch(e){notify(e instanceof Error?e.message:t("Zeiterfassung konnte nicht aktualisiert werden."),"danger")}finally{setBusy(false)}
 }
 return <section className={`time-tracker-card workspace-card${tracker?" is-active":""}`}>
  <div className="time-tracker-main"><div><span className="time-tracker-kicker">{t(tracker?.state==="paused"?"Zeiterfassung pausiert":"Live-Zeiterfassung")}</span><strong className="time-tracker-clock">{formatTrackerDuration(elapsed)}</strong><small>{tracker?(tracker.projectLabel||t("Intern"))+" · "+tracker.activity:t("Projekt und Tätigkeit wählen, dann Zeit starten.")}</small></div></div>
  {!tracker?<div className="time-tracker-setup"><RelationshipPicker module="projekte" label={t("Projekt")} value={project?.id||""} onChange={o=>{setProject(o);setBillable(Boolean(o))}} createHref="/projekte/neu"/><label><span>{t("Tätigkeit")}</span><Input value={activity} onChange={e=>setActivity(e.target.value)} placeholder={t("z. B. Beratung")}/></label><div className="time-tracker-billable toggle-setting-row"><span>{t("Verrechenbar")}</span><ToggleSwitch checked={billable} onChange={setBillable} label={t("Verrechenbar")}/></div><Button loading={busy} icon={<Play size={17}/>} onClick={()=>void act("start")}>{t("Zeit starten")}</Button></div>:
  <div className="time-tracker-actions">{tracker.state==="running"?<Button loading={busy} variant="secondary" icon={<Pause size={17}/>} onClick={()=>void act("pause")}>{t("Pause")}</Button>:<Button loading={busy} variant="secondary" icon={<Play size={17}/>} onClick={()=>void act("resume")}>{t("Fortsetzen")}</Button>}<Button loading={busy} icon={<Square size={16}/>} onClick={()=>void act("stop")}>{t("Beenden")}</Button></div>}
 </section>;
}
