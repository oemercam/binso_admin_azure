"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, EmptyState, Icon, Logo, Metric, SectionTitle, Status, Toast } from "./ui";
import { apiGet, apiPatch, apiPost, useBackendMode } from "@/lib/client/backend";

const operatorNav = [
  ["","Dashboard","home"],
  ["tickets","Tickets","support"],
  ["kunden","Kunden","users"],
  ["zahlungen","Zahlungen","wallet"],
  ["abonnemente","Abonnemente","card"],
  ["sperrungen","Sperrungen","lock"],
  ["monitoring","Monitoring","chart"],
  ["ankuendigungen","Ankündigungen","bell"],
  ["sicherheit","Sicherheit","settings"],
  ["audit","Audit","file"],
] as const;

const tickets = [
  ["#8421","Rechnungsstellung unklar","Acme AG","Offen"],
  ["#8419","Zahlung fehlgeschlagen","Müller GmbH","In Bearbeitung"],
  ["#8416","Zugangsproblem","Berger Bau AG","Offen"],
  ["#8415","Funktionserweiterung","Huber & Söhne","Wartet auf Kunde"],
];

type OperatorTicket = {
  id:string;
  subject:string;
  priority:string;
  status:string;
  updated_at:string;
  tenant?:{name?:string}|null;
};

type OperatorTenant = {
  id:string;
  name:string;
  uid?:string|null;
  city?:string|null;
  created_at:string;
  account?:{plan?:string;subscription_status?:string;account_status?:string;user_limit?:number}|null;
};

function operatorStatus(value:string){
  const map:Record<string,string>={
    new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Wartet auf Kunde",
    resolved:"Gelöst",closed:"Geschlossen",active:"Aktiv",past_due:"Überfällig",suspended:"Gesperrt",
    restricted:"Eingeschränkt",cancelled:"Gekündigt",trial:"Testphase"
  };
  return map[value]??value;
}

function operatorPlan(value:string|undefined){
  const map:Record<string,string>={trial:"Testphase",start:"Start",business:"Business",pro:"Pro"};
  return map[value??""]??"—";
}

function useOperatorTickets(){
  const production=useBackendMode();
  const [items,setItems]=useState<OperatorTicket[]>([]);
  useEffect(()=>{
    if(!production) return;
    apiGet<{items:OperatorTicket[]}>("/api/operator/tickets")
      .then(payload=>queueMicrotask(()=>setItems(payload.items)))
      .catch(()=>undefined);
  },[production]);
  return {production,items};
}

function useOperatorCustomers(){
  const production=useBackendMode();
  const [items,setItems]=useState<OperatorTenant[]>([]);
  useEffect(()=>{
    if(!production) return;
    apiGet<{items:OperatorTenant[]}>("/api/operator/customers")
      .then(payload=>queueMicrotask(()=>setItems(payload.items)))
      .catch(()=>undefined);
  },[production]);
  return {production,items};
}


export function OperatorPage({ section = "" }: { section?: string }) {
  const key = section.split("/")[0] || "";
  const detail = section.split("/")[1] || "";
  const title = useMemo(() => operatorNav.find(([slug]) => slug === key)?.[1] ?? "Dashboard", [key]);

  return <div className="operator-root">
    <aside className="operator-sidebar">
      <Link href="/operator"><Logo dark/></Link>
      <nav>{operatorNav.map(([slug,label,icon])=><Link className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon}/><span>{label}</span>{label==="Tickets"&&<em>12</em>}</Link>)}</nav>
    </aside>

    <main className="operator-main">
      <header>
        <div><h1>{detail ? (key === "tickets" ? `Ticket #${detail}` : key === "kunden" ? "Acme AG" : title) : title}</h1><p>{operatorSubtitle(key, detail)}</p></div>
        <div className="operator-user"><button aria-label="Suche"><Icon name="search"/></button><button aria-label="Benachrichtigungen"><Icon name="bell"/></button><span className="avatar">OC</span></div>
      </header>
      <nav className="operator-mobile-nav" aria-label="Operator Navigation">{operatorNav.map(([slug,label,icon])=><Link className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon} size={17}/><span>{label}</span></Link>)}</nav>

      {detail && key === "tickets" ? <TicketDetail ticketId={detail}/> :
        detail && key === "kunden" ? <OperatorCustomerDetail tenantId={detail}/> :
        key === "tickets" ? <TicketsView/> :
        key === "kunden" ? <CustomersView/> :
        key === "zahlungen" ? <PaymentsView/> :
        key === "abonnemente" ? <SubscriptionsView/> :
        key === "sperrungen" ? <RestrictionsView/> :
        key === "monitoring" ? <MonitoringView/> :
        key === "ankuendigungen" ? <AnnouncementsView/> :
        key === "sicherheit" ? <SecurityView/> :
        key === "audit" ? <AuditView/> :
        <OperatorDashboard/>}
    </main>
  </div>;
}

