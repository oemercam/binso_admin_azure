"use client";
import {usePageAccess} from "@/lib/client/page-access";
import {Children,cloneElement,isValidElement} from "react";
import Link from "next/link";

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    vectorEffect: "non-scaling-stroke" as const,
    shapeRendering: "geometricPrecision" as const,
    "aria-hidden": true,
  };

  const paths: Record<string, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/></>,
    phone: <path d="M5 3h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2Z"/>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    file: <><path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    arrow: <><path d="m9 18 6-6-6-6"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    down: <><path d="m6 9 6 6 6-6"/></>,
    close: <><path d="M6 6l12 12M18 6 6 18"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    receipt: <><path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h3"/></>,
    wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6z"/><path d="M16 11h4"/></>,
    box: <><path d="m4 7 8-4 8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
    support: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4"/><path d="M12 17h.01"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.37.37.7.6 1 .28.35.44.78.4 1.23V13c.03.45-.12.88-.4 1.23-.23.3-.44.63-.6 1Z"/></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    moon: <><path d="M20 15.5A8 8 0 1 1 8.5 4 6.5 6.5 0 0 0 20 15.5Z"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h6v18h-6"/></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5"/><path d="M5 20h14"/></>,
    pause: <><path d="M9 5v14M15 5v14"/></>,
    stop: <rect x="6" y="6" width="12" height="12" rx="1"/>,
    edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14 7 3 3"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
    "eye-off": <><path d="m3 3 18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.7M6.6 6.6C4 8.3 2.5 12 2.5 12s3.5 6 9.5 6a9.8 9.8 0 0 0 3.4-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></>,
  };

  return <svg {...common}>{paths[name] ?? paths.file}</svg>;
}

export function Logo({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return <img className={compact ? "logo logo-compact" : "logo"} src={dark ? (compact ? "/brand/icon-white.svg" : "/brand/logo-white.svg") : (compact ? "/brand/icon-black.svg" : "/brand/logo-black.svg")} alt="Binso" />;
}

export function Status({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`status status-${tone}`}>{children}</span>;
}

export function Button({
  href,
  children,
  variant = "primary",
  icon,
  onClick,
  type = "button",
  className = "",
  disabled = false,
  ariaLabel,
  requiresWrite=false,
}: {
  href?: string;
  children?: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  requiresWrite?:boolean;
}) {
  const access=usePageAccess();
  disabled=disabled||requiresWrite&&!access.write;
  if(href&&!access.canOpen(href))return null;
  const cls = `button button-${variant} ${className}`.trim();
  const body = <>{icon && <Icon name={icon} size={17} />}{children != null && children !== "" && <span>{children}</span>}</>;
  return href && !disabled ? <Link className={cls} href={href} aria-label={ariaLabel}>{body}</Link> : <button className={cls} onClick={onClick} type={type} disabled={disabled} aria-label={ariaLabel}>{body}</button>;
}

export function IconButton({ label, icon, onClick }: { label: string; icon: string; onClick?: () => void }) {
  return <button className="icon-button" type="button" aria-label={label} onClick={onClick}><Icon name={icon}/></button>;
}

export function Metric({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: string }) {
  return <div className="metric"><div className="metric-top"><span>{label}</span>{icon && <Icon name={icon} size={18}/>}</div><strong>{value}</strong>{hint && <small>{hint}</small>}</div>;
}

export function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-title"><h2>{title}</h2>{action}</div>;
}

export function Field({ label, children, className = "",allowReadOnlyInput=false }: { label: string; children: React.ReactNode; className?: string;allowReadOnlyInput?:boolean }) {
  const access=usePageAccess();
  const fields=access.write||allowReadOnlyInput?children:Children.map(children,child=>isValidElement<Record<string,unknown>>(child)&&typeof child.type==='string'&&['input','select','textarea'].includes(child.type)?cloneElement(child,{disabled:true}):child);
  return <label className={`form-field ${className}`.trim()}><span>{label}</span>{fields}</label>;
}

export function EmptyState({ icon = "file", title, text, action }: { icon?: string; title: string; text: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={22}/></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function Divider() {
  return <div className="divider" aria-hidden="true" />;
}

export function Toggle({ checked = false, label, onChange }: { checked?: boolean; label: string; onChange?: () => void }) {
  return <button className={`toggle ${checked ? "is-on" : ""}`} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange}><span/></button>;
}

export function Toast({ title, text, tone = "success" }: { title: string; text?: string; tone?: "success" | "danger" | "info" }) {
  return <div className={`toast toast-${tone}`} role="status">
    <span className="toast-icon"><Icon name={tone === "danger" ? "close" : tone === "info" ? "bell" : "check"} size={16}/></span>
    <div><b>{title}</b>{text && <small>{text}</small>}</div>
  </div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`.trim()} aria-hidden="true"/>;
}
