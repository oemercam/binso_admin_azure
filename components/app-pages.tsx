"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { RecordRow, RecordsView } from "./records";
import { InvoicePreview } from "./documents";
export { InvoiceEditor, OfferEditor } from "./documents";
import { useDemoData } from "./demo-data-provider";
import { Button, EmptyState, Field, Icon, Metric, SectionTitle, Status, Toast, Toggle } from "./ui";

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
  const { data } = useDemoData();
  return <AppShell title="Kunden" subtitle="Kunden, Kontakte und Aktivitäten zentral verwalten." active="kunden" actions={<Button href="/kunden/neu" icon="plus">Neuer Kunde</Button>}>
    <div className="tablet-master-detail">
      <div>
        <RecordsView items={data.customers} placeholder="Kunden suchen...">{([name,sector,city,status])=><RecordRow href="/kunden/acme" title={name} meta={`${sector} · ${city}`} status={status}/>}</RecordsView>
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
  const [tab,setTab]=useState<"overview"|"contacts"|"docs"|"activity">("overview");
  const [contactOpen,setContactOpen]=useState(false);
  const [contactToast,setContactToast]=useState(false);
  return <AppShell title="Acme AG" subtitle="Bauunternehmen · Zürich" active="kunden" backHref="/kunden" backLabel="Kunden" actions={<><Button href="/angebote/neu" variant="secondary">Angebot erstellen</Button><Button href="/rechnungen/neu">Rechnung erstellen</Button></>}>
    <div className="entity-hero"><span className="record-avatar large">A</span><div><h2>Acme AG</h2><p>Bauunternehmen · Zürich</p></div><Status tone="success">Aktiv</Status></div>
    <div className="tabs">
      <button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Übersicht</button>
      <button className={tab==="contacts"?"active":""} onClick={()=>setTab("contacts")}>Kontakte</button>
      <button className={tab==="docs"?"active":""} onClick={()=>setTab("docs")}>Belege</button>
      <button className={tab==="activity"?"active":""} onClick={()=>setTab("activity")}>Aktivität</button>
    </div>
    {tab==="overview"&&<div className="detail-grid">
      <section className="surface"><SectionTitle title="Kundendetails"/><dl className="detail-list"><div><dt>Firma</dt><dd>Acme AG</dd></div><div><dt>E-Mail</dt><dd>info@acme.ch</dd></div><div><dt>Telefon</dt><dd>+41 44 123 45 67</dd></div><div><dt>Adresse</dt><dd>Bahnhofstrasse 123<br/>8001 Zürich</dd></div><div><dt>UID</dt><dd>CHE-123.456.789</dd></div></dl></section>
      <section className="surface"><SectionTitle title="Letzte Belege" action={<button className="text-action" onClick={()=>setTab("docs")}>Alle anzeigen</button>}/><div className="compact-list"><div><b>RE-2026-019</b><span>CHF 4’346.40</span><Status tone="success">Bezahlt</Status></div><div><b>AN-2026-012</b><span>CHF 7’264.32</span><Status tone="warning">Gesendet</Status></div><div><b>RE-2026-015</b><span>CHF 1’200.00</span><Status tone="warning">Offen</Status></div></div></section>
    </div>}
    {tab==="contacts"&&<section className="surface customer-tab-panel"><SectionTitle title="Kontakte" action={<Button variant="secondary" icon="plus" onClick={()=>setContactOpen(true)}>Kontakt</Button>}/><div className="contact-list"><div><span className="record-avatar">TM</span><div><b>Thomas Meier</b><small>Geschäftsführer · thomas.meier@acme.ch · +41 79 123 45 67</small></div><Status tone="success">Hauptkontakt</Status></div><div><span className="record-avatar">SB</span><div><b>Sarah Baumann</b><small>Buchhaltung · finance@acme.ch · +41 44 123 45 68</small></div></div></div></section>}
    {tab==="docs"&&<section className="surface customer-tab-panel"><SectionTitle title="Belege"/><div className="compact-list"><Link href="/rechnungen/RE-2026-019"><b>RE-2026-019</b><span>12.09.2026 · CHF 4’346.40</span><Status tone="success">Bezahlt</Status></Link><Link href="/angebote/AN-2026-012"><b>AN-2026-012</b><span>05.09.2026 · CHF 7’264.32</span><Status tone="warning">Gesendet</Status></Link><Link href="/rechnungen/RE-2026-015"><b>RE-2026-015</b><span>20.08.2026 · CHF 1’200.00</span><Status tone="warning">Offen</Status></Link></div></section>}
    {tab==="activity"&&<section className="surface customer-tab-panel"><SectionTitle title="Aktivität"/><div className="timeline"><div><i/><div><b>Rechnung bezahlt</b><small>RE-2026-019 · heute, 10:24</small></div></div><div><i/><div><b>Angebot gesendet</b><small>AN-2026-012 · 05.09.2026</small></div></div><div><i/><div><b>Kundendaten aktualisiert</b><small>Thomas Müller · 01.09.2026</small></div></div></div></section>}
    {contactOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setContactOpen(false)}}><section className="bottom-sheet contact-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Kontakt hinzufügen</h2><p>Kontakt wird direkt Acme AG zugeordnet.</p></div><button className="icon-button" onClick={()=>setContactOpen(false)} aria-label="Schliessen"><Icon name="close"/></button></header><div className="form-grid two"><Field label="Vorname"><input/></Field><Field label="Nachname"><input/></Field><Field label="E-Mail"><input type="email"/></Field><Field label="Telefon"><input type="tel"/></Field><Field label="Funktion" className="full"><input placeholder="z. B. Buchhaltung"/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setContactOpen(false)}>Abbrechen</Button><Button onClick={()=>{setContactOpen(false);setContactToast(true);window.setTimeout(()=>setContactToast(false),2200)}}>Kontakt speichern</Button></div></section></div>}
    {contactToast&&<Toast title="Kontakt gespeichert."/>}
  </AppShell>;
}

