"use client";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {listStateStore} from "@/lib/client/list-state";
import {compareRecordValues} from "@/lib/record-sort";
import {matchesRecordChip,listStatusOverride} from "@/lib/list-filter";

import Link from "next/link";
import { Children, cloneElement, isValidElement, useEffect, useMemo, useState, useSyncExternalStore, useId, useRef, type ReactNode, type CSSProperties, type SetStateAction } from "react";
import {EmptyState, Icon, Status, LoadingState, ErrorState, Button, Field, Select, Input} from "./ui";
import { ListRow, FilterSheet, ListSearch, DetailTabs, FormSheet } from "./binso-ux";
import {SelectControl} from './select-control';
import {Avatar} from "./avatar";

/** Domain columns differ; table/row/cell semantics and ownership stay central. */
export function DataTable({children,label,variant="records",owner}:{children:ReactNode;label:string;variant?:"records"|"operator";owner?:string}){
 const nodes=Children.toArray(children);
 const header=nodes.find(node=>isValidElement(node)&&node.type===DataTableHead);
 const headings=isValidElement<{children:ReactNode}>(header)?Children.toArray(header.props.children).map(cell=>isValidElement<{children:ReactNode}>(cell)?cell.props.children:null):[];
 const titleIndex=headings.findIndex(heading=>heading==='Kunde'||heading==='Mandant / Kunde');
 const amountIndex=headings.findIndex(heading=>heading==='Betrag');
 return <><LocalizedElement as="div" className={variant==="operator"?"operator-table desktop-record-table":"desktop-record-table"} role="table" aria-label={label} data-records-owner={owner}>{children}</LocalizedElement>{variant==='operator'&&<div className="records mobile-record-list" data-records-owner={owner??label}>{nodes.map((node,index)=>{
  if(!isValidElement<{children:ReactNode;href?:string;onClick?:()=>void}>(node)||node.type!==DataTableRow)return null;
  const cells=Children.toArray(node.props.children).map(cell=>isValidElement<{children:ReactNode}>(cell)?cell.props.children:cell);
  const primary=titleIndex<0?0:titleIndex;
  const primaryParts=Children.toArray(cells[primary]);
  const firstPart=primaryParts[0];
  const structuredTitle=primaryParts.length>1&&isValidElement<{children:ReactNode}>(firstPart)&&firstPart.type==='b';
  const title=structuredTitle?firstPart.props.children:cells[primary];
  const statusIndex=cells.findIndex(cell=>isValidElement(cell)&&cell.type===Status);
  const status=cells[statusIndex];
  const badge=isValidElement<{children:string;tone?:"success"|"warning"|"danger"|"neutral"|"info"}>(status)?status.props:null;
  return <span className="record-wrapper" key={node.key??index}><ListRow compact href={node.props.href} onClick={node.props.onClick} title={title} meta={<>{structuredTitle&&<span className="record-table-meta">{primaryParts.slice(1)}</span>}{cells.map((cell,i)=>i===primary||i===statusIndex||i===amountIndex||(isValidElement<{children:ReactNode}>(cell)&&cell.type===Status&&cell.props.children===badge?.children)?null:<span className="record-table-meta" key={i}>{headings[i]&&<span>{headings[i]}: </span>}<LocalizedText>{isValidElement<{children:ReactNode}>(cell)&&cell.type===Status?cell.props.children:cell}</LocalizedText></span>)}</>} value={amountIndex<0?undefined:cells[amountIndex]} status={badge?.children} tone={badge?.tone}/></span>;
 })}</div>}</>;
}
function tableCells(children:ReactNode,header=false){
 return Children.map(children,child=>isValidElement<{role?:string}>(child)&&child.type==='span'&&!child.props.role?cloneElement(child,{role:header?'columnheader':'cell'}):child);
}
export function DataTableHead({children,className="desktop-record-head",columns}:{children:ReactNode;className?:string;columns?:number}){
 return <div className={className} role="row" style={recordGrid(columns)}>{tableCells(children,true)}</div>;
}
export function DataTableRow({children,href,onClick,className="desktop-record-row",columns}:{children:ReactNode;href?:string;onClick?:()=>void;className?:string;columns?:number}){
 const cells=tableCells(children);
 return href?<Link href={href} className={className} role="row" style={recordGrid(columns)}>{cells}</Link>:onClick?<button type="button" onClick={onClick} className={className} role="row" style={recordGrid(columns)}>{cells}</button>:<div className={className} role="row" style={recordGrid(columns)}>{cells}</div>;
}

