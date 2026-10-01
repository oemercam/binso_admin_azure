"use client";

import {useRef,useState} from "react";
import {CheckSquare,Filter,Grid2X2,List,Search,SlidersHorizontal,X} from "lucide-react";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {IconButton} from "@/components/ui/icon-button";
import {Input} from "@/components/ui/form-controls";
import {useLocale} from "@/components/locale-provider";

type Props={
 query:string;
 onQueryChange:(value:string)=>void;
 searchPlaceholder:string;
 statuses:string[];
 statusFilter:string;
 onStatusFilter:(value:string)=>void;
 sort:"asc"|"desc";
 onSort:(value:"asc"|"desc")=>void;
 view:"table"|"cards";
 onView:(value:"table"|"cards")=>void;
 selectionMode?:boolean;
 onSelectionMode?:()=>void;
};

export default function ListToolbar({query,onQueryChange,searchPlaceholder,statuses,statusFilter,onStatusFilter,sort,onSort,view,onView,selectionMode=false,onSelectionMode}:Props){
 const {t}=useLocale();
 const [searchOpen,setSearchOpen]=useState(false);
 const [filterOpen,setFilterOpen]=useState(false);
 const [sortOpen,setSortOpen]=useState(false);
 const inputRef=useRef<HTMLInputElement>(null);
 function openSearch(){setSearchOpen(true);window.setTimeout(()=>inputRef.current?.focus(),0)}
 function closeSearch(){onQueryChange("");setSearchOpen(false)}
 return <>
  <div className={`list-toolbar${searchOpen?" is-searching":""}`}>
   <div className="list-search">
    {!searchOpen&&<IconButton type="button" aria-label={t("Suche öffnen")} onClick={openSearch}><Search size={18}/></IconButton>}
    <div className="list-search-field">
     <Search size={17} aria-hidden="true"/>
     <Input ref={inputRef} value={query} onChange={e=>onQueryChange(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}/>
     {(query||searchOpen)&&<button type="button" className="list-search-close" aria-label={t("Suche schliessen")} onClick={closeSearch}><X size={17}/></button>}
    </div>
   </div>
   <div className="list-toolbar-actions">
    <button type="button" className={`list-tool-button${statusFilter!=="Alle"?" is-active":""}`} aria-label={t("Filter")} onClick={()=>setFilterOpen(true)}><Filter size={18}/><span>{t("Filter")}</span>{statusFilter!=="Alle"&&<i aria-hidden="true"/>}</button>
    <button type="button" className="list-tool-button" aria-label={t("Sortierung")} onClick={()=>setSortOpen(true)}><SlidersHorizontal size={18}/><span>{sort==="asc"?"A–Z":"Z–A"}</span></button>
    <button type="button" className="list-tool-button" aria-label={t("Ansicht wechseln")} onClick={()=>onView(view==="table"?"cards":"table")}>{view==="table"?<Grid2X2 size={18}/>:<List size={18}/>}<span>{t("Ansicht")}</span></button>
    {onSelectionMode&&<button type="button" className={`list-tool-button mobile-selection-tool${selectionMode?" is-active":""}`} aria-label={t("Auswahlmodus")} onClick={onSelectionMode}><CheckSquare size={18}/><span>{t("Auswahl")}</span></button>}
   </div>
  </div>
  <ResponsiveOverlay open={filterOpen} title={t("Filter")} onClose={()=>setFilterOpen(false)} size="sm">
   <div className="list-sheet-options"><button className={statusFilter==="Alle"?"selected":""} onClick={()=>{onStatusFilter("Alle");setFilterOpen(false)}}>{t("Alle")}</button>{statuses.map(status=><button className={statusFilter===status?"selected":""} key={status} onClick={()=>{onStatusFilter(status);setFilterOpen(false)}}>{t(status)}</button>)}</div>
  </ResponsiveOverlay>
  <ResponsiveOverlay open={sortOpen} title={t("Sortierung")} onClose={()=>setSortOpen(false)} size="sm">
   <div className="list-sheet-options"><button className={sort==="asc"?"selected":""} onClick={()=>{onSort("asc");setSortOpen(false)}}>A–Z</button><button className={sort==="desc"?"selected":""} onClick={()=>{onSort("desc");setSortOpen(false)}}>Z–A</button></div>
  </ResponsiveOverlay>
 </>;
}
