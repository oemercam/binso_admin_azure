"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon, Status } from "./ui";

function tone(status: string): "success" | "danger" | "warning" | "neutral" | "info" {
  if (["Bezahlt","Aktiv","Genehmigt","Angenommen","Verbucht","Gelöst"].includes(status)) return "success";
  if (["Überfällig","Abgelehnt","Abgelaufen"].includes(status)) return "danger";
  if (["Offen","Teilweise bezahlt","Eingereicht","Gesendet","Ausstehend"].includes(status)) return "warning";
  if (["In Bearbeitung"].includes(status)) return "info";
  return "neutral";
}

export function RecordsView({
  items,
  placeholder,
  chips = ["Alle","Aktiv","Inaktiv"],
  children,
  loading=false,
  error=null,
  statusGroups={},
  columns,
  rowHref,
}: {
  items: string[][];
  placeholder: string;
  chips?: string[];
  loading?: boolean;
  error?: string|null;
  statusGroups?: Record<string,string[]>;
  columns?: Array<{label:string;index:number;align?:"left"|"right";status?:boolean}>;
  rowHref?: (item:string[])=>string|undefined;
  children: (item: string[]) => React.ReactNode;
}) {
  const [query,setQuery]=useState("");
  const [activeChip,setActiveChip]=useState(chips[0] ?? "Alle");
  const [sort,setSort]=useState<"default"|"asc"|"desc">("default");
  const [sortIndex,setSortIndex]=useState(0);

  const chipsKey=JSON.stringify(chips);
  const [restored,setRestored]=useState(false);
  useEffect(()=>{const storedChips:string[]=JSON.parse(chipsKey);try{const saved=JSON.parse(window.sessionStorage.getItem("binso.list:"+window.location.pathname)??"null");if(saved){queueMicrotask(()=>{setQuery(typeof saved.query==="string"?saved.query:"");setActiveChip(storedChips.includes(saved.activeChip)?saved.activeChip:storedChips[0]??"Alle");setSort(["default","asc","desc"].includes(saved.sort)?saved.sort:"default");setSortIndex(Number.isInteger(saved.sortIndex)?saved.sortIndex:0);setRestored(true);});return;}}catch{}queueMicrotask(()=>setRestored(true));},[chipsKey]);
  useEffect(()=>{if(!restored)return;try{window.sessionStorage.setItem("binso.list:"+window.location.pathname,JSON.stringify({query,activeChip,sort,sortIndex}));}catch{}},[restored,query,activeChip,sort,sortIndex]);

  const normalizedChip=(value:string)=>value.toLowerCase().replace(/e?n$/, "");

  const visible=useMemo(()=>{
    const filtered=items.filter(item=>{
      const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
      const state=item.at(-1) ?? "";
      const type=item[1] ?? "";
      const matchesChip=activeChip==="Alle" || state===activeChip || statusGroups[activeChip]?.includes(state) || normalizedChip(type).startsWith(normalizedChip(activeChip)) || normalizedChip(activeChip).startsWith(normalizedChip(type));
      return matchesQuery && matchesChip;
    });

    if(sort==="default") return filtered;
    return [...filtered].sort((a,b)=>{
      const left=a[sortIndex]??"",right=b[sortIndex]??"";
      const numeric=(value:string)=>Number(value.replace(/CHF|['’\s%]/g,"").replace(",","."));
      const date=(value:string)=>{const match=value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);return match?Number(match[3]+match[2]+match[1]):null;};
      const dates=[date(left),date(right)];
      const result=dates[0]!==null&&dates[1]!==null?dates[0]-dates[1]:/^(CHF|\d+[.,]\d+|\d+%)/.test(left)&&Number.isFinite(numeric(left))&&Number.isFinite(numeric(right))?numeric(left)-numeric(right):left.localeCompare(right,"de-CH",{numeric:true,sensitivity:"base"});
      return sort==="asc" ? result : -result;
    });
  },[activeChip,items,query,sort,sortIndex,statusGroups]);

  const reset=()=>{
    setQuery("");
    setActiveChip(chips[0] ?? "Alle");
    setSort("default");
  };

  const cycleSort=(index=0)=>{if(sortIndex!==index){setSortIndex(index);setSort("asc");return;}setSort(current=>current==="default"?"asc":current==="asc"?"desc":"default")};
  const hasFilters=query.trim().length>0 || activeChip!==(chips[0]??"Alle") || sort!=="default";

  return <>
    <div className="toolbar">
      <label className="searchbox"><Icon name="search"/><input aria-label={placeholder} value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></label>
      <div className="chips">{chips.map((chip)=><button type="button" onClick={()=>setActiveChip(chip)} className={chip===activeChip?"active":""} key={chip}>{chip}</button>)}</div>
      <button className={`filter-button ${sort!=="default"?"active":""}`} type="button" onClick={()=>cycleSort()} title="Sortierung wechseln" aria-label={sort==="asc"?"Sortierung A bis Z":sort==="desc"?"Sortierung Z bis A":"Sortierung einschalten"}><Icon name="filter" size={17}/><span>{sort==="asc"?"A–Z":sort==="desc"?"Z–A":"Sortieren"}</span></button>
      <span className="records-count" aria-live="polite">{loading?"Wird geladen…":`${visible.length} ${visible.length===1?"Eintrag":"Einträge"}`}</span>
      {hasFilters&&<button className="toolbar-reset" type="button" onClick={reset}>Zurücksetzen</button>}
    </div>

    {loading?<p role="status">Einträge werden geladen …</p>:error?<p role="alert">{error}</p>:visible.length ? <><div className="desktop-record-table" role="table" aria-label={placeholder.replace(/ suchen.*$/,"")}>{columns&&<div className="desktop-record-head" role="row" style={{gridTemplateColumns:`repeat(${columns.length},minmax(0,1fr)) 28px`}}>{columns.map(col=><button type="button" role="columnheader" aria-sort={sortIndex===col.index&&sort!=="default"?(sort==="asc"?"ascending":"descending"):"none"} className={col.align==="right"?"align-right":""} key={col.label} onClick={()=>cycleSort(col.index)}>{col.label}{sortIndex===col.index&&sort!=="default"?<span aria-hidden="true">{sort==="asc"?" ↑":" ↓"}</span>:null}</button>)}<span aria-hidden="true"/></div>}{visible.map((item,index)=>{const cells=<>{columns?.map(col=><span key={col.label} className={`${col.align==="right"?"align-right ":""}${col.status?"table-status-cell":""}`}>{col.status?<Status tone={tone(item[col.index]??item.at(-1)??"")}>{item[col.index]??item.at(-1)??"—"}</Status>:(item[col.index]||"—")}</span>)}<Icon name="arrow" size={16}/></>;const href=rowHref?.(item);return href?<Link href={href} className="desktop-record-row" role="row" style={{gridTemplateColumns:`repeat(${columns?.length??1},minmax(0,1fr)) 28px`}} key={item.join("-")+index}>{cells}</Link>:<div className="desktop-record-row" role="row" style={{gridTemplateColumns:`repeat(${columns?.length??1},minmax(0,1fr)) 28px`}} key={item.join("-")+index}>{cells}</div>})}</div><div className="records mobile-record-list">{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div></> :
      <p role="status">{hasFilters?"Keine Treffer":"Noch keine Einträge erfasst"}</p>}
  </>;
}

export function RecordRow({
  href,
  icon,
  title,
  meta,
  value,
  status,
}: {
  href?: string;
  icon?: string;
  title: string;
  meta: string;
  value?: string;
  status?: string;
}) {
  const body = <>
    {icon ? <span className="activity-icon"><Icon name={icon}/></span> : <span className="record-avatar">{title[0]}</span>}
    <div className="record-main"><b>{title}</b><small>{meta}</small></div>
    {value&&<strong>{value}</strong>}
    {status&&<Status tone={tone(status)}>{status}</Status>}
    <Icon name="arrow" size={17}/>
  </>;

  return href ? <Link href={href} className="record">{body}</Link> : <div className="record">{body}</div>;
}
