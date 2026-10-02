"use client";

import { useState } from "react";
import { AppShell } from "./app-shell";
import { Button, Field, Icon, Toast } from "./ui";

export function OfferEditor({ existing = false }: { existing?: boolean }) {
  const [preview, setPreview] = useState(false);
  return <AppShell title={existing ? "Angebot AN-2026-012" : "Angebot erstellen"} subtitle={existing ? "Gesendet · gültig bis 31.10.2026" : "Entwurf automatisch gespeichert"} active="angebote" backHref="/angebote" backLabel="Angebote" actions={<><Button variant="secondary" onClick={() => setPreview(true)}>Vorschau</Button><Button href="/angebote/AN-2026-012">{existing ? "Speichern" : "Angebot erstellen"}</Button></>}>
    <DocumentEditor type="Angebot" number="AN-2026-012"/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={() => setPreview(true)}>Vorschau</Button><Button href="/angebote/AN-2026-012">{existing ? "Speichern" : "Angebot erstellen"}</Button></div>
    {preview&&<DocumentModal title="Angebotsvorschau" onClose={()=>setPreview(false)}><OfferPreview/></DocumentModal>}
  </AppShell>;
}

export function InvoiceEditor({ existing = false }: { existing?: boolean }) {
  const [preview, setPreview] = useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};

  return <AppShell title={existing ? "Rechnung RE-2026-019" : "Rechnung erstellen"} subtitle={existing ? "Bezahlt · Acme AG" : "Entwurf automatisch gespeichert"} active="rechnungen" backHref="/rechnungen" backLabel="Rechnungen" actions={<><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button href="/rechnungen/RE-2026-019">{existing ? "Speichern" : "Rechnung erstellen"}</Button></>}>
    {existing&&<div className="document-actions"><Button variant="secondary" icon="mail" onClick={()=>show("Rechnung wurde zum Versand vorbereitet.")}>Senden</Button><Button href="/zahlungen/neu" variant="secondary" icon="wallet">Zahlung erfassen</Button><Button variant="ghost" onClick={()=>show("Rechnung wurde als neuer Entwurf dupliziert.")}>Duplizieren</Button></div>}
    <DocumentEditor type="Rechnung" number="RE-2026-019"/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button href="/rechnungen/RE-2026-019">{existing ? "Speichern" : "Rechnung erstellen"}</Button></div>
    {preview&&<DocumentModal title="Rechnungsvorschau" onClose={()=>setPreview(false)}><InvoicePreview/></DocumentModal>}
    {toast&&<Toast title={toast}/>}
  </AppShell>;
}

function DocumentEditor({ type, number }: { type: "Rechnung" | "Angebot"; number: string }) {
  const [positions,setPositions]=useState([
    { description:"Website Konzept", quantity:"24", price:"120.00", total:"2’880.00" },
    { description:"Design & Umsetzung", quantity:"12", price:"95.00", total:"1’140.00" },
  ]);

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
        <div className="section-title"><h2>Positionen</h2><button className="text-action" type="button" onClick={()=>setPositions(current=>[...current,{description:"Neue Position",quantity:"1",price:"0.00",total:"0.00"}])}>+ Position hinzufügen</button></div>
        <div className="line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span></div>
          {positions.map((position,index)=><div key={index}><input value={position.description} onChange={e=>setPositions(current=>current.map((item,i)=>i===index?{...item,description:e.target.value}:item))}/><input inputMode="decimal" value={position.quantity} onChange={e=>setPositions(current=>current.map((item,i)=>i===index?{...item,quantity:e.target.value}:item))}/><input inputMode="decimal" value={position.price} onChange={e=>setPositions(current=>current.map((item,i)=>i===index?{...item,price:e.target.value}:item))}/><b>{position.total}</b></div>)}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>CHF 4’020.00</b></span><span>MwSt. 8.1% <b>CHF 326.40</b></span><strong>Total <b>CHF 4’346.40</b></strong></div>
      </div>
      <div className="form-section optional-row"><Field label="Notiz"><textarea placeholder="Optionaler Text für den Kunden"/></Field></div>
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
  return <div className="paper invoice-paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>RECHNUNG</span></div>
    <div className="sender-line">Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell</div>
    <div className="paper-meta"><div><b>Acme AG</b><span>Bahnhofstrasse 123</span><span>8001 Zürich</span></div><div><small>Rechnung Nr.</small><b>RE-2026-019</b><small>Datum</small><b>02.10.2026</b><small>Zahlbar bis</small><b>01.11.2026</b></div></div>
    <div className="paper-intro"><b>Website Redesign</b><p>Vielen Dank für die Zusammenarbeit. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.</p></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody><tr><td>Website Konzept</td><td>24 h</td><td>120.00</td><td>2’880.00</td></tr><tr><td>Design & Umsetzung</td><td>12 h</td><td>95.00</td><td>1’140.00</td></tr></tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>4’020.00</b></span><span>MwSt. 8.1% <b>326.40</b></span><strong>Total CHF <b>4’346.40</b></strong></div>
    <section className="qr-payment">
      <div className="qr-code" aria-label="QR-Code Vorschau"><i/><i/><i/></div>
      <div className="qr-info"><small>Konto / Zahlbar an</small><b>CH93 0076 2011 6238 5295 7</b><span>Binso GmbH<br/>Weissbadstrasse 8b<br/>9050 Appenzell</span><small>Referenz</small><b>21 00000 00003 13947 14300 09017</b></div>
      <div className="qr-amount"><small>Währung</small><b>CHF</b><small>Betrag</small><b>4’346.40</b></div>
    </section>
    <footer>Binso GmbH · CHE-173.401.068 · www.binso.ch · +41 58 510 88 58</footer>
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