function tone(status: string): "success" | "danger" | "warning" | "neutral" | "info" {
  if (["Bezahlt","Aktiv","Genehmigt","Angenommen","Verbucht","Gelöst","Verrechnet","Freigegeben"].includes(status)) return "success";
  if (status==="Versendet") return "info";
  if (["Überfällig","Abgelehnt","Zurückgewiesen"].includes(status)) return "danger";
  if (["Offen","Teilweise bezahlt","Eingereicht","Gesendet","Ausstehend","Zuordnen","Zur Prüfung"].includes(status)) return "warning";
  if (["In Bearbeitung"].includes(status)) return "warning";
  return "neutral";
}

type RecordsColumns=Array<{label:string;index:number;align?:"left"|"right";status?:boolean;render?:(item:string[])=>React.ReactNode}>;
export type RecordsController=ReturnType<typeof useRecordsController>;
const subscribeReadiness=()=>()=>{};
const clientReady=()=>true,serverReady=()=>false;
type ListSelection={query:string;activeChip:string;sort:"default"|"asc"|"desc";sortIndex:number;page:number};

/** One committed search/filter/sort state, reusable in a page header or list toolbar. */
export function useRecordsController({placeholder,chips=["Alle","Aktiv","Inaktiv"],columns,enabled=true}:{placeholder:string;chips?:string[];columns?:RecordsColumns;enabled?:boolean}){
  const firstSortIndex=columns?.[0]?.index??0;
  const statusIndex=columns?.find(column=>column.status)?.index;
  const chipsKey=JSON.stringify(chips);
  const columnIndexes=JSON.stringify(columns?.map(column=>column.index)??[]);
  const ready=useSyncExternalStore(subscribeReadiness,clientReady,serverReady);
  const key=enabled&&ready?"binso.list:"+window.location.pathname+":"+placeholder:"";
  // Like the central period owner, SSR stays unresolved. A client navigation
  // restores synchronously, before any consumer starts its query or paints.
  const restoredSelection=useMemo<ListSelection>(()=>{
    const storedChips:string[]=JSON.parse(chipsKey),indexes:number[]=JSON.parse(columnIndexes);
    const defaults:ListSelection={query:"",activeChip:storedChips[0]??"Alle",sort:"default",sortIndex:firstSortIndex,page:0};
    if(!key)return defaults;
    const requested=listStatusOverride(window.location.search,storedChips);
    try{
      const saved=JSON.parse(listStateStore.get(key)??"null");
      if(saved)return {query:typeof saved.query==="string"?saved.query:"",activeChip:requested??(storedChips.includes(saved.activeChip)?saved.activeChip:defaults.activeChip),sort:["default","asc","desc"].includes(saved.sort)?saved.sort:"default",sortIndex:Number.isInteger(saved.sortIndex)&&(!indexes.length||indexes.includes(saved.sortIndex))?saved.sortIndex:firstSortIndex,page:requested?0:Number.isSafeInteger(saved.page)&&saved.page>=0?saved.page:0};
    }catch{/* Invalid page-memory state falls back to the current list contract. */}
    return {...defaults,activeChip:requested??defaults.activeChip};
  },[key,chipsKey,columnIndexes,firstSortIndex]);
  const [selection,setSelection]=useState<{key:string;value:ListSelection}|null>(null);
  const current=selection?.key===key?selection.value:restoredSelection;
  const {query,sort,sortIndex,page}=current;
  // A permission-driven chip change cannot retain an inaccessible financial filter.
  const activeChip=chips.includes(current.activeChip)?current.activeChip:chips[0]??"Alle";
  const update=<K extends keyof ListSelection>(field:K,value:SetStateAction<ListSelection[K]>)=>setSelection(previous=>{
    const base=previous?.key===key?previous.value:restoredSelection;
    return {key,value:{...base,[field]:typeof value==="function"?(value as (old:ListSelection[K])=>ListSelection[K])(base[field]):value}};
  });
  const setQuery=(value:SetStateAction<string>)=>update("query",value);
  const setActiveChip=(value:SetStateAction<string>)=>update("activeChip",value);
  const setSort=(value:SetStateAction<ListSelection["sort"]>)=>update("sort",value);
  const setSortIndex=(value:SetStateAction<number>)=>update("sortIndex",value);
  const setPage=(value:SetStateAction<number>)=>update("page",value);
  const restored=enabled&&ready;
  const scrollSnapshot=useRef<{y:number;context:string}|null>(null);
  const listContext=JSON.stringify({query,activeChip,sort,sortIndex,page});
  useEffect(()=>{
    if(!enabled)return;
    const key="binso.list:scroll:"+window.location.pathname+":"+placeholder;
    try{const saved=JSON.parse(listStateStore.get(key)??"null");if(saved&&Number.isFinite(saved.y)&&saved.y>=0&&typeof saved.context==="string")scrollSnapshot.current=saved;}catch{}
  },[enabled,placeholder]);
  useEffect(()=>{
    if(!enabled||!restored)return;
    const key="binso.list:scroll:"+window.location.pathname+":"+placeholder;
    const remember=(event:MouseEvent)=>{
      const link=event.target instanceof Element?event.target.closest<HTMLAnchorElement>(".mobile-record-list a,.desktop-record-row[href]"):null;
      if(!link||link.closest("[data-records-owner]")?.getAttribute("data-records-owner")!==placeholder||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target==="_blank")return;
      try{const target=new URL(link.href);if(target.origin===window.location.origin&&target.pathname!==window.location.pathname)listStateStore.set(key,JSON.stringify({y:window.scrollY,context:listContext}));}catch{}
    };
    document.addEventListener("click",remember,true);
    return()=>document.removeEventListener("click",remember,true);
  },[enabled,restored,placeholder,listContext]);
  useEffect(()=>{if(!enabled||!restored)return;try{listStateStore.set("binso.list:"+window.location.pathname+":"+placeholder,JSON.stringify({query,activeChip,sort,sortIndex,page}));}catch{}},[restored,query,activeChip,sort,sortIndex,page,placeholder,enabled]);


  const [searchOpen,setSearchOpen]=useState(false),[filterOpen,setFilterOpen]=useState(false);
  const [draft,setDraft]=useState({activeChip:chips[0]??"Alle",sort:"default" as "default"|"asc"|"desc",sortIndex:firstSortIndex});
  const openFilters=()=>{setDraft({activeChip,sort,sortIndex});setFilterOpen(true)};
  const clearDrilldown=()=>{const url=new URL(window.location.href);if(url.searchParams.has('status')){url.searchParams.delete('status');window.history.replaceState(window.history.state,'',url)}};
  const applyFilters=()=>{clearDrilldown();setActiveChip(draft.activeChip);setSort(draft.sort);setSortIndex(draft.sortIndex);setPage(0);setFilterOpen(false)};
  return {query,setQuery:(value:string)=>{setQuery(value);setPage(0)},activeChip,setActiveChip:(value:string)=>{clearDrilldown();setActiveChip(value);setPage(0)},sort,setSort:(value:"default"|"asc"|"desc")=>{setSort(value);setPage(0)},sortIndex,setSortIndex:(value:number)=>{setSortIndex(value);setPage(0)},page,setPage,restored,scrollSnapshot,listContext,firstSortIndex,statusIndex,searchOpen,setSearchOpen,filterOpen,setFilterOpen,draft,setDraft,openFilters,applyFilters};
}

