"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {ChevronRight,Download,MoreHorizontal,Plus} from "lucide-react";
import type {ModuleConfig,ModuleKey} from "@/lib/modules";
import {getDemoModuleSeed} from "@/lib/demo/module-seeds";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {ButtonLink} from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {startOfCurrentWeekIso,isoDate} from "@/config/domain";
import {demoBankImportFixtures} from "@/lib/demo/fixtures";
import {money} from "@/lib/local-store";
import {exportCsv,type LocalRecord} from "@/lib/local-store";
import {createAppRecord,listAppRecords} from "@/lib/client/data-service";
import TimeTrackerPanel from "@/components/time-tracking/time-tracker-panel";
import {isProductionMode} from "@/lib/client/runtime";
import {notify} from "@/lib/notify";
import {usePermissions} from "@/lib/client/use-permissions";
import {useLocale} from "@/components/locale-provider";
import {localeTags} from "@/lib/locale-format";
import {IconButton} from "@/components/ui/icon-button";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import ListToolbar from "@/components/ui/list-toolbar";
import {mobileListSecondaryIndexes} from "@/config/mobile-ux";

function badgeClass(value:string){
 const v=value.toLowerCase();
 if(["bezahlt","aktiv","freigegeben","verbucht","abgeschlossen","aktuell","zugeordnet","konfiguriert","bereit","angenommen","versendet","laufend","in arbeit"].some(x=>v.includes(x)))return"status-good";
 if(["überfällig","kritisch","fehler","abgelehnt"].some(x=>v.includes(x)))return"status-bad";
 return"status-neutral";
}

function mobileSecondaryValues(key:ModuleKey,row:string[]){
 const indexes=mobileListSecondaryIndexes[key]||[1];
 return indexes.map(index=>row[index]).filter(value=>value&&value!=="–");
}