export function CustomerForm() {
  const router=useRouter();
  const { addRecord }=useDemoData();
  const [company,setCompany]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [city,setCity]=useState("");
  const [error,setError]=useState("");

  const save=()=>{
    if(!company.trim()){setError("Firmenname ist erforderlich.");return;}
    addRecord("customers",[company.trim(),"Unternehmen",city.trim()||"–","Aktiv"]);
    router.push("/kunden");
  };

  return <AppShell title="Kunde erstellen" subtitle="Nur die wichtigsten Angaben. Details kannst du später ergänzen." active="kunden" backHref="/kunden" backLabel="Kunden" actions={<Button onClick={save}>Speichern</Button>}>
    <div className="form-page">
      <section className="form-section clean">
        <h2>Grundangaben</h2>
        <div className="form-grid two">
          <Field label="Firmenname"><input autoFocus value={company} onChange={e=>{setCompany(e.target.value);setError("")}} placeholder="Firma oder Name"/></Field>
          <Field label="E-Mail"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@firma.ch"/></Field>
          <Field label="Telefon"><input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+41 00 000 00 00"/></Field>
          <Field label="Ort"><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Zürich"/></Field>
        </div>
        {error&&<p className="form-error">{error}</p>}
      </section>
      <details className="optional-details"><summary>Weitere Angaben</summary><div className="form-grid two"><Field label="Adresse"><input placeholder="Strasse und Nummer"/></Field><Field label="PLZ"><input inputMode="numeric" placeholder="8000"/></Field><Field label="UID"><input placeholder="CHE-000.000.000"/></Field><Field label="Interne Notiz"><input placeholder="Optional"/></Field></div></details>
      <div className="mobile-sticky-save"><Button onClick={save}>Kunde speichern</Button></div>
    </div>
  </AppShell>;
}

