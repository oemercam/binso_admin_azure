"use client";

import Link from "next/link";
import { useState } from "react";
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
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [period,setPeriod]=useState("Alle");
  const [owner,setOwner]=useState("Alle");

  const normalizedChip=(value:string)=>value.toLowerCase().replace(/e?n$/, "");
  const visible=items.filter(item=>{
    const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
    const state=item.at(-1) ?? "";
    const type=item[1] ?? "";
    const matchesChip=activeChip==="Alle" || state===activeChip || normalizedChip(type).startsWith(normalizedChip(activeChip)) || normalizedChip(activeChip).startsWith(normalizedChip(type));
    return matchesQuery && matchesChip;
  });

  return <>
    <div className="toolbar">
      <label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></label>
      <div className="chips">{chips.map((chip)=><button type="button" onClick={()=>setActiveChip(chip)} className={chip===activeChip?"active":""} key={chip}>{chip}</button>)}</div>
      <button className="filter-button" type="button" onClick={()=>setFiltersOpen(true)}><Icon name="filter" size={17}/><span>Filter</span></button>
    </div>

    {visible.length ? <div className="records">{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div> :
      <EmptyState icon="search" title="Keine Treffer" text="Passe Suche oder Filter an, um Einträge zu finden."/>}

    {filtersOpen&&<div className="sheet-layer filter-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setFiltersOpen(false)}}>
      <section className="bottom-sheet filter-sheet" role="dialog" aria-modal="true" aria-label="Filter">
        <div className="sheet-handle"/>
        <header className="sheet-header"><div><h2>Filter</h2><p>Ansicht eingrenzen, ohne die Seite zu verlassen.</p></div><button className="icon-button" type="button" onClick={()=>setFiltersOpen(false)} aria-label="Schliessen"><Icon name="close"/></button></header>
        <div className="filter-section"><b>Zeitraum</b><div className="segmented">{["Alle","30 Tage","90 Tage","Dieses Jahr"].map(value=><button type="button" className={period===value?"active":""} onClick={()=>setPeriod(value)} key={value}>{value}</button>)}</div></div>
        <div className="filter-section"><b>Zuständigkeit</b><div className="segmented">{["Alle","Ich","Team"].map(value=><button type="button" className={owner===value?"active":""} onClick={()=>setOwner(value)} key={value}>{value}</button>)}</div></div>
        <div className="filter-sheet-actions"><button type="button" className="button button-secondary" onClick={()=>{setPeriod("Alle");setOwner("Alle");setActiveChip(chips[0] ?? "Alle");setQuery("")}}>Zurücksetzen</button><button type="button" className="button button-primary" onClick={()=>setFiltersOpen(false)}>Anwenden</button></div>
      </section>
    </div>}
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
