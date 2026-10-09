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
export function ActionRow({title,icon,href,onClick,disabled=false,requiresWrite=false,danger=false,navigation=false}: {
 title:string;icon:string;href?:string;onClick?:()=>void;disabled?:boolean;requiresWrite?:boolean;danger?:boolean;navigation?:boolean;
}) {
 const access=usePageAccess();
 if(href&&!access.canOpen(href))return null;
 const blocked=disabled||(requiresWrite&&!access.write);
 const className=`action-row${danger?" action-row-danger":""}`;
 const body=<><Icon name={icon} size={18}/><span>{title}</span>{!danger&&(navigation||href)&&<Icon name="arrow" size={16}/>}</>;
 return href&&!blocked?<Link href={href} onClick={onClick} className={className}>{body}</Link>:<button type="button" className={className} disabled={blocked} onClick={onClick}>{body}</button>;
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
export function DetailTabs({children,label,role="navigation"}:{children:ReactNode;label:string;role?:"navigation"|"tablist"}){
 return <div className="tabs" role={role} aria-label={label}>{children}</div>;
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

type SheetProps={label:string;ariaLabel?:string;description?:string;open:boolean;onClose:()=>void;children:ReactNode;busy?:boolean;className?:string;layerClassName?:string;actions?:ReactNode;dirty?:boolean;wizard?:boolean};
/** One focus/viewport/header/scroll/footer contract for all sheet families. */
function Sheet({label,description,open,onClose,children,busy=false,className="",layerClassName="",ariaLabel,actions,kind,dirty,wizard=false}:SheetProps&{kind:"action"|"form"|"filter"}){
 const [discard,setDiscard]=useState(false),[backDiscard,setBackDiscard]=useState(false),[changed,setChanged]=useState(false);
 const leaveBack=useBrowserBackGuard(open&&kind==="form"&&(dirty??changed),()=>{setBackDiscard(true);setDiscard(true)});
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
 return createPortal(<><div className={`sheet-layer ${layerClassName}`.trim()} onMouseDown={event=>{if(event.target===event.currentTarget)requestClose()}}><section ref={dialogRef} tabIndex={-1} className={`bottom-sheet ${className}`.trim()} data-sheet-kind={kind} data-wizard={wizard||undefined} role="dialog" aria-modal="true" aria-label={ariaLabel??label} onInputCapture={()=>setChanged(sheetValues(dialogRef.current)!==baseline.current)} onChangeCapture={()=>setChanged(sheetValues(dialogRef.current)!==baseline.current)} onClickCapture={event=>{const button=event.target instanceof Element?event.target.closest('button'):null;if(button&&/^(Abbrechen|Schliessen)$/.test(button.textContent?.trim()??"")){event.preventDefault();event.stopPropagation();requestClose()}}}><div className="sheet-handle"/><header className="sheet-header"><div><h2>{label}</h2>{description&&<p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Schliessen" disabled={busy} onClick={requestClose}><Icon name="close"/></button></header><div className="sheet-body">{body}</div>{actions?<div className="filter-sheet-actions">{actions}</div>:footers}</section></div><ConfirmDialog open={discard} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Änderungen verwerfen" onCancel={()=>{setDiscard(false);setBackDiscard(false)}} onConfirm={()=>{setDiscard(false);if(backDiscard){setBackDiscard(false);leaveBack()}else onClose()}}/></>,document.body);
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