function operatorSubtitle(key: string, detail: string) {
  if (detail && key === "tickets") return "Kundenanfrage prüfen und beantworten.";
  if (detail && key === "kunden") return "Kundenkonto, Abonnement, Zahlungen, Tickets und Einschränkungen.";
  const subtitles: Record<string, string> = {
    "": "Betrieb und Kundenumgebung von Binso One.",
    tickets: "Kundenanfragen verwalten und beantworten.",
    kunden: "Kundenkonten, Status und Supportkontext.",
    zahlungen: "Zahlungen und fehlgeschlagene Transaktionen.",
    abonnemente: "Pläne, Nutzung und Abrechnungsstatus.",
    sperrungen: "Einschränkungen kontrolliert verwalten.",
    monitoring: "Status der Plattform und abhängiger Services.",
    ankuendigungen: "Hinweise für Kunden veröffentlichen.",
    sicherheit: "Interne Benutzer, Rollen und Sicherheitsstatus.",
    audit: "Kritische Operator-Aktionen nachvollziehen.",
  };
  return subtitles[key] ?? "Binso One Operator";
}

function OperatorDashboard() {
  const production=useBackendMode();
  const [data,setData]=useState<{
    stats?:Record<string,unknown>;
    tickets?:OperatorTicket[];
    incidents?:Array<{id:string;service:string;title:string;status:string;started_at:string}>;
  }>({});

  useEffect(()=>{
    if(!production) return;
    apiGet<typeof data>("/api/operator/dashboard").then(payload=>queueMicrotask(()=>setData(payload))).catch(()=>undefined);
  },[production]);

  if(!production) return <>
    <div className="metrics-grid">
      <Metric label="Aktive Kunden" value="2’841" hint="+12%" icon="users"/>
      <Metric label="Offene Tickets" value="12" hint="4 in Bearbeitung" icon="support"/>
      <Metric label="Monatlicher Umsatz" value="CHF 49’820" hint="+8%" icon="chart"/>
      <Metric label="Systemstatus" value="Operational" hint="Alle Systeme verfügbar" icon="lock"/>
    </div>
    <div className="operator-grid"><section className="surface"><SectionTitle title="Support" action={<Link className="text-action" href="/operator/tickets">Alle Tickets</Link>}/><div className="compact-list">{tickets.map(([nr,subject,customer,status])=><div key={nr}><b>{nr} · {subject}</b><span>{customer}</span><Status tone={status==="Offen"?"warning":"info"}>{status}</Status></div>)}</div></section><section className="surface"><SectionTitle title="Monitoring" action={<Link className="text-action" href="/operator/monitoring">Details</Link>}/><div className="service-list">{["Web App","API","Datenbank","Dateispeicher","Zahlungsabwicklung","E-Mail Service"].map((s,i)=><div key={s}><span><i/>{s}</span><strong>{i<3?"Operational":"Nicht verbunden"}</strong></div>)}</div></section></div>
  </>;

  const stats=data.stats??{};
  const recent=data.tickets??[];
  const incidents=data.incidents??[];
  return <>
    <div className="metrics-grid">
      <Metric label="Aktive Kunden" value={String(stats.tenants_active??0)} hint={String(stats.tenants_total??0)+" insgesamt"} icon="users"/>
      <Metric label="Offene Tickets" value={String(stats.tickets_open??0)} hint={String(stats.tickets_in_progress??0)+" in Bearbeitung"} icon="support"/>
      <Metric label="Rechnungsvolumen 30 Tage" value={"CHF "+Number(stats.documents_30d_total??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})} hint="Kundenrechnungen" icon="chart"/>
      <Metric label="Einschränkungen" value={String(stats.restrictions_active??0)} hint="Aktive Kontoeinschränkungen" icon="lock"/>
    </div>
    <div className="operator-grid">
      <section className="surface">
        <SectionTitle title="Support" action={<Link className="text-action" href="/operator/tickets">Alle Tickets</Link>}/>
        {recent.length?<div className="compact-list">{recent.map(ticket=><Link href={"/operator/tickets/"+ticket.id} key={ticket.id}><b>{ticket.subject}</b><span>{ticket.tenant?.name??"Kunde"}</span><Status tone={ticket.status==="open"?"warning":"info"}>{operatorStatus(ticket.status)}</Status></Link>)}</div>:<EmptyState icon="support" title="Keine offenen Tickets" text="Aktuell liegen keine Support-Anfragen vor."/>}
      </section>
      <section className="surface">
        <SectionTitle title="Systemereignisse" action={<Link className="text-action" href="/operator/monitoring">Monitoring</Link>}/>
        {incidents.length?<div className="incident-history">{incidents.map(incident=><div className="incident-row" key={incident.id}><span className={"incident-dot "+(incident.status==="resolved"?"resolved":"maintenance")}/><div><b>{incident.title}</b><small>{incident.service+" · "+new Date(incident.started_at).toLocaleString("de-CH")}</small></div><Status tone={incident.status==="resolved"?"success":"warning"}>{operatorStatus(incident.status)}</Status></div>)}</div>:<div className="notice"><Status tone="success">Operational</Status><b>Keine erfassten Störungen</b><span>Für Web App, API und Datenbank sind keine aktiven Vorfälle hinterlegt.</span></div>}
      </section>
    </div>
    <div className="operator-grid thirds">
      <section className="surface"><SectionTitle title="Abonnemente"/><div className="mini-stat"><span>Aktiv</span><strong>{String(stats.subscriptions_active??0)}</strong></div><div className="mini-stat"><span>Überfällig</span><strong>{String(stats.subscriptions_past_due??0)}</strong></div></section>
      <section className="surface"><SectionTitle title="Kontostatus"/><div className="mini-stat"><span>Eingeschränkt / gesperrt</span><strong>{String(stats.tenants_restricted??0)}</strong></div><Link className="text-action" href="/operator/sperrungen">Einschränkungen verwalten</Link></section>
      <section className="surface"><SectionTitle title="Kundenzahlungen"/><div className="mini-stat"><span>30 Tage</span><strong>{"CHF "+Number(stats.payments_30d_total??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}</strong></div><span>Nur erfasste Kundenrechnungs-Zahlungen, kein SaaS-Billing.</span></section>
    </div>
  </>;
}