/** Search and filters use the existing sheet, fields and action footer. */
export function RecordsControls({controller:s,placeholder,chips=["Alle","Aktiv","Inaktiv"],columns,children,inline=true,appearance="line",filterChips=chips,tools,scope}:{scope?:{label:string;value:string;error?:string|null;onClear:()=>void};tools?:()=>ReactNode;controller:RecordsController;placeholder:string;chips?:string[];filterChips?:string[];columns?:RecordsColumns;children?:ReactNode;inline?:boolean;appearance?:"pill"|"line"}){
 const id=useId(),searchId=id+'-search';
 const choices=columns?.length?columns:[{label:"Name",index:s.firstSortIndex}];
 const selectedColumn=choices.find(column=>column.index===s.sortIndex);
 const order=(column:{label:string;align?:string},direction:string)=>column.align==='right'||/Betrag|Umsatz|Stunden|Dauer|Datum|Aktualisiert/.test(column.label)?direction==='asc'?'Aufsteigend':'Absteigend':direction==='asc'?'A–Z':'Z–A';
 const filterButton=<SelectControl className="records-filter-action" aria-label="Filter" popupTitle="Filtern nach" toolIcon={<Icon name="filter" size={18}/>} value={s.activeChip} onChange={event=>s.setActiveChip(event.target.value)}>{filterChips.map(chip=><option key={chip} value={chip}><LocalizedText>{chip}</LocalizedText></option>)}</SelectControl>;
 const sortButton=<SelectControl data-record-sort="true" aria-label="Sortieren" popupTitle="Sortieren nach" toolIcon={<Icon name="sort" size={18}/>} value={s.sort==='default'?'default':s.sortIndex+':'+s.sort} onChange={event=>{if(event.target.value==='default'){s.setSort('default');s.setSortIndex(s.firstSortIndex)}else{const [index,direction]=event.target.value.split(':');s.setSortIndex(Number(index));s.setSort(direction as 'asc'|'desc')}}}><option value="default"><LocalizedText>{"Standard"}</LocalizedText></option>{choices.flatMap(column=>['asc','desc'].map(direction=><option key={column.index+':'+direction} value={column.index+':'+direction}><LocalizedText>{column.label}</LocalizedText>{' '}<LocalizedText>{order(column,direction)}</LocalizedText></option>))}</SelectControl>;
 const activeFilters=<div className="records-active-filters" aria-live="polite">{scope&&<div className="records-active-line"><span><LocalizedText>{scope.label}</LocalizedText>{": "}<span translate="no">{scope.value}</span></span><LocalizedElement as="button" type="button" className="records-reset" aria-label="Kundenfilter zurücksetzen" onClick={()=>{s.setPage(0);scope.onClear()}}><LocalizedText>{"Zurücksetzen"}</LocalizedText></LocalizedElement></div>}{scope?.error&&<ErrorState>{scope.error}</ErrorState>}{s.activeChip!==(chips[0]??'Alle')&&<div className="records-active-line"><span><LocalizedText>{"Filter"}</LocalizedText>{': '}<LocalizedText>{s.activeChip}</LocalizedText></span><LocalizedElement as="button" type="button" className="records-reset" aria-label="Filter zurücksetzen" onClick={()=>s.setActiveChip(chips[0]??'Alle')}><LocalizedText>{"Zurücksetzen"}</LocalizedText></LocalizedElement></div>}{s.sort!=='default'&&<div className="records-active-line"><span><LocalizedText>{"Sortierung"}</LocalizedText>{': '}<LocalizedText>{selectedColumn?.label??'Name'}</LocalizedText>{' '}<LocalizedText>{order(selectedColumn??{label:'Name'},s.sort)}</LocalizedText></span><LocalizedElement as="button" type="button" className="records-reset" aria-label="Sortierung zurücksetzen" onClick={()=>{s.setSort('default');s.setSortIndex(s.firstSortIndex)}}><LocalizedText>{"Zurücksetzen"}</LocalizedText></LocalizedElement></div>}</div>;
 return <>{inline?<div className="records-inline-controls" data-appearance={appearance}><div className="records-search-row"><ListSearch value={s.query} onChange={s.setQuery} placeholder={placeholder}/>{filterButton}{sortButton}{tools?.()}{children}</div>{activeFilters}</div>:<><LocalizedElement as="button" type="button" className="icon-button records-search-action" aria-label={placeholder} onClick={()=>s.setSearchOpen(true)}><Icon name="search" size={20}/></LocalizedElement>{filterButton}{sortButton}{tools?.()}{children}{activeFilters}</>}
 <FilterSheet label={placeholder.replace(/\.\.\.$/,'')} open={s.searchOpen} onClose={()=>s.setSearchOpen(false)} actions={<Button type="submit" form={searchId}><LocalizedText>{"Anwenden"}</LocalizedText></Button>}><form id={searchId} onSubmit={event=>{event.preventDefault();s.setSearchOpen(false)}}><Field label="Suchtext" allowReadOnlyInput><Input type="search" maxLength={200} value={s.query} onChange={event=>s.setQuery(event.target.value)} placeholder={placeholder}/></Field></form></FilterSheet>
 </>;
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
  matchesStatus,
  controller,
  toolbarActions=true,
  remote=false,
  pagination,
  showCount=true,
}: {
  showCount?:boolean;
  pagination?:{total:number;page:number;pageSize:number;onPage:(page:number)=>void};
  controller?:RecordsController;
  toolbarActions?:boolean;
  remote?:boolean;
  sortValue?:(item:string[],index:number)=>string|number;
  matchesStatus?:(item:string[],label:string)=>boolean|undefined;
  countLabel?:string;
  typeIndex?:number;
  emptyLabel?:(chip:string)=>string;
  items: string[][];
  placeholder: string;
  chips?: string[];
  loading?: boolean;
  error?: string|null;
  statusGroups?: Record<string,string[]>;
  columns?: Array<{label:string;index:number;align?:"left"|"right";status?:boolean;render?:(item:string[])=>React.ReactNode}>;
  rowHref?: (item:string[])=>string|undefined;
  children: (item: string[]) => React.ReactNode;
}) {
  const localController=useRecordsController({placeholder,chips,columns,enabled:!controller});
  const state=controller??localController;
  const {query,activeChip,sort,sortIndex,statusIndex}=state;

  useEffect(()=>{
    const snapshot=state.scrollSnapshot.current;
    if(!state.restored||loading||error||!snapshot||snapshot.context!==state.listContext)return;
    let second=0;
    const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{window.scrollTo({top:snapshot.y,left:0,behavior:"instant"});state.scrollSnapshot.current=null;});});
    return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second);};
  },[state.restored,state.listContext,state.scrollSnapshot,loading,error,items]);

  const visible=useMemo(()=>{
    if(remote)return items;
    const filtered=items.filter(item=>{
      const matchesQuery=!query.trim() || item.join(" ").toLowerCase().includes(query.trim().toLowerCase());
      const state=(statusIndex===undefined?item.at(-1):item[statusIndex]) ?? "";
      const type=item[typeIndex] ?? "";
      const matchesChip=matchesStatus?.(item,activeChip)??matchesRecordChip(activeChip,state,type,statusGroups);
      return matchesQuery && matchesChip;
    });

    if(sort==="default") return filtered;
    return [...filtered].sort((a,b)=>{
      const result=compareRecordValues(sortValue?.(a,sortIndex)??a[sortIndex]??"",sortValue?.(b,sortIndex)??b[sortIndex]??"");
      return sort==="asc" ? result : -result;
    });
  },[activeChip,items,query,sort,sortIndex,statusGroups,typeIndex,statusIndex,sortValue,matchesStatus,remote]);

  const hasFilters=query.trim().length>0 || activeChip!==(chips[0]??"Alle") || sort!=="default";
  const singularCountLabel=({Einträge:"Eintrag",Kunden:"Kunde",Zahlungen:"Zahlung",Rechnungen:"Rechnung",Angebote:"Angebot",Dokumente:"Dokument",Produkte:"Produkt",Mitarbeiter:"Mitarbeiter",Spesen:"Spese",Tickets:"Ticket"} as Record<string,string>)[countLabel]??countLabel;

  return <>
    {(toolbarActions||showCount)&&<div className="records-toolbar">
      {toolbarActions&&<RecordsControls controller={state} placeholder={placeholder} chips={chips} columns={columns}/>}
      {showCount&&!loading&&(visible.length>0||hasFilters)&&<span className="records-count" aria-live="polite"><LocalizedText>{`${pagination?.total??visible.length} ${(pagination?.total??visible.length)===1?singularCountLabel:countLabel}`}</LocalizedText></span>}
    </div>}

    {loading?<LoadingState layout="records"><LocalizedText>{"Einträge werden geladen …"}</LocalizedText></LoadingState>:error?<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>:visible.length ? <><DataTable owner={placeholder} label={placeholder.replace(/ suchen.*$/,"")}>{columns&&<DataTableHead className="desktop-record-head" columns={columns.length}>{columns.map(col=><span role="columnheader" aria-sort={sortIndex===col.index&&sort!=="default"?(sort==="asc"?"ascending":"descending"):"none"} className={col.align==="right"?"align-right":""} key={col.label}><LocalizedText>{col.label}</LocalizedText>{sortIndex===col.index&&sort!=="default"?<span aria-hidden="true"><LocalizedText>{sort==="asc"?" ↑":" ↓"}</LocalizedText></span>:null}</span>)}<span aria-hidden="true"/></DataTableHead>}{visible.map((item,index)=>{const cells=<>{columns?.map(col=><span role="cell" key={col.label} className={`${col.align==="right"?"align-right ":""}${col.status?"table-status-cell":""}`}>{col.render?col.render(item):col.status?<Status appearance="pill" tone={tone(item[col.index]??item.at(-1)??"")}><LocalizedText>{item[col.index]??item.at(-1)??"—"}</LocalizedText></Status>:(item[col.index]||"—")}</span>)}<Icon name="arrow" size={16}/></>;const href=rowHref?.(item);return href?<DataTableRow href={href} className="desktop-record-row" columns={columns?.length??1} key={item.join("-")+index}>{cells}</DataTableRow>:<DataTableRow className="desktop-record-row" columns={columns?.length??1} key={item.join("-")+index}>{cells}</DataTableRow>})}</DataTable><div className="records mobile-record-list" data-records-owner={placeholder}>{visible.map((item,index)=><span className="record-wrapper" key={item.join("-")+index}>{children(item)}</span>)}</div></> :
      <EmptyState   title={query.trim()?"Keine Treffer für diese Suche":emptyLabel?.(activeChip)??(activeChip==="Inaktiv"?"Keine inaktiven "+countLabel:activeChip==="Aktiv"?"Keine aktiven "+countLabel:"Keine "+countLabel+" erfasst")}/>}
    {pagination&&<RecordsPagination {...pagination} loading={loading}/>}
  </>;
}

