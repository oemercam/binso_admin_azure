"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "./app-shell";
import { Button, EmptyState, Field, Icon, Metric, SectionTitle, Status } from "./ui";

const customers = [
  ["Acme AG","Bauunternehmen","Zürich","Aktiv"],
  ["Müller GmbH","Immobilien","Bern","Aktiv"],
  ["Berger Bau AG","Bauunternehmen","Luzern","Aktiv"],
  ["Huber & Söhne","Elektro","St. Gallen","Aktiv"],
  ["Schmid Consulting","Beratung","Zug","Inaktiv"],
  ["Meier Handel AG","Handel","Basel","Aktiv"],
];

const invoices = [
  ["RE-2026-019","Acme AG","12.09.2026","CHF 4’346.40","Bezahlt"],
  ["RE-2026-018","Müller GmbH","10.09.2026","CHF 1’200.00","Offen"],
  ["RE-2026-017","Berger Bau AG","08.09.2026","CHF 3’700.00","Überfällig"],
  ["RE-2026-016","Huber & Söhne","28.08.2026","CHF 950.00","Bezahlt"],
  ["RE-2026-015","Schmid Consulting","20.08.2026","CHF 1’745.00","Offen"],
];

const offers = [
  ["AN-2026-012","Acme AG","CHF 7’264.32","Gesendet"],
  ["AN-2026-011","Müller GmbH","CHF 3’200.00","Entwurf"],
  ["AN-2026-010","Berger Bau AG","CHF 9’480.00","Angenommen"],
  ["AN-2026-009","Huber & Söhne","CHF 2’190.00","Abgelaufen"],
];

const products = [
  ["Beratung","Dienstleistung","CHF 120.00","Aktiv"],
  ["Website Konzept","Dienstleistung","CHF 120.00","Aktiv"],
  ["Entwicklung","Dienstleistung","CHF 120.00","Aktiv"],
  ["Wartung","Dienstleistung","CHF 90.00","Aktiv"],
  ["Hosting Paket","Produkt","CHF 25.00","Aktiv"],
];

const employees = [
  ["Thomas Müller","Inhaber","100%","Aktiv"],
  ["Sarah Meier","Administration","80%","Aktiv"],
  ["Lukas Weber","Projektleitung","100%","Aktiv"],
  ["Nina Schmid","Buchhaltung","60%","Aktiv"],
];

const expenses = [
  ["Hotel Schweizerhof","Thomas Müller","CHF 280.00","Eingereicht"],
  ["SBB Zugticket","Sarah Meier","CHF 89.00","Genehmigt"],
  ["Geschäftsessen","Lukas Weber","CHF 120.00","Genehmigt"],
  ["Büromaterial","Nina Schmid","CHF 64.50","Entwurf"],
];

function tone(s: string): "success"|"danger"|"warning"|"neutral"|"info" {
  if (["Bezahlt","Aktiv","Genehmigt","Angenommen","Verbucht","Gelöst"].includes(s)) return "success";
  if (["Überfällig","Abgelehnt","Abgelaufen"].includes(s)) return "danger";
  if (["Offen","Eingereicht","Gesendet","Ausstehend"].includes(s)) return "warning";
  if (["In Bearbeitung"].includes(s)) return "info";
  return "neutral";
}

function ListToolbar({ placeholder, chips = ["Alle","Aktiv","Inaktiv"] }: { placeholder: string; chips?: string[] }) {
  return <div className="toolbar">
    <label className="searchbox"><Icon name="search"/><input placeholder={placeholder}/></label>
    <div className="chips">{chips.map((x,i)=><button type="button" className={i===0?"active":""} key={x}>{x}</button>)}</div>
    <button className="filter-button" type="button"><Icon name="filter" size={17}/><span>Filter</span></button>
  </div>;
}

function RecordRow({ href, icon, title, meta, value, status }: { href?: string; icon?: string; title: string; meta: string; value?: string; status?: string }) {
  const body = <>
    {icon ? <span className="activity-icon"><Icon name={icon}/></span> : <span className="record-avatar">{title[0]}</span>}
    <div className="record-main"><b>{title}</b><small>{meta}</small></div>
    {value && <strong>{value}</strong>}
    {status && <Status tone={tone(status)}>{status}</Status>}
    <Icon name="arrow" size={17}/>
  </>;
  return href ? <Link href={href} className="record">{body}</Link> : <div className="record">{body}</div>;
}

