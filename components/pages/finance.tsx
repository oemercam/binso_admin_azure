"use client";

import { DocumentList, DocumentSummaryRow, FinanceTabs, type DocumentListItem } from "../document-list";
import { formatCurrency, businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "../app-shell";
import { expenses, invoices, offers, payments } from "@/lib/demo-data";
import {useApiQuery} from "@/lib/client/use-api-query";
import { isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { buildFinanceMonths, financeWindow, financeMetrics, inFinancePeriod } from "@/lib/finance-periods";
import {Button, Field, Icon, Metric, SectionTitle, Input, LoadingState, ErrorState} from "../ui";
import { ActionSheet, FormSheet, FilterSheet, CreateAction, MetricTiles, MetricTile } from "../binso-ux";
import { moneyChf, formatMinutes } from "./shared";

export function FinanceAnalysisPage() {
  const production=useBackendMode();
  const query=useApiQuery<{payments?:Array<Record<string,unknown>>;expenses?:Array<Record<string,unknown>>;payroll?:Array<Record<string,unknown>>;operatingCosts?:Array<Record<string,unknown>>}>(isProductionBackendEnabled()&&production?"/api/finance":"/api/demo/finance");
  const data=query.data??{},{loading,error}=query;
  const [range,setRange]=useState("month");
  const [focusMonth,setFocusMonth]=useState<string|null>(null);
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,setCustomTo]=useState("");
  const ranges:Record<string,{label:string;months:number}>={month:{label:"Dieser Monat",months:1},last:{label:"Letzter Monat",months:1},three:{label:"3 Monate",months:3},year:{label:"Dieses Jahr",months:12},previous:{label:"Letztes Jahr",months:12}};
  const rangeBounds=financeWindow(range,customFrom,customTo,businessDate());
  const bounds=focusMonth?(()=>{const [year,month]=focusMonth.split("-").map(Number);const start=new Date(year,month-1,1);return{start:new Date(Math.max(start.getTime(),rangeBounds.start.getTime())),end:new Date(Math.min(new Date(year,month,1).getTime(),rangeBounds.end.getTime()))}})():rangeBounds;
  const {income,expense,operating,staff,result}=financeMetrics(data,bounds);
  const monthReview=buildFinanceMonths(data,rangeBounds);
  const monthly=monthReview.items;
  const singlePeriod=monthly.length===1||focusMonth!==null;
  const customInvalid=range==="custom"&&(!customFrom||!customTo||customFrom>customTo);
  return <AppShell title="Finanzen" subtitle="Einnahmen, Kosten und Ergebnis nach Zeitraum." active="finanzen">
    {loading&&<LoadingState>Finanzdaten werden geladen …</LoadingState>}
    {error&&<ErrorState>{error}</ErrorState>}
    <div className="finance-range" aria-label="Zeitraum">{Object.entries(ranges).map(([key,item])=><button type="button" className={range===key&&!focusMonth?"active":""} key={key} onClick={()=>{setRange(key);setFocusMonth(null)}}>{item.label}</button>)}<button type="button" className={range==="custom"&&!focusMonth?"active":""} onClick={()=>{setRange("custom");setFocusMonth(null)}}>Zeitraum wählen</button></div>
    {range==="custom"&&<div className="finance-custom-range"><Field label="Von"><Input type="date" value={customFrom} onChange={e=>{setCustomFrom(e.target.value);setFocusMonth(null)}}/></Field><Field label="Bis"><Input type="date" value={customTo} min={customFrom||undefined} onChange={e=>{setCustomTo(e.target.value);setFocusMonth(null)}}/></Field>{customInvalid&&<small>Bitte einen gültigen Zeitraum von–bis wählen.</small>}</div>}
    {!loading&&!error&&!customInvalid&&<>
    {!singlePeriod&&<MetricTiles><Metric label="Einnahmen" value={moneyChf(income)} hint="Verbuchte Zahlungen" /><Metric label="Ausgaben" value={moneyChf(expense+operating)} hint="Spesen und Betrieb" /><Metric label="Personalkosten" value={moneyChf(staff)} hint="Bruttolöhne im Zeitraum" /><Metric label="Ergebnis" value={moneyChf(result)} hint="Einnahmen minus Kosten" /></MetricTiles>}

    <section className="finance-analysis">
      <div className="section-title"><div><span className="eyebrow">{singlePeriod?"FINANZFLUSS":"MONATSVERGLEICH"}</span><h2>{singlePeriod?"So entsteht dein Ergebnis":"Einnahmen, Kosten und Ergebnis"}</h2></div>{focusMonth&&<button type="button" className="text-action" onClick={()=>setFocusMonth(null)}>Zeitraum anzeigen</button>}</div>
      {singlePeriod?<div className="finance-flow" aria-label="Finanzfluss">
        <div className="finance-flow-primary"><span>Einnahmen</span><strong>{moneyChf(income)}</strong></div>
        <div className="finance-flow-costs"><div><span>Betrieb</span><strong>− {moneyChf(operating)}</strong></div><div><span>Spesen</span><strong>− {moneyChf(expense)}</strong></div><div><span>Personal</span><strong>− {moneyChf(staff)}</strong></div></div>
        <div className="finance-flow-result"><span>Ergebnis</span><strong>{moneyChf(result)}</strong><small>{income>0?((result/income)*100).toLocaleString("de-CH",{maximumFractionDigits:1})+" % Marge":"Keine Marge berechenbar"}</small></div>
      </div>:<div className="finance-period-table" role="table" aria-label="Finanzvergleich nach Monat">
        <div className="finance-period-head" role="row"><span>Monat</span><span>Einnahmen</span><span>Kosten</span><span>Ergebnis</span></div>
        {monthly.map(item=><button type="button" role="row" key={item.key} onClick={()=>setFocusMonth(item.key)}><b>{item.label}</b><span>{moneyChf(item.income)}</span><span>{moneyChf(item.costs)}</span><strong>{moneyChf(item.result)}</strong></button>)}
      </div>}
    </section>
    {!singlePeriod&&monthReview.truncated&&<p>Monatsvergleich: letzte 24 Monate. Die Summen gelten für den gesamten Zeitraum.</p>}
    </>}
  </AppShell>;
}

export function FinancialDocumentsPage({kind,forceDemo=false}:{kind:"offer"|"invoice";forceDemo?:boolean}){
 const production=useBackendMode()&&!forceDemo;
 const {data,loading,error}=useApiQuery<{items:DocumentListItem[]}>(isProductionBackendEnabled()&&production?`/api/documents?kind=${kind}`:`/api/demo/data?collection=documents&kind=${kind}`);
 const items=data?.items??[];
 const invoice=kind==="invoice",title=invoice?"Rechnungen":"Angebote",route=invoice?"rechnungen":"angebote";
 return <AppShell title={title} active={route} actions={<CreateAction href={`/${route}/neu`} label={invoice?"Neue Rechnung":"Neues Angebot"}/>}><FinanceTabs/><DocumentList items={items} kind={kind} loading={loading} error={error}/></AppShell>;
}

export function OffersPage({forceDemo=false}:{forceDemo?:boolean}={}){return <FinancialDocumentsPage kind="offer" forceDemo={forceDemo}/>;}

export function InvoicesPage({forceDemo=false}:{forceDemo?:boolean}={}){return <FinancialDocumentsPage kind="invoice" forceDemo={forceDemo}/>;}

export type FinancialSummary={invoices:Array<{currency:string;open_count:number;overdue_count:number;draft_count:number;open_amount:number;revenue:number}>;offers:{draft_count:number;actionable_count:number}|null;time:{hours:number;ready_hours:number;invoiced_hours:number}|null};

export function FinancePage(){
 const query=useApiQuery<FinancialSummary&{documents:DocumentListItem[];data:Parameters<typeof buildFinanceMonths>[0]}>("/api/finance/overview?include=workspace");
 const summary=query.data,items=summary?.documents??[],data=summary?.data??{}, {loading,error}=query;
 const [range,setRange]=useState("three"),[filterOpen,setFilterOpen]=useState(false);
 const [chartDetail,setChartDetail]=useState<string|null>(null);
 const [from,setFrom]=useState(""),[to,setTo]=useState("");
 const [pendingRange,setPendingRange]=useState("three"),[pendingFrom,setPendingFrom]=useState(""),[pendingTo,setPendingTo]=useState("");
 const openPeriod=()=>{setPendingRange(range);setPendingFrom(from);setPendingTo(to);setFilterOpen(true)};
 const {start,end}=financeWindow(range,from,to,businessDate());
 const pending=financeWindow(pendingRange,pendingFrom,pendingTo,businessDate());
 const pendingValid=Number.isFinite(pending.start.getTime())&&Number.isFinite(pending.end.getTime())&&pending.end>pending.start;
 const valid=Number.isFinite(start.getTime())&&Number.isFinite(end.getTime())&&end>start;
 const months=buildFinanceMonths(data,{start,end});
 const inPeriod=(value:unknown)=>inFinancePeriod(value,{start,end});
 const {income,costs,result}=financeMetrics(data,{start,end});
 const currencies=(summary?.invoices??[]).filter(item=>Number(item.open_count)>0).map(item=>item.currency);
 const labels:Record<string,string>={month:"Dieser Monat",last:"Letzter Monat",three:"Letzte 3 Monate",six:"Letzte 6 Monate",year:"Dieses Jahr",custom:"Eigener Zeitraum"};
 return <AppShell title="Finanzen" active="finanzen"><FinanceTabs/>
   <div className="toolbar finance-overview-toolbar"><button type="button" className="period-trigger" aria-label="Zeitraum auswählen" onClick={openPeriod}><Icon name="calendar"/><span>{labels[range]}</span><Icon name="down"/></button><button type="button" className="icon-button" aria-label="Finanzfilter" onClick={openPeriod}><Icon name="filter"/></button></div>
   {loading?<LoadingState>Finanzen werden geladen …</LoadingState>:error?<ErrorState>{error}</ErrorState>:!valid?<ErrorState>Bitte einen gültigen Zeitraum wählen.</ErrorState>:<>
     <MetricTiles><MetricTile label="Einnahmen" value={moneyChf(income)} hint="Im Zeitraum"/><MetricTile label="Ausgaben" value={moneyChf(costs)} hint="Im Zeitraum"/><MetricTile label="Ergebnis" value={moneyChf(result)} hint="Im Zeitraum"/><MetricTile label="Offene Rechnungen" hint="Aktuell offen" value={currencies.length?currencies.map(currency=><span key={currency}>{formatCurrency(summary?.invoices.find(item=>item.currency===currency)?.open_amount??0,currency)} </span>):moneyChf(0)}/></MetricTiles>
     <section className="finance-analysis finance-overview-months"><SectionTitle title="Monatsentwicklung" action={<span>{months.items[0]?.label}–{months.items.at(-1)?.label}</span>}/><div className="finance-overview-chart" aria-label="Monatsentwicklung: Einnahmen und Ausgaben">{months.items.map(item=>{const max=Math.max(1,...months.items.flatMap(month=>[month.income,month.costs]));return <button type="button" key={item.key} aria-label={`${item.label}: Einnahmen ${moneyChf(item.income)}, Ausgaben ${moneyChf(item.costs)}`} onFocus={()=>setChartDetail(`${item.label}: Einnahmen ${moneyChf(item.income)} · Ausgaben ${moneyChf(item.costs)}`)} onMouseEnter={()=>setChartDetail(`${item.label}: Einnahmen ${moneyChf(item.income)} · Ausgaben ${moneyChf(item.costs)}`)} onClick={()=>{setFrom(item.key+"-01");setTo(businessMonthEnd(item.key));setRange("custom")}}><span className="finance-bar-pair"><i style={{height:`${Math.max(0,item.income)/max*100}%`}}/><i style={{height:`${Math.max(0,item.costs)/max*100}%`}}/></span><small>{item.label}</small></button>})}</div><p className="chart-legend"><span>Einnahmen: gefüllt</span> · <span>Ausgaben: umrandet</span></p>{chartDetail&&<p className="chart-legend" role="status">{chartDetail}</p>}{months.truncated&&<p>Monatsentwicklung: letzte 24 Monate.</p>}</section>
     <SectionTitle title="Rechnungen" action={<Link href="/rechnungen">Alle anzeigen</Link>}/><div>{items.filter(item=>item.kind==='invoice'&&inPeriod(item.issue_date)).sort((a,b)=>String(b.issue_date).localeCompare(String(a.issue_date))).slice(0,5).map(item=><DocumentSummaryRow key={item.number} item={item} compact/>)}{!items.some(item=>item.kind==='invoice'&&inPeriod(item.issue_date))&&<p>Keine Rechnungen im Zeitraum</p>}</div>
     <SectionTitle title="Handlungsbedarf"/><div className="compact-list"><Link href="/rechnungen"><b>Offene Rechnungen prüfen</b><span>{(summary?.invoices??[]).reduce((count,item)=>count+Number(item.open_count),0)}</span><Icon name="arrow" size={16}/></Link><Link href="/angebote"><b>Angebote weiterführen</b><span>{summary?.offers?.actionable_count??0}</span><Icon name="arrow" size={16}/></Link>{summary?.time&&<Link href="/zeit"><b>Freigegebene Zeit verrechnen</b><span>{formatMinutes(Number(summary.time.ready_hours)*60)} h</span><Icon name="arrow" size={16}/></Link>}<Link href="/finanzen/analyse"><b>Weitere Finanzinformationen</b><Icon name="arrow" size={16}/></Link></div>
   </>}
   <FilterSheet label="Zeitraum auswählen" open={filterOpen} onClose={()=>setFilterOpen(false)}><div className="sheet-body"><div className="period-options">{Object.entries(labels).map(([key,label])=><label key={key}><Input type="radio" name="finance-period" value={key} checked={pendingRange===key} onChange={()=>setPendingRange(key)}/><span>{label}</span></label>)}</div>{pendingRange==="custom"&&<div className="form-grid two"><Field allowReadOnlyInput label="Von"><Input type="date" value={pendingFrom} max={pendingTo||undefined} onChange={event=>setPendingFrom(event.target.value)}/></Field><Field allowReadOnlyInput label="Bis"><Input type="date" value={pendingTo} min={pendingFrom||undefined} onChange={event=>setPendingTo(event.target.value)}/></Field></div>}</div><div className="filter-sheet-actions"><Button disabled={!pendingValid} onClick={()=>{setRange(pendingRange);setFrom(pendingFrom);setTo(pendingTo);setFilterOpen(false)}}>Anwenden</Button></div></FilterSheet>
 </AppShell>;
}

export function businessMonthEnd(key:string){const [year,month]=key.split("-").map(Number);return key+"-"+String(new Date(year,month,0).getDate()).padStart(2,"0")}

export function DocumentsHubPage(){return <FinancePage/>;}
