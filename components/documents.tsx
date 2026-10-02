"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { useDemoData } from "./demo-data-provider";
import { Button, Field, Icon, Toast } from "./ui";

type Position = {
  description: string;
  quantity: string;
  price: string;
};

function toNumber(value: string) {
  const normalized=value.replace(/['’\s]/g,"").replace(",",".");
  const parsed=Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: number) {
  return value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function nextNumber(rows: string[][], prefix: "AN"|"RE") {
  const sequence=rows.reduce((max,row)=>{
    const match=(row[0]??"").match(new RegExp("^"+prefix+"-\\d{4}-(\\d+)$"));
    return match ? Math.max(max,Number(match[1])) : max;
  },0)+1;
  return `${prefix}-2026-${String(sequence).padStart(3,"0")}`;
}

export function OfferEditor({ existing = false }: { existing?: boolean }) {
  const router=useRouter();
  const { addRecord, data }=useDemoData();
  const [preview,setPreview]=useState(false);
  const [customer,setCustomer]=useState("Acme AG");
  const number=existing?"AN-2026-012":nextNumber(data.offers,"AN");
  const [positions,setPositions]=useState<Position[]>([
    { description:"Website Konzept", quantity:"24", price:"120.00" },
    { description:"Design & Umsetzung", quantity:"12", price:"95.00" },
  ]);

  const subtotal=useMemo(()=>positions.reduce((sum,item)=>sum+toNumber(item.quantity)*toNumber(item.price),0),[positions]);
  const vat=subtotal*0.081;
  const total=subtotal+vat;

  const save=()=>{
    if(!existing) addRecord("offers",[number,customer,`CHF ${formatMoney(total)}`,"Entwurf"]);
    router.push("/angebote");
  };

  return <AppShell title={existing ? "Angebot AN-2026-012" : "Angebot erstellen"} subtitle={existing ? "Gesendet · gültig bis 31.10.2026" : "Entwurf automatisch gespeichert"} active="angebote" backHref="/angebote" backLabel="Angebote" actions={<><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={save}>{existing ? "Speichern" : "Angebot erstellen"}</Button></>}>
    <DocumentEditor type="Angebot" number={number} customer={customer} onCustomerChange={setCustomer} positions={positions} onPositionsChange={setPositions} subtotal={subtotal} vat={vat} total={total}/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={save}>{existing ? "Speichern" : "Angebot erstellen"}</Button></div>
    {preview&&<DocumentModal title="Angebotsvorschau" onClose={()=>setPreview(false)}><OfferPreview number={number} customer={customer} positions={positions} subtotal={subtotal} vat={vat} total={total}/></DocumentModal>}
  </AppShell>;
}

export function InvoiceEditor({ existing = false }: { existing?: boolean }) {
  const router=useRouter();
  const { addRecord, data }=useDemoData();
  const [preview,setPreview]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [customer,setCustomer]=useState("Acme AG");
  const number=existing?"RE-2026-019":nextNumber(data.invoices,"RE");
  const [positions,setPositions]=useState<Position[]>([
    { description:"Website Konzept", quantity:"24", price:"120.00" },
    { description:"Design & Umsetzung", quantity:"12", price:"95.00" },
  ]);

  const subtotal=useMemo(()=>positions.reduce((sum,item)=>sum+toNumber(item.quantity)*toNumber(item.price),0),[positions]);
  const vat=subtotal*0.081;
  const total=subtotal+vat;
  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};

  const save=()=>{
    if(!existing) addRecord("invoices",[number,customer,"02.10.2026",`CHF ${formatMoney(total)}`,"Offen"]);
    router.push("/rechnungen");
  };

  const duplicate=()=>{
    const duplicateNumber=nextNumber(data.invoices,"RE");
    addRecord("invoices",[duplicateNumber,customer,"02.10.2026",`CHF ${formatMoney(total)}`,"Offen"]);
    show("Rechnung wurde als neuer Entwurf dupliziert.");
  };

  return <AppShell title={existing ? "Rechnung RE-2026-019" : "Rechnung erstellen"} subtitle={existing ? "Bezahlt · Acme AG" : "Entwurf automatisch gespeichert"} active="rechnungen" backHref="/rechnungen" backLabel="Rechnungen" actions={<><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={save}>{existing ? "Speichern" : "Rechnung erstellen"}</Button></>}>
    {existing&&<div className="document-actions"><Button variant="secondary" icon="mail" onClick={()=>show("Rechnung wurde zum Versand vorbereitet.")}>Senden</Button><Button href="/zahlungen/neu" variant="secondary" icon="wallet">Zahlung erfassen</Button><Button variant="ghost" onClick={duplicate}>Duplizieren</Button></div>}
    <DocumentEditor type="Rechnung" number={number} customer={customer} onCustomerChange={setCustomer} positions={positions} onPositionsChange={setPositions} subtotal={subtotal} vat={vat} total={total}/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={save}>{existing ? "Speichern" : "Rechnung erstellen"}</Button></div>
    {preview&&<DocumentModal title="Rechnungsvorschau" onClose={()=>setPreview(false)}><InvoicePreview number={number} customer={customer} positions={positions} subtotal={subtotal} vat={vat} total={total}/></DocumentModal>}
    {toast&&<Toast title={toast}/>}
  </AppShell>;
}

function DocumentEditor({
  type,
  number,
  customer,
  onCustomerChange,
  positions,
  onPositionsChange,
  subtotal,
  vat,
  total,
}: {
  type:"Rechnung"|"Angebot";
  number:string;
  customer:string;
  onCustomerChange:(value:string)=>void;
  positions:Position[];
  onPositionsChange:(positions:Position[])=>void;
  subtotal:number;
  vat:number;
  total:number;
}) {
  const updatePosition=(index:number,key:keyof Position,value:string)=>{
    onPositionsChange(positions.map((item,itemIndex)=>itemIndex===index?{...item,[key]:value}:item));
  };

  return <div className="invoice-workspace">
    <section className="invoice-form">
      <div className="form-section"><h2>Kunde</h2><Field label="Kunde"><select value={customer} onChange={e=>onCustomerChange(e.target.value)}><option>Acme AG</option><option>Müller GmbH</option><option>Berger Bau AG</option><option>Huber & Söhne</option></select></Field></div>
      <div className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid">
          <Field label={type==="Rechnung"?"Rechnungsnummer":"Angebotsnummer"}><input value={number} readOnly/></Field>
          <Field label={type==="Rechnung"?"Rechnungsdatum":"Angebotsdatum"}><input type="date" defaultValue="2026-10-02"/></Field>
          <Field label={type==="Rechnung"?"Zahlungsziel":"Gültig bis"}>{type==="Rechnung"?<select defaultValue="30"><option value="30">30 Tage</option><option value="10">10 Tage</option></select>:<input type="date" defaultValue="2026-10-31"/>}</Field>
        </div>
      </div>
      <div className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="text-action" type="button" onClick={()=>onPositionsChange([...positions,{description:"Neue Position",quantity:"1",price:"0.00"}])}>+ Position hinzufügen</button></div>
        <div className="line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span></div>
          {positions.map((position,index)=><div key={index}><input value={position.description} onChange={e=>updatePosition(index,"description",e.target.value)}/><input inputMode="decimal" value={position.quantity} onChange={e=>updatePosition(index,"quantity",e.target.value)}/><input inputMode="decimal" value={position.price} onChange={e=>updatePosition(index,"price",e.target.value)}/><b>{formatMoney(toNumber(position.quantity)*toNumber(position.price))}</b></div>)}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>CHF {formatMoney(subtotal)}</b></span><span>MwSt. 8.1% <b>CHF {formatMoney(vat)}</b></span><strong>Total <b>CHF {formatMoney(total)}</b></strong></div>
      </div>
      <div className="form-section optional-row"><Field label="Notiz"><textarea placeholder="Optionaler Text für den Kunden"/></Field></div>
    </section>
    <aside className="desktop-document-preview"><h2>Live-Vorschau</h2>{type==="Rechnung"?<InvoicePreview number={number} customer={customer} positions={positions} subtotal={subtotal} vat={vat} total={total}/>:<OfferPreview number={number} customer={customer} positions={positions} subtotal={subtotal} vat={vat} total={total}/>}</aside>
  </div>;
}

function DocumentModal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) {
  return <div className="document-modal" role="dialog" aria-modal="true">
    <header><button type="button" onClick={onClose}><Icon name="back"/>Schliessen</button><strong>{title}</strong><button type="button" aria-label="Teilen"><Icon name="upload"/></button></header>
    <div className="document-modal-body">{children}</div>
  </div>;
}

export function InvoicePreview({
  number="RE-2026-019",
  customer="Acme AG",
  positions=[
    {description:"Website Konzept",quantity:"24",price:"120.00"},
    {description:"Design & Umsetzung",quantity:"12",price:"95.00"},
  ],
  subtotal=4020,
  vat=326.4,
  total=4346.4,
}: {
  number?:string;
  customer?:string;
  positions?:Position[];
  subtotal?:number;
  vat?:number;
  total?:number;
}) {
  return <div className="paper invoice-paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>RECHNUNG</span></div>
    <div className="sender-line">Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell</div>
    <div className="paper-meta"><div><b>{customer}</b><span>Bahnhofstrasse 123</span><span>8001 Zürich</span></div><div><small>Rechnung Nr.</small><b>{number}</b><small>Datum</small><b>02.10.2026</b><small>Zahlbar bis</small><b>01.11.2026</b></div></div>
    <div className="paper-intro"><b>Website Redesign</b><p>Vielen Dank für die Zusammenarbeit. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen.</p></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{positions.map((item,index)=><tr key={index}><td>{item.description}</td><td>{item.quantity}</td><td>{formatMoney(toNumber(item.price))}</td><td>{formatMoney(toNumber(item.quantity)*toNumber(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{formatMoney(subtotal)}</b></span><span>MwSt. 8.1% <b>{formatMoney(vat)}</b></span><strong>Total CHF <b>{formatMoney(total)}</b></strong></div>
    <section className="qr-payment"><div className="qr-code" aria-label="QR-Code Vorschau"><i/><i/><i/></div><div className="qr-info"><small>Konto / Zahlbar an</small><b>CH93 0076 2011 6238 5295 7</b><span>Binso GmbH<br/>Weissbadstrasse 8b<br/>9050 Appenzell</span><small>Referenz</small><b>21 00000 00003 13947 14300 09017</b></div><div className="qr-amount"><small>Währung</small><b>CHF</b><small>Betrag</small><b>{formatMoney(total)}</b></div></section>
    <footer>Binso GmbH · CHE-173.401.068 · www.binso.ch · +41 58 510 88 58</footer>
  </div>;
}

export function OfferPreview({
  number="AN-2026-012",
  customer="Acme AG",
  positions=[
    {description:"Website Konzept",quantity:"24",price:"120.00"},
    {description:"Design & Umsetzung",quantity:"12",price:"95.00"},
  ],
  subtotal=4020,
  vat=326.4,
  total=4346.4,
}: {
  number?:string;
  customer?:string;
  positions?:Position[];
  subtotal?:number;
  vat?:number;
  total?:number;
}) {
  return <div className="paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>ANGEBOT</span></div>
    <div className="paper-meta"><div><b>{customer}</b><span>Bahnhofstrasse 123</span><span>8001 Zürich</span></div><div><small>Angebot Nr.</small><b>{number}</b><small>Datum</small><b>02.10.2026</b><small>Gültig bis</small><b>31.10.2026</b></div></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{positions.map((item,index)=><tr key={index}><td>{item.description}</td><td>{item.quantity}</td><td>{formatMoney(toNumber(item.price))}</td><td>{formatMoney(toNumber(item.quantity)*toNumber(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{formatMoney(subtotal)}</b></span><span>MwSt. 8.1% <b>{formatMoney(vat)}</b></span><strong>Total CHF <b>{formatMoney(total)}</b></strong></div>
    <footer>Vielen Dank für dein Vertrauen.</footer>
  </div>;
}
