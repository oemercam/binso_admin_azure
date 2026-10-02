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

      {detail && key === "tickets" ? <TicketDetail/> :
        detail && key === "kunden" ? <OperatorCustomerDetail/> :
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
  return <>
    <div className="metrics-grid">
      <Metric label="Aktive Kunden" value="2’841" hint="+12%" icon="users"/>
      <Metric label="Offene Tickets" value="12" hint="4 in Bearbeitung" icon="support"/>
      <Metric label="Monatlicher Umsatz" value="CHF 49’820" hint="+8%" icon="chart"/>
      <Metric label="Systemstatus" value="Operational" hint="Alle Systeme verfügbar" icon="lock"/>
    </div>

    <div className="operator-grid">
      <section className="surface">
        <SectionTitle title="Support" action={<Link className="text-action" href="/operator/tickets">Alle Tickets</Link>}/>
        <div className="compact-list">{tickets.map(([nr,subject,customer,status])=><div key={nr}><b>{nr} · {subject}</b><span>{customer}</span><Status tone={status==="Offen"?"warning":"info"}>{status}</Status></div>)}</div>
      </section>
      <section className="surface">
        <SectionTitle title="Monitoring" action={<Link className="text-action" href="/operator/monitoring">Details</Link>}/>
        <div className="service-list">{["Web App","API","Datenbank","Dateispeicher","Zahlungsabwicklung","E-Mail Service"].map((s,i)=><div key={s}><span><i/>{s}</span><strong>{i===4?"99.98%":"99.99%"}</strong></div>)}</div>
      </section>
    </div>

    <div className="operator-grid thirds">
      <section className="surface"><SectionTitle title="Zahlungen"/><div className="mini-stat"><span>Erfolgreich</span><strong>184</strong></div><div className="mini-stat"><span>Fehlgeschlagen</span><strong>2</strong></div><div className="mini-stat"><span>Umsatz</span><strong>CHF 49’820</strong></div></section>
      <section className="surface"><SectionTitle title="Sperrungen"/><div className="notice"><Status tone="warning">1 aktiv</Status><b>Meier Handel AG</b><span>Zahlungsausstand seit 14 Tagen</span><Link className="text-action" href="/operator/sperrungen">Details öffnen</Link></div></section>
      <section className="surface"><SectionTitle title="Audit"/><div className="audit-list"><span><b>10:42</b> Kunde aktualisiert · Acme AG</span><span><b>09:18</b> Sperrung erstellt · Meier Handel AG</span><span><b>Gestern</b> Zahlung manuell erfasst</span></div></section>
    </div>
  </>;
}

function TicketsView() {
  return <section className="surface operator-table-card">
    <div className="operator-toolbar"><div className="chips"><button className="active">Alle 124</button><button>Offen 12</button><button>In Bearbeitung 8</button><button>Wartet auf Kunde 6</button><button>Gelöst 98</button></div><label className="searchbox"><Icon name="search"/><input placeholder="Tickets suchen..."/></label></div>
    <div className="operator-table">
      <div className="operator-table-head"><span>Priorität</span><span>Ticket</span><span>Kunde</span><span>Status</span><span>Aktualisiert</span></div>
      {tickets.concat([["#8413","Frage zu Abonnement","Schmid Consulting","In Bearbeitung"],["#8410","Datenexport fehlerhaft","Meier Handel AG","Offen"]]).map(([nr,subject,customer,status],i)=><Link href={`/operator/tickets/${nr.replace("#","")}`} className="operator-table-row" key={nr}><span><i className={i<2?"priority high":"priority"}/>{i<2?"Hoch":"Mittel"}</span><span><b>{nr}</b><small>{subject}</small></span><span>{customer}</span><span><Status tone={status==="Offen"?"warning":"info"}>{status}</Status></span><span>vor {12+i*18} Min.</span></Link>)}
    </div>
  </section>;
}

function TicketDetail() {
  const [reply,setReply]=useState("");
  const [toast,setToast]=useState<string|null>(null);
  const [supportAccess,setSupportAccess]=useState(false);
  const send=()=>{if(!reply.trim())return;setReply("");setToast("Antwort wurde im Ticket ergänzt.");window.setTimeout(()=>setToast(null),2200);};
  return <div className="operator-ticket-layout">
    <section className="surface operator-thread">
      <div className="ticket-meta-bar">
        <label>Status<select defaultValue="progress"><option value="open">Offen</option><option value="progress">In Bearbeitung</option><option value="waiting">Wartet auf Kunde</option><option value="solved">Gelöst</option></select></label>
        <label>Priorität<select defaultValue="high"><option value="normal">Normal</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></label>
        <label>Zugewiesen<select defaultValue="mb"><option value="mb">Maria Bianchi</option><option value="ls">Luca Schneider</option></select></label>
      </div>
      <div className="tabs"><button className="active">Konversation</button><button>Interne Notizen</button><button>Aktivitäten</button></div>
      <article className="operator-message customer"><header><b>Thomas Meier</b><small>10:24</small></header><p>Guten Tag. In der letzten Rechnung sind nicht alle Positionen korrekt aufgeführt. Können Sie das bitte prüfen?</p></article>
      <article className="operator-message support"><header><b>Binso Support</b><small>10:37</small></header><p>Guten Tag Herr Meier. Vielen Dank für die Anfrage. Ich prüfe die Rechnung gerne und melde mich in Kürze bei Ihnen.</p></article>
      <div className="internal-note"><Icon name="lock" size={15}/><div><b>Interne Notiz</b><span>Nur für Operator sichtbar. Kundendaten und Abklärungen hier dokumentieren.</span></div><button className="text-action" onClick={()=>{setToast("Interne Notiz kann jetzt erfasst werden.");window.setTimeout(()=>setToast(null),2200)}}>Notiz hinzufügen</button></div>
      <div className="operator-reply"><textarea value={reply} onChange={e=>setReply(e.target.value)} placeholder="Antwort schreiben..."/><div><button aria-label="Datei anhängen" onClick={()=>{setToast("Dateiauswahl geöffnet.");window.setTimeout(()=>setToast(null),2200)}}><Icon name="upload"/></button><Button onClick={send}>Senden</Button></div></div>
    </section>
    <aside className="surface customer-context">
      <SectionTitle title="Kunde"/>
      <h3>Acme AG</h3><p>K-1001 · CHE-123.456.789</p>
      <Link href="/operator/kunden/acme">Kundendetails öffnen →</Link>
      <div className="context-block"><small>Abonnement</small><b>Business</b><span>CHF 49 / Monat</span><Status tone="success">Aktiv</Status></div>
      <div className="context-block"><small>Zahlungsmittel</small><b>Visa •••• 4242</b></div>
      <div className="context-block"><small>Support-Zugriff</small><b>{supportAccess?"Aktiv · 30 Minuten":"Nicht aktiv"}</b><span>Nur zeitlich begrenzt und auditierbar starten.</span><Button variant="secondary" onClick={()=>{setSupportAccess(!supportAccess);setToast(supportAccess?"Support-Zugriff beendet.":"Support-Zugriff für 30 Minuten gestartet.");window.setTimeout(()=>setToast(null),2200)}}>{supportAccess?"Zugriff beenden":"Zugriff starten"}</Button></div>
    </aside>
    {toast&&<Toast title={toast}/>}
  </div>;
}

