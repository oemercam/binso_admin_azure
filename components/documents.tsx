"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { Button, EmptyState, Field, Icon, IconButton, Toast } from "./ui";
import { apiGet, apiPatch, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

type DocumentKind = "Rechnung" | "Angebot";

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  price: string;
};

type DocumentDraft = {
  customer: string;
  number: string;
  date: string;
  due: string;
  vatRate: string;
  note: string;
  positions: LineItem[];
};

const customerData: Record<string,{ sector:string; city:string; address:string; zip:string }> = {
  "Acme AG": { sector:"Bauunternehmen", city:"Zürich", address:"Bahnhofstrasse 123", zip:"8001" },
  "Müller GmbH": { sector:"Immobilien", city:"Bern", address:"Bundesplatz 8", zip:"3011" },
  "Berger Bau AG": { sector:"Bauunternehmen", city:"Luzern", address:"Pilatusstrasse 20", zip:"6003" },
};

type CustomerDirectory = typeof customerData;

function useCustomerDirectory() {
  const [directory,setDirectory]=useState<Record<string,{sector:string;city:string;address:string;zip:string}>>(customerData);
  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    apiGet<{items:Array<{name:string;sector?:string;street?:string;postal_code?:string;city?:string}>}>("/api/customers")
      .then(payload=>{
        const next:Record<string,{sector:string;city:string;address:string;zip:string}>={};
        for(const item of payload.items){
          next[item.name]={sector:item.sector??"—",city:item.city??"—",address:item.street??"",zip:item.postal_code??""};
        }
        queueMicrotask(()=>setDirectory(next));
      })
      .catch(()=>queueMicrotask(()=>setDirectory({})));
  },[]);
  return directory;
}

function createInitialDraft(kind:DocumentKind, number:string):DocumentDraft {
  return {
    customer:"Acme AG",
    number,
    date:"2026-10-02",
    due:kind==="Rechnung" ? "30" : "2026-10-31",
    vatRate:"8.1",
    note:"",
    positions:[
      { id:"line-1", description:"Website Konzept", quantity:"24", price:"120.00" },
      { id:"line-2", description:"Design & Umsetzung", quantity:"12", price:"95.00" },
    ],
  };
}