export function OffersPage() {
  const { data } = useDemoData();
  return <AppShell title="Angebote" subtitle="Professionelle Angebote in wenigen Klicks erstellen." active="angebote" actions={<Button href="/angebote/neu" icon="plus">Neues Angebot</Button>}>
    <RecordsView items={data.offers} placeholder="Angebote suchen..." chips={["Alle","Entwurf","Gesendet","Angenommen"]}>{([nr,name,amount,status])=><RecordRow href={`/angebote/${nr}`} icon="file" title={nr} meta={name} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function InvoicesPage() {
  const { data } = useDemoData();
  return <AppShell title="Rechnungen" subtitle="Erstellen, senden und Zahlungsstatus im Blick behalten." active="rechnungen" actions={<Button href="/rechnungen/neu" icon="plus">Neue Rechnung</Button>}>
    <div className="tablet-master-detail invoice-master-detail">
      <div>
        <RecordsView items={data.invoices} placeholder="Rechnungen suchen..." chips={["Alle","Offen","Bezahlt","Überfällig"]}>{([nr,name,date,amount,status])=><RecordRow href={`/rechnungen/${nr}`} icon="receipt" title={nr} meta={`${name} · ${date}`} value={amount} status={status}/>}</RecordsView>
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
  const { data } = useDemoData();
  return <AppShell title="Zahlungen" subtitle="Eingänge und offene Beträge übersichtlich verwalten." active="zahlungen" actions={<Button href="/zahlungen/neu" icon="plus">Zahlung erfassen</Button>}>
    <div className="metrics-grid three"><Metric label="Eingegangen" value="CHF 49’820" hint="diesen Monat" icon="wallet"/><Metric label="Offen" value="CHF 12’800" hint="8 Rechnungen" icon="receipt"/><Metric label="Überfällig" value="CHF 3’700" hint="1 Rechnung" icon="clock"/></div>
    <RecordsView items={data.payments} placeholder="Zahlungen suchen..." chips={["Alle","Verbucht","Ausstehend"]}>{([id,date,name,meta,amount,status])=><RecordRow href={`/zahlungen/${id}`} icon="wallet" title={`${date} · ${name}`} meta={meta} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function PaymentForm() {
  const router=useRouter();
  const { addRecord }=useDemoData();
  const [date,setDate]=useState("2026-10-02");
  const [amount,setAmount]=useState("4346.40");
  const [method,setMethod]=useState("Banküberweisung");

  const save=()=>{
    const id=String(Date.now());
    const normalized=Number(amount.replace("'","").replace(",","."));
    const formatted=Number.isFinite(normalized) ? `CHF ${normalized.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}` : `CHF ${amount}`;
    addRecord("payments",[id,date,"Acme AG",`RE-2026-019 · ${method}`,formatted,"Verbucht"]);
    router.push("/zahlungen");
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
  </AppShell>;
}

export function PaymentDetail() {
  return <AppShell title="Zahlung" subtitle="RE-2026-019 · Acme AG" active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="success-panel"><span><Icon name="check" size={28}/></span><h2>CHF 4’346.40</h2><p>Zahlung erfolgreich verbucht</p><Status tone="success">Verbucht</Status></div>
    <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>02.10.2026</dd></div><div><dt>Rechnung</dt><dd>RE-2026-019</dd></div><div><dt>Kunde</dt><dd>Acme AG</dd></div><div><dt>Zahlungsart</dt><dd>Banküberweisung</dd></div></dl></section>
  </AppShell>;
}

export function ProductsPage() {
  const { data } = useDemoData();
  return <AppShell title="Produkte" subtitle="Produkte und Dienstleistungen zentral verwalten." active="produkte" actions={<Button href="/produkte/neu" icon="plus">Neues Produkt</Button>}>
    <RecordsView items={data.products} placeholder="Produkte suchen..." chips={["Alle","Dienstleistungen","Produkte"]}>{([name,type,price,status])=><RecordRow href="/produkte/beratung" icon="box" title={name} meta={type} value={price} status={status}/>}</RecordsView>
  </AppShell>;
}

export function ProductForm({ existing = false }: { existing?: boolean }) {
  const router=useRouter();
  const { addRecord }=useDemoData();
  const [name,setName]=useState(existing?"Beratung":"");
  const [type,setType]=useState("Dienstleistung");
  const [price,setPrice]=useState(existing?"120.00":"");
  const [error,setError]=useState("");

  const save=()=>{
    if(!name.trim()){setError("Name ist erforderlich.");return;}
    if(!existing) addRecord("products",[name.trim(),type,`CHF ${price || "0.00"}`,"Aktiv"]);
    router.push("/produkte");
  };

  return <AppShell title={existing ? "Beratung" : "Produkt erstellen"} subtitle={existing ? "Dienstleistung · Aktiv" : "Für Angebote und Rechnungen wiederverwendbar."} active="produkte" backHref="/produkte" backLabel="Produkte" actions={<Button onClick={save}>Speichern</Button>}>
    <div className="form-page">
      <div className="form-grid two">
        <Field label="Name"><input value={name} onChange={e=>{setName(e.target.value);setError("")}} placeholder="Name"/></Field>
        <Field label="Typ"><select value={type} onChange={e=>setType(e.target.value)}><option>Dienstleistung</option><option>Produkt</option></select></Field>
        <Field label="Artikelnummer"><input placeholder="Optional"/></Field>
        <Field label="Einheit"><select><option>Stunde</option><option>Stück</option><option>Pauschal</option></select></Field>
        <Field label="Verkaufspreis"><input inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="0.00"/></Field>
        <Field label="MwSt."><select defaultValue="8.1"><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
        <Field label="Beschreibung" className="full"><textarea placeholder="Kurze Beschreibung"/></Field>
      </div>
      {error&&<p className="form-error">{error}</p>}
      <div className="mobile-sticky-save"><Button onClick={save}>Speichern</Button></div>
    </div>
  </AppShell>;
}

export function EmployeesPage() {
  const { data } = useDemoData();
  return <AppShell title="Mitarbeiter" subtitle="Team, Rollen und Stammdaten verwalten." active="mitarbeiter" actions={<Button href="/mitarbeiter/neu" icon="plus">Mitarbeiter</Button>}>
    <RecordsView items={data.employees} placeholder="Mitarbeiter suchen...">{([name,role,load,status])=><RecordRow href="/mitarbeiter/thomas" icon="users" title={name} meta={`${role} · ${load}`} status={status}/>}</RecordsView>
  </AppShell>;
}

export function EmployeeForm({ existing = false }: { existing?: boolean }) {
  const router=useRouter();
  const { addRecord }=useDemoData();
  const [firstName,setFirstName]=useState(existing?"Thomas":"");
  const [lastName,setLastName]=useState(existing?"Müller":"");
  const [role,setRole]=useState(existing?"Inhaber":"");
  const [load,setLoad]=useState(existing?"100":"");
  const [status,setStatus]=useState("Aktiv");
  const [error,setError]=useState("");

  const save=()=>{
    const fullName=`${firstName} ${lastName}`.trim();
    if(!fullName){setError("Name ist erforderlich.");return;}
    if(!existing) addRecord("employees",[fullName,role||"Mitarbeiter",`${load||"100"}%`,status]);
    router.push("/mitarbeiter");
  };

  return <AppShell title={existing ? "Thomas Müller" : "Mitarbeiter hinzufügen"} subtitle={existing ? "Inhaber · 100%" : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter" actions={<Button onClick={save}>Speichern</Button>}>
    {existing&&<div className="tabs"><button className="active">Übersicht</button><button>Arbeitszeit</button><button>Spesen</button><button>Dokumente</button></div>}
    <div className="form-page">
      <div className="form-grid two">
        <Field label="Vorname"><input value={firstName} onChange={e=>{setFirstName(e.target.value);setError("")}}/></Field>
        <Field label="Nachname"><input value={lastName} onChange={e=>{setLastName(e.target.value);setError("")}}/></Field>
        <Field label="E-Mail"><input type="email" defaultValue={existing ? "thomas@firma.ch" : ""}/></Field>
        <Field label="Telefon"><input type="tel" inputMode="tel"/></Field>
        <Field label="Funktion"><input value={role} onChange={e=>setRole(e.target.value)}/></Field>
        <Field label="Pensum"><input inputMode="numeric" value={load} onChange={e=>setLoad(e.target.value)} placeholder="%"/></Field>
        <Field label="Eintritt"><input type="date" defaultValue={existing ? "2024-01-01" : ""}/></Field>
        <Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></select></Field>
      </div>
      {error&&<p className="form-error">{error}</p>}
      <div className="mobile-sticky-save"><Button onClick={save}>Speichern</Button></div>
    </div>
  </AppShell>;
}

export function ExpensesPage() {
  const { data } = useDemoData();
  return <AppShell title="Spesen" subtitle="Belege erfassen, prüfen und freigeben." active="spesen" actions={<Button href="/spesen/neu" icon="plus">Spese erfassen</Button>}>
    <RecordsView items={data.expenses} placeholder="Spesen suchen..." chips={["Alle","Eingereicht","Genehmigt","Entwurf"]}>{([title,person,amount,status])=><RecordRow href="/spesen/1" icon="card" title={title} meta={person} value={amount} status={status}/>}</RecordsView>
  </AppShell>;
}

export function ExpenseForm({ existing = false }: { existing?: boolean }) {
  const router=useRouter();
  const { addRecord }=useDemoData();
  const [employee,setEmployee]=useState("Thomas Müller");
  const [amount,setAmount]=useState(existing?"280.00":"");
  const [description,setDescription]=useState(existing?"Übernachtung Kundentermin Zürich":"");
  const [receipt,setReceipt]=useState(false);

  const save=()=>{
    if(!existing) addRecord("expenses",[description.trim()||"Neue Spese",employee,`CHF ${amount||"0.00"}`,"Eingereicht"]);
    router.push("/spesen");
  };

  return <AppShell title={existing ? "Hotel Schweizerhof" : "Spese erfassen"} subtitle={existing ? "Thomas Müller · Eingereicht" : "Beleg fotografieren oder Datei auswählen."} active="spesen" backHref="/spesen" backLabel="Spesen" actions={<Button onClick={save}>{existing ? "Speichern" : "Einreichen"}</Button>}>
    <div className="expense-layout">
      <button className={receipt?"receipt-upload has-receipt":"receipt-upload"} type="button" onClick={()=>setReceipt(true)}><span><Icon name={receipt?"check":"upload"} size={25}/></span><b>{receipt?"Beleg hinzugefügt":"Beleg hinzufügen"}</b><small>{receipt?"beleg-2026-10-02.jpg":"Kamera oder Datei verwenden"}</small></button>
      <div className="form-page">
        <div className="form-grid two">
          <Field label="Mitarbeiter"><select value={employee} onChange={e=>setEmployee(e.target.value)}><option>Thomas Müller</option><option>Sarah Meier</option></select></Field>
          <Field label="Datum"><input type="date" defaultValue="2026-10-02"/></Field>
          <Field label="Kategorie"><select><option>Reise</option><option>Verpflegung</option><option>Material</option></select></Field>
          <Field label="Betrag"><input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></Field>
          <Field label="Währung"><select><option>CHF</option><option>EUR</option></select></Field>
          <Field label="MwSt."><select><option>8.1%</option><option>2.6%</option><option>0%</option></select></Field>
          <Field label="Beschreibung" className="full"><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={save}>{existing ? "Speichern" : "Einreichen"}</Button></div>
      </div>
    </div>
  </AppShell>;
}

export function TimePage() {
  const [running,setRunning]=useState(true);
  const [seconds,setSeconds]=useState(8067);
  const [manualOpen,setManualOpen]=useState(false);
  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>window.clearInterval(id);},[running]);
  const formatted=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60].map(value=>String(value).padStart(2,"0")).join(":");
  return <AppShell title="Zeiterfassung" subtitle="Arbeitszeit einfach und präzise erfassen." active="zeit">
    <div className="time-layout">
      <section className="surface timer-card">
        <div className="tabs"><button className="active">Timer</button><button>Einträge</button></div>
        <div className="timer-project"><small>Projekt</small><button type="button">Website Redesign · Acme AG <Icon name="down" size={16}/></button></div>
        <div className={`timer-ring ${running?"is-running":"is-paused"}`}><div><small>{running?"Läuft":"Pausiert"}</small><strong>{formatted}</strong><span>Heute, 09:27</span></div></div>
        <div className="timer-actions"><Button onClick={()=>setRunning(!running)} icon={running?"pause":"clock"}>{running?"Pause":"Fortsetzen"}</Button><Button variant="secondary" icon="stop" onClick={()=>setRunning(false)}>Stoppen</Button></div>
      </section>
      <section className="surface">
        <SectionTitle title="Heute" action={<strong>4:28 h</strong>}/>
        <div className="compact-list"><div><b>Website Redesign</b><span>Acme AG</span><strong>2:14</strong></div><div><b>Kundenmeeting</b><span>Müller GmbH</span><strong>1:30</strong></div><div><b>Planung</b><span>Intern</span><strong>0:44</strong></div></div>
        <Button variant="secondary" icon="plus" className="full-button" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>
      </section>
    </div>
    {manualOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setManualOpen(false)}}><section className="bottom-sheet manual-time-sheet" role="dialog" aria-modal="true" aria-label="Zeit manuell erfassen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Zeit erfassen</h2><p>Eintrag direkt dem Kunden oder Projekt zuordnen.</p></div><button className="icon-button" type="button" onClick={()=>setManualOpen(false)}><Icon name="close"/></button></header><div className="form-grid two"><Field label="Datum"><input type="date" defaultValue="2026-10-02"/></Field><Field label="Dauer"><input type="time" defaultValue="01:00"/></Field><Field label="Kunde"><select><option>Acme AG</option><option>Müller GmbH</option></select></Field><Field label="Projekt"><select><option>Website Redesign</option><option>Support</option></select></Field><Field className="full" label="Beschreibung"><input placeholder="Was wurde gemacht?"/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setManualOpen(false)}>Abbrechen</Button><Button onClick={()=>setManualOpen(false)}>Speichern</Button></div></section></div>}
  </AppShell>;
}

export function SupportPage() {
  const { data } = useDemoData();
  return <AppShell title="Support" subtitle="Hilfe direkt in Binso One – persönlich und nachvollziehbar." active="support" actions={<Button href="/support/neu" icon="plus">Neue Anfrage</Button>}>
    <div className="support-summary"><Metric label="Offen" value="2" hint="aktuelle Tickets" icon="support"/><Metric label="Gelöst" value="14" hint="letzte 90 Tage" icon="check"/></div>
    <div className="tablet-master-detail support-master-detail">
      <RecordsView items={data.supportTickets} placeholder="Tickets suchen..." chips={["Alle","Offen","In Bearbeitung","Gelöst"]}>{([id,subject,updated,status])=><RecordRow href={`/support/${id}`} icon="support" title={`#${id} · ${subject}`} meta={updated} status={status}/>}</RecordsView>
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
  const { addRecord }=useDemoData();
  const [subject,setSubject]=useState("");
  const [message,setMessage]=useState("");
  const [attached,setAttached]=useState(false);
  const [error,setError]=useState("");

  const save=()=>{
    if(!subject.trim()||!message.trim()){setError("Betreff und Nachricht sind erforderlich.");return;}
    const id=String(5900+Math.floor(Math.random()*90));
    addRecord("supportTickets",[id,subject.trim(),"gerade eben","Offen"]);
    router.push("/support");
  };

  return <AppShell title="Neue Support-Anfrage" subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref="/support" backLabel="Support" actions={<Button onClick={save}>Ticket erstellen</Button>}>
    <div className="form-page narrow">
      <div className="form-grid">
        <Field label="Betreff" className="full"><input autoFocus value={subject} onChange={e=>{setSubject(e.target.value);setError("")}} placeholder="Worum geht es?"/></Field>
        <Field label="Kategorie" className="full"><select><option>Allgemeine Frage</option><option>Rechnung</option><option>Zeiterfassung</option><option>Technisches Problem</option></select></Field>
        <Field label="Nachricht" className="full"><textarea value={message} onChange={e=>{setMessage(e.target.value);setError("")}} placeholder="Beschreibe dein Anliegen kurz..."/></Field>
      </div>
      <button className={attached?"attachment-button attached":"attachment-button"} type="button" onClick={()=>setAttached(!attached)}><Icon name={attached?"check":"upload"}/><span>{attached?"Screenshot angehängt":"Screenshot oder Datei hinzufügen"}</span></button>
      <p className="technical-hint">Browser, App-Version und Zeitpunkt werden automatisch mitgesendet.</p>
      {error&&<p className="form-error">{error}</p>}
      <div className="mobile-sticky-save"><Button onClick={save}>Ticket erstellen</Button></div>
    </div>
  </AppShell>;
}

export function SupportChat() {
  const [draft,setDraft]=useState("");
  const [sent,setSent]=useState<string[]>([]);
  const send=()=>{const value=draft.trim();if(!value)return;setSent(current=>[...current,value]);setDraft("");};
  return <AppShell title="Ticket #5832" subtitle="Frage zur Rechnung" active="support" backHref="/support" backLabel="Support" actions={<Status tone="warning">Offen</Status>}>
    <div className="support-thread">
      <div className="thread-day">Heute</div>
      <article className="message message-user"><div>Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?</div><small>10:24</small></article>
      <article className="message message-support"><span>Binso Support</span><div>Hallo Thomas. Gerne helfe ich dir weiter. Um welche Rechnung geht es genau?</div><small>10:37</small></article>
      <article className="message message-user"><div>Es geht um die Rechnung RE-2026-019 von Acme AG.</div><small>10:41</small></article>
      <article className="message message-support"><span>Binso Support</span><div>Super, ich schaue das gerne für dich nach.</div><small>10:42</small></article>
      {sent.map((text,i)=><article className="message message-user" key={`${text}-${i}`}><div>{text}</div><small>jetzt</small></article>)}
      <div className="thread-composer"><button type="button" aria-label="Datei anhängen"><Icon name="upload"/></button><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();send();}}} placeholder="Nachricht schreiben..."/><button type="button" onClick={send} aria-label="Senden"><Icon name="arrow"/></button></div>
    </div>
  </AppShell>;
}