export function RecordRow({
  href,
  onClick,
  title,
  meta,
  value,
  status,
  personIdentity,
  compact=false,
  information=false,
  inlineMeta,
}: {
  href?: string;
  onClick?:()=>void;
  icon?: string;
  title: string;
  meta: string;
  value?: string;
  status?: string;
  personIdentity?:string;
  compact?:boolean;
  information?:boolean;
  inlineMeta?:string;

}) {
  return <ListRow translateTitle={false} compact={compact} information={information} onClick={onClick} href={href} title={personIdentity?<span className="person-record"><Avatar name={title} identity={personIdentity}/><span>{title}</span></span>:inlineMeta?<span className="record-inline-identity"><span>{title}</span><small>{inlineMeta}</small></span>:title} meta={meta} value={value} status={status} tone={status?tone(status):"neutral"}/>;
}

/** Group disclosure owns structure only; callers retain domain totals, filters and permissions. */
export function TimeEntryGroup({title,subtitle,value,children,titleVerbatim=false,subtitleVerbatim=false,expanded=false}:{title:string;subtitle:string;value:string;children:ReactNode;titleVerbatim?:boolean;subtitleVerbatim?:boolean;expanded?:boolean}){
 return <details className="time-group" open={expanded||undefined}><summary className="time-group-head"><div><b><LocalizedText verbatim={titleVerbatim}>{title}</LocalizedText></b><small><LocalizedText verbatim={subtitleVerbatim}>{subtitle}</LocalizedText></small></div><strong>{value}</strong><Icon name="down" size={16}/></summary><div className="time-record-list">{children}</div></details>;
}

