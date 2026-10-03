"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, Icon, Status } from "./ui";
import { useI18n } from "@/lib/i18n/provider";
import { localeTags } from "@/lib/i18n/config";

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
  const {locale}=useI18n();
  const tx={de:{all:"Alle",sort:"Sortieren",reset:"Zurücksetzen",none:"Keine Treffer",noneText:"Passe Suche oder Statusfilter an, um Einträge zu finden.",entry:"Eintrag",entries:"Einträge"},fr:{all:"Tous",sort:"Trier",reset:"Réinitialiser",none:"Aucun résultat",noneText:"Adaptez la recherche ou le filtre de statut.",entry:"entrée",entries:"entrées"},it:{all:"Tutti",sort:"Ordina",reset:"Reimposta",none:"Nessun risultato",noneText:"Modifica la ricerca o il filtro di stato.",entry:"voce",entries:"voci"},en:{all:"All",sort:"Sort",reset:"Reset",none:"No results",noneText:"Adjust the search or status filter to find entries.",entry:"entry",entries:"entries"},tr:{all:"Tümü",sort:"Sırala",reset:"Sıfırla",none:"Sonuç yok",noneText:"Kayıt bulmak için arama veya durum filtresini değiştirin.",entry:"kayıt",entries:"kayıt"}}[locale];
  const [query,setQuery]=useState("");
  const [activeChip,setActiveChip]=useState(chips[0] ?? "Alle");
  const [sort,setSort]=useState<"default"|"asc"|"desc">("default");

  const normalizedChip=(value:string)=>value.toLowerCase().replace(/e?n$/, "");

  const visible=useMemo(()=>{
    const filtered=items.filter(item=>{
      const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
      const state=item.at(-1) ?? "";
      const type=item[1] ?? "";
      const matchesChip=activeChip===chips[0] || state===activeChip || normalizedChip(type).startsWith(normalizedChip(activeChip)) || normalizedChip(activeChip).startsWith(normalizedChip(type));
      return matchesQuery && matchesChip;
    });

    if(sort==="default") return filtered;
    return [...filtered].sort((a,b)=>{
      const result=(a[0]??"").localeCompare(b[0]??"",localeTags[locale],{numeric:true,sensitivity:"base"});
      return sort==="asc" ? result : -result;
    });
  },[activeChip,items,query,sort,chips,locale]);

  const reset=()=>{
    setQuery("");
    setActiveChip(chips[0] ?? "Alle");
    setSort("default");
  };

  const cycleSort=()=>setSort(current=>current==="default"?"asc":current==="asc"?"desc":"default");
  const hasFilters=query.trim().length>0 || activeChip!==(chips[0]??"Alle") || sort!=="default";

  return <>
    <div className="toolbar">
      <label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={placeholder}/></label>
      <div className="chips">{chips.map((chip)=><button type="button" onClick={()=>setActiveChip(chip)} className={chip===activeChip?"active":""} key={chip}>{chip}</button>)}</div>
      <button className={`filter-button ${sort!=="default"?"active":""}`} type="button" onClick={cycleSort} title={tx.sort} aria-label={tx.sort}><Icon name="filter" size={17}/><span>{sort==="asc"?"A–Z":sort==="desc"?"Z–A":tx.sort}</span></button>
      <span className="records-count" aria-live="polite">{visible.length} {visible.length===1?tx.entry:tx.entries}</span>
      {hasFilters&&<button className="toolbar-reset" type="button" onClick={reset}>{tx.reset}</button>}
    </div>

    {visible.length ? <div className="records">{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div> :
      <EmptyState icon="search" title={tx.none} text={tx.noneText} action={<button type="button" className="button button-secondary" onClick={reset}>{tx.reset}</button>}/>}
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