export function SettingsPage() {
  const rows = [
    ["/einstellungen/konto","user","Persönliche Daten","Name, E-Mail und Sprache"],
    ["/einstellungen/firma","users","Firma","Unternehmensdaten und Rechnungseinstellungen"],
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
    <section className="subscription-panel">
      <div><small>Aktueller Plan</small><h2>Business</h2><p>CHF 49 / Monat · nächste Rechnung am 01.11.2026</p></div>
      <Button href="/einstellungen/abonnement" variant="secondary">Plan verwalten</Button>
    </section>
  </AppShell>;
}

export function AccountSettingsPage() {
  const [toast,setToast]=useState<string|null>(null);
  const save=(message="Persönliche Daten gespeichert.")=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};
  return <AppShell title="Persönliche Daten" subtitle="Dein Konto und deine Profildaten." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={<Button onClick={()=>save()}>Speichern</Button>}>
    <div className="settings-detail-grid">
      <section className="surface settings-profile">
        <div className="profile-avatar">TM</div><div><h2>Thomas Müller</h2><p>Administrator · Musterwerk AG</p></div><Button variant="secondary" onClick={()=>save("Profilbild-Auswahl geöffnet.")}>Bild ändern</Button>
      </section>
      <section className="settings-form">
        <div className="form-grid two">
          <Field label="Vorname"><input defaultValue="Thomas"/></Field>
          <Field label="Nachname"><input defaultValue="Müller"/></Field>
          <Field label="E-Mail"><input type="email" defaultValue="thomas@musterwerk.ch"/></Field>
          <Field label="Telefon"><input type="tel" defaultValue="+41 79 123 45 67"/></Field>
          <Field label="Funktion"><input defaultValue="Geschäftsführer"/></Field>
          <Field label="Sprache"><select defaultValue="de"><option value="de">Deutsch (Schweiz)</option><option value="fr">Français</option><option value="it">Italiano</option><option value="en">English</option><option value="tr">Türkçe</option></select></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>save()}>Speichern</Button></div>
      </section>
    </div>
    {toast&&<Toast title={toast}/>}
  </AppShell>;
}

