"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SwissQRBill } from "swissqrbill/svg";
import { createQrBillData, invoicePaymentIssue, responsiveQrSvg } from "@/lib/qr-bill";
import { useRouter, useSearchParams } from "next/navigation";
import { useDialogFocus } from "./use-dialog-focus";
import { AppShell } from "./app-shell";
import { Button, EmptyState, Field, Icon, IconButton, Status, Toast } from "./ui";
import { apiGet, apiPatch, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

type DocumentKind = "Rechnung" | "Angebot";

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  price: string;
  vatRate?: string;
  unit?: string;
};

type DocumentDraft = {
  id?: string;
  reference?: string;
  customer: string;
  customerId?: string;
  status?: string;
  subtotal?: number;
  vat?: number;
  total?: number;
  currency?: string;
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
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [directory,setDirectory]=useState<Record<string,{sector:string;city:string;address:string;zip:string}>>({});
  useEffect(()=>{
    apiGet<{items:Array<{name:string;sector?:string;street?:string;postal_code?:string;city?:string}>}>(isProductionBackendEnabled()?"/api/customers":"/api/demo/data?collection=customers")
      .then(payload=>{
        const next:Record<string,{sector:string;city:string;address:string;zip:string}>={};
        for(const item of payload.items){
          next[item.name]={sector:item.sector??"",city:item.city??"",address:item.street??"",zip:item.postal_code??""};
        }
        queueMicrotask(()=>setDirectory(next));
      })
      .catch(reason=>setError(reason instanceof Error?reason.message:"Kunden konnten nicht geladen werden."))
      .finally(()=>setLoading(false));
  },[]);
  return {directory,loading,error};
}

function createInitialDraft(kind:DocumentKind, number:string):DocumentDraft {
  if(!number)return {customer:"",number:"",date:"",due:kind==="Rechnung"?"30":"",vatRate:"8.1",note:"",positions:[{id:"line-1",description:"",quantity:"1",price:"0.00"}]};
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

function dateOnly(value:unknown) {
  const date=String(value??"").slice(0,10);
  return /^\d{4}-\d{2}-\d{2}$/.test(date)?date:"";
}

function isoToSwiss(value:string) {
  const parts=dateOnly(value).split("-");
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
    customerId:draft.customerId,
    number:draft.number,
    issueDate:draft.date,
    dueDate:kind==="Rechnung"?invoiceDueIso(draft.date,draft.due):null,
    validUntil:kind==="Angebot"?draft.due:null,
    vatRate:numberValue(draft.vatRate),
    note:draft.note,
    currency:draft.currency??"CHF",
    items:draft.positions.map(item=>({unit:item.unit??"Stück",description:item.description,quantity:numberValue(item.quantity),unitPrice:numberValue(item.price),vatRate:numberValue(item.vatRate??draft.vatRate)})),
  };
}

function useDocumentDraft(initial:DocumentDraft) {
  return useState(initial);
}

function useDocumentTotals(draft:DocumentDraft) {
  return useMemo(()=>{
    const subtotal=draft.positions.reduce((sum,item)=>sum+(numberValue(item.quantity)*numberValue(item.price)),0);
    const vat=draft.positions.reduce((sum,item)=>sum+numberValue(item.quantity)*numberValue(item.price)*numberValue(item.vatRate??draft.vatRate)/100,0);
    return { subtotal:Number.isFinite(draft.subtotal)?draft.subtotal!:subtotal, vat:Number.isFinite(draft.vat)?draft.vat!:vat, total:Number.isFinite(draft.total)?draft.total!:subtotal+vat };
  },[draft]);
}

