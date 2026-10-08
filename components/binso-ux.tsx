"use client";

import type { ReactNode } from "react";
import { Icon, Status } from "@/components/ui";

/** Shared visual contract for Binso One. Existing page navigation is intentionally untouched. */
export function PageHeading({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <header className="bo-page-heading">
    <div className="bo-page-heading-main"><h1>{title}</h1>{action}</div>
    {description && <p>{description}</p>}
  </header>;
}

export function CreateAction({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button type="button" className="bo-create-action" aria-label={label} title={label} disabled={disabled} onClick={onClick}><Icon name="plus" size={22}/></button>;
}

export function DetailHeading({ title, status, tone = "neutral", subtitle }: {
  title: string; status?: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info"; subtitle?: string;
}) {
  return <div className="bo-detail-heading">
    <div className="bo-detail-heading-main"><h1>{title}</h1>{status != null && <Status tone={tone}>{status}</Status>}</div>
    {subtitle && <p>{subtitle}</p>}
  </div>;
}

export function MetricTiles({ children }: { children: ReactNode }) {
  return <div className="bo-metric-tiles">{children}</div>;
}

export function MetricTile({ label, value }: { label: string; value: ReactNode }) {
  return <div className="bo-metric-tile"><span>{label}</span><strong>{value}</strong></div>;
}

export function ListSearch({ value, onChange, placeholder = "Suchen ..." }: {
  value: string; onChange: (value: string) => void; placeholder?: string;
}) {
  return <label className="searchbox bo-list-search"><Icon name="search" size={19}/><input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder}/></label>;
}

export function RowActions({ label = "Weitere Aktionen", onClick, disabled = false }: { label?: string; onClick: () => void; disabled?: boolean }) {
  return <button className="bo-row-actions" type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled}><Icon name="more" size={20}/></button>;
}