function numberValue(value:string) {
  const normalized=value.replace(/['’\s]/g,"").replace(",",".");
  const parsed=Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value:number) {
  return new Intl.NumberFormat("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
}

function isoToSwiss(value:string) {
  const parts=value.split("-");
  return parts.length===3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : value;
}

function invoiceDueDate(date:string, days:string) {
  const base=new Date(`${date}T12:00:00`);
  const amount=Number(days);
  if(Number.isNaN(base.getTime()) || !Number.isFinite(amount)) return date;
  base.setDate(base.getDate()+amount);
  return `${String(base.getDate()).padStart(2,"0")}.${String(base.getMonth()+1).padStart(2,"0")}.${base.getFullYear()}`;
}

function invoiceDueIso(date:string,days:string) {
  const base=new Date(`${date}T12:00:00`);
  const amount=Number(days);
  if(Number.isNaN(base.getTime()) || !Number.isFinite(amount)) return date;
  base.setDate(base.getDate()+amount);
  return `${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,"0")}-${String(base.getDate()).padStart(2,"0")}`;
}

function documentPayload(kind:DocumentKind,draft:DocumentDraft) {
  return {
    kind:kind==="Rechnung"?"invoice":"offer",
    customerName:draft.customer,
    number:draft.number,
    issueDate:draft.date,
    dueDate:kind==="Rechnung"?invoiceDueIso(draft.date,draft.due):null,
    validUntil:kind==="Angebot"?draft.due:null,
    vatRate:numberValue(draft.vatRate),
    note:draft.note,
    currency:"CHF",
    items:draft.positions.map(item=>({description:item.description,quantity:numberValue(item.quantity),unitPrice:numberValue(item.price)})),
  };
}

function useStoredDraft(key:string, initial:DocumentDraft) {
  const [draft,setDraft]=useState(initial);
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    if(isProductionBackendEnabled()){
      queueMicrotask(()=>setReady(true));
      return;
    }
    const stored=window.localStorage.getItem(key);
    queueMicrotask(()=>{
      if(stored){
        try {
          const parsed=JSON.parse(stored) as DocumentDraft;
          if(parsed && Array.isArray(parsed.positions)) setDraft(parsed);
        } catch {
          // Invalid demo draft: keep safe defaults.
        }
      }
      setReady(true);
    });
  },[key]);

  useEffect(()=>{
    if(!ready || isProductionBackendEnabled()) return;
    window.localStorage.setItem(key,JSON.stringify(draft));
  },[draft,key,ready]);

  return [draft,setDraft] as const;
}

function useDocumentTotals(draft:DocumentDraft) {
  return useMemo(()=>{
    const subtotal=draft.positions.reduce((sum,item)=>sum+(numberValue(item.quantity)*numberValue(item.price)),0);
    const vat=subtotal*(numberValue(draft.vatRate)/100);
    return { subtotal, vat, total:subtotal+vat };
  },[draft]);
}

function remoteDraftFromItem(item:Record<string,unknown>,kind:DocumentKind):DocumentDraft {
  const customer=item.customer as {name?:string}|null|undefined;
  const rawItems=Array.isArray(item.items)?item.items as Array<Record<string,unknown>>:[];
  const issueDate=String(item.issue_date??new Date().toISOString().slice(0,10));
  const dueDate=String(item.due_date??"");
  let due="30";
  if(kind==="Angebot") due=String(item.valid_until??issueDate);
  else if(dueDate){
    const start=new Date(issueDate+"T12:00:00");
    const end=new Date(dueDate+"T12:00:00");
    const days=Math.round((end.getTime()-start.getTime())/86400000);
    due=["10","30","45"].includes(String(days))?String(days):"30";
  }
  return {
    customer:String(customer?.name??""),
    number:String(item.number??""),
    date:issueDate,
    due,
    vatRate:String(item.vat_rate??"8.1"),
    note:String(item.note??""),
    positions:rawItems.sort((a,b)=>Number(a.position??0)-Number(b.position??0)).map((line,index)=>({
      id:String(line.id??("line-"+(index+1))),
      description:String(line.description??""),
      quantity:String(line.quantity??"1"),
      price:String(line.unit_price??"0.00"),
    })),
  };
}

function useExistingDocument(kind:DocumentKind,documentKey:string|undefined,setDraft:(draft:DocumentDraft)=>void){
  useEffect(()=>{
    if(!isProductionBackendEnabled()||!documentKey) return;
    apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey))
      .then(payload=>queueMicrotask(()=>setDraft(remoteDraftFromItem(payload.item,kind))))
      .catch(()=>undefined);
  },[documentKey,kind,setDraft]);
}

export function OfferEditor({ existing = false, documentKey }: { existing?: boolean; documentKey?: string }) {
  return <DocumentPage kind="Angebot" existing={existing} documentKey={documentKey}/>;
}

export function InvoiceEditor({ existing = false, documentKey }: { existing?: boolean; documentKey?: string }) {
  return <DocumentPage kind="Rechnung" existing={existing} documentKey={documentKey}/>;
}

