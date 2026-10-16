"use client";

import type {ReactNode} from "react";
import {LocalizedText} from "@/lib/client/locale";
import {useApiQuery} from "@/lib/client/use-api-query";
import {usePageAccess} from "@/lib/client/page-access";
import {formatCurrency} from "@/lib/financial-status";
import {Icon,IconButton} from "./ui";

const sections:Record<string,string>={dashboard:"Übersicht",kunden:"Kunden",angebote:"Verkauf",rechnungen:"Verkauf",zahlungen:"Finanzen",finanzen:"Finanzen",produkte:"Produkte",projekte:"Projekte",zeit:"Zeiterfassung",mitarbeiter:"Team",spesen:"Spesen",berichte:"Berichte",support:"Support",einstellungen:"Einstellungen",benachrichtigungen:"Benachrichtigungen"};

/** The same quiet section marker precedes list, detail and editor headings. */
export function FlowSectionLabel({section}:{section:string}){
 return <div className="flow-section-label"><LocalizedText>{sections[section]??section}</LocalizedText></div>;
}

export function FlowNavigationBackdrop({open,onClose}:{open:boolean;onClose:()=>void}){
 return open?<IconButton className="flow-navigation-backdrop" icon="close" label="Navigation schliessen" onClick={onClose}/>:null;
}

/** Presentation only: callers retain ownership of authoritative values and actions. */
export function FlowSummary({label,value,children,tone="sand",icon="receipt"}:{label:string;value:ReactNode;children?:ReactNode;tone?:"sand"|"sage"|"plain";icon?:string}){
 return <section className={`flow-summary-card flow-summary-${tone}`}><div><small><LocalizedText>{label}</LocalizedText></small><strong>{value}</strong>{children&&<div className="flow-summary-meta">{children}</div>}</div><span className="flow-summary-symbol" aria-hidden="true"><Icon name={icon}/></span></section>;
}

/** Full ledger totals, never a sum of the current filtered/paginated document page. */
export function FlowReceivablesSummary(){
 const access=usePageAccess();
 const query=useApiQuery<{invoices:Array<{currency:string;open_amount:number;overdue_count:number}>}>(access.canOpen('/finanzen')?'/api/finance/overview':null);
 if(!query.data?.invoices?.length||query.error)return null;
 return <div className="flow-summary-stack">{query.data.invoices.map(row=><FlowSummary key={row.currency} label="Offene Forderungen" value={formatCurrency(row.open_amount,row.currency)}><LocalizedText>{row.overdue_count}</LocalizedText>{" "}<LocalizedText>überfällig</LocalizedText></FlowSummary>)}</div>;
}
