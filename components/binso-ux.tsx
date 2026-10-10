"use client";

import { Children, isValidElement, cloneElement, useState, useRef, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./use-dialog-focus";
import { Button, Icon, Metric, Status } from "@/components/ui";
import { usePageAccess } from "@/lib/client/page-access";
import {useBrowserBackGuard} from "./use-browser-back-guard";
import ConfirmDialog from "./confirm-dialog";

/** Action rows have one DOM shape; navigation and destructive intent are explicit. */
export function ActionRow({title,icon,href,onClick,disabled=false,requiresWrite=false,danger=false,navigation=false,description,metadata,endAdornment,selected,role,tabIndex,onKeyDown}: {
 title:string;icon:ReactNode;href?:string;onClick?:()=>void;disabled?:boolean;requiresWrite?:boolean;danger?:boolean;navigation?:boolean;description?:string;metadata?:string;endAdornment?:ReactNode;selected?:boolean;role?:"radio";tabIndex?:number;onKeyDown?:React.KeyboardEventHandler<HTMLButtonElement>;
}) {
 const access=usePageAccess();
 if(href&&!access.canOpen(href))return null;
 const blocked=disabled||(requiresWrite&&!access.write);
 const className=`action-row${danger?" action-row-danger":""}`;
 const body=<>{typeof icon==='string'?<Icon name={icon} size={18}/>:icon}<span>{description||metadata?<span>{title}</span>:title}{description&&<small className="action-row-description">{description}</small>}{metadata&&<small className="action-row-description">{metadata}</small>}</span>{endAdornment??(selected!==undefined?<span className="action-row-selection" aria-hidden="true">{selected&&<Icon name="check" size={16}/>}</span>:!danger&&(navigation||href)&&<Icon name="arrow" size={16}/>)}</>;
 return href&&!blocked?<Link prefetch={false} href={href} onClick={onClick} className={className}>{body}</Link>:<button type="button" className={className} disabled={blocked} onClick={onClick} role={role} aria-checked={role==="radio"?selected:undefined} tabIndex={tabIndex} onKeyDown={onKeyDown}>{body}</button>;
}

/** Compact single selection extends the action-row contract, including keyboard navigation. */
export function SelectionRows<T extends string>({label,value,options,onChange}:{label:string;value:T;options:readonly {value:T;title:string;description:string;icon:ReactNode}[];onChange:(value:T)=>void}){
 return <div className="action-list selection-rows" role="radiogroup" aria-label={label}>{options.map((option,index)=><ActionRow key={option.value} title={option.title} description={option.description} icon={option.icon} role="radio" selected={value===option.value} tabIndex={value===option.value?0:-1} onClick={()=>onChange(option.value)} onKeyDown={event=>{
  const next=event.key==='Home'?0:event.key==='End'?options.length-1:['ArrowDown','ArrowRight'].includes(event.key)?(index+1)%options.length:['ArrowUp','ArrowLeft'].includes(event.key)?(index+options.length-1)%options.length:null;
  if(next===null)return;event.preventDefault();onChange(options[next].value);(event.currentTarget.parentElement?.children[next] as HTMLElement|undefined)?.focus();
 }}/>)}</div>;
}

/** Shared visual contract for Binso One. Existing page navigation is intentionally untouched. */
export function PageHeading({ title, description, action, leading }: { title: string; description?: string; action?: ReactNode; leading?: ReactNode }) {
  return <header className="bo-page-heading">{leading}
    <div className="bo-page-heading-main"><h1>{title}</h1>{action}</div>
    {description && <p>{description}</p>}
  </header>;
}

export function CreateAction({ label, href, onClick, disabled = false }: { label: string; href?: string; onClick?: () => void; disabled?: boolean }) {
  return <Button href={href} requiresWrite className="bo-create-action" ariaLabel={label} disabled={disabled} onClick={onClick} icon="plus"/>;
}

export function DetailHeading({ title, status, tone = "neutral", subtitle, leading, action }: {
  title: string; status?: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; subtitle?: string; leading?: ReactNode; action?: ReactNode;
}) {
  return <div className="bo-detail-heading">{leading}
    <div className="bo-detail-heading-main"><h1>{title}</h1>{status != null && <Status tone={tone}>{status}</Status>}{action}</div>
    {subtitle && <p>{subtitle}</p>}
  </div>;
}

export function MetricTiles({ children }: { children: ReactNode }) {
  return <div className="metrics-grid bo-metric-tiles">{children}</div>;
}

export function MetricTile({ label, value, hint }: { label: string; value: ReactNode; hint?:string }) {
  return <Metric label={label} value={value} hint={hint}/>;
}

/** Route links and local detail tabs keep their behavior and share one container. */
export function DetailTabs({children,label,role,panelId}:{children:ReactNode;label:string;role?:"navigation"|"tablist";panelId?:string}){
 const root=useRef<HTMLDivElement>(null);
 const nodes=Children.toArray(children);
 const localTabs=role==='tablist'||(!role&&nodes.length>0&&nodes.every(child=>isValidElement(child)&&child.type==='button'));
 useEffect(()=>{const active=root.current?.querySelector<HTMLElement>('[aria-selected="true"],.active');if(!active)return;const container=root.current!;const left=active.offsetLeft-container.offsetLeft,right=left+active.offsetWidth;if(left<container.scrollLeft)container.scrollLeft=left;else if(right>container.scrollLeft+container.clientWidth)container.scrollLeft=right-container.clientWidth;},[children]);
 return <div ref={root} className="tabs" role={localTabs?'tablist':role??'navigation'} aria-label={label}>{nodes.map((child,index)=>{
  if(!localTabs||!isValidElement<{className?:string;onKeyDown?:React.KeyboardEventHandler<HTMLButtonElement>}>(child))return child;
  const selected=child.props.className?.split(/\s+/).includes('active')??false;
  return cloneElement(child,{'role':'tab','aria-selected':selected,tabIndex:selected?0:-1,...(panelId?{id:panelId+'-tab-'+index,'aria-controls':panelId}:{}),onKeyDown:(event:React.KeyboardEvent<HTMLButtonElement>)=>{child.props.onKeyDown?.(event);if(event.defaultPrevented)return;const next=event.key==='Home'?0:event.key==='End'?nodes.length-1:event.key==='ArrowRight'?(index+1)%nodes.length:event.key==='ArrowLeft'?(index+nodes.length-1)%nodes.length:null;if(next===null)return;event.preventDefault();const button=event.currentTarget.parentElement?.children[next] as HTMLButtonElement|undefined;button?.focus();button?.click();}} as Partial<typeof child.props>);
 })}</div>;
}

export function ListSearch({ value, onChange, placeholder = "Suchen ..." }: {
  value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return <label className="searchbox"><Icon name="search" size={19}/><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/></label>;
}

export function RowActions({ label = "Weitere Aktionen", onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return <button className="bo-row-actions" type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}><Icon name="more" size={20}/></button>;
}

function sheetValues(root:HTMLElement|null){return JSON.stringify(Array.from(root?.querySelectorAll<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>('input:not([type="hidden"]),select,textarea')??[]).map(el=>[el.name||el.id,el.type,el.type==='checkbox'||el.type==='radio'?(el as HTMLInputElement).checked:el.value]));}

type SheetProps={label:string;lang?:string;ariaLabel?:string;description?:string;open:boolean;onClose:()=>void;children:ReactNode;busy?:boolean;className?:string;layerClassName?:string;actions?:ReactNode;dirty?:boolean;wizard?:boolean;onBrowserBack?:()=>void;closeLabel?:string;discardText?:{title:string;message:string;cancelLabel:string;confirmLabel:string}};
/** One focus/viewport/header/scroll/footer contract for all sheet families. */
function Sheet({label,lang,description,open,onClose,children,busy=false,className="",layerClassName="",ariaLabel,actions,kind,dirty,wizard=false,onBrowserBack,closeLabel="Schliessen",discardText}:SheetProps&{kind:"action"|"form"|"filter"}){
 const [discard,setDiscard]=useState(false),[backDiscard,setBackDiscard]=useState(false),[changed,setChanged]=useState(false);
 const isDirty=dirty??changed;
 const leaveBack=useBrowserBackGuard(open&&kind==="form"&&(isDirty||!!onBrowserBack),()=>{if(busy)return;if(onBrowserBack){onBrowserBack();return;}setBackDiscard(true);setDiscard(true)},isDirty);
 const baseline=useRef("");

 const closeRef=useRef<()=>void>(()=>{});
 const dialogRef=useDialogFocus(open,()=>closeRef.current());
 const requestClose=()=>{if(busy)return;if(kind==="form"&&(dirty??sheetValues(dialogRef.current)!==baseline.current)){setDiscard(true);return;}onClose()};
 useEffect(()=>{closeRef.current=requestClose;});
 useEffect(()=>{if(open)baseline.current=sheetValues(dialogRef.current);let active=true;queueMicrotask(()=>{if(active)setChanged(false)});return()=>{active=false}},[open,dialogRef]);
 if(!open)return null;
 const body:ReactNode[]=[],footers:ReactNode[]=[];
 for(const child of Children.toArray(children)){
  if(isValidElement<{className?:string;children?:ReactNode}>(child)&&child.props.className?.split(/\s+/).includes("filter-sheet-actions"))footers.push(child);
  else if(isValidElement<{className?:string;children?:ReactNode}>(child)&&child.props.className?.split(/\s+/).includes("sheet-body"))body.push(cloneElement(child,{className:child.props.className.replace(/\bsheet-body\b/g,"").trim()}));
  else body.push(child);
 }
 return createPortal(<><div className={`sheet-layer ${layerClassName}`.trim()} onMouseDown={event=>{if(event.target===event.currentTarget)requestClose()}}><section ref={dialogRef} tabIndex={-1} className={`bottom-sheet ${className}`.trim()} lang={lang} data-sheet-kind={kind} data-wizard={wizard||undefined} role="dialog" aria-modal="true" aria-label={ariaLabel??label} onInvalidCapture={event=>{if(event.target instanceof Element){const details=event.target.closest("details");if(details instanceof HTMLDetailsElement)details.open=true}}} onInputCapture={()=>setChanged(sheetValues(dialogRef.current)!==baseline.current)} onChangeCapture={()=>setChanged(sheetValues(dialogRef.current)!==baseline.current)} onClickCapture={event=>{const button=event.target instanceof Element?event.target.closest('button'):null;if(button&&/^(Abbrechen|Schliessen)$/.test(button.textContent?.trim()??"")){event.preventDefault();event.stopPropagation();requestClose()}}}><div className="sheet-handle"/><header className="sheet-header"><div><h2>{label}</h2>{description&&<p>{description}</p>}</div><button type="button" className="icon-button" aria-label={closeLabel} disabled={busy} onClick={requestClose}><Icon name="close"/></button></header><div className="sheet-body">{body}</div>{actions?<div className="filter-sheet-actions">{actions}</div>:footers}</section></div><ConfirmDialog open={discard} closeLabel={closeLabel} title={discardText?.title??"Änderungen verwerfen?"} message={discardText?.message??"Deine Änderungen sind noch nicht gespeichert und gehen verloren."} cancelLabel={discardText?.cancelLabel??"Weiter bearbeiten"} confirmLabel={discardText?.confirmLabel??"Änderungen verwerfen"} onCancel={()=>{setDiscard(false);setBackDiscard(false)}} onConfirm={()=>{window.dispatchEvent(new Event("binso-draft-discard"));setDiscard(false);if(backDiscard){setBackDiscard(false);leaveBack()}else onClose()}}/></>,document.body);
}
export function ActionSheet(props:SheetProps){return <Sheet {...props} kind="action"/>}
export function FormSheet(props:SheetProps){return <Sheet {...props} kind="form"/>}
export function FilterSheet(props:SheetProps){return <Sheet {...props} kind="filter"/>}

/** The same compact action sheet is used for entity editors on every viewport. */
export function ActionsMenu({label, children, busy=false}: {label:string;children:ReactNode;busy?:boolean}) {
  const [open,setOpen]=useState(false);
  return <><RowActions label={label} disabled={busy} onClick={()=>setOpen(true)}/><ActionSheet label={label} open={open} busy={busy} onClose={()=>setOpen(false)}><div className="action-list" onClick={event=>{if(!busy&&event.target instanceof Element&&event.target.closest("button,a"))setOpen(false)}}>{children}</div></ActionSheet></>;
}

/** Canonical two-line row shared by entity and financial lists. */
export function ListRow({href,onClick,title,meta,value,valueLabel,status,tone="neutral",compact=false}:{href?:string;onClick?:()=>void;title:ReactNode;meta:ReactNode;value?:ReactNode;valueLabel?:string;status?:string;tone?:"success"|"warning"|"danger"|"neutral"|"info";compact?:boolean}){
 const content=<><b>{title}</b>{status&&<Status tone={tone}>{status}</Status>}<small>{meta}</small>{value!=null&&<span className="document-summary-amount">{valueLabel&&<small>{valueLabel}</small>}<strong>{value}</strong></span>}</>;
 const className=`document-summary-row${value!=null?" has-value":""}${compact?" is-compact":""}`;
 return href?<Link prefetch={false} href={href} className={className}>{content}</Link>:onClick?<button type="button" onClick={onClick} className={className}>{content}</button>:<div className={className}>{content}</div>;
}
