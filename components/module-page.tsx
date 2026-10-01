"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Filter, Grid2X2, List, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { ModuleConfig } from "@/lib/modules";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {ButtonLink} from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/form-controls";
import {startOfCurrentWeekIso,isoDate} from "@/config/domain";
import {demoBankImportFixtures} from "@/lib/demo/fixtures";
import {money} from "@/lib/local-store";
import { exportCsv, type LocalRecord } from "@/lib/local-store";
import { createAppRecord, listAppRecords } from "@/lib/client/data-service";
import TimeTrackerPanel from "@/components/time-tracking/time-tracker-panel";
import { isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";
import { usePermissions } from "@/lib/client/use-permissions";
import {useLocale} from "@/components/locale-provider";
import {localeTags} from "@/lib/locale-format";

function badgeClass(value: string) {
  const v=value.toLowerCase();
  if(["bezahlt","aktiv","freigegeben","verbucht","abgeschlossen","aktuell","zugeordnet","konfiguriert","bereit","angenommen","versendet","laufend","in arbeit"].some(x=>v.includes(x)))return"status-good";
  if(["überfällig","kritisch","fehler","abgelehnt"].some(x=>v.includes(x)))return"status-bad";
  return"status-neutral";
}

export default function ModulePage({config}:{config:ModuleConfig}){
 const permissions=usePermissions();
 const {t,locale}=useLocale();
 const [query,setQuery]=useState('');
 const [local,setLocal]=useState<LocalRecord[]>([]);
 const [filterOpen,setFilterOpen]=useState(false);
 const [statusFilter,setStatusFilter]=useState('Alle');
 const [sort,setSort]=useState<'asc'|'desc'>('asc');
 const [view,setView]=useState<'table'|'cards'>('table');
 const [timeScope,setTimeScope]=useState<'Woche'|'Monat'>('Woche');

 useEffect(()=>{
   let active=true;
   const load=()=>void listAppRecords(config.key).then(items=>{if(active)setLocal(items)});
   const timer=window.setTimeout(load,0);
   const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);
   return()=>{active=false;window.clearTimeout(timer);unsubscribe()};
 },[config.key]);

 const demoSeed=useMemo(()=>isProductionMode()?undefined:getDemoModuleSeed(config.key),[config.key]);
 const seedRows=useMemo(()=>demoSeed?.rows??[],[demoSeed]);
 const sourceSeedIds=useMemo(()=>new Set(local.map(r=>String(r.meta?.sourceSeed||'')).filter(Boolean)),[local]);
 const statuses=useMemo(()=>Array.from(new Set([...seedRows.map(r=>r[r.length-1]),...local.map(r=>r.status)].filter(Boolean))),[seedRows,local]);
 const rows=useMemo(()=>{
   const seeded=seedRows.map((row,i)=>({row,id:String(i+1),local:false})).filter(x=>!sourceSeedIds.has(`${config.key}:${x.id}`));
   const created=local.map(r=>({row:r.row,id:r.id,local:true}));
   let all=[...created,...seeded];
   const q=query.trim().toLowerCase();
   if(q) all=all.filter(x=>x.row.some(c=>(x.local?String(c):t(String(c))).toLowerCase().includes(q)));
   if(statusFilter!=='Alle') all=all.filter(x=>x.row[x.row.length-1]===statusFilter);
   if(config.key==='zeiterfassung'&&timeScope==='Woche'){const weekStart=startOfCurrentWeekIso();all=all.filter(x=>{const raw=String(x.row[0]);const iso=raw.includes('.')?raw.split('.').reverse().join('-'):raw;return iso>=weekStart})}
   all.sort((a,b)=>sort==='asc'?String(a.row[0]).localeCompare(String(b.row[0]),localeTags[locale]):String(b.row[0]).localeCompare(String(a.row[0]),localeTags[locale]));
   return all;
 },[seedRows,config.key,local,query,statusFilter,sort,sourceSeedIds,timeScope,locale,t]);

 const canCreate=!['berichte','einstellungen','mwst','lohn'].includes(config.key)&&permissions.canModule(config.key,'write');
 const createHref=canCreate?`${config.href}/neu`:config.href;
 function download(){ exportCsv(`${config.key}-export.csv`,[...(config.columns||[])],rows.map(r=>r.row)); notify(t('CSV-Export erstellt.')); }
 async function demoBankImport(){const d=isoDate();for(const item of demoBankImportFixtures){await createAppRecord({module:'zahlungen',status:item.status,row:[d,item.payer,item.reference,money(item.amount),item.status],fields:{Datum:d,Zahler:item.payer,Referenz:item.reference,'Betrag CHF':String(item.amount),Rechnung:item.invoice,Zuordnung:item.status},meta:{source:'ISO 20022 / CAMT Demo'}})}setLocal(await listAppRecords(config.key));notify(t('Bankimport mit 2 Zahlungen erstellt.'))}


 return <div className={`page module-page module-${config.key}`}>
  <section className="module-heading"><div><div className="eyebrow">Binso One</div><h1>{t(config.label)}</h1><p>{t(config.description)}</p></div><div className="module-heading-actions">{config.key==='zahlungen'&&!isProductionMode()&&permissions.canModule('zahlungen','write')&&<Button variant="secondary" onClick={demoBankImport} icon={<Download size={17}/>}>{t("Bankimport Demo")}</Button>}<Button className="module-export-action" variant="secondary" onClick={download} icon={<Download size={17}/>}>{t("Export")}</Button>{config.primaryAction&&<ButtonLink href={createHref} icon={<Plus size={18}/>}>{t(config.primaryAction)}</ButtonLink>}</div></section>

  {config.key==='zeiterfassung'&&permissions.canModule('zeiterfassung','write')&&<><TimeTrackerPanel/><div className="time-scope-switch"><button className={timeScope==='Woche'?'active':''} onClick={()=>setTimeScope('Woche')}>{t("Woche")}</button><button className={timeScope==='Monat'?'active':''} onClick={()=>setTimeScope('Monat')}>{t("Monat")}</button></div></>}

  {demoSeed?.stats?.length?<section className="module-stats">{demoSeed.stats.map(s=><article className="stat-card" key={s.label}><span>{t(s.label)}</span><strong>{t(s.value)}</strong>{s.meta&&<small>{t(s.meta)}</small>}</article>)}</section>:null}

  <section className="workspace-card">
   <div className="workspace-toolbar"><div className="table-search"><Search size={17}/><Input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`${t(config.label)} ${t("durchsuchen …")}`}/>{query&&<button className="search-clear" onClick={()=>setQuery('')}><X size={15}/></button>}</div><div className="toolbar-actions"><div className="filter-wrap"><button className={statusFilter!=='Alle'?'active-filter':''} onClick={()=>setFilterOpen(v=>!v)}><Filter size={17}/>{t("Filter")}</button>{filterOpen&&<div className="filter-popover"><strong>{t("Status")}</strong><button className={statusFilter==='Alle'?'selected':''} onClick={()=>{setStatusFilter('Alle');setFilterOpen(false)}}>{t("Alle")}</button>{statuses.map(s=><button className={statusFilter===s?'selected':''} key={s} onClick={()=>{setStatusFilter(s);setFilterOpen(false)}}>{t(s)}</button>)}</div>}</div><button onClick={()=>setSort(v=>v==='asc'?'desc':'asc')}><SlidersHorizontal size={17}/>{sort==='asc'?'A–Z':'Z–A'}</button><button aria-label={t("Ansicht wechseln")} onClick={()=>setView(v=>v==='table'?'cards':'table')}>{view==='table'?<Grid2X2 size={17}/>:<List size={17}/> }{t("Ansicht")}</button></div></div>

   {view==='table'?<div className="data-table-wrap"><div className="data-table" style={{"--columns":config.columns?.length??5} as React.CSSProperties}><div className="data-row data-head">{config.columns?.map(c=><span key={c}>{t(c)}</span>)}<span/></div>{rows.map(({row,id,local})=><Link className="data-row" href={`${config.href}/${id}`} key={`${id}-${row[0]}`}>{row.map((cell,ci)=><span key={`${cell}-${ci}`} data-col={config.columns?.[ci]||""} className={ci===row.length-1?badgeClass(cell):''}>{local?(ci===row.length-1?t(cell):cell):t(cell)}{local&&ci===0&&<small className="local-tag"> {t("lokal")}</small>}</span>)}<ChevronRight size={16}/></Link>)}</div></div>:<div className="record-card-grid">{rows.map(({row,id,local})=><Link href={`${config.href}/${id}`} className="record-card" key={`${id}-${row[0]}`}><div><strong>{local?row[0]:t(row[0])}</strong>{local&&<small className="local-tag">{t("lokal")}</small>}</div>{row.slice(1,-1).map((cell,i)=><p key={`${cell}-${i}`}><span>{t(config.columns?.[i+1]||"")}</span><strong>{local?cell:t(cell)}</strong></p>)}<em className={badgeClass(row[row.length-1])}>{t(row[row.length-1])}</em></Link>)}</div>}
   {rows.length===0&&<div className="empty-state">{t("Noch keine Einträge. Nutzen Sie die Aktion oben, um den ersten Datensatz zu erfassen.")}</div>}
  </section>
 </div>
}