export function CompanySettingsPage() {
  const [toast,setToast]=useState<string|null>(null);
  const save=(message="Firmendaten gespeichert.")=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};
  return <AppShell title="Firma" subtitle="Unternehmensdaten für Belege und Kommunikation." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" actions={<Button onClick={()=>save()}>Speichern</Button>}>
    <div className="settings-detail-grid">
      <section className="surface company-logo-card"><img src="/brand/logo-black.svg" alt="Firmenlogo"/><div><b>Musterwerk AG</b><small>Logo für Angebote und Rechnungen</small></div><Button variant="secondary" onClick={()=>save("Logo-Auswahl geöffnet.")}>Logo ändern</Button></section>
      <section className="settings-form">
        <div className="form-grid two">
          <Field label="Firmenname"><input defaultValue="Musterwerk AG"/></Field>
          <Field label="UID"><input defaultValue="CHE-123.456.789"/></Field>
          <Field label="Strasse"><input defaultValue="Bahnhofstrasse 12"/></Field>
          <Field label="PLZ / Ort"><input defaultValue="3000 Bern"/></Field>
          <Field label="E-Mail"><input type="email" defaultValue="info@musterwerk.ch"/></Field>
          <Field label="Telefon"><input type="tel" defaultValue="+41 31 123 45 67"/></Field>
          <Field label="Standard MwSt."><select defaultValue="8.1"><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
          <Field label="Zahlungsziel"><select defaultValue="30"><option value="10">10 Tage</option><option value="30">30 Tage</option><option value="45">45 Tage</option></select></Field>
        </div>
        <div className="mobile-sticky-save"><Button onClick={()=>save()}>Speichern</Button></div>
      </section>
    </div>
    {toast&&<Toast title={toast}/>}
  </AppShell>;
}