export default function ModulePage({config}:{config:ModuleConfig}){
 const permissions=usePermissions();
 const {t,locale}=useLocale();
 const [query,setQuery]=useState("");
 const [local,setLocal]=useState<LocalRecord[]>([]);
 const [statusFilter,setStatusFilter]=useState("Alle");
 const [sort,setSort]=useState<"asc"|"desc">("asc");
 const [view,setView]=useState<"table"|"cards">("table");
 const [timeScope,setTimeScope]=useState<"Woche"|"Monat">("Woche");
 const [actionsOpen,setActionsOpen]=useState(false);

 useEffect(()=>{
  let active=true;
  const load=()=>void listAppRecords(config.key).then(items=>{if(active)setLocal(items)});
  const timer=window.setTimeout(load,0);
  const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);
  return()=>{active=false;window.clearTimeout(timer);unsubscribe()};
 },[config.key]);

 const demoSeed=useMemo(()=>isProductionMode()?undefined:getDemoModuleSeed(config.key),[config.key]);
 const seedRows=useMemo(()=>demoSeed?.rows??[],[demoSeed]);
 const sourceSeedIds=useMemo(()=>new Set(local.map(r=>String(r.meta?.sourceSeed||"")).filter(Boolean)),[local]);
 const statuses=useMemo(()=>Array.from(new Set([...seedRows.map(r=>r[r.length-1]),...local.map(r=>r.status)].filter(Boolean))),[seedRows,local]);
 const rows=useMemo(()=>{
  const seeded=seedRows.map((row,i)=>({row,id:String(i+1),local:false})).filter(x=>!sourceSeedIds.has(`${config.key}:${x.id}`));
  const created=local.map(r=>({row:r.row,id:r.id,local:true}));
  let all=[...created,...seeded];
  const q=query.trim().toLowerCase();
  if(q)all=all.filter(x=>x.row.some(c=>(x.local?String(c):t(String(c))).toLowerCase().includes(q)));
  if(statusFilter!=="Alle")all=all.filter(x=>x.row[x.row.length-1]===statusFilter);
  if(config.key==="zeiterfassung"&&timeScope==="Woche"){
   const weekStart=startOfCurrentWeekIso();
   all=all.filter(x=>{const raw=String(x.row[0]);const iso=raw.includes(".")?raw.split(".").reverse().join("-"):raw;return iso>=weekStart});
  }
  all.sort((a,b)=>sort==="asc"?String(a.row[0]).localeCompare(String(b.row[0]),localeTags[locale]):String(b.row[0]).localeCompare(String(a.row[0]),localeTags[locale]));
  return all;
 },[seedRows,config.key,local,query,statusFilter,sort,sourceSeedIds,timeScope,locale,t]);

 const canCreate=!["berichte","einstellungen","mwst","lohn"].includes(config.key)&&permissions.canModule(config.key,"write");
 const createHref=canCreate?`${config.href}/neu`:config.href;
 const hasFilter=statusFilter!=="Alle";
 const emptyText=query.trim()?t("Keine Ergebnisse gefunden."):hasFilter?t("Keine Einträge entsprechen den gewählten Filtern."):t("Keine Einträge erfasst.");
 function download(){exportCsv(`${config.key}-export.csv`,[...(config.columns||[])],rows.map(r=>r.row));notify(t("CSV-Export erstellt."))}
 async function demoBankImport(){const d=isoDate();for(const item of demoBankImportFixtures){await createAppRecord({module:"zahlungen",status:item.status,row:[d,item.payer,item.reference,money(item.amount),item.status],fields:{Datum:d,Zahler:item.payer,Referenz:item.reference,"Betrag CHF":String(item.amount),Rechnung:item.invoice,Zuordnung:item.status},meta:{source:"ISO 20022 / CAMT Demo"}})}setLocal(await listAppRecords(config.key));notify(t("Bankimport mit 2 Zahlungen erstellt."))}

 return <div className={`page module-page module-${config.key}`}>
  <section className="module-heading mobile-standard-heading">
   <div><h1>{t(config.label)}</h1><p>{t(config.description)}</p></div>
   <div className="module-heading-actions">{config.key==="zahlungen"&&!isProductionMode()&&permissions.canModule("zahlungen","write")&&<Button variant="secondary" onClick={demoBankImport} icon={<Download size={17}/>}>{t("Bankimport Demo")}</Button>}<Button className="module-export-action" variant="secondary" onClick={download} icon={<Download size={17}/>}>{t("Export")}</Button>{config.primaryAction&&canCreate&&<ButtonLink href={createHref} icon={<Plus size={18}/>}>{t(config.primaryAction)}</ButtonLink>}</div>
   <IconButton type="button" className="mobile-page-action" aria-label={t(canCreate&&config.primaryAction?config.primaryAction:"Aktionen")} onClick={()=>setActionsOpen(true)}>{canCreate&&config.primaryAction?<Plus size={20}/>:<MoreHorizontal size={20}/>}</IconButton>
  </section>

  <ResponsiveOverlay open={actionsOpen} title={t("Aktionen")} onClose={()=>setActionsOpen(false)} size="sm">
   <div className="list-sheet-options page-action-sheet">
    {config.primaryAction&&canCreate&&<Link href={createHref} onClick={()=>setActionsOpen(false)}><Plus size={17}/><span>{t(config.primaryAction)}</span></Link>}
    <button type="button" onClick={()=>{download();setActionsOpen(false)}}><Download size={17}/><span>{t("Export")}</span></button>
    {config.key==="zahlungen"&&!isProductionMode()&&permissions.canModule("zahlungen","write")&&<button type="button" onClick={()=>{void demoBankImport();setActionsOpen(false)}}><Download size={17}/><span>{t("Bankimport Demo")}</span></button>}
   </div>
  </ResponsiveOverlay>

  {config.key==="zeiterfassung"&&permissions.canModule("zeiterfassung","write")&&<><TimeTrackerPanel/><div className="time-scope-switch"><button className={timeScope==="Woche"?"active":""} onClick={()=>setTimeScope("Woche")}>{t("Woche")}</button><button className={timeScope==="Monat"?"active":""} onClick={()=>setTimeScope("Monat")}>{t("Monat")}</button></div></>}

  {demoSeed?.stats?.length?<section className="module-stats">{demoSeed.stats.map(s=><article className="stat-card" key={s.label}><span>{t(s.label)}</span><strong>{t(s.value)}</strong>{s.meta&&<small>{t(s.meta)}</small>}</article>)}</section>:null}

  <section className="workspace-card list-workspace-card">
   <ListToolbar query={query} onQueryChange={setQuery} searchPlaceholder={`${t(config.label)} ${t("durchsuchen …")}`} statuses={statuses} statusFilter={statusFilter} onStatusFilter={setStatusFilter} sort={sort} onSort={setSort} view={view} onView={setView}/>

   {view==="table"?<div className="data-table-wrap"><div className="data-table" style={{"--columns":config.columns?.length??5} as React.CSSProperties}><div className="data-row data-head">{config.columns?.map(c=><span key={c}>{t(c)}</span>)}<span/></div>{rows.map(({row,id,local})=>{
    const primary=local?row[0]:t(row[0]);
    const secondary=mobileSecondaryValues(config.key,row).map(value=>local?value:t(value)).join(" · ");
    const status=row[row.length-1];
    return <Link className="data-row" href={`${config.href}/${id}`} key={`${id}-${row[0]}`}>
     <span className="mobile-record-primary">{primary}{local&&<small className="local-tag"> {t("lokal")}</small>}</span>
     <span className="mobile-record-secondary">{secondary}</span>
     <span className={`mobile-record-status ${badgeClass(status)}`}>{t(status)}</span>
     {row.map((cell,ci)=><span className={`desktop-record-cell ${ci===row.length-1?badgeClass(cell):""}`} key={`${cell}-${ci}`}>{local?(ci===row.length-1?t(cell):cell):t(cell)}{local&&ci===0&&<small className="local-tag"> {t("lokal")}</small>}</span>)}
     <ChevronRight className="record-chevron" size={16}/>
    </Link>})}</div></div>:<div className="record-card-grid">{rows.map(({row,id,local})=><Link href={`${config.href}/${id}`} className="record-card" key={`${id}-${row[0]}`}><div><strong>{local?row[0]:t(row[0])}</strong>{local&&<small className="local-tag">{t("lokal")}</small>}</div><p className="record-card-mobile-summary"><span>{mobileSecondaryValues(config.key,row).map(value=>local?value:t(value)).join(" · ")}</span></p>{row.slice(1,-1).map((cell,i)=><p className="record-card-detail" key={`${cell}-${i}`}><span>{t(config.columns?.[i+1]||"")}</span><strong>{local?cell:t(cell)}</strong></p>)}<em className={badgeClass(row[row.length-1])}>{t(row[row.length-1])}</em></Link>)}</div>}
   {rows.length===0&&<div className="empty-state compact-list-empty">{emptyText}</div>}
  </section>
 </div>;
}
