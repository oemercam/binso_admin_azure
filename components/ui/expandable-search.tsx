"use client";
import {useRef,useState} from "react";
import {Search,X} from "lucide-react";
import {IconButton} from "@/components/ui/icon-button";
import {Input} from "@/components/ui/form-controls";
import {useLocale} from "@/components/locale-provider";
export default function ExpandableSearch({value,onChange,placeholder}:{value:string;onChange:(value:string)=>void;placeholder:string}){
 const {t}=useLocale();const [open,setOpen]=useState(false);const ref=useRef<HTMLInputElement>(null);
 function show(){setOpen(true);window.setTimeout(()=>ref.current?.focus(),0)}
 function close(){onChange("");setOpen(false)}
 return <div className={`expandable-search${open?" is-open":""}`}><IconButton type="button" aria-label={t("Suche öffnen")} onClick={show}><Search size={18}/></IconButton><div className="expandable-search-field"><Search size={17}/><Input ref={ref} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/><button type="button" aria-label={t("Suche schliessen")} onClick={close}><X size={17}/></button></div></div>;
}
