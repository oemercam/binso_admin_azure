"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, FileText, FolderKanban, Plus, ReceiptText, Users, WalletCards } from "lucide-react";
import { money, parseMoney, type LocalRecord } from "@/lib/local-store";
import { listAppRecords } from "@/lib/client/data-service";
import OnboardingChecklist from "@/components/onboarding-checklist";

export default function Dashboard(){
 const [records,setRecords]=useState<LocalRecord[]>([]);
 useEffect(()=>{let active=true;const load=()=>void listAppRecords().then(items=>{if(active)setRecords(items)});const timer=window.setTimeout(load,0);window.addEventListener("binso-data-changed",load);return()=>{active=false;window.clearTimeout(timer);window.removeEventListener("binso-data-changed",load)}},[]);
 const metrics=useMemo(()=>{
   const invoices=records.filter(r=>r.module==="rechnungen");
   const revenue=invoices.filter(r=>["Bezahlt","Teilbezahlt","Offen","Überfällig"].includes(r.status)).reduce((s,r)=>s+Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3])),0);
   const open=invoices.filter(r=>["Offen","Überfällig","Teilbezahlt"].includes(r.status)).reduce((s,r)=>s+Math.max(0,Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3]))-Number(r.meta?.paidAmount||0)),0);
   const hours=records.filter(r=>r.module==="zeiterfassung").reduce((s,r)=>s+(Number(String(r.fields["Dauer in Stunden"]||r.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",","."))||0),0);
   const expenses=records.filter(r=>r.module==="spesen").reduce((s,r)=>s+parseMoney(r.fields["Betrag CHF"]||r.row[3]),0);
   return [{label:"Umsatz",value:money(revenue),meta:`${invoices.length} Rechnungen`},{label:"Offen",value:money(open),meta:"inkl. Teilzahlungen"},{label:"Erfasste Zeit",value:`${hours.toFixed(1)} h`,meta:"Einträge"},{label:"Spesen",value:money(expenses),meta:"Einträge"}];
 },[records]);
 const tasks=records.filter(r=>r.module==="aufgaben"&&r.status!=="Erledigt").slice(0,5);
 return <div className="page dashboard-page">
  <section className="page-header"><div><div className="eyebrow">Übersicht</div><h1>Unternehmensübersicht</h1><p>Die wichtigsten Geschäftsdaten, Kennzahlen und offenen Arbeiten auf einen Blick.</p></div></section>
  <OnboardingChecklist/><section className="metric-grid">{metrics.map(m=><article className="metric-card" key={m.label}><span>{m.label}</span><strong>{m.value}</strong><small>{m.meta}</small></article>)}</section>
  <section className="dashboard-grid">
   <article className="workspace-card"><div className="section-title"><h2>Schnell erstellen</h2><span>Workflow</span></div><div className="quick-actions">
    <Link href="/kunden/neu"><Users/><span>Kunde</span><Plus/></Link><Link href="/offerten/neu"><FileText/><span>Offerte</span><Plus/></Link><Link href="/projekte/neu"><FolderKanban/><span>Projekt</span><Plus/></Link><Link href="/zeiterfassung/neu"><Clock3/><span>Zeit</span><Plus/></Link><Link href="/spesen/neu"><WalletCards/><span>Spese</span><Plus/></Link><Link href="/rechnungen/neu"><ReceiptText/><span>Rechnung</span><Plus/></Link>
   </div></article>
   <article className="workspace-card"><div className="section-title"><h2>Offene Aufgaben</h2><Link href="/aufgaben">Alle <ArrowRight size={15}/></Link></div>{tasks.length?<div className="dashboard-task-list">{tasks.map(t=><Link href={`/aufgaben/${t.id}`} key={t.id}><strong>{t.row[0]}</strong><span>{t.row[1]||"Intern"}</span><em>{t.status}</em></Link>)}</div>:<div className="empty-state compact"><strong>Keine Aufgaben offen</strong><p>Neue Aufgaben können einem Kunden, Projekt oder einer Rechnung zugeordnet werden.</p><Link href="/aufgaben/neu">Aufgabe erstellen</Link></div>}</article>
  </section>
 </div>
}
