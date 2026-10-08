"use client";

import { DocumentSummaryRow, FinancialSummaryRow, type DocumentListItem } from "../document-list";
import { formatCurrency, businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../app-shell";
import { invoices, payments } from "@/lib/demo-data";
import { apiGet, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, SectionTitle } from "../ui";
import { MetricTiles, MetricTile } from "../binso-ux";
import { moneyChf, swissDate, paymentMethodLabel } from "./shared";

export function RevenueInsight({invoices,onMonthChange}:{invoices?:Array<Record<string,unknown>>;onMonthChange?:(month:number)=>void}) {
  const [activeMonth,setActiveMonth]=useState(()=>Number(businessDate().slice(5,7))-1);
  const months=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"], current=Array<number>(12).fill(0), previous=Array<number>(12).fill(0);
  {const year=Number(businessDate().slice(0,4));for(const invoice of invoices??[]){const date=new Date(String(invoice.issue_date??""));if(Number.isNaN(date.getTime())) continue;const amount=Number(invoice.total??0);if(date.getFullYear()===year) current[date.getMonth()]+=amount;else if(date.getFullYear()===year-1) previous[date.getMonth()]+=amount;}}
  const currentMonth=Number(businessDate().slice(5,7))-1;
  const total=current.reduce((a,b)=>a+b,0), comparableTotal=current.slice(0,currentMonth).reduce((a,b)=>a+b,0), previousTotal=previous.slice(0,currentMonth).reduce((a,b)=>a+b,0), change=previousTotal?((comparableTotal-previousTotal)/previousTotal*100):null, max=Math.max(1,...current,...previous);
  const activeChange=activeMonth<currentMonth&&previous[activeMonth]>0?((current[activeMonth]-previous[activeMonth])/previous[activeMonth])*100:null;
  return <section className="surface revenue-insight">
    <div className="revenue-insight-head"><div><h2>Umsatzentwicklung</h2><div className="revenue-total">{moneyChf(total)}</div>{change!==null&&<p className={change<0?"trend-negative":"trend-positive"}>{change<0?"↘":"↗"} {change.toFixed(1)} % <span>Jan–{months[currentMonth-1]} zum Vorjahr</span></p>}</div><span className="revenue-period">{businessDate().slice(0,4)}</span></div>
    <div className="revenue-bar-detail" aria-live="polite"><><b>{months[activeMonth]} · {moneyChf(current[activeMonth])}</b><span>{activeMonth===currentMonth?"Laufender Monat":activeMonth>currentMonth?"Künftiger Monat":activeChange===null?"Kein Vorjahreswert":`${activeChange>=0?"+":""}${activeChange.toFixed(1)} % zum Vorjahr`}</span></></div>
    <div className="revenue-bars" aria-label="Monatsumsatz im laufenden Jahr">
      {current.map((value,index)=>{const delta=index<currentMonth&&previous[index]>0?(value-previous[index])/previous[index]:null;const direction=delta===null?"neutral":delta>=0?"up":"down";return <button type="button" key={months[index]} className={`${direction} ${activeMonth===index?"active":""}`} onClick={()=>{setActiveMonth(index);onMonthChange?.(index)}} aria-pressed={activeMonth===index} aria-label={`${months[index]} ${moneyChf(value)}`}><i style={{height:`${value>0?Math.max(18,value/max*100):0}%`}}/><span>{months[index]}</span></button>})}
    </div>
  </section>;
}

export function DashboardPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const production=useBackendMode()&&!forceDemo;
  const [data,setData]=useState<{canInvoices?:boolean;canPayments?:boolean;stats?:Record<string,unknown>;invoices?:Array<Record<string,unknown>>;payments?:Array<Record<string,unknown>>;analyticsPayments?:Array<Record<string,unknown>>;analyticsInvoices?:Array<Record<string,unknown>>}>({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [dashboardMonth,setDashboardMonth]=useState(()=>Number(businessDate().slice(5,7))-1);

  useEffect(()=>{
    let active=true;
    apiGet<typeof data>(isProductionBackendEnabled()&&!forceDemo?"/api/dashboard":"/api/demo/dashboard")
      .then(payload=>{if(active){setData(payload);setError(null);}})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Übersicht konnte nicht geladen werden.");})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[production,forceDemo]);

  if(loading||error)return <AppShell title="Übersicht" subtitle="Dein Unternehmen auf einen Blick." active="dashboard">
    {loading?<p role="status">Übersicht wird geladen …</p>:<div role="alert"><p>{error}</p><Button onClick={()=>window.location.reload()}>Erneut versuchen</Button></div>}
  </AppShell>;

  const invoices=data.invoices??[];
  const paymentsData=data.payments??[];
  const analyticsInvoices=data.analyticsInvoices??[];
  const analyticsPayments=data.analyticsPayments??[];
  const selectedYear=Number(businessDate().slice(0,4));
  const monthInvoices=analyticsInvoices.filter(item=>{const d=new Date(String(item.issue_date??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthPayments=analyticsPayments.filter(item=>{const d=new Date(String(item.paid_on??item.created_at??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthRevenue=monthInvoices.reduce((sum,item)=>sum+Number(item.total??0),0);
  const monthPaid=monthPayments.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const customerCount=Number(data.stats?.customer_count??0);
  const monthInvoiceCount=monthInvoices.reduce((sum,item)=>sum+Number(item.invoice_count??1),0);

  return <AppShell title="Übersicht" subtitle="Dein Unternehmen auf einen Blick." active="dashboard">
    {data.canInvoices!==false&&data.canPayments!==false&&<section className="dashboard-summary"><SectionTitle title="Auf einen Blick" action={<span>{new Date(selectedYear,dashboardMonth,1).toLocaleDateString("de-CH",{month:"long",year:"numeric"})}</span>}/><MetricTiles>
      <MetricTile label="Monatsumsatz" value={moneyChf(monthRevenue)} hint="Im Monat"/>
      <MetricTile label="Zahlungen" value={moneyChf(monthPaid)} hint="Im Monat"/>
      <MetricTile label="Rechnungen" value={String(monthInvoiceCount)} hint="Im Monat"/>
      <MetricTile label="Kunden" value={String(customerCount)} hint="Gesamt"/>
    </MetricTiles></section>}
    <section className="quick-section"><SectionTitle title="Schnellzugriff"/><div className="quick-grid"><Button href="/kunden/neu?returnTo=/dashboard" variant="secondary" icon="plus">Kunde</Button><Button href="/angebote/neu?returnTo=/dashboard" variant="secondary" icon="plus">Angebot</Button><Button href="/rechnungen/neu?returnTo=/dashboard" variant="secondary" icon="plus">Rechnung</Button><Button href="/zeit?returnTo=/dashboard" variant="secondary" icon="plus">Zeit</Button></div></section>
    {data.canInvoices!==false&&data.canPayments!==false&&<RevenueInsight invoices={analyticsInvoices} onMonthChange={setDashboardMonth}/>}
    <div className="dashboard-grid">
      {data.canInvoices!==false&&<section className="surface">
        <SectionTitle title="Letzte Rechnungen" action={<Link href="/rechnungen">Alle anzeigen</Link>}/>
        {invoices.length?<div className="recent-invoices">{invoices.map(item=><DocumentSummaryRow key={String(item.id)} item={item as DocumentListItem} customerHeading compact/>)}</div>:<p>Keine Rechnungen erfasst.</p>}
      </section>}
      {data.canPayments!==false&&<section className="surface">
        <SectionTitle title="Letzte Zahlungen" action={<Link href="/zahlungen">Alle anzeigen</Link>}/>
        {paymentsData.length?<div className="recent-invoices">{paymentsData.map(item=>{const customer=item.customer as {name?:string}|undefined;const invoice=item.invoice as {number?:string;currency?:string}|undefined;return <FinancialSummaryRow href={"/zahlungen/"+String(item.id)} key={String(item.id)} title={[customer?.name,swissDate(item.paid_on)].filter(Boolean).join(" · ")} status={({booked:"Verbucht",pending:"Ausstehend",reversed:"Storniert"} as Record<string,string>)[String(item.status??"booked")]??String(item.status)} tone={item.status==="reversed"?"danger":"success"} meta={[invoice?.number,paymentMethodLabel(item.method)].filter(Boolean).join(" · ")} amount={formatCurrency(Number(item.amount),String(item.currency??invoice?.currency??"CHF"))} compact/>})}</div>:<p>Keine Zahlungen erfasst.</p>}
      </section>}
    </div>

  </AppShell>;
}
