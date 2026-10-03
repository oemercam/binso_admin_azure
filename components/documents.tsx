"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "./app-shell";
import { Button, EmptyState, Field, Icon, Toast } from "./ui";
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
  const router=useRouter();
  const production=useBackendMode();
  const [preview,setPreview]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [draft,setDraft]=useStoredDraft("binso.demo.offer.AN-2026-012",createInitialDraft("Angebot","AN-2026-012"));
  const directory=useCustomerDirectory();
  useExistingDocument("Angebot",existing?documentKey:undefined,setDraft);

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    const names=Object.keys(directory);
    if(names.length && (!draft.customer || !directory[draft.customer])){
      queueMicrotask(()=>setDraft(current=>({...current,customer:names[0]})));
    }
  },[directory,draft.customer,setDraft]);

  const save=async()=>{
    if(isProductionBackendEnabled()&&!draft.customer){
      setToast("Bitte zuerst einen Kunden erfassen.");
      window.setTimeout(()=>setToast(null),2400);
      return;
    }
    try{
      if(isProductionBackendEnabled()){
        if(existing) await apiPatch("/api/documents/"+encodeURIComponent(documentKey??draft.number),documentPayload("Angebot",draft));
        else await apiPost("/api/documents",documentPayload("Angebot",draft));
      }
      setToast(existing?"Angebot gespeichert.":"Angebot erstellt.");
      window.setTimeout(()=>{
        setToast(null);
        if(!existing) router.push("/angebote/"+encodeURIComponent(draft.number));
      },900);
    }catch(error){
      setToast(error instanceof Error?error.message:"Angebot konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  return <AppShell title={existing ? "Angebot "+draft.number : "Angebot erstellen"} subtitle={existing ? "Angebot bearbeiten" : production ? "Wird beim Erstellen sicher gespeichert" : "Entwurf wird lokal automatisch gespeichert"} active="angebote" backHref="/angebote" backLabel="Angebote" actions={<><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={()=>void save()}>{existing ? "Speichern" : "Angebot erstellen"}</Button></>}>
    <DocumentEditor type="Angebot" draft={draft} onChange={setDraft} directory={directory}/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={()=>void save()}>{existing ? "Speichern" : "Angebot erstellen"}</Button></div>
    {preview&&<DocumentModal title="Angebotsvorschau" onClose={()=>setPreview(false)}><OfferPreview draft={draft} directory={directory}/></DocumentModal>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("Bitte")?"danger":"success"}/>}
  </AppShell>;
}

export function InvoiceEditor({ existing = false, documentKey }: { existing?: boolean; documentKey?: string }) {
  const router=useRouter();
  const production=useBackendMode();
  const [preview,setPreview]=useState(false);
  const [toast,setToast]=useState<string|null>(null);
  const [draft,setDraft]=useStoredDraft("binso.demo.invoice.RE-2026-019",createInitialDraft("Rechnung","RE-2026-019"));
  const directory=useCustomerDirectory();
  useExistingDocument("Rechnung",existing?documentKey:undefined,setDraft);
  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2200);};

  useEffect(()=>{
    if(!isProductionBackendEnabled()) return;
    const names=Object.keys(directory);
    if(names.length && (!draft.customer || !directory[draft.customer])){
      queueMicrotask(()=>setDraft(current=>({...current,customer:names[0]})));
    }
  },[directory,draft.customer,setDraft]);

  const save=async()=>{
    if(isProductionBackendEnabled()&&!draft.customer){
      setToast("Bitte zuerst einen Kunden erfassen.");
      window.setTimeout(()=>setToast(null),2400);
      return;
    }
    try{
      if(isProductionBackendEnabled()){
        if(existing) await apiPatch("/api/documents/"+encodeURIComponent(documentKey??draft.number),documentPayload("Rechnung",draft));
        else await apiPost("/api/documents",documentPayload("Rechnung",draft));
      }
      show(existing?"Rechnung gespeichert.":"Rechnung erstellt.");
      if(!existing) window.setTimeout(()=>router.push("/rechnungen/"+encodeURIComponent(draft.number)),900);
    }catch(error){
      setToast(error instanceof Error?error.message:"Rechnung konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  return <AppShell title={existing ? "Rechnung "+draft.number : "Rechnung erstellen"} subtitle={existing ? "Rechnung bearbeiten" : production ? "Wird beim Erstellen sicher gespeichert" : "Entwurf wird lokal automatisch gespeichert"} active="rechnungen" backHref="/rechnungen" backLabel="Rechnungen" actions={<><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={()=>void save()}>{existing ? "Speichern" : "Rechnung erstellen"}</Button></>}>
    {existing&&<div className="document-actions"><Button variant="secondary" icon="mail" onClick={()=>show("Versand wird mit dem E-Mail-Dienst angebunden.")}>Senden</Button><Button href="/zahlungen/neu" variant="secondary" icon="wallet">Zahlung erfassen</Button><Button variant="ghost" onClick={()=>show("Duplizieren wird als eigener Dokument-Workflow angebunden.")}>Duplizieren</Button></div>}
    <DocumentEditor type="Rechnung" draft={draft} onChange={setDraft} directory={directory}/>
    <div className="mobile-document-bar"><Button variant="secondary" onClick={()=>setPreview(true)}>Vorschau</Button><Button onClick={()=>void save()}>{existing ? "Speichern" : "Rechnung erstellen"}</Button></div>
    {preview&&<DocumentModal title="Rechnungsvorschau" onClose={()=>setPreview(false)}><InvoicePreview draft={draft} directory={directory}/></DocumentModal>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("Bitte")?"danger":"success"}/>}
  </AppShell>;
}

function DocumentEditor({ type, draft, onChange, directory }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory }) {
  const production=useBackendMode();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
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
    <section className="invoice-form">
      <div className="form-section">
        <h2>Kunde</h2>
        <Field label="Kunde">
          <select value={draft.customer} onChange={e=>onChange({...draft,customer:e.target.value})}>
            {names.map(name=><option key={name}>{name}</option>)}
          </select>
        </Field>
        <div className="document-customer-hint"><b>{draft.customer}</b><span>{customer.sector} · {customer.city}</span></div>
      </div>
      <div className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid">
          <Field label={type==="Rechnung" ? "Rechnungsnummer" : "Angebotsnummer"}><input value={draft.number} onChange={e=>onChange({...draft,number:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Zahlungsziel" : "Gültig bis"}>
            {type==="Rechnung" ? <select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}><option value="10">10 Tage</option><option value="30">30 Tage</option><option value="45">45 Tage</option></select> : <input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field>
          <Field label="MwSt."><select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value})}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></select></Field>
        </div>
      </div>
      <div className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="text-action" type="button" onClick={addPosition}>+ Position hinzufügen</button></div>
        <div className="line-items document-line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span><span/></div>
          {draft.positions.map(item=>{
            const lineTotal=numberValue(item.quantity)*numberValue(item.price);
            return <div key={item.id}>
              <input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/>
              <input aria-label="Menge" inputMode="decimal" value={item.quantity} onChange={e=>updatePosition(item.id,{quantity:e.target.value})}/>
              <input aria-label="Preis" inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/>
              <b>{money(lineTotal)}</b>
              <button className="line-remove" type="button" aria-label="Position entfernen" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}><Icon name="close" size={15}/></button>
            </div>;
          })}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>CHF {money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>CHF {money(totals.vat)}</b></span><strong>Total <b>CHF {money(totals.total)}</b></strong></div>
      </div>
      <div className="form-section optional-row"><Field label="Notiz"><textarea value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optionaler Text für den Kunden"/></Field></div>
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
    <section className="qr-payment">
      <div className="qr-code" aria-label="QR-Code Vorschau"><i/><i/><i/></div>
      <div className="qr-info"><small>Konto / Zahlbar an</small><b>CH93 0076 2011 6238 5295 7</b><span>Binso GmbH<br/>Weissbadstrasse 8b<br/>9050 Appenzell</span><small>Referenz</small><b>21 00000 00003 13947 14300 09017</b></div>
      <div className="qr-amount"><small>Währung</small><b>CHF</b><small>Betrag</small><b>{money(totals.total)}</b></div>
    </section>
    <footer>Binso GmbH · CHE-173.401.068 · www.binso.ch · +41 58 510 88 58</footer>
  </div>;
}

export function OfferPreview({ draft = createInitialDraft("Angebot","AN-2026-012"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer] ?? customerData[draft.customer] ?? {sector:"",city:"",address:"",zip:""};

  return <div className="paper">
    <div className="paper-brand"><img src="/brand/logo-black.svg" alt="Binso"/><span>ANGEBOT</span></div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Angebot Nr.</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b><small>Gültig bis</small><b>{isoToSwiss(draft.due)}</b></div></div>
    {draft.note&&<div className="paper-intro"><p>{draft.note}</p></div>}
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{money(totals.subtotal)}</b></span><span>MwSt. {draft.vatRate}% <b>{money(totals.vat)}</b></span><strong>Total CHF <b>{money(totals.total)}</b></strong></div>
    <footer>Vielen Dank für dein Vertrauen.</footer>
  </div>;
}