function DocumentPage({kind,existing=false,documentKey}:{kind:DocumentKind;existing?:boolean;documentKey?:string}){
  const router=useRouter();
  const searchParams=useSearchParams();
  const plural=kind==="Angebot"?"angebote":"rechnungen";
  const returnTo=!existing&&searchParams.get("returnTo")==="/dashboard"?"/dashboard":"/"+plural;
  const production=useBackendMode();
  const [preview,setPreview]=useState(false);
  const [editing,setEditing]=useState(!existing);
  const [moreOpen,setMoreOpen]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const number=kind==="Angebot"?"AN-2026-012":"RE-2026-019";
  const storageKey=kind==="Angebot"?"binso.demo.offer.AN-2026-012":"binso.demo.invoice.RE-2026-019";
  const [draft,setDraft]=useStoredDraft(storageKey,createInitialDraft(kind,number));
  const directory=useCustomerDirectory();
  useExistingDocument(kind,existing?documentKey:undefined,setDraft);
  const sourceOffer=kind==="Rechnung"?searchParams.get("sourceOffer"):null;

  useEffect(()=>{
    if(existing||!sourceOffer||kind!=="Rechnung") return;
    if(isProductionBackendEnabled()){
      apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(sourceOffer))
        .then(payload=>queueMicrotask(()=>{
          const source=remoteDraftFromItem(payload.item,"Angebot");
          setDraft(current=>({...source,number:current.number,date:current.date,due:"30"}));
        })).catch(()=>undefined);
      return;
    }
    const stored=window.localStorage.getItem("binso.demo.offer.AN-2026-012");
    if(!stored)return;
    try{
      const source=JSON.parse(stored) as DocumentDraft;
      if(source&&Array.isArray(source.positions)) queueMicrotask(()=>setDraft(current=>({...source,number:current.number,date:current.date,due:"30"})));
    }catch{/* keep defaults */}
  },[existing,sourceOffer,kind,setDraft]);

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    const names=Object.keys(directory);
    if(names.length&&(!draft.customer||!directory[draft.customer])) queueMicrotask(()=>setDraft(current=>({...current,customer:names[0]})));
  },[directory,draft.customer,setDraft]);

  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2300);};
  const save=async()=>{
    if(isProductionBackendEnabled()&&!draft.customer){show("Bitte zuerst einen Kunden erfassen.");return;}
    try{
      if(isProductionBackendEnabled()){
        const payload=documentPayload(kind,draft);
        if(existing) await apiPatch("/api/documents/"+encodeURIComponent(documentKey??draft.number),payload);
        else await apiPost("/api/documents",payload);
      }
      show(existing?`${kind} gespeichert.`:`${kind} erstellt.`);
      if(existing)setEditing(false);
      else window.setTimeout(()=>router.push("/"+plural+"/"+encodeURIComponent(draft.number)),900);
    }catch(error){
      show(error instanceof Error?error.message:`${kind} konnte nicht gespeichert werden.`);
    }
  };

  const title=existing?`${kind} ${draft.number}`:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/><IconButton label="Bearbeiten" icon="edit" onClick={()=>setEditing(true)}/><IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : undefined;

  return <AppShell title={title} subtitle={existing&&!editing?undefined:production?"Wird sicher gespeichert":"Entwurf wird lokal automatisch gespeichert"} active={plural} backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={headerActions} mobileActions={headerActions} preview={preview}>
    {sourceOffer&&!existing&&<div className="document-source-note"><span>Erstellt aus Angebot</span><b>{sourceOffer}</b></div>}
    {existing&&!editing
      ? <DocumentReadView type={kind} draft={draft} directory={directory}/>
      : <DocumentEditor type={kind} draft={draft} onChange={setDraft} directory={directory}/>}
    {editing&&<div className="mobile-document-bar single-action"><Button onClick={()=>void save()}>{existing?"Speichern":kind+" erstellen"}</Button></div>}
    {preview&&<DocumentModal title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}>{kind==="Angebot"?<OfferPreview draft={draft} directory={directory}/>:<InvoicePreview draft={draft} directory={directory}/>}</DocumentModal>}
    {moreOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setMoreOpen(false)}}><section className="bottom-sheet document-more-sheet" role="dialog" aria-modal="true" aria-label="Weitere Aktionen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Weitere Aktionen</h2><p>{draft.number}</p></div><IconButton label="Schliessen" icon="close" onClick={()=>setMoreOpen(false)}/></header><div className="sheet-menu">{kind==="Angebot"?<><button type="button" onClick={()=>{setMoreOpen(false);show("Angebot für den Versand vorbereitet.")}}><span className="sheet-menu-icon"><Icon name="mail"/></span><div><b>Senden</b><small>Angebot für den Versand vorbereiten</small></div><Icon name="arrow" size={17}/></button><Link href={"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)}><span className="sheet-menu-icon"><Icon name="receipt"/></span><div><b>Rechnung erstellen</b><small>Daten aus diesem Angebot übernehmen</small></div><Icon name="arrow" size={17}/></Link></>:<><button type="button" onClick={()=>{setMoreOpen(false);show("Versand wird mit dem E-Mail-Dienst angebunden.")}}><span className="sheet-menu-icon"><Icon name="mail"/></span><div><b>Senden</b><small>Rechnung versenden</small></div><Icon name="arrow" size={17}/></button><Link href="/zahlungen/neu"><span className="sheet-menu-icon"><Icon name="wallet"/></span><div><b>Zahlung erfassen</b><small>Zahlung zuordnen</small></div><Icon name="arrow" size={17}/></Link></>}</div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("Bitte")?"danger":"success"}/>}
  </AppShell>;
}