/** Employee ledgers and the time module share the same information layout. */
export function TimeEntryRow({title,meta,value,status,selection,selectionLabel="Für Rechnung auswählen",action,onOpen,onClick,information=false}:{selectionLabel?:string;information?:boolean;onOpen?:()=>void;onClick?:()=>void;title:string;meta:string;value:string;status?:string;selection?:React.ReactNode;action?:React.ReactNode}){
 const [detailOpen,setDetailOpen]=useState(false);
 if(information)return <><RecordRow information title={title} meta={meta} value={value} onClick={onClick??onOpen??(()=>setDetailOpen(true))}/><FormSheet open={detailOpen} onClose={()=>setDetailOpen(false)} label="Zeiteintrag" actions={action}><RecordRow title={title} meta={meta} value={value} status={status}/>{selection&&<label>{selection}<span><LocalizedText>{selectionLabel}</LocalizedText></span></label>}</FormSheet></>;
 return <div><RecordRow onClick={onClick??onOpen} title={title} meta={meta} value={value} status={status}/>{(selection||action)&&<div className="record-controls">{selection&&<label>{selection}<span><LocalizedText>{selectionLabel}</LocalizedText></span></label>}{action}</div>}</div>;
}

/** The table owns its responsive tracks; callers supply only the column count. */
function recordGrid(columns?:number):CSSProperties|undefined{
 if(columns==null)return undefined;
 const count=Math.max(1,Math.trunc(columns));
 return {"--record-grid":count===1?'minmax(0,1fr) 25px':
  'minmax(180px,1fr) repeat('+(count-1)+',minmax(80px,110px)) 25px'} as CSSProperties;
}