export function DashboardPage() {
  return <AppShell title="Guten Morgen, Thomas" subtitle="Hier ist die Übersicht zu deinem Unternehmen." active="dashboard" actions={<Button href="/rechnungen/neu" icon="plus">Neue Rechnung</Button>}>
    <div className="metrics-grid">
      <Metric label="Umsatz im Monat" value="CHF 24’500" hint="+12% zum Vormonat" icon="chart"/>
      <Metric label="Offene Rechnungen" value="CHF 12’800" hint="8 Rechnungen" icon="receipt"/>
      <Metric label="Kunden" value="42" hint="+3 diesen Monat" icon="users"/>
      <Metric label="Zeit diese Woche" value="28:15 h" hint="4 aktive Projekte" icon="clock"/>
    </div>

    <div className="dashboard-grid">
      <section className="surface">
        <SectionTitle title="Umsatzentwicklung"/>
        <div className="big-chart">{[42,54,47,68,61,76,70,84,72,90,86,96].map((h,i)=><div key={i}><i style={{height:`${h}%`}}/><span>{["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][i]}</span></div>)}</div>
      </section>
      <section className="surface">
        <SectionTitle title="Letzte Aktivitäten" action={<Link href="/rechnungen">Alle anzeigen</Link>}/>
        <div className="activity-list">
          {[
            ["Rechnung bezahlt","Acme AG · CHF 4’346.40","receipt"],
            ["Neuer Kunde","Berger Bau AG","users"],
            ["Angebot angenommen","Müller GmbH · CHF 3’200.00","file"],
            ["Zeit erfasst","Website Redesign · 4:30 h","clock"],
          ].map(([a,b,c])=><div key={a}><span className="activity-icon"><Icon name={c}/></span><div><b>{a}</b><small>{b}</small></div><Icon name="arrow" size={16}/></div>)}
        </div>
      </section>
    </div>

    <section className="quick-section">
      <SectionTitle title="Schnellzugriff"/>
      <div className="quick-grid">
        <Button href="/kunden/neu" variant="secondary" icon="users">Kunde erfassen</Button>
        <Button href="/angebote/neu" variant="secondary" icon="file">Angebot erstellen</Button>
        <Button href="/rechnungen/neu" variant="secondary" icon="receipt">Rechnung erstellen</Button>
        <Button href="/zeit" variant="secondary" icon="clock">Zeit erfassen</Button>
      </div>
    </section>
  </AppShell>;
}

export function WelcomePage() {
  return <AppShell title="Willkommen bei Binso One" subtitle="Was möchtest du zuerst machen?" active="dashboard">
    <div className="welcome-grid">
      <Link href="/kunden/neu"><span><Icon name="users"/></span><div><b>Kunde erfassen</b><small>Neuen Kunden anlegen</small></div><Icon name="arrow"/></Link>
      <Link href="/angebote/neu"><span><Icon name="file"/></span><div><b>Angebot erstellen</b><small>Professionelles Angebot in wenigen Schritten</small></div><Icon name="arrow"/></Link>
      <Link href="/rechnungen/neu"><span><Icon name="receipt"/></span><div><b>Rechnung erstellen</b><small>Direkt mit Live-Vorschau</small></div><Icon name="arrow"/></Link>
      <Link href="/dashboard"><span><Icon name="home"/></span><div><b>Binso One kennenlernen</b><small>Mit Beispieldaten starten</small></div><Icon name="arrow"/></Link>
    </div>
    <p className="onboarding-hint">Du kannst Firmendaten, Logo, MwSt. und Zahlungsbedingungen später unter Einstellungen ergänzen.</p>
  </AppShell>;
}

export function CustomersPage() {
  return <AppShell title="Kunden" subtitle="Kunden, Kontakte und Aktivitäten zentral verwalten." active="kunden" actions={<Button href="/kunden/neu" icon="plus">Neuer Kunde</Button>}>
    <div className="tablet-master-detail">
      <div>
        <ListToolbar placeholder="Kunden suchen..."/>
        <div className="records">{customers.map(([name,sector,city,status])=><RecordRow href="/kunden/acme" key={name} title={name} meta={`${sector} · ${city}`} status={status}/>)}</div>
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

export function CustomerDetail() {
  return <AppShell title="Acme AG" subtitle="Bauunternehmen · Zürich" active="kunden" backHref="/kunden" backLabel="Kunden" actions={<><Button href="/angebote/neu" variant="secondary">Angebot erstellen</Button><Button href="/rechnungen/neu">Rechnung erstellen</Button></>}>
    <div className="entity-hero"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>Bauunternehmen · Zürich</p></div><Status tone="success">Aktiv</Status></div>
    <div className="tabs"><button className="active">Übersicht</button><button>Kontakte</button><button>Belege</button><button>Aktivität</button></div>
    <div className="detail-grid">
      <section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>Acme AG</dd></div><div><dt>E-Mail</dt><dd>info@acme.ch</dd></div><div><dt>Telefon</dt><dd>+41 44 123 45 67</dd></div><div><dt>Adresse</dt><dd>Bahnhofstrasse 123<br/>8001 Zürich</dd></div><div><dt>UID</dt><dd>CHE-123.456.789</dd></div></dl></section>
      <section className="surface"><SectionTitle title="Letzte Belege" action={<Link href="/rechnungen">Alle anzeigen</Link>}/><div className="compact-list"><div><b>RE-2026-019</b><span>CHF 4’346.40</span><Status tone="success">Bezahlt</Status></div><div><b>AN-2026-012</b><span>CHF 7’264.32</span><Status tone="warning">Gesendet</Status></div><div><b>RE-2026-015</b><span>CHF 1’200.00</span><Status tone="warning">Offen</Status></div></div></section>
    </div>
  </AppShell>;
}

export function CustomerForm() {
  return <AppShell title="Kunde erstellen" subtitle="Nur die wichtigsten Angaben. Details kannst du später ergänzen." active="kunden" backHref="/kunden" backLabel="Kunden" actions={<Button href="/kunden/acme">Speichern</Button>}>
    <div className="form-page">
      <section className="form-section clean">
        <h2>Grundangaben</h2>
        <div className="form-grid two">
          <Field label="Firmenname"><input autoFocus placeholder="Firma oder Name"/></Field>
          <Field label="E-Mail"><input type="email" placeholder="name@firma.ch"/></Field>
          <Field label="Telefon"><input type="tel" inputMode="tel" placeholder="+41 00 000 00 00"/></Field>
          <Field label="Ort"><input placeholder="Zürich"/></Field>
        </div>
      </section>
      <details className="optional-details"><summary>Weitere Angaben</summary><div className="form-grid two"><Field label="Adresse"><input placeholder="Strasse und Nummer"/></Field><Field label="PLZ"><input inputMode="numeric" placeholder="8000"/></Field><Field label="UID"><input placeholder="CHE-000.000.000"/></Field><Field label="Interne Notiz"><input placeholder="Optional"/></Field></div></details>
      <div className="mobile-sticky-save"><Button href="/kunden/acme">Kunde speichern</Button></div>
    </div>
  </AppShell>;
}

export function OffersPage() {
  return <AppShell title="Angebote" subtitle="Professionelle Angebote in wenigen Klicks erstellen." active="angebote" actions={<Button href="/angebote/neu" icon="plus">Neues Angebot</Button>}>
    <ListToolbar placeholder="Angebote suchen..." chips={["Alle","Entwurf","Gesendet","Angenommen"]}/>
    <div className="records">{offers.map(([nr,name,amount,status])=><RecordRow href={`/angebote/${nr}`} key={nr} icon="file" title={nr} meta={name} value={amount} status={status}/>)}</div>
  </AppShell>;
}

export function OfferEditor({ existing = false }: { existing?: boolean }) {
  const [preview, setPreview] = useState(false);
  return <AppShell title={existing ? "Angebot AN-2026-012" : "Angebot erstellen"} subtitle={existing ? "Gesendet · gültig bis 31.10.2026" : "Entwurf automatisch gespeichert"} active="angebote" backHref="/angebote" backLabel="Angebote" actions={<><Button variant="secondary" onClick={() => setPreview(true)}>Vorschau</Button><Button href="/angebote/AN-2026-012">{existing ? "Speichern" : "Angebot erstellen"}</Button></>}>
    <DocumentEditor type="Angebot" number="AN-2026-012"/>
    {preview && <DocumentModal title="Angebotsvorschau" onClose={() => setPreview(false)}><OfferPreview/></DocumentModal>}
  </AppShell>;
}

export function InvoicesPage() {
  return <AppShell title="Rechnungen" subtitle="Erstellen, senden und Zahlungsstatus im Blick behalten." active="rechnungen" actions={<Button href="/rechnungen/neu" icon="plus">Neue Rechnung</Button>}>
    <ListToolbar placeholder="Rechnungen suchen..." chips={["Alle","Offen","Bezahlt","Überfällig"]}/>
    <div className="records invoices">{invoices.map(([nr,name,date,amount,status])=><RecordRow href={`/rechnungen/${nr}`} key={nr} icon="receipt" title={nr} meta={`${name} · ${date}`} value={amount} status={status}/>)}</div>
  </AppShell>;
}

export function InvoiceEditor({ existing = false }: { existing?: boolean }) {
  const [preview, setPreview] = useState(false);
  return <AppShell title={existing ? "Rechnung RE-2026-019" : "Rechnung erstellen"} subtitle={existing ? "Bezahlt · Acme AG" : "Entwurf automatisch gespeichert"} active="rechnungen" backHref="/rechnungen" backLabel="Rechnungen" actions={<><Button variant="secondary" onClick={() => setPreview(true)}>Vorschau</Button><Button>{existing ? "Speichern" : "Rechnung erstellen"}</Button></>}>
    {existing && <div className="document-actions"><Button variant="secondary" icon="mail">Senden</Button><Button href="/zahlungen/neu" variant="secondary" icon="wallet">Zahlung erfassen</Button><Button variant="ghost">Duplizieren</Button></div>}
    <DocumentEditor type="Rechnung" number="RE-2026-019"/>
    {preview && <DocumentModal title="Rechnungsvorschau" onClose={() => setPreview(false)}><InvoicePreview/></DocumentModal>}
  </AppShell>;
}

function DocumentEditor({ type, number }: { type: "Rechnung" | "Angebot"; number: string }) {
  return <div className="invoice-workspace">
    <section className="invoice-form">
      <div className="form-section"><h2>Kunde</h2><div className="select-card"><div><b>Acme AG</b><small>Bauunternehmen · Zürich</small></div><Icon name="arrow"/></div></div>
      <div className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid">
          <Field label={type === "Rechnung" ? "Rechnungsnummer" : "Angebotsnummer"}><input defaultValue={number}/></Field>
          <Field label={type === "Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><input type="date" defaultValue="2026-10-02"/></Field>
          <Field label={type === "Rechnung" ? "Zahlungsziel" : "Gültig bis"}>{type === "Rechnung" ? <select defaultValue="30"><option value="30">30 Tage</option><option value="10">10 Tage</option></select> : <input type="date" defaultValue="2026-10-31"/>}</Field>
        </div>
      </div>
      <div className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="text-action" type="button">+ Position hinzufügen</button></div>
        <div className="line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span></div>
          <div><input defaultValue="Website Konzept"/><input inputMode="decimal" defaultValue="24"/><input inputMode="decimal" defaultValue="120.00"/><b>2’880.00</b></div>
          <div><input defaultValue="Design & Umsetzung"/><input inputMode="decimal" defaultValue="12"/><input inputMode="decimal" defaultValue="95.00"/><b>1’140.00</b></div>
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>CHF 4’020.00</b></span><span>MwSt. 8.1% <b>CHF 326.40</b></span><strong>Total <b>CHF 4’346.40</b></strong></div>
      </div>
      <div className="form-section optional-row">
        <Field label="Notiz"><textarea placeholder="Optionaler Text für den Kunden"/></Field>
      </div>
    </section>
    <aside className="desktop-document-preview"><h2>Live-Vorschau</h2>{type === "Rechnung" ? <InvoicePreview/> : <OfferPreview/>}</aside>
  </div>;
}

function DocumentModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="document-modal" role="dialog" aria-modal="true">
    <header><button type="button" onClick={onClose}><Icon name="back"/>Schliessen</button><strong>{title}</strong><button type="button" aria-label="Teilen"><Icon name="upload"/></button></header>
    <div className="document-modal-body">{children}</div>
  </div>;
}

export function InvoicePreview() {
  return <div className="paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>RECHNUNG</span></div>
    <div className="paper-meta"><div><b>Acme AG</b><span>Bahnhofstrasse 123</span><span>8001 Zürich</span></div><div><small>Rechnung Nr.</small><b>RE-2026-019</b><small>Datum</small><b>02.10.2026</b><small>Zahlbar bis</small><b>01.11.2026</b></div></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody><tr><td>Website Konzept</td><td>24</td><td>120.00</td><td>2’880.00</td></tr><tr><td>Design & Umsetzung</td><td>12</td><td>95.00</td><td>1’140.00</td></tr></tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>4’020.00</b></span><span>MwSt. 8.1% <b>326.40</b></span><strong>Total CHF <b>4’346.40</b></strong></div>
    <footer>Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · Schweiz</footer>
  </div>;
}

export function OfferPreview() {
  return <div className="paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>ANGEBOT</span></div>
    <div className="paper-meta"><div><b>Acme AG</b><span>Bahnhofstrasse 123</span><span>8001 Zürich</span></div><div><small>Angebot Nr.</small><b>AN-2026-012</b><small>Datum</small><b>02.10.2026</b><small>Gültig bis</small><b>31.10.2026</b></div></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody><tr><td>Website Konzept</td><td>24</td><td>120.00</td><td>2’880.00</td></tr><tr><td>Design & Umsetzung</td><td>12</td><td>95.00</td><td>1’140.00</td></tr></tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>4’020.00</b></span><span>MwSt. 8.1% <b>326.40</b></span><strong>Total CHF <b>4’346.40</b></strong></div>
    <footer>Vielen Dank für dein Vertrauen.</footer>
  </div>;
}

export function PaymentsPage() {
  return <AppShell title="Zahlungen" subtitle="Eingänge und offene Beträge übersichtlich verwalten." active="zahlungen" actions={<Button href="/zahlungen/neu" icon="plus">Zahlung erfassen</Button>}>
    <div className="metrics-grid three"><Metric label="Eingegangen" value="CHF 49’820" hint="diesen Monat" icon="wallet"/><Metric label="Offen" value="CHF 12’800" hint="8 Rechnungen" icon="receipt"/><Metric label="Überfällig" value="CHF 3’700" hint="1 Rechnung" icon="clock"/></div>
    <ListToolbar placeholder="Zahlungen suchen..." chips={["Alle","Verbucht","Ausstehend"]}/>
    <div className="records">
      <RecordRow href="/zahlungen/1" icon="wallet" title="02.10.2026 · Acme AG" meta="RE-2026-019 · Banküberweisung" value="CHF 4’346.40" status="Verbucht"/>
      <RecordRow href="/zahlungen/2" icon="wallet" title="30.09.2026 · Müller GmbH" meta="RE-2026-018 · Karte" value="CHF 1’200.00" status="Verbucht"/>
      <RecordRow icon="wallet" title="28.09.2026 · Schmid Consulting" meta="RE-2026-015" value="CHF 1’745.00" status="Ausstehend"/>
    </div>
  </AppShell>;
}

export function PaymentForm() {
  return <AppShell title="Zahlung erfassen" subtitle="Rechnungsdaten werden automatisch übernommen." active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen" actions={<Button href="/zahlungen">Zahlung speichern</Button>}>
    <div className="form-page narrow">
      <section className="payment-context"><span className="activity-icon"><Icon name="receipt"/></span><div><small>Rechnung</small><b>RE-2026-019 · Acme AG</b><span>Offener Betrag CHF 4’346.40</span></div></section>
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><input type="date" defaultValue="2026-10-02"/></Field>
        <Field label="Betrag"><input inputMode="decimal" defaultValue="4346.40"/></Field>
        <Field label="Zahlungsmethode"><select defaultValue="bank"><option value="bank">Banküberweisung</option><option>Kreditkarte</option><option>TWINT</option><option>Bar</option></select></Field>
        <Field label="Notiz"><input placeholder="Optional"/></Field>
      </div>
      <div className="mobile-sticky-save"><Button href="/zahlungen">Zahlung speichern</Button></div>
    </div>
  </AppShell>;
}

export function PaymentDetail() {
  return <AppShell title="Zahlung" subtitle="RE-2026-019 · Acme AG" active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="success-panel"><span><Icon name="check" size={28}/></span><h2>CHF 4’346.40</h2><p>Zahlung erfolgreich verbucht</p><Status tone="success">Verbucht</Status></div>
    <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>02.10.2026</dd></div><div><dt>Rechnung</dt><dd>RE-2026-019</dd></div><div><dt>Kunde</dt><dd>Acme AG</dd></div><div><dt>Zahlungsart</dt><dd>Banküberweisung</dd></div></dl></section>
  </AppShell>;
}

export function ProductsPage() {
  return <AppShell title="Produkte" subtitle="Produkte und Dienstleistungen zentral verwalten." active="produkte" actions={<Button href="/produkte/neu" icon="plus">Neues Produkt</Button>}>
    <ListToolbar placeholder="Produkte suchen..." chips={["Alle","Dienstleistungen","Produkte"]}/>
    <div className="records">{products.map(([name,type,price,status])=><RecordRow href="/produkte/beratung" key={name} icon="box" title={name} meta={type} value={price} status={status}/>)}</div>
  </AppShell>;
}

export function ProductForm({ existing = false }: { existing?: boolean }) {
  return <AppShell title={existing ? "Beratung" : "Produkt erstellen"} subtitle={existing ? "Dienstleistung · Aktiv" : "Für Angebote und Rechnungen wiederverwendbar."} active="produkte" backHref="/produkte" backLabel="Produkte" actions={<Button href="/produkte">Speichern</Button>}>
    <div className="form-page">
      <div className="form-grid two">
        <Field label="Name"><input defaultValue={existing ? "Beratung" : ""} placeholder="Name"/></Field>
        <Field label="Typ"><select defaultValue="service"><option value="service">Dienstleistung</option><option value="product">Produkt</option></select></Field>
        <Field label="Artikelnummer"><input placeholder="Optional"/></Field>
        <Field label="Einheit"><select><option>Stunde</option><option>Stück</option><option>Pauschal</option></select></Field>
        <Field label="Verkaufspreis"><input inputMode="decimal" defaultValue={existing ? "120.00" : ""} placeholder="0.00"/></Field>
        <Field label="MwSt."><select defaultValue="8.1"><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
        <Field label="Beschreibung" className="full"><textarea placeholder="Kurze Beschreibung"/></Field>
      </div>
    </div>
  </AppShell>;
}

export function EmployeesPage() {
  return <AppShell title="Mitarbeiter" subtitle="Team, Rollen und Stammdaten verwalten." active="mitarbeiter" actions={<Button href="/mitarbeiter/neu" icon="plus">Mitarbeiter</Button>}>
    <ListToolbar placeholder="Mitarbeiter suchen..."/>
    <div className="records">{employees.map(([name,role,load,status])=><RecordRow href="/mitarbeiter/thomas" key={name} icon="users" title={name} meta={`${role} · ${load}`} status={status}/>)}</div>
  </AppShell>;
}

export function EmployeeForm({ existing = false }: { existing?: boolean }) {
  return <AppShell title={existing ? "Thomas Müller" : "Mitarbeiter hinzufügen"} subtitle={existing ? "Inhaber · 100%" : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter" actions={<Button href="/mitarbeiter">Speichern</Button>}>
    {existing && <div className="tabs"><button className="active">Übersicht</button><button>Arbeitszeit</button><button>Spesen</button><button>Dokumente</button></div>}
    <div className="form-page">
      <div className="form-grid two">
        <Field label="Vorname"><input defaultValue={existing ? "Thomas" : ""}/></Field>
        <Field label="Nachname"><input defaultValue={existing ? "Müller" : ""}/></Field>
        <Field label="E-Mail"><input type="email" defaultValue={existing ? "thomas@firma.ch" : ""}/></Field>
        <Field label="Telefon"><input type="tel" inputMode="tel"/></Field>
        <Field label="Funktion"><input defaultValue={existing ? "Inhaber" : ""}/></Field>
        <Field label="Pensum"><input inputMode="numeric" defaultValue={existing ? "100" : ""} placeholder="%"/></Field>
        <Field label="Eintritt"><input type="date" defaultValue={existing ? "2024-01-01" : ""}/></Field>
        <Field label="Status"><select><option>Aktiv</option><option>Inaktiv</option></select></Field>
      </div>
    </div>
  </AppShell>;
}

export function ExpensesPage() {
  return <AppShell title="Spesen" subtitle="Belege erfassen, prüfen und freigeben." active="spesen" actions={<Button href="/spesen/neu" icon="plus">Spese erfassen</Button>}>
    <ListToolbar placeholder="Spesen suchen..." chips={["Alle","Eingereicht","Genehmigt","Entwurf"]}/>
    <div className="records">{expenses.map(([title,person,amount,status])=><RecordRow href="/spesen/1" key={title} icon="card" title={title} meta={person} value={amount} status={status}/>)}</div>
  </AppShell>;
}

export function ExpenseForm({ existing = false }: { existing?: boolean }) {
  return <AppShell title={existing ? "Hotel Schweizerhof" : "Spese erfassen"} subtitle={existing ? "Thomas Müller · Eingereicht" : "Beleg fotografieren oder Datei auswählen."} active="spesen" backHref="/spesen" backLabel="Spesen" actions={<Button href="/spesen">{existing ? "Speichern" : "Einreichen"}</Button>}>
    <div className="expense-layout">
      <button className="receipt-upload" type="button"><span><Icon name="upload" size={25}/></span><b>Beleg hinzufügen</b><small>Kamera oder Datei verwenden</small></button>
      <div className="form-page">
        <div className="form-grid two">
          <Field label="Mitarbeiter"><select><option>Thomas Müller</option><option>Sarah Meier</option></select></Field>
          <Field label="Datum"><input type="date" defaultValue="2026-10-02"/></Field>
          <Field label="Kategorie"><select><option>Reise</option><option>Verpflegung</option><option>Material</option></select></Field>
          <Field label="Betrag"><input inputMode="decimal" defaultValue={existing ? "280.00" : ""} placeholder="0.00"/></Field>
          <Field label="Währung"><select><option>CHF</option><option>EUR</option></select></Field>
          <Field label="MwSt."><select><option>8.1%</option><option>2.6%</option><option>0%</option></select></Field>
          <Field label="Beschreibung" className="full"><textarea defaultValue={existing ? "Übernachtung Kundentermin Zürich" : ""} placeholder="Kurze Beschreibung"/></Field>
        </div>
      </div>
    </div>
  </AppShell>;
}

export function TimePage() {
  return <AppShell title="Zeiterfassung" subtitle="Arbeitszeit einfach und präzise erfassen." active="zeit">
    <div className="time-layout">
      <section className="surface timer-card">
        <div className="tabs"><button className="active">Timer</button><button>Einträge</button></div>
        <div className="timer-project"><small>Projekt</small><button type="button">Website Redesign · Acme AG <Icon name="down" size={16}/></button></div>
        <div className="timer-ring"><div><small>Läuft</small><strong>02:14:27</strong><span>Heute, 09:27</span></div></div>
        <Button icon="pause">Pause</Button>
      </section>
      <section className="surface">
        <SectionTitle title="Heute" action={<strong>4:28 h</strong>}/>
        <div className="compact-list"><div><b>Website Redesign</b><span>Acme AG</span><strong>2:14</strong></div><div><b>Kundenmeeting</b><span>Müller GmbH</span><strong>1:30</strong></div><div><b>Planung</b><span>Intern</span><strong>0:44</strong></div></div>
        <Button variant="secondary" icon="plus" className="full-button">Manuell erfassen</Button>
      </section>
    </div>
  </AppShell>;
}

export function SupportPage() {
  return <AppShell title="Support" subtitle="Hilfe direkt in Binso One – persönlich und nachvollziehbar." active="support" actions={<Button href="/support/neu" icon="plus">Neue Anfrage</Button>}>
    <div className="support-summary"><Metric label="Offen" value="2" hint="aktuelle Tickets" icon="support"/><Metric label="Gelöst" value="14" hint="letzte 90 Tage" icon="check"/></div>
    <div className="records">
      <RecordRow href="/support/5832" icon="support" title="#5832 · Frage zur Rechnung" meta="vor 12 Minuten" status="Offen"/>
      <RecordRow href="/support/5828" icon="support" title="#5828 · Zeiterfassung" meta="vor 1 Stunde" status="In Bearbeitung"/>
      <RecordRow href="/support/5814" icon="support" title="#5814 · Datenexport" meta="vor 1 Tag" status="Gelöst"/>
    </div>
  </AppShell>;
}

export function SupportTicketForm() {
  return <AppShell title="Neue Support-Anfrage" subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref="/support" backLabel="Support" actions={<Button href="/support/5832">Ticket erstellen</Button>}>
    <div className="form-page narrow">
      <div className="form-grid">
        <Field label="Betreff" className="full"><input autoFocus placeholder="Worum geht es?"/></Field>
        <Field label="Kategorie" className="full"><select><option>Allgemeine Frage</option><option>Rechnung</option><option>Zeiterfassung</option><option>Technisches Problem</option></select></Field>
        <Field label="Nachricht" className="full"><textarea placeholder="Beschreibe dein Anliegen kurz..."/></Field>
      </div>
      <button className="attachment-button" type="button"><Icon name="upload"/><span>Screenshot oder Datei hinzufügen</span></button>
      <p className="technical-hint">Browser, App-Version und Zeitpunkt werden automatisch mitgesendet.</p>
    </div>
  </AppShell>;
}

export function SupportChat() {
  return <AppShell title="Ticket #5832" subtitle="Frage zur Rechnung" active="support" backHref="/support" backLabel="Support" actions={<Status tone="warning">Offen</Status>}>
    <div className="support-thread">
      <div className="thread-day">Heute</div>
      <article className="message message-user"><div>Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?</div><small>10:24</small></article>
      <article className="message message-support"><span>Binso Support</span><div>Hallo Thomas. Gerne helfe ich dir weiter. Um welche Rechnung geht es genau?</div><small>10:37</small></article>
      <article className="message message-user"><div>Es geht um die Rechnung RE-2026-019 von Acme AG.</div><small>10:41</small></article>
      <article className="message message-support"><span>Binso Support</span><div>Super, ich schaue das gerne für dich nach.</div><small>10:42</small></article>
      <div className="thread-composer"><button type="button" aria-label="Datei anhängen"><Icon name="upload"/></button><input placeholder="Nachricht schreiben..."/><button type="button" aria-label="Senden"><Icon name="arrow"/></button></div>
    </div>
  </AppShell>;
}

export function SettingsPage() {
  return <AppShell title="Einstellungen" subtitle="Firma, Konto, Sicherheit und Abonnement." active="einstellungen">
    <div className="settings-list">
      {[
        ["user","Persönliche Daten","Name, E-Mail und Sprache"],
        ["users","Firma","Unternehmensdaten und Rechnungseinstellungen"],
        ["card","Abonnement","Business · CHF 49 / Monat"],
        ["bell","Benachrichtigungen","E-Mail und Push"],
        ["lock","Sicherheit","Passwort, Sitzungen und Geräte"],
        ["settings","Darstellung","Hell oder Dunkel"],
        ["support","Hilfe und Support","Tickets und Kontakt"],
      ].map(([icon,title,text])=><Link href="#" key={title}><span className="settings-icon"><Icon name={icon}/></span><div><b>{title}</b><small>{text}</small></div><Icon name="arrow" size={17}/></Link>)}
    </div>
    <section className="subscription-panel">
      <div><small>Aktueller Plan</small><h2>Business</h2><p>CHF 49 / Monat · nächste Rechnung am 01.11.2026</p></div>
      <Button variant="secondary">Plan verwalten</Button>
    </section>
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
  return <AppShell title="Noch keine Einträge" active="dashboard"><EmptyState icon="file" title="Noch nichts vorhanden" text="Erstelle deinen ersten Eintrag, um loszulegen." action={<Button icon="plus">Erstellen</Button>}/></AppShell>;
}