function DocumentReadView({type,draft,directory}:{type:DocumentKind;draft:DocumentDraft;directory:CustomerDirectory}){
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer]??customerData[draft.customer]??{sector:"—",city:"—",address:"",zip:""};
  return <div className="document-detail-view">
    <section className="document-detail-section"><span className="eyebrow">KUNDE</span><h2>{draft.customer}</h2><p>{[customer.address,[customer.zip,customer.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p></section>
    <section className="document-facts"><div><small>{type}datum</small><b>{isoToSwiss(draft.date)}</b></div><div><small>{type==="Angebot"?"Gültig bis":"Zahlungsziel"}</small><b>{type==="Angebot"?isoToSwiss(draft.due):draft.due+" Tage"}</b></div><div><small>MwSt.</small><b>{draft.vatRate}%</b></div></section>
    <section className="document-detail-section document-lines-section"><div className="section-title"><h2>Positionen</h2></div><div className="document-read-lines">{draft.positions.map(item=><div key={item.id}><div><b>{item.description}</b><small>{item.quantity} × CHF {money(numberValue(item.price))}</small></div><strong>CHF {money(numberValue(item.quantity)*numberValue(item.price))}</strong></div>)}</div><div className="invoice-totals"><span>Zwischentotal <b>CHF {money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>CHF {money(totals.vat)}</b></span><strong>Total <b>CHF {money(totals.total)}</b></strong></div></section>
    {draft.note&&<section className="document-detail-section"><span className="eyebrow">NOTIZ</span><p>{draft.note}</p></section>}
  </div>;
}

function DocumentEditor({ type, draft, onChange, directory }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory }) {
  const production=useBackendMode();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
  const [noteOpen,setNoteOpen]=useState(Boolean(draft.note));
  const customer=directory[draft.customer] ?? customerData[draft.customer] ?? {sector:"—",city:"—",address:"",zip:""};

  const updatePosition=(id:string,patch:Partial<LineItem>)=>{
    onChange({...draft,positions:draft.positions.map(item=>item.id===id?{...item,...patch}:item)});
  };

  const addPosition=()=>{
    const id=typeof crypto!=="undefined"&&"randomUUID" in crypto ? crypto.randomUUID() : `line-${draft.positions.length+1}`;
    onChange({...draft,positions:[...draft.positions,{id,description:"Neue Position",quantity:"1",price:"0.00"}]});
  };

  const removePosition=(id:string)=>{
    if(draft.positions.length===1) return;
    onChange({...draft,positions:draft.positions.filter(item=>item.id!==id)});
  };

  if(production&&names.length===0){
    return <div className="invoice-workspace"><section className="invoice-form"><EmptyState icon="users" title="Zuerst einen Kunden erfassen" text="Für Angebote und Rechnungen muss mindestens ein Kunde vorhanden sein." action={<Button href="/kunden/neu">Kunde erfassen</Button>}/></section></div>;
  }

  return <div className="invoice-workspace">
    <section className={`invoice-form ${type==="Angebot"?"offer-form":""}`}>
      <div className="form-section customer-form-section">
        <Field label="Kunde auswählen">
          <select value={draft.customer} onChange={e=>onChange({...draft,customer:e.target.value})}>
            {names.map(name=><option key={name}>{name}</option>)}
          </select>
        </Field>
        <div className="document-customer-hint"><b>{draft.customer}</b><span>{customer.sector} · {customer.city}</span></div>
      </div>
      <div className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid document-meta-grid">
          <Field className="document-number-field" label={type==="Rechnung" ? "Rechnungsnummer" : "Angebotsnummer"}><input value={draft.number} onChange={e=>onChange({...draft,number:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Zahlungsziel" : "Gültig bis"}>
            {type==="Rechnung" ? <select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}><option value="10">10 Tage</option><option value="30">30 Tage</option><option value="45">45 Tage</option></select> : <input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field>
          <Field label="MwSt."><select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value})}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
        </div>
      </div>
      <div className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="icon-action" type="button" onClick={addPosition} aria-label="Position hinzufügen"><Icon name="plus" size={18}/></button></div>
        <div className="line-items document-line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span><span/></div>
          {draft.positions.map(item=>{
            const lineTotal=numberValue(item.quantity)*numberValue(item.price);
            return <div className="document-line-item" key={item.id}>
              <label className="mobile-line-field description"><span>Beschreibung</span><input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Menge</span><input aria-label="Menge" inputMode="decimal" value={item.quantity} onChange={e=>updatePosition(item.id,{quantity:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Preis</span><input aria-label="Preis" inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/></label>
              <div className="mobile-line-total"><span>Total</span><b>{money(lineTotal)}</b></div>
              <button className="line-remove" type="button" aria-label="Position entfernen" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}><Icon name="close" size={15}/></button>
            </div>;
          })}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>CHF {money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>CHF {money(totals.vat)}</b></span><strong>Total <b>CHF {money(totals.total)}</b></strong></div>
      </div>
      <div className="form-section optional-row document-note-section">{!noteOpen?<button className="text-action add-note-action" type="button" onClick={()=>setNoteOpen(true)}><Icon name="plus" size={16}/> Notiz hinzufügen</button>:<><div className="section-title"><h2>Notiz</h2>{!draft.note&&<button className="text-action" type="button" onClick={()=>setNoteOpen(false)}>Schliessen</button>}</div><Field label="Text für den Kunden"><textarea autoFocus value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optional"/></Field></>}</div>
    </section>
    <aside className="desktop-document-preview"><div className="document-preview-heading"><h2>Live-Vorschau</h2><small>Änderungen werden sofort übernommen</small></div>{type==="Rechnung" ? <InvoicePreview draft={draft} directory={directory}/> : <OfferPreview draft={draft} directory={directory}/>}</aside>
  </div>;
}

function DocumentModal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  useEffect(()=>{
    const previous=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=previous};
  },[]);
  useEffect(()=>{
    const close=(event:KeyboardEvent)=>{if(event.key==="Escape")onClose()};
    window.addEventListener("keydown",close);
    return()=>window.removeEventListener("keydown",close);
  },[onClose]);
  const share=async()=>{
    const url=window.location.href;
    if(navigator.share){
      try{await navigator.share({title,url});}catch{/* share dialog closed */}
      return;
    }
    try{await navigator.clipboard.writeText(url);}catch{/* clipboard unavailable */}
  };
  return <div className="document-modal" role="dialog" aria-modal="true" aria-label={title}>
    <header><button type="button" onClick={onClose}><Icon name="back"/>Schliessen</button><strong>{title}</strong><button type="button" aria-label="Teilen" onClick={()=>void share()}><Icon name="upload"/></button></header>
    <div className="document-modal-body">{children}</div>
  </div>;
}

export function InvoicePreview({ draft = createInitialDraft("Rechnung","RE-2026-019"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer] ?? customerData[draft.customer] ?? {sector:"",city:"",address:"",zip:""};
  const due=invoiceDueDate(draft.date,draft.due);

  return <div className="paper invoice-paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>RECHNUNG</span></div>
    <div className="sender-line">Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell</div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Rechnung Nr.</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b><small>Zahlbar bis</small><b>{due}</b></div></div>
    <div className="paper-intro"><b>Leistungen</b><p>{draft.note || "Vielen Dank für die Zusammenarbeit. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen."}</p></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>{money(totals.vat)}</b></span><strong>Total CHF <b>{money(totals.total)}</b></strong></div>
    <section className="paper-closing invoice-payment-intro"><b>Zahlungsangaben</b><p>Bitte überweise den Rechnungsbetrag bis {due} mit den nachfolgenden Zahlungsangaben.</p></section>
    <section className="qr-payment">
      <div className="qr-code" aria-label="QR-Code Vorschau"><i/><i/><i/></div>
      <div className="qr-info"><small>Konto / Zahlbar an</small><b>CH93 0076 2011 6238 5295 7</b><span>Binso GmbH<br/>Weissbadstrasse 8b<br/>9050 Appenzell</span><small>Referenz</small><b>21 00000 00003 13947 14300 09017</b></div>
      <div className="qr-amount"><small>Währung</small><b>CHF</b><small>Betrag</small><b>{money(totals.total)}</b></div>
    </section>
    <footer>Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · CHE-173.401.068 · +41 58 510 88 58 · www.binso.ch</footer>
  </div>;
}

export function OfferPreview({ draft = createInitialDraft("Angebot","AN-2026-012"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer] ?? customerData[draft.customer] ?? {sector:"",city:"",address:"",zip:""};

  return <div className="paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>ANGEBOT</span></div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Angebot Nr.</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b><small>Gültig bis</small><b>{isoToSwiss(draft.due)}</b></div></div>
    <div className="paper-intro"><b>Unser Angebot</b><p>{draft.note || "Vielen Dank für dein Interesse. Gerne bieten wir dir die folgenden Leistungen an."}</p></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>{money(totals.vat)}</b></span><strong>Total CHF <b>{money(totals.total)}</b></strong></div>
    <section className="paper-closing"><b>Konditionen</b><p>Dieses Angebot ist bis {isoToSwiss(draft.due)} gültig. Alle Beträge sind in CHF ausgewiesen. Die MwSt. von {draft.vatRate}% ist im Total enthalten.</p><p>Wir freuen uns auf die Zusammenarbeit und stehen bei Fragen gerne zur Verfügung.</p></section>
    <footer>Binso GmbH · Weissbadstrasse 8b · 9050 Appenzell · CHE-173.401.068 · +41 58 510 88 58 · www.binso.ch</footer>
  </div>;
}
