"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {Clock3,Pause,Play,Square} from "lucide-react";
import {Button} from "@/components/ui/button";
import {getTimeTracker,timeTrackerAction} from "@/lib/client/time-tracker";
import {formatTrackerDuration,trackerElapsedSeconds,type TimeTracker} from "@/lib/time-tracker";
import {appEvents,subscribeAppEvent} from "@/lib/client/app-events";
import {notify} from "@/lib/notify";
import {useLocale} from "@/components/locale-provider";

export default function ActiveTimeTrackerHost(){
 const {t}=useLocale();const [tracker,setTracker]=useState<TimeTracker|null>(null);const [now,setNow]=useState(0);const reminded=useRef(new Set<number>());
 const load=useCallback(()=>void getTimeTracker().then(x=>{setTracker(x);setNow(Date.now())}).catch(()=>{}),[]);
 useEffect(()=>{const initial=window.setTimeout(load,250);const poll=window.setInterval(load,60_000);const onVisible=()=>{if(document.visibilityState==="visible")load()};document.addEventListener("visibilitychange",onVisible);window.addEventListener("focus",load);const unsub=subscribeAppEvent(appEvents.timeTrackerChanged,load);return()=>{window.clearTimeout(initial);window.clearInterval(poll);document.removeEventListener("visibilitychange",onVisible);window.removeEventListener("focus",load);unsub()}},[load]);
 useEffect(()=>{if(!tracker)return;const tick=window.setInterval(()=>setNow(Date.now()),1000);return()=>window.clearInterval(tick)},[tracker]);
 const elapsed=useMemo(()=>trackerElapsedSeconds(tracker,now),[tracker,now]);
 useEffect(()=>{if(!tracker)return;if(tracker.state==="running"){for(const hours of [4,8])if(elapsed>=hours*3600&&!reminded.current.has(hours)){reminded.current.add(hours);notify(t("Zeiterfassung läuft seit {hours} Stunden. Bitte prüfen, pausieren oder beenden.").replace("{hours}",String(hours)),"info")}}else{const pausedMinutes=Math.floor((now-new Date(tracker.updatedAt).getTime())/60000);if(pausedMinutes>=30&&!reminded.current.has(30)){reminded.current.add(30);notify(t("Zeiterfassung ist seit 30 Minuten pausiert. Fortsetzen oder beenden?"),"info")}}},[elapsed,now,tracker,t]);
 if(!tracker)return null;
 async function act(action:"pause"|"resume"|"stop"){try{const r=await timeTrackerAction(action);setTracker(r.item);setNow(Date.now());if(action==="stop")notify(t("Zeiterfassung gespeichert."))}catch(e){notify(e instanceof Error?e.message:t("Zeiterfassung konnte nicht aktualisiert werden."),"danger")}}
 return <aside className="active-time-tracker" aria-live="polite"><Link href="/zeiterfassung" className="active-time-tracker-copy"><Clock3 size={17}/><span><strong>{t(tracker.state==="paused"?"Zeiterfassung pausiert":"Zeiterfassung läuft")}</strong><small>{tracker.projectLabel||t("Intern")} · {formatTrackerDuration(elapsed)}</small></span></Link><div className="active-time-tracker-actions">{tracker.state==="running"?<Button size="sm" variant="secondary" icon={<Pause size={15}/>} onClick={()=>void act("pause")}>{t("Pause")}</Button>:<Button size="sm" variant="secondary" icon={<Play size={15}/>} onClick={()=>void act("resume")}>{t("Fortsetzen")}</Button>}<Button size="sm" icon={<Square size={14}/>} onClick={()=>void act("stop")}>{t("Beenden")}</Button></div></aside>;
}
