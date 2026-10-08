"use client";
import {compareRecordValues} from "@/lib/record-sort";
import {matchesRecordChip} from "@/lib/list-filter";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Icon, Status } from "./ui";

function tone(status: string): "success" | "danger" | "warning" | "neutral" | "info" {
  if (["Bezahlt","Aktiv","Genehmigt","Angenommen","Verbucht","Gelöst"].includes(status)) return "success";
  if (["Überfällig","Abgelehnt","Abgelaufen"].includes(status)) return "danger";
  if (["Offen","Teilweise bezahlt","Eingereicht","Gesendet","Versendet","Ausstehend"].includes(status)) return "warning";
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
  countLabel="Einträge",
  typeIndex=1,
  emptyLabel,
  sortValue,
}: {
  sortValue?:(item:string[],index:number)=>string|number;
  countLabel?:string;
  typeIndex?:number;
  emptyLabel?:(chip:string)=>string;
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
  const firstSortIndex=columns?.[0]?.index??0;
  const statusIndex=columns?.find(column=>column.status)?.index;
  const [sortIndex,setSortIndex]=useState(firstSortIndex);

  const chipsKey=JSON.stringify(chips);
  const columnIndexes=JSON.stringify(columns?.map(column=>column.index)??[]);
  const [restored,setRestored]=useState(false);
  useEffect(()=>{const storedChips:string[]=JSON.parse(chipsKey);try{const saved=JSON.parse(window.sessionStorage.getItem("binso.list:"+window.location.pathname+":"+placeholder)??"null");if(saved){queueMicrotask(()=>{setQuery(typeof saved.query==="string"?saved.query:"");setActiveChip(storedChips.includes(saved.activeChip)?saved.activeChip:storedChips[0]??"Alle");setSort(["default","asc","desc"].includes(saved.sort)?saved.sort:"default");setSortIndex(Number.isInteger(saved.sortIndex)&&(!JSON.parse(columnIndexes).length||JSON.parse(columnIndexes).includes(saved.sortIndex))?saved.sortIndex:firstSortIndex);setRestored(true);});return;}}catch{}queueMicrotask(()=>setRestored(true));},[chipsKey,placeholder,firstSortIndex,columnIndexes]);
  useEffect(()=>{if(!restored)return;try{window.sessionStorage.setItem("binso.list:"+window.location.pathname+":"+placeholder,JSON.stringify({query,activeChip,sort,sortIndex}));}catch{}},[restored,query,activeChip,sort,sortIndex,placeholder]);


  const visible=useMemo(()=>{
    const filtered=items.filter(item=>{
      const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
      const state=(statusIndex===undefined?item.at(-1):item[statusIndex]) ?? "";
      const type=item[typeIndex] ?? "";
      const matchesChip=matchesRecordChip(activeChip,state,type,statusGroups);
      return matchesQuery && matchesChip;
    });

    if(sort==="default") return filtered;
    return [...filtered].sort((a,b)=>{
      const result=compareRecordValues(sortValue?.(a,sortIndex)??a[sortIndex]??"",sortValue?.(b,sortIndex)??b[sortIndex]??"");
      return sort==="asc" ? result : -result;
    });
  },[activeChip,items,query,sort,sortIndex,statusGroups,typeIndex,statusIndex,sortValue]);

  const reset=()=>{
    setQuery("");
    setActiveChip(chips[0] ?? "Alle");
    setSort("default");
    setSortIndex(firstSortIndex);
  };

  const cycleSort=(index=firstSortIndex)=>{if(sortIndex!==index){setSortIndex(index);setSort("asc");return;}setSort(current=>current==="default"?"asc":current==="asc"?"desc":"default")};
  const hasFilters=query.trim().length>0 || activeChip!==(chips[0]??"Alle") || sort!=="default";
  const singularCountLabel=({Einträge:"Eintrag",Kunden:"Kunde",Zahlungen:"Zahlung",Rechnungen:"Rechnung",Angebote:"Angebot",Dokumente:"Dokument"} as Record<string,string>)[countLabel]??countLabel;

  return <>
    <div className="toolbar">
      <label className="searchbox"><Icon name="search"/><input aria-label={placeholder} value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></label>
      <div className="chips">{chips.map((chip)=><button type="button" aria-pressed={chip===activeChip} onClick={()=>setActiveChip(chip)} className={chip===activeChip?"active":""} key={chip}>{chip}</button>)}</div>
      <label className={`filter-button ${sort!=="default"?"active":""}`}><Icon name="filter" size={17}/><select aria-label="Sortierung" value={sort==="default"?"default":`${sortIndex}:${sort}`} onChange={e=>{if(e.target.value==="default"){setSort("default");setSortIndex(firstSortIndex)}else{const [index,direction]=e.target.value.split(":");setSortIndex(Number(index));setSort(direction as "asc"|"desc")}}}><option value="default">Sortieren</option>{(columns?.length?columns:[{label:"Name",index:firstSortIndex}]).flatMap(column=>[<option key={`${column.index}:asc`} value={`${column.index}:asc`}>{column.label} ↑</option>,<option key={`${column.index}:desc`} value={`${column.index}:desc`}>{column.label} ↓</option>])}</select></label>
      {(loading||visible.length>0||hasFilters)&&<span className="records-count" aria-live="polite">{loading?"Wird geladen…":`${visible.length} ${visible.length===1?singularCountLabel:countLabel}`}</span>}
      {hasFilters&&<button className="toolbar-reset" type="button" onClick={reset}>Filter zurücksetzen</button>}
    </div>

    {loading?<p role="status">Einträge werden geladen …</p>:error?<p role="alert">{error}</p>:visible.length ? <><div className="desktop-record-table" role="table" aria-label={placeholder.replace(/ suchen.*$/,"")}>{columns&&<div className="desktop-record-head" role="row" style={{gridTemplateColumns:`repeat(${columns.length},minmax(0,1fr)) 28px`}}>{columns.map(col=><button type="button" role="columnheader" aria-sort={sortIndex===col.index&&sort!=="default"?(sort==="asc"?"ascending":"descending"):"none"} className={col.align==="right"?"align-right":""} key={col.label} onClick={()=>cycleSort(col.index)}>{col.label}{sortIndex===col.index&&sort!=="default"?<span aria-hidden="true">{sort==="asc"?" ↑":" ↓"}</span>:null}</button>)}<span aria-hidden="true"/></div>}{visible.map((item,index)=>{const cells=<>{columns?.map(col=><span role="cell" key={col.label} className={`${col.align==="right"?"align-right ":""}${col.status?"table-status-cell":""}`}>{col.status?<Status tone={tone(item[col.index]??item.at(-1)??"")}>{item[col.index]??item.at(-1)??"—"}</Status>:(item[col.index]||"—")}</span>)}<Icon name="arrow" size={16}/></>;const href=rowHref?.(item);return href?<Link href={href} className="desktop-record-row" role="row" style={{gridTemplateColumns:`repeat(${columns?.length??1},minmax(0,1fr)) 28px`}} key={item.join("-")+index}>{cells}</Link>:<div className="desktop-record-row" role="row" style={{gridTemplateColumns:`repeat(${columns?.length??1},minmax(0,1fr)) 28px`}} key={item.join("-")+index}>{cells}</div>})}</div><div className="records mobile-record-list">{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div></> :
      <p role="status">{query.trim()?"Keine Treffer für diese Suche":emptyLabel?.(activeChip)??(activeChip==="Inaktiv"?"Keine inaktiven "+countLabel:activeChip==="Aktiv"?"Keine aktiven "+countLabel:"Keine "+countLabel+" erfasst")}</p>}
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
    <div className="record-main"><b>{title}</b>{meta&&<small>{meta}</small>}</div>
    {value&&<strong>{value}</strong>}
    {status&&<Status tone={tone(status)}>{status}</Status>}
    <Icon name="arrow" size={17}/>
  </>;

  return href ? <Link href={href} className="record">{body}</Link> : <div className="record">{body}</div>;
}
