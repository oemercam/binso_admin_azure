"use client";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {ArrowRight,Clock3,FileText,FolderKanban,Plus,ReceiptText,Users,WalletCards} from "lucide-react";
import {parseMoney,type LocalRecord} from "@/lib/local-store";
import {listAppRecords} from "@/lib/client/data-service";
import OnboardingChecklist from "@/components/onboarding-checklist";
import {useLocale} from "@/components/locale-provider";

export default function Dashboard(){
 const {t,formatCurrency,formatNumber}=useLocale();
 const [records,setRecords]=useState<LocalRecord[]>([]);
 useEffect(()=>{let active=true;const load=()=>void listAppRecords().then(items=>{if(active)setRecords(items)});const timer=window.setTimeout(load,0);const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);return()=>{active=false;window.clearTimeout(timer);unsubscribe()}},[]);
 const metrics=useMemo(()=>{
   const invoices=records.filter(r=>r.module==="rechnungen");
   const revenue=invoices.filter(r=>["Bezahlt","Teilbezahlt","Offen","Überfällig"].includes(r.status)).reduce((s,r)=>s+Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3])),0);
   const open=invoices.filter(r=>["Offen","Überfällig","Teilbezahlt"].includes(r.status)).reduce((s,r)=>s+Math.max(0,Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3]))-Number(r.meta?.paidAmount||0)),0);
   const hours=records.filter(r=>r.module==="zeiterfassung").reduce((s,r)=>s+(Number(String(r.fields["Dauer in Stunden"]||r.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",","."))||0),0);
   const expenses=records.filter(r=>r.module==="spesen").reduce((s,r)=>s+parseMoney(r.fields["Betrag CHF"]||r.row[3]),0);
   return [{label:"Umsatz",value:formatCurrency(revenue),meta:`${invoices.length} ${t("Rechnungen")}`},{label:"Offen",value:formatCurrency(open),meta:t("inkl. Teilzahlungen")},{label:"Erfasste Zeit",value:`${formatNumber(hours,{minimumFractionDigits:1,maximumFractionDigits:1})} h`,meta:t("Einträge")},{label:"Spesen",value:formatCurrency(expenses),meta:t("Einträge")}];
 },[records,formatCurrency,formatNumber,t]);
 const tasks=records.filter(r=>r.module==="aufgaben"&&r.status!=="Erledigt").slice(0,5);
 const actions=[["/kunden/neu","Kunde",Users],["/offerten/neu","Offerte",FileText],["/projekte/neu","Projekt",FolderKanban],["/zeiterfassung/neu","Zeit",Clock3],["/spesen/neu","Spese",WalletCards],["/rechnungen/neu","Rechnung",ReceiptText]] as const;
 return <div className="page dashboard-page">
  <section className="page-header"><div><div className="eyebrow">{t("Übersicht")}</div><h1>{t("Unternehmensübersicht")}</h1><p>{t("Die wichtigsten Geschäftsdaten, Kennzahlen und offenen Arbeiten auf einen Blick.")}</p></div></section>
  <OnboardingChecklist/><section className="metric-grid">{metrics.map(m=><article className="metric-card" key={m.label}><span>{t(m.label)}</span><strong>{m.value}</strong><small>{m.meta}</small></article>)}</section>
  <section className="dashboard-grid">
   <article className="workspace-card"><div className="section-title"><h2>{t("Schnell erstellen")}</h2><span>{t("Workflow")}</span></div><div className="quick-actions">
    {actions.map(([href,label,Icon])=><Link href={href} key={label}><Icon/><span>{t(label)}</span><Plus/></Link>)}
   </div></article>
   <article className="workspace-card"><div className="section-title"><h2>{t("Offene Aufgaben")}</h2><Link href="/aufgaben">{t("Alle")} <ArrowRight size={15}/></Link></div>{tasks.length?<div className="dashboard-task-list">{tasks.map(item=><Link href={`/aufgaben/${item.id}`} key={item.id}><strong>{item.row[0]}</strong><span>{item.row[1]||t("Intern")}</span><em>{t(item.status)}</em></Link>)}</div>:<div className="empty-state compact"><strong>{t("Keine Aufgaben offen")}</strong><p>{t("Neue Aufgaben können einem Kunden, Projekt oder einer Rechnung zugeordnet werden.")}</p><Link href="/aufgaben/neu">{t("Aufgabe erstellen")}</Link></div>}</article>
  </section>
 </div>
}
