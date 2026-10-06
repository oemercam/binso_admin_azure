"use client";

import Link from "next/link";
import {loadTheme,saveTheme} from "@/lib/client/theme";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { readTimer, changeTimer } from "@/lib/client/time-tracker";
import { AppShell } from "./app-shell";
import { RecordRow, RecordsView } from "./records";
import { InvoicePreview } from "./documents";
export { InvoiceEditor, OfferEditor } from "./documents";
import { customers, employees, expenses, invoices, offers, payments, products } from "@/lib/demo-data";
import { appendDemoRow, type DemoCollection } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {plans as subscriptionPlans} from '@/lib/plans';
import {legalConfig} from '@/config/legal';
import { Button, EmptyState, Field, Icon, Metric, SectionTitle, Status, Toast, Toggle } from "./ui";

function moneyChf(value:unknown){
  const amount=Number(value);
  return `CHF ${Number.isFinite(amount)?amount.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}`;
}

function paymentMethodLabel(value:unknown){
  const labels:Record<string,string>={bank:"Banküberweisung",bank_transfer:"Banküberweisung",card:"Kreditkarte",cash:"Bar",twint:"TWINT"};
  const raw=String(value??"—");return labels[raw.toLowerCase()]??raw;
}

function swissDate(value:unknown){
  if(typeof value!=="string") return "";
  const parts=value.slice(0,10).split("-");
  return parts.length===3?`${parts[2]}.${parts[1]}.${parts[0]}`:value;
}

type NotificationRecord={
  id:string;
  kind:string;
  title:string;
  body:string;
  href?:string|null;
  read_at?:string|null;
  created_at:string;
};

function notificationIcon(kind:string){
  if(kind==="support") return "support";
  if(kind==="payment"||kind==="billing") return "wallet";
  if(kind==="document") return "file";
  return "bell";
}

function notificationDate(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":date.toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"});
}

function mapRemoteRows(collection:DemoCollection,items:Record<string,unknown>[]):string[][]{
  if(collection==="customers") return items.map(item=>[
    String(item.name??""),String(item.sector??"—"),String(item.city??"—"),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="products") return items.map(item=>[
    String(item.name??""),item.kind==="product"?"Produkt":"Dienstleistung",moneyChf(item.unit_price),String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="employees") return items.map(item=>[
    [item.first_name,item.last_name].filter(Boolean).join(" "),String(item.job_title??"—"),`${String(item.workload_percent??0)}%`,String(item.id??""),item.status==="inactive"?"Inaktiv":"Aktiv"
  ]);
  if(collection==="expenses") return items.map(item=>{
    const employee=item.employee as {first_name?:string;last_name?:string}|null|undefined;
    const person=employee?[employee.first_name,employee.last_name].filter(Boolean).join(" "):"Nicht zugewiesen";
    const statusMap:Record<string,string>={draft:"Entwurf",submitted:"Eingereicht",approved:"Genehmigt",rejected:"Abgelehnt"};
    return [String(item.merchant??""),person,moneyChf(item.amount),String(item.id??""),statusMap[String(item.status)]??String(item.status??"")];
  });
  if(collection==="payments") return items.map(item=>{
    const customer=item.customer as {name?:string}|null|undefined;
    const invoice=item.invoice as {number?:string}|null|undefined;
    const statusMap:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
    return [String(item.id??""),swissDate(item.paid_on),String(customer?.name??"Kunde"),[invoice?.number,paymentMethodLabel(item.method)].filter(Boolean).join(" · "),moneyChf(item.amount),statusMap[String(item.status)]??String(item.status??"")];
  });
  return [];
}

function useDemoRows(collection:DemoCollection, defaults:string[][]) {
  const [rows,setRows]=useState<string[][]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    const sync=()=>{
      const path=isProductionBackendEnabled()?`/api/${collection}`:`/api/demo/data?collection=${collection}`;
      apiGet<{items:Record<string,unknown>[]}>(path)
        .then(payload=>{if(active){setRows(mapRemoteRows(collection,payload.items));setError(null);}})
        .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Einträge konnten nicht geladen werden.");})
        .finally(()=>{if(active)setLoading(false);});
    };
    sync();
    const listener=(event:Event)=>{
      const detail=(event as CustomEvent<{collection?:string}>).detail;
      if(!detail?.collection||detail.collection===collection)sync();
    };
    window.addEventListener("binso-demo-data",listener);
    window.addEventListener("storage",sync);
    return()=>{active=false;window.removeEventListener("binso-demo-data",listener);window.removeEventListener("storage",sync);};
  },[collection,defaults]);
  return {rows,loading,error};
}

function RevenueInsight({invoices,demo=false,onMonthChange}:{invoices?:Array<Record<string,unknown>>;demo?:boolean;onMonthChange?:(month:number)=>void}) {
  const [activeMonth,setActiveMonth]=useState(()=>new Date().getMonth());
  const months=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"], current=[7800,11200,10100,14500,12700,16200,18100,15900,16600,19800,20100,23400], previous=[3600,5400,6200,9300,7700,8500,11900,10800,9400,13600,12600,16500];
  if(!demo){current.fill(0);previous.fill(0);const now=new Date();for(const invoice of invoices??[]){const date=new Date(String(invoice.issue_date??""));if(Number.isNaN(date.getTime())) continue;const amount=Number(invoice.total??0);if(date.getFullYear()===now.getFullYear()) current[date.getMonth()]+=amount;else if(date.getFullYear()===now.getFullYear()-1) previous[date.getMonth()]+=amount;}}
  const total=current.reduce((a,b)=>a+b,0), previousTotal=previous.reduce((a,b)=>a+b,0), change=previousTotal?((total-previousTotal)/previousTotal*100):0, max=Math.max(1,...current,...previous);
  const activeChange=previous[activeMonth]>0?((current[activeMonth]-previous[activeMonth])/previous[activeMonth])*100:null;
  return <section className="surface revenue-insight">
    <div className="revenue-insight-head"><div><span className="eyebrow">FINANZEN</span><h2>Umsatzentwicklung</h2><div className="revenue-total">{moneyChf(total)}</div><p className="trend-positive">↗ {change.toFixed(1)} % <span>zum Vorjahr</span></p></div><span className="revenue-period">12 Monate</span></div>
    <div className="revenue-bar-detail" aria-live="polite"><><b>{months[activeMonth]} · {moneyChf(current[activeMonth])}</b><span>{activeChange===null?"Kein Vorjahreswert":`${activeChange>=0?"+":""}${activeChange.toFixed(1)} % zum Vorjahr`}</span></></div>
    <div className="revenue-bars" aria-label="Umsatz der letzten zwölf Monate">
      {current.map((value,index)=>{const delta=previous[index]>0?(value-previous[index])/previous[index]:null;const direction=delta===null?"neutral":delta>=0?"up":"down";return <button type="button" key={months[index]} className={`${direction} ${activeMonth===index?"active":""}`} onClick={()=>{setActiveMonth(index);onMonthChange?.(index)}} aria-label={`${months[index]} ${moneyChf(value)}`}><i style={{height:`${value>0?Math.max(18,value/max*100):0}%`}}/><span>{months[index]}</span></button>})}
    </div>
  </section>;
}

