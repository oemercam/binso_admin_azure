"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, EmptyState, Icon, Logo, Metric, SectionTitle, Status, Toast } from "./ui";
import { apiGet, apiPatch, apiPost, useBackendMode } from "@/lib/client/backend";

const operatorNav = [
  ["","Dashboard","home"],
  ["tickets","Tickets","support"],
  ["kunden","Kunden","users"],
  ["zahlungen","Zahlungen","wallet"],
  ["finanzen","Finanzen","chart"],
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


export function OperatorPage({ section = "", demo = false }: { section?: string; demo?: boolean }) {
  const key = section.split("/")[0] || "";
  const detail = section.split("/")[1] || "";
  const title = useMemo(() => operatorNav.find(([slug]) => slug === key)?.[1] ?? "Dashboard", [key]);
  const [mobileMore,setMobileMore]=useState(false);
  const [accountOpen,setAccountOpen]=useState(false);
  const router=useRouter();
  const logout=async()=>{try{await fetch("/api/auth/logout",{method:"POST",headers:{"Content-Type":"application/json"}});}finally{router.push("/login");router.refresh();}};

  return <div className="operator-root" data-operator-demo={demo?"true":"false"}>
    <aside className="operator-sidebar">
      <Link href="/operator"><Logo dark/></Link>
      <nav>{operatorNav.map(([slug,label,icon])=><Link className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon}/><span>{label}</span>{label==="Tickets"&&<em>12</em>}</Link>)}</nav>
    </aside>

    <main className="operator-main">
      <header className="operator-app-header">
        <div className="operator-header-brand"><Logo/><div><h1>{detail ? (key === "tickets" ? `Ticket #${detail}` : key === "kunden" ? "Acme AG" : title) : title}</h1><p>{operatorSubtitle(key, detail)}</p></div></div>
        <div className="operator-user"><Link className="icon-button operator-home-link" href="/dashboard" aria-label="Zur App"><Icon name="home" size={18}/></Link><button className="avatar avatar-button" type="button" aria-label="Benutzerkonto" onClick={()=>setAccountOpen(true)}>OC</button></div>
      </header>
      {accountOpen&&<div className="sheet-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setAccountOpen(false)}}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Konto"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Konto</h2><p>Profil, Darstellung und Sitzung.</p></div><button className="icon-button" type="button" aria-label="Schliessen" onClick={()=>setAccountOpen(false)}><Icon name="close"/></button></header><div className="account-sheet"><div className="account-sheet-profile"><span className="avatar avatar-large">OC</span><div><b>One Admin</b><small>Administration</small></div></div><div className="sheet-menu"><Link href="/operator/sicherheit" onClick={()=>setAccountOpen(false)}><Icon name="lock"/><span><b>Sicherheit</b><small>Zugriff und Sicherheit</small></span><Icon name="arrow" size={15}/></Link><Link href="/dashboard" onClick={()=>setAccountOpen(false)}><Icon name="home"/><span><b>Zum Kundenportal</b><small>Binso One öffnen</small></span><Icon name="arrow" size={15}/></Link></div><div className="sheet-secondary"><button type="button" onClick={()=>void logout()}><Icon name="logout"/><span>Abmelden</span></button></div></div></section></div>}

      <nav className="operator-mobile-nav" aria-label="Operator Navigation">
        {operatorNav.filter(([slug])=>["","tickets","kunden","monitoring"].includes(slug)).map(([slug,label,icon])=><Link className={slug===key?"active":""} href={slug ? `/operator/${slug}` : "/operator"} key={slug}><Icon name={icon} size={19}/><span>{label}</span></Link>)}
        <button type="button" className={["zahlungen","finanzen","abonnemente","sperrungen","ankuendigungen","sicherheit","audit"].includes(key)?"active":""} onClick={()=>setMobileMore(true)}><Icon name="more" size={19}/><span>Mehr</span></button>
      </nav>
      {mobileMore&&<div className="operator-mobile-more-layer" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setMobileMore(false)}}>
        <section className="operator-mobile-more" role="dialog" aria-modal="true" aria-label="Weitere Admin-Bereiche">
          <header><div><h2>Mehr</h2><p>Weitere Bereiche von One Admin.</p></div><button type="button" className="icon-button" aria-label="Schliessen" onClick={()=>setMobileMore(false)}><Icon name="close"/></button></header>
          <nav>{operatorNav.filter(([slug])=>["zahlungen","finanzen","abonnemente","sperrungen","ankuendigungen","sicherheit","audit"].includes(slug)).map(([slug,label,icon])=><Link href={`/operator/${slug}`} key={slug} onClick={()=>setMobileMore(false)}><Icon name={icon}/><span>{label}</span><Icon name="arrow" size={15}/></Link>)}</nav>
        </section>
      </div>}

      {detail && key === "tickets" ? <TicketDetail ticketId={detail}/> :
        detail && key === "kunden" ? <OperatorCustomerDetail tenantId={detail}/> :
        key === "tickets" ? <TicketsView/> :
        key === "kunden" ? <CustomersView/> :
        key === "zahlungen" ? <PaymentsView/> :
        key === "finanzen" ? <OperatorFinanceView demo={demo}/> :
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
    finanzen: "Plattformumsatz, Kosten und wirtschaftliche Entwicklung.",
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
  const [data,setData]=useState<{stats?:Record<string,unknown>;tickets?:OperatorTicket[];incidents?:Array<{id:string;service:string;title:string;status:string;started_at:string}>}>({});
  const [metric,setMetric]=useState<"availability"|"users"|"api">("availability");
  useEffect(()=>{if(!production)return;apiGet<typeof data>("/api/operator/dashboard").then(payload=>queueMicrotask(()=>setData(payload))).catch(()=>undefined)},[production]);
  const stats=data.stats??{};
  const recent=production?(data.tickets??[]):tickets.map(([,subject,customer,status],i)=>({id:String(i),subject,tenant:{name:customer},status:status==="Offen"?"open":"in_progress"} as OperatorTicket));
  const incidents=data.incidents??[];
  const open=production?Number(stats.tickets_open??0):8, progress=production?Number(stats.tickets_in_progress??0):12;
  const resolved=production?Number(stats.tickets_resolved??0):28, overdue=production?Number(stats.tickets_overdue??0):3;
  const metricInfo={availability:["Systemverfügbarkeit","99.99 %","+0.01 %","0,6,12,18,24"],users:["Aktive Nutzer",production?String(stats.users_active??0):"128","aktuell online","0,6,12,18,24"],api:["Antwortzeit API","182 ms","−12 %","0,6,12,18,24"]} as const;
  const current=metricInfo[metric];
  if(production)return <div className="operator-dashboard-cockpit">
    <div className="operator-ticket-stats">{[["Offene Tickets",open],["In Bearbeitung",progress],["Gelöst",resolved],["Aktive Nutzer",Number(stats.users_active??0)]].map(([label,value])=><Link href="/operator/tickets" key={label}><strong>{value}</strong><span>{label}</span></Link>)}</div>
    <section className="surface"><SectionTitle title="Systemstatus" action={<Link href="/operator/monitoring">Monitoring öffnen</Link>}/><p>{incidents.length} aktive Störungen erfasst</p></section>
    <section className="surface"><SectionTitle title="Letzte Supportfälle"/><div className="compact-list">{recent.map(x=><Link href={"/operator/tickets/"+x.id} key={x.id}><b>{x.subject}</b><span>{x.tenant?.name??"Kunde"}</span><Status>{operatorStatus(x.status)}</Status></Link>)}</div></section>
  </div>;
  return <div className="operator-dashboard-cockpit">
    <section className="operator-health-strip">
      <SectionTitle title="Systemstatus" action={<Link className="text-action" href="/operator/monitoring">Alle anzeigen</Link>}/>
      <div className="operator-health-services">{["Web App","Datenbank","API","Dateispeicher","E-Mail Service"].map((name,i)=><button type="button" key={name} onClick={()=>setMetric(i===1?"availability":i===2?"api":"users")}><i className={i===4?"warn":""}/><b>{name}</b><span>{i===4?"Degradiert":"Online"}</span><small>{i===0?"99.99 %":i===1?"12 ms":i===2?"24 ms":i===3?"34 ms":"Antwortzeit erhöht"}</small></button>)}</div>
    </section>
    <div className="operator-pulse-grid">
      {(["availability","users","api"] as const).map((key)=><button type="button" className={"operator-pulse "+(metric===key?"active":"")} key={key} onClick={()=>setMetric(key)}><div><span>{metricInfo[key][0]}</span><strong>{metricInfo[key][1]}</strong><small>{metricInfo[key][2]}</small></div><div className={"operator-stat-ring "+key} aria-hidden="true"><b>{key==="availability"?"99.99":key==="users"?"128":"182"}</b><span>{key==="availability"?"%":key==="users"?"online":"ms"}</span></div></button>)}
    </div>
    <div className="operator-insight-grid">
      <section className="surface"><SectionTitle title="Tickets" action={<Link className="text-action" href="/operator/tickets">Alle anzeigen</Link>}/><div className="operator-ticket-stats">{[["Neu",open],["In Bearbeitung",progress],["Gelöst",resolved],["Überfällig",overdue]].map(([label,value],i)=><Link href="/operator/tickets" key={String(label)} className={"ticket-stat t"+i}><strong>{value}</strong><span>{label}</span></Link>)}</div></section>
      <section className="surface operator-sla"><SectionTitle title="SLA Erfüllung"/><button type="button" aria-label="SLA Details" onClick={()=>setMetric("availability")} className="sla-compact"><span className="sla-ring"><b>96.3%</b></span><span className="sla-copy"><strong>Innerhalb SLA</strong><small><i/> 96.3 % erfüllt</small><small><i/> 2.5 % knapp</small><small><i/> 1.2 % überfällig</small></span></button></section>
    </div>
    <div className="operator-insight-grid">
      <section className="surface"><SectionTitle title="Offene Anfragen nach Kategorie" action={<Link className="text-action" href="/operator/tickets">Alle anzeigen</Link>}/><div className="operator-category-bars">{[["Technische Störung",14],["Zugriff / Berechtigung",9],["Funktion / Anwendung",7],["Änderung / Anfrage",5]].map(([label,value],i)=><Link href="/operator/tickets" key={String(label)}><span>{label}</span><i><b style={{width:String(Number(value)*6)+"%"}}/></i><strong>{value}</strong></Link>)}</div></section>
      <section className="surface"><SectionTitle title="Letzte Aktivitäten"/>{incidents.length?<div className="incident-history">{incidents.slice(0,5).map(x=><div className="incident-row" key={x.id}><span className={"incident-dot "+(x.status==="resolved"?"resolved":"maintenance")}/><div><b>{x.title}</b><small>{x.service}</small></div></div>)}</div>:<div className="compact-list">{recent.slice(0,4).map(x=><Link href={"/operator/tickets/"+x.id} key={x.id}><b>{x.subject}</b><span>{x.tenant?.name??"Kunde"}</span><Status tone={x.status==="open"?"warning":"success"}>{operatorStatus(x.status)}</Status></Link>)}</div>}</section>
    </div>
  </div>;
}