/** Same identity and secondary line for customer, employee and other directories. */
export function RecordIdentity({name,meta,identity=name,kind="organization",showMark=true}:{name:string;meta?:string;identity?:string;kind?:"organization"|"person";showMark?:boolean}){
 const initials=name.trim().split(/\s+/).filter(Boolean).slice(0,2).map(word=>word[0]).join('').toLocaleUpperCase('de-CH');
 return <span className="record-identity">{showMark&&(kind==='person'?<Avatar name={name} identity={identity}/>:<span className="record-initials" aria-hidden="true">{initials}</span>)}<span><strong><LocalizedText verbatim>{name}</LocalizedText></strong>{meta&&<small><LocalizedText verbatim>{meta}</LocalizedText></small>}</span></span>;
}

/** Shared list paging for tables and grouped business records. */
export function RecordsPagination({total,page,pageSize,onPage,loading=false}:{total:number;page:number;pageSize:number;onPage:(page:number)=>void;loading?:boolean}){return (total>pageSize||page>0)&&<LocalizedElement as="nav" className="records-pagination" aria-label="Listenseiten"><Button variant="secondary" disabled={loading||page===0} onClick={()=>onPage(page-1)}><LocalizedText>{"Zurück"}</LocalizedText></Button><span><LocalizedText>{"Seite "}</LocalizedText><LocalizedText>{page+1}</LocalizedText><LocalizedText>{" von "}</LocalizedText>{Math.max(page+1,Math.ceil(total/pageSize))}</span><Button variant="secondary" disabled={loading||(page+1)*pageSize>=total} onClick={()=>onPage(page+1)}><LocalizedText>{"Weiter"}</LocalizedText></Button></LocalizedElement>;}
