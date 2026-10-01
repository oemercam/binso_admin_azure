"use client";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import Link from "next/link";
import {useEffect,useMemo,useState} from "react";
import {ArrowRight,Clock3,FileText,FolderKanban,Plus,ReceiptText,Users,WalletCards} from "lucide-react";
import {mobileMoreNavigation} from "@/config/navigation";
import {usePermissions} from "@/lib/client/use-permissions";
import {loadAppPreferences,loadSettings,parseMoney,type LocalRecord} from "@/lib/local-store";
import {listAppRecords} from "@/lib/client/data-service";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import OnboardingChecklist from "@/components/onboarding-checklist";
import {useLocale} from "@/components/locale-provider";
import MobileModuleLauncher from "@/components/mobile/mobile-module-launcher";

type DashboardUser={name:string};

export default function Dashboard(){
 const {t,formatCurrency,formatNumber}=useLocale();
 const permissions=usePermissions();
 const [records,setRecords]=useState<LocalRecord[]>([]);
 const [userName,setUserName]=useState("");
 useEffect(()=>{let active=true;const load=()=>void listAppRecords().then(items=>{if(active)setRecords(items)});const timer=window.setTimeout(load,0);const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);return()=>{active=false;window.clearTimeout(timer);unsubscribe()}},[]);
 useEffect(()=>{let active=true;const timer=window.setTimeout(()=>{if(isProductionMode()){void apiFetch<{user:DashboardUser}>("/api/me").then(result=>{if(active)setUserName(result.user?.name||"")}).catch(()=>{})}else{const pref=loadAppPreferences();const settings=loadSettings();const user=settings.users.find(item=>item.id===pref.activeUserId)||settings.users[0];setUserName(user?.name||"")}},0);return()=>{active=false;window.clearTimeout(timer)}},[]);
 const summary=useMemo(()=>{
  const invoices=records.filter(r=>r.module==="rechnungen");
  const revenue=invoices.filter(r=>["Bezahlt","Teilbezahlt","Offen","Überfällig"].includes(r.status)).reduce((s,r)=>s+Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3])),0);
  const openInvoices=invoices.filter(r=>["Offen","Überfällig","Teilbezahlt"].includes(r.status));
  const open=openInvoices.reduce((s,r)=>s+Math.max(0,Number(r.meta?.gross||parseMoney(r.fields.Betrag||r.row[3]))-Number(r.meta?.paidAmount||0)),0);
  const timeRecords=records.filter(r=>r.module==="zeiterfassung");
  const hours=timeRecords.reduce((s,r)=>s+(Number(String(r.fields["Dauer in Stunden"]||r.row[3]||"0").replace(/[^0-9.,]/g,"").replace(",","."))||0),0);
  const expenseRecords=records.filter(r=>r.module==="spesen");
  const expenses=expenseRecords.reduce((s,r)=>s+parseMoney(r.fields["Betrag CHF"]||r.row[3]),0);
  const overdue=invoices.filter(r=>r.status==="Überfällig").length;
  const drafts=records.filter(r=>r.module==="offerten"&&r.status==="Entwurf").length;
  const openTasks=records.filter(r=>r.module==="aufgaben"&&r.status!=="Erledigt").length;
  return {metrics:[
   {label:"Zeiterfassung",value:`${formatNumber(hours,{minimumFractionDigits:1,maximumFractionDigits:1})} h`,meta:t("Heute")},
   {label:"Offerten",value:String(drafts),meta:t("Offen")},
   {label:"Rechnungen",value:String(openInvoices.length),meta:formatCurrency(open)},
   {label:"Aufgaben",value:String(openTasks),meta:t("Offen")}
  ],desktopMetrics:[
   {label:"Umsatz",value:formatCurrency(revenue),meta:`${invoices.length} ${t("Rechnungen")}`},
   {label:"Offene Rechnungen",value:formatCurrency(open),meta:`${openInvoices.length} ${t(openInvoices.length===1?"Rechnung":"Rechnungen")}`},
   {label:"Zeit",value:`${formatNumber(hours,{minimumFractionDigits:1,maximumFractionDigits:1})} h`,meta:`${timeRecords.length} ${t("Einträge")}`},
   {label:"Ausgaben",value:formatCurrency(expenses),meta:`${expenseRecords.length} ${t("Einträge")}`}
  ],overdue,drafts,openTasks};
 },[records,formatCurrency,formatNumber,t]);
 const tasks=records.filter(r=>r.module==="aufgaben"&&r.status!=="Erledigt").slice(0,5);
 const recent=records.slice().sort((a,b)=>String(b.updatedAt||b.createdAt||"").localeCompare(String(a.updatedAt||a.createdAt||""))).slice(0,5);
 const attention=[
  summary.overdue?{href:"/rechnungen",label:`${summary.overdue} ${t(summary.overdue===1?"überfällige Rechnung":"überfällige Rechnungen")}`}:null,
  summary.drafts?{href:"/offerten",label:`${summary.drafts} ${t(summary.drafts===1?"offener Entwurf":"offene Entwürfe")}`}:null,
  summary.openTasks?{href:"/aufgaben",label:`${summary.openTasks} ${t(summary.openTasks===1?"offene Aufgabe":"offene Aufgaben")}`}:null
 ].filter(Boolean) as {href:string;label:string}[];
 const actions=[["/kunden/neu","Kunde",Users],["/offerten/neu","Offerte",FileText],["/rechnungen/neu","Rechnung",ReceiptText],["/zeiterfassung/neu","Zeit",Clock3],["/projekte/neu","Projekt",FolderKanban],["/spesen/neu","Spese",WalletCards]] as const;
 return <div className="page dashboard-page">
  <section className="page-header dashboard-heading"><div><h1><span className="desktop-heading-label">{t("Unternehmensübersicht")}</span><span className="mobile-heading-label">{t("Guten Tag")}</span></h1><p>{t("Die wichtigsten Geschäftsdaten, Kennzahlen und offenen Arbeiten auf einen Blick.")}</p><span className="mobile-dashboard-user">{userName}</span></div><MobileModuleLauncher/></section>
  <div className="mobile-dashboard-content">
   <OnboardingChecklist/>
   <section className="mobile-dashboard-today"><span>{t("Heute")}</span></section>
   <section className="mobile-dashboard-kpis">{summary.metrics.map((m,index)=><Link href={index===0?"/zeiterfassung":index===1?"/offerten":index===2?"/rechnungen":"/aufgaben"} className="mobile-dashboard-kpi" key={m.label}><span>{t(m.label)}</span><strong>{m.value}</strong><small>{m.meta}</small></Link>)}</section>
   <section className="mobile-dashboard-section"><div className="mobile-section-heading"><h2>{t("Letzte Aktivitäten")}</h2></div><div className="mobile-activity-list">{recent.length?recent.map(item=><Link href={`/${item.module}/${item.id}`} key={item.id}><span className="mobile-activity-icon">{item.module==="rechnungen"?<ReceiptText size={16}/>:item.module==="zeiterfassung"?<Clock3 size={16}/>:item.module==="projekte"?<FolderKanban size={16}/>:<FileText size={16}/>}</span><span><strong>{item.row[0]||t("Eintrag")}</strong><small>{t(item.module)} · {t(item.status)}</small></span><ArrowRight size={15}/></Link>):<p className="mobile-dashboard-empty">{t("Noch keine Aktivitäten vorhanden.")}</p>}</div></section>
   {attention.length>0&&<section className="mobile-dashboard-section"><div className="mobile-section-heading"><h2>{t("Zu erledigen")}</h2></div><div className="mobile-activity-list">{attention.map(item=><Link href={item.href} key={item.href}><span>{item.label}</span><ArrowRight size={15}/></Link>)}</div></section>}
  </div>

  <div className="desktop-dashboard-content">
   <OnboardingChecklist/>
   <section className="mobile-module-overview" aria-label={t("Bereiche")}><div className="section-title"><h2>{t("Bereiche")}</h2></div><div className="mobile-module-groups">{mobileMoreNavigation.map(group=>{const items=group.items.filter(item=>permissions.canModule(item.href.slice(1),"read"));if(!items.length)return null;return <div className="mobile-module-group" key={group.label}><h3>{t(group.label)}</h3>{items.map(item=>{const Icon=item.icon;return <Link href={item.href} key={item.href}><Icon size={18}/><span>{t(item.label)}</span><ArrowRight size={15}/></Link>})}</div>})}</div></section>
   <section className="metric-grid dashboard-kpi-grid">{summary.desktopMetrics.map(m=><article className="metric-card" key={m.label}><span>{t(m.label)}</span><strong>{m.value}</strong><small>{m.meta}</small></article>)}</section>
   {attention.length>0&&<section className="dashboard-attention"><div className="section-title"><h2>{t("Zu erledigen")}</h2><Link href="/aufgaben">{t("Alle")} <ArrowRight size={15}/></Link></div><div className="attention-list">{attention.map(item=><Link href={item.href} key={item.href}><span>{item.label}</span><ArrowRight size={15}/></Link>)}</div></section>}
   <section className="dashboard-grid"><article className="workspace-card dashboard-quick-card"><div className="section-title"><h2>{t("Schnell erstellen")}</h2></div><div className="quick-actions dashboard-quick-actions">{actions.map(([href,label,Icon])=><Link href={href} key={label}><Icon/><span>{t(label)}</span><Plus/></Link>)}</div></article><article className="workspace-card dashboard-tasks-card"><div className="section-title"><h2>{t("Offene Aufgaben")}</h2><Link href="/aufgaben">{t("Alle")} <ArrowRight size={15}/></Link></div>{tasks.length?<div className="dashboard-task-list">{tasks.map(item=><Link href={`/aufgaben/${item.id}`} key={item.id}><strong>{item.row[0]}</strong><span>{item.row[1]||t("Intern")}</span><em>{t(item.status)}</em></Link>)}</div>:null}</article></section>
  </div>
 </div>;
}