function TicketsView() {
  const {production,items}=useOperatorTickets();
  const [query,setQuery]=useState("");
  const [filter,setFilter]=useState("all");
  const demoTicketVisible=tickets.filter(([nr,subject,customer,status])=>{
    const matchQuery=!query.trim()||(`${nr} ${subject} ${customer}`).toLowerCase().includes(query.trim().toLowerCase());
    const matchFilter=filter==="all"||status===filter;
    return matchQuery&&matchFilter;
  });

  if(!production) return <section className="surface operator-table-card">
    <div className="operator-toolbar"><div className="chips"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Alle {tickets.length}</button><button className={filter==="Offen"?"active":""} onClick={()=>setFilter("Offen")}>Offen</button><button className={filter==="In Bearbeitung"?"active":""} onClick={()=>setFilter("In Bearbeitung")}>In Bearbeitung</button><button className={filter==="Wartet auf Kunde"?"active":""} onClick={()=>setFilter("Wartet auf Kunde")}>Wartet auf Kunde</button></div><label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tickets suchen..."/></label></div>
    <div className="operator-table"><div className="operator-table-head"><span>Priorität</span><span>Ticket</span><span>Kunde</span><span>Status</span><span>Aktualisiert</span></div>{demoTicketVisible.map(([nr,subject,customer,status],i)=><Link href={"/operator/tickets/"+nr.replace("#","")} className="operator-table-row" key={nr}><span><i className={i<2?"priority high":"priority"}/>{i<2?"Hoch":"Mittel"}</span><span><b>{nr}</b><small>{subject}</small></span><span>{customer}</span><span><Status tone={status==="Offen"?"warning":"info"}>{status}</Status></span><span>Demo</span></Link>)}</div>
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
  const demoCustomers=[["Acme AG","Business","CHF 49","Aktiv"],["Müller GmbH","Start","CHF 19","Aktiv"],["Berger Bau AG","Pro","CHF 89","Aktiv"],["Meier Handel AG","Business","CHF 49","Eingeschränkt"]];
  const demoCustomerVisible=demoCustomers.filter(([name,,,status])=>{
    const matchQuery=!query.trim()||name.toLowerCase().includes(query.trim().toLowerCase());
    const matchFilter=filter==="all"||status===filter;
    return matchQuery&&matchFilter;
  });

  if(!production) return <section className="surface">
    <div className="operator-toolbar"><label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Kunden suchen..."/></label><div className="chips"><button className={filter==="all"?"active":""} onClick={()=>setFilter("all")}>Alle</button><button className={filter==="Aktiv"?"active":""} onClick={()=>setFilter("Aktiv")}>Aktiv</button><button className={filter==="Eingeschränkt"?"active":""} onClick={()=>setFilter("Eingeschränkt")}>Eingeschränkt</button></div></div>
    <div className="operator-table"><div className="operator-table-head customer"><span>Kunde</span><span>Plan</span><span>MRR</span><span>Status</span><span>Letzte Aktivität</span></div>{demoCustomerVisible.map(([name,plan,mrr,status],i)=><Link href={i===0?"/operator/kunden/acme":"#"} className="operator-table-row customer" key={name}><span><b>{name}</b><small>Demo</small></span><span>{plan}</span><span>{mrr}</span><span><Status tone={status==="Aktiv"?"success":"warning"}>{status}</Status></span><span>Demo</span></Link>)}</div>
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

function PaymentInsight({label,value,kind,bars=[],ratio=0}:{label:string;value:string;kind:"trend"|"donut"|"status";bars?:number[];ratio?:number}) {
  return <section className={"operator-payment-insight "+kind}>
    <div><span>{label}</span><strong>{value}</strong></div>
    {kind==="trend"?<div className="payment-mini-bars" aria-hidden="true">{bars.map((height,index)=><i key={index} style={{height:String(height)+"%"}}/>)}</div>:<div className={"payment-ring "+kind} style={{"--payment-ratio":String(Math.max(0,Math.min(100,ratio)))+"%"} as React.CSSProperties}><b>{ratio}%</b></div>}
  </section>;
}

function OperatorFinanceView({demo=false}:{demo?:boolean}){
  const production=useBackendMode();
  const [data,setData]=useState<{payments?:Array<Record<string,unknown>>;subscriptions?:Array<Record<string,unknown>>;operatingCosts?:Array<Record<string,unknown>>}>({});
  const [error,setError]=useState<string|null>(null);
  const [range,setRange]=useState("month");
  useEffect(()=>{apiGet<typeof data>(demo?"/api/demo/platform-finance":"/api/operator/finance").then(payload=>{setData(payload);setError(null)}).catch(e=>setError(e instanceof Error?e.message:"Finanzdaten konnten nicht geladen werden."))},[production,demo]);
  const now=new Date(), ranges:Record<string,{label:string;months:number}>={month:{label:"Dieser Monat",months:1},last:{label:"Letzter Monat",months:1},three:{label:"3 Monate",months:3},year:{label:"12 Monate",months:12},previous:{label:"Letztes Jahr",months:12}};
  let end=new Date(now.getFullYear(),now.getMonth()+1,1),start=new Date(now.getFullYear(),now.getMonth(),1);if(range==="last"){end=start;start=new Date(end.getFullYear(),end.getMonth()-1,1)}else if(range==="three")start=new Date(end.getFullYear(),end.getMonth()-3,1);else if(range==="year")start=new Date(end.getFullYear(),end.getMonth()-12,1);else if(range==="previous"){start=new Date(now.getFullYear()-1,0,1);end=new Date(now.getFullYear(),0,1)}
  const source=(data.payments??[]);
  const inRange=(value:unknown)=>{const d=new Date(String(value??""));return d>=start&&d<end};
  const volume=source.filter(x=>inRange(x.payment_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const platformRevenue=((data.subscriptions??[])).filter(x=>inRange(x.created_at)).reduce((s,x)=>s+Number(x.monthly_revenue_chf??0),0);
  const costs=((data.operatingCosts??[])).filter(x=>inRange(x.cost_date)).reduce((s,x)=>s+Number(x.amount??0),0);
  const monthly=Array.from({length:Math.min(12,ranges[range].months)},(_,i)=>{const d=new Date(end.getFullYear(),end.getMonth()-1-i,1);const value=source.filter(x=>{const p=new Date(String(x.payment_date??""));return p.getFullYear()===d.getFullYear()&&p.getMonth()===d.getMonth()}).reduce((s,x)=>s+Number(x.amount??0),0);return{label:d.toLocaleDateString("de-CH",{month:"short"}),value}}).reverse(),max=Math.max(1,...monthly.map(x=>x.value));
  return <div>
    {error&&<p role="alert">{error}</p>}
    <div className="finance-range">{Object.entries(ranges).map(([key,x])=><button type="button" className={range===key?"active":""} key={key} onClick={()=>setRange(key)}>{x.label}</button>)}</div>
    <div className="operator-payment-insights"><PaymentInsight label="Kundenzahlungen" value={"CHF "+volume.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="trend" bars={monthly.map(x=>max?x.value/max*100:0)}/><PaymentInsight label="Plattformumsatz" value={"CHF "+platformRevenue.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="donut" ratio={platformRevenue+costs?Math.round(platformRevenue/(platformRevenue+costs)*100):0}/><PaymentInsight label="Betriebskosten" value={"CHF "+costs.toLocaleString("de-CH",{minimumFractionDigits:2})} kind="status" ratio={platformRevenue+costs?Math.round(costs/(platformRevenue+costs)*100):0}/></div>
    <section className="finance-analysis"><SectionTitle title="Finanzentwicklung"/><div className="finance-month-bars">{monthly.map(x=><div key={x.label}><i style={{height:`${x.value>0?Math.max(8,x.value/max*100):0}%`}}/><b>{x.label}</b><small>CHF {x.value.toLocaleString("de-CH",{maximumFractionDigits:0})}</small></div>)}</div></section>
    <div className="finance-breakdown"><section><h3>Plattformkosten</h3><div><span>Betriebskosten gesamt</span><strong>{"CHF "+costs.toLocaleString("de-CH",{minimumFractionDigits:2})}</strong></div><div><span>Plattformumsatz</span><strong>{"CHF "+platformRevenue.toLocaleString("de-CH",{minimumFractionDigits:2})}</strong></div><div><span>Ergebnis</span><strong>{"CHF "+(platformRevenue-costs).toLocaleString("de-CH",{minimumFractionDigits:2})}</strong></div></section><section><h3>Datenbasis</h3><p>Kundenzahlungen, Plattformumsatz und Betriebskosten werden aus Azure PostgreSQL geladen und nach dem gewählten Zeitraum ausgewertet.</p></section></div>
  </div>
}

function PaymentsView() {
  const production=useBackendMode();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/payments")
      .then(payload=>queueMicrotask(()=>setItems(payload.items)))
      .catch(()=>undefined);
  },[production]);

  if(!production) return <>
    <div className="operator-payment-insights"><PaymentInsight label="Kundenzahlungen" value="CHF 49’820" kind="trend" bars={[38,52,44,68,61,82,74,92]}/><PaymentInsight label="Verbucht" value="184" kind="donut" ratio={96}/><PaymentInsight label="Offen / storniert" value="2" kind="status" ratio={1}/></div>
    <section className="surface operator-table-card"><div className="operator-table"><div className="operator-table-head payment"><span>Datum</span><span>Kunde</span><span>Betrag</span><span>Status</span><span>Zahlungsart</span></div>{[["02.10.2026","Acme AG","CHF 1’240.00","Verbucht","Bank"],["02.10.2026","Müller GmbH","CHF 49.00","Verbucht","Bank"],["01.10.2026","Schmid Consulting","CHF 89.00","Ausstehend","Bank"]].map(r=><div className="operator-table-row payment" key={r[1]}>{r.map((x,i)=><span key={i}>{i===3?<Status tone={x==="Verbucht"?"success":"warning"}>{x}</Status>:x}</span>)}</div>)}</div></section>
  </>;

  const booked=items.filter(item=>item.status==="booked");
  const total=booked.reduce((sum,item)=>sum+Number(item.amount??0),0);
  const pending=items.filter(item=>item.status==="pending").length;
  const reversed=items.filter(item=>item.status==="reversed").length;
  return <>
    <div className="operator-payment-insights">
      <PaymentInsight label="Kundenzahlungen" value={"CHF "+total.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})} kind="trend" bars={[32,46,41,58,52,67,61,78]}/>
      <PaymentInsight label="Verbucht" value={String(booked.length)} kind="donut" ratio={items.length?Math.round(booked.length/items.length*100):0}/>
      <PaymentInsight label="Offen / storniert" value={String(pending+reversed)} kind="status" ratio={items.length?Math.round((pending+reversed)/items.length*100):0}/>
    </div>
    <section className="surface operator-table-card">
      <SectionTitle title="Kundenzahlungen"/>
      <p className="technical-hint">Diese Liste zeigt Zahlungen zu Kundenrechnungen. SaaS-Abonnementzahlungen über Stripe sind noch nicht angebunden.</p>
      {items.length?<div className="operator-table"><div className="operator-table-head payment"><span>Datum</span><span>Mandant / Kunde</span><span>Betrag</span><span>Status</span><span>Referenz</span></div>{items.map(item=>{const tenant=item.tenant as {name?:string}|undefined;const customer=item.customer as {name?:string}|undefined;const invoice=item.invoice as {number?:string}|undefined;const status=String(item.status??"pending");return <div className="operator-table-row payment" key={String(item.id)}><span>{new Date(String(item.paid_on)).toLocaleDateString("de-CH")}</span><span><b>{tenant?.name??"Mandant"}</b><small>{customer?.name??"Kunde"}</small></span><span>{"CHF "+Number(item.amount??0).toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}</span><span><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}>{status==="booked"?"Verbucht":status==="reversed"?"Storniert":"Ausstehend"}</Status></span><span>{[invoice?.number,item.method].filter(Boolean).join(" · ")||"—"}</span></div>})}</div>:<EmptyState icon="wallet" title="Noch keine Kundenzahlungen" text="Erfasste Rechnungszahlungen erscheinen hier."/>}
    </section>
  </>;
}