export function SubscriptionSettingsPage() {
  const [dialog,setDialog]=useState<"plan"|"payment"|"cancel"|null>(null);
  const [plan,setPlan]=useState("Business");
  const [toast,setToast]=useState<string|null>(null);
  const prices:Record<string,string>={Start:"19",Business:"49",Pro:"89"};
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};
  return <AppShell title="Abonnement" subtitle="Plan, Nutzung, Zahlungsmittel und Rechnungen." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="plan-hero">
      <div><span className="eyebrow">AKTUELLER PLAN</span><h2>{plan}</h2><p>Für wachsende Teams mit allen wichtigen Business-Funktionen.</p></div>
      <div className="plan-price"><strong>CHF {prices[plan]}</strong><span>/ Monat</span></div>
      <Button onClick={()=>setDialog("plan")}>Plan ändern</Button>
    </section>
    <div className="subscription-detail-grid">
      <section className="surface"><SectionTitle title="Nutzung"/><div className="usage-row"><span>Benutzer</span><b>4 von 10</b></div><div className="usage-bar"><i style={{width:"40%"}}/></div><div className="usage-row"><span>Dateispeicher</span><b>2.4 GB von 20 GB</b></div><div className="usage-bar"><i style={{width:"12%"}}/></div></section>
      <section className="surface"><SectionTitle title="Zahlungsmittel"/><div className="payment-method"><Icon name="card"/><div><b>Visa •••• 4242</b><small>Läuft 08/29 ab</small></div><Button variant="secondary" onClick={()=>setDialog("payment")}>Ändern</Button></div></section>
    </div>
    <section className="surface invoices-panel"><SectionTitle title="Rechnungen"/><div className="compact-list"><div><b>01.10.2026</b><span>CHF 49.00</span><Status tone="success">Bezahlt</Status></div><div><b>01.09.2026</b><span>CHF 49.00</span><Status tone="success">Bezahlt</Status></div><div><b>01.08.2026</b><span>CHF 49.00</span><Status tone="success">Bezahlt</Status></div></div></section>
    <div className="danger-zone"><div><b>Abonnement kündigen</b><p>Dein Zugriff bleibt bis zum Ende der laufenden Periode aktiv.</p></div><Button variant="danger" onClick={()=>setDialog("cancel")}>Kündigung starten</Button></div>

    {dialog&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet subscription-sheet" role="dialog" aria-modal="true">
      <div className="sheet-handle"/>
      <header className="sheet-header"><div><h2>{dialog==="plan"?"Plan ändern":dialog==="payment"?"Zahlungsmittel ändern":"Abonnement kündigen"}</h2><p>{dialog==="cancel"?"Die Kündigung wird erst nach deiner Bestätigung vorgemerkt.":"Änderungen werden vor Abschluss nochmals bestätigt."}</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header>
      {dialog==="plan"&&<div className="plan-choice-list">{["Start","Business","Pro"].map(name=><button type="button" className={plan===name?"selected":""} onClick={()=>setPlan(name)} key={name}><div><b>{name}</b><small>CHF {prices[name]} / Monat</small></div>{plan===name?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div>}
      {dialog==="payment"&&<div className="form-grid two"><Field label="Karteninhaber"><input defaultValue="Thomas Müller"/></Field><Field label="Kartennummer"><input inputMode="numeric" placeholder="•••• •••• •••• 4242"/></Field><Field label="Ablauf"><input placeholder="MM / JJ"/></Field><Field label="CVC"><input inputMode="numeric" placeholder="•••"/></Field></div>}
      {dialog==="cancel"&&<div className="cancel-summary"><Icon name="lock"/><div><b>Zugriff bleibt bis 31.10.2026 aktiv</b><p>Danach wird das Abonnement beendet. Deine Daten werden nicht sofort gelöscht.</p></div></div>}
      <div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button variant={dialog==="cancel"?"danger":"primary"} onClick={()=>confirm(dialog==="plan"?"Planänderung gespeichert.":dialog==="payment"?"Zahlungsmittel aktualisiert.":"Kündigung vorgemerkt.")}>{dialog==="cancel"?"Kündigung bestätigen":"Speichern"}</Button></div>
    </section></div>}
    {toast&&<Toast title={toast}/>}
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
  const [dialog,setDialog]=useState<"password"|"2fa"|null>(null);
  const [twoFactor,setTwoFactor]=useState(false);
  const [sessionVisible,setSessionVisible]=useState(true);
  const [toast,setToast]=useState<string|null>(null);
  const confirm=(message:string)=>{setDialog(null);setToast(message);window.setTimeout(()=>setToast(null),2200);};
  return <AppShell title="Sicherheit" subtitle="Passwort, Sitzungen und Kontoschutz." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface security-card"><SectionTitle title="Passwort"/><p>Zuletzt geändert vor 63 Tagen.</p><Button variant="secondary" onClick={()=>setDialog("password")}>Passwort ändern</Button></section>
    <section className="surface security-card"><div className="security-row"><div><b>Zwei-Faktor-Authentifizierung</b><p>Zusätzlicher Schutz für dein Konto.</p></div><Status tone={twoFactor?"success":"warning"}>{twoFactor?"Aktiv":"Nicht aktiv"}</Status><Button onClick={()=>setDialog("2fa")}>{twoFactor?"Verwalten":"Aktivieren"}</Button></div></section>
    <section className="surface security-card"><SectionTitle title="Aktive Sitzungen"/><div className="session-list"><div><span className="activity-icon"><Icon name="user"/></span><div><b>Chrome · Windows 11</b><small>Biel/Bienne · Dieses Gerät · jetzt aktiv</small></div><Status tone="success">Aktiv</Status></div>{sessionVisible&&<div><span className="activity-icon"><Icon name="user"/></span><div><b>Safari · iPhone</b><small>Bern · vor 2 Stunden</small></div><button className="text-action" onClick={()=>{setSessionVisible(false);setToast("iPhone-Sitzung wurde abgemeldet.");window.setTimeout(()=>setToast(null),2200)}}>Abmelden</button></div>}</div></section>
    {dialog&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setDialog(null)}}><section className="bottom-sheet security-sheet" role="dialog" aria-modal="true"><div className="sheet-handle"/><header className="sheet-header"><div><h2>{dialog==="password"?"Passwort ändern":"Zwei-Faktor-Authentifizierung"}</h2><p>{dialog==="password"?"Verwende ein einzigartiges, starkes Passwort.":"Zusätzlicher Schutz für dein Benutzerkonto."}</p></div><button className="icon-button" onClick={()=>setDialog(null)} aria-label="Schliessen"><Icon name="close"/></button></header>{dialog==="password"?<div className="form-grid"><Field label="Aktuelles Passwort"><input type="password"/></Field><Field label="Neues Passwort"><input type="password"/></Field><Field label="Neues Passwort bestätigen"><input type="password"/></Field></div>:<div className="two-factor-setup"><div className="two-factor-code">BINSO<br/>2FA</div><div><b>Authenticator-App verbinden</b><p>Scanne den Code mit deiner Authenticator-App und bestätige anschliessend einen sechsstelligen Code.</p><Field label="Bestätigungscode"><input inputMode="numeric" placeholder="000000"/></Field></div></div>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setDialog(null)}>Abbrechen</Button><Button onClick={()=>{if(dialog==="2fa")setTwoFactor(true);confirm(dialog==="password"?"Passwort geändert.":"Zwei-Faktor-Authentifizierung aktiviert.")}}>Bestätigen</Button></div></section></div>}
    {toast&&<Toast title={toast}/>}
  </AppShell>;
}