function remoteDraftFromItem(item:Record<string,unknown>,kind:DocumentKind):DocumentDraft {
  const customer=item.customer as {name?:string}|null|undefined;
  const rawItems=Array.isArray(item.items)?item.items as Array<Record<string,unknown>>:[];
  const issueDate=dateOnly(item.issue_date);
  const dueDate=dateOnly(item.due_date);
  let due="";
  if(kind==="Angebot") due=dateOnly(item.valid_until)||issueDate;
  else if(dueDate){
    const start=new Date(issueDate+"T12:00:00");
    const end=new Date(dueDate+"T12:00:00");
    const days=Math.round((end.getTime()-start.getTime())/86400000);
    due=Number.isFinite(days)?String(days):"";
  }
  return {
    id:String(item.id??""),
    reference:String(item.qr_reference??""),
    customer:String(customer?.name??""),
    customerId:String(item.customer_id??""),
    currency:String(item.currency??"CHF"),
    status:String(item.status??"draft"),
    subtotal:Number(item.subtotal),
    vat:Number(item.vat_amount),
    total:Number(item.total),
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
      unit:String(line.unit??"Stück"),
      vatRate:String(line.vat_rate??item.vat_rate??"0"),
    })),
  };
}

function useExistingDocument(kind:DocumentKind,documentKey:string|undefined,setDraft:(draft:DocumentDraft)=>void){
  const [loading,setLoading]=useState(Boolean(documentKey));
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    if(!documentKey) return;
    const url=isProductionBackendEnabled()?"/api/documents/"+encodeURIComponent(documentKey):"/api/demo/data?collection=documents&number="+encodeURIComponent(documentKey);
    apiGet<{item?:Record<string,unknown>;items?:Array<Record<string,unknown>>}>(url)
      .then(payload=>{const item=payload.item??payload.items?.[0];if(!item)throw new Error("Dokument wurde nicht gefunden.");setDraft(remoteDraftFromItem(item,kind));setLoading(false);setError(null);})
      .catch(error=>{setLoading(false);setError(error instanceof Error?error.message:"Dokument konnte nicht geladen werden.");});
  },[documentKey,kind,setDraft]);
  return {loading,error};
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
  const [saving,setSaving]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [draft,setDraft]=useDocumentDraft(createInitialDraft(kind,""));
  const {directory,loading:customersLoading,error:customersError}=useCustomerDirectory();
  const company=useDocumentCompany();
  const companyPending=kind==="Rechnung"&&company.loading;
  const paymentIssue=kind==="Rechnung"&&!company.loading?(company.error||invoicePaymentIssue(company.raw)):null;
  const documentLoad=useExistingDocument(kind,existing?documentKey:undefined,setDraft);
  useEffect(()=>{if(existing)return;queueMicrotask(()=>setDraft(current=>({...current,date:current.date||new Date().toLocaleDateString("en-CA"),customer:current.customer||Object.keys(directory)[0]||""})))},[existing,directory,setDraft]);
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
    apiGet<{items:Array<Record<string,unknown>>}>("/api/demo/data?collection=documents&number="+encodeURIComponent(sourceOffer)).then(payload=>{if(payload.items[0]){const source=remoteDraftFromItem(payload.items[0],"Angebot");setDraft(current=>({...source,number:current.number,date:current.date,due:"30"}));}}).catch(()=>undefined);
  },[existing,sourceOffer,kind,setDraft]);

  useEffect(()=>{
    if(existing||!isProductionBackendEnabled()) return;
    const names=Object.keys(directory);
    if(names.length&&(!draft.customer||!directory[draft.customer])) queueMicrotask(()=>setDraft(current=>({...current,customer:names[0]})));
  },[existing,directory,draft.customer,setDraft]);

  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2300);};
  const save=async()=>{
    if(saving||companyPending)return;
    if(isProductionBackendEnabled()&&!draft.customer){show("Bitte zuerst einen Kunden erfassen.");return;}
    if(paymentIssue){show(paymentIssue);return;}
    setSaving(true);
    let savedNumber=draft.number;
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload=documentPayload(kind,draft);
        const response=existing?await apiPatch<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number),payload):await apiPost<{item:Record<string,unknown>}>("/api/documents",payload);
        savedNumber=String(response.item.number);
        setDraft(remoteDraftFromItem(response.item,kind));
      }
      setDirty(false);
      show(existing?`${kind} gespeichert.`:`${kind} erstellt.`);
      if(existing)setEditing(false);
      else window.setTimeout(()=>router.push("/"+plural+"/"+encodeURIComponent(savedNumber)),900);
    }catch(error){
      show(error instanceof Error?error.message:`${kind} konnte nicht gespeichert werden.`);
    }finally{setSaving(false);}
  };

  const title=existing?`${kind} ${draft.number||documentKey||""}`:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/><IconButton label="Bearbeiten" icon="edit" onClick={()=>setEditing(true)}/><IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : <Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</Button>;
  const desktopActions=existing&&!editing?undefined:headerActions;

  return <AppShell title={title} subtitle={existing&&!editing?undefined:production?"Wird sicher gespeichert":"Schreibgeschützte Vorschau"} active={plural} backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={desktopActions} mobileActions={existing&&!editing?headerActions:undefined} preview={preview} editing={editing} unsavedChanges={dirty}>
    {editing&&companyPending&&<p role="status">Firmendaten werden geladen …</p>}
    {editing&&paymentIssue&&<div className="document-source-note" role="status"><span>{paymentIssue}</span><Link href="/einstellungen/dokumente">Einstellungen</Link></div>}
    {sourceOffer&&!existing&&<div className="document-source-note"><span>Erstellt aus Angebot</span><b>{sourceOffer}</b></div>}
    {customersLoading?<p role="status">Kunden werden geladen …</p>:customersError?<p role="alert">{customersError}</p>:documentLoad.loading?<p role="status">Dokument wird geladen …</p>:documentLoad.error?<EmptyState icon="file" title="Dokument konnte nicht geladen werden" text={documentLoad.error}/>:existing&&!editing
      ? <div className="document-desktop-workspace">
          <div className="document-desktop-detail"><DocumentReadView type={kind} draft={draft} directory={directory}/></div>
          <aside className="document-desktop-rail">
            <section className="document-toolbox" aria-label="Dokumentaktionen">
              <span className="compact-section-label">Aktionen</span>
              <button type="button" onClick={()=>setEditing(true)}><Icon name="edit" size={17}/><span><b>Bearbeiten</b><small>Dokumentdaten ändern</small></span><Icon name="arrow" size={15}/></button>
              <button type="button" onClick={()=>setPreview(true)}><Icon name="file" size={17}/><span><b>Vorschau öffnen</b><small>Dokument gross anzeigen</small></span><Icon name="arrow" size={15}/></button>
              <button type="button" onClick={()=>show(kind==="Angebot"?"Angebot für den Versand vorbereitet.":"Versand wird mit dem E-Mail-Dienst angebunden.")}><Icon name="mail" size={17}/><span><b>Senden</b><small>{kind==="Angebot"?"Angebot versenden":"Rechnung versenden"}</small></span><Icon name="arrow" size={15}/></button>
              {kind==="Angebot"
                ? <Link href={"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)}><Icon name="receipt" size={17}/><span><b>Rechnung erstellen</b><small>Daten aus Angebot übernehmen</small></span><Icon name="arrow" size={15}/></Link>
                : <Link href="/zahlungen/neu"><Icon name="wallet" size={17}/><span><b>Zahlung erfassen</b><small>Zahlung zuordnen</small></span><Icon name="arrow" size={15}/></Link>}
            </section>
            <section className="document-inline-preview">
              <div className="document-preview-heading"><h2>Vorschau</h2><button type="button" className="text-action" onClick={()=>setPreview(true)}>Vergrössern</button></div>
              {kind==="Angebot"?<OfferPreview draft={draft} directory={directory}/>:<InvoicePreview draft={draft} directory={directory}/>}
            </section>
          </aside>
        </div>
      : <DocumentEditor type={kind} draft={draft} onChange={next=>{setDirty(true);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory}/>}
    {editing&&<div className="mobile-document-bar single-action"><Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{existing?"Speichern":kind+" erstellen"}</Button></div>}
    {preview&&<DocumentModal title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}>{kind==="Angebot"?<OfferPreview draft={draft} directory={directory}/>:<InvoicePreview draft={draft} directory={directory}/>}</DocumentModal>}
    {moreOpen&&<div className="sheet-layer" onMouseDown={e=>{if(e.target===e.currentTarget)setMoreOpen(false)}}><section className="bottom-sheet document-more-sheet" role="dialog" aria-modal="true" aria-label="Weitere Aktionen"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Weitere Aktionen</h2><p>{draft.number}</p></div><IconButton label="Schliessen" icon="close" onClick={()=>setMoreOpen(false)}/></header><div className="sheet-menu">{kind==="Angebot"?<><button type="button" onClick={()=>{setMoreOpen(false);show("Angebot für den Versand vorbereitet.")}}><span className="sheet-menu-icon"><Icon name="mail"/></span><div><b>Senden</b><small>Angebot für den Versand vorbereiten</small></div><Icon name="arrow" size={17}/></button><Link href={"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)}><span className="sheet-menu-icon"><Icon name="receipt"/></span><div><b>Rechnung erstellen</b><small>Daten aus diesem Angebot übernehmen</small></div><Icon name="arrow" size={17}/></Link></>:<><button type="button" onClick={()=>{setMoreOpen(false);show("Versand wird mit dem E-Mail-Dienst angebunden.")}}><span className="sheet-menu-icon"><Icon name="mail"/></span><div><b>Senden</b><small>Rechnung versenden</small></div><Icon name="arrow" size={17}/></button><Link href="/zahlungen/neu"><span className="sheet-menu-icon"><Icon name="wallet"/></span><div><b>Zahlung erfassen</b><small>Zahlung zuordnen</small></div><Icon name="arrow" size={17}/></Link></>}</div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("Bitte")?"danger":"success"}/>}
  </AppShell>;
}

function DocumentReadView({type,draft,directory}:{type:DocumentKind;draft:DocumentDraft;directory:CustomerDirectory}){
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer]??{sector:"",city:"",address:"",zip:""};
  return <div className="document-detail-view">
    <section className="document-detail-section"><span className="eyebrow">KUNDE</span><h2>{draft.customer}</h2>{[customer.address,customer.zip,customer.city].some(Boolean)&&<p>{[customer.address,[customer.zip,customer.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p>}{draft.status&&<Status tone={draft.status==="paid"?"success":draft.status==="overdue"||draft.status==="cancelled"?"danger":"neutral"}>{({draft:"Entwurf",sent:"Gestellt",open:"Offen",paid:"Bezahlt",partial:"Teilweise bezahlt",overdue:"Überfällig",cancelled:"Storniert",accepted:"Angenommen",rejected:"Abgelehnt"} as Record<string,string>)[draft.status]??draft.status}</Status>}</section>
    <section className="document-facts"><div><small>{type}datum</small><b>{isoToSwiss(draft.date)}</b></div><div><small>{type==="Angebot"?"Gültig bis":"Zahlungsfrist"}</small><b>{type==="Angebot"?isoToSwiss(draft.due):(draft.due?draft.due+" Tage":"Nicht hinterlegt")}</b></div><div><small>MwSt.</small><b>{Number(draft.vatRate).toFixed(2)} %</b></div></section>
    <section className="document-detail-section document-lines-section">
      <div className="section-title"><h2>Positionen</h2></div>
      <div className="document-read-table">
        <div className="document-read-head" aria-hidden="true"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span></div>
        {draft.positions.map(item=><div className="document-read-row" key={item.id}>
          <b>{item.description}</b>
          <span>{item.quantity}</span>
          <span>{draft.currency??"CHF"} {money(numberValue(item.price))}</span>
          <strong>{draft.currency??"CHF"} {money(numberValue(item.quantity)*numberValue(item.price))}</strong>
        </div>)}
      </div>
      <div className="invoice-totals"><span>Zwischentotal <b>{draft.currency??"CHF"} {money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toFixed(2)} % <b>{draft.currency??"CHF"} {money(totals.vat)}</b></span><strong>Total <b>{draft.currency??"CHF"} {money(totals.total)}</b></strong></div>
    </section>
    {draft.note&&<section className="document-detail-section"><span className="eyebrow">NOTIZ</span><p>{draft.note}</p></section>}
  </div>;
}

function DocumentEditor({ type, draft, onChange, directory }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory }) {
  const production=useBackendMode();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
  const [noteOpen,setNoteOpen]=useState(Boolean(draft.note));
  const [mobilePositionId,setMobilePositionId]=useState<string|null>(null);
  const [positionDraft,setPositionDraft]=useState<LineItem|null>(null);
  const closePosition=()=>{setMobilePositionId(null);setPositionDraft(null);};
  const positionDialogRef=useDialogFocus(mobilePositionId!==null,closePosition);
  const customer=directory[draft.customer] ?? {sector:"",city:"",address:"",zip:""};

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
        <span className="compact-section-label">Kunde</span>
        <Field label="Kunde auswählen">
          <select value={draft.customer} onChange={e=>onChange({...draft,customer:e.target.value,customerId:undefined})}>
            {names.map(name=><option key={name}>{name}</option>)}
          </select>
        </Field>
        {[customer.sector,customer.city].some(Boolean)&&<div className="document-customer-hint"><span>{[customer.sector,customer.city].filter(Boolean).join(" · ")}</span></div>}
      </div>
      <div className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid document-meta-grid">
          <Field className="document-number-field" label={type==="Rechnung" ? "Rechnungsnummer" : "Angebotsnummer"}><input value={draft.number} placeholder="Wird beim Erstellen vergeben" readOnly aria-readonly="true"/></Field>
          <Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Zahlungsfrist" : "Gültig bis"}>
            {type==="Rechnung" ? <select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}>{!["10","30","45"].includes(draft.due)&&<option value={draft.due}>{draft.due} Tage</option>}<option value="10">10 Tage</option><option value="30">30 Tage</option><option value="45">45 Tage</option></select> : <input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field>
          <Field label="MwSt."><select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value,positions:draft.positions.map(item=>({...item,vatRate:e.target.value}))})}><option value="8.1">8.10 %</option><option value="2.6">2.60 %</option><option value="0">0.00 %</option></select></Field>
        </div>
      </div>
      <div className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="icon-action" type="button" onClick={addPosition} aria-label="Position hinzufügen"><Icon name="plus" size={18}/></button></div>
        <div className="line-items document-line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Preis</span><span>Total</span><span/></div>
          {draft.positions.map(item=>{
            const lineTotal=numberValue(item.quantity)*numberValue(item.price);
            return <div className="document-line-item" key={item.id}>
              <button className="mobile-position-summary" type="button" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}>
                <span><b>{item.description}</b><small>{item.quantity} × {draft.currency??"CHF"} {money(numberValue(item.price))}</small></span>
                <strong>{draft.currency??"CHF"} {money(lineTotal)}</strong><Icon name="arrow" size={16}/>
              </button>
              <label className="mobile-line-field description"><span>Beschreibung</span><input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Menge</span><input aria-label="Menge" inputMode="decimal" value={item.quantity} onChange={e=>updatePosition(item.id,{quantity:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Preis</span><input aria-label="Preis" inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/></label>
              <div className="mobile-line-total"><span>Total</span><b>{money(lineTotal)}</b></div>
              <button className="line-remove" type="button" aria-label="Position entfernen" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}><Icon name="close" size={15}/></button>
            </div>;
          })}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>{draft.currency??"CHF"} {money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toFixed(2)} % <b>{draft.currency??"CHF"} {money(totals.vat)}</b></span><strong>Total <b>{draft.currency??"CHF"} {money(totals.total)}</b></strong></div>
      </div>
      {mobilePositionId&&(()=>{const item=positionDraft;if(!item)return null;return <div className="sheet-layer mobile-position-layer" onMouseDown={event=>{if(event.target===event.currentTarget)closePosition()}}><section ref={positionDialogRef} tabIndex={-1} className="bottom-sheet mobile-position-sheet" role="dialog" aria-modal="true" aria-label="Position bearbeiten"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Position bearbeiten</h2><p>{item.description}</p></div><IconButton label="Schliessen" icon="close" onClick={()=>closePosition()}/></header><div className="sheet-body mobile-position-fields"><Field label="Beschreibung"><input value={item.description} onChange={e=>setPositionDraft({...item,description:e.target.value})}/></Field><div><Field label="Menge"><input inputMode="decimal" value={item.quantity} onChange={e=>setPositionDraft({...item,quantity:e.target.value})}/></Field><Field label="Preis"><input inputMode="decimal" value={item.price} onChange={e=>setPositionDraft({...item,price:e.target.value})}/></Field></div><div className="mobile-position-sheet-total"><span>Total</span><b>{draft.currency??"CHF"} {money(numberValue(item.quantity)*numberValue(item.price))}</b></div><button className="text-action mobile-position-remove" type="button" disabled={draft.positions.length===1} onClick={()=>{removePosition(item.id);closePosition()}}>Position entfernen</button></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={closePosition}>Abbrechen</Button><Button onClick={()=>{updatePosition(item.id,item);closePosition()}}>Übernehmen</Button></div></section></div>})()}
      <div className="form-section optional-row document-note-section">{!noteOpen?<button className="text-action add-note-action" type="button" onClick={()=>setNoteOpen(true)}><Icon name="plus" size={16}/> Notiz hinzufügen</button>:<><div className="section-title"><h2>Notiz</h2>{!draft.note&&<button className="text-action" type="button" onClick={()=>setNoteOpen(false)}>Schliessen</button>}</div><Field label="Text für den Kunden"><textarea autoFocus value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optional"/></Field></>}</div>
    </section>
    <aside className="desktop-document-preview"><div className="document-preview-heading"><h2>Live-Vorschau</h2><small>Änderungen werden sofort übernommen</small></div>{type==="Rechnung" ? <InvoicePreview draft={draft} directory={directory}/> : <OfferPreview draft={draft} directory={directory}/>}</aside>
  </div>;
}

function DocumentModal({ title, onClose, children }: { title:string; onClose:()=>void; children:React.ReactNode }) {
  const [zoomed,setZoomed]=useState(false);
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
    <header><span className="document-modal-header-spacer" aria-hidden="true"/><strong>{title}</strong><div className="document-modal-header-actions"><button type="button" aria-label={zoomed?"Auf Bildschirm einpassen":"Vorschau vergrössern"} aria-pressed={zoomed} onClick={()=>setZoomed(value=>!value)}><Icon name="search"/></button><button type="button" aria-label="Teilen" onClick={()=>void share()}><Icon name="upload"/></button><button type="button" aria-label="Vorschau schliessen" onClick={onClose}><Icon name="close"/></button></div></header>
    <div className="document-modal-body"><div className={zoomed?"document-preview-content is-zoomed":"document-preview-content"}>{children}</div></div>
  </div>;
}

function useDocumentCompany(){
 const [company,setCompany]=useState<Record<string,unknown>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState<string|null>(null);
 useEffect(()=>{
   let active=true;
   if(!isProductionBackendEnabled()){queueMicrotask(()=>{if(active)setLoading(false)});return()=>{active=false;};}
   apiGet<{item:Record<string,unknown>}>('/api/settings/company')
     .then(data=>{if(active){setCompany(data.item);setError(null);}})
     .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Firmendaten konnten nicht geladen werden.");})
     .finally(()=>{if(active)setLoading(false);});
   return()=>{active=false;};
 },[]);
 return {loading,error,raw:company,name:String(company.legal_name||company.name||''),street:[company.street,company.building_number].filter(Boolean).join(' '),city:[company.postal_code,company.city].filter(Boolean).join(' '),iban:String(company.iban||company.qr_iban||''),logo:String(company.logo_url||''),footer:[company.name,company.uid,company.phone,company.website].filter(Boolean).join(' · ')};
}

export function InvoicePreview({ draft = createInitialDraft("Rechnung","RE-2026-019"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const company=useDocumentCompany();
  const customer=directory[draft.customer] ?? {sector:"",city:"",address:"",zip:""};
  const due=invoiceDueDate(draft.date,draft.due);
  const payment=useMemo(()=>{try{return {svg:responsiveQrSvg(new SwissQRBill(createQrBillData(company.raw,{reference:draft.reference,number:draft.number,total:totals.total,currency:draft.currency}),{language:"DE"}).toString()),issue:null};}catch(error){return {svg:"",issue:error instanceof Error?error.message:"Zahlungsinformationen konnten nicht erstellt werden."};}},[company.raw,draft.reference,draft.number,draft.currency,totals.total]);

  if(company.loading)return <p role="status">Rechnungsvorschau wird geladen …</p>;
  if(company.error)return <p role="alert">{company.error}</p>;

  return <div className="document-pages invoice-pages">
    <section className="paper invoice-paper invoice-page" aria-label="Rechnung Seite 1 von 2">
      <div className="paper-brand">{company.logo?<img src={company.logo} alt={company.name}/>:<b>{company.name}</b>}<span>RECHNUNG</span></div>
      {company.raw.is_demo===true&&<p className="demo-payment-label">Demo-Rechnung · Nicht bezahlen</p>}
      <div className="sender-line">{[company.name,company.street,company.city].filter(Boolean).join(" · ")}</div>
      <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Rechnung Nr.</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b><small>Zahlbar bis</small><b>{due}</b></div></div>
      <div className="paper-intro"><b>Leistungen</b><p>{draft.note || "Vielen Dank für die Zusammenarbeit. Wir erlauben uns, folgende Leistungen in Rechnung zu stellen."}</p></div>
      <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
      <div className="paper-total"><span>Zwischentotal <b>{money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toFixed(2)} % <b>{money(totals.vat)}</b></span><strong>Total {draft.currency??"CHF"} <b>{money(totals.total)}</b></strong></div>
      <footer>{company.footer}</footer>
    </section>
    <section className="paper invoice-paper invoice-page qr-invoice-page" aria-label="Rechnung Seite 2 von 2: Zahlungsinformationen">
      <div className="qr-page-heading"><b>{company.name}</b><span>ZAHLUNGSINFORMATIONEN</span></div>
      {company.raw.is_demo===true&&<p className="demo-payment-label">Demo-Zahlteil mit Beispielkonto · Nicht bezahlen</p>}
      <div className="qr-page-spacer" aria-hidden="true"/>
      {payment.svg?<div className="qr-payment-slip" dangerouslySetInnerHTML={{__html:payment.svg}}/>:<div className="payment-setup-notice"><b>QR-Zahlteil noch nicht verfügbar</b><p>{payment.issue}</p></div>}
    </section>
  </div>;
}

export function OfferPreview({ draft = createInitialDraft("Angebot","AN-2026-012"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const company=useDocumentCompany();
  const customer=directory[draft.customer] ?? {sector:"",city:"",address:"",zip:""};

  return <div className="paper">
    <div className="paper-brand">{company.logo?<img src={company.logo} alt={company.name}/>:<b>{company.name}</b>}<span>ANGEBOT</span></div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Angebot Nr.</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b><small>Gültig bis</small><b>{isoToSwiss(draft.due)}</b></div></div>
    <div className="paper-intro"><b>Unser Angebot</b><p>{draft.note || "Vielen Dank für dein Interesse. Gerne bieten wir dir die folgenden Leistungen an."}</p></div>
    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Preis</th><th>Total</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
    <div className="paper-total"><span>Zwischentotal <b>{money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toFixed(2)} % <b>{money(totals.vat)}</b></span><strong>Total {draft.currency??"CHF"} <b>{money(totals.total)}</b></strong></div>
    <section className="paper-closing"><b>Konditionen</b><p>Dieses Angebot ist bis {isoToSwiss(draft.due)} gültig. Alle Beträge sind in CHF ausgewiesen. Die MwSt. von {Number(draft.vatRate).toFixed(2)} % ist im Total enthalten.</p><p>Wir freuen uns auf die Zusammenarbeit und stehen bei Fragen gerne zur Verfügung.</p></section>
    <footer>{company.footer}</footer>
  </div>;
}