function SubscriptionsView() {
  const production=useBackendMode();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);
  const [selected,setSelected]=useState<Record<string,unknown>|null>(null);
  const [toast,setToast]=useState<string|null>(null);

  const load=useCallback(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/accounts")
      .then(payload=>setItems(payload.items))
      .catch(()=>undefined);
  },[production]);
  useEffect(()=>{load();},[load]);

  const updateSelected=async(patch:Record<string,unknown>)=>{
    if(!selected||!production)return;
    try{
      const tenantId=String(selected.tenant_id);
      const payload=await apiPatch<{item:Record<string,unknown>}>("/api/operator/accounts/"+encodeURIComponent(tenantId),patch);
      setSelected(current=>current?{...current,...payload.item}:current);
      await load();
      setToast("Abonnementstatus aktualisiert.");
    }catch(error){setToast(error instanceof Error?error.message:"Abonnement konnte nicht aktualisiert werden.");}
    window.setTimeout(()=>setToast(null),2400);
  };

  if(!production){
    return <>
      <div className="operator-grid thirds">{[["Start","1’128","CHF 19","21’432"],["Business","1’462","CHF 49","71’638"],["Pro","251","CHF 89","22’339"]].map(([plan,count,price,mrr])=><section className="surface subscription-card" key={plan}><small>Plan</small><h2>{plan}</h2><strong>{count} Kunden</strong><p>CHF {mrr} MRR</p><span>{price} / Monat</span><Button variant="secondary">Demo</Button></section>)}</div>
    </>;
  }

  const grouped=["trial","start","business","pro"].map(plan=>({plan,items:items.filter(item=>item.plan===plan)}));
  const price:Record<string,string>={trial:"CHF 0",start:"CHF 19",business:"CHF 49",pro:"CHF 89"};

  return <>
    <div className="operator-grid thirds">
      {grouped.map(group=><section className="surface subscription-card" key={group.plan}><small>Plan</small><h2>{operatorPlan(group.plan)}</h2><strong>{group.items.length} Kunden</strong><p>{group.items.filter(item=>item.subscription_status==="active").length} aktiv</p><span>{price[group.plan]} / Monat</span><Button variant="secondary" onClick={()=>setSelected(group.items[0]??null)}>Kundenstatus</Button></section>)}
    </div>
    <section className="surface operator-table-card">
      <div className="operator-table"><div className="operator-table-head customer"><span>Kunde</span><span>Plan</span><span>Abonnement</span><span>Konto</span><span>Aktualisiert</span></div>{items.map(item=>{const tenant=item.tenant as {name?:string}|undefined;return <button type="button" className="operator-table-row customer" key={String(item.tenant_id)} onClick={()=>setSelected(item)}><span><b>{tenant?.name??"Kunde"}</b><small>{String(item.tenant_id).slice(0,8)}</small></span><span>{operatorPlan(String(item.plan))}</span><span><Status tone={item.subscription_status==="active"?"success":"warning"}>{operatorStatus(String(item.subscription_status))}</Status></span><span><Status tone={item.account_status==="active"?"success":"warning"}>{operatorStatus(String(item.account_status))}</Status></span><span>{new Date(String(item.updated_at)).toLocaleDateString("de-CH")}</span></button>})}</div>
    </section>
    {selected&&<div className="operator-modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}><section className="operator-confirm subscription-detail-modal"><span className="confirm-icon"><Icon name="card"/></span><h2>{String((selected.tenant as {name?:string}|undefined)?.name??"Kunde")}</h2><p>Plan und interner Kontostatus. Externes Stripe-Billing ist noch nicht verbunden.</p><label>Plan<select value={String(selected.plan)} onChange={e=>void updateSelected({plan:e.target.value})}><option value="trial">Testphase</option><option value="start">Start</option><option value="business">Business</option><option value="pro">Pro</option></select></label><label>Abonnement<select value={String(selected.subscription_status)} onChange={e=>void updateSelected({subscriptionStatus:e.target.value})}><option value="trial">Testphase</option><option value="active">Aktiv</option><option value="past_due">Überfällig</option><option value="suspended">Pausiert</option><option value="cancelled">Gekündigt</option></select></label><label>Benutzerlimit<input type="number" min="1" value={String(selected.user_limit??3)} onChange={e=>setSelected(current=>current?{...current,user_limit:Number(e.target.value)}:current)} onBlur={()=>void updateSelected({userLimit:Number(selected.user_limit??3)})}/></label><div><Button variant="secondary" onClick={()=>setSelected(null)}>Schliessen</Button><Button href={"/operator/kunden/"+String(selected.tenant_id)}>Kunde öffnen</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
  </>;
}

