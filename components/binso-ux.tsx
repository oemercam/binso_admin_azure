"use client";

import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useDialogFocus } from "./use-dialog-focus";
import { Button, Icon, Metric, Status } from "@/components/ui";

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

export function ListSearch({ value, onChange, placeholder = "Suchen ..." }: {
  value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return <label className="searchbox"><Icon name="search" size={19}/><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/></label>;
}

export function RowActions({ label = "Weitere Aktionen", onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return <button className="bo-row-actions" type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}><Icon name="more" size={20}/></button>;
}

export function ActionSheet({label,description,open,onClose,children,busy=false,className="",ariaLabel}: {label:string;ariaLabel?:string;description?:string;open:boolean;onClose:()=>void;children:ReactNode;busy?:boolean;className?:string}) {
  const dialog=useDialogFocus(open,()=>{if(!busy)onClose()});
  if(!open)return null;
  return createPortal(<div className="sheet-layer" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}><section ref={dialog} tabIndex={-1} className={`bottom-sheet ${className}`.trim()} role="dialog" aria-modal="true" aria-label={ariaLabel??label}><div className="sheet-handle"/><header className="sheet-header"><div><h2>{label}</h2>{description&&<p>{description}</p>}</div><button type="button" className="icon-button" aria-label="Schliessen" disabled={busy} onClick={onClose}><Icon name="close"/></button></header>{children}</section></div>,document.body);
}

/** The same compact action sheet is used for entity editors on every viewport. */
export function ActionsMenu({label, children, busy=false}: {label:string;children:ReactNode;busy?:boolean}) {
  const [open,setOpen]=useState(false);
  return <><RowActions label={label} disabled={busy} onClick={()=>setOpen(true)}/><ActionSheet label={label} open={open} busy={busy} onClose={()=>setOpen(false)}><div className="sheet-menu" onClick={event=>{if(!busy&&event.target instanceof Element&&event.target.closest("button,a"))setOpen(false)}}>{children}</div></ActionSheet></>;
}