export function AppearanceSettingsPage() {
  const [theme,setTheme] = useState<"light"|"dark"|"system">("light");
  const choose=(next:"light"|"dark"|"system")=>{
    setTheme(next);
    const resolved=next==="system"?(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):next;
    document.documentElement.dataset.theme=resolved;
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
  return <AppShell title="Belege" subtitle="Angebote, Rechnungen und Zahlungen auf einen Blick." active="belege" actions={<Button href="/rechnungen/neu" icon="plus">Neue Rechnung</Button>}>
    <div className="metrics-grid three">
      <Metric label="Offene Angebote" value="2" hint="CHF 10’464.32" icon="file"/>
      <Metric label="Offene Rechnungen" value="CHF 12’800" hint="8 Rechnungen" icon="receipt"/>
      <Metric label="Zahlungen im Monat" value="CHF 49’820" hint="184 Eingänge" icon="wallet"/>
    </div>
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
  const [read,setRead]=useState<string[]>(["invoice","offer"]);
  const items=[
    ["invoice","wallet","Rechnung bezahlt","Acme AG · RE-2026-019 · CHF 4’346.40","vor 12 Minuten","/rechnungen/RE-2026-019"],
    ["support","support","Neue Support-Antwort","Ticket #5832 wurde beantwortet.","vor 1 Stunde","/support/5832"],
    ["offer","file","Angebot angenommen","Acme AG · AN-2026-012","heute","/angebote/AN-2026-012"],
    ["time","clock","Zeitmessung läuft","Website Redesign · Acme AG","seit 2 Stunden","/zeit"],
  ];
  return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={<Button variant="secondary" onClick={()=>setRead(items.map(item=>item[0]))}>Alle gelesen</Button>}>
    <div className="notification-center">
      <div className="notification-center-tabs"><button className="active">Alle</button><button>Ungelesen</button></div>
      <div className="notification-center-list">{items.map(([id,icon,title,text,time,href])=>{
        const isRead=read.includes(id);
        return <Link href={href} className={isRead?"notification-center-row":"notification-center-row unread"} key={id} onClick={()=>setRead(current=>current.includes(id)?current:[...current,id])}>
          <span className="activity-icon"><Icon name={icon}/></span>
          <div><b>{title}</b><p>{text}</p><small>{time}</small></div>
          {!isRead&&<i className="unread-dot"/>}
          <Icon name="arrow" size={16}/>
        </Link>;
      })}</div>
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