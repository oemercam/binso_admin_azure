"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Filter, Grid2X2, List, Pause, Play, Plus, Search, SlidersHorizontal, Square, X } from "lucide-react";
import type { ModuleConfig } from "@/lib/modules";
import { exportCsv, type LocalRecord } from "@/lib/local-store";
import { createAppRecord, listAppRecords } from "@/lib/client/data-service";
import { isProductionMode } from "@/lib/client/runtime";
import { notify } from "@/lib/notify";
import { usePermissions } from "@/lib/client/use-permissions";

function badgeClass(value: string) {
  const v=value.toLowerCase();
  if(["bezahlt","aktiv","freigegeben","verbucht","abgeschlossen","aktuell","zugeordnet","konfiguriert","bereit","angenommen","versendet","laufend","in arbeit"].some(x=>v.includes(x)))return"status-good";
  if(["überfällig","kritisch","fehler","abgelehnt"].some(x=>v.includes(x)))return"status-bad";
  return"status-neutral";
}

export default function ModulePage({config}:{config:ModuleConfig}){
 const permissions=usePermissions();
 const [query,setQuery]=useState('');
 const [local,setLocal]=useState<LocalRecord[]>([]);
 const [timerRunning,setTimerRunning]=useState(false);
 const [seconds,setSeconds]=useState(0);
 const [filterOpen,setFilterOpen]=useState(false);
 const [statusFilter,setStatusFilter]=useState('Alle');
 const [sort,setSort]=useState<'asc'|'desc'>('asc');
 const [view,setView]=useState<'table'|'cards'>('table');
 const [timeScope,setTimeScope]=useState<'Woche'|'Monat'>('Woche');

 useEffect(()=>{
   let active=true;
   const load=()=>void listAppRecords(config.key).then(items=>{if(active)setLocal(items)});
   const timer=window.setTimeout(load,0);
   window.addEventListener('binso-data-changed',load);
   return()=>{active=false;window.clearTimeout(timer);window.removeEventListener('binso-data-changed',load)};
 },[config.key]);
 useEffect(()=>{if(!timerRunning)return; const t=window.setInterval(()=>setSeconds(s=>s+1),1000); return()=>window.clearInterval(t)},[timerRunning]);

 const sourceSeedIds=useMemo(()=>new Set(local.map(r=>String(r.meta?.sourceSeed||'')).filter(Boolean)),[local]);
 const statuses=useMemo(()=>Array.from(new Set([...(config.rows||[]).map(r=>r[r.length-1]),...local.map(r=>r.status)].filter(Boolean))),[config.rows,local]);
 const rows=useMemo(()=>{
   const seeded=isProductionMode()?[]:(config.rows||[]).map((row,i)=>({row,id:String(i+1),local:false})).filter(x=>!sourceSeedIds.has(`${config.key}:${x.id}`));
   const created=local.map(r=>({row:r.row,id:r.id,local:true}));
   let all=[...created,...seeded];
   const q=query.trim().toLowerCase();
   if(q) all=all.filter(x=>x.row.some(c=>String(c).toLowerCase().includes(q)));
   if(statusFilter!=='Alle') all=all.filter(x=>x.row[x.row.length-1]===statusFilter);
   if(config.key==='zeiterfassung'&&timeScope==='Woche'){all=all.filter(x=>{const raw=String(x.row[0]);const iso=raw.includes('.')?raw.split('.').reverse().join('-'):raw;return iso>='2026-09-22'})}
   all.sort((a,b)=>sort==='asc'?String(a.row[0]).localeCompare(String(b.row[0]),'de'):String(b.row[0]).localeCompare(String(a.row[0]),'de'));
   return all;
 },[config.rows,config.key,local,query,statusFilter,sort,sourceSeedIds,timeScope]);

 const canCreate=!['berichte','einstellungen','mwst','lohn'].includes(config.key)&&permissions.canModule(config.key,'write');
 const createHref=canCreate?`${config.href}/neu`:config.href;
 async function stopTimer(){
   if(seconds>0){
     const hours=(seconds/3600).toFixed(2);
     const today=new Date().toISOString().slice(0,10);
     await createAppRecord({module:'zeiterfassung',status:'Entwurf',row:[today,'Intern','Live-Timer',`${hours} h`,'Entwurf'],fields:{Datum:today,Projekt:'Intern',Leistung:'Live-Timer',Dauer:`${hours} h`,Verrechenbar:'Nein',Status:'Entwurf'}});
     setSeconds(0);setTimerRunning(false);setLocal(await listAppRecords(config.key));notify('Timer als Zeiteintrag gespeichert.');
   }
 }
 function download(){ exportCsv(`${config.key}-export.csv`,[...(config.columns||[])],rows.map(r=>r.row)); notify('CSV-Export erstellt.'); }
 async function demoBankImport(){const d=new Date().toISOString().slice(0,10);await createAppRecord({module:'zahlungen',status:'Zugeordnet',row:[d,'Müller Bau AG','CAMT-DEMO-001','CHF 4’850.00','Zugeordnet'],fields:{Datum:d,Zahler:'Müller Bau AG',Referenz:'CAMT-DEMO-001','Betrag CHF':'4850',Rechnung:'R-2026-0184',Zuordnung:'Zugeordnet'},meta:{source:'ISO 20022 / CAMT Demo'}});await createAppRecord({module:'zahlungen',status:'Offen',row:[d,'Unbekannt','CAMT-DEMO-002','CHF 360.00','Offen'],fields:{Datum:d,Zahler:'Unbekannt',Referenz:'CAMT-DEMO-002','Betrag CHF':'360',Rechnung:'',Zuordnung:'Offen'},meta:{source:'ISO 20022 / CAMT Demo'}});setLocal(await listAppRecords(config.key));notify('Bankimport mit 2 Zahlungen erstellt.')}

 const hh=String(Math.floor(seconds/3600)).padStart(2,'0'), mm=String(Math.floor((seconds%3600)/60)).padStart(2,'0'), ss=String(seconds%60).padStart(2,'0');

 return <div className="page module-page">
  <section className="module-heading"><div><div className="eyebrow">Binso One</div><h1>{config.label}</h1><p>{config.description}</p></div><div className="module-heading-actions">{config.key==='zahlungen'&&!isProductionMode()&&permissions.canModule('zahlungen','write')&&<button className="secondary-inline" onClick={demoBankImport}><Download size={17}/>Bankimport Demo</button>}<button className="secondary-inline" onClick={download}><Download size={17}/>Export</button>{config.primaryAction&&<Link className="primary-link" href={createHref}><Plus size={18}/>{config.primaryAction}</Link>}</div></section>

  {config.key==='zeiterfassung'&&permissions.canModule('zeiterfassung','write')&&<><section className="timer-strip workspace-card"><div><span>Live-Timer</span><strong>{hh}:{mm}:{ss}</strong><small>Projekt: Intern · Leistung: Live-Timer</small></div><div><button onClick={()=>setTimerRunning(v=>!v)}>{timerRunning?<Pause size={17}/>:<Play size={17}/>} {timerRunning?'Pause':'Start'}</button><button onClick={stopTimer} disabled={seconds===0}><Square size={17}/>Stop & speichern</button></div></section><div className="time-scope-switch"><button className={timeScope==='Woche'?'active':''} onClick={()=>setTimeScope('Woche')}>Woche</button><button className={timeScope==='Monat'?'active':''} onClick={()=>setTimeScope('Monat')}>Monat</button></div></>}

  <section className="module-stats">{config.stats?.map(s=><article className="stat-card" key={s.label}><span>{s.label}</span><strong>{s.value}</strong>{s.meta&&<small>{s.meta}</small>}</article>)}</section>

  <section className="workspace-card">
   <div className="workspace-toolbar"><div className="table-search"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={`${config.label} durchsuchen …`}/>{query&&<button className="search-clear" onClick={()=>setQuery('')}><X size={15}/></button>}</div><div className="toolbar-actions"><div className="filter-wrap"><button className={statusFilter!=='Alle'?'active-filter':''} onClick={()=>setFilterOpen(v=>!v)}><Filter size={17}/>Filter</button>{filterOpen&&<div className="filter-popover"><strong>Status</strong><button className={statusFilter==='Alle'?'selected':''} onClick={()=>{setStatusFilter('Alle');setFilterOpen(false)}}>Alle</button>{statuses.map(s=><button className={statusFilter===s?'selected':''} key={s} onClick={()=>{setStatusFilter(s);setFilterOpen(false)}}>{s}</button>)}</div>}</div><button onClick={()=>setSort(v=>v==='asc'?'desc':'asc')}><SlidersHorizontal size={17}/>{sort==='asc'?'A–Z':'Z–A'}</button><button aria-label="Ansicht wechseln" onClick={()=>setView(v=>v==='table'?'cards':'table')}>{view==='table'?<Grid2X2 size={17}/>:<List size={17}/>}Ansicht</button></div></div>

   {view==='table'?<div className="data-table-wrap"><div className="data-table" style={{"--columns":config.columns?.length??5} as React.CSSProperties}><div className="data-row data-head">{config.columns?.map(c=><span key={c}>{c}</span>)}<span/></div>{rows.map(({row,id,local})=><Link className="data-row" href={`${config.href}/${id}`} key={`${id}-${row[0]}`}>{row.map((cell,ci)=><span key={`${cell}-${ci}`} className={ci===row.length-1?badgeClass(cell):''}>{cell}{local&&ci===0&&<small className="local-tag"> lokal</small>}</span>)}<ChevronRight size={16}/></Link>)}</div></div>:<div className="record-card-grid">{rows.map(({row,id,local})=><Link href={`${config.href}/${id}`} className="record-card" key={`${id}-${row[0]}`}><div><strong>{row[0]}</strong>{local&&<small className="local-tag">lokal</small>}</div>{row.slice(1,-1).map((cell,i)=><p key={`${cell}-${i}`}><span>{config.columns?.[i+1]}</span><strong>{cell}</strong></p>)}<em className={badgeClass(row[row.length-1])}>{row[row.length-1]}</em></Link>)}</div>}
   {rows.length===0&&<div className="empty-state">Noch keine Einträge. Nutzen Sie die Aktion oben, um den ersten Datensatz zu erfassen.</div>}
  </section>
 </div>
}