function CustomersView() {
  return <section className="surface">
    <div className="operator-toolbar"><label className="searchbox"><Icon name="search"/><input placeholder="Kunden suchen..."/></label><div className="chips"><button className="active">Alle</button><button>Aktiv</button><button>Eingeschränkt</button><button>Gesperrt</button></div></div>
    <div className="operator-table"><div className="operator-table-head customer"><span>Kunde</span><span>Plan</span><span>MRR</span><span>Status</span><span>Letzte Aktivität</span></div>{[["Acme AG","Business","CHF 49","Aktiv"],["Müller GmbH","Start","CHF 19","Aktiv"],["Berger Bau AG","Pro","CHF 89","Aktiv"],["Meier Handel AG","Business","CHF 49","Eingeschränkt"]].map(([name,plan,mrr,status],i)=><Link href={i===0?"/operator/kunden/acme":"#"} className="operator-table-row customer" key={name}><span><b>{name}</b><small>CHE-123.456.789</small></span><span>{plan}</span><span>{mrr}</span><span><Status tone={status==="Aktiv"?"success":"warning"}>{status}</Status></span><span>heute</span></Link>)}</div>
  </section>;
}

function OperatorCustomerDetail() {
  const [toast,setToast]=useState<string|null>(null);
  const notify=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};
  return <>
    <div className="operator-customer-hero">
      <div className="operator-customer-main"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>K-1001 · CHE-123.456.789 · Zürich</p></div></div>
      <div className="operator-customer-actions"><Status tone="success">Aktiv</Status><Button variant="secondary" onClick={()=>notify("Zeitlich begrenzter Support-Zugriff vorbereitet.")}>Support-Zugriff</Button><Button href="/operator/sperrungen" variant="danger">Einschränken</Button></div>
    </div>
    <div className="operator-customer-metrics"><Metric label="Plan" value="Business" hint="CHF 49 / Monat" icon="card"/><Metric label="Benutzer" value="8 / 10" hint="2 Plätze frei" icon="users"/><Metric label="Offene Tickets" value="1" hint="#8421" icon="support"/><Metric label="Zahlungsstatus" value="Bezahlt" hint="Nächste Abbuchung 01.11." icon="wallet"/></div>
    <div className="operator-customer-grid">
      <section className="surface"><SectionTitle title="Konto"/><dl className="operator-detail-list"><div><dt>Firma</dt><dd>Acme AG</dd></div><div><dt>Kontakt</dt><dd>Thomas Meier · thomas@acme.ch</dd></div><div><dt>Erstellt</dt><dd>14.02.2025</dd></div><div><dt>Letzte Anmeldung</dt><dd>Heute, 10:31</dd></div><div><dt>Mandant</dt><dd>tenant_acme_ch</dd></div></dl></section>
      <section className="surface"><SectionTitle title="Abonnement"/><div className="context-block"><small>Plan</small><b>Business</b><span>CHF 49 / Monat</span><Status tone="success">Aktiv</Status></div><div className="context-block"><small>Zahlungsmittel</small><b>Visa •••• 4242</b><span>Letzte Zahlung 01.10.2026</span></div><Button href="/operator/abonnemente" variant="secondary">Abonnement öffnen</Button></section>
      <section className="surface"><SectionTitle title="Support"/><div className="compact-list"><Link href="/operator/tickets/8421"><b>#8421 · Rechnungsstellung unklar</b><span>Heute 10:42</span><Status tone="warning">Offen</Status></Link><div><b>#8112 · Datenexport</b><span>18.08.2026</span><Status tone="success">Gelöst</Status></div></div></section>
      <section className="surface"><SectionTitle title="Audit"/><div className="audit-list"><span><b>10:42</b> Ticket #8421 erstellt</span><span><b>09:18</b> Benutzer angemeldet</span><span><b>01.10.</b> Zahlung CHF 49.00 verbucht</span><span><b>28.09.</b> Rechnungseinstellungen geändert</span></div></section>
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