function RestrictionsView() {
  const production=useBackendMode();
  const {items:customers}=useOperatorCustomers();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);
  const [tenantId,setTenantId]=useState("");
  const [reason,setReason]=useState("Zahlungsausstand");
  const [scope,setScope]=useState("write");
  const [endsAt,setEndsAt]=useState("");
  const [note,setNote]=useState("");
  const [confirm,setConfirm]=useState<"create"|string|null>(null);
  const [toast,setToast]=useState<string|null>(null);

  const load=useCallback(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/restrictions").then(payload=>setItems(payload.items)).catch(()=>undefined);
  },[production]);

  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(production&&!tenantId&&customers[0]) queueMicrotask(()=>setTenantId(customers[0].id));},[production,tenantId,customers]);

  const createRestriction=async()=>{
    if(!production){setConfirm(null);setToast("Einschränkung im Demo-Modus simuliert.");window.setTimeout(()=>setToast(null),2200);return;}
    try{
      await apiPost("/api/operator/restrictions",{tenantId,scope,reason,note:note.trim()||reason,endsAt:endsAt||null});
      setConfirm(null);setNote("");setEndsAt("");
      await load();
      setToast("Einschränkung erstellt und im Audit protokolliert.");
    }catch(error){setToast(error instanceof Error?error.message:"Einschränkung konnte nicht erstellt werden.");}
    window.setTimeout(()=>setToast(null),2600);
  };

  const removeRestriction=async(id:string)=>{
    if(!production){setConfirm(null);return;}
    try{
      await apiPatch("/api/operator/restrictions/"+encodeURIComponent(id),{active:false});
      setConfirm(null);await load();setToast("Einschränkung aufgehoben.");
    }catch(error){setToast(error instanceof Error?error.message:"Einschränkung konnte nicht aufgehoben werden.");}
    window.setTimeout(()=>setToast(null),2600);
  };

  const active=production?items.filter(item=>item.active===true):[];
  return <>
    <div className="operator-grid">
      <section className="surface restriction-form">
        <SectionTitle title="Einschränkung erstellen"/>
        <div className="form-grid two">
          <label>Kunde<select value={tenantId} onChange={e=>setTenantId(e.target.value)}>{production?customers.map(customer=><option value={customer.id} key={customer.id}>{customer.name}</option>):<option>Meier Handel AG</option>}</select></label>
          <label>Grund<select value={reason} onChange={e=>setReason(e.target.value)}><option>Zahlungsausstand</option><option>Sicherheitsvorfall</option><option>Vertragsende</option><option>Manuelle Prüfung</option></select></label>
          <label>Umfang<select value={scope} onChange={e=>setScope(e.target.value)}><option value="all">Gesamter Zugriff</option><option value="write">Nur Schreibzugriff</option></select></label>
          <label>Ablaufdatum<input type="date" value={endsAt} onChange={e=>setEndsAt(e.target.value)}/></label>
          <label className="full">Interne Begründung<textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Begründung für Audit und interne Nachvollziehbarkeit"/></label>
        </div>
        <Button variant="danger" onClick={()=>setConfirm("create")} disabled={production&&!tenantId}>Einschränkung erstellen</Button>
      </section>
      <section className="surface">
        <SectionTitle title="Aktive Einschränkungen"/>
        {production?(active.length?active.map(item=>{const tenant=item.tenant as {name?:string}|undefined;return <div className="notice" key={String(item.id)}><Status tone="warning">{item.scope==="all"?"Gesperrt":"Eingeschränkt"}</Status><b>{tenant?.name??"Kunde"}</b><span>{String(item.reason??"")} · seit {new Date(String(item.starts_at)).toLocaleDateString("de-CH")}</span><Button variant="secondary" onClick={()=>setConfirm(String(item.id))}>Aufheben</Button></div>}):<EmptyState icon="lock" title="Keine aktiven Einschränkungen" text="Alle Kundenkonten sind ohne Operator-Einschränkung."/>):<div className="notice"><Status tone="warning">Demo</Status><b>Meier Handel AG</b><span>Zahlungsausstand · Beispiel</span><Button variant="secondary" onClick={()=>setConfirm("demo")}>Aufheben</Button></div>}
      </section>
    </div>
    {confirm&&<div className="operator-modal-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirm(null)}}><section className="operator-confirm" role="dialog" aria-modal="true"><span className="confirm-icon"><Icon name="lock"/></span><h2>{confirm==="create"?"Zugriff einschränken?":"Einschränkung aufheben?"}</h2><p>{confirm==="create"?"Der Zugriff wird gemäss Umfang eingeschränkt. Grund, Operator und Zeitpunkt werden im Audit protokolliert.":"Der normale Zugriff wird wiederhergestellt, sofern keine weitere aktive Einschränkung besteht."}</p><div><Button variant="secondary" onClick={()=>setConfirm(null)}>Abbrechen</Button><Button variant={confirm==="create"?"danger":"primary"} onClick={()=>confirm==="create"?void createRestriction():void removeRestriction(confirm)}>{confirm==="create"?"Einschränken":"Aufheben"}</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
  </>;
}


