"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Icon, Status } from "./ui";

function tone(status: string): "success" | "danger" | "warning" | "neutral" | "info" {
  if (["Bezahlt","Aktiv","Genehmigt","Angenommen","Verbucht","Gelöst"].includes(status)) return "success";
  if (["Überfällig","Abgelehnt","Abgelaufen"].includes(status)) return "danger";
  if (["Offen","Eingereicht","Gesendet","Ausstehend"].includes(status)) return "warning";
  if (["In Bearbeitung"].includes(status)) return "info";
  return "neutral";
}

export function RecordsView({
  items,
  placeholder,
  chips = ["Alle","Aktiv","Inaktiv"],
  children,
}: {
  items: string[][];
  placeholder: string;
  chips?: string[];
  children: (item: string[]) => React.ReactNode;
}) {
  const [query,setQuery]=useState("");
  const [activeChip,setActiveChip]=useState(chips[0] ?? "Alle");
  const [sort,setSort]=useState<"default"|"asc"|"desc">("default");

  const normalizedChip=(value:string)=>value.toLowerCase().replace(/e?n$/, "");

  const visible=useMemo(()=>{
    const filtered=items.filter(item=>{
      const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
      const state=item.at(-1) ?? "";
      const type=item[1] ?? "";
      const matchesChip=activeChip==="Alle" || state===activeChip || normalizedChip(type).startsWith(normalizedChip(activeChip)) || normalizedChip(activeChip).startsWith(normalizedChip(type));
      return matchesQuery && matchesChip;
    });

    if(sort==="default") return filtered;
    return [...filtered].sort((a,b)=>{
      const result=(a[0]??"").localeCompare(b[0]??"","de-CH",{numeric:true,sensitivity:"base"});
      return sort==="asc" ? result : -result;
    });
  },[activeChip,items,query,sort]);

  const reset=()=>{
    setQuery("");
    setActiveChip(chips[0] ?? "Alle");
    setSort("default");
  };

  const cycleSort=()=>setSort(current=>current==="default"?"asc":current==="asc"?"desc":"default");
  const hasFilters=query.trim().length>0 || activeChip!==(chips[0]??"Alle") || sort!=="default";

  return <>
    <div className="toolbar">
      <label className="searchbox"><Icon name="search"/><input aria-label={placeholder} value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></label>
      <div className="chips">{chips.map((chip)=><button type="button" onClick={()=>setActiveChip(chip)} className={chip===activeChip?"active":""} key={chip}>{chip}</button>)}</div>
      <button className={`filter-button ${sort!=="default"?"active":""}`} type="button" onClick={cycleSort} title="Sortierung wechseln" aria-label={sort==="asc"?"Sortierung A bis Z":sort==="desc"?"Sortierung Z bis A":"Sortierung einschalten"}><Icon name="filter" size={17}/><span>{sort==="asc"?"A–Z":sort==="desc"?"Z–A":"Sortieren"}</span></button>
      <span className="records-count" aria-live="polite">{visible.length} {visible.length===1?"Eintrag":"Einträge"}</span>
      {hasFilters&&<button className="toolbar-reset" type="button" onClick={reset}>Zurücksetzen</button>}
    </div>

    {visible.length ? <div className="records">{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div> :
      <EmptyState icon="search" title="Keine Treffer" text="Passe Suche oder Statusfilter an, um Einträge zu finden." action={<button type="button" className="button button-secondary" onClick={reset}>Filter zurücksetzen</button>}/>}
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
