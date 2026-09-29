"use client";
import Link from "next/link";import {useEffect,useMemo,useState} from "react";import {CheckCircle2,Circle,ChevronRight} from "lucide-react";import type {LocalRecord} from "@/lib/local-store";import {listAppRecords} from "@/lib/client/data-service";
export default function OnboardingChecklist(){
 const [records,setRecords]=useState<LocalRecord[]>([]);const [hidden,setHidden]=useState(false);
 useEffect(()=>{
 const timer=window.setTimeout(()=>{
  setHidden(localStorage.getItem("binso-onboarding-hidden")==="1");
  void listAppRecords().then(setRecords);
 },0);
 return()=>window.clearTimeout(timer);
},[]);
 const steps=useMemo(()=>[
  {label:"Firmendaten prüfen",href:"/einstellungen?tab=firma",done:true},
  {label:"Ersten Kunden erfassen",href:"/kunden/neu",done:records.some(r=>r.module==="kunden")},
  {label:"Produkt oder Leistung erfassen",href:"/produkte/neu",done:records.some(r=>r.module==="produkte")},
  {label:"Erste Offerte erstellen",href:"/offerten/neu",done:records.some(r=>r.module==="offerten")},
  {label:"Erste Rechnung erstellen",href:"/rechnungen/neu",done:records.some(r=>r.module==="rechnungen")},
 ],[records]);const done=steps.filter(x=>x.done).length;if(hidden||done===steps.length)return null;
 return <section className="workspace-card onboarding-checklist"><div className="section-title"><div><h2>Einrichtung abschliessen</h2><span>{done} von {steps.length} erledigt</span></div><button onClick={()=>{localStorage.setItem("binso-onboarding-hidden","1");setHidden(true)}}>Ausblenden</button></div><div className="onboarding-progress"><span style={{width:`${done/steps.length*100}%`}}/></div><div>{steps.map(x=><Link href={x.href} key={x.label}>{x.done?<CheckCircle2 size={18}/>:<Circle size={18}/>}<span>{x.label}</span><ChevronRight size={16}/></Link>)}</div></section>
}
