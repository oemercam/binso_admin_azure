"use client";
import {subscribeAppEvent,appEvents} from "@/lib/client/app-events";
import {useEffect,useId,useMemo,useRef,useState} from "react";
import Link from "next/link";
import {ChevronDown,Plus,Search,X} from "lucide-react";
import type {ModuleKey} from "@/lib/modules";
import {loadEntityOptions,type EntityOption} from "@/lib/relationships";
import {useLocale} from "@/components/locale-provider";

export default function RelationshipPicker({module,label,value,onChange,required=false,createHref,placeholder}:{module:ModuleKey;label:string;value:string;onChange:(option:EntityOption|undefined)=>void;required?:boolean;createHref?:string;placeholder?:string}){
 const {t}=useLocale();
 const fieldId=useId(),listId=useId();
 const rootRef=useRef<HTMLDivElement>(null);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(""),[options,setOptions]=useState<EntityOption[]>([]),[loading,setLoading]=useState(true);
 useEffect(()=>{let active=true;const load=()=>void loadEntityOptions(module).then(items=>{if(active){setOptions(items);setLoading(false)}}).catch(()=>{if(active){setOptions([]);setLoading(false)}});load();const unsubscribe=subscribeAppEvent(appEvents.dataChanged,load);return()=>{active=false;unsubscribe()}},[module]);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(rootRef.current&&!rootRef.current.contains(event.target as Node)){setOpen(false);setQuery("")}};const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);setQuery("")}};document.addEventListener("pointerdown",close);document.addEventListener("keydown",key);return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",key)}},[open]);
 const selected=options.find(o=>o.id===value);
 const filtered=useMemo(()=>options.filter(o=>`${o.label} ${o.sub||""} ${Object.values(o.fields).join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).slice(0,20),[options,query]);
 const choose=(option:EntityOption|undefined)=>{onChange(option);setOpen(false);setQuery("")};
 return <div className="relationship-field" ref={rootRef}>
  <span id={fieldId} className="relationship-label">{t(label)}{required?" *":""}</span>
  <div className="relationship-picker">
   <button type="button" className="relationship-trigger" onClick={()=>setOpen(v=>!v)} aria-labelledby={fieldId} aria-haspopup="listbox" aria-controls={listId} aria-expanded={open}>
    <span>{selected?.label||(loading?t("Wird geladen …"):placeholder||`${t(label)} ${t("auswählen")}`)}</span>
    <span className="relationship-trigger-actions" aria-hidden="true">{selected?<X size={15}/>:open?<ChevronDown size={16}/>:<Search size={15}/>}</span>
   </button>
   {selected&&<button type="button" className="relationship-clear-button" aria-label={t("Auswahl löschen")} onClick={()=>choose(undefined)}><X size={14}/></button>}
   {open&&<div className="relationship-popover">
    <div className="relationship-search"><Search size={16}/><input autoFocus type="search" autoComplete="off" value={query} onChange={e=>setQuery(e.target.value)} placeholder={`${t(label)} ${t("suchen …")}`} aria-label={`${t(label)} ${t("suchen …")}`}/></div>
    <div className="relationship-results" id={listId} role="listbox" aria-labelledby={fieldId}>{loading?<p>{t("Wird geladen …")}</p>:filtered.length?filtered.map(option=><button type="button" role="option" aria-selected={option.id===value} key={option.id} className={option.id===value?"selected":""} onClick={()=>choose(option)}><strong>{option.label}</strong>{option.sub&&<small>{option.sub}</small>}</button>):<p>{t("Keine Treffer")}</p>}</div>
    {createHref&&<Link className="relationship-create" href={createHref} onClick={()=>setOpen(false)}><Plus size={15}/>{t("Neu erstellen")}</Link>}
   </div>}
  </div>
 </div>;
}