function MonitoringCockpit({services,api,database,availability,errorRate,incidents}:{services:Array<{name:string;status:string;latencyMs?:number|null}>;api:number|null;database:number|null;availability:string;errorRate:string;incidents:Array<Record<string,unknown>>}) {
  const healthy=services.filter(s=>s.status==="operational").length;
  const degraded=services.filter(s=>s.status==="degraded").length;
  const apiBars=api==null?[]:[Math.min(100,Math.max(1,api/10))];
  const dbBars=database==null?[]:[Math.min(100,Math.max(1,database/10))];
  const health=services.length?Math.round(healthy/services.length*100):0;
  const affected=services.length?Math.round(degraded/services.length*100):0;
  return <div className="monitoring-cockpit">
    <div className="monitoring-kpis monitoring-kpis-visual">
      <section><div><span>Service Health</span><strong>{availability}</strong><small>{healthy}/{services.length} Services operational · Momentaufnahme</small></div><div className="monitoring-kpi-ring" style={{"--kpi-value":availability} as React.CSSProperties}><b>{availability}</b></div></section>
      <section><div><span>API Antwortzeit</span><strong>{api==null?"—":api+" ms"}</strong><small>Aktuelle Messung</small></div><div className="monitoring-kpi-bars" aria-hidden="true">{apiBars.map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div></section>
      <section><div><span>Datenbank</span><strong>{database==null?"—":database+" ms"}</strong><small>Aktuelle Abfrage</small></div><div className="monitoring-kpi-bars database" aria-hidden="true">{dbBars.map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div></section>
      <section><div><span>Störungen</span><strong>{incidents.length}</strong><small>{degraded} Services beeinträchtigt</small></div><div className="monitoring-kpi-ring incidents" style={{"--kpi-value":String(affected)+"%"} as React.CSSProperties}><b>{degraded}</b></div></section>
    </div>
    <div className="monitoring-visual-grid monitoring-technical-grid">
      <section className="monitoring-technical-chart"><div className="monitoring-chart-title"><b>API Latenz</b><strong>{api==null?"—":api+" ms"}</strong></div><div className="monitoring-compact-bars">{apiBars.map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div><small>Aktuelle Messung · keine historischen Daten</small></section>
      <section className="monitoring-technical-chart"><div className="monitoring-chart-title"><b>Datenbank</b><strong>{database==null?"—":database+" ms"}</strong></div><div className="monitoring-compact-bars database">{dbBars.map((h,i)=><i key={i} style={{height:h+"%"}}/>)}</div><small>Aktuelle Abfrage · keine historischen Daten</small></section>
      <section className="monitoring-technical-chart"><div className="monitoring-chart-title"><b>Service Health</b><strong>{health}%</strong></div><div className="monitoring-compact-ring" style={{"--health":String(health)+"%"} as React.CSSProperties}><span>{healthy}/{services.length}</span></div><small>Operational verfügbare Services</small></section>
      <section className="monitoring-technical-chart"><div className="monitoring-chart-title"><b>Aktive Störungen</b><strong>{incidents.length}</strong></div><div className="monitoring-compact-ring incidents" style={{"--health":String(affected)+"%"} as React.CSSProperties}><span>{degraded}</span></div><small>Anteil beeinträchtigter Services</small></section>
    </div>
    <div className="monitoring-technical-summary"><b>Technische Übersicht</b><p>Alle zentralen Plattformwerte auf einen Blick: Aktueller Service-Status, API- und Datenbank-Latenz, Service Health und aktive Störungen. INP-Stichproben: {errorRate}. Darunter bleiben Service-Status und Ereignisse für die technische Detailanalyse sichtbar.</p></div>
  </div>;
}

function MonitoringView() {
  const production=useBackendMode();
  const [data,setData]=useState<{services?:Array<{name:string;status:string;detail?:string;key?:string;latencyMs?:number|null}>;incidents?:Array<Record<string,unknown>>;webVitals?:Record<string,{p75:number|null;samples:number;poor:number}>;billingEvents?:Array<Record<string,unknown>>;latencyMs?:{api:number;database:number};build?:{sha?:string|null;node?:string}}>({});
  const [toast,setToast]=useState<string|null>(null);

  useEffect(()=>{
    if(!production) return;
    apiGet<typeof data>("/api/operator/monitoring").then(payload=>queueMicrotask(()=>setData(payload))).catch(()=>undefined);
  },[production]);

  const testEmail=async()=>{
    try{
      await apiPost("/api/operator/integrations/email-test",{});
      setToast("Test-E-Mail wurde an dein Operator-Konto gesendet.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Test-E-Mail konnte nicht gesendet werden.");
    }
    window.setTimeout(()=>setToast(null),2600);
  };

  if(!production) return <MonitoringCockpit services={["Web App","API","Datenbank","Dateispeicher","Zahlungsabwicklung","E-Mail Service"].map((name,i)=>({name,status:i<4?"operational":"degraded",latencyMs:[28,41,16,35,210,184][i]}))} api={182} database={41} availability="99.99 %" errorRate="0.08 %" incidents={[]}/>;

  const services=data.services??[];
  const incidents=data.incidents??[];
  const operational=services.filter(service=>service.status==="operational").length;
  const configured=services.filter(service=>service.status==="configured").length;
  const missing=services.filter(service=>service.status==="not_connected"||service.status==="not_implemented").length;
  const emailReady=services.some(service=>service.key==="email"&&(service.status==="configured"||service.status==="operational"));
  const label=(status:string)=>status==="operational"?"Operational":status==="degraded"?"Beeinträchtigt":status==="configured"?"Konfiguriert":status==="not_implemented"?"Noch nicht implementiert":"Nicht verbunden";
  const vitals=data.webVitals??{};
  const formatVital=(key:string,unit:string)=>vitals[key]?.p75==null?"—":String(vitals[key].p75)+unit;

  return <>
    <MonitoringCockpit services={services} api={data.latencyMs?.api??null} database={data.latencyMs?.database??null} availability={operational&&services.length?((operational/services.length)*100).toFixed(2)+" %":"—"} errorRate={vitals.INP?.poor!=null?String(vitals.INP.poor)+" poor":"—"} incidents={incidents}/>
    <div className="monitoring-panel">
      <div className="monitoring-head"><div><span className="monitoring-dot"/><b>Service-Status</b></div><small>{operational} operational · {configured} konfiguriert · {missing} offen</small></div>
      <div className="monitoring-list">{services.map(service=><div key={service.name}><div><i/><span><b>{service.name}</b><small>{service.detail??(service.status==="operational"?"Binso One":"Externe Integration")}</small></span></div><strong>{label(service.status)}</strong>{service.key==="email"&&emailReady?<Button variant="secondary" onClick={()=>void testEmail()}>Test</Button>:<div className="spark"/>}</div>)}</div>
    </div>
    <section className="surface incident-history">
      <SectionTitle title="Ereignisse"/>
      {incidents.length?incidents.map(item=><div className="incident-row" key={String(item.id)}><span className={"incident-dot "+(String(item.status)==="resolved"?"resolved":"maintenance")}/><div><b>{String(item.title??"Ereignis")}</b><small>{String(item.service??"")} · {new Date(String(item.started_at)).toLocaleString("de-CH")}</small></div><Status tone={String(item.status)==="resolved"?"success":"warning"}>{operatorStatus(String(item.status))}</Status></div>):<EmptyState icon="chart" title="Keine Ereignisse" text="Es sind keine Plattform-Ereignisse erfasst."/>}
    </section>
    {toast&&<Toast title={toast} tone={toast.includes("konnte")?"danger":"success"}/>}
  </>;
}

function AnnouncementsView() {
  const production=useBackendMode();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);
  const [title,setTitle]=useState("");
  const [kind,setKind]=useState("information");
  const [audience,setAudience]=useState("all");
  const [body,setBody]=useState("");
  const [toast,setToast]=useState<string|null>(null);

  const load=useCallback(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/announcements")
      .then(payload=>setItems(payload.items))
      .catch(()=>undefined);
  },[production]);

  useEffect(()=>{load();},[load]);

  const publish=async()=>{
    if(!title.trim()||!body.trim()){
      setToast("Titel und Nachricht sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    if(!production){
      setToast("Ankündigung im Demo-Modus simuliert.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    try{
      const payload=await apiPost<{item:Record<string,unknown>}>("/api/operator/announcements",{title,body,kind,audience,published:true});
      setItems(current=>[payload.item,...current]);
      setTitle("");setBody("");
      setToast("Ankündigung veröffentlicht.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Ankündigung konnte nicht veröffentlicht werden.");
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  const kindLabel:Record<string,string>={information:"Information",maintenance:"Wartung",incident:"Störung",feature:"Neue Funktion"};
  const audienceLabel:Record<string,string>={all:"Alle Kunden",start:"Start",business:"Business",pro:"Pro"};

  return <div className="operator-grid">
    <section className="surface">
      <SectionTitle title="Neue Ankündigung"/>
      <div className="form-grid"><label className="full">Titel<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Kurzer Titel"/></label><label className="full">Typ<select value={kind} onChange={e=>setKind(e.target.value)}><option value="information">Information</option><option value="maintenance">Wartung</option><option value="incident">Störung</option><option value="feature">Neue Funktion</option></select></label><label className="full">Zielgruppe<select value={audience} onChange={e=>setAudience(e.target.value)}><option value="all">Alle Kunden</option><option value="start">Start</option><option value="business">Business</option><option value="pro">Pro</option></select></label><label className="full">Nachricht<textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Nachricht..."/></label></div>
      <Button onClick={()=>void publish()}>Veröffentlichen</Button>
    </section>
    <section className="surface">
      <SectionTitle title="Ankündigungen"/>
      {production?(items.length?<div>{items.map(item=><div className="announcement-card" key={String(item.id)}><Status tone={item.published===true?"success":"neutral"}>{item.published===true?"Veröffentlicht":"Entwurf"}</Status><b>{String(item.title??"")}</b><p>{String(item.body??"")}</p><small>{kindLabel[String(item.kind)]??String(item.kind)} · {audienceLabel[String(item.audience)]??String(item.audience)} · {new Date(String(item.created_at)).toLocaleString("de-CH")}</small></div>)}</div>:<EmptyState icon="bell" title="Noch keine Ankündigungen" text="Veröffentlichte Hinweise erscheinen hier."/>):<div className="announcement-card"><Status tone="info">Demo</Status><b>Neue Rechnungsansicht</b><p>Beispiel-Ankündigung ohne Backend.</p><small>Demo · alle Kunden</small></div>}
    </section>
    {toast&&<Toast title={toast} tone={toast.includes("erforderlich")||toast.includes("konnte")?"danger":"success"}/>}
  </div>;
}

function SecurityView() {
  const production=useBackendMode();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/users")
      .then(payload=>queueMicrotask(()=>setItems(payload.items)))
      .catch(()=>undefined);
  },[production]);

  if(!production) return <>
    <section className="surface">
      <SectionTitle title="Interne Benutzer"/>
      <div className="operator-table"><div className="operator-table-head security"><span>Name</span><span>Rolle</span><span>Status</span><span>Hinweis</span></div>{[["Oemer Cam","Administrator","Aktiv","Demo"],["Maria Bianchi","Support","Aktiv","Demo"],["Luca Schneider","Support","Aktiv","Demo"],["Anna Pross","Finanzen","Aktiv","Demo"]].map(r=><div className="operator-table-row security" key={r[0]}><span><b>{r[0]}</b></span><span>{r[1]}</span><span><Status tone="success">{r[2]}</Status></span><span>{r[3]}</span></div>)}</div>
    </section>
  </>;

  const roleLabel:Record<string,string>={administrator:"Administrator",support:"Support",finance:"Finanzen",readonly:"Nur Lesen"};
  return <>
    <section className="surface">
      <SectionTitle title="Operator-Zugriffe"/>
      <p className="technical-hint">Es werden nur tatsächlich autorisierte Operator-Konten angezeigt. Namen und E-Mail-Adressen werden nicht aus dem Auth-System erfunden.</p>
      {items.length?<div className="operator-table"><div className="operator-table-head security"><span>Benutzer-ID</span><span>Rolle</span><span>Status</span><span>Erstellt</span></div>{items.map(item=><div className="operator-table-row security" key={String(item.user_id)}><span><b>{String(item.user_id).slice(0,12)}…</b></span><span>{roleLabel[String(item.role)]??String(item.role)}</span><span><Status tone={item.active===true?"success":"neutral"}>{item.active===true?"Aktiv":"Inaktiv"}</Status></span><span>{new Date(String(item.created_at)).toLocaleDateString("de-CH")}</span></div>)}</div>:<EmptyState icon="lock" title="Keine Operator-Zugriffe" text="Es sind keine autorisierten internen Benutzer hinterlegt."/>}
    </section>
    <section className="surface security-card"><div className="security-row"><div><b>Operator-Benutzer hinzufügen</b><p>Neue Operator-Konten müssen bewusst über den sicheren Auth- und Berechtigungsprozess provisioniert werden.</p></div><Status tone="neutral">Manuell provisionieren</Status><Button variant="secondary" disabled>Einladen</Button></div></section>
  </>;
}

function AuditView() {
  const production=useBackendMode();
  const [items,setItems]=useState<Array<Record<string,unknown>>>([]);
  const [query,setQuery]=useState("");
  const demoAuditRows=[["10:42","ocam","Kunde aktualisiert","Acme AG (Demo)"],["09:18","lschneider","Sperrung erstellt","Demo"],["Gestern","mbianchi","Ticket Status geändert","#8419 → In Bearbeitung"]].filter(row=>!query.trim()||row.join(" ").toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:Array<Record<string,unknown>>}>("/api/operator/audit")
      .then(payload=>queueMicrotask(()=>setItems(payload.items)))
      .catch(()=>undefined);
  },[production]);

  if(!production) return <section className="surface">
    <div className="operator-toolbar"><span className="operator-demo-filter">Demo · letzte 7 Tage</span><label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Audit durchsuchen..."/></label></div>
    <div className="operator-table"><div className="operator-table-head audit"><span>Zeit</span><span>Benutzer</span><span>Aktion</span><span>Details</span></div>{demoAuditRows.map(r=><div className="operator-table-row audit" key={r.join("-")}>{r.map((x,i)=><span key={i}>{i===2?<b>{x}</b>:x}</span>)}</div>)}</div>
  </section>;

  const visible=items.filter(item=>!query.trim()||JSON.stringify(item).toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="surface">
    <div className="operator-toolbar"><span className="operator-demo-filter">Operator Audit</span><label className="searchbox"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Audit durchsuchen..."/></label></div>
    {visible.length?<div className="operator-table"><div className="operator-table-head audit"><span>Zeit</span><span>Operator</span><span>Aktion</span><span>Ziel</span></div>{visible.map(item=><div className="operator-table-row audit" key={String(item.id)}><span>{new Date(String(item.created_at)).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"})}</span><span>{String(item.operator_user_id).slice(0,8)}</span><span><b>{String(item.action)}</b></span><span>{[item.target_type,item.target_id].filter(Boolean).map(String).join(" · ")||"—"}</span></div>)}</div>:<EmptyState icon="file" title="Keine Audit-Einträge" text="Operator-Aktionen werden hier nachvollziehbar protokolliert."/>}
  </section>;
}