export function DashboardPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const production=useBackendMode()&&!forceDemo;
  const [data,setData]=useState<{stats?:Record<string,unknown>;invoices?:Array<Record<string,unknown>>;payments?:Array<Record<string,unknown>>;analyticsPayments?:Array<Record<string,unknown>>;analyticsInvoices?:Array<Record<string,unknown>>}>({});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [dashboardMonth,setDashboardMonth]=useState(()=>new Date().getMonth());

  useEffect(()=>{
    if(forceDemo) return;
    let active=true;
    apiGet<typeof data>(isProductionBackendEnabled()?"/api/dashboard":"/api/demo/dashboard")
      .then(payload=>{if(active){setData(payload);setError(null);}})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Übersicht konnte nicht geladen werden.");})
      .finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[production,forceDemo]);

  if(forceDemo) return <AppShell title="Guten Morgen, Thomas" subtitle="Hier ist die Übersicht zu deinem Unternehmen." active="dashboard" preview={forceDemo}>
    <div className="metrics-grid"><Metric label="Umsatz im Monat" value={moneyChf([7800,11200,10100,14500,12700,16200,18100,15900,16600,19800,20100,23400][dashboardMonth])} hint="Rechnungsvolumen" icon="chart"/><Metric label="Rechnungen" value={String([4,5,5,7,6,8,9,8,8,10,10,12][dashboardMonth])} hint="In diesem Monat" icon="receipt"/><Metric label="Zahlungseingänge" value={moneyChf([6900,9800,9400,13100,11800,14900,16500,15100,15400,18100,18900,21600][dashboardMonth])} hint="Verbucht im Monat" icon="wallet"/><Metric label="Neue Kunden" value={String([1,2,1,3,2,2,3,1,2,3,2,4][dashboardMonth])} hint="In diesem Monat" icon="users"/></div>
    <RevenueInsight demo onMonthChange={setDashboardMonth}/><div className="dashboard-grid"><section className="surface"><SectionTitle title="Letzte Aktivitäten" action={<Link href="/benachrichtigungen">Alle anzeigen</Link>}/><div className="activity-list">{[["Rechnung bezahlt","Acme AG · CHF 4’346.40","receipt","/rechnungen/RE-2026-019"],["Neuer Kunde","Berger Bau AG","users","/kunden/berger-bau"],["Angebot angenommen","Müller GmbH · CHF 3’200.00","file","/angebote/AN-2026-012"],["Zeit erfasst","Website Redesign · 4:30 h","clock","/zeit"]].map(([a,b,icon,href])=><Link href={href} key={a}><span className="activity-icon"><Icon name={icon}/></span><div><b>{a}</b><small>{b}</small></div><Icon name="arrow" size={16}/></Link>)}</div></section></div>
    <section className="quick-section"><SectionTitle title="Schnellzugriff"/><div className="quick-grid"><Button href="/kunden/neu?returnTo=/dashboard" variant="secondary" icon="users">Kunde erfassen</Button><Button href="/angebote/neu?returnTo=/dashboard" variant="secondary" icon="file">Angebot erstellen</Button><Button href="/rechnungen/neu?returnTo=/dashboard" variant="secondary" icon="receipt">Rechnung erstellen</Button><Button href="/zeit?returnTo=/dashboard" variant="secondary" icon="clock">Zeit erfassen</Button></div></section>
  </AppShell>;

  if(loading||error)return <AppShell title="Übersicht" subtitle="Dein Unternehmen auf einen Blick." active="dashboard">
    {loading?<p role="status">Übersicht wird geladen …</p>:<div role="alert"><p>{error}</p><Button onClick={()=>window.location.reload()}>Erneut versuchen</Button></div>}
  </AppShell>;

  const invoices=data.invoices??[];
  const paymentsData=data.payments??[];
  const analyticsInvoices=data.analyticsInvoices??[];
  const analyticsPayments=data.analyticsPayments??[];
  const selectedYear=new Date().getFullYear();
  const monthInvoices=analyticsInvoices.filter(item=>{const d=new Date(String(item.issue_date??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthPayments=analyticsPayments.filter(item=>{const d=new Date(String(item.paid_on??item.created_at??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthRevenue=monthInvoices.reduce((sum,item)=>sum+Number(item.total??0),0);
  const monthPaid=monthPayments.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const monthCustomers=monthInvoices.reduce((sum,item)=>sum+Number(item.customer_count??0),0);
  const monthInvoiceCount=monthInvoices.reduce((sum,item)=>sum+Number(item.invoice_count??1),0);

  return <AppShell title="Übersicht" subtitle="Dein Unternehmen auf einen Blick." active="dashboard">
    <div className="metrics-grid">
      <Metric label="Umsatz im Monat" value={moneyChf(monthRevenue)} hint="Rechnungsvolumen" icon="chart"/>
      <Metric label="Rechnungen" value={String(monthInvoiceCount)} hint="In diesem Monat" icon="receipt"/>
      <Metric label="Zahlungseingänge" value={moneyChf(monthPaid)} hint="Verbucht im Monat" icon="wallet"/>
      <Metric label="Kunden" value={String(monthCustomers)} hint="Mit Rechnungen im Monat" icon="users"/>
    </div>
    <RevenueInsight invoices={analyticsInvoices} onMonthChange={setDashboardMonth}/>
    <div className="dashboard-grid">
      <section className="surface">
        <SectionTitle title="Letzte Rechnungen" action={<Link href="/rechnungen">Alle Rechnungen</Link>}/>
        {invoices.length?<div className="recent-invoices">{invoices.map(item=>{const customer=item.customer as {name?:string}|undefined;return <Link href={"/rechnungen/"+encodeURIComponent(String(item.number))} key={String(item.id)}><b>{customer?.name??"Kunde"}</b><span>{String(item.number)}</span></Link>})}</div>:<p>Keine Rechnungen erfasst.</p>}
      </section>
      <section className="surface">
        <SectionTitle title="Letzte Zahlungen" action={<Link href="/zahlungen">Alle Zahlungen</Link>}/>
        {paymentsData.length?<div className="activity-list">{paymentsData.map(item=>{const customer=item.customer as {name?:string}|undefined;const invoice=item.invoice as {number?:string}|undefined;return <Link href={"/zahlungen/"+String(item.id)} key={String(item.id)}><span className="activity-icon"><Icon name="wallet"/></span><div><b>{moneyChf(item.amount)}</b><small>{[customer?.name,invoice?.number,swissDate(item.paid_on)].filter(Boolean).join(" · ")}</small></div><Icon name="arrow" size={16}/></Link>})}</div>:<p>Keine Zahlungen erfasst.</p>}
      </section>
    </div>
    <section className="quick-section"><SectionTitle title="Schnellzugriff"/><div className="quick-grid"><Button href="/kunden/neu?returnTo=/dashboard" variant="secondary" icon="users">Kunde erfassen</Button><Button href="/angebote/neu?returnTo=/dashboard" variant="secondary" icon="file">Angebot erstellen</Button><Button href="/rechnungen/neu?returnTo=/dashboard" variant="secondary" icon="receipt">Rechnung erstellen</Button><Button href="/zeit?returnTo=/dashboard" variant="secondary" icon="clock">Zeit erfassen</Button></div></section>
  </AppShell>;
}

export function FinancePage() {
  const production=useBackendMode();
  const [data,setData]=useState<{payments?:Array<Record<string,unknown>>;expenses?:Array<Record<string,unknown>>;payroll?:Array<Record<string,unknown>>;operatingCosts?:Array<Record<string,unknown>>}>({});
  const [error,setError]=useState<string|null>(null);
  const [range,setRange]=useState("month");
  const [focusMonth,setFocusMonth]=useState<string|null>(null);
  const [customFrom,setCustomFrom]=useState("");
  const [customTo,setCustomTo]=useState("");
  useEffect(()=>{apiGet<typeof data>(isProductionBackendEnabled()?"/api/finance":"/api/demo/finance").then(payload=>{setData(payload);setError(null)}).catch(e=>setError(e instanceof Error?e.message:"Finanzdaten konnten nicht geladen werden."))},[production]);
  const now=new Date();
  const ranges:Record<string,{label:string;months:number}>={month:{label:"Dieser Monat",months:1},last:{label:"Letzter Monat",months:1},three:{label:"3 Monate",months:3},year:{label:"12 Monate",months:12},previous:{label:"Letztes Jahr",months:12}};
  const customRange=range==="custom"&&customFrom&&customTo;
  const rangeBounds=(()=>{if(customRange){const start=new Date(customFrom+"T00:00:00");const end=new Date(customTo+"T00:00:00");end.setDate(end.getDate()+1);return{start,end}}let end=new Date(now.getFullYear(),now.getMonth()+1,1),start=new Date(now.getFullYear(),now.getMonth(),1);if(range==="last"){end=start;start=new Date(end.getFullYear(),end.getMonth()-1,1)}else if(range==="three")start=new Date(end.getFullYear(),end.getMonth()-3,1);else if(range==="year")start=new Date(end.getFullYear(),end.getMonth()-12,1);else if(range==="previous"){start=new Date(now.getFullYear()-1,0,1);end=new Date(now.getFullYear(),0,1)}return{start,end}})();
  const bounds=focusMonth?(()=>{const [year,month]=focusMonth.split("-").map(Number);const start=new Date(year,month-1,1);return{start,end:new Date(year,month,1)}})():rangeBounds;
  const payments=(data.payments??[]);
  const selected=payments.filter(item=>{const d=new Date(String(item.payment_date??""));return d>=bounds.start&&d<bounds.end});
  const income=selected.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const inRange=(value:unknown)=>{const d=new Date(String(value??""));return d>=bounds.start&&d<bounds.end};
  const expense=((data.expenses??[])).filter(x=>inRange(x.expense_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const operating=((data.operatingCosts??[])).filter(x=>inRange(x.cost_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const staff=((data.payroll??[])).filter(x=>{const d=new Date(String(x.period??"")+"-01");return d>=bounds.start&&d<bounds.end}).reduce((s,x)=>s+Number(x.gross_amount??0),0);
  const costs=expense+operating+staff,result=income-costs;
  const customMonths=customRange?Math.max(1,Math.min(24,(rangeBounds.end.getFullYear()-rangeBounds.start.getFullYear())*12+rangeBounds.end.getMonth()-rangeBounds.start.getMonth()+1)):0;
  const visibleMonths=range==="custom"?customMonths:ranges[range].months;
  const monthly=Array.from({length:Math.min(24,visibleMonths)},(_,i)=>{
    const d=new Date(rangeBounds.end.getFullYear(),rangeBounds.end.getMonth()-1-i,1);
    const sameMonth=(value:unknown)=>{const x=new Date(String(value??""));return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()};
    const monthIncome=payments.filter(item=>sameMonth(item.payment_date)).reduce((s,item)=>s+Number(item.amount??0),0);
    const monthExpense=(data.expenses??[]).filter(item=>sameMonth(item.expense_date)).reduce((s,item)=>s+Number(item.amount??0),0);
    const monthOperating=(data.operatingCosts??[]).filter(item=>sameMonth(item.cost_date)).reduce((s,item)=>s+Number(item.amount??0),0);
    const monthStaff=(data.payroll??[]).filter(item=>sameMonth(String(item.period??"")+"-01")).reduce((s,item)=>s+Number(item.gross_amount??0),0);
    const monthCosts=monthExpense+monthOperating+monthStaff;
    return{key:String(d.getFullYear())+"-"+String(d.getMonth()+1).padStart(2,"0"),label:d.toLocaleDateString("de-CH",{month:"short"}),income:monthIncome,costs:monthCosts,result:monthIncome-monthCosts};
  }).reverse();
  const singlePeriod=(range!=="custom"&&ranges[range].months===1)||focusMonth!==null;
  const customInvalid=range==="custom"&&(!customFrom||!customTo||customFrom>customTo);
  return <AppShell title="Finanzen" subtitle="Einnahmen, Kosten und Ergebnis nach Zeitraum." active="finanzen">
    {error&&<p role="alert">{error}</p>}
    <div className="finance-range" aria-label="Zeitraum">{Object.entries(ranges).map(([key,item])=><button type="button" className={range===key&&!focusMonth?"active":""} key={key} onClick={()=>{setRange(key);setFocusMonth(null)}}>{item.label}</button>)}<button type="button" className={range==="custom"&&!focusMonth?"active":""} onClick={()=>{setRange("custom");setFocusMonth(null)}}>Zeitraum wählen</button></div>
    {range==="custom"&&<div className="finance-custom-range"><Field label="Von"><input type="date" value={customFrom} onChange={e=>{setCustomFrom(e.target.value);setFocusMonth(null)}}/></Field><Field label="Bis"><input type="date" value={customTo} min={customFrom||undefined} onChange={e=>{setCustomTo(e.target.value);setFocusMonth(null)}}/></Field>{customInvalid&&<small>Bitte einen gültigen Zeitraum von–bis wählen.</small>}</div>}
    <div className="metrics-grid finance-metrics"><Metric label="Einnahmen" value={moneyChf(income)} hint="Verbuchte Zahlungen" icon="wallet"/><Metric label="Ausgaben" value={moneyChf(expense+operating)} hint="Spesen und Betrieb" icon="card"/><Metric label="Personalkosten" value={moneyChf(staff)} hint="Bruttolöhne im Zeitraum" icon="users"/><Metric label="Ergebnis" value={moneyChf(result)} hint="Einnahmen minus Kosten" icon="chart"/></div>
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
    <div className="finance-breakdown"><section><h3>Kostenübersicht</h3><div><span>Betriebsausgaben</span><strong>{moneyChf(operating)}</strong></div><div><span>Personalkosten</span><strong>{moneyChf(staff)}</strong></div><div><span>Spesen</span><strong>{moneyChf(expense)}</strong></div></section><section><h3>Datenbasis</h3><p>Einnahmen stammen aus verbuchten Zahlungen. Spesen, Betriebskosten und freigegebene Lohnläufe werden für denselben Zeitraum aus der Datenbank ausgewertet.</p></section></div>
  </AppShell>;
}

export function CustomersPage() {
  const {rows:customerRows,loading,error}=useDemoRows("customers",customers);
  return <AppShell title="Kunden" subtitle="Kunden, Kontakte und Aktivitäten zentral verwalten." active="kunden" actions={<Button href="/kunden/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neuer Kunde"><span className="create-action-label">Neuer Kunde</span></Button>}>
    <div className="customer-records-layout">
      <div>
        <RecordsView loading={loading} error={error} items={customerRows} placeholder="Kunden suchen...">{(row)=>{const [name,sector,city,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"acme";const status=statusMaybe??idOrStatus;return <RecordRow href={"/kunden/"+id} title={name} meta={`${sector} · ${city}`} status={status}/>}}</RecordsView>
      </div>

    </div>
  </AppShell>;
}

export function CustomerDetail({customerId="acme"}:{customerId?:string}) {
  const production=useBackendMode();
  const searchParams=useSearchParams();
  const requestedReturnTo=searchParams.get("returnTo");
  const returnTo=requestedReturnTo==="/dashboard"?"/dashboard":"/kunden";
  const [tab,setTab]=useState<"overview"|"contacts"|"docs"|"activity">("overview");
  const [contactOpen,setContactOpen]=useState(false);
  const [contactToast,setContactToast]=useState<string|null>(null);
  const [customer,setCustomer]=useState<Record<string,unknown>|null>(null);
  const [contacts,setContacts]=useState<Array<Record<string,unknown>>>([]);
  const [customerDocuments,setCustomerDocuments]=useState<Array<Record<string,unknown>>>([]);
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [contactPhone,setContactPhone]=useState("");
  const [contactRole,setContactRole]=useState("");

  useEffect(()=>{
    if(!production) return;
    Promise.all([
      apiGet<{item:Record<string,unknown>}>("/api/customers/"+encodeURIComponent(customerId)),
      apiGet<{items:Array<Record<string,unknown>>}>("/api/customers/"+encodeURIComponent(customerId)+"/contacts"),
      apiGet<{items:Array<Record<string,unknown>>}>("/api/customers/"+encodeURIComponent(customerId)+"/documents"),
    ]).then(([customerPayload,contactPayload,documentPayload])=>queueMicrotask(()=>{
      setCustomer(customerPayload.item);
      setContacts(contactPayload.items);
      setCustomerDocuments(documentPayload.items);
    })).catch(()=>undefined);
  },[production,customerId]);

  const saveContact=async()=>{
    if(!production){setContactToast("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");return;}
    try{
      const payload=await apiPost<{item:Record<string,unknown>}>("/api/customers/"+encodeURIComponent(customerId)+"/contacts",{
        firstName,lastName,email:contactEmail,phone:contactPhone,jobTitle:contactRole,isPrimary:contacts.length===0,
      });
      setContacts(current=>[...current,payload.item]);
      setFirstName("");setLastName("");setContactEmail("");setContactPhone("");setContactRole("");
      setContactOpen(false);
      setContactToast("Kontakt gespeichert.");
    }catch(error){
      setContactToast(error instanceof Error?error.message:"Kontakt konnte nicht gespeichert werden.");
    }
    window.setTimeout(()=>setContactToast(null),2600);
  };

  if(!production){
    return <AppShell title="Acme AG" subtitle="Bauunternehmen · Zürich" active="kunden" backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":"Kunden"} >
      <div className="customer-detail-workspace">
        <aside className="customer-info-pane"><span className="compact-section-label">Firma</span><strong>Acme AG</strong><dl className="detail-list"><div><dt>Status</dt><dd>Aktiv</dd></div><div><dt>Ort</dt><dd>Zürich</dd></div><div><dt>Branche</dt><dd>Bauunternehmen</dd></div></dl></aside><aside className="customer-info-pane"><span className="compact-section-label">Firma</span><strong>{name}</strong><dl className="detail-list"><div><dt>Status</dt><dd>{status==="active"?"Aktiv":"Inaktiv"}</dd></div><div><dt>Ort</dt><dd>{city||"—"}</dd></div><div><dt>Branche</dt><dd>{sector||"—"}</dd></div></dl></aside><div className="desktop-detail-main"><div className="tabs"><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button><button className={tab==="docs"?"active":""} onClick={()=>setTab("docs")}>Belege</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button></div>
      {tab==="overview"&&<div className="detail-grid"><section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>Acme AG</dd></div><div><dt>E-Mail</dt><dd>info@acme.ch</dd></div><div><dt>Telefon</dt><dd>+41 44 123 45 67</dd></div><div><dt>Adresse</dt><dd>Bahnhofstrasse 123<br/>8001 Zürich</dd></div><div><dt>UID</dt><dd>CHE-123.456.789</dd></div></dl></section></div>}
      {tab==="contacts"&&<section className="surface customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" onClick={()=>setContactOpen(true)}>Kontakt</Button>}/><div className="contact-list"><div><span className="record-avatar">TM</span><div><b>Thomas Meier</b><small>Geschäftsführer · thomas.meier@acme.ch · +41 79 123 45 67</small></div><Status tone="success">Hauptkontakt</Status></div></div></section>}
      {tab==="docs"&&<section className="surface customer-tab-panel"><SectionTitle title="Belege"/><div className="compact-list"><Link href="/rechnungen/RE-2026-019"><b>RE-2026-019</b><span>12.09.2026 · CHF 4’346.40</span><Status tone="success">Bezahlt</Status></Link></div></section>}
      {tab==="activity"&&<section className="surface customer-tab-panel"><SectionTitle title="Aktivität"/><div className="timeline"><div><i/><div><b>Kundendaten aktualisiert</b><small>Demo</small></div></div></div></section>}</div>
        <aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Übersicht</span><div className="desktop-summary-facts"><span>Kontakte <b>1</b></span><span>Belege <b>1</b></span></div></section><section className="desktop-toolbox" aria-label="Kundenaktionen"><Link href="/angebote/neu"><Icon name="file"/><span><b>Angebot erstellen</b><small>Neues Angebot für den Kunden</small></span><Icon name="arrow" size={15}/></Link><Link href="/rechnungen/neu"><Icon name="receipt"/><span><b>Rechnung erstellen</b><small>Neue Rechnung für den Kunden</small></span><Icon name="arrow" size={15}/></Link><button type="button" onClick={()=>setContactOpen(true)}><Icon name="users"/><span><b>Kontakt hinzufügen</b><small>Ansprechperson erfassen</small></span><Icon name="arrow" size={15}/></button></section></aside>
      </div>
      {contactOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setContactOpen(false)}}><section className="bottom-sheet contact-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Kontakt hinzufügen</h2><p>Kontakt wird direkt Acme AG zugeordnet.</p></div><button className="icon-button" onClick={()=>setContactOpen(false)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="form-grid two"><Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><input value={contactRole} onChange={e=>setContactRole(e.target.value)}/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setContactOpen(false)}>Abbrechen</Button><Button onClick={()=>void saveContact()}>Kontakt speichern</Button></div></section></div>}
      {contactToast&&<Toast title={contactToast}/>}
    </AppShell>;
  }

  if(!customer) return <AppShell title="Kunde" subtitle="Daten werden geladen." active="kunden" backHref="/kunden" backLabel="Kunden"><EmptyState icon="users" title="Kunde wird geladen" text="Die Kundendaten werden abgerufen."/></AppShell>;

  const name=String(customer.name??"Kunde");
  const sector=String(customer.sector??"");
  const city=String(customer.city??"");
  const status=String(customer.status??"active");
  return <AppShell title={name} subtitle={[sector,city].filter(Boolean).join(" · ")} active="kunden" backHref="/kunden" backLabel="Kunden" >
    <div className="customer-detail-workspace">
      <div className="desktop-detail-main"><div className="tabs"><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button><button className={tab==="docs"?"active":""} onClick={()=>setTab("docs")}>Belege</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button></div>
    {tab==="overview"&&<div className="detail-grid"><section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>{name}</dd></div><div><dt>E-Mail</dt><dd>{String(customer.email??"—")}</dd></div><div><dt>Telefon</dt><dd>{String(customer.phone??"—")}</dd></div><div><dt>Adresse</dt><dd>{String(customer.street??"—")}<br/>{[customer.postal_code,customer.city].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>UID</dt><dd>{String(customer.uid??"—")}</dd></div></dl></section></div>}
    {tab==="contacts"&&<section className="surface customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" onClick={()=>setContactOpen(true)}>Kontakt</Button>}/>{contacts.length?<div className="contact-list">{contacts.map(contact=>{const fullName=[contact.first_name,contact.last_name].filter(Boolean).join(" ");const initials=String(contact.first_name??"").slice(0,1)+String(contact.last_name??"").slice(0,1);return <div key={String(contact.id)}><span className="record-avatar">{initials.toUpperCase()}</span><div><b>{fullName}</b><small>{[contact.job_title,contact.email,contact.phone].filter(Boolean).join(" · ")}</small></div>{contact.is_primary===true&&<Status tone="success">Hauptkontakt</Status>}</div>})}</div>:<EmptyState icon="users" title="Noch keine Kontakte" text="Füge den ersten Ansprechpartner für diesen Kunden hinzu."/>}</section>}
    {tab==="docs"&&<section className="surface customer-tab-panel"><SectionTitle title="Belege"/>{customerDocuments.length?<div className="compact-list">{customerDocuments.map(item=>{const kind=String(item.kind);const statusValue=String(item.status??"draft");const statusLabel:Record<string,string>={draft:"Entwurf",sent:"Gesendet",accepted:"Angenommen",declined:"Abgelehnt",open:"Offen",partial:"Teilweise bezahlt",paid:"Bezahlt",overdue:"Überfällig",cancelled:"Storniert"};return <Link href={(kind==="offer"?"/angebote/":"/rechnungen/")+String(item.number)} key={String(item.id)}><b>{String(item.number)}</b><span>{swissDate(item.issue_date)} · {moneyChf(item.total)}</span><Status tone={statusValue==="paid"||statusValue==="accepted"?"success":statusValue==="overdue"||statusValue==="declined"?"danger":"warning"}>{statusLabel[statusValue]??statusValue}</Status></Link>})}</div>:<EmptyState icon="receipt" title="Noch keine Belege" text="Angebote und Rechnungen für diesen Kunden erscheinen hier."/>}</section>}
    {tab==="activity"&&<section className="surface customer-tab-panel"><SectionTitle title="Aktivität"/><div className="timeline"><div><i/><div><b>Kunde erstellt</b><small>{new Date(String(customer.created_at)).toLocaleString("de-CH")}</small></div></div><div><i/><div><b>Zuletzt aktualisiert</b><small>{new Date(String(customer.updated_at)).toLocaleString("de-CH")}</small></div></div></div></section>}</div>
      <aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Übersicht</span><div className="desktop-summary-facts"><span>Kontakte <b>{contacts.length}</b></span><span>Belege <b>{customerDocuments.length}</b></span></div></section><section className="desktop-toolbox" aria-label="Kundenaktionen"><Link href="/angebote/neu"><Icon name="file"/><span><b>Angebot erstellen</b><small>Neues Angebot für den Kunden</small></span><Icon name="arrow" size={15}/></Link><Link href="/rechnungen/neu"><Icon name="receipt"/><span><b>Rechnung erstellen</b><small>Neue Rechnung für den Kunden</small></span><Icon name="arrow" size={15}/></Link><button type="button" onClick={()=>setContactOpen(true)}><Icon name="users"/><span><b>Kontakt hinzufügen</b><small>Ansprechperson erfassen</small></span><Icon name="arrow" size={15}/></button></section></aside>
    </div>
    {contactOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setContactOpen(false)}}><section className="bottom-sheet contact-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Kontakt hinzufügen</h2><p>{"Kontakt wird direkt "+name+" zugeordnet."}</p></div><button className="icon-button" onClick={()=>setContactOpen(false)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="form-grid two"><Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><input value={contactRole} onChange={e=>setContactRole(e.target.value)} placeholder="z. B. Buchhaltung"/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setContactOpen(false)}>Abbrechen</Button><Button onClick={()=>void saveContact()}>Kontakt speichern</Button></div></section></div>}
    {contactToast&&<Toast title={contactToast} tone={contactToast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function CustomerForm() {
  const router=useRouter();
  const searchParams=useSearchParams();
  const returnTo=searchParams.get("returnTo")==="/dashboard"?"/dashboard":"/kunden";
  const [company,setCompany]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [city,setCity]=useState("");
  const [sector,setSector]=useState("Dienstleistung");
  const [address,setAddress]=useState("");
  const [postalCode,setPostalCode]=useState("");
  const [uid,setUid]=useState("");
  const [notes,setNotes]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const save=async()=>{
    if(!company.trim() || !city.trim()){
      setToast("Firmenname und Ort sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(isProductionBackendEnabled()) await apiPost("/api/customers",{name:company.trim(),sector,email,phone,city,address,postalCode,uid,notes});
      else appendDemoRow("customers",[company.trim(),sector,city.trim(),"Aktiv"]);
      setToast("Kunde gespeichert.");
      window.setTimeout(()=>router.push("/kunden"),700);
    }catch(error){
      setToast(error instanceof Error?error.message:"Kunde konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };
  return <AppShell title="Kunde erstellen" subtitle="Nur die wichtigsten Angaben. Details kannst du später ergänzen." active="kunden" backHref="/kunden" backLabel="Kunden" actions={<Button onClick={save}>Speichern</Button>}>
    <div className="form-page">
      <section className="form-section clean">
        <h2>Grundangaben</h2>
        <div className="form-grid two">
          <Field label="Firmenname"><input autoFocus value={company} onChange={e=>setCompany(e.target.value)} placeholder="Firma oder Name"/></Field>
          <Field label="E-Mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@firma.ch"/></Field>
          <Field label="Telefon"><input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+41 00 000 00 00"/></Field>
          <Field label="Ort"><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Zürich"/></Field>
          <Field label="Branche"><select value={sector} onChange={e=>setSector(e.target.value)}><option>Dienstleistung</option><option>Bauunternehmen</option><option>Immobilien</option><option>Beratung</option><option>Handel</option><option>Elektro</option></select></Field>
        </div>
      </section>
      <details className="optional-details"><summary>Weitere Angaben</summary><div className="form-grid two"><Field label="Adresse"><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Strasse und Nummer"/></Field><Field label="PLZ"><input inputMode="numeric" value={postalCode} onChange={e=>setPostalCode(e.target.value)} placeholder="8000"/></Field><Field label="UID"><input value={uid} onChange={e=>setUid(e.target.value)} placeholder="CHE-000.000.000"/></Field><Field label="Interne Notiz"><input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Optional"/></Field></div></details>
      <div className="mobile-sticky-save"><Button onClick={save}>Kunde speichern</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={company.trim()&&city.trim()?"success":"danger"}/>}
  </AppShell>;
}

function useDocumentRows(kind:"offer"|"invoice",defaults:string[][],forceDemo=false){
  const [rows,setRows]=useState<string[][]>([]);
  const [loading,setLoading]=useState(!forceDemo);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    if(forceDemo){queueMicrotask(()=>setRows(defaults));return;}
    apiGet<{items:Array<{number:string;status:string;issue_date:string;total:number;customer?:{name?:string}}>}>(isProductionBackendEnabled()?`/api/documents?kind=${kind}`:`/api/demo/data?collection=documents&kind=${kind}`)
      .then(payload=>{
        const statusMap:Record<string,string>={draft:"Entwurf",sent:"Gesendet",accepted:"Angenommen",declined:"Abgelehnt",open:"Offen",partial:"Teilweise bezahlt",paid:"Bezahlt",overdue:"Überfällig",cancelled:"Storniert"};
        const mapped=payload.items.map(item=>{
          const customer=item.customer?.name??"Kunde";
          const status=statusMap[item.status]??item.status;
          if(kind==="offer") return [item.number,customer,moneyChf(item.total),status];
          return [item.number,customer,swissDate(item.issue_date),moneyChf(item.total),status];
        });
        queueMicrotask(()=>setRows(mapped));
      })
      .catch(reason=>setError(reason instanceof Error?reason.message:"Belege konnten nicht geladen werden."))
      .finally(()=>setLoading(false));
  },[kind,defaults,forceDemo]);
  return {rows,loading,error};
}

export function OffersPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const {rows:offerRows,loading,error}=useDocumentRows("offer",offers,forceDemo);
  return <AppShell title="Angebote" subtitle="Professionelle Angebote in wenigen Klicks erstellen." active="angebote" actions={<Button href="/angebote/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Angebot"><span className="create-action-label">Neues Angebot</span></Button>}>
    <RecordsView loading={loading} error={error} items={offerRows} placeholder="Angebote suchen..." chips={["Alle","Entwurf","Gesendet","Angenommen"]}>{([nr,name,amount,status])=><RecordRow href={`/angebote/${nr}`} icon="file" title={nr} meta={name} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function InvoicesPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const {rows:invoiceRows,loading,error}=useDocumentRows("invoice",invoices,forceDemo);
  return <AppShell title="Rechnungen" subtitle="Erstellen, senden und Zahlungsstatus im Blick behalten." active="rechnungen" actions={<Button href="/rechnungen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neue Rechnung"><span className="create-action-label">Neue Rechnung</span></Button>}>
    <div className="tablet-master-detail invoice-master-detail">
      <div>
        <RecordsView loading={loading} error={error} items={invoiceRows} placeholder="Rechnungen suchen..." chips={["Alle","Offen","Bezahlt","Überfällig"]} statusGroups={{Offen:["Gesendet","Teilweise bezahlt","Überfällig"]}}>{([nr,name,date,amount,status])=><RecordRow href={`/rechnungen/${nr}`} icon="receipt" title={nr} meta={`${name} · ${date}`} value={amount} status={status}/>}</RecordsView>
      </div>
      {forceDemo&&<aside className="tablet-detail invoice-tablet-preview"><InvoicePreview/></aside>}
    </div>
  </AppShell>;
}

export function PaymentsPage() {
  const {rows:paymentRows,loading,error}=useDemoRows("payments",payments);
  return <AppShell title="Zahlungen" subtitle="Eingänge und offene Beträge übersichtlich verwalten." active="zahlungen" actions={<Button href="/zahlungen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Zahlung erfassen"><span className="create-action-label">Zahlung erfassen</span></Button>}>
    <RecordsView loading={loading} error={error} items={paymentRows} placeholder="Zahlungen suchen..." chips={["Alle","Verbucht","Ausstehend"]}>{([id,date,name,meta,amount,status])=><RecordRow href={`/zahlungen/${id}`} icon="wallet" title={`${date} · ${name}`} meta={meta} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function PaymentForm() {
  const router=useRouter();
  const [toast,setToast]=useState<string|null>(null);
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [amount,setAmount]=useState("");
  const [method,setMethod]=useState("Banküberweisung");
  const [idempotencyKey,setIdempotencyKey]=useState("");
  const [invoiceId,setInvoiceId]=useState("");
  const [note,setNote]=useState("");
  const [availableInvoices,setAvailableInvoices]=useState<Array<{id:string;number:string;total:number;paid_amount:number;customer?:{name?:string}}>>([]);
  useEffect(()=>{apiGet<{items:Array<{id:string;number:string;total:number;paid_amount:number;status:string;customer?:{name?:string}}> }>(isProductionBackendEnabled()?"/api/documents?kind=invoice":"/api/demo/data?collection=documents&kind=invoice").then(data=>setAvailableInvoices(data.items.filter(item=>!["draft","cancelled","paid"].includes(item.status)&&Number(item.total)>Number(item.paid_amount)))).catch(()=>setToast("Rechnungen konnten nicht geladen werden."));},[]);
  const selectedInvoice=availableInvoices.find(item=>item.id===invoiceId);

  const save=async()=>{
    const value=Number(amount.replace(",","."));
    if(!selectedInvoice||!Number.isFinite(value)||value<=0){
      setToast("Bitte einen gültigen Betrag erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(isProductionBackendEnabled()){
        const key=idempotencyKey||window.crypto.randomUUID();
        if(!idempotencyKey) setIdempotencyKey(key);
        await apiPost("/api/payments",{invoiceId,paidOn:date,amount:value,method,note},{idempotencyKey:key});
      }
      else{
        const id=String(Date.now());
        const displayDate=date.split("-").reverse().join(".");
        appendDemoRow("payments",[id,displayDate,selectedInvoice.customer?.name??"Demo",`${selectedInvoice.number} · ${method}`,`CHF ${value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}`,"Verbucht"]);
      }
      setToast("Zahlung gespeichert.");
      window.setTimeout(()=>router.push("/zahlungen"),700);
    }catch(error){
      setToast(error instanceof Error?error.message:"Zahlung konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };
  return <AppShell title="Zahlung erfassen" subtitle="Rechnungsdaten werden automatisch übernommen." active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen" actions={<Button onClick={save}>Zahlung speichern</Button>}>
    <div className="form-page narrow">
      <Field label="Rechnung"><select value={invoiceId} onChange={e=>{setInvoiceId(e.target.value);setIdempotencyKey("");const item=availableInvoices.find(x=>x.id===e.target.value);setAmount(item?String(Number(item.total)-Number(item.paid_amount)):"")}}><option value="">Rechnung auswählen</option>{availableInvoices.map(item=><option key={item.id} value={item.id}>{item.number} · {item.customer?.name} · {moneyChf(Number(item.total)-Number(item.paid_amount))}</option>)}</select></Field>
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="Betrag"><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
        <Field label="Zahlungsmethode"><select value={method} onChange={e=>setMethod(e.target.value)}><option>Banküberweisung</option><option>Kreditkarte</option><option>TWINT</option><option>Bar</option></select></Field>
        <Field label="Notiz"><input placeholder="Optional" value={note} onChange={e=>setNote(e.target.value)}/></Field>
      </div>
      <div className="mobile-sticky-save"><Button onClick={save}>Zahlung speichern</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("gültigen")?"danger":"success"}/>}
  </AppShell>;
}

export function PaymentDetail({paymentId="1"}:{paymentId?:string}) {
  const production=useBackendMode();
  const [payment,setPayment]=useState<Record<string,unknown>|null>(null);

  useEffect(()=>{
    if(!production) return;
    apiGet<{item:Record<string,unknown>}>("/api/payments/"+encodeURIComponent(paymentId))
      .then(payload=>queueMicrotask(()=>setPayment(payload.item)))
      .catch(()=>undefined);
  },[production,paymentId]);

  if(!production) return <AppShell title="Zahlung" subtitle="RE-2026-019 · Acme AG" active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="entity-detail-workspace">
      <aside className="entity-info-pane"><span className="compact-section-label">Zahlung</span><strong>Zahlungsdetails</strong><small>Verbuchung und Zuordnung</small></aside>
      <div className="desktop-detail-main"><div className="success-panel"><span><Icon name="check" size={28}/></span><h2>CHF 4’346.40</h2><p>Zahlung erfolgreich verbucht</p><Status tone="success">Verbucht</Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>02.10.2026</dd></div><div><dt>Rechnung</dt><dd>RE-2026-019</dd></div><div><dt>Kunde</dt><dd>Acme AG</dd></div><div><dt>Zahlungsart</dt><dd>Banküberweisung</dd></div></dl></section></div>
      <aside className="desktop-context-rail"><section className="desktop-toolbox"><span className="compact-section-label">Zugehörig</span><Link href="/rechnungen/RE-2026-019"><Icon name="receipt"/><span><b>Rechnung öffnen</b><small>RE-2026-019</small></span><Icon name="arrow" size={15}/></Link><Link href="/kunden/acme"><Icon name="users"/><span><b>Kunde öffnen</b><small>Acme AG</small></span><Icon name="arrow" size={15}/></Link></section></aside>
    </div>
  </AppShell>;

  if(!payment) return <AppShell title="Zahlung" subtitle="Daten werden geladen." active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen"><EmptyState icon="wallet" title="Zahlung wird geladen" text="Die Zahlungsdaten werden abgerufen."/></AppShell>;

  const customer=payment.customer as {name?:string}|null|undefined;
  const invoice=payment.invoice as {number?:string;total?:number}|null|undefined;
  const status=String(payment.status??"booked");
  const statusLabel:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
  return <AppShell title="Zahlung" subtitle={[invoice?.number,customer?.name].filter(Boolean).join(" · ")} active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="entity-detail-workspace">
      <aside className="entity-info-pane"><span className="compact-section-label">Zahlung</span><strong>Zahlungsdetails</strong><small>Verbuchung und Zuordnung</small></aside>
      <div className="desktop-detail-main"><div className="success-panel"><span><Icon name={status==="booked"?"check":"clock"} size={28}/></span><h2>{"CHF "+Number(payment.amount??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}</h2><p>{status==="booked"?"Zahlung verbucht":"Zahlungsstatus"}</p><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}>{statusLabel[status]??status}</Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>{swissDate(payment.paid_on)}</dd></div><div><dt>Rechnung</dt><dd>{invoice?.number??"—"}</dd></div><div><dt>Kunde</dt><dd>{customer?.name??"—"}</dd></div><div><dt>Zahlungsart</dt><dd>{paymentMethodLabel(payment.method)}</dd></div><div><dt>Notiz</dt><dd>{String(payment.note??"—")}</dd></div></dl></section></div>
      <aside className="desktop-context-rail"><section className="desktop-toolbox"><span className="compact-section-label">Zugehörig</span>{invoice?.number&&<Link href={"/rechnungen/"+encodeURIComponent(invoice.number)}><Icon name="receipt"/><span><b>Rechnung öffnen</b><small>{invoice.number}</small></span><Icon name="arrow" size={15}/></Link>}<Link href="/kunden"><Icon name="users"/><span><b>Kundenübersicht</b><small>{customer?.name??"Kunde"}</small></span><Icon name="arrow" size={15}/></Link><Link href="/zahlungen"><Icon name="wallet"/><span><b>Alle Zahlungen</b><small>Zahlungsverlauf öffnen</small></span><Icon name="arrow" size={15}/></Link></section></aside>
    </div>
  </AppShell>;
}

export function ProductsPage() {
  const {rows:productRows,loading,error}=useDemoRows("products",products);
  return <AppShell title="Produkte" subtitle="Produkte und Dienstleistungen zentral verwalten." active="produkte" actions={<Button href="/produkte/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Produkt"><span className="create-action-label">Neues Produkt</span></Button>}>
    <RecordsView loading={loading} error={error} items={productRows} placeholder="Produkte suchen..." chips={["Alle","Dienstleistungen","Produkte"]}>{(row)=>{const [name,type,price,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"beratung";const status=statusMaybe??idOrStatus;return <RecordRow href={"/produkte/"+id} icon="box" title={name} meta={type} value={price} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ProductForm({ existing = false, productId }: { existing?: boolean; productId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [name,setName]=useState("");
  const [type,setType]=useState("Dienstleistung");
  const [sku,setSku]=useState("");
  const [unit,setUnit]=useState("hour");
  const [price,setPrice]=useState("");
  const [vatRate,setVatRate]=useState("8.1");
  const [description,setDescription]=useState("");
  const [status,setStatus]=useState("Aktiv");
  const [toast,setToast]=useState<string|null>(null);

  useEffect(()=>{
    if(!production||!existing||!productId) return;
    apiGet<{item:Record<string,unknown>}>("/api/products/"+encodeURIComponent(productId)).then(payload=>{
      const item=payload.item;
      queueMicrotask(()=>{
        setName(String(item.name??""));
        setType(item.kind==="product"?"Produkt":"Dienstleistung");
        setSku(String(item.sku??""));
        setUnit(String(item.unit??"hour"));
        setPrice(String(item.unit_price??"0.00"));
        setVatRate(String(item.vat_rate??"8.1"));
        setDescription(String(item.description??""));
        setStatus(item.status==="inactive"?"Inaktiv":"Aktiv");
      });
    }).catch(()=>undefined);
  },[production,existing,productId]);

  const save=async()=>{
    if(!name.trim()||!price.trim()){setToast("Name und Verkaufspreis sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    try{
      const numericPrice=Number(price.replace(",","."));
      const payload={name:name.trim(),kind:type==="Produkt"?"product":"service",sku,unit,unitPrice:numericPrice,vatRate:Number(vatRate),description,status:status==="Inaktiv"?"inactive":"active"};
      if(production){
        if(existing&&productId) await apiPatch("/api/products/"+encodeURIComponent(productId),payload);
        else await apiPost("/api/products",payload);
      }else if(!existing){
        appendDemoRow("products",[name.trim(),type,"CHF "+numericPrice.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}),"Aktiv"]);
      }
      setToast("Produkt gespeichert.");
      window.setTimeout(()=>router.push("/produkte"),700);
    }catch(error){
      setToast(error instanceof Error?error.message:"Produkt konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  return <AppShell title={existing ? name||"Produkt" : "Produkt erstellen"} subtitle={existing ? type+" · "+status : "Für Angebote und Rechnungen wiederverwendbar."} active="produkte" backHref="/produkte" backLabel="Produkte" actions={!existing?<Button onClick={()=>void save()}>Speichern</Button>:undefined}>
    <div className={existing?"entity-detail-workspace":"form-page"}>
      {existing&&<aside className="entity-info-pane"><span className="compact-section-label">Produkt</span><strong>{name||"Produkt"}</strong><small>{type} · {status}</small><dl className="detail-list"><div><dt>Einheit</dt><dd>{unit==="hour"?"Stunde":unit==="piece"?"Stück":"Pauschal"}</dd></div><div><dt>MwSt.</dt><dd>{vatRate}%</dd></div></dl></aside>}
      <div className={existing?"entity-edit-main":"entity-edit-main form-main-new"}>
        <div className="form-grid two">
          <Field label="Name"><input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/></Field>
          <Field label="Typ"><select value={type} onChange={e=>setType(e.target.value)}><option>Dienstleistung</option><option>Produkt</option></select></Field>
          <Field label="Artikelnummer"><input value={sku} onChange={e=>setSku(e.target.value)} placeholder="Optional"/></Field>
          <Field label="Einheit"><select value={unit} onChange={e=>setUnit(e.target.value)}><option value="hour">Stunde</option><option value="piece">Stück</option><option value="flat">Pauschal</option></select></Field>
          <Field label="Verkaufspreis"><input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></Field>
          <Field label="MwSt."><select value={vatRate} onChange={e=>setVatRate(e.target.value)}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
          <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></select></Field>
          <Field label="Beschreibung" className="full"><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </div>
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Produktübersicht</span><strong>{price?moneyChf(Number(price.replace(",","."))):"CHF 0.00"}</strong><small>{type} · {unit==="hour"?"Stunde":unit==="piece"?"Stück":"Pauschal"}</small><div className="desktop-summary-facts"><span>Status <b>{status}</b></span><span>MwSt. <b>{vatRate}%</b></span>{sku&&<span>Artikelnummer <b>{sku}</b></span>}</div></section><section className="desktop-toolbox"><button type="button" onClick={()=>void save()}><Icon name="check"/><span><b>Speichern</b><small>Änderungen übernehmen</small></span><Icon name="arrow" size={15}/></button><Link href="/angebote/neu"><Icon name="file"/><span><b>In Angebot verwenden</b><small>Neues Angebot erstellen</small></span><Icon name="arrow" size={15}/></Link><Link href="/rechnungen/neu"><Icon name="receipt"/><span><b>In Rechnung verwenden</b><small>Neue Rechnung erstellen</small></span><Icon name="arrow" size={15}/></Link></section></aside>}
      <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function EmployeesPage() {
  const {rows:employeeRows,loading,error}=useDemoRows("employees",employees);
  return <AppShell title="Mitarbeiter" subtitle="Team, Rollen und Stammdaten verwalten." active="mitarbeiter" actions={<Button href="/mitarbeiter/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Mitarbeiter hinzufügen"><span className="create-action-label">Mitarbeiter hinzufügen</span></Button>}>
    <RecordsView loading={loading} error={error} items={employeeRows} placeholder="Mitarbeiter suchen...">{(row)=>{const [name,role,load,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"thomas";const status=statusMaybe??idOrStatus;return <RecordRow href={"/mitarbeiter/"+id} icon="users" title={name} meta={`${role} · ${load}`} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function EmployeeForm({ existing = false, employeeId }: { existing?: boolean; employeeId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [role,setRole]=useState("");
  const [load,setLoad]=useState(existing?"100":"100");
  const [entryDate,setEntryDate]=useState("");
  const [weeklyHours,setWeeklyHours]=useState("42");
  const [vacationDays,setVacationDays]=useState("25");
  const [address,setAddress]=useState("");
  const [status,setStatus]=useState("Aktiv");
  const [employeeTab,setEmployeeTab]=useState<"overview"|"time"|"expenses"|"documents">("overview");
  const [toast,setToast]=useState<string|null>(null);

  const [ledger,setLedger]=useState<{times:Array<{id:string;started_at:string;duration_minutes:number;project_name:string}>;expenses:Array<{id:string;merchant:string;amount:number;expense_date:string}>;files:Array<{id:string;fileName:string}>}>({times:[],expenses:[],files:[]});
  useEffect(()=>{
    if(!production||!existing||!employeeId)return;
    const encoded=encodeURIComponent(employeeId);
    Promise.all([apiGet<{items:Array<{id:string;started_at:string;duration_minutes:number;project_name:string}>}>("/api/time-entries?employeeId="+encoded),apiGet<{items:Array<{id:string;merchant:string;amount:number;expense_date:string}>}>("/api/expenses?employeeId="+encoded),apiGet<{items:Array<{id:string;fileName:string}>}>("/api/files?employeeId="+encoded)]).then(([times,expenses,files])=>setLedger({times:times.items,expenses:expenses.items,files:files.items})).catch(()=>setToast("Mitarbeiterdaten konnten nicht vollständig geladen werden."));
  },[production,existing,employeeId]);
  useEffect(()=>{
    if(!production||!existing||!employeeId) return;
    apiGet<{item:Record<string,unknown>}>("/api/employees/"+encodeURIComponent(employeeId)).then(payload=>{
      const item=payload.item;
      queueMicrotask(()=>{
        setFirstName(String(item.first_name??""));
        setLastName(String(item.last_name??""));
        setEmail(String(item.email??""));
        setPhone(String(item.phone??""));
        setRole(String(item.job_title??""));
        setLoad(String(item.workload_percent??"100"));
        setEntryDate(String(item.entry_date??item.start_date??""));
        setWeeklyHours(String(item.weekly_hours??"42"));
        setVacationDays(String(item.vacation_days??"25"));
        setAddress(String(item.address??""));
        setStatus(item.status==="inactive"?"Inaktiv":"Aktiv");
      });
    }).catch(()=>undefined);
  },[production,existing,employeeId]);

  const save=async()=>{
    if(!firstName.trim()||!lastName.trim()||!role.trim()){setToast("Name und Funktion sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    try{
      const payload={firstName:firstName.trim(),lastName:lastName.trim(),email,phone,jobTitle:role.trim(),workloadPercent:Number(load),entryDate,weeklyHours:Number(weeklyHours),vacationDays:Number(vacationDays),address,status:status==="Inaktiv"?"inactive":"active"};
      if(production){
        if(existing&&employeeId) await apiPatch("/api/employees/"+encodeURIComponent(employeeId),payload);
        else await apiPost("/api/employees",payload);
      }else if(!existing){
        appendDemoRow("employees",[firstName.trim()+" "+lastName.trim(),role.trim(),load+"%",status]);
      }
      setToast("Mitarbeiter gespeichert.");
      window.setTimeout(()=>router.push("/mitarbeiter"),700);
    }catch(error){
      setToast(error instanceof Error?error.message:"Mitarbeiter konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  const displayName=[firstName,lastName].filter(Boolean).join(" ")||"Mitarbeiter";
  return <AppShell title={existing ? displayName : "Mitarbeiter hinzufügen"} subtitle={existing ? role+" · "+load+"%" : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter" actions={!existing?<Button onClick={()=>void save()}>Speichern</Button>:undefined}>
    <div className={existing?"entity-detail-workspace":"desktop-detail-single"}>
      {existing&&<aside className="entity-info-pane"><span className="compact-section-label">Mitarbeiter</span><strong>{displayName}</strong><small>{role||"Funktion nicht hinterlegt"}</small><dl className="detail-list"><div><dt>Status</dt><dd>{status}</dd></div><div><dt>Pensum</dt><dd>{load}%</dd></div><div><dt>Eintritt</dt><dd>{entryDate?new Date(entryDate).toLocaleDateString("de-CH"):"—"}</dd></div></dl></aside>}
      <div className="desktop-detail-main">
    {existing && <div className="tabs" role="tablist" aria-label="Mitarbeiterbereiche">
      <button role="tab" aria-selected={employeeTab==="overview"} className={employeeTab==="overview"?"active":""} onClick={()=>setEmployeeTab("overview")}>Übersicht</button>
      <button role="tab" aria-selected={employeeTab==="time"} className={employeeTab==="time"?"active":""} onClick={()=>setEmployeeTab("time")}>Arbeitszeit</button>
      <button role="tab" aria-selected={employeeTab==="expenses"} className={employeeTab==="expenses"?"active":""} onClick={()=>setEmployeeTab("expenses")}>Spesen</button>
      <button role="tab" aria-selected={employeeTab==="documents"} className={employeeTab==="documents"?"active":""} onClick={()=>setEmployeeTab("documents")}>Dokumente</button>
    </div>}
    {(!existing||employeeTab==="overview")&&<div className="form-page">
      <div className="form-grid two">
        <Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
        <Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
        <Field label="E-Mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefon"><input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        <Field label="Funktion"><input value={role} onChange={e=>setRole(e.target.value)}/></Field>
        <Field label="Pensum"><input inputMode="numeric" value={load} onChange={e=>setLoad(e.target.value)} placeholder="%"/></Field>
        <Field label="Eintritt"><input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/></Field>
        <Field label="Wochenstunden"><input inputMode="decimal" value={weeklyHours} onChange={e=>setWeeklyHours(e.target.value)}/></Field>
        <Field label="Ferientage / Jahr"><input inputMode="decimal" value={vacationDays} onChange={e=>setVacationDays(e.target.value)}/></Field>
        <Field label="Adresse" className="full"><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Strasse, PLZ Ort"/></Field>
        <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></select></Field>
      </div>
      <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
    </div>}
    {existing&&employeeTab==="time"&&<section className="surface employee-tab-panel"><SectionTitle title="Arbeitszeit" action={<Button href="/zeit" variant="secondary">Zeiterfassung öffnen</Button>}/><div className="compact-list">{ledger.times.map(item=><div key={item.id}><b>{item.project_name}</b><span>{new Date(item.started_at).toLocaleDateString("de-CH")}</span><strong>{(Number(item.duration_minutes)/60).toLocaleString("de-CH",{maximumFractionDigits:2})} h</strong></div>)}</div>{!ledger.times.length&&<EmptyState icon="clock" title="Keine Arbeitszeiten" text="Für diesen Mitarbeiter sind keine Einträge geladen."/>}</section>}
    {existing&&employeeTab==="expenses"&&<section className="surface employee-tab-panel"><SectionTitle title="Spesen" action={<Button href="/spesen/neu" variant="secondary">Spese erfassen</Button>}/><div className="compact-list">{ledger.expenses.map(item=><Link key={item.id} href={"/spesen/"+item.id}><b>{item.merchant}</b><span>{new Date(item.expense_date).toLocaleDateString("de-CH")}</span><strong>{moneyChf(Number(item.amount))}</strong></Link>)}</div>{!ledger.expenses.length&&<EmptyState icon="card" title="Keine Spesen" text="Für diesen Mitarbeiter sind keine Spesen geladen."/>}</section>}
    {existing&&employeeTab==="documents"&&<section className="surface employee-tab-panel"><div className="compact-list">{ledger.files.map(item=><a key={item.id} href={"/api/files/"+item.id+"/download"}><b>{item.fileName}</b><Icon name="file"/></a>)}</div>{!ledger.files.length&&<EmptyState icon="file" title="Keine Dokumente" text="Für diesen Mitarbeiter sind keine Dokumente geladen."/>}</section>}
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Mitarbeiter</span><strong>{displayName}</strong><small>{role||"Funktion nicht hinterlegt"}</small><div className="desktop-summary-facts"><span>Status <b>{status}</b></span><span>Pensum <b>{load}%</b></span><span>Wochenstunden <b>{weeklyHours} h</b></span><span>Ferien <b>{vacationDays} Tage</b></span><span>Eintritt <b>{entryDate?new Date(entryDate).toLocaleDateString("de-CH"):"—"}</b></span></div></section><section className="desktop-toolbox"><button type="button" onClick={()=>void save()}><Icon name="check"/><span><b>Speichern</b><small>Stammdaten übernehmen</small></span><Icon name="arrow" size={15}/></button><Link href="/zeit"><Icon name="clock"/><span><b>Zeiterfassung</b><small>Arbeitszeiten öffnen</small></span><Icon name="arrow" size={15}/></Link><Link href="/spesen/neu"><Icon name="card"/><span><b>Spese erfassen</b><small>Neue Ausgabe hinzufügen</small></span><Icon name="arrow" size={15}/></Link></section></aside>}
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function ExpensesPage() {
  const {rows:expenseRows,loading,error}=useDemoRows("expenses",expenses);
  return <AppShell title="Spesen" subtitle="Belege erfassen, prüfen und freigeben." active="spesen" actions={<Button href="/spesen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Spese erfassen"><span className="create-action-label">Spese erfassen</span></Button>}>
    <RecordsView loading={loading} error={error} items={expenseRows} placeholder="Spesen suchen..." chips={["Alle","Eingereicht","Genehmigt","Entwurf"]}>{(row)=>{const [title,person,amount,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"1";const status=statusMaybe??idOrStatus;return <RecordRow href={"/spesen/"+id} icon="card" title={title} meta={person} value={amount} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ExpenseForm({ existing = false, expenseId }: { existing?: boolean; expenseId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [person,setPerson]=useState("");
  const [availableEmployees,setAvailableEmployees]=useState<Array<{id:string;first_name:string;last_name:string}>>([]);
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10));
  const [category,setCategory]=useState(existing?"Reise":"Reise");
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState("CHF");
  const [vatRate,setVatRate]=useState("8.1");
  const [merchant,setMerchant]=useState("");
  const [description,setDescription]=useState("");
  const [scanState,setScanState]=useState<"idle"|"scanning"|"done"|"error">("idle");
  const [scanConfidence,setScanConfidence]=useState<number|null>(null);
  const [status,setStatus]=useState(existing?"Eingereicht":"Eingereicht");
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{apiGet<{items:typeof availableEmployees}>(isProductionBackendEnabled()?"/api/employees":"/api/demo/data?collection=employees").then(data=>setAvailableEmployees(data.items)).catch(()=>setToast("Mitarbeiter konnten nicht geladen werden."));},[]);

  useEffect(()=>{
    if(!production||!existing||!expenseId) return;
    apiGet<{item:Record<string,unknown>}>("/api/expenses/"+encodeURIComponent(expenseId)).then(payload=>{
      const item=payload.item;
      queueMicrotask(()=>{
        setPerson(String(item.employee_id??""));
        setDate(String(item.expense_date??""));
        setCategory(String(item.category??"Reise"));
        setAmount(String(item.amount??"0.00"));
        setCurrency(String(item.currency??"CHF"));
        setVatRate(String(item.vat_rate??"8.1"));
        setMerchant(String(item.merchant??""));
        setDescription(String(item.description??""));
        const map:Record<string,string>={draft:"Entwurf",submitted:"Eingereicht",approved:"Genehmigt",rejected:"Abgelehnt"};
        setStatus(map[String(item.status)]??"Eingereicht");
      });
    }).catch(()=>undefined);
  },[production,existing,expenseId]);

  const scanReceipt=async(file:File|null)=>{
    setReceiptFile(file);if(!file)return;setScanState("scanning");
    try{
      if(production){
        const form=new FormData();form.append("file",file);
        const result=await apiUpload<{merchant?:string;date?:string;total?:number;currency?:string;confidence?:number;filename?:string}>("/api/expenses/scan-receipt",form);
        if(result.merchant)setMerchant(result.merchant);if(result.date)setDate(result.date);if(typeof result.total==="number")setAmount(result.total.toFixed(2));if(result.currency)setCurrency(result.currency);setScanConfidence(result.confidence??null);
        if(result.filename)setReceiptFile(new File([file],result.filename,{type:file.type,lastModified:file.lastModified}));
      }else{
        setMerchant("SBB CFF FFS");setDate(new Date().toLocaleDateString("en-CA"));setAmount("89.00");setCurrency("CHF");setVatRate("8.1");setScanConfidence(.96);
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase();setReceiptFile(new File([file],`${new Date().toLocaleDateString("en-CA")}_SBB-CFF-FFS_89.00-CHF.${ext}`,{type:file.type,lastModified:file.lastModified}));
      }
      setScanState("done");
    }catch(error){setScanState("error");setToast(error instanceof Error?error.message:"Beleg konnte nicht erkannt werden.");window.setTimeout(()=>setToast(null),2800)}
  };

  const save=async()=>{
    const value=Number(amount.replace(",","."));
    if(!Number.isFinite(value)||value<=0){setToast("Bitte einen gültigen Betrag erfassen.");window.setTimeout(()=>setToast(null),2200);return;}
    const statusMap:Record<string,string>={Entwurf:"draft",Eingereicht:"submitted",Genehmigt:"approved",Abgelehnt:"rejected"};
    try{
      const payload={employeeId:person,merchant:merchant.trim()||description.trim()||category,expenseDate:date,category,amount:value,currency,vatRate:Number(vatRate),description,status:statusMap[status]??"submitted"};
      let targetExpenseId=expenseId??"";
      if(production){
        if(existing&&expenseId){
          const result=await apiPatch<{item:{id:string}}>("/api/expenses/"+encodeURIComponent(expenseId),payload);
          targetExpenseId=result.item?.id??expenseId;
        }else{
          const result=await apiPost<{item:{id:string}}>("/api/expenses",payload);
          targetExpenseId=result.item.id;
        }
        if(receiptFile&&targetExpenseId){
          const form=new FormData();
          form.append("file",receiptFile);
          form.append("purpose","expense_receipt");
          form.append("entityId",targetExpenseId);
          await apiUpload("/api/files",form);
        }
      }else if(!existing){
        appendDemoRow("expenses",[merchant.trim()||description.trim()||category,person,"CHF "+value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}),"Eingereicht"]);
      }
      setToast(receiptFile?"Spese und Beleg gespeichert.":existing?"Spese gespeichert.":"Spese eingereicht.");
      window.setTimeout(()=>router.push("/spesen"),700);
    }catch(error){
      setToast(error instanceof Error?error.message:"Spese konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  return <AppShell title={existing ? merchant||description||"Spese" : "Spese erfassen"} subtitle={existing ? person+" · "+status : "Beleg fotografieren oder Datei auswählen."} active="spesen" backHref="/spesen" backLabel="Spesen" actions={!existing?<Button onClick={()=>void save()}>Einreichen</Button>:undefined}>
    <div className={existing?"entity-detail-workspace expense-detail-workspace":"expense-layout"}>
      {existing&&<aside className="entity-info-pane"><span className="compact-section-label">Spese</span><strong>{amount?moneyChf(Number(amount.replace(",","."))):"CHF 0.00"}</strong><small>{merchant||category}</small><dl className="detail-list"><div><dt>Status</dt><dd>{status}</dd></div><div><dt>Datum</dt><dd>{date?new Date(date).toLocaleDateString("de-CH"):"—"}</dd></div><div><dt>Kategorie</dt><dd>{category}</dd></div></dl></aside>}
      <label className={`receipt-upload ${scanState==="scanning"?"is-scanning":""}`} htmlFor="expense-receipt-upload"><span><Icon name="upload" size={25}/></span><b>{scanState==="scanning"?"Beleg wird erkannt…":receiptFile?receiptFile.name:"Beleg fotografieren"}</b><small>{scanState==="done"?`Erkannt${scanConfidence!==null?` · ${Math.round(scanConfidence*100)}% Sicherheit`:""} – Angaben prüfen`:scanState==="error"?"Erkennung nicht möglich – manuell erfassen":"Kamera oder Datei verwenden · Angaben werden automatisch vorausgefüllt"}</small></label><input id="expense-receipt-upload" hidden type="file" capture="environment" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>void scanReceipt(e.target.files?.[0]??null)}/>
      <div className="form-page">
        <div className="form-grid two">
          <Field label="Händler / Firma"><input value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="Wird aus dem Beleg erkannt"/></Field>
          <Field label="Mitarbeiter"><select value={person} onChange={e=>setPerson(e.target.value)}><option value="">Keine Zuordnung</option>{availableEmployees.map(item=><option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}</select></Field>
          <Field label="Datum"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
          <Field label="Kategorie"><select value={category} onChange={e=>setCategory(e.target.value)}><option>Reise</option><option>Verpflegung</option><option>Material</option></select></Field>
          <Field label="Betrag"><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></Field>
          <Field label="Währung"><select value={currency} onChange={e=>setCurrency(e.target.value)}><option>CHF</option><option>EUR</option></select></Field>
          <Field label="MwSt."><select value={vatRate} onChange={e=>setVatRate(e.target.value)}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
          {existing&&<Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Entwurf</option><option>Eingereicht</option><option>Genehmigt</option><option>Abgelehnt</option></select></Field>}
          <Field label="Beschreibung" className="full"><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>void save()}>{existing ? "Speichern" : "Einreichen"}</Button></div>
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Beleg</span><strong>{receiptFile?.name||"Spesenbeleg"}</strong><small>{scanState==="done"?"Belegdaten erkannt":"Angaben prüfen"}</small></section><section className="desktop-toolbox"><button type="button" onClick={()=>void save()}><Icon name="check"/><span><b>Speichern</b><small>Änderungen übernehmen</small></span><Icon name="arrow" size={15}/></button><Link href="/spesen"><Icon name="card"/><span><b>Alle Spesen</b><small>Zur Spesenübersicht</small></span><Icon name="arrow" size={15}/></Link></section></aside>}
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("gültigen")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function TimePage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const searchParams=useSearchParams();
  const returnTo=searchParams.get("returnTo")==="/dashboard"?"/dashboard":undefined;
  const production=useBackendMode()&&!forceDemo;
  const [timeTab,setTimeTab]=useState<"timer"|"entries">("timer");
  const [running,setRunning]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [manualOpen,setManualOpen]=useState(false);
  const [projectOpen,setProjectOpen]=useState(false);
  const [timerProject,setTimerProject]=useState("Interne Planung");
  const [timerCustomer,setTimerCustomer]=useState("");
  const [manualDate,setManualDate]=useState("");
  const [manualDuration,setManualDuration]=useState("01:00");
  const [manualCustomer,setManualCustomer]=useState("");
  const [manualProject,setManualProject]=useState("");
  const [manualDescription,setManualDescription]=useState("");
  const [availableProjects,setAvailableProjects]=useState<Array<{id:string;name:string;customer_id?:string|null}>>([]);
  const [availableCustomers,setAvailableCustomers]=useState<Array<{id:string;name:string}>>([]);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{if(forceDemo)return;Promise.all([apiGet<{items:typeof availableProjects}>(isProductionBackendEnabled()?"/api/projects":"/api/demo/data?collection=projects"),apiGet<{items:typeof availableCustomers}>(isProductionBackendEnabled()?"/api/customers":"/api/demo/data?collection=customers")]).then(([projects,customers])=>{setAvailableProjects(projects.items);setAvailableCustomers(customers.items)}).catch(()=>setToast("Kunden und Projekte konnten nicht geladen werden."));},[forceDemo]);
  const [remoteEntries,setRemoteEntries]=useState<Array<{id:string;project_name?:string|null;customer_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;billable?:boolean;approved?:boolean;invoiced_invoice_id?:string|null;created_at?:string|null}>>([]);
  const [selectedTimeIds,setSelectedTimeIds]=useState<string[]>([]);

  useEffect(()=>{
    const sync=()=>{readTimer().then(state=>{setRunning(state.running);setSeconds(state.seconds);setTimerProject(state.project);setTimerCustomer(state.customerId??"")}).catch(()=>undefined)};
    sync();
    queueMicrotask(()=>setManualDate(new Date().toLocaleDateString("en-CA")));
    window.addEventListener("binso-timer-change",sync);
    return()=>window.removeEventListener("binso-timer-change",sync);
  },[]);

  useEffect(()=>{
    if(forceDemo) return;
    apiGet<{items:Array<{id:string;project_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;created_at?:string|null}>}>(isProductionBackendEnabled()?"/api/time-entries":"/api/demo/data?collection=time_entries")
      .then(payload=>queueMicrotask(()=>setRemoteEntries(payload.items)))
      .catch(()=>undefined);
  },[production,forceDemo]);

  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>window.clearInterval(id);},[running]);

  const setProject=async(project:string)=>{
    try{const selected=availableProjects.find(item=>item.name===project&&(!timerCustomer||item.customer_id===timerCustomer));const state=await changeTimer("project",project,selected?.id??null,timerCustomer||null);setTimerProject(state.project);setProjectOpen(false)}
    catch(error){setToast(error instanceof Error?error.message:"Projekt konnte nicht gespeichert werden.")}
  };
  const toggleTimer=async()=>{
    try{const selected=availableProjects.find(item=>item.name===timerProject&&(!timerCustomer||item.customer_id===timerCustomer));const state=await changeTimer(running?"pause":"start",timerProject,selected?.id??null,timerCustomer||null);setRunning(state.running);setSeconds(state.seconds)}
    catch(error){setToast(error instanceof Error?error.message:"Zeitmessung konnte nicht gespeichert werden.")}
  };

  const formatted=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60].map(value=>String(value).padStart(2,"0")).join(":");
  const formatMinutes=(value:number)=>`${Math.floor(value/60)}:${String(value%60).padStart(2,"0")}`;
  const remoteTotal=remoteEntries.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0);

  const stop=async()=>{
    try{
      await changeTimer("finish",timerProject);
      setRunning(false);setSeconds(0);setToast("Zeiteintrag gespeichert.");
      if(production){const payload=await apiGet<{items:typeof remoteEntries}>("/api/time-entries");setRemoteEntries(payload.items)}
    }catch(error){setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.")}
    window.setTimeout(()=>setToast(null),2400);
  };

  const saveManual=async()=>{
    const [hours,minutes]=manualDuration.split(":").map(Number);
    const durationMinutes=(Number.isFinite(hours)?hours:0)*60+(Number.isFinite(minutes)?minutes:0);
    if(durationMinutes<=0){
      setToast("Bitte eine gültige Dauer erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:{id:string;project_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;created_at?:string|null}}>("/api/time-entries",{customerId:manualCustomer||null,projectId:manualProject||null,projectName:availableProjects.find(item=>item.id===manualProject)?.name||"Interne Planung",description:manualDescription,startedAt:manualDate+"T12:00:00",durationMinutes});
        setRemoteEntries(current=>[payload.item,...current]);
      }
      setManualOpen(false);
      setToast("Zeiteintrag gespeichert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  const demoEntries=<div className="compact-list"><div><b>Website Redesign</b><span>Acme AG · 09:27–11:41</span><strong>2:14</strong></div><div><b>Kundenmeeting</b><span>Müller GmbH · 13:00–14:30</span><strong>1:30</strong></div><div><b>Planung</b><span>Intern · 15:10–15:54</span><strong>0:44</strong></div></div>;
  const approveTime=async(id:string)=>{try{await apiPatch("/api/time-entries/"+encodeURIComponent(id),{});setRemoteEntries(current=>current.map(item=>item.id===id?{...item,approved:true}:item));setToast("Zeit freigegeben.");}catch(error){setToast(error instanceof Error?error.message:"Zeit konnte nicht freigegeben werden.");}window.setTimeout(()=>setToast(null),2200)};
  const billableSelection=remoteEntries.filter(item=>selectedTimeIds.includes(item.id)&&item.billable&&item.approved&&!item.invoiced_invoice_id);
  const invoiceHref=billableSelection.length?"/rechnungen/neu?timeEntries="+encodeURIComponent(billableSelection.map(item=>item.id).join(",")):"";
  const groupedEntries=Object.entries(remoteEntries.reduce<Record<string,typeof remoteEntries>>((groups,item)=>{const key=(item.customer_name||"Intern")+" · "+(item.project_name||"Ohne Auftrag");(groups[key]??=[]).push(item);return groups},{}));
  const productionEntries=remoteEntries.length?<div className="time-groups">{groupedEntries.map(([group,items])=><section className="time-group" key={group}><div className="time-group-head"><div><b>{group.split(" · ")[0]}</b><small>{group.split(" · ").slice(1).join(" · ")}</small></div><strong>{formatMinutes(items.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0))}</strong></div><div className="compact-list time-entry-list">{items.map(item=><div key={item.id}>{item.billable&&item.approved&&!item.invoiced_invoice_id?<input type="checkbox" aria-label="Zeit für Rechnung auswählen" checked={selectedTimeIds.includes(item.id)} onChange={e=>setSelectedTimeIds(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/>:<span/>}<span><b>{item.employee_name||item.project_name||"Zeiteintrag"}</b><small>{item.description||"Erfasste Arbeitszeit"}</small></span><strong>{formatMinutes(Number(item.duration_minutes??0))}</strong>{item.invoiced_invoice_id?<Status tone="success">Verrechnet</Status>:item.approved?<Status tone="success">Freigegeben</Status>:item.billable?<button type="button" className="text-action" onClick={()=>void approveTime(item.id)}>Freigeben</button>:<Status tone="neutral">Intern</Status>}</div>)}</div></section>)}</div>:<EmptyState icon="clock" title="Noch keine Zeiteinträge" text="Starte den Timer oder erfasse die erste Zeit manuell."/>;

  return <AppShell title="Zeiterfassung" subtitle="Arbeitszeit einfach und präzise erfassen." active="zeit" backHref={returnTo} backLabel="Übersicht">
    <div className="time-layout">
      <section className="time-section timer-card">
        <div className="tabs" role="tablist" aria-label="Zeiterfassung"><button role="tab" aria-selected={timeTab==="timer"} className={timeTab==="timer"?"active":""} onClick={()=>setTimeTab("timer")}>Timer</button><button role="tab" aria-selected={timeTab==="entries"} className={timeTab==="entries"?"active":""} onClick={()=>setTimeTab("entries")}>Einträge</button></div>
        {timeTab==="timer"?<>
          <div className="timer-project"><small>Kunde</small><select value={timerCustomer} onChange={e=>{setTimerCustomer(e.target.value);setTimerProject("Interne Planung")}}><option value="">Intern</option>{availableCustomers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select><small>Auftrag / Projekt</small><button type="button" onClick={()=>setProjectOpen(true)}>{timerProject} <Icon name="down" size={16}/></button></div>
          <div className={`timer-ring ${running?"is-running":"is-paused"}`}><div><small>{running?"Läuft":seconds>0?"Pausiert":"Bereit"}</small><strong>{formatted}</strong><span>{timerProject}</span></div></div>
          <div className="timer-actions"><Button onClick={toggleTimer} icon={running?"pause":"clock"}>{running?"Pause":seconds>0?"Fortsetzen":"Starten"}</Button><Button variant="secondary" icon="stop" onClick={()=>void stop()} disabled={!running&&seconds===0}>Stoppen</Button></div>
        </>:<>
          <SectionTitle title={!forceDemo?"Einträge":"Heutige Einträge"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":"4:28 h"}</strong>}/>
          {!forceDemo?productionEntries:demoEntries}
          <div className="time-entry-actions"><Button variant="secondary" icon="plus" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>{billableSelection.length>0&&<Button href={invoiceHref} icon="receipt">Rechnung erstellen ({billableSelection.length})</Button>}</div>
        </>}
      </section>
      {timeTab==="timer"&&<section className="time-section time-overview-section">
        <SectionTitle title={!forceDemo?"Übersicht":timeTab==="timer"?"Heute":"Diese Woche"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":timeTab==="timer"?"4:28 h":"28:15 h"}</strong>}/>
        {!forceDemo?productionEntries:timeTab==="timer"?demoEntries:<div className="time-summary-row"><div><small>Montag</small><b>7:42 h</b></div><div><small>Dienstag</small><b>8:05 h</b></div><div><small>Heute</small><b>4:28 h</b></div></div>}
        {timeTab==="timer"&&<Button variant="secondary" icon="plus" className="full-button" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>}
      </section>}
    </div>
    {projectOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setProjectOpen(false)}}><section className="bottom-sheet project-sheet" role="dialog" aria-modal="true" aria-label="Projekt auswählen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Projekt auswählen</h2><p>Die Zeit wird direkt dem gewählten Projekt zugeordnet.</p></div><button className="icon-button" type="button" onClick={()=>setProjectOpen(false)}><Icon name="close"/></button></header><div className="choice-list">{["Interne Planung",...availableProjects.filter(item=>!timerCustomer||item.customer_id===timerCustomer).map(item=>item.name)].map(project=><button type="button" key={project} className={timerProject===project?"active":""} onClick={()=>setProject(project)}><span><b>{project.split(" · ")[0]}</b><small>{project.split(" · ")[1]??"Intern"}</small></span>{timerProject===project?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div></section></div>}
    {manualOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setManualOpen(false)}}><section className="bottom-sheet manual-time-sheet" role="dialog" aria-modal="true" aria-label="Zeit manuell erfassen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Zeit erfassen</h2><p>Eintrag direkt dem Kunden oder Projekt zuordnen.</p></div><button className="icon-button" type="button" aria-label="Schliessen" onClick={()=>setManualOpen(false)}><Icon name="close"/></button></header><div className="sheet-body"><div className="form-grid two"><Field label="Datum"><input type="date" value={manualDate} onChange={e=>setManualDate(e.target.value)}/></Field><Field label="Dauer"><input type="time" value={manualDuration} onChange={e=>setManualDuration(e.target.value)}/></Field>{production?<Field label="Kunde"><select value={manualCustomer} onChange={e=>setManualCustomer(e.target.value);setManualProject("")}}><option value="">Intern</option>{availableCustomers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>:<Field label="Kunde"><select value={manualCustomer||"Acme AG"} onChange={e=>setManualCustomer(e.target.value)}><option>Acme AG</option><option>Müller GmbH</option></select></Field>}{production?<Field label="Auftrag / Projekt"><select value={manualProject} onChange={e=>setManualProject(e.target.value)}><option value="">Keine Zuordnung</option>{availableProjects.filter(item=>!manualCustomer||item.customer_id===manualCustomer).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>:<Field label="Projekt"><select value={manualProject==="Interne Planung"?"Website Redesign":manualProject} onChange={e=>setManualProject(e.target.value)}><option>Website Redesign</option><option>Support</option></select></Field>}<Field className="full" label="Beschreibung"><input value={manualDescription} onChange={e=>setManualDescription(e.target.value)} placeholder="Was wurde gemacht?"/></Field></div></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setManualOpen(false)}>Abbrechen</Button><Button onClick={()=>void saveManual()}>Speichern</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("gültige")||toast.includes("keine")?"danger":"success"}/>}
  </AppShell>;
}

function useSupportRows(){
  const [rows,setRows]=useState<string[][]>([]);
  useEffect(()=>{
    apiGet<{items:Array<{id:string;case_number?:string;subject:string;status:string;updated_at:string}>}>(isProductionBackendEnabled()?"/api/support/tickets":"/api/demo/data?collection=support_tickets")
      .then(payload=>{
        const statusMap:Record<string,string>={new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
        queueMicrotask(()=>setRows(payload.items.map(item=>[item.id,item.subject?.trim()||"Support-Anfrage",new Date(item.updated_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"}),statusMap[item.status]??item.status])));
      })
      .catch(()=>undefined);
  },[]);
  return rows;
}

export function SupportPage() {
  const ticketRows=useSupportRows();
  return <AppShell title="Support" subtitle="Hilfe direkt in Binso One – persönlich und nachvollziehbar." active="support" actions={<Button href="/support/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Ticket"><span className="create-action-label">Neues Ticket</span></Button>}>
    <div className="support-summary"><Metric label="Offen" value={String(ticketRows.filter(row=>!["Gelöst","Geschlossen"].includes(row[3])).length)} hint="geladene Tickets" icon="support"/><Metric label="Gelöst" value={String(ticketRows.filter(row=>["Gelöst","Geschlossen"].includes(row[3])).length)} hint="geladene Tickets" icon="check"/></div>
    <div className="tablet-master-detail support-master-detail">
      <RecordsView items={ticketRows} placeholder="Tickets suchen..." chips={["Alle","Offen","In Bearbeitung","Gelöst"]}>{([id,subject,updated,status])=><RecordRow href={`/support/${id}`} icon="support" title={subject} meta={updated} status={status}/>}</RecordsView>

    </div>
  </AppShell>;
}

export function SupportTicketForm() {
  const router=useRouter();
  const [subject,setSubject]=useState("");
  const [saved,setSaved]=useState(false);
  const [category,setCategory]=useState("Allgemeine Frage");
  const [message,setMessage]=useState("");
  const [attachment,setAttachment]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  const save=async()=>{
    if(!subject.trim()||!message.trim()){
      setToast("Betreff und Nachricht sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:{id:string}}>("/api/support/tickets",{subject,category,priority:"normal",message});
        if(attachment){
          const form=new FormData();
          form.append("file",attachment);
          form.append("purpose","support_attachment");
          form.append("entityId",payload.item.id);
          await apiUpload("/api/files",form);
        }
        setSaved(true);
        router.push("/support/"+payload.item.id);
      }else{
        setToast("Ticket erstellt.");
        window.setTimeout(()=>router.push("/support/5832"),700);
      }
    }catch(error){
      setToast(error instanceof Error?error.message:"Ticket konnte nicht erstellt werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };
  return <AppShell title="Neue Support-Anfrage" unsavedChanges={!saved&&Boolean(subject||message||attachment||category!=="Allgemeine Frage")} subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref="/support" backLabel="Support" actions={<Button onClick={save}>Ticket erstellen</Button>}>
    <div className="form-page narrow">
      <div className="form-grid">
        <Field label="Betreff" className="full"><input autoFocus value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Worum geht es?"/></Field>
        <Field label="Kategorie" className="full"><select value={category} onChange={e=>setCategory(e.target.value)}><option>Allgemeine Frage</option><option>Rechnung</option><option>Zeiterfassung</option><option>Technisches Problem</option></select></Field>
        <Field label="Nachricht" className="full"><textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Beschreibe dein Anliegen kurz..."/></Field>
      </div>
      <label className="attachment-button" htmlFor="support-file-upload"><Icon name="upload"/><span>{attachment?attachment.name:"Screenshot oder Datei hinzufügen"}</span></label><input id="support-file-upload" hidden type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={e=>setAttachment(e.target.files?.[0]??null)}/>
      <p className="technical-hint">Browser, App-Version und Zeitpunkt werden automatisch mitgesendet.</p>
      <div className="mobile-sticky-save"><Button onClick={save}>Ticket erstellen</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function SupportChat({ticketId="5832"}:{ticketId?:string}) {
  const [draft,setDraft]=useState("");
  const [sent,setSent]=useState<string[]>([]);
  const [remote,setRemote]=useState<Array<{id:string;author_type:string;body:string;created_at:string}>>([]);
  const [toast,setToast]=useState<string|null>(null);
  const [ticket,setTicket]=useState<{id:string;case_number?:string|null;subject?:string|null;status?:string|null;priority?:string|null;created_at?:string|null}|null>(null);
  const ticketReference=(()=>{
    const raw=String(ticket?.case_number??ticketId);
    if(/^T-[0-9a-f-]{20,}$/i.test(raw))return "T-"+String(ticket?.id??ticketId).replace(/-/g,"").slice(0,8).toUpperCase();
    if(/^[0-9a-f-]{20,}$/i.test(raw))return "T-"+raw.replace(/-/g,"").slice(0,8).toUpperCase();
    return raw.startsWith("#")?raw:"#"+raw;
  })();
  const ticketSubject=ticket?.subject?.trim()||(!isProductionBackendEnabled()?"Frage zu einer Rechnung":"Support-Anfrage");
  const ticketStatus=String(ticket?.status??"open");
  const ticketStatusLabel:Record<string,string>={open:"Offen",in_progress:"In Bearbeitung",waiting:"Wartet",resolved:"Gelöst",closed:"Geschlossen"};

  const uploadSupportFile=async(file:File|undefined)=>{
    if(!file)return;
    if(!isProductionBackendEnabled()){
      setToast("Datei im Demo-Modus nicht dauerhaft gespeichert.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      const form=new FormData();
      form.append("file",file);
      form.append("purpose","support_attachment");
      form.append("entityId",ticketId);
      await apiUpload("/api/files",form);
      setToast("Datei angehängt.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Datei konnte nicht angehängt werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    Promise.all([
      apiGet<{items:Array<{id:string;case_number?:string|null;subject?:string|null;status?:string|null;priority?:string|null;created_at?:string|null}>}>("/api/support/tickets"),
      apiGet<{items:Array<{id:string;author_type:string;body:string;created_at:string}>}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages"),
    ]).then(([tickets,messages])=>queueMicrotask(()=>{
      setTicket(tickets.items.find(item=>item.id===ticketId)??null);
      setRemote(messages.items);
    })).catch(()=>undefined);
  },[ticketId]);

  const send=async()=>{
    const value=draft.trim();
    if(!value)return;
    setDraft("");
    if(isProductionBackendEnabled()){
      try{
        const payload=await apiPost<{item:{id:string;author_type:string;body:string;created_at:string}}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages",{body:value});
        setRemote(current=>[...current,payload.item]);
      }catch(error){
        setDraft(value);
        setToast(error instanceof Error?error.message:"Nachricht konnte nicht gesendet werden.");
        window.setTimeout(()=>setToast(null),2600);
      }
      return;
    }
    setSent(current=>[...current,value]);
  };

  const production=useBackendMode();
  return <AppShell title={ticketSubject} subtitle={ticketReference+" · "+(ticketStatusLabel[ticketStatus]??ticketStatus)} active="support" backHref="/support" backLabel="Support">
    <div className="entity-detail-workspace support-detail-workspace">
      <aside className="entity-info-pane"><span className="compact-section-label">Support</span><strong>{ticketReference}</strong><small>{ticketSubject}</small><dl className="detail-list"><div><dt>Status</dt><dd>{ticketStatusLabel[ticketStatus]??ticketStatus}</dd></div><div><dt>Priorität</dt><dd>{ticket?.priority??"Normal"}</dd></div></dl></aside>
      <div className="desktop-detail-main"><div className="support-thread">
      <div className="thread-day">Heute</div>
      {production ? remote.map(message=><article className={message.author_type==="customer"?"message message-user":"message message-support"} key={message.id}>{message.author_type!=="customer"&&<span>Binso Support</span>}<div>{message.body}</div><small>{new Date(message.created_at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"})}</small></article>) : <>
        <article className="message message-user"><div>Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?</div><small>10:24</small></article>
        <article className="message message-support"><span>Binso Support</span><div>Hallo Thomas. Gerne helfe ich dir weiter. Um welche Rechnung geht es genau?</div><small>10:37</small></article>
        <article className="message message-user"><div>Es geht um die Rechnung RE-2026-019 von Acme AG.</div><small>10:41</small></article>
        <article className="message message-support"><span>Binso Support</span><div>Super, ich schaue das gerne für dich nach.</div><small>10:42</small></article>
        {sent.map((text,i)=><article className="message message-user" key={text+"-"+i}><div>{text}</div><small>jetzt</small></article>)}
      </>}
      {production&&remote.length===0&&<EmptyState icon="support" title="Noch keine Nachrichten" text="Schreibe die erste Nachricht in diesem Ticket."/>}
      <div className="thread-composer"><label className="icon-button" htmlFor={"support-thread-file-"+ticketId} aria-label="Datei anhängen"><Icon name="upload"/></label><input id={"support-thread-file-"+ticketId} hidden type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={e=>void uploadSupportFile(e.target.files?.[0])}/><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void send();}}} placeholder="Nachricht schreiben..."/><button type="button" onClick={()=>void send()} aria-label="Senden"><Icon name="arrow"/></button></div>
    </div></div>
      <aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Ticket</span><strong>{ticketReference}</strong><small>{ticketSubject}</small><div className="desktop-summary-facts"><span>Status <b>{ticketStatusLabel[ticketStatus]??ticketStatus}</b></span><span>Nachrichten <b>{production?remote.length:4+sent.length}</b></span></div></section><section className="desktop-toolbox"><Link href="/support"><Icon name="support"/><span><b>Alle Tickets</b><small>Zur Supportübersicht</small></span><Icon name="arrow" size={15}/></Link><Link href="/support/neu"><Icon name="plus"/><span><b>Neues Ticket</b><small>Weitere Anfrage erstellen</small></span><Icon name="arrow" size={15}/></Link></section></aside>
    </div>
    {toast&&<Toast title={toast} tone="danger"/>}
  </AppShell>;
}

export function SettingsPage() {
  const rows = [
    ["/einstellungen/konto","user","Persönliche Daten","Name, E-Mail, Telefon und Funktion"],
    ["/einstellungen/firma","users","Firma","Unternehmensdaten, Adresse und Firmenlogo"],
    ["/einstellungen/dokumente","receipt","Rechnungen & Dokumente","MwSt., Zahlungsfrist, IBAN und Standardtexte"],
    ["/einstellungen/team","users","Benutzer & Rollen","Zugänge, Rollen und Einladungen"],
    ["/einstellungen/abonnement","card","Abonnement","Plan, Nutzung und Zahlungsabwicklung"],
    ["/einstellungen/benachrichtigungen","bell","Benachrichtigungen","E-Mail- und Push-Einstellungen"],
    ["/einstellungen/sprache","settings","Sprache","Oberflächen- und Kommunikationssprache"],
    ["/einstellungen/sicherheit","lock","Sicherheit","Passwort, MFA, Sitzungen und Geräte"],
    ["/einstellungen/darstellung","moon","Darstellung","Hell, Dunkel oder Systemeinstellung"],
    ["/einstellungen/datenschutz","lock","Datenschutz & Cookies","Notwendige Funktionen und Performance-Messung"],
  ];
  return <AppShell title="Einstellungen" subtitle="Firma, Konto, Sicherheit und Abonnement." active="einstellungen">
    <div className="settings-list">
      {rows.map(([href,icon,title,text])=><Link href={href} key={title}><span className="settings-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>)}
    </div>
  </AppShell>;
}

export function AccountSettingsPage() {
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [jobTitle,setJobTitle]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);
  const [avatarUrl,setAvatarUrl]=useState("");
  const uploadAvatar=async(file:File|undefined)=>{if(!file)return;try{const form=new FormData();form.append("file",file);form.append("purpose","profile_avatar");const result=await apiUpload<{item:{id:string}}>("/api/files",form);setAvatarUrl("/api/files/"+result.item.id+"/download");setToast("Profilbild gespeichert.");}catch(e){setToast(e instanceof Error?e.message:"Profilbild konnte nicht gespeichert werden.")}};

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    apiGet<{item?:Record<string,unknown>|null;email?:string|null}>("/api/settings/profile")
      .then(payload=>{
        const item=payload.item??{};
        queueMicrotask(()=>{
          setFirstName(String(item.first_name??""));
          setLastName(String(item.last_name??""));
          setEmail(payload.email??"");
          setPhone(String(item.phone??""));
          setAvatarUrl(String(item.avatar_url??""));
          setJobTitle(String(item.job_title??""));
        });
      }).catch(()=>undefined);
  },[]);

  const save=async(message="Persönliche Daten gespeichert.")=>{
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      await apiPatch("/api/settings/profile",{firstName,lastName,phone,jobTitle});
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Persönliche Daten konnten nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  const initials=((firstName[0]??"")+(lastName[0]??"")).toUpperCase()||"BO";
  const displayName=[firstName,lastName].filter(Boolean).join(" ")||"Benutzer";
  return <AppShell title="Persönliche Daten" subtitle="Dein Konto und deine Profildaten." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={editing?<Button onClick={()=>void save()}>Speichern</Button>:<Button variant="secondary" icon="edit" onClick={()=>setEditing(true)}>Bearbeiten</Button>}>
    <div className="settings-detail-grid">
      <section className="surface settings-profile">
        <div className="profile-avatar">{avatarUrl?<img src={avatarUrl} alt={displayName}/>:initials}</div><div><h2>{displayName}</h2><p>{jobTitle||"Benutzer"}</p></div>{editing&&<><label className="button button-secondary" htmlFor="profile-avatar-upload">Bild ändern</label><input id="profile-avatar-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadAvatar(e.target.files?.[0])}/></>}
      </section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
          <Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
          <Field label="E-Mail"><input type="email" value={email} readOnly/></Field>
          <Field label="Telefon"><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
          <Field label="Funktion"><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Name</dt><dd>{displayName}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div><div><dt>Funktion</dt><dd>{jobTitle||"—"}</dd></div></dl></section>}
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("konnten")?"danger":"success"}/>}
  </AppShell>;
}

export function CompanySettingsPage() {
  const [name,setName]=useState("");
  const [uid,setUid]=useState("");
  const [logoUrl,setLogoUrl]=useState("");
  const [street,setStreet]=useState("");
  const [postalCode,setPostalCode]=useState("");
  const [city,setCity]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);

  const uploadLogo=async(file:File|undefined)=>{
    if(!file) return;
    if(!isProductionBackendEnabled()){
      setToast("Logo-Upload ist im Demo-Modus nicht dauerhaft.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      const form=new FormData();
      form.append("file",file);
      form.append("purpose","company_logo");
      const result=await apiUpload<{item:{id:string}}>("/api/files",form);
      setLogoUrl("/api/files/"+result.item.id+"/download");
      setToast("Firmenlogo gespeichert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmenlogo konnte nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2600);
  };

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    apiGet<{item:Record<string,unknown>}>("/api/settings/company").then(payload=>{
      const item=payload.item;
      queueMicrotask(()=>{
        setName(String(item.name??""));
        setUid(String(item.uid??""));
        setLogoUrl(String(item.logo_url??""));
        setStreet(String(item.street??""));
        setPostalCode(String(item.postal_code??""));
        setCity(String(item.city??""));
        setEmail(String(item.email??""));
        setPhone(String(item.phone??""));
      });
    }).catch(()=>undefined);
  },[]);

  const save=async(message="Firmendaten gespeichert.")=>{
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      await apiPatch("/api/settings/company",{name,uid,street,postalCode,city,email,phone});
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmendaten konnten nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  return <AppShell title="Firma" subtitle="Unternehmensdaten für Belege und Kommunikation." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={editing?<Button onClick={()=>void save()}>Speichern</Button>:<Button variant="secondary" icon="edit" onClick={()=>setEditing(true)}>Bearbeiten</Button>}>
    <div className="settings-detail-grid">
      <section className="surface company-logo-card"><img src={logoUrl||"/brand/logo-black.svg"} alt="Firmenlogo"/><div><b>{name||"Firma"}</b><small>Firmenlogo für Angebote, Rechnungen und Dokumente</small></div>{editing&&<><label className="button button-secondary" htmlFor="company-logo-upload">Logo ändern</label><input id="company-logo-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></>}</section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Firmenname"><input value={name} onChange={e=>setName(e.target.value)}/></Field>
          <Field label="UID"><input value={uid} onChange={e=>setUid(e.target.value)}/></Field>
          <Field label="Strasse"><input value={street} onChange={e=>setStreet(e.target.value)}/></Field>
          <Field label="PLZ"><input value={postalCode} onChange={e=>setPostalCode(e.target.value)}/></Field>
          <Field label="Ort"><input value={city} onChange={e=>setCity(e.target.value)}/></Field>
          <Field label="E-Mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
          <Field label="Telefon"><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Firmenname</dt><dd>{name||"—"}</dd></div><div><dt>UID</dt><dd>{uid||"—"}</dd></div><div><dt>Adresse</dt><dd>{street||"—"}<br/>{[postalCode,city].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div></dl></section>}
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("konnten")?"danger":"success"}/>}
  </AppShell>;
}

export function SubscriptionSettingsPage() {
  const production=useBackendMode();
  const searchParams=useSearchParams();
  const requestedPlan=searchParams.get("plan");
  const requestedBilling=searchParams.get("billing");
  const initialPlan=requestedPlan==="start"||requestedPlan==="business"||requestedPlan==="pro"?requestedPlan:"business";
  const initialBilling=requestedBilling==="yearly"?"yearly":"monthly";
  const [dialog,setDialog]=useState<"plan"|"payment"|"cancel"|null>(searchParams.get("activate")==="1"?"plan":null);
  const [plan,setPlan]=useState("Business");
  const [selectedPlan,setSelectedPlan]=useState<"start"|"business"|"pro">(initialPlan);
  const [subscription,setSubscription]=useState<Record<string,unknown>|null>(null);
  const [billingCycle,setBillingCycle]=useState<"monthly"|"yearly">(initialBilling);
  const [catalog,setCatalog]=useState<Array<{plan:string;billing:string;available:boolean;amount?:number}>>([]);
  const [stripeLive,setStripeLive]=useState(false);
  const [billingDemo,setBillingDemo]=useState(false);
  const [automaticTax,setAutomaticTax]=useState(false);
  const [billingError,setBillingError]=useState("");
  const checkoutRequest=useRef<{plan:string;billing:string;key:string}|null>(null);
  const [integrations,setIntegrations]=useState<Array<Record<string,unknown>>>([]);
  const [billingLoading,setBillingLoading]=useState(false);
  const [acceptedPaidTerms,setAcceptedPaidTerms]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [billingInvoice,setBillingInvoice]=useState<{date:string;amount:string}|null>(null);
  const [referenceNow]=useState(()=>Date.now());

  const prices:Record<string,string>=Object.fromEntries(subscriptionPlans.flatMap(p=>[[p.name,String(p.monthly)],[p.id,String(p.monthly)]]));
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    if(!production) return;
    Promise.all([
      apiGet<{item:Record<string,unknown>}>("/api/settings/subscription"),
      apiGet<{items:Array<Record<string,unknown>>}>("/api/integrations/status"),
      apiGet<{live:boolean;demo:boolean;automaticTax:boolean;items:Array<{plan:string;billing:string;available:boolean;amount?:number}>}>("/api/billing/catalog"),
    ]).then(([subscriptionPayload,integrationPayload,catalogPayload])=>queueMicrotask(()=>{
      setSubscription(subscriptionPayload.item);
      setIntegrations(integrationPayload.items);
      setCatalog(catalogPayload.items);
      setStripeLive(catalogPayload.live);
      setBillingDemo(catalogPayload.demo===true);
      setAutomaticTax(catalogPayload.automaticTax===true);
    })).catch(()=>setBillingError("Abonnement konnte nicht geladen werden. Bitte die Seite erneut laden."));

    let attempts=0;
    let stopped=false;
    let refreshTimer:ReturnType<typeof setTimeout>|undefined;
    const refreshSubscription=async()=>{
      try{const payload=await apiGet<{item:Record<string,unknown>}>("/api/settings/subscription");if(stopped)return;setSubscription(payload.item);if(payload.item.billing_subscription_ref&&payload.item.subscription_status==="active")return;}catch{if(stopped)return;}
      if(++attempts<10)refreshTimer=setTimeout(()=>void refreshSubscription(),3000);
    };
    const result=new URLSearchParams(window.location.search).get("checkout");
    if(result==="success"){
      refreshTimer=setTimeout(()=>void refreshSubscription(),3000);
      queueMicrotask(()=>setToast("Stripe Checkout abgeschlossen. Der Abostatus wird über den signierten Webhook aktualisiert."));
      window.setTimeout(()=>setToast(null),4200);
    }else if(result==="cancelled"){
      queueMicrotask(()=>setToast("Planwechsel abgebrochen."));
      window.setTimeout(()=>setToast(null),2200);
    }
    return ()=>{stopped=true;if(refreshTimer)clearTimeout(refreshTimer);};
  },[production]);

  const startCheckout=async()=>{
    setBillingLoading(true);
    try{
      if(!checkoutRequest.current||checkoutRequest.current.plan!==selectedPlan||checkoutRequest.current.billing!==billingCycle)checkoutRequest.current={plan:selectedPlan,billing:billingCycle,key:crypto.randomUUID()};
      const payload=await apiPost<{url:string}>("/api/billing/checkout",{plan:selectedPlan,billing:billingCycle,requestKey:checkoutRequest.current.key,acceptedTerms:acceptedPaidTerms,termsVersion:legalConfig.termsVersion,privacyVersion:legalConfig.privacyVersion});
      window.open(payload.url,"_self");
    }catch(error){
      setToast(error instanceof Error?error.message:"Stripe Checkout konnte nicht geöffnet werden.");
      setBillingLoading(false);
      window.setTimeout(()=>setToast(null),2800);
    }
  };

  const openPortal=async()=>{
    setBillingLoading(true);
    try{
      const payload=await apiPost<{url:string}>("/api/billing/portal",{});
      window.open(payload.url,"_self");
    }catch(error){
      setToast(error instanceof Error?error.message:"Billing-Portal konnte nicht geöffnet werden.");
      setBillingLoading(false);
      window.setTimeout(()=>setToast(null),2800);
    }
  };

  if(!production){
    return <AppShell title="Abonnement" subtitle="Plan, Nutzung, Zahlungsmittel und Rechnungen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
      <section className="plan-hero"><div><span className="eyebrow">AKTUELLER PLAN</span><h2>{plan}</h2><p>Für wachsende Teams mit allen wichtigen Business-Funktionen.</p></div><div className="plan-price"><strong>CHF {prices[plan]}</strong><span>/ Monat</span></div><Button onClick={()=>setDialog("plan")}>Plan ändern</Button></section>
      <div className="subscription-detail-grid"><section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzer</span><b>4 von 10</b></div><div className="usage-bar"><i style={{width:"40%"}}/></div><div className="usage-row"><span>Dateispeicher</span><b>2.4 GB von 20 GB</b></div><div className="usage-bar"><i style={{width:"12%"}}/></div></section><section className="surface"><SectionTitle title="Zahlungsmittel"/><div className="payment-method"><Icon name="card"/><div><b>Visa •••• 4242</b><small>Läuft 08/29 ab</small></div><Button variant="secondary" onClick={()=>setDialog("payment")}>Ändern</Button></div></section></div>
      <section className="surface invoices-panel"><SectionTitle title="Rechnungen"/><div className="compact-list"><button type="button" onClick={()=>setBillingInvoice({date:"01.10.2026",amount:"CHF 49.00"})}><b>01.10.2026</b><span>CHF 49.00</span><Status tone="success">Bezahlt</Status><Icon name="arrow" size={16}/></button><button type="button" onClick={()=>setBillingInvoice({date:"01.09.2026",amount:"CHF 49.00"})}><b>01.09.2026</b><span>CHF 49.00</span><Status tone="success">Bezahlt</Status><Icon name="arrow" size={16}/></button></div></section>
      <div className="danger-zone"><div><b>Abonnement kündigen</b><p>Dein Zugriff bleibt bis zum Ende der laufenden Periode aktiv.</p></div><Button variant="danger" onClick={()=>setDialog("cancel")}>Kündigung starten</Button></div>
      {dialog&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet subscription-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>{dialog==="plan"?"Plan ändern":dialog==="payment"?"Zahlungsmittel ändern":"Abonnement kündigen"}</h2><p>Demo-Aktion ohne produktive Zahlungsabwicklung.</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header>{dialog==="plan"&&<div className="plan-choice-list">{["Start","Business","Pro"].map(name=><button type="button" className={plan===name?"selected":""} onClick={()=>setPlan(name)} key={name}><div><b>{name}</b><small>CHF {prices[name]} / Monat</small></div>{plan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>confirm("Demo-Aktion gespeichert.")}>Speichern</Button></div></section></div>}
      {billingInvoice&&<div className="document-modal" role="dialog" aria-modal="true" aria-label="Rechnungsvorschau">
        <header><button type="button" onClick={()=>setBillingInvoice(null)}><Icon name="back"/>Schliessen</button><strong>Rechnungsvorschau</strong><button type="button" aria-label="Teilen" onClick={()=>{const text=`Binso One · Rechnung ${billingInvoice.date} · ${billingInvoice.amount}`;if(navigator.share)void navigator.share({title:"Binso One Rechnung",text}).catch(()=>undefined);else void navigator.clipboard?.writeText(text)}}><Icon name="upload"/></button></header>
        <div className="document-modal-body"><div className="paper"><div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>RECHNUNG</span></div><div className="sender-line">Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell</div><div className="paper-meta"><div><b>Musterwerk AG</b><span>Demo-Firma</span></div><div><small>Datum</small><b>{billingInvoice.date}</b><small>Status</small><b>Bezahlt</b></div></div><div className="paper-intro"><b>Binso One</b><p>Business Abonnement · monatliche Nutzung</p></div><table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody><tr><td>Binso One Business</td><td>1</td><td>49.00</td><td>49.00</td></tr></tbody></table><div className="paper-total"><strong>Total CHF <b>49.00</b></strong></div><footer>Binso GmbH · CHE-173.401.068 · www.binso.ch · +41 58 510 88 58</footer></div></div>
      </div>}
      {toast&&<Toast title={toast}/>} 
    </AppShell>;
  }

  if(!subscription) return <AppShell title="Abonnement" subtitle="Daten werden geladen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen"><EmptyState icon="card" title={billingError?"Abonnement nicht verfügbar":"Abonnement wird geladen"} text={billingError||"Die Kontodaten werden abgerufen."}/></AppShell>;

  const planKey=String(subscription.plan??"trial");
  const planLabel:Record<string,string>={trial:"Testphase",start:"Start",business:"Business",pro:"Pro"};
  const contractAmount=subscription.unit_amount_chf==null?null:Number(subscription.unit_amount_chf);
  const statusLabel:Record<string,string>={trial:"Testphase",active:"Aktiv",past_due:"Überfällig",expired:"Abgelaufen",read_only:"Nur Lesen",suspended:"Pausiert",cancelled:"Gekündigt"};
  const accountLabel:Record<string,string>={trial:"Testphase",read_only:"Nur Lesen",grace_period:"Nachfrist",active:"Aktiv",restricted:"Eingeschränkt",suspended:"Gesperrt",cancelled:"Gekündigt"};
  const subscriptionStatus=String(subscription.subscription_status??"trial");
  const accountStatus=String(subscription.account_status??"active");
  const billingConnected=Boolean(subscription.billing_customer_ref&&subscription.billing_subscription_ref)&&!["cancelled","expired"].includes(subscriptionStatus);
  const billingIntegration=integrations.find(item=>item.key==="billing");
  const billingConfigured=billingIntegration?.configured===true&&catalog.some(item=>item.available);
  const storageLimit=Number(subscription.storage_limit_bytes??0);
  const storageLabel=storageLimit>0?(storageLimit/1024/1024/1024).toLocaleString("de-CH",{maximumFractionDigits:1})+" GB":"—";
  const periodEnd=subscription.current_period_ends_at?new Date(String(subscription.current_period_ends_at)).toLocaleDateString("de-CH"):"—";
  const trialEndDate=subscription.trial_ends_at?new Date(String(subscription.trial_ends_at)):null;
  const trialEnd=trialEndDate?trialEndDate.toLocaleDateString("de-CH"):"—";
  const trialDaysRemaining=trialEndDate?Math.max(0,Math.ceil((trialEndDate.getTime()-referenceNow)/86400000)):0;

  return <AppShell title="Abonnement" subtitle="Plan, Nutzung und Kontostatus." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="plan-hero">
      <div><span className="eyebrow">AKTUELLER PLAN</span><h2>{planLabel[planKey]??planKey}</h2><p>{billingDemo?"Isolierte Demo ohne echte Zahlungen.":subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</p></div>
      <div className="plan-price"><strong>{subscriptionStatus==="trial"?"CHF 0.00":contractAmount==null?"—":moneyChf(contractAmount)}</strong><span>{subscriptionStatus==="trial"?`noch ${trialDaysRemaining} ${trialDaysRemaining===1?"Tag":"Tage"}`:subscription.billing_interval==="yearly"?"/ Jahr":"/ Monat"}</span></div>
      {billingDemo?<Status tone="info">Demo-Modus</Status>:billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing verwalten</Button>:<Button onClick={()=>setDialog("plan")}>Plan aktivieren</Button>):<Status tone="warning">Stripe nicht verfügbar</Status>}
    </section>
    {!stripeLive&&billingConfigured&&<p className="technical-hint">Stripe-Testmodus · keine echten Zahlungen.</p>}
    {subscription.cancel_at_period_end===true&&<p className="technical-hint">Abonnement endet am {periodEnd}.</p>}
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzerlimit</span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span>Dateispeicher</span><b>{storageLabel}</b></div><div className="usage-row"><span>Kontostatus</span><b>{accountLabel[accountStatus]??accountStatus}</b></div><div className="usage-row"><span>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</span><b>{subscriptionStatus==="trial"?trialEnd:periodEnd}</b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingDemo?<div className="context-block"><Status tone="info">Demo</Status><b>Zahlungen sind in der Demo deaktiviert</b><span>Die Demo-Umgebung verwendet keine echten Stripe-Zahlungen. Für ein echtes Abo registrierst du ein produktives Konto über die Preis- oder Registrierungsseite.</span><Button href="/preise">Pläne ansehen</Button></div>:billingConnected?<div className="context-block"><Status tone="success">Verbunden</Status><b>Stripe Billing verbunden</b><span>Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal öffnen</Button></div>:billingConfigured?<div className="context-block"><Status tone="info">Bereit</Status><b>Stripe ist konfiguriert</b><span>Wähle einen Plan, um das produktive Abonnement über Stripe Checkout zu starten.</span><Button onClick={()=>setDialog("plan")}>Plan auswählen</Button></div>:<div className="context-block"><Status tone="warning">Nicht verfügbar</Status><b>Zahlungsabwicklung ist derzeit nicht verfügbar</b><span>Bitte versuche es später erneut oder kontaktiere den Support.</span></div>}</section>
    </div>
    <p className="technical-hint">{automaticTax?"Stripe Tax ist für den Checkout aktiviert.":"Steuer-ID wird im Checkout erfasst; allfällige Steuern richten sich nach der produktiven Stripe-Steuerkonfiguration."}</p><section className="surface invoices-panel"><SectionTitle title="SaaS-Abrechnungen"/>{billingConnected?<div className="context-block"><b>Rechnungen und Zahlungsmittel in Stripe</b><span>Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal</Button></div>:<EmptyState icon="card" title="Noch keine Billing-Daten" text="Es werden keine erfundenen Zahlungsmittel oder SaaS-Rechnungen angezeigt."/>}</section>
    <div className="danger-zone"><div><b>Abonnement verwalten</b><p>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Ohne verbundenes Billing gibt es hier keine produktive Kündigungsaktion."}</p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}>Abonnement verwalten</Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet subscription-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Plan auswählen</h2><p>Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet.</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="sheet-body"><Field label="Zahlungszeitraum"><select value={billingCycle} onChange={e=>setBillingCycle(e.target.value as "monthly"|"yearly")}><option value="monthly">Monatlich</option><option value="yearly">Jährlich</option></select></Field><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=>{const price=catalog.find(item=>item.plan===name&&item.billing===billingCycle);return <button type="button" disabled={!price?.available} className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small>{price?.available?moneyChf(price.amount)+(billingCycle==="yearly"?" / Jahr":" / Monat"):"Noch nicht eingerichtet"}</small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>})}</div><label className="billing-legal-consent"><input type="checkbox" checked={acceptedPaidTerms} onChange={e=>setAcceptedPaidTerms(e.target.checked)}/><span>Ich bestätige den kostenpflichtigen Abschluss gemäss <Link href="/agb" target="_blank">AGB</Link> und habe <Link href="/datenschutz" target="_blank">Datenschutz</Link> sowie <Link href="/auftragsbearbeitung" target="_blank">Auftragsbearbeitung</Link> zur Kenntnis genommen.</span></label><p className="technical-hint">Das Abonnement wird erst durch den erfolgreichen Stripe-Checkout aktiviert. Laufzeit und Preis werden vor dem Abschluss nochmals angezeigt.</p></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>void startCheckout()} disabled={billingLoading||!acceptedPaidTerms||!catalog.some(item=>item.plan===selectedPlan&&item.billing===billingCycle&&item.available)}>{billingLoading?"Checkout wird geöffnet…":"Kostenpflichtig zu Stripe"}</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("nicht")?"danger":"success"}/>}
  </AppShell>;
}

export function NotificationSettingsPage() {
  const rows = [
    ["Rechnungen","Zahlungen, Überfälligkeit und Mahnungen"],
    ["Angebote","Angenommen, abgelehnt oder abgelaufen"],
    ["Support","Neue Antworten und Statusänderungen"],
    ["Zeiterfassung","Erinnerungen und laufende Timer"],
    ["Produktupdates","Neue Funktionen und wichtige Hinweise"],
  ] as const;
  const [prefs,setPrefs] = useState<Record<string,{email:boolean;push:boolean}>>({
    Rechnungen:{email:true,push:true}, Angebote:{email:true,push:true}, Support:{email:true,push:true}, Zeiterfassung:{email:false,push:true}, Produktupdates:{email:true,push:false}
  });
  const [error,setError]=useState("");
  useEffect(()=>{if(!isProductionBackendEnabled())return;apiGet<{items:Array<{kind:string;email:boolean;push:boolean}>}>("/api/settings/notifications").then(data=>setPrefs(current=>{const next={...current};for(const item of data.items)if(next[item.kind])next[item.kind]={email:item.email,push:item.push};return next})).catch(()=>setError("Einstellungen konnten nicht geladen werden."));},[]);
  const toggle = async (title:string, channel:"email"|"push") => {const enabled=!prefs[title][channel];try{if(!isProductionBackendEnabled())throw new Error("Schreibgeschützte Vorschau");await apiPatch("/api/settings/notifications",{kind:title,channel,enabled});setPrefs(current=>({...current,[title]:{...current[title],[channel]:enabled}}));setError("");}catch{setError("Einstellung konnte nicht gespeichert werden.")}};
  return <AppShell title="Benachrichtigungen" subtitle="Bestimme, wie Binso One dich informiert." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<p role="alert">{error}</p>}
    <section className="preference-table"><div className="preference-head"><span>Benachrichtigung</span><span>E-Mail</span><span>Push</span></div>{rows.map(([title,text])=><div className="preference-row" key={title}><div><b>{title}</b><small>{text}</small></div><Toggle checked={prefs[title].email} onChange={()=>void toggle(title,"email")} label={`E-Mail ${title}`}/><Toggle checked={prefs[title].push} onChange={()=>void toggle(title,"push")} label={`Push ${title}`}/></div>)}</section>
  </AppShell>;
}

export function LanguageSettingsPage() {
  const [language,setLanguage] = useState("de-CH");
  const [error,setError]=useState("");
  useEffect(()=>{if(isProductionBackendEnabled())apiGet<{item?:{language?:string}}>("/api/settings/profile").then(data=>{const value=data.item?.language??"de-CH";setLanguage(value==="de"?"de-CH":value)}).catch(()=>setError("Sprache konnte nicht geladen werden."));},[]);
  const choose=async(code:string)=>{try{if(!isProductionBackendEnabled())throw new Error("Schreibgeschützte Vorschau");await apiPatch("/api/settings/profile",{language:code});setLanguage(code);setError("");}catch{setError("Sprache konnte nicht gespeichert werden.")}};
  const languages=[["Deutsch (Schweiz)","de-CH"],["Français","fr"],["Italiano","it"],["English","en"],["Türkçe","tr"]];
  return <AppShell title="Sprache" subtitle="Sprache für Oberfläche und Kommunikation wählen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <div className="choice-list">{languages.map(([label,code])=><button className={language===code?"selected":""} onClick={()=>void choose(code)} type="button" key={code}><span>{code.toUpperCase()}</span><div><b>{label}</b><small>{language===code?"Aktiv":"Auswählen"}</small></div>{language===code?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>
    {error&&<p role="alert">{error}</p>}
    <p className="settings-note">Die vollständigen Übersetzungen werden mit der produktiven Sprachschicht geladen. Diese Auswahl ist bereits für DE, FR, IT, EN und TR vorbereitet.</p>
  </AppShell>;
}

export function AppearanceSettingsPage() {
  const [theme,setTheme] = useState<"light"|"dark"|"system">("light");

  useEffect(()=>{
    const storedMode=document.documentElement.dataset.themeMode;
    const storedResolved=document.documentElement.dataset.theme;
    const next=storedMode==="system"||storedMode==="dark"||storedMode==="light"
      ? storedMode
      : storedResolved==="dark" ? "dark" : "light";
    queueMicrotask(()=>setTheme(next));
  },[]);

  const [error,setError]=useState("");
  useEffect(()=>{void loadTheme().then(mode=>{if(mode)setTheme(mode)}).catch(()=>setError("Darstellung konnte nicht geladen werden."));},[]);
  const choose=async(next:"light"|"dark"|"system")=>{try{await saveTheme(next);setTheme(next);setError("");}catch{setError("Darstellung konnte nicht gespeichert werden.")}};
  return <AppShell title="Darstellung" subtitle="Binso One passt sich deiner Arbeitsweise an." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    {error&&<p role="alert">{error}</p>}
    <div className="appearance-grid">
      <button className={`appearance-card ${theme==="light"?"selected":""}`} onClick={()=>void choose("light")}><div className="theme-preview light"><i/><i/><i/></div><b>Hell</b><small>Klar und kontrastreich</small></button>
      <button className={`appearance-card ${theme==="dark"?"selected":""}`} onClick={()=>void choose("dark")}><div className="theme-preview dark"><i/><i/><i/></div><b>Dunkel</b><small>Reines Schwarz und Weiss</small></button>
      <button className={`appearance-card ${theme==="system"?"selected":""}`} onClick={()=>void choose("system")}><div className="theme-preview system"><i/><i/><i/></div><b>System</b><small>Geräteeinstellung übernehmen</small></button>
    </div>
  </AppShell>;
}

export function DocumentsHubPage() {
  const {rows:offerRows}=useDocumentRows("offer",offers);
  const {rows:invoiceRows}=useDocumentRows("invoice",invoices);
  const {rows:paymentRows}=useDemoRows("payments",payments);
  return <AppShell title="Belege" subtitle="Angebote, Rechnungen und Zahlungen im Überblick." active="belege">
    <div className="documents-hub-grid">
      <section className="surface"><SectionTitle title="Angebote" action={<Link href="/angebote">Alle anzeigen</Link>}/><div className="compact-list">{offerRows.slice(0,5).map(([nr,name,amount,status])=><Link key={nr} href={`/angebote/${nr}`}><b>{nr} · {name}</b><span>{amount}</span><Status>{status}</Status></Link>)}</div><Button href="/angebote/neu" variant="secondary" icon="plus" className="full-button">Angebot erstellen</Button></section>
      <section className="surface"><SectionTitle title="Rechnungen" action={<Link href="/rechnungen">Alle anzeigen</Link>}/><div className="compact-list">{invoiceRows.slice(0,5).map(([nr,name,,amount,status])=><Link key={nr} href={`/rechnungen/${nr}`}><b>{nr} · {name}</b><span>{amount}</span><Status>{status}</Status></Link>)}</div><Button href="/rechnungen/neu" variant="secondary" icon="plus" className="full-button">Rechnung erstellen</Button></section>
      <section className="surface"><SectionTitle title="Zahlungen" action={<Link href="/zahlungen">Alle anzeigen</Link>}/><div className="compact-list">{paymentRows.slice(0,5).map(([id,date,name,,amount,status])=><Link key={id} href={`/zahlungen/${id}`}><b>{date} · {name}</b><span>{amount}</span><Status>{status}</Status></Link>)}</div><Button href="/zahlungen/neu" variant="secondary" icon="plus" className="full-button">Zahlung erfassen</Button></section>
    </div>
  </AppShell>;
}

export function NotificationsPage() {
  const production=useBackendMode();
  const [read,setRead]=useState<string[]>(["invoice","offer"]);
  const [view,setView]=useState<"all"|"unread">("all");
  const [remoteItems,setRemoteItems]=useState<NotificationRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const items=[
    ["invoice","wallet","Rechnung bezahlt","Acme AG · RE-2026-019 · CHF 4’346.40","vor 12 Minuten","/rechnungen/RE-2026-019"],
    ["support","support","Neue Support-Antwort","Ticket #5832 wurde beantwortet.","vor 1 Stunde","/support/5832"],
    ["offer","file","Angebot angenommen","Acme AG · AN-2026-012","heute","/angebote/AN-2026-012"],
    ["time","clock","Zeitmessung läuft","Website Redesign · Acme AG","seit 2 Stunden","/zeit"],
  ];

  const load=async()=>{
    if(!production) return;
    setLoading(true);
    setError(null);
    try{
      const payload=await apiGet<{items:NotificationRecord[]}>("/api/notifications");
      setRemoteItems(payload.items);
    }catch(err){
      setError(err instanceof Error?err.message:"Benachrichtigungen konnten nicht geladen werden.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:NotificationRecord[]}>("/api/notifications")
      .then(payload=>queueMicrotask(()=>{setRemoteItems(payload.items);setLoading(false);}))
      .catch(err=>queueMicrotask(()=>{setError(err instanceof Error?err.message:"Benachrichtigungen konnten nicht geladen werden.");setLoading(false);}));
  },[production]);

  const markRead=async(id:string)=>{
    setRemoteItems(current=>current.map(item=>item.id===id?{...item,read_at:item.read_at??new Date().toISOString()}:item));
    try{
      await apiPatch("/api/notifications/"+encodeURIComponent(id),{});
    }catch{
      void load();
    }
  };

  const markAll=async()=>{
    setRemoteItems(current=>current.map(item=>({...item,read_at:item.read_at??new Date().toISOString()})));
    try{
      await apiPatch("/api/notifications",{action:"read_all"});
    }catch{
      void load();
    }
  };

  if(production){
    const unreadCount=remoteItems.filter(item=>!item.read_at).length;
    const visible=view==="all"?remoteItems:remoteItems.filter(item=>!item.read_at);
    return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={unreadCount>0?<Button variant="secondary" onClick={()=>void markAll()}>Alle gelesen</Button>:undefined}>
      <div className="notification-center">
        <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
        {loading&&remoteItems.length===0&&<EmptyState icon="bell" title="Benachrichtigungen werden geladen" text="Aktuelle Aktivitäten werden abgerufen."/>}
        {error&&<EmptyState icon="bell" title="Benachrichtigungen nicht verfügbar" text={error} action={<Button variant="secondary" onClick={()=>void load()}>Erneut laden</Button>}/>}
        {!loading&&!error&&visible.length===0&&<EmptyState icon="bell" title={view==="unread"?"Alles gelesen":"Noch keine Benachrichtigungen"} text={view==="unread"?"Es gibt aktuell keine ungelesenen Benachrichtigungen.":"Neue Aktivitäten erscheinen hier automatisch."}/>}
        {!error&&visible.length>0&&<div className="notification-center-list">{visible.map(item=><Link href={item.href||"/dashboard"} className={item.read_at?"notification-center-row":"notification-center-row unread"} key={item.id} onClick={()=>void markRead(item.id)}>
          <span className="activity-icon"><Icon name={notificationIcon(item.kind)}/></span>
          <div><b>{item.title}</b><p>{item.body}</p><small>{notificationDate(item.created_at)}</small></div>
          {!item.read_at&&<i className="unread-dot"/>}
          <Icon name="arrow" size={16}/>
        </Link>)}</div>}
        <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
      </div>
    </AppShell>;
  }

  const visible=view==="all"?items:items.filter(([id])=>!read.includes(id));
  const unreadCount=items.length-read.length;
  return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={<Button variant="secondary" onClick={()=>setRead(items.map(item=>item[0]))}>Alle gelesen</Button>}>
    <div className="notification-center">
      <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
      {visible.length?<div className="notification-center-list">{visible.map(([id,icon,title,text,time,href])=>{
        const isRead=read.includes(id);
        return <Link href={href} className={isRead?"notification-center-row":"notification-center-row unread"} key={id} onClick={()=>setRead(current=>current.includes(id)?current:[...current,id])}>
          <span className="activity-icon"><Icon name={icon}/></span>
          <div><b>{title}</b><p>{text}</p><small>{time}</small></div>
          {!isRead&&<i className="unread-dot"/>}
          <Icon name="arrow" size={16}/>
        </Link>;
      })}</div>:<EmptyState icon="bell" title="Alles gelesen" text="Es gibt aktuell keine ungelesenen Benachrichtigungen."/>}
      <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
    </div>
  </AppShell>;
}

export function SimpleModule({ kind }: { kind: "angebote"|"zahlungen"|"produkte"|"mitarbeiter"|"spesen"|"support"|"einstellungen" }) {
  if (kind === "angebote") return <OffersPage/>;
  if (kind === "zahlungen") return <PaymentsPage/>;
  if (kind === "produkte") return <ProductsPage/>;
  if (kind === "mitarbeiter") return <EmployeesPage/>;
  if (kind === "spesen") return <ExpensesPage/>;
  if (kind === "support") return <SupportPage/>;
  return <SettingsPage/>;
}

export function EmptyDemoPage() {
  return <AppShell title="Noch keine Einträge" active="dashboard"><EmptyState icon="file" title="Noch nichts vorhanden" text="Erstelle deinen ersten Eintrag, um loszulegen." action={<Button href="/kunden/neu" icon="plus">Erstellen</Button>}/></AppShell>;
}
