"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { readTimer, changeTimer } from "@/lib/client/time-tracker";
import { AppShell } from "./app-shell";
import { RecordRow, RecordsView } from "./records";
import { InvoicePreview } from "./documents";
export { InvoiceEditor, OfferEditor } from "./documents";
import { customers, employees, expenses, invoices, offers, payments, products } from "@/lib/demo-data";
import { appendDemoRow, type DemoCollection } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, Field, Icon, Metric, SectionTitle, Status, Toast, Toggle } from "./ui";

function moneyChf(value:unknown){
  const amount=Number(value);
  return `CHF ${Number.isFinite(amount)?amount.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}):"0.00"}`;
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
    return [String(item.id??""),swissDate(item.paid_on),String(customer?.name??"Kunde"),[invoice?.number,item.method].filter(Boolean).join(" · "),moneyChf(item.amount),statusMap[String(item.status)]??String(item.status??"")];
  });
  return [];
}

function useDemoRows(collection:DemoCollection, defaults:string[][]) {
  const [rows,setRows]=useState<string[][]>([]);

  useEffect(()=>{
    if(isProductionBackendEnabled()){
      const controller=new AbortController();
      apiGet<{items:Record<string,unknown>[]}>(`/api/${collection==="payments"?"payments":collection}`)
        .then(payload=>queueMicrotask(()=>setRows(mapRemoteRows(collection,payload.items))))
        .catch(()=>queueMicrotask(()=>setRows([])));
      return()=>controller.abort();
    }

    const sync=()=>{
      apiGet<{items:Record<string,unknown>[]}>(`/api/demo/data?collection=${collection}`)
        .then(payload=>setRows(mapRemoteRows(collection,payload.items))).catch(()=>setRows([]));
    };
    sync();
    const listener=(event:Event)=>{
      const detail=(event as CustomEvent<{collection?:string}>).detail;
      if(!detail?.collection || detail.collection===collection) sync();
    };
    window.addEventListener("binso-demo-data",listener);
    window.addEventListener("storage",sync);
    return()=>{
      window.removeEventListener("binso-demo-data",listener);
      window.removeEventListener("storage",sync);
    };
  },[collection,defaults]);

  return rows;
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
  const [dashboardMonth,setDashboardMonth]=useState(()=>new Date().getMonth());

  useEffect(()=>{
    if(forceDemo) return;
    apiGet<typeof data>(isProductionBackendEnabled()?"/api/dashboard":"/api/demo/dashboard").then(payload=>queueMicrotask(()=>setData(payload))).catch(()=>undefined);
  },[production,forceDemo]);

  if(forceDemo) return <AppShell title="Guten Morgen, Thomas" subtitle="Hier ist die Übersicht zu deinem Unternehmen." active="dashboard" preview={forceDemo}>
    <div className="metrics-grid"><Metric label="Umsatz im Monat" value={moneyChf([7800,11200,10100,14500,12700,16200,18100,15900,16600,19800,20100,23400][dashboardMonth])} hint="Rechnungsvolumen" icon="chart"/><Metric label="Rechnungen" value={String([4,5,5,7,6,8,9,8,8,10,10,12][dashboardMonth])} hint="In diesem Monat" icon="receipt"/><Metric label="Zahlungseingänge" value={moneyChf([6900,9800,9400,13100,11800,14900,16500,15100,15400,18100,18900,21600][dashboardMonth])} hint="Verbucht im Monat" icon="wallet"/><Metric label="Neue Kunden" value={String([1,2,1,3,2,2,3,1,2,3,2,4][dashboardMonth])} hint="In diesem Monat" icon="users"/></div>
    <RevenueInsight demo onMonthChange={setDashboardMonth}/><div className="dashboard-grid"><section className="surface"><SectionTitle title="Letzte Aktivitäten" action={<Link href="/benachrichtigungen">Alle anzeigen</Link>}/><div className="activity-list">{[["Rechnung bezahlt","Acme AG · CHF 4’346.40","receipt","/rechnungen/RE-2026-019"],["Neuer Kunde","Berger Bau AG","users","/kunden/berger-bau"],["Angebot angenommen","Müller GmbH · CHF 3’200.00","file","/angebote/AN-2026-012"],["Zeit erfasst","Website Redesign · 4:30 h","clock","/zeit"]].map(([a,b,icon,href])=><Link href={href} key={a}><span className="activity-icon"><Icon name={icon}/></span><div><b>{a}</b><small>{b}</small></div><Icon name="arrow" size={16}/></Link>)}</div></section></div>
    <section className="quick-section"><SectionTitle title="Schnellzugriff"/><div className="quick-grid"><Button href="/kunden/neu?returnTo=/dashboard" variant="secondary" icon="users">Kunde erfassen</Button><Button href="/angebote/neu?returnTo=/dashboard" variant="secondary" icon="file">Angebot erstellen</Button><Button href="/rechnungen/neu?returnTo=/dashboard" variant="secondary" icon="receipt">Rechnung erstellen</Button><Button href="/zeit?returnTo=/dashboard" variant="secondary" icon="clock">Zeit erfassen</Button></div></section>
  </AppShell>;

  const stats=data.stats??{};
  const invoices=data.invoices??[];
  const paymentsData=data.payments??[];
  const analyticsInvoices=data.analyticsInvoices??[];
  const analyticsPayments=data.analyticsPayments??[];
  const selectedYear=new Date().getFullYear();
  const monthInvoices=analyticsInvoices.filter(item=>{const d=new Date(String(item.issue_date??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthPayments=analyticsPayments.filter(item=>{const d=new Date(String(item.paid_on??item.created_at??""));return !Number.isNaN(d.getTime())&&d.getFullYear()===selectedYear&&d.getMonth()===dashboardMonth;});
  const monthRevenue=monthInvoices.reduce((sum,item)=>sum+Number(item.total??0),0);
  const monthPaid=monthPayments.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const monthCustomers=new Set(monthInvoices.map(item=>String(item.customer_id??"")).filter(Boolean)).size;

  return <AppShell title="Übersicht" subtitle="Dein Unternehmen auf einen Blick." active="dashboard">
    <div className="metrics-grid">
      <Metric label="Umsatz im Monat" value={moneyChf(monthRevenue)} hint="Rechnungsvolumen" icon="chart"/>
      <Metric label="Rechnungen" value={String(monthInvoices.length)} hint="In diesem Monat" icon="receipt"/>
      <Metric label="Zahlungseingänge" value={moneyChf(monthPaid)} hint="Verbucht im Monat" icon="wallet"/>
      <Metric label="Kunden" value={String(monthCustomers)} hint="Mit Rechnungen im Monat" icon="users"/>
    </div>
    <RevenueInsight invoices={analyticsInvoices} onMonthChange={setDashboardMonth}/>
    <div className="dashboard-grid">
      <section className="surface">
        <SectionTitle title="Letzte Rechnungen" action={<Link href="/rechnungen">Alle Rechnungen</Link>}/>
        {invoices.length?<div className="compact-list">{invoices.map(item=>{const customer=item.customer as {name?:string}|undefined;return <Link href={"/rechnungen/"+String(item.number)} key={String(item.id)}><b>{String(item.number)}</b><span>{customer?.name??"Kunde"} · {swissDate(item.issue_date)}</span><Status tone={String(item.status)==="paid"?"success":String(item.status)==="overdue"?"danger":"warning"}>{String(item.status)==="paid"?"Bezahlt":String(item.status)==="overdue"?"Überfällig":String(item.status)==="draft"?"Entwurf":"Offen"}</Status><strong>{moneyChf(item.total)}</strong></Link>})}</div>:<EmptyState icon="receipt" title="Noch keine Rechnungen" text="Erstelle die erste Rechnung für einen Kunden." action={<Button href="/rechnungen/neu">Rechnung erstellen</Button>}/>}
      </section>
      <section className="surface">
        <SectionTitle title="Letzte Zahlungen" action={<Link href="/zahlungen">Alle Zahlungen</Link>}/>
        {paymentsData.length?<div className="activity-list">{paymentsData.map(item=>{const customer=item.customer as {name?:string}|undefined;const invoice=item.invoice as {number?:string}|undefined;return <Link href={"/zahlungen/"+String(item.id)} key={String(item.id)}><span className="activity-icon"><Icon name="wallet"/></span><div><b>{moneyChf(item.amount)}</b><small>{[customer?.name,invoice?.number,swissDate(item.paid_on)].filter(Boolean).join(" · ")}</small></div><Icon name="arrow" size={16}/></Link>})}</div>:<EmptyState icon="wallet" title="Noch keine Zahlungen" text="Erfasste Zahlungen erscheinen hier."/>}
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
  useEffect(()=>{apiGet<typeof data>(isProductionBackendEnabled()?"/api/finance":"/api/demo/finance").then(payload=>{setData(payload);setError(null)}).catch(e=>setError(e instanceof Error?e.message:"Finanzdaten konnten nicht geladen werden."))},[production]);
  const now=new Date();
  const ranges:Record<string,{label:string;months:number}>={month:{label:"Dieser Monat",months:1},last:{label:"Letzter Monat",months:1},three:{label:"3 Monate",months:3},year:{label:"12 Monate",months:12},previous:{label:"Letztes Jahr",months:12}};
  const bounds=(()=>{let end=new Date(now.getFullYear(),now.getMonth()+1,1),start=new Date(now.getFullYear(),now.getMonth(),1);if(range==="last"){end=start;start=new Date(end.getFullYear(),end.getMonth()-1,1)}else if(range==="three")start=new Date(end.getFullYear(),end.getMonth()-3,1);else if(range==="year")start=new Date(end.getFullYear(),end.getMonth()-12,1);else if(range==="previous"){start=new Date(now.getFullYear()-1,0,1);end=new Date(now.getFullYear(),0,1)}return{start,end}})();
  const payments=(data.payments??[]);
  const selected=payments.filter(item=>{const d=new Date(String(item.payment_date??""));return d>=bounds.start&&d<bounds.end});
  const income=selected.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const inRange=(value:unknown)=>{const d=new Date(String(value??""));return d>=bounds.start&&d<bounds.end};
  const expense=((data.expenses??[])).filter(x=>inRange(x.expense_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const operating=((data.operatingCosts??[])).filter(x=>inRange(x.cost_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const staff=((data.payroll??[])).filter(x=>{const d=new Date(String(x.period??"")+"-01");return d>=bounds.start&&d<bounds.end}).reduce((s,x)=>s+Number(x.gross_amount??0),0);
  const costs=expense+operating+staff,result=income-costs;
  const monthly=Array.from({length:Math.min(12,ranges[range].months)},(_,i)=>{const d=new Date(bounds.end.getFullYear(),bounds.end.getMonth()-1-i,1);const value=payments.filter(item=>{const x=new Date(String(item.payment_date??""));return x.getFullYear()===d.getFullYear()&&x.getMonth()===d.getMonth()}).reduce((s,item)=>s+Number(item.amount??0),0);return{label:d.toLocaleDateString("de-CH",{month:"short"}),value}}).reverse();
  const max=Math.max(1,...monthly.map(x=>x.value));
  return <AppShell title="Finanzen" subtitle="Einnahmen, Kosten und Ergebnis nach Zeitraum." active="finanzen">
    {error&&<p role="alert">{error}</p>}
    <div className="finance-range" aria-label="Zeitraum">{Object.entries(ranges).map(([key,item])=><button type="button" className={range===key?"active":""} key={key} onClick={()=>setRange(key)}>{item.label}</button>)}</div>
    <div className="metrics-grid finance-metrics"><Metric label="Einnahmen" value={moneyChf(income)} hint="Verbuchte Zahlungen" icon="wallet"/><Metric label="Ausgaben" value={moneyChf(expense+operating)} hint="Spesen und Betrieb" icon="card"/><Metric label="Personalkosten" value={moneyChf(staff)} hint="Bruttolöhne im Zeitraum" icon="users"/><Metric label="Ergebnis" value={moneyChf(result)} hint="Einnahmen minus Kosten" icon="chart"/></div>
    <section className="finance-analysis"><div className="section-title"><div><span className="eyebrow">ENTWICKLUNG</span><h2>Einnahmen im Zeitraum</h2></div></div><div className="finance-month-bars">{monthly.map(item=><div key={item.label}><i style={{height:`${item.value>0?Math.max(8,item.value/max*100):0}%`}}/><b>{item.label}</b><small>{moneyChf(item.value)}</small></div>)}</div></section>
    <div className="finance-breakdown"><section><h3>Kostenübersicht</h3><div><span>Betriebsausgaben</span><strong>{moneyChf(operating)}</strong></div><div><span>Personalkosten</span><strong>{moneyChf(staff)}</strong></div><div><span>Spesen</span><strong>{moneyChf(expense)}</strong></div></section><section><h3>Datenbasis</h3><p>Einnahmen stammen aus verbuchten Zahlungen. Spesen, Betriebskosten und freigegebene Lohnläufe werden für denselben Zeitraum aus der Datenbank ausgewertet.</p></section></div>
  </AppShell>;
}

export function WelcomePage() {
  return <AppShell title="Willkommen bei Binso One" subtitle="Starte mit dem, was du gerade brauchst." active="dashboard">
    <div className="onboarding-progress" aria-label="Einrichtung">
      <div><span>1</span><b>Konto erstellt</b></div><i/>
      <div className="active"><span>2</span><b>Erster Schritt</b></div><i/>
      <div><span>3</span><b>Binso One nutzen</b></div>
    </div>
    <section className="onboarding-intro">
      <span className="eyebrow">SCHNELLSTART</span>
      <h2>Was möchtest du zuerst machen?</h2>
      <p>Du musst nicht zuerst alles einrichten. Wähle eine Aufgabe und ergänze Firmendaten später.</p>
    </section>
    <div className="welcome-grid">
      <Link href="/kunden/neu"><span><Icon name="users"/></span><div><b>Kunde erfassen</b><small>Lege deinen ersten Kunden mit den wichtigsten Angaben an.</small></div><Icon name="arrow"/></Link>
      <Link href="/angebote/neu"><span><Icon name="file"/></span><div><b>Angebot erstellen</b><small>Erstelle direkt ein Angebot mit Live-Vorschau.</small></div><Icon name="arrow"/></Link>
      <Link href="/rechnungen/neu"><span><Icon name="receipt"/></span><div><b>Rechnung erstellen</b><small>Erstelle eine Rechnung und prüfe sie vor dem Versand.</small></div><Icon name="arrow"/></Link>
      <Link href="/dashboard"><span><Icon name="home"/></span><div><b>Erst umsehen</b><small>Öffne das Dashboard und lerne Binso One kennen.</small></div><Icon name="arrow"/></Link>
    </div>
    <div className="onboarding-footer">
      <p>Firmendaten, Logo, MwSt. und Zahlungsbedingungen kannst du jederzeit unter Einstellungen ergänzen.</p>
      <Button href="/dashboard">Zum Dashboard</Button>
    </div>
  </AppShell>;
}

export function CustomersPage() {
  const customerRows=useDemoRows("customers",customers);
  return <AppShell title="Kunden" subtitle="Kunden, Kontakte und Aktivitäten zentral verwalten." active="kunden" actions={<Button href="/kunden/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neuer Kunde"><span className="create-action-label">Neuer Kunde</span></Button>}>
    <div className="tablet-master-detail">
      <div>
        <RecordsView items={customerRows} placeholder="Kunden suchen...">{(row)=>{const [name,sector,city,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"acme";const status=statusMaybe??idOrStatus;return <RecordRow href={"/kunden/"+id} title={name} meta={`${sector} · ${city}`} status={status}/>}}</RecordsView>
      </div>
      <aside className="tablet-detail surface">
        <div className="tablet-detail-head"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>Bauunternehmen · Zürich</p></div><Status tone="success">Aktiv</Status></div>
        <div className="tablet-actions"><Button href="/angebote/neu" variant="secondary">Angebot</Button><Button href="/rechnungen/neu">Rechnung</Button></div>
        <dl className="detail-list">
          <div><dt>E-Mail</dt><dd>info@acme.ch</dd></div>
          <div><dt>Telefon</dt><dd>+41 44 123 45 67</dd></div>
          <div><dt>Adresse</dt><dd>Bahnhofstrasse 123<br/>8001 Zürich</dd></div>
        </dl>
        <Link className="text-link" href="/kunden/acme">Kundendetail öffnen <Icon name="arrow" size={15}/></Link>
      </aside>
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
    if(!production){
      setContactOpen(false);
      setContactToast("Kontakt gespeichert.");
      window.setTimeout(()=>setContactToast(null),2200);
      return;
    }
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
    return <AppShell title="Acme AG" subtitle="Bauunternehmen · Zürich" active="kunden" backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":"Kunden"} actions={<><Button href="/angebote/neu" variant="secondary">Angebot erstellen</Button><Button href="/rechnungen/neu">Rechnung erstellen</Button></>}>
      <div className="entity-hero"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>Bauunternehmen · Zürich</p></div><Status tone="success">Aktiv</Status></div>
      <div className="tabs"><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button><button className={tab==="docs"?"active":""} onClick={()=>setTab("docs")}>Belege</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button></div>
      {tab==="overview"&&<div className="detail-grid"><section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>Acme AG</dd></div><div><dt>E-Mail</dt><dd>info@acme.ch</dd></div><div><dt>Telefon</dt><dd>+41 44 123 45 67</dd></div><div><dt>Adresse</dt><dd>Bahnhofstrasse 123<br/>8001 Zürich</dd></div><div><dt>UID</dt><dd>CHE-123.456.789</dd></div></dl></section></div>}
      {tab==="contacts"&&<section className="surface customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" onClick={()=>setContactOpen(true)}>Kontakt</Button>}/><div className="contact-list"><div><span className="record-avatar">TM</span><div><b>Thomas Meier</b><small>Geschäftsführer · thomas.meier@acme.ch · +41 79 123 45 67</small></div><Status tone="success">Hauptkontakt</Status></div></div></section>}
      {tab==="docs"&&<section className="surface customer-tab-panel"><SectionTitle title="Belege"/><div className="compact-list"><Link href="/rechnungen/RE-2026-019"><b>RE-2026-019</b><span>12.09.2026 · CHF 4’346.40</span><Status tone="success">Bezahlt</Status></Link></div></section>}
      {tab==="activity"&&<section className="surface customer-tab-panel"><SectionTitle title="Aktivität"/><div className="timeline"><div><i/><div><b>Kundendaten aktualisiert</b><small>Demo</small></div></div></div></section>}
      {contactOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setContactOpen(false)}}><section className="bottom-sheet contact-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Kontakt hinzufügen</h2><p>Kontakt wird direkt Acme AG zugeordnet.</p></div><button className="icon-button" onClick={()=>setContactOpen(false)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="form-grid two"><Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field><Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field><Field label="E-Mail"><input value={contactEmail} onChange={e=>setContactEmail(e.target.value)} type="email"/></Field><Field label="Telefon"><input value={contactPhone} onChange={e=>setContactPhone(e.target.value)} type="tel"/></Field><Field label="Funktion" className="full"><input value={contactRole} onChange={e=>setContactRole(e.target.value)}/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setContactOpen(false)}>Abbrechen</Button><Button onClick={()=>void saveContact()}>Kontakt speichern</Button></div></section></div>}
      {contactToast&&<Toast title={contactToast}/>}
    </AppShell>;
  }

  if(!customer) return <AppShell title="Kunde" subtitle="Daten werden geladen." active="kunden" backHref="/kunden" backLabel="Kunden"><EmptyState icon="users" title="Kunde wird geladen" text="Die Kundendaten werden abgerufen."/></AppShell>;

  const name=String(customer.name??"Kunde");
  const sector=String(customer.sector??"—");
  const city=String(customer.city??"—");
  const status=String(customer.status??"active");
  return <AppShell title={name} subtitle={sector+" · "+city} active="kunden" backHref="/kunden" backLabel="Kunden" actions={<><Button href="/angebote/neu" variant="secondary">Angebot erstellen</Button><Button href="/rechnungen/neu">Rechnung erstellen</Button></>}>
    <div className="entity-hero"><span className="record-avatar large">{name.slice(0,1)}</span><div><h2>{name}</h2><p>{sector+" · "+city}</p></div><Status tone={status==="active"?"success":"neutral"}>{status==="active"?"Aktiv":"Inaktiv"}</Status></div>
    <div className="tabs"><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button><button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button><button className={tab==="docs"?"active":""} onClick={()=>setTab("docs")}>Belege</button><button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button></div>
    {tab==="overview"&&<div className="detail-grid"><section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>{name}</dd></div><div><dt>E-Mail</dt><dd>{String(customer.email??"—")}</dd></div><div><dt>Telefon</dt><dd>{String(customer.phone??"—")}</dd></div><div><dt>Adresse</dt><dd>{String(customer.street??"—")}<br/>{[customer.postal_code,customer.city].filter(Boolean).join(" ")||"—"}</dd></div><div><dt>UID</dt><dd>{String(customer.uid??"—")}</dd></div></dl></section><section className="surface"><SectionTitle title="Status"/><div className="context-block"><small>Kundenstatus</small><b>{status==="active"?"Aktiv":"Inaktiv"}</b><span>Erstellt {new Date(String(customer.created_at)).toLocaleDateString("de-CH")}</span></div></section></div>}
    {tab==="contacts"&&<section className="surface customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" onClick={()=>setContactOpen(true)}>Kontakt</Button>}/>{contacts.length?<div className="contact-list">{contacts.map(contact=>{const fullName=[contact.first_name,contact.last_name].filter(Boolean).join(" ");const initials=String(contact.first_name??"").slice(0,1)+String(contact.last_name??"").slice(0,1);return <div key={String(contact.id)}><span className="record-avatar">{initials.toUpperCase()}</span><div><b>{fullName}</b><small>{[contact.job_title,contact.email,contact.phone].filter(Boolean).join(" · ")}</small></div>{contact.is_primary===true&&<Status tone="success">Hauptkontakt</Status>}</div>})}</div>:<EmptyState icon="users" title="Noch keine Kontakte" text="Füge den ersten Ansprechpartner für diesen Kunden hinzu."/>}</section>}
    {tab==="docs"&&<section className="surface customer-tab-panel"><SectionTitle title="Belege"/>{customerDocuments.length?<div className="compact-list">{customerDocuments.map(item=>{const kind=String(item.kind);const statusValue=String(item.status??"draft");const statusLabel:Record<string,string>={draft:"Entwurf",sent:"Gesendet",accepted:"Angenommen",declined:"Abgelehnt",open:"Offen",paid:"Bezahlt",overdue:"Überfällig",cancelled:"Storniert"};return <Link href={(kind==="offer"?"/angebote/":"/rechnungen/")+String(item.number)} key={String(item.id)}><b>{String(item.number)}</b><span>{swissDate(item.issue_date)} · {moneyChf(item.total)}</span><Status tone={statusValue==="paid"||statusValue==="accepted"?"success":statusValue==="overdue"||statusValue==="declined"?"danger":"warning"}>{statusLabel[statusValue]??statusValue}</Status></Link>})}</div>:<EmptyState icon="receipt" title="Noch keine Belege" text="Angebote und Rechnungen für diesen Kunden erscheinen hier."/>}</section>}
    {tab==="activity"&&<section className="surface customer-tab-panel"><SectionTitle title="Aktivität"/><div className="timeline"><div><i/><div><b>Kunde erstellt</b><small>{new Date(String(customer.created_at)).toLocaleString("de-CH")}</small></div></div><div><i/><div><b>Zuletzt aktualisiert</b><small>{new Date(String(customer.updated_at)).toLocaleString("de-CH")}</small></div></div></div></section>}
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
  const [toast,setToast]=useState<string|null>(null);
  const save=async()=>{
    if(!company.trim() || !city.trim()){
      setToast("Firmenname und Ort sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(isProductionBackendEnabled()) await apiPost("/api/customers",{name:company.trim(),sector,email,phone,city});
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
      <details className="optional-details"><summary>Weitere Angaben</summary><div className="form-grid two"><Field label="Adresse"><input placeholder="Strasse und Nummer"/></Field><Field label="PLZ"><input inputMode="numeric" placeholder="8000"/></Field><Field label="UID"><input placeholder="CHE-000.000.000"/></Field><Field label="Interne Notiz"><input placeholder="Optional"/></Field></div></details>
      <div className="mobile-sticky-save"><Button onClick={save}>Kunde speichern</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={company.trim()&&city.trim()?"success":"danger"}/>}
  </AppShell>;
}

function useDocumentRows(kind:"offer"|"invoice",defaults:string[][],forceDemo=false){
  const [rows,setRows]=useState<string[][]>([]);
  useEffect(()=>{
    if(forceDemo){queueMicrotask(()=>setRows(defaults));return;}
    apiGet<{items:Array<{number:string;status:string;issue_date:string;total:number;customer?:{name?:string}}>}>(isProductionBackendEnabled()?`/api/documents?kind=${kind}`:`/api/demo/data?collection=documents&kind=${kind}`)
      .then(payload=>{
        const statusMap:Record<string,string>={draft:"Entwurf",sent:"Gesendet",accepted:"Angenommen",declined:"Abgelehnt",open:"Offen",paid:"Bezahlt",overdue:"Überfällig",cancelled:"Storniert"};
        const mapped=payload.items.map(item=>{
          const customer=item.customer?.name??"Kunde";
          const status=statusMap[item.status]??item.status;
          if(kind==="offer") return [item.number,customer,moneyChf(item.total),status];
          return [item.number,customer,swissDate(item.issue_date),moneyChf(item.total),status];
        });
        queueMicrotask(()=>setRows(mapped));
      })
      .catch(()=>undefined);
  },[kind,defaults,forceDemo]);
  return rows;
}

export function OffersPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const offerRows=useDocumentRows("offer",offers,forceDemo);
  return <AppShell title="Angebote" subtitle="Professionelle Angebote in wenigen Klicks erstellen." active="angebote" actions={<Button href="/angebote/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Angebot"><span className="create-action-label">Neues Angebot</span></Button>}>
    <RecordsView items={offerRows} placeholder="Angebote suchen..." chips={["Alle","Entwurf","Gesendet","Angenommen"]}>{([nr,name,amount,status])=><RecordRow href={`/angebote/${nr}`} icon="file" title={nr} meta={name} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function InvoicesPage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const invoiceRows=useDocumentRows("invoice",invoices,forceDemo);
  return <AppShell title="Rechnungen" subtitle="Erstellen, senden und Zahlungsstatus im Blick behalten." active="rechnungen" actions={<Button href="/rechnungen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neue Rechnung"><span className="create-action-label">Neue Rechnung</span></Button>}>
    <div className="tablet-master-detail invoice-master-detail">
      <div>
        <RecordsView items={invoiceRows} placeholder="Rechnungen suchen..." chips={["Alle","Offen","Bezahlt","Überfällig"]}>{([nr,name,date,amount,status])=><RecordRow href={`/rechnungen/${nr}`} icon="receipt" title={nr} meta={`${name} · ${date}`} value={amount} status={status}/>}</RecordsView>
      </div>
      <aside className="tablet-detail invoice-tablet-preview">
        <div className="tablet-detail-head"><span className="activity-icon"><Icon name="receipt"/></span><div><h2>RE-2026-019</h2><p>Acme AG · 12.09.2026</p></div><Status tone="success">Bezahlt</Status></div>
        <div className="tablet-document-actions"><Button href="/rechnungen/RE-2026-019" variant="secondary">Öffnen</Button><Button href="/zahlungen/neu">Zahlung</Button></div>
        <InvoicePreview/>
      </aside>
    </div>
  </AppShell>;
}

export function PaymentsPage() {
  const paymentRows=useDemoRows("payments",payments);
  return <AppShell title="Zahlungen" subtitle="Eingänge und offene Beträge übersichtlich verwalten." active="zahlungen" actions={<Button href="/zahlungen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Zahlung erfassen"><span className="create-action-label">Zahlung erfassen</span></Button>}>
    <div className="payment-summary-strip" aria-label="Zahlungsübersicht">
      <div><span>Eingegangen</span><b>CHF 49’820</b><small>diesen Monat</small></div>
      <div><span>Offen</span><b>CHF 12’800</b><small>8 Rechnungen</small></div>
      <div><span>Überfällig</span><b>CHF 3’700</b><small>1 Rechnung</small></div>
    </div>
    <RecordsView items={paymentRows} placeholder="Zahlungen suchen..." chips={["Alle","Verbucht","Ausstehend"]}>{([id,date,name,meta,amount,status])=><RecordRow href={`/zahlungen/${id}`} icon="wallet" title={`${date} · ${name}`} meta={meta} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function PaymentForm() {
  const router=useRouter();
  const [date,setDate]=useState("2026-10-02");
  const [amount,setAmount]=useState("4346.40");
  const [method,setMethod]=useState("Banküberweisung");
  const [idempotencyKey,setIdempotencyKey]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const save=async()=>{
    const value=Number(amount.replace(",","."));
    if(!Number.isFinite(value)||value<=0){
      setToast("Bitte einen gültigen Betrag erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      if(isProductionBackendEnabled()){
        const key=idempotencyKey||window.crypto.randomUUID();
        if(!idempotencyKey) setIdempotencyKey(key);
        await apiPost("/api/payments",{invoiceNumber:"RE-2026-019",customerName:"Acme AG",paidOn:date,amount:value,method,note:""},{idempotencyKey:key});
      }
      else{
        const id=String(Date.now());
        const displayDate=date.split("-").reverse().join(".");
        appendDemoRow("payments",[id,displayDate,"Acme AG",`RE-2026-019 · ${method}`,`CHF ${value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}`,"Verbucht"]);
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
      <section className="payment-context"><span className="activity-icon"><Icon name="receipt"/></span><div><small>Rechnung</small><b>RE-2026-019 · Acme AG</b><span>Offener Betrag CHF 4’346.40</span></div></section>
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="Betrag"><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)}/></Field>
        <Field label="Zahlungsmethode"><select value={method} onChange={e=>setMethod(e.target.value)}><option>Banküberweisung</option><option>Kreditkarte</option><option>TWINT</option><option>Bar</option></select></Field>
        <Field label="Notiz"><input placeholder="Optional"/></Field>
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
    <div className="success-panel"><span><Icon name="check" size={28}/></span><h2>CHF 4’346.40</h2><p>Zahlung erfolgreich verbucht</p><Status tone="success">Verbucht</Status></div>
    <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>02.10.2026</dd></div><div><dt>Rechnung</dt><dd>RE-2026-019</dd></div><div><dt>Kunde</dt><dd>Acme AG</dd></div><div><dt>Zahlungsart</dt><dd>Banküberweisung</dd></div></dl></section>
  </AppShell>;

  if(!payment) return <AppShell title="Zahlung" subtitle="Daten werden geladen." active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen"><EmptyState icon="wallet" title="Zahlung wird geladen" text="Die Zahlungsdaten werden abgerufen."/></AppShell>;

  const customer=payment.customer as {name?:string}|null|undefined;
  const invoice=payment.invoice as {number?:string;total?:number}|null|undefined;
  const status=String(payment.status??"booked");
  const statusLabel:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
  return <AppShell title="Zahlung" subtitle={[invoice?.number,customer?.name].filter(Boolean).join(" · ")} active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="success-panel"><span><Icon name={status==="booked"?"check":"clock"} size={28}/></span><h2>{"CHF "+Number(payment.amount??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}</h2><p>{status==="booked"?"Zahlung verbucht":"Zahlungsstatus"}</p><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}>{statusLabel[status]??status}</Status></div>
    <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>{swissDate(payment.paid_on)}</dd></div><div><dt>Rechnung</dt><dd>{invoice?.number??"—"}</dd></div><div><dt>Kunde</dt><dd>{customer?.name??"—"}</dd></div><div><dt>Zahlungsart</dt><dd>{String(payment.method??"—")}</dd></div><div><dt>Notiz</dt><dd>{String(payment.note??"—")}</dd></div></dl></section>
  </AppShell>;
}

export function ProductsPage() {
  const productRows=useDemoRows("products",products);
  return <AppShell title="Produkte" subtitle="Produkte und Dienstleistungen zentral verwalten." active="produkte" actions={<Button href="/produkte/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Produkt"><span className="create-action-label">Neues Produkt</span></Button>}>
    <RecordsView items={productRows} placeholder="Produkte suchen..." chips={["Alle","Dienstleistungen","Produkte"]}>{(row)=>{const [name,type,price,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"beratung";const status=statusMaybe??idOrStatus;return <RecordRow href={"/produkte/"+id} icon="box" title={name} meta={type} value={price} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ProductForm({ existing = false, productId }: { existing?: boolean; productId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [name,setName]=useState(existing?"Beratung":"");
  const [type,setType]=useState("Dienstleistung");
  const [sku,setSku]=useState("");
  const [unit,setUnit]=useState("hour");
  const [price,setPrice]=useState(existing?"120.00":"");
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

  return <AppShell title={existing ? name||"Produkt" : "Produkt erstellen"} subtitle={existing ? type+" · "+status : "Für Angebote und Rechnungen wiederverwendbar."} active="produkte" backHref="/produkte" backLabel="Produkte" actions={<Button onClick={()=>void save()}>Speichern</Button>}>
    <div className="form-page">
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
      <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function EmployeesPage() {
  const employeeRows=useDemoRows("employees",employees);
  return <AppShell title="Mitarbeiter" subtitle="Team, Rollen und Stammdaten verwalten." active="mitarbeiter" actions={<Button href="/mitarbeiter/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Mitarbeiter hinzufügen"><span className="create-action-label">Mitarbeiter hinzufügen</span></Button>}>
    <RecordsView items={employeeRows} placeholder="Mitarbeiter suchen...">{(row)=>{const [name,role,load,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"thomas";const status=statusMaybe??idOrStatus;return <RecordRow href={"/mitarbeiter/"+id} icon="users" title={name} meta={`${role} · ${load}`} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function EmployeeForm({ existing = false, employeeId }: { existing?: boolean; employeeId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [firstName,setFirstName]=useState(existing?"Thomas":"");
  const [lastName,setLastName]=useState(existing?"Müller":"");
  const [email,setEmail]=useState(existing?"thomas@firma.ch":"");
  const [phone,setPhone]=useState("");
  const [role,setRole]=useState(existing?"Inhaber":"");
  const [load,setLoad]=useState(existing?"100":"100");
  const [entryDate,setEntryDate]=useState(existing?"2024-01-01":"");
  const [status,setStatus]=useState("Aktiv");
  const [employeeTab,setEmployeeTab]=useState<"overview"|"time"|"expenses"|"documents">("overview");
  const [toast,setToast]=useState<string|null>(null);

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
        setEntryDate(String(item.entry_date??""));
        setStatus(item.status==="inactive"?"Inaktiv":"Aktiv");
      });
    }).catch(()=>undefined);
  },[production,existing,employeeId]);

  const save=async()=>{
    if(!firstName.trim()||!lastName.trim()||!role.trim()){setToast("Name und Funktion sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    try{
      const payload={firstName:firstName.trim(),lastName:lastName.trim(),email,phone,jobTitle:role.trim(),workloadPercent:Number(load),entryDate,status:status==="Inaktiv"?"inactive":"active"};
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
  return <AppShell title={existing ? displayName : "Mitarbeiter hinzufügen"} subtitle={existing ? role+" · "+load+"%" : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter" actions={(!existing||employeeTab==="overview")?<Button onClick={()=>void save()}>Speichern</Button>:undefined}>
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
        <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></select></Field>
      </div>
      <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
    </div>}
    {existing&&employeeTab==="time"&&<section className="surface employee-tab-panel"><SectionTitle title="Arbeitszeit" action={<Button href="/zeit" variant="secondary">Zeiterfassung öffnen</Button>}/><div className="metrics-grid three"><Metric label="Diese Woche" value="28:15 h" hint="erfasst" icon="clock"/><Metric label="Dieser Monat" value="121:40 h" hint="erfasst" icon="clock"/><Metric label="Pensum" value={load+"%"} hint="hinterlegt" icon="users"/></div><div className="compact-list"><div><b>Website Redesign</b><span>Heute</span><strong>2:14 h</strong></div><div><b>Kundenmeeting</b><span>Gestern</span><strong>1:30 h</strong></div></div></section>}
    {existing&&employeeTab==="expenses"&&<section className="surface employee-tab-panel"><SectionTitle title="Spesen" action={<Button href="/spesen/neu" variant="secondary">Spese erfassen</Button>}/><div className="compact-list"><Link href="/spesen/1"><b>Übernachtung Kundentermin</b><span>02.10.2026 · CHF 280.00</span><Status tone="warning">Eingereicht</Status></Link></div></section>}
    {existing&&employeeTab==="documents"&&<section className="surface employee-tab-panel"><EmptyState icon="file" title="Noch keine Dokumente" text="Mitarbeiterdokumente werden hier übersichtlich angezeigt, sobald welche vorhanden sind."/></section>}
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </AppShell>;
}

export function ExpensesPage() {
  const expenseRows=useDemoRows("expenses",expenses);
  return <AppShell title="Spesen" subtitle="Belege erfassen, prüfen und freigeben." active="spesen" actions={<Button href="/spesen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Spese erfassen"><span className="create-action-label">Spese erfassen</span></Button>}>
    <RecordsView items={expenseRows} placeholder="Spesen suchen..." chips={["Alle","Eingereicht","Genehmigt","Entwurf"]}>{(row)=>{const [title,person,amount,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"1";const status=statusMaybe??idOrStatus;return <RecordRow href={"/spesen/"+id} icon="card" title={title} meta={person} value={amount} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ExpenseForm({ existing = false, expenseId }: { existing?: boolean; expenseId?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [person,setPerson]=useState("Thomas Müller");
  const [date,setDate]=useState("2026-10-02");
  const [category,setCategory]=useState(existing?"Reise":"Reise");
  const [amount,setAmount]=useState(existing?"280.00":"");
  const [currency,setCurrency]=useState("CHF");
  const [vatRate,setVatRate]=useState("8.1");
  const [merchant,setMerchant]=useState(existing?"Hotel Schweizerhof":"");
  const [description,setDescription]=useState(existing?"Übernachtung Kundentermin Zürich":"");
  const [scanState,setScanState]=useState<"idle"|"scanning"|"done"|"error">("idle");
  const [scanConfidence,setScanConfidence]=useState<number|null>(null);
  const [status,setStatus]=useState(existing?"Eingereicht":"Eingereicht");
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);

  useEffect(()=>{
    if(!production||!existing||!expenseId) return;
    apiGet<{item:Record<string,unknown>}>("/api/expenses/"+encodeURIComponent(expenseId)).then(payload=>{
      const item=payload.item;
      const employee=item.employee as {first_name?:string;last_name?:string}|null|undefined;
      queueMicrotask(()=>{
        if(employee) setPerson([employee.first_name,employee.last_name].filter(Boolean).join(" "));
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
      const payload={employeeName:person,merchant:merchant.trim()||description.trim()||category,expenseDate:date,category,amount:value,currency,vatRate:Number(vatRate),description,status:statusMap[status]??"submitted"};
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

  return <AppShell title={existing ? merchant||description||"Spese" : "Spese erfassen"} subtitle={existing ? person+" · "+status : "Beleg fotografieren oder Datei auswählen."} active="spesen" backHref="/spesen" backLabel="Spesen" actions={<Button onClick={()=>void save()}>{existing ? "Speichern" : "Einreichen"}</Button>}>
    <div className="expense-layout">
      <label className={`receipt-upload ${scanState==="scanning"?"is-scanning":""}`} htmlFor="expense-receipt-upload"><span><Icon name="upload" size={25}/></span><b>{scanState==="scanning"?"Beleg wird erkannt…":receiptFile?receiptFile.name:"Beleg fotografieren"}</b><small>{scanState==="done"?`Erkannt${scanConfidence!==null?` · ${Math.round(scanConfidence*100)}% Sicherheit`:""} – Angaben prüfen`:scanState==="error"?"Erkennung nicht möglich – manuell erfassen":"Kamera oder Datei verwenden · Angaben werden automatisch vorausgefüllt"}</small></label><input id="expense-receipt-upload" hidden type="file" capture="environment" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>void scanReceipt(e.target.files?.[0]??null)}/>
      <div className="form-page">
        <div className="form-grid two">
          <Field label="Händler / Firma"><input value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="Wird aus dem Beleg erkannt"/></Field>
          <Field label="Mitarbeiter"><select value={person} onChange={e=>setPerson(e.target.value)}><option>Thomas Müller</option><option>Sarah Meier</option></select></Field>
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
  const [manualDate,setManualDate]=useState("");
  const [manualDuration,setManualDuration]=useState("01:00");
  const [manualCustomer,setManualCustomer]=useState("");
  const [manualProject,setManualProject]=useState("Interne Planung");
  const [manualDescription,setManualDescription]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [remoteEntries,setRemoteEntries]=useState<Array<{id:string;project_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;created_at?:string|null}>>([]);

  useEffect(()=>{
    const sync=()=>{readTimer().then(state=>{setRunning(state.running);setSeconds(state.seconds);setTimerProject(state.project)}).catch(()=>undefined)};
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
    try{const state=await changeTimer("project",project);setTimerProject(state.project);setProjectOpen(false)}
    catch(error){setToast(error instanceof Error?error.message:"Projekt konnte nicht gespeichert werden.")}
  };
  const toggleTimer=async()=>{
    try{const state=await changeTimer(running?"pause":"start",timerProject);setRunning(state.running);setSeconds(state.seconds)}
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
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:{id:string;project_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;created_at?:string|null}}>("/api/time-entries",{customerName:manualCustomer,projectName:manualProject,description:manualDescription,startedAt:manualDate+"T12:00:00",durationMinutes});
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
  const productionEntries=remoteEntries.length?<div className="compact-list">{remoteEntries.map(item=><div key={item.id}><b>{item.project_name||"Zeiteintrag"}</b><span>{item.description||"Erfasste Arbeitszeit"}</span><strong>{formatMinutes(Number(item.duration_minutes??0))}</strong></div>)}</div>:<EmptyState icon="clock" title="Noch keine Zeiteinträge" text="Starte den Timer oder erfasse die erste Zeit manuell."/>;

  return <AppShell title="Zeiterfassung" subtitle="Arbeitszeit einfach und präzise erfassen." active="zeit" backHref={returnTo} backLabel="Übersicht">
    <div className="time-layout">
      <section className="surface timer-card">
        <div className="tabs" role="tablist" aria-label="Zeiterfassung"><button role="tab" aria-selected={timeTab==="timer"} className={timeTab==="timer"?"active":""} onClick={()=>setTimeTab("timer")}>Timer</button><button role="tab" aria-selected={timeTab==="entries"} className={timeTab==="entries"?"active":""} onClick={()=>setTimeTab("entries")}>Einträge</button></div>
        {timeTab==="timer"?<>
          <div className="timer-project"><small>Projekt</small><button type="button" onClick={()=>setProjectOpen(true)}>{timerProject} <Icon name="down" size={16}/></button></div>
          <div className={`timer-ring ${running?"is-running":"is-paused"}`}><div><small>{running?"Läuft":seconds>0?"Pausiert":"Bereit"}</small><strong>{formatted}</strong><span>{timerProject}</span></div></div>
          <div className="timer-actions"><Button onClick={toggleTimer} icon={running?"pause":"clock"}>{running?"Pause":seconds>0?"Fortsetzen":"Starten"}</Button><Button variant="secondary" icon="stop" onClick={()=>void stop()} disabled={!running&&seconds===0}>Stoppen</Button></div>
        </>:<>
          <SectionTitle title={!forceDemo?"Einträge":"Heutige Einträge"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":"4:28 h"}</strong>}/>
          {!forceDemo?productionEntries:demoEntries}
          <Button variant="secondary" icon="plus" className="full-button" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>
        </>}
      </section>
      <section className="surface">
        <SectionTitle title={!forceDemo?"Übersicht":timeTab==="timer"?"Heute":"Diese Woche"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":timeTab==="timer"?"4:28 h":"28:15 h"}</strong>}/>
        {!forceDemo?productionEntries:timeTab==="timer"?demoEntries:<div className="time-summary-row"><div><small>Montag</small><b>7:42 h</b></div><div><small>Dienstag</small><b>8:05 h</b></div><div><small>Heute</small><b>4:28 h</b></div></div>}
        {timeTab==="timer"&&<Button variant="secondary" icon="plus" className="full-button" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>}
      </section>
    </div>
    {projectOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setProjectOpen(false)}}><section className="bottom-sheet project-sheet" role="dialog" aria-modal="true" aria-label="Projekt auswählen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Projekt auswählen</h2><p>Die Zeit wird direkt dem gewählten Projekt zugeordnet.</p></div><button className="icon-button" type="button" onClick={()=>setProjectOpen(false)}><Icon name="close"/></button></header><div className="choice-list">{(production?["Interne Planung"]:["Website Redesign · Acme AG","Support · Müller GmbH","Interne Planung"]).map(project=><button type="button" key={project} className={timerProject===project?"active":""} onClick={()=>setProject(project)}><span><b>{project.split(" · ")[0]}</b><small>{project.split(" · ")[1]??"Intern"}</small></span>{timerProject===project?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div></section></div>}
    {manualOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setManualOpen(false)}}><section className="bottom-sheet manual-time-sheet" role="dialog" aria-modal="true" aria-label="Zeit manuell erfassen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Zeit erfassen</h2><p>Eintrag direkt dem Kunden oder Projekt zuordnen.</p></div><button className="icon-button" type="button" onClick={()=>setManualOpen(false)}><Icon name="close"/></button></header><div className="form-grid two"><Field label="Datum"><input type="date" value={manualDate} onChange={e=>setManualDate(e.target.value)}/></Field><Field label="Dauer"><input type="time" value={manualDuration} onChange={e=>setManualDuration(e.target.value)}/></Field>{production?<Field label="Kunde"><input value={manualCustomer} onChange={e=>setManualCustomer(e.target.value)} placeholder="Optional"/></Field>:<Field label="Kunde"><select value={manualCustomer||"Acme AG"} onChange={e=>setManualCustomer(e.target.value)}><option>Acme AG</option><option>Müller GmbH</option></select></Field>}{production?<Field label="Projekt"><input value={manualProject} onChange={e=>setManualProject(e.target.value)} placeholder="Projekt"/></Field>:<Field label="Projekt"><select value={manualProject==="Interne Planung"?"Website Redesign":manualProject} onChange={e=>setManualProject(e.target.value)}><option>Website Redesign</option><option>Support</option></select></Field>}<Field className="full" label="Beschreibung"><input value={manualDescription} onChange={e=>setManualDescription(e.target.value)} placeholder="Was wurde gemacht?"/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setManualOpen(false)}>Abbrechen</Button><Button onClick={()=>void saveManual()}>Speichern</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("gültige")||toast.includes("keine")?"danger":"success"}/>}
  </AppShell>;
}

function useSupportRows(){
  const [rows,setRows]=useState<string[][]>([]);
  useEffect(()=>{
    apiGet<{items:Array<{id:string;subject:string;status:string;updated_at:string}>}>(isProductionBackendEnabled()?"/api/support/tickets":"/api/demo/data?collection=support_tickets")
      .then(payload=>{
        const statusMap:Record<string,string>={new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
        queueMicrotask(()=>setRows(payload.items.map(item=>[item.id,item.subject,new Date(item.updated_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"}),statusMap[item.status]??item.status])));
      })
      .catch(()=>undefined);
  },[]);
  return rows;
}

export function SupportPage() {
  const ticketRows=useSupportRows();
  return <AppShell title="Support" subtitle="Hilfe direkt in Binso One – persönlich und nachvollziehbar." active="support" actions={<Button href="/support/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neues Ticket"><span className="create-action-label">Neues Ticket</span></Button>}>
    <div className="support-summary"><Metric label="Offen" value="2" hint="aktuelle Tickets" icon="support"/><Metric label="Gelöst" value="14" hint="letzte 90 Tage" icon="check"/></div>
    <div className="tablet-master-detail support-master-detail">
      <RecordsView items={ticketRows} placeholder="Tickets suchen..." chips={["Alle","Offen","In Bearbeitung","Gelöst"]}>{([id,subject,updated,status])=><RecordRow href={`/support/${id}`} icon="support" title={`#${id} · ${subject}`} meta={updated} status={status}/>}</RecordsView>
      <aside className="tablet-detail support-tablet-preview surface">
        <div className="tablet-detail-head"><span className="activity-icon"><Icon name="support"/></span><div><h2>Ticket #5832</h2><p>Frage zur Rechnung</p></div><Status tone="warning">Offen</Status></div>
        <div className="support-preview-message"><small>Thomas · 10:24</small><p>Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?</p></div>
        <div className="support-preview-message support"><small>Binso Support · 10:37</small><p>Gerne. Um welche Rechnung geht es genau?</p></div>
        <Button href="/support/5832" variant="secondary">Konversation öffnen</Button>
      </aside>
    </div>
  </AppShell>;
}

export function SupportTicketForm() {
  const router=useRouter();
  const [subject,setSubject]=useState("");
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
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:{id:string}}>("/api/support/tickets",{subject,category,priority:"normal",message});
        if(attachment){
          const form=new FormData();
          form.append("file",attachment);
          form.append("purpose","support_attachment");
          form.append("entityId",payload.item.id);
          await apiUpload("/api/files",form);
        }
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
  return <AppShell title="Neue Support-Anfrage" subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref="/support" backLabel="Support" actions={<Button onClick={save}>Ticket erstellen</Button>}>
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
    apiGet<{items:Array<{id:string;author_type:string;body:string;created_at:string}>}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages")
      .then(payload=>queueMicrotask(()=>setRemote(payload.items)))
      .catch(()=>undefined);
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
  return <AppShell title={"Ticket #"+ticketId} subtitle="Support-Konversation" active="support" backHref="/support" backLabel="Support" actions={<Status tone="warning">Offen</Status>}>
    <div className="support-thread">
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
    </div>
    {toast&&<Toast title={toast} tone="danger"/>}
  </AppShell>;
}

export function SettingsPage() {
  const rows = [
    ["/einstellungen/konto","user","Persönliche Daten","Name, E-Mail und Sprache"],
    ["/einstellungen/firma","users","Firma","Unternehmensdaten und Rechnungseinstellungen"],
    ["/einstellungen/team","users","Team","Benutzer, Rollen und Einladungen"],
    ["/einstellungen/abonnement","card","Abonnement","Business · CHF 49 / Monat"],
    ["/einstellungen/benachrichtigungen","bell","Benachrichtigungen","E-Mail und Push"],
    ["/einstellungen/sprache","settings","Sprache","Deutsch (Schweiz), FR, IT, EN, TR"],
    ["/einstellungen/sicherheit","lock","Sicherheit","Passwort, Sitzungen und Geräte"],
    ["/einstellungen/darstellung","moon","Darstellung","Hell oder Dunkel"],
    ["/support","support","Hilfe und Support","Tickets und Kontakt"],
  ];
  return <AppShell title="Einstellungen" subtitle="Firma, Konto, Sicherheit und Abonnement." active="einstellungen">
    <div className="settings-list">
      {rows.map(([href,icon,title,text])=><Link href={href} key={title}><span className="settings-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>)}
    </div>
  </AppShell>;
}

export function AccountSettingsPage() {
  const [firstName,setFirstName]=useState("Thomas");
  const [lastName,setLastName]=useState("Müller");
  const [email,setEmail]=useState("thomas@musterwerk.ch");
  const [phone,setPhone]=useState("+41 79 123 45 67");
  const [jobTitle,setJobTitle]=useState("Geschäftsführer");
  const [language,setLanguage]=useState("de-CH");
  const [toast,setToast]=useState<string|null>(null);
  const [editing,setEditing]=useState(false);

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
          setJobTitle(String(item.job_title??""));
          setLanguage(String(item.language??"de-CH"));
        });
      }).catch(()=>undefined);
  },[]);

  const save=async(message="Persönliche Daten gespeichert.")=>{
    try{
      if(isProductionBackendEnabled()) await apiPatch("/api/settings/profile",{firstName,lastName,phone,jobTitle,language});
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
        <div className="profile-avatar">{initials}</div><div><h2>{displayName}</h2><p>{jobTitle||"Benutzer"}</p></div>{editing&&<Button variant="secondary" onClick={()=>void save("Profilbild wird mit Storage angebunden.")}>Bild ändern</Button>}
      </section>
      {editing?<section className="settings-form">
        <div className="form-grid two">
          <Field label="Vorname"><input value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
          <Field label="Nachname"><input value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
          <Field label="E-Mail"><input type="email" value={email} readOnly/></Field>
          <Field label="Telefon"><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
          <Field label="Funktion"><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)}/></Field>
          <Field label="Sprache"><select value={language} onChange={e=>setLanguage(e.target.value)}><option value="de-CH">Deutsch (Schweiz)</option><option value="fr">Français</option><option value="it">Italiano</option><option value="en">English</option><option value="tr">Türkçe</option></select></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>void save()}>Speichern</Button></div>
      </section>:<section className="settings-readonly"><dl className="detail-list"><div><dt>Name</dt><dd>{displayName}</dd></div><div><dt>E-Mail</dt><dd>{email||"—"}</dd></div><div><dt>Telefon</dt><dd>{phone||"—"}</dd></div><div><dt>Funktion</dt><dd>{jobTitle||"—"}</dd></div><div><dt>Sprache</dt><dd>{{"de-CH":"Deutsch (Schweiz)",fr:"Français",it:"Italiano",en:"English",tr:"Türkçe"}[language]??language}</dd></div></dl></section>}
    </div>
    {toast&&<Toast title={toast} tone={toast.includes("konnten")?"danger":"success"}/>}
  </AppShell>;
}

export function CompanySettingsPage() {
  const [name,setName]=useState("Musterwerk AG");
  const [uid,setUid]=useState("CHE-123.456.789");
  const [street,setStreet]=useState("Bahnhofstrasse 12");
  const [postalCode,setPostalCode]=useState("3000");
  const [city,setCity]=useState("Bern");
  const [email,setEmail]=useState("info@musterwerk.ch");
  const [phone,setPhone]=useState("+41 31 123 45 67");
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
      await apiUpload("/api/files",form);
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
      if(isProductionBackendEnabled()) await apiPatch("/api/settings/company",{name,uid,street,postalCode,city,email,phone});
      setToast(message);
      setEditing(false);
    }catch(error){
      setToast(error instanceof Error?error.message:"Firmendaten konnten nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  return <AppShell title="Firma" subtitle="Unternehmensdaten für Belege und Kommunikation." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={editing?<Button onClick={()=>void save()}>Speichern</Button>:<Button variant="secondary" icon="edit" onClick={()=>setEditing(true)}>Bearbeiten</Button>}>
    <div className="settings-detail-grid">
      <section className="surface company-logo-card"><img src="/brand/logo-black.svg" alt="Firmenlogo"/><div><b>{name||"Firma"}</b><small>Firmenlogo für Angebote, Rechnungen und Dokumente</small></div>{editing&&<><label className="button button-secondary" htmlFor="company-logo-upload">Logo ändern</label><input id="company-logo-upload" hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>void uploadLogo(e.target.files?.[0])}/></>}</section>
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
  const [dialog,setDialog]=useState<"plan"|"payment"|"cancel"|null>(null);
  const [plan,setPlan]=useState("Business");
  const [selectedPlan,setSelectedPlan]=useState<"start"|"business"|"pro">("business");
  const [subscription,setSubscription]=useState<Record<string,unknown>|null>(null);
  const [integrations,setIntegrations]=useState<Array<Record<string,unknown>>>([]);
  const [billingLoading,setBillingLoading]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [billingInvoice,setBillingInvoice]=useState<{date:string;amount:string}|null>(null);
  const prices:Record<string,string>={Start:"19",Business:"49",Pro:"89",start:"19",business:"49",pro:"89"};
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    if(!production) return;
    Promise.all([
      apiGet<{item:Record<string,unknown>}>("/api/settings/subscription"),
      apiGet<{items:Array<Record<string,unknown>>}>("/api/integrations/status"),
    ]).then(([subscriptionPayload,integrationPayload])=>queueMicrotask(()=>{
      setSubscription(subscriptionPayload.item);
      setIntegrations(integrationPayload.items);
    })).catch(()=>undefined);

    const result=new URLSearchParams(window.location.search).get("checkout");
    if(result==="success"){
      queueMicrotask(()=>setToast("Stripe Checkout abgeschlossen. Der Abostatus wird über den signierten Webhook aktualisiert."));
      window.setTimeout(()=>setToast(null),4200);
    }else if(result==="cancelled"){
      queueMicrotask(()=>setToast("Planwechsel abgebrochen."));
      window.setTimeout(()=>setToast(null),2200);
    }
  },[production]);

  const startCheckout=async()=>{
    setBillingLoading(true);
    try{
      const payload=await apiPost<{url:string}>("/api/billing/checkout",{plan:selectedPlan});
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

  if(!subscription) return <AppShell title="Abonnement" subtitle="Daten werden geladen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen"><EmptyState icon="card" title="Abonnement wird geladen" text="Die Kontodaten werden abgerufen."/></AppShell>;

  const planKey=String(subscription.plan??"trial");
  const planLabel:Record<string,string>={trial:"Testphase",start:"Start",business:"Business",pro:"Pro"};
  const planPrice:Record<string,string>={trial:"0",start:"19",business:"49",pro:"89"};
  const statusLabel:Record<string,string>={trial:"Testphase",active:"Aktiv",past_due:"Überfällig",suspended:"Pausiert",cancelled:"Gekündigt"};
  const accountLabel:Record<string,string>={active:"Aktiv",restricted:"Eingeschränkt",suspended:"Gesperrt",cancelled:"Gekündigt"};
  const subscriptionStatus=String(subscription.subscription_status??"trial");
  const accountStatus=String(subscription.account_status??"active");
  const billingConnected=Boolean(subscription.billing_customer_ref&&subscription.billing_subscription_ref);
  const billingIntegration=integrations.find(item=>item.key==="billing");
  const billingConfigured=billingIntegration?.configured===true;
  const storageLimit=Number(subscription.storage_limit_bytes??0);
  const storageLabel=storageLimit>0?(storageLimit/1024/1024/1024).toLocaleString("de-CH",{maximumFractionDigits:1})+" GB":"—";
  const periodEnd=subscription.current_period_ends_at?new Date(String(subscription.current_period_ends_at)).toLocaleDateString("de-CH"):"—";
  const trialEnd=subscription.trial_ends_at?new Date(String(subscription.trial_ends_at)).toLocaleDateString("de-CH"):"—";

  return <AppShell title="Abonnement" subtitle="Plan, Nutzung und Kontostatus." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="plan-hero">
      <div><span className="eyebrow">AKTUELLER PLAN</span><h2>{planLabel[planKey]??planKey}</h2><p>{subscriptionStatus==="trial"?"Die Testphase ist aktiv.":"Der hinterlegte Plan für dein Binso One Konto."}</p></div>
      <div className="plan-price"><strong>{"CHF "+(planPrice[planKey]??"—")}</strong><span>/ Monat</span></div>
      {billingConfigured?(billingConnected?<Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing verwalten</Button>:<Button onClick={()=>setDialog("plan")}>Plan aktivieren</Button>):<Status tone="warning">Stripe nicht konfiguriert</Status>}
    </section>
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzerlimit</span><b>{String(subscription.user_limit??"—")}</b></div><div className="usage-row"><span>Dateispeicher</span><b>{storageLabel}</b></div><div className="usage-row"><span>Kontostatus</span><b>{accountLabel[accountStatus]??accountStatus}</b></div><div className="usage-row"><span>{subscriptionStatus==="trial"?"Testphase bis":"Aktuelle Periode bis"}</span><b>{subscriptionStatus==="trial"?trialEnd:periodEnd}</b></div></section>
      <section className="surface"><SectionTitle title="Zahlungsabwicklung"/>{billingConnected?<div className="context-block"><Status tone="success">Verbunden</Status><b>Stripe Billing verbunden</b><span>Zahlungsmittel und SaaS-Rechnungen bleiben bei Stripe und werden über das sichere Kundenportal verwaltet.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal öffnen</Button></div>:billingConfigured?<div className="context-block"><Status tone="info">Bereit</Status><b>Stripe ist konfiguriert</b><span>Wähle einen Plan, um das produktive Abonnement über Stripe Checkout zu starten.</span><Button onClick={()=>setDialog("plan")}>Plan auswählen</Button></div>:<div className="context-block"><Status tone="warning">Noch nicht verbunden</Status><b>Keine produktive Zahlungsabwicklung</b><span>Stripe-Schlüssel, Webhook und Preis-IDs müssen in der Produktionsumgebung konfiguriert werden.</span></div>}</section>
    </div>
    <section className="surface invoices-panel"><SectionTitle title="SaaS-Abrechnungen"/>{billingConnected?<div className="context-block"><b>Rechnungen und Zahlungsmittel in Stripe</b><span>Binso One speichert keine vollständigen Kartendaten. Öffne das Billing-Portal für Rechnungsdownloads und Zahlungsmittel.</span><Button variant="secondary" onClick={()=>void openPortal()} disabled={billingLoading}>Billing-Portal</Button></div>:<EmptyState icon="card" title="Noch keine Billing-Daten" text="Es werden keine erfundenen Zahlungsmittel oder SaaS-Rechnungen angezeigt."/>}</section>
    <div className="danger-zone"><div><b>Abonnement verwalten</b><p>{billingConnected?"Planwechsel, Zahlungsmittel und Kündigung werden über Stripe Billing ausgeführt.":"Ohne verbundenes Billing gibt es hier keine produktive Kündigungsaktion."}</p></div><Button variant="secondary" disabled={!billingConnected||billingLoading} onClick={()=>void openPortal()}>Abonnement verwalten</Button></div>

    {dialog==="plan"&&billingConfigured&&!billingConnected&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet subscription-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Plan auswählen</h2><p>Checkout und Zahlungsdaten werden sicher bei Stripe verarbeitet.</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="plan-choice-list">{(["start","business","pro"] as const).map(name=><button type="button" className={selectedPlan===name?"selected":""} onClick={()=>setSelectedPlan(name)} key={name}><div><b>{planLabel[name]}</b><small>{"CHF "+prices[name]+" / Monat"}</small></div>{selectedPlan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>void startCheckout()} disabled={billingLoading}>{billingLoading?"Checkout wird geöffnet…":"Weiter zu Stripe"}</Button></div></section></div>}
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
  const toggle = (title:string, channel:"email"|"push") => setPrefs(current=>({...current,[title]:{...current[title],[channel]:!current[title][channel]}}));
  return <AppShell title="Benachrichtigungen" subtitle="Bestimme, wie Binso One dich informiert." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="preference-table"><div className="preference-head"><span>Benachrichtigung</span><span>E-Mail</span><span>Push</span></div>{rows.map(([title,text])=><div className="preference-row" key={title}><div><b>{title}</b><small>{text}</small></div><Toggle checked={prefs[title].email} onChange={()=>toggle(title,"email")} label={`E-Mail ${title}`}/><Toggle checked={prefs[title].push} onChange={()=>toggle(title,"push")} label={`Push ${title}`}/></div>)}</section>
  </AppShell>;
}

export function LanguageSettingsPage() {
  const [language,setLanguage] = useState("de");
  const languages=[["Deutsch (Schweiz)","de"],["Français","fr"],["Italiano","it"],["English","en"],["Türkçe","tr"]];
  return <AppShell title="Sprache" subtitle="Sprache für Oberfläche und Kommunikation wählen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <div className="choice-list">{languages.map(([label,code])=><button className={language===code?"selected":""} onClick={()=>setLanguage(code)} type="button" key={code}><span>{code.toUpperCase()}</span><div><b>{label}</b><small>{language===code?"Aktiv":"Auswählen"}</small></div>{language===code?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>
    <p className="settings-note">Die vollständigen Übersetzungen werden mit der produktiven Sprachschicht geladen. Diese Auswahl ist bereits für DE, FR, IT, EN und TR vorbereitet.</p>
  </AppShell>;
}

export function SecuritySettingsPage() {
  const production=useBackendMode();
  const [dialog,setDialog]=useState<"password"|"2fa"|null>(null);
  const [twoFactor,setTwoFactor]=useState(false);
  const [sessionVisible,setSessionVisible]=useState(true);
  const [newPassword,setNewPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};

  const changePassword=async()=>{
    if(newPassword.length<8){setToast("Das Passwort muss mindestens 8 Zeichen haben.");window.setTimeout(()=>setToast(null),2400);return;}
    if(newPassword!==confirmPassword){setToast("Die Passwörter stimmen nicht überein.");window.setTimeout(()=>setToast(null),2400);return;}
    try{
      if(production) await apiPatch("/api/auth/password",{password:newPassword});
      setNewPassword("");setConfirmPassword("");
      confirm("Passwort geändert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Passwort konnte nicht geändert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  if(!production) return <AppShell title="Sicherheit" subtitle="Passwort, Sitzungen und Kontoschutz." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface security-card"><SectionTitle title="Passwort"/><p>Zuletzt geändert vor 63 Tagen.</p><Button variant="secondary" onClick={()=>setDialog("password")}>Passwort ändern</Button></section>
    <section className="surface security-card"><div className="security-setting-row"><div><b>Zwei-Faktor-Authentifizierung</b><p>Zusätzlicher Schutz für dein Konto.</p></div><button type="button" role="switch" aria-checked={twoFactor} className={`settings-switch ${twoFactor?"is-on":""}`} onClick={()=>twoFactor?setTwoFactor(false):setDialog("2fa")}><span/></button></div></section>
    <section className="surface security-card"><SectionTitle title="Aktive Sitzungen"/><div className="session-list"><div><span className="activity-icon"><Icon name="user"/></span><div><b>Chrome · Windows 11</b><small>Dieses Gerät · Demo</small></div><Status tone="success">Aktiv</Status></div>{sessionVisible&&<div><span className="activity-icon"><Icon name="user"/></span><div><b>Safari · iPhone</b><small>Demo-Sitzung</small></div><button className="text-action" onClick={()=>{setSessionVisible(false);setToast("Demo-Sitzung abgemeldet.");window.setTimeout(()=>setToast(null),2200)}}>Abmelden</button></div>}</div></section>
    {dialog&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet security-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>{dialog==="password"?"Passwort ändern":"Zwei-Faktor-Authentifizierung"}</h2><p>Demo-Einstellung ohne produktive Sicherheitswirkung.</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header>{dialog==="password"?<div className="form-grid"><Field label="Neues Passwort"><input type="password"/></Field><Field label="Neues Passwort bestätigen"><input type="password"/></Field></div>:<div className="two-factor-setup"><div className="two-factor-code">BINSO<br/>2FA</div><div><b>Demo</b><p>Die echte MFA-Aktivierung wird erst mit dem produktiven Auth-Enrollment aktiviert.</p></div></div>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>{if(dialog==="2fa")setTwoFactor(true);confirm("Demo-Einstellung gespeichert.")}}>Bestätigen</Button></div></section></div>}
    {toast&&<Toast title={toast}/>}
  </AppShell>;

  return <AppShell title="Sicherheit" subtitle="Passwort und Kontoschutz." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface security-card"><SectionTitle title="Passwort"/><p>Ändere dein Passwort direkt über die sichere Authentifizierung.</p><Button variant="secondary" onClick={()=>setDialog("password")}>Passwort ändern</Button></section>
    <section className="surface security-card"><div className="security-setting-row"><div><b>Zwei-Faktor-Authentifizierung</b><p>MFA wird verfügbar, sobald das Authenticator-Enrollment vollständig implementiert und geprüft ist.</p></div><button type="button" role="switch" aria-checked="false" aria-label="Zwei-Faktor-Authentifizierung noch nicht verfügbar" className="settings-switch" disabled><span/></button></div></section>
    <section className="surface security-card"><SectionTitle title="Sitzungen"/><div className="context-block"><Status tone="success">Aktuelle Sitzung aktiv</Status><b>Angemeldetes Gerät</b><span>Eine verlässliche geräteübergreifende Sitzungsübersicht wird erst angezeigt, wenn die Auth-Session-Verwaltung angebunden ist. Es werden keine erfundenen Geräte oder Standorte angezeigt.</span></div></section>
    {dialog==="password"&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet security-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Passwort ändern</h2><p>Verwende mindestens acht Zeichen und ein einzigartiges Passwort.</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="form-grid"><Field label="Neues Passwort"><input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type="password" autoComplete="new-password"/></Field><Field label="Neues Passwort bestätigen"><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password" autoComplete="new-password"/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>void changePassword()}>Passwort speichern</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("nicht")||toast.includes("mindestens")?"danger":"success"}/>}
  </AppShell>;
}

export function AppearanceSettingsPage() {
  const [theme,setTheme] = useState<"light"|"dark"|"system">("light");

  useEffect(()=>{
    const storedMode=window.localStorage.getItem("binso.theme.mode");
    const storedResolved=window.localStorage.getItem("binso.theme");
    const next=storedMode==="system"||storedMode==="dark"||storedMode==="light"
      ? storedMode
      : storedResolved==="dark" ? "dark" : "light";
    queueMicrotask(()=>setTheme(next));
  },[]);

  const choose=(next:"light"|"dark"|"system")=>{
    setTheme(next);
    const resolved=next==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):next;
    document.documentElement.dataset.theme=resolved;
    window.localStorage.setItem("binso.theme.mode",next);
    window.localStorage.setItem("binso.theme",resolved);
  };
  return <AppShell title="Darstellung" subtitle="Binso One passt sich deiner Arbeitsweise an." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <div className="appearance-grid">
      <button className={`appearance-card ${theme==="light"?"selected":""}`} onClick={()=>choose("light")}><div className="theme-preview light"><i/><i/><i/></div><b>Hell</b><small>Klar und kontrastreich</small></button>
      <button className={`appearance-card ${theme==="dark"?"selected":""}`} onClick={()=>choose("dark")}><div className="theme-preview dark"><i/><i/><i/></div><b>Dunkel</b><small>Reines Schwarz und Weiss</small></button>
      <button className={`appearance-card ${theme==="system"?"selected":""}`} onClick={()=>choose("system")}><div className="theme-preview system"><i/><i/><i/></div><b>System</b><small>Geräteeinstellung übernehmen</small></button>
    </div>
  </AppShell>;
}

export function DocumentsHubPage() {
  return <AppShell title="Belege" subtitle="Angebote, Rechnungen und Zahlungen auf einen Blick." active="belege" actions={<Button href="/rechnungen/neu" icon="plus" className="page-add-button responsive-create-action" ariaLabel="Neue Rechnung"><span className="create-action-label">Neue Rechnung</span></Button>}>
    <div className="documents-summary" aria-label="Belegübersicht"><div><Icon name="file" size={16}/><span>Offene Angebote</span><b>2</b><small>CHF 10’464.32</small></div><div><Icon name="receipt" size={16}/><span>Offene Rechnungen</span><b>8</b><small>CHF 12’800</small></div><div><Icon name="wallet" size={16}/><span>Zahlungen im Monat</span><b>CHF 49’820</b><small>184 Eingänge</small></div></div>
    <div className="documents-hub-grid">
      <section className="surface">
        <SectionTitle title="Angebote" action={<Link href="/angebote">Alle anzeigen</Link>}/>
        <div className="compact-list">
          <Link href="/angebote/AN-2026-012"><b>AN-2026-012 · Acme AG</b><span>CHF 7’264.32</span><Status tone="warning">Gesendet</Status></Link>
          <Link href="/angebote/AN-2026-011"><b>AN-2026-011 · Müller GmbH</b><span>CHF 3’200.00</span><Status tone="neutral">Entwurf</Status></Link>
        </div>
        <Button href="/angebote/neu" variant="secondary" icon="plus" className="full-button">Angebot erstellen</Button>
      </section>
      <section className="surface">
        <SectionTitle title="Rechnungen" action={<Link href="/rechnungen">Alle anzeigen</Link>}/>
        <div className="compact-list">
          <Link href="/rechnungen/RE-2026-019"><b>RE-2026-019 · Acme AG</b><span>CHF 4’346.40</span><Status tone="success">Bezahlt</Status></Link>
          <Link href="/rechnungen/RE-2026-018"><b>RE-2026-018 · Müller GmbH</b><span>CHF 1’200.00</span><Status tone="warning">Offen</Status></Link>
          <Link href="/rechnungen/RE-2026-017"><b>RE-2026-017 · Berger Bau AG</b><span>CHF 3’700.00</span><Status tone="danger">Überfällig</Status></Link>
        </div>
        <Button href="/rechnungen/neu" variant="secondary" icon="plus" className="full-button">Rechnung erstellen</Button>
      </section>
      <section className="surface">
        <SectionTitle title="Zahlungen" action={<Link href="/zahlungen">Alle anzeigen</Link>}/>
        <div className="compact-list">
          <Link href="/zahlungen/1"><b>02.10.2026 · Acme AG</b><span>CHF 4’346.40</span><Status tone="success">Verbucht</Status></Link>
          <Link href="/zahlungen/2"><b>30.09.2026 · Müller GmbH</b><span>CHF 1’200.00</span><Status tone="success">Verbucht</Status></Link>
        </div>
        <Button href="/zahlungen/neu" variant="secondary" icon="plus" className="full-button">Zahlung erfassen</Button>
      </section>
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