function TicketsView() {
  const {production,items}=useOperatorTickets();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");

  if(!production) return <section className="surface operator-table-card">
    <div className="operator-toolbar"><div className="chips"><button className="active">Alle 124</button><button>Offen 12</button><button>In Bearbeitung 8</button><button>Wartet auf Kunde 6</button><button>Gelöst 98</button></div><label className="searchbox"><Icon name="search"/><input placeholder="Tickets suchen..."/></label></div>
    <div className="operator-table"><div className="operator-table-head"><span>Priorität</span><span>Ticket</span><span>Kunde</span><span>Status</span><span>Aktualisiert</span></div>{tickets.map(([nr,subject,customer,status],i)=><Link href={"/operator/tickets/"+nr.replace("#","")} className="operator-table-row" key={nr}><span><i className={i<2?"priority high":"priority"}/>{i<2?"Hoch":"Mittel"}</span><span><b>{nr}</b><small>{subject}</small></span><span>{customer}</span><span><Status tone={status==="Offen"?"warning":"info"}>{status}</Status></span><span>Demo</span></Link>)}</div>
  </section>;

  const visible=items.filter(item=>{
    const text=(item.subject+" "+(item.tenant?.name??"")+" "+item.id).toLowerCase();
    const matchesQuery=!query.trim()||text.includes(query.trim().toLowerCase());
    const matchesFilter=filter==="all"||item.status===filter;
    return matchesQuery&&matchesFilter;
  });

  return <section className="surface operator-table-card">
    <div className="operator-toolbar">
      <div className="chips"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Alle {items.length}</button><button className={filter==="open"?"active":""} onClick={()=>setFilter("open")}>Offen</button><button className={filter==="in_progress"?"active":""} onClick={()=>setFilter("in_progress")}>In Bearbeitung</button><button className={filter==="waiting_customer"?"active":""} onClick={()=>setFilter("waiting_customer")}>Wartet auf Kunde</button><button className={filter==="resolved"?"active":""} onClick={()=>setFilter("resolved")}>Gelöst</button></div>
      <label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tickets suchen..."/></label>
    </div>
    {visible.length?<div className="operator-table">
      <div className="operator-table-head"><span>Priorität</span><span>Ticket</span><span>Kunde</span><span>Status</span><span>Aktualisiert</span></div>
      {visible.map(item=><Link href={"/operator/tickets/"+item.id} className="operator-table-row" key={item.id}><span><i className={["high","critical"].includes(item.priority)?"priority high":"priority"}/>{item.priority==="critical"?"Kritisch":item.priority==="high"?"Hoch":item.priority==="low"?"Niedrig":"Normal"}</span><span><b>{"#"+item.id.slice(0,8)}</b><small>{item.subject}</small></span><span>{item.tenant?.name??"Kunde"}</span><span><Status tone={item.status==="resolved"||item.status==="closed"?"success":item.status==="open"?"warning":"info"}>{operatorStatus(item.status)}</Status></span><span>{new Date(item.updated_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</span></Link>)}
    </div>:<EmptyState icon="search" title="Keine Tickets" text="Für die aktuelle Auswahl wurden keine Tickets gefunden."/>}
  </section>;
}

function TicketDetail({ticketId}:{ticketId:string}) {
  const production=useBackendMode();
  const [reply,setReply]=useState("");
  const [internal,setInternal]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [supportAccess,setSupportAccess]=useState(false);
  const [ticket,setTicket]=useState<Record<string,unknown>|null>(null);
  const [messages,setMessages]=useState<Array<Record<string,unknown>>>([]);

  useEffect(()=>{
    if(!production) return;
    apiGet<{item:Record<string,unknown>;messages:Array<Record<string,unknown>>}>("/api/operator/tickets/"+encodeURIComponent(ticketId))
      .then(payload=>queueMicrotask(()=>{setTicket(payload.item);setMessages(payload.messages);}))
      .catch(()=>undefined);
  },[production,ticketId]);

  const update=async(field:"status"|"priority",value:string)=>{
    if(!production) return;
    try{
      const payload=await apiPatch<{item:Record<string,unknown>}>("/api/operator/tickets/"+encodeURIComponent(ticketId),{[field]:value});
      setTicket(payload.item);
      setToast("Ticket aktualisiert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Ticket konnte nicht aktualisiert werden.");
    }
    window.setTimeout(()=>setToast(null),2200);
  };

  const send=async()=>{
    const value=reply.trim();
    if(!value)return;
    if(!production){setReply("");setToast("Antwort wurde im Ticket ergänzt.");window.setTimeout(()=>setToast(null),2200);return;}
    try{
      const payload=await apiPost<{item:Record<string,unknown>}>("/api/operator/tickets/"+encodeURIComponent(ticketId)+"/messages",{body:value,internal});
      setMessages(current=>[...current,payload.item]);
      setReply("");
      setToast(internal?"Interne Notiz gespeichert.":"Antwort gesendet.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Nachricht konnte nicht gespeichert werden.");
    }
    window.setTimeout(()=>setToast(null),2200);
  };

  if(!production) return <div className="operator-ticket-layout">
    <section className="surface operator-thread">
      <div className="ticket-meta-bar"><label>Status<select defaultValue="progress"><option value="open">Offen</option><option value="progress">In Bearbeitung</option><option value="waiting">Wartet auf Kunde</option><option value="solved">Gelöst</option></select></label><label>Priorität<select defaultValue="high"><option value="normal">Normal</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></label></div>
      <article className="operator-message customer"><header><b>Thomas Meier</b><small>10:24</small></header><p>Guten Tag. In der letzten Rechnung sind nicht alle Positionen korrekt aufgeführt. Können Sie das bitte prüfen?</p></article>
      <article className="operator-message support"><header><b>Binso Support</b><small>10:37</small></header><p>Guten Tag Herr Meier. Vielen Dank für die Anfrage. Ich prüfe die Rechnung gerne und melde mich in Kürze bei Ihnen.</p></article>
      <div className="operator-reply"><textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Antwort schreiben..."/><div><Button onClick={()=>void send()}>Senden</Button></div></div>
    </section>
    <aside className="surface customer-context"><SectionTitle title="Kunde"/><h3>Acme AG</h3><p>Demo-Kontext</p></aside>{toast&&<Toast title={toast}/>}
  </div>;

  if(!ticket) return <section className="surface"><EmptyState icon="support" title="Ticket wird geladen" text="Die Ticketdaten werden abgerufen."/></section>;

  const tenant=ticket.tenant as Record<string,unknown>|undefined;
  const status=String(ticket.status??"open");
  const priority=String(ticket.priority??"normal");

  return <div className="operator-ticket-layout">
    <section className="surface operator-thread">
      <div className="ticket-meta-bar">
        <label>Status<select value={status} onChange={e=>void update("status",e.target.value)}><option value="open">Offen</option><option value="in_progress">In Bearbeitung</option><option value="waiting_customer">Wartet auf Kunde</option><option value="resolved">Gelöst</option><option value="closed">Geschlossen</option></select></label>
        <label>Priorität<select value={priority} onChange={e=>void update("priority",e.target.value)}><option value="low">Niedrig</option><option value="normal">Normal</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></label>
      </div>
      <div className="tabs"><button className={!internal?"active":""} onClick={()=>setInternal(false)}>Konversation</button><button className={internal?"active":""} onClick={()=>setInternal(true)}>Interne Notiz</button></div>
      {messages.filter(message=>internal?message.internal===true:message.internal!==true).map(message=><article className={"operator-message "+(message.author_type==="customer"?"customer":"support")} key={String(message.id)}><header><b>{message.author_type==="customer"?"Kunde":"Binso Operator"}</b><small>{new Date(String(message.created_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</small></header><p>{String(message.body??"")}</p>{message.internal===true&&<Status tone="neutral">Intern</Status>}</article>)}
      <div className="operator-reply"><textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder={internal?"Interne Notiz schreiben...":"Antwort an Kunden schreiben..."}/><div><Button onClick={()=>void send()}>{internal?"Notiz speichern":"Senden"}</Button></div></div>
    </section>
    <aside className="surface customer-context">
      <SectionTitle title="Kunde"/>
      <h3>{String(tenant?.name??"Kunde")}</h3><p>{String(tenant?.uid??"")} {tenant?.city?"· "+String(tenant.city):""}</p>
      {Boolean(tenant?.id)&&<Link href={"/operator/kunden/"+String(tenant?.id)}>Kundendetails öffnen →</Link>}
      <div className="context-block"><small>Support-Zugriff</small><b>{supportAccess?"Aktiv · 30 Minuten":"Nicht aktiv"}</b><span>Nur zeitlich begrenzt und auditierbar starten.</span><Button variant="secondary" onClick={()=>{setSupportAccess(!supportAccess);setToast(supportAccess?"Support-Zugriff beendet.":"Support-Zugriff vorbereitet. Technische Impersonation ist noch nicht aktiviert.");window.setTimeout(()=>setToast(null),2200)}}>{supportAccess?"Zugriff beenden":"Zugriff starten"}</Button></div>
    </aside>
    {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
  </div>;
}

function CustomersView() {
  const {production,items}=useOperatorCustomers();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");

  if(!production) return <section className="surface">
    <div className="operator-toolbar"><label className="searchbox"><Icon name="search"/><input placeholder="Kunden suchen..."/></label><div className="chips"><button className="active">Alle</button><button>Aktiv</button><button>Eingeschränkt</button><button>Gesperrt</button></div></div>
    <div className="operator-table"><div className="operator-table-head customer"><span>Kunde</span><span>Plan</span><span>MRR</span><span>Status</span><span>Letzte Aktivität</span></div>{[["Acme AG","Business","CHF 49","Aktiv"],["Müller GmbH","Start","CHF 19","Aktiv"],["Berger Bau AG","Pro","CHF 89","Aktiv"],["Meier Handel AG","Business","CHF 49","Eingeschränkt"]].map(([name,plan,mrr,status],i)=><Link href={i===0?"/operator/kunden/acme":"#"} className="operator-table-row customer" key={name}><span><b>{name}</b><small>Demo</small></span><span>{plan}</span><span>{mrr}</span><span><Status tone={status==="Aktiv"?"success":"warning"}>{status}</Status></span><span>Demo</span></Link>)}</div>
  </section>;

  const visible=items.filter(item=>{
    const accountStatus=item.account?.account_status??"active";
    return (!query.trim()||(item.name+" "+(item.uid??"")+" "+(item.city??"")).toLowerCase().includes(query.trim().toLowerCase()))&&(filter==="all"||accountStatus===filter);
  });
  const price:Record<string,string>={start:"CHF 19",business:"CHF 49",pro:"CHF 89",trial:"CHF 0"};

  return <section className="surface">
    <div className="operator-toolbar"><label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kunden suchen..."/></label><div className="chips"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Alle</button><button className={filter==="active"?"active":""} onClick={()=>setFilter("active")}>Aktiv</button><button className={filter==="restricted"?"active":""} onClick={()=>setFilter("restricted")}>Eingeschränkt</button><button className={filter==="suspended"?"active":""} onClick={()=>setFilter("suspended")}>Gesperrt</button></div></div>
    {visible.length?<div className="operator-table"><div className="operator-table-head customer"><span>Kunde</span><span>Plan</span><span>MRR</span><span>Status</span><span>Erstellt</span></div>{visible.map(item=>{const status=item.account?.account_status??"active";const plan=item.account?.plan??"trial";return <Link href={"/operator/kunden/"+item.id} className="operator-table-row customer" key={item.id}><span><b>{item.name}</b><small>{item.uid??item.city??"—"}</small></span><span>{operatorPlan(plan)}</span><span>{price[plan]??"—"}</span><span><Status tone={status==="active"?"success":"warning"}>{operatorStatus(status)}</Status></span><span>{new Date(item.created_at).toLocaleDateString("de-CH")}</span></Link>})}</div>:<EmptyState icon="users" title="Keine Kunden" text="Für die aktuelle Auswahl wurden keine Kunden gefunden."/>}
  </section>;
}

function OperatorCustomerDetail({tenantId}:{tenantId:string}) {
  const production=useBackendMode();
  const [toast,setToast]=useState<string|null>(null);
  const [data,setData]=useState<{overview?:Record<string,unknown>;tickets?:Array<Record<string,unknown>>;audit?:Array<Record<string,unknown>>}>({});

  useEffect(()=>{
    if(!production) return;
    apiGet<typeof data>("/api/operator/customers/"+encodeURIComponent(tenantId))
      .then(payload=>queueMicrotask(()=>setData(payload)))
      .catch(()=>undefined);
  },[production,tenantId]);

  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};

  if(!production) return <>
    <div className="operator-customer-hero"><div className="operator-customer-main"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>Demo-Kunde · Zürich</p></div></div><div className="operator-customer-actions"><Status tone="success">Aktiv</Status><Button variant="secondary" onClick={()=>notify("Support-Zugriff ist im Demo-Modus nur simuliert.")}>Support-Zugriff</Button><Button href="/operator/sperrungen" variant="danger">Einschränken</Button></div></div>
    <div className="operator-customer-metrics"><Metric label="Plan" value="Business" hint="Demo" icon="card"/><Metric label="Benutzer" value="8 / 10" hint="Demo" icon="users"/><Metric label="Offene Tickets" value="1" hint="Demo" icon="support"/><Metric label="Zahlungsstatus" value="Bezahlt" hint="Demo" icon="wallet"/></div>
    {toast&&<Toast title={toast}/>}
  </>;

  const overview=data.overview??{};
  const tenant=overview.tenant as Record<string,unknown>|null|undefined;
  const account=overview.account as Record<string,unknown>|null|undefined;
  const restrictions=Array.isArray(overview.active_restrictions)?overview.active_restrictions as Array<Record<string,unknown>>:[];
  if(!tenant) return <section className="surface"><EmptyState icon="users" title="Kunde wird geladen" text="Die Mandantendaten werden abgerufen."/></section>;

  const plan=String(account?.plan??"trial");
  const accountStatus=String(account?.account_status??"active");
  const planPrice:Record<string,string>={trial:"CHF 0",start:"CHF 19",business:"CHF 49",pro:"CHF 89"};
  const userLimit=Number(account?.user_limit??0);
  const users=Number(overview.users??0);
  const openTickets=Number(overview.open_tickets??0);

  return <>
    <div className="operator-customer-hero">
      <div className="operator-customer-main"><span className="record-avatar large">{String(tenant.name??"K").slice(0,1)}</span><div><h2>{String(tenant.name??"Kunde")}</h2><p>{String(tenant.uid??"Keine UID")} {tenant.city?"· "+String(tenant.city):""}</p></div></div>
      <div className="operator-customer-actions"><Status tone={accountStatus==="active"?"success":"warning"}>{operatorStatus(accountStatus)}</Status><Button variant="secondary" onClick={()=>notify("Support-Zugriff bleibt deaktiviert, bis die Impersonation sicher implementiert ist.")}>Support-Zugriff</Button><Button href="/operator/sperrungen" variant="danger">Einschränken</Button></div>
    </div>
    <div className="operator-customer-metrics"><Metric label="Plan" value={operatorPlan(plan)} hint={planPrice[plan]+" / Monat"} icon="card"/><Metric label="Benutzer" value={String(users)+" / "+String(userLimit||"—")} hint={userLimit?String(Math.max(0,userLimit-users))+" Plätze frei":"Keine Grenze"} icon="users"/><Metric label="Offene Tickets" value={String(openTickets)} hint="Aktuelle Anfragen" icon="support"/><Metric label="Kundenzahlungen" value={"CHF "+Number(overview.payments_total??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})} hint="Erfasste Rechnungszahlungen" icon="wallet"/></div>
    <div className="operator-customer-grid">
      <section className="surface"><SectionTitle title="Konto"/><dl className="operator-detail-list"><div><dt>Firma</dt><dd>{String(tenant.name??"—")}</dd></div><div><dt>E-Mail</dt><dd>{String(tenant.email??"—")}</dd></div><div><dt>Telefon</dt><dd>{String(tenant.phone??"—")}</dd></div><div><dt>Erstellt</dt><dd>{new Date(String(tenant.created_at)).toLocaleDateString("de-CH")}</dd></div><div><dt>Mandant</dt><dd>{String(tenant.id)}</dd></div></dl></section>
      <section className="surface"><SectionTitle title="Abonnement"/><div className="context-block"><small>Plan</small><b>{operatorPlan(plan)}</b><span>{planPrice[plan]??"—"} / Monat</span><Status tone={String(account?.subscription_status)==="active"?"success":"warning"}>{operatorStatus(String(account?.subscription_status??"trial"))}</Status></div><div className="context-block"><small>Kontostatus</small><b>{operatorStatus(accountStatus)}</b><span>{restrictions.length?String(restrictions.length)+" aktive Einschränkung(en)":"Keine aktive Einschränkung"}</span></div></section>
      <section className="surface"><SectionTitle title="Support"/>{(data.tickets??[]).length?<div className="compact-list">{(data.tickets??[]).map(ticket=><Link href={"/operator/tickets/"+String(ticket.id)} key={String(ticket.id)}><b>{"#"+String(ticket.id).slice(0,8)+" · "+String(ticket.subject??"")}</b><span>{new Date(String(ticket.updated_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</span><Status tone={String(ticket.status)==="resolved"?"success":"warning"}>{operatorStatus(String(ticket.status))}</Status></Link>)}</div>:<EmptyState icon="support" title="Keine Tickets" text="Für diesen Kunden sind keine Tickets vorhanden."/>}</section>
      <section className="surface"><SectionTitle title="Audit"/>{(data.audit??[]).length?<div className="audit-list">{(data.audit??[]).map(item=><span key={String(item.id)}><b>{new Date(String(item.created_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</b> {String(item.action)}</span>)}</div>:<p>Noch keine tenant-spezifischen Audit-Einträge.</p>}</section>
    </div>
    {toast&&<Toast title={toast}/>}
  </>;
}

function PaymentsView() {
  return <>
    <div className="metrics-grid three"><Metric label="Umsatz total" value="CHF 49’820" hint="+8%" icon="chart"/><Metric label="Erfolgreiche Zahlungen" value="184" hint="98.9%" icon="wallet"/><Metric label="Fehlgeschlagen" value="2" hint="1.1%" icon="clock"/></div>
    <section className="surface operator-table-card"><div className="operator-table"><div className="operator-table-head payment"><span>Datum</span><span>Kunde</span><span>Betrag</span><span>Status</span><span>Zahlungsart</span></div>{[["02.10.2026","Acme AG","CHF 1’240.00","Erfolgreich","Visa •••• 4242"],["02.10.2026","Müller GmbH","CHF 49.00","Erfolgreich","Mastercard •••• 7319"],["01.10.2026","Schmid Consulting","CHF 89.00","Fehlgeschlagen","Visa •••• 4002"]].map(r=><div className="operator-table-row payment" key={r[1]}>{r.map((x,i)=><span key={i}>{i===3?<Status tone={x==="Erfolgreich"?"success":"danger"}>{x}</Status>:x}</span>)}</div>)}</div></section>
  </>;
}

function SubscriptionsView() {
  const [selected,setSelected]=useState<string|null>(null);
  return <>
    <div className="operator-grid thirds">
      {[
        ["Start","1’128","CHF 19","21’432"],
        ["Business","1’462","CHF 49","71’638"],
        ["Pro","251","CHF 89","22’339"],
      ].map(([plan,count,price,mrr])=><section className="surface subscription-card" key={plan}><small>Plan</small><h2>{plan}</h2><strong>{count} Kunden</strong><p>CHF {mrr} MRR</p><span>{price} / Monat</span><Button variant="secondary" onClick={()=>setSelected(plan)}>Details</Button></section>)}
    </div>
    {selected&&<div className="operator-modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="operator-confirm subscription-detail-modal"><span className="confirm-icon"><Icon name="card"/></span><h2>{selected}</h2><p>Planübersicht mit aktiven Kunden, monatlichem Umsatz und hinterlegten Leistungsgrenzen.</p><dl><div><dt>Aktive Kunden</dt><dd>{selected==="Start"?"1’128":selected==="Business"?"1’462":"251"}</dd></div><div><dt>Monatlicher Preis</dt><dd>{selected==="Start"?"CHF 19":selected==="Business"?"CHF 49":"CHF 89"}</dd></div><div><dt>Status</dt><dd>Aktiv</dd></div></dl><div><Button variant="secondary" onClick={()=>setSelected(null)}>Schliessen</Button><Button href="/operator/kunden">Kunden anzeigen</Button></div></section></div>}
  </>;
}

function RestrictionsView() {
  const [confirm,setConfirm]=useState<"create"|"remove"|null>(null);
  return <>
    <div className="operator-grid">
      <section className="surface restriction-form"><SectionTitle title="Sperrung erstellen"/><div className="form-grid two"><label>Kunde<select><option>Meier Handel AG</option></select></label><label>Grund<select><option>Zahlungsausstand</option><option>Sicherheitsvorfall</option><option>Vertragsende</option></select></label><label>Umfang<select><option>Gesamter Zugriff</option><option>Nur Schreibzugriff</option></select></label><label>Ablaufdatum<input type="date"/></label><label className="full">Interne Begründung<textarea defaultValue="Ausstehende Zahlung seit 14 Tagen. Mehrfache Mahnung ohne Reaktion."/></label></div><Button variant="danger" onClick={()=>setConfirm("create")}>Sperrung erstellen</Button></section>
      <section className="surface"><SectionTitle title="Aktive Einschränkungen"/><div className="notice"><Status tone="warning">Eingeschränkt</Status><b>Meier Handel AG</b><span>Zahlungsausstand · seit 18.09.2026</span><Button variant="secondary" onClick={()=>setConfirm("remove")}>Aufheben</Button></div></section>
    </div>
    {confirm&&<div className="operator-modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirm(null)}}><section className="operator-confirm" role="dialog" aria-modal="true"><span className="confirm-icon"><Icon name="lock"/></span><h2>{confirm==="create"?"Zugriff einschränken?":"Einschränkung aufheben?"}</h2><p>{confirm==="create"?"Der Kunde kann je nach Umfang nicht mehr auf Binso One zugreifen. Die Aktion wird mit Begründung im Audit protokolliert.":"Der normale Zugriff für Meier Handel AG wird wiederhergestellt. Auch diese Aktion wird protokolliert."}</p><div><Button variant="secondary" onClick={()=>setConfirm(null)}>Abbrechen</Button><Button variant={confirm==="create"?"danger":"primary"} onClick={()=>setConfirm(null)}>{confirm==="create"?"Einschränken":"Aufheben"}</Button></div></section></div>}
  </>;
}

function MonitoringView() {
  return <>
    <div className="operator-monitor-metrics">
      <Metric label="Verfügbarkeit" value="99.99%" hint="letzte 30 Tage" icon="chart"/>
      <Metric label="API Antwortzeit" value="182 ms" hint="p95" icon="clock"/>
      <Metric label="Fehlerrate" value="0.08%" hint="letzte Stunde" icon="support"/>
      <Metric label="Aktive Nutzer" value="1’284" hint="letzte 15 Minuten" icon="users"/>
    </div>
    <div className="monitoring-panel">
      <div className="monitoring-head"><div><span className="monitoring-dot"/><b>Alle Systeme verfügbar</b></div><small>Aktualisiert vor 1 Minute</small></div>
      <div className="monitoring-list">{["Web App","API","Datenbank","Dateispeicher","Zahlungsabwicklung","E-Mail Service"].map((s,i)=><div key={s}><div><i/><span><b>{s}</b><small>{i===4?"Stripe":"Binso One"}</small></span></div><strong>{i===4?"99.98%":"99.99%"}</strong><div className="spark">{[30,42,36,58,52,70,66,80].map((h,n)=><i key={n} style={{height:h/2}}/>)}</div></div>)}</div>
    </div>
    <section className="surface incident-history">
      <SectionTitle title="Letzte Ereignisse"/>
      <div className="incident-row"><span className="incident-dot resolved"/><div><b>Erhöhte API-Latenz</b><small>Heute, 07:42–07:48 · automatisch behoben</small></div><Status tone="success">Gelöst</Status></div>
      <div className="incident-row"><span className="incident-dot resolved"/><div><b>Zahlungsprovider verzögert</b><small>29.09.2026, 13:14–13:22</small></div><Status tone="success">Gelöst</Status></div>
      <div className="incident-row"><span className="incident-dot maintenance"/><div><b>Geplante Wartung Datenbank</b><small>27.09.2026, 02:00–02:12</small></div><Status tone="info">Wartung</Status></div>
    </section>
  </>;
}

function AnnouncementsView() {
  const [published,setPublished]=useState(false);
  return <div className="operator-grid">
    <section className="surface"><SectionTitle title="Neue Ankündigung"/><div className="form-grid"><label className="full">Titel<input placeholder="Kurzer Titel"/></label><label className="full">Typ<select><option>Information</option><option>Wartung</option><option>Störung</option><option>Neue Funktion</option></select></label><label className="full">Zielgruppe<select><option>Alle Kunden</option><option>Business</option><option>Pro</option></select></label><label className="full">Nachricht<textarea placeholder="Nachricht..."/></label></div><Button onClick={()=>setPublished(true)}>Veröffentlichen</Button></section>
    <section className="surface"><SectionTitle title="Aktiv"/><div className="announcement-card"><Status tone="info">Information</Status><b>Neue Rechnungsansicht</b><p>Die neue mobile Rechnungsvorschau ist verfügbar.</p><small>Heute · alle Kunden</small></div>{published&&<div className="announcement-card"><Status tone="success">Veröffentlicht</Status><b>Neue Ankündigung</b><p>Die Ankündigung wurde für alle Kunden veröffentlicht.</p><small>gerade eben</small></div>}</section>
  </div>;
}

function SecurityView() {
  const [inviteOpen,setInviteOpen]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  return <>
    <section className="surface">
      <SectionTitle title="Interne Benutzer" action={<Button icon="plus" onClick={()=>setInviteOpen(true)}>Benutzer</Button>}/>
      <div className="operator-table"><div className="operator-table-head security"><span>Name</span><span>Rolle</span><span>Status</span><span>Letzte Anmeldung</span></div>{[["Oemer Cam","Administrator","Aktiv","Heute 09:18"],["Maria Bianchi","Support","Aktiv","Heute 08:42"],["Luca Schneider","Support","Aktiv","Gestern"],["Anna Pross","Finanzen","Aktiv","Gestern"]].map(r=><div className="operator-table-row security" key={r[0]}><span><b>{r[0]}</b></span><span>{r[1]}</span><span><Status tone="success">{r[2]}</Status></span><span>{r[3]}</span></div>)}</div>
    </section>
    {inviteOpen&&<div className="operator-modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setInviteOpen(false)}}><section className="operator-confirm operator-user-modal"><span className="confirm-icon"><Icon name="users"/></span><h2>Interner Benutzer</h2><p>Neue interne Benutzer erhalten nur die ausgewählte Rolle. Änderungen werden im Audit protokolliert.</p><label>Name<input placeholder="Vorname Nachname"/></label><label>E-Mail<input type="email" placeholder="name@binso.ch"/></label><label>Rolle<select><option>Support</option><option>Finanzen</option><option>Administrator</option></select></label><div><Button variant="secondary" onClick={()=>setInviteOpen(false)}>Abbrechen</Button><Button onClick={()=>{setInviteOpen(false);setToast("Einladung vorbereitet.");window.setTimeout(()=>setToast(null),2200)}}>Einladen</Button></div></section></div>}
    {toast&&<Toast title={toast}/>}
  </>;
}

function AuditView() {
  return <section className="surface">
    <div className="operator-toolbar"><div className="chips"><button className="active">Letzte 7 Tage</button><button>Alle Kategorien</button></div><label className="searchbox"><Icon name="search"/><input placeholder="Audit durchsuchen..."/></label></div>
    <div className="operator-table"><div className="operator-table-head audit"><span>Zeit</span><span>Benutzer</span><span>Aktion</span><span>Details</span></div>{[["10:42","ocam","Kunde aktualisiert","Acme AG (K-1001)"],["09:18","lschneider","Sperrung erstellt","Meier Handel AG"],["Gestern","mbianchi","Ticket Status geändert","#8419 → In Bearbeitung"],["Gestern","apross","Zahlung manuell erfasst","CHF 299.00"],["28.09.","system","Login erfolgreich","lschneider · Zürich"]].map(r=><div className="operator-table-row audit" key={r.join("-")}>{r.map((x,i)=><span key={i}>{i===2?<b>{x}</b>:x}</span>)}</div>)}</div>
  </section>;
}