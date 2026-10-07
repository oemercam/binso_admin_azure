"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {tenantCan} from "@/lib/permissions";
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
  expenseIds?: string[];
  timeEntryIds?: string[];
};

type DocumentDraft = {
  id?: string;
  reference?: string;
  title?: string;
  customer: string;
  customerId?: string;
  status?: string;
  paidAmount?: number;
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

type CustomerDirectory = Record<string,{id?:string;sector:string;city:string;address:string;zip:string}>;

function useCustomerDirectory() {
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [directory,setDirectory]=useState<CustomerDirectory>({});
  useEffect(()=>{
    apiGet<{items:Array<{id:string;name:string;sector?:string;street?:string;postal_code?:string;city?:string}>}>(isProductionBackendEnabled()?"/api/customers":"/api/demo/data?collection=customers")
      .then(payload=>{
        const next:CustomerDirectory={};
        for(const item of payload.items){
          next[item.name]={id:item.id,sector:item.sector??"",city:item.city??"",address:item.street??"",zip:item.postal_code??""};
        }
        queueMicrotask(()=>setDirectory(next));
      })
      .catch(reason=>setError(reason instanceof Error?reason.message:"Kunden konnten nicht geladen werden."))
      .finally(()=>setLoading(false));
  },[]);
  return {directory,loading,error};
}

function createInitialDraft(kind:DocumentKind, number:string):DocumentDraft {
  if(!number)return {customer:"",number:"",date:"",due:kind==="Rechnung"?"30":"",vatRate:"8.1",note:"",positions:[{id:"line-1",description:"",quantity:"1",unit:"Stück",price:"0.00"}]};
  return {
    customer:"Acme AG",
    number,
    date:"2026-10-02",
    due:kind==="Rechnung" ? "30" : "2026-10-31",
    vatRate:"8.1",
    note:"",
    positions:[
      { id:"line-1", description:"Website Konzept", quantity:"24", unit:"Stunden", price:"120.00" },
      { id:"line-2", description:"Design & Umsetzung", quantity:"12", unit:"Stunden", price:"95.00" },
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
    items:draft.positions.map(item=>({unit:item.unit??"Stück",description:item.description,quantity:numberValue(item.quantity),unitPrice:numberValue(item.price),vatRate:numberValue(item.vatRate??draft.vatRate),expenseIds:item.expenseIds??[],timeEntryIds:item.timeEntryIds??[]})),
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
    title:String(item.title??""),
    customer:String(customer?.name??""),
    customerId:String(item.customer_id??""),
    currency:String(item.currency??"CHF"),
    status:String(item.status??"draft"),
    paidAmount:Number(item.paid_amount??0),
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
      expenseIds:Array.isArray(line.expense_ids)?line.expense_ids.map(String):[],
      timeEntryIds:Array.isArray(line.time_entry_ids)?line.time_entry_ids.map(String):[],
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
  const [documentRole,setDocumentRole]=useState("");
  const [demoDocument,setDemoDocument]=useState(true);
  const [documentReadOnly,setDocumentReadOnly]=useState(true);
  const [sendOpen,setSendOpen]=useState(false),[recipient,setRecipient]=useState("");
  const [actionBusy,setActionBusy]=useState(false),[actionError,setActionError]=useState<string|null>(null);
  const [sendKey,setSendKey]=useState("");
  useEffect(()=>{apiGet<{demo?:boolean;tenant?:{role?:string;readOnly?:boolean}}>("/api/auth/session").then(s=>{setDocumentRole(s.tenant?.role??"");setDocumentReadOnly(s.tenant?.readOnly===true);setDemoDocument(s.demo===true)}).catch(()=>{});},[]);
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
  const selectedCustomerId=!existing?searchParams.get("customerId"):null;
  useEffect(()=>{if(!selectedCustomerId)return;const customer=Object.entries(directory).find(([,item])=>item.id===selectedCustomerId);if(customer)setDraft(current=>({...current,customer:customer[0],customerId:selectedCustomerId}));},[selectedCustomerId,directory,setDraft]);
  const sourceOffer=kind==="Rechnung"?searchParams.get("sourceOffer"):null;
  const sourceTimeEntriesParam=kind==="Rechnung"?(searchParams.get("timeEntries")??""):"";

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

  const sourceExpenseParam=kind==='Rechnung'?(searchParams.get('expenses')??''):'';
  const importedSources=useRef("");
  useEffect(()=>{
    if(kind!=="Rechnung"||(!sourceTimeEntriesParam&&!sourceExpenseParam)||!isProductionBackendEnabled()||existing&&(documentLoad.loading||!draft.id))return;
    const key=(documentKey??'new')+':'+sourceTimeEntriesParam+':'+sourceExpenseParam;
    if(importedSources.current===key)return;importedSources.current=key;
    const load=async()=>{
      const times=sourceTimeEntriesParam?(await apiGet<{items:Array<{id:string;hours:number;description?:string;sales_rate:number;customer_id:string;customer_name:string;project_name:string}>}>("/api/time-entries/billing?ids="+encodeURIComponent(sourceTimeEntriesParam))).items:[];
      const expenses=sourceExpenseParam?(await apiGet<{items:Array<{id:string;customer_id:string;customer_name:string;description:string;quantity:number;unit_price:number;vat_rate:number;currency:string}>}>("/api/expenses/billing?ids="+encodeURIComponent(sourceExpenseParam))).items:[];
      if(times.length!==sourceTimeEntriesParam.split(',').filter(Boolean).length||expenses.length!==sourceExpenseParam.split(',').filter(Boolean).length)throw new Error('Mindestens ein Eintrag ist nicht mehr verrechenbar.');
      const sources=[...times,...expenses];const customer=sources[0]?.customer_id;
      if(!customer||sources.some(i=>i.customer_id!==customer)||existing&&draft.customerId!==customer)throw new Error('Alle Positionen müssen zum Kunden dieser Rechnung gehören.');
      if(existing&&draft.status!=='draft')throw new Error('Zeiten und Spesen können nur einem Rechnungsentwurf hinzugefügt werden.');
      if(expenses.some(i=>i.currency!==(existing?draft.currency:expenses[0].currency)))throw new Error('Die Währungen der Spesen und Rechnung müssen übereinstimmen.');
      if(times.length&&(existing?draft.currency:expenses[0]?.currency??draft.currency)!=='CHF')throw new Error('Stundensätze werden in CHF geführt. Für diese Zeiten ist eine CHF-Rechnung erforderlich.');
      const groups=Object.values(times.reduce<Record<string,typeof times>>((all,item)=>{(all[JSON.stringify([item.project_name,Number(item.sales_rate)])]??=[]).push(item);return all},{}));
      const positions:LineItem[]=[...groups.map((items,index)=>({id:"time-"+index,description:items[0].project_name,quantity:items.reduce((sum,item)=>sum+Number(item.hours),0).toFixed(2),unit:"Stunden",price:String(items[0].sales_rate||0),timeEntryIds:items.map(item=>item.id)})),...expenses.map(i=>({id:'expense-'+i.id,description:i.description,quantity:String(i.quantity),price:String(i.unit_price),unit:'Stück',vatRate:String(i.vat_rate),expenseIds:[i.id]}))];
      setDraft(current=>({...current,customer:sources[0].customer_name,customerId:customer,currency:expenses[0]?.currency??current.currency,positions:existing?[...current.positions,...positions]:positions,subtotal:undefined,vat:undefined,total:undefined}));setDirty(true);setEditing(true);
    };void load().catch(e=>setActionError(e instanceof Error?e.message:'Positionen konnten nicht geladen werden.'));
  },[existing,kind,sourceTimeEntriesParam,sourceExpenseParam,documentLoad.loading,draft.id,draft.customerId,draft.status,draft.currency,documentKey,setDraft]);

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
        const payload={...documentPayload(kind,draft),sourceOffer:sourceOffer||undefined,customerId:directory[draft.customer]?.id??draft.customerId};
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

  const canWrite=!documentReadOnly&&tenantCan(documentRole,kind==="Rechnung"?"invoices:write":"sales:write");
  const canEdit=canWrite&&(!existing||draft.status==="draft");
  const processAction=async(action:string)=>{if(actionBusy)return;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/status",{action});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setMoreOpen(false);show("Status aktualisiert.")}catch(e){setActionError(e instanceof Error?e.message:"Status konnte nicht geändert werden.")}finally{setActionBusy(false)}};
  const sendDocument=async()=>{if(actionBusy)return;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/send",{recipient,requestKey:sendKey});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setSendOpen(false);show("Dokument als PDF versendet.")}catch(e){setActionError(e instanceof Error?e.message:"Versand konnte nicht bestätigt werden.")}finally{setActionBusy(false)}};
  const canRecordPayment=tenantCan(documentRole,"payments:write")&&kind==="Rechnung"&&!["draft","paid","cancelled"].includes(draft.status??"draft");
  const title=existing?`${kind} ${draft.number||documentKey||""}`:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/>{canEdit&&<IconButton label="Bearbeiten" icon="edit" onClick={()=>setEditing(true)}/>}<IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/><Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</Button></div>;
  const desktopActions=headerActions;

  return <AppShell title={title} subtitle={existing&&!editing?undefined:production?"Wird sicher gespeichert":"Schreibgeschützte Vorschau"} active={plural} backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={desktopActions} mobileActions={existing&&!editing?headerActions:undefined} preview={preview} editing={editing} unsavedChanges={dirty}>
    {actionError&&!moreOpen&&!sendOpen&&<p role="alert">{actionError}</p>}
    {editing&&companyPending&&<p role="status">Firmendaten werden geladen …</p>}
    {editing&&paymentIssue&&<div className="document-source-note" role="status"><span>{paymentIssue}</span><Link href="/einstellungen/dokumente">Einstellungen</Link></div>}
    {sourceOffer&&!existing&&<div className="document-source-note"><span>Erstellt aus Angebot</span><b>{sourceOffer}</b></div>}
    {customersLoading?<p role="status">Kunden werden geladen …</p>:customersError?<p role="alert">{customersError}</p>:documentLoad.loading?<p role="status">Dokument wird geladen …</p>:documentLoad.error?<EmptyState icon="file" title="Dokument konnte nicht geladen werden" text={documentLoad.error}/>:existing&&!editing
      ? <div className="document-desktop-workspace">
          <div className="document-desktop-detail">
            <DocumentReadView type={kind} draft={draft} directory={directory}/>
          </div>
          {(kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"invoices:write")||canRecordPayment)&&<aside className="document-desktop-rail">
            <section className="document-toolbox" aria-label="Dokumentaktionen">
              <span className="compact-section-label">Aktionen</span>
              {kind==="Angebot"
                ? <Link href={"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)}><Icon name="receipt" size={17}/><span><b>Rechnung erstellen</b><small>Daten aus Angebot übernehmen</small></span><Icon name="arrow" size={15}/></Link>
                : canRecordPayment&&<Link href={"/zahlungen/neu?invoice="+encodeURIComponent(documentKey??draft.number)}><Icon name="wallet" size={17}/><span><b>Zahlung erfassen</b><small>Zahlung zuordnen</small></span><Icon name="arrow" size={15}/></Link>}
            </section>
          </aside>}
        </div>
      : <DocumentEditor type={kind} draft={draft} onChange={next=>{setDirty(true);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory}/>}
    {editing&&<div className="mobile-document-bar single-action"><Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{existing?"Speichern":kind+" erstellen"}</Button></div>}
    {preview&&<DocumentModal title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}>{kind==="Angebot"?<OfferPreview draft={draft} directory={directory}/>:<InvoicePreview draft={draft} directory={directory}/>}</DocumentModal>}
    {moreOpen&&<div className="sheet-layer"><section className="bottom-sheet document-more-sheet" role="dialog" aria-modal="true" aria-label="Weitere Aktionen"><header className="sheet-header"><h2>Weitere Aktionen</h2><IconButton label="Schliessen" icon="close" onClick={()=>setMoreOpen(false)}/></header><div className="sheet-menu">
      <a href={"/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/pdf"}><Icon name="file"/><span>PDF herunterladen</span></a>
      {canWrite&&!['cancelled','declined','expired'].includes(draft.status??'')&&<button type="button" disabled={demoDocument||actionBusy} onClick={()=>{setSendKey(crypto.randomUUID());setActionError(null);setMoreOpen(false);setSendOpen(true)}}><Icon name="mail"/><span>{demoDocument?'Versand in der Demo deaktiviert':'Als PDF senden'}</span></button>}
      {canWrite&&draft.status==='draft'&&<button type="button" disabled={actionBusy} onClick={()=>void processAction('issue')}><Icon name="check"/><span>{kind==='Rechnung'?'Rechnung stellen':'Als übergeben erfassen'}</span></button>}
      {canWrite&&kind==='Angebot'&&draft.status==='sent'&&<><button type="button" disabled={actionBusy} onClick={()=>void processAction('accept')}>Kundenannahme erfassen</button><button type="button" disabled={actionBusy} onClick={()=>void processAction('decline')}>Kundenablehnung erfassen</button></>}
      {canWrite&&kind==='Rechnung'&&Number(draft.paidAmount??0)===0&&['draft','sent','overdue'].includes(draft.status??'')&&<button type="button" disabled={actionBusy} onClick={()=>void processAction('cancel')}>Rechnung stornieren</button>}
      </div>{actionError&&<p role="alert">{actionError}</p>}</section></div>}
    {sendOpen&&<div className="sheet-layer"><section className="bottom-sheet" role="dialog" aria-modal="true" aria-label="Dokument senden"><header className="sheet-header"><div><h2>{kind} als PDF senden</h2><p>{draft.number}</p></div><IconButton label="Schliessen" icon="close" onClick={()=>setSendOpen(false)}/></header><Field label="Empfänger"><input type="email" value={recipient} onChange={e=>{setRecipient(e.target.value);setSendKey(crypto.randomUUID())}} autoComplete="email"/></Field><p>Das Dokument wird als PDF versendet. Ein Entwurf wird danach ausgestellt und ist nicht mehr bearbeitbar.</p>{actionError&&<p role="alert">{actionError}</p>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setSendOpen(false)}>Abbrechen</Button><Button disabled={actionBusy||!recipient} onClick={()=>void sendDocument()}>{actionBusy?'Wird versendet …':'PDF senden'}</Button></div></section></div>}
    {toast&&<Toast title={toast} tone={toast.includes("konnte")||toast.includes("Bitte")?"danger":"success"}/>}
  </AppShell>;
}

function DocumentReadView({type,draft,directory}:{type:DocumentKind;draft:DocumentDraft;directory:CustomerDirectory}){
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer]??{sector:"",city:"",address:"",zip:""};
  return <div className="document-detail-view">
    <section className="document-detail-section"><span className="eyebrow">KUNDE</span><h2>{draft.customer}</h2>{[customer.address,customer.zip,customer.city].some(Boolean)&&<p>{[customer.address,[customer.zip,customer.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p>}{draft.status&&<Status tone={draft.status==="paid"?"success":draft.status==="overdue"||draft.status==="cancelled"?"danger":"neutral"}>{({draft:"Entwurf",sent:type==="Angebot"?"Übergeben":"Gestellt",open:"Offen",paid:"Bezahlt",partial:"Teilweise bezahlt",overdue:"Überfällig",cancelled:"Storniert",accepted:"Angenommen",declined:"Abgelehnt",expired:"Abgelaufen",rejected:"Abgelehnt"} as Record<string,string>)[draft.status]??draft.status}</Status>}</section>
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
    {type==="Rechnung"&&<section className="document-payment-facts" aria-label="Zahlungsstand"><span>Bezahlt <b>{draft.currency??"CHF"} {money(Number(draft.paidAmount??0))}</b></span><span>Offen <b>{draft.currency??"CHF"} {money(Math.max(0,totals.total-Number(draft.paidAmount??0)))}</b></span></section>}
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
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Einheit</span><span>Einzelpreis</span><span>Total</span><span/></div>
          {draft.positions.map(item=>{
            const lineTotal=numberValue(item.quantity)*numberValue(item.price);
            return <div className="document-line-item" key={item.id}>
              <button className="mobile-position-summary" type="button" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}>
                <span><b>{item.description}</b><small>{item.quantity} {item.unit??"Stück"} × {draft.currency??"CHF"} {money(numberValue(item.price))}</small></span>
                <strong>{draft.currency??"CHF"} {money(lineTotal)}</strong><Icon name="arrow" size={16}/>
              </button>
              <label className="mobile-line-field description"><span>Beschreibung</span><input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Menge</span><input aria-label="Menge" inputMode="decimal" value={item.quantity} onChange={e=>updatePosition(item.id,{quantity:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Einheit</span><select aria-label="Einheit" value={item.unit??"Stück"} onChange={e=>updatePosition(item.id,{unit:e.target.value})}><option value="Stück">Stück</option><option value="Stunden">Stunden</option></select></label>
              <label className="mobile-line-field"><span>Einzelpreis</span><input aria-label="Einzelpreis" inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/></label>
              <div className="mobile-line-total"><span>Total</span><b>{money(lineTotal)}</b></div>
              <button className="line-remove" type="button" aria-label="Position entfernen" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}><Icon name="close" size={15}/></button>
            </div>;
          })}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>{draft.currency??"CHF"} {money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toFixed(2)} % <b>{draft.currency??"CHF"} {money(totals.vat)}</b></span><strong>Total <b>{draft.currency??"CHF"} {money(totals.total)}</b></strong></div>
      </div>
      {mobilePositionId&&(()=>{const item=positionDraft;if(!item)return null;return <div className="sheet-layer mobile-position-layer" onMouseDown={event=>{if(event.target===event.currentTarget)closePosition()}}><section ref={positionDialogRef} tabIndex={-1} className="bottom-sheet mobile-position-sheet" role="dialog" aria-modal="true" aria-label="Position bearbeiten"><div className="sheet-handle"/><header className="sheet-header"><div><h2>Position bearbeiten</h2><p>{item.description}</p></div><IconButton label="Schliessen" icon="close" onClick={()=>closePosition()}/></header><div className="sheet-body mobile-position-fields"><Field label="Beschreibung"><input value={item.description} onChange={e=>setPositionDraft({...item,description:e.target.value})}/></Field><div><Field label="Menge"><input inputMode="decimal" value={item.quantity} onChange={e=>setPositionDraft({...item,quantity:e.target.value})}/></Field><Field label="Einheit"><select value={item.unit??"Stück"} onChange={e=>setPositionDraft({...item,unit:e.target.value})}><option value="Stück">Stück</option><option value="Stunden">Stunden</option></select></Field><Field label="Einzelpreis"><input inputMode="decimal" value={item.price} onChange={e=>setPositionDraft({...item,price:e.target.value})}/></Field></div><div className="mobile-position-sheet-total"><span>Total</span><b>{draft.currency??"CHF"} {money(numberValue(item.quantity)*numberValue(item.price))}</b></div><button className="text-action mobile-position-remove" type="button" disabled={draft.positions.length===1} onClick={()=>{removePosition(item.id);closePosition()}}>Position entfernen</button></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={closePosition}>Abbrechen</Button><Button onClick={()=>{updatePosition(item.id,item);closePosition()}}>Übernehmen</Button></div></section></div>})()}
      <div className="form-section optional-row document-note-section">{!noteOpen?<button className="text-action add-note-action" type="button" onClick={()=>setNoteOpen(true)}><Icon name="plus" size={16}/> Notiz hinzufügen</button>:<><div className="section-title"><h2>Notiz</h2>{!draft.note&&<button className="text-action" type="button" onClick={()=>setNoteOpen(false)}>Schliessen</button>}</div><Field label="Text für den Kunden"><textarea autoFocus value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optional"/></Field></>}</div>
    </section>
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
 return {loading,error,raw:company,name:String(company.legal_name||company.name||''),street:[company.street,company.building_number].filter(Boolean).join(' '),city:[company.postal_code,company.city].filter(Boolean).join(' '),iban:String(company.iban||company.qr_iban||''),logo:String(company.logo_url||''),footer:[company.legal_name||company.name,company.vat_number||company.uid,company.email,company.phone,company.website].filter(Boolean).join(' · ')};
}

export function InvoicePreview({ draft = createInitialDraft("Rechnung","RE-2026-019"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const company=useDocumentCompany();
  const customer=directory[draft.customer] ?? {sector:"",city:"",address:"",zip:""};
  const due=invoiceDueDate(draft.date,draft.due);
  const balance=draft.status==='paid'||draft.status==='cancelled'?0:Math.max(0,totals.total-Number(draft.paidAmount??0));
  const payment=useMemo(()=>{if(balance===0)return {svg:'',issue:null};try{return {svg:responsiveQrSvg(new SwissQRBill(createQrBillData(company.raw,{reference:draft.reference,number:draft.number,total:balance,currency:draft.currency}),{language:"DE"}).toString()),issue:null};}catch(error){return {svg:"",issue:error instanceof Error?error.message:"Zahlungsinformationen konnten nicht erstellt werden."};}},[company.raw,draft.reference,draft.number,draft.currency,balance]);

  if(company.loading)return <p role="status">Rechnungsvorschau wird geladen …</p>;
  if(company.error)return <p role="alert">{company.error}</p>;

  return <div className="document-pages invoice-pages">
    <section className="paper invoice-paper invoice-page" aria-label="Rechnung Seite 1 von 2">
      <div className="paper-brand">{company.logo?<img src={company.logo} alt={company.name}/>:<b>{company.name}</b>}<span>RECHNUNG</span></div>
      <div className="sender-line">{[company.name,company.street,company.city].filter(Boolean).join(" · ")}</div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Rechnungsnummer</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b>{Boolean(company.raw.vat_number||company.raw.uid)&&<><small>MWST / UID</small><b>{String(company.raw.vat_number||company.raw.uid)}</b></>}<small>Zahlbar bis</small><b>{due}</b></div></div>
      <div className="paper-intro">{draft.title&&<h2>{draft.title}</h2>}<p>{draft.note || String(company.raw.invoice_intro_text||"Für die erbrachten Leistungen stellen wir Ihnen folgende Rechnung.")}</p></div>
      <table><thead><tr><th>Leistung</th><th>Menge</th><th>Einzelpreis</th><th>Betrag</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{numberValue(item.quantity).toLocaleString("de-CH",{maximumFractionDigits:3})}{item.unit&&<small className="paper-unit">{item.unit}</small>}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
      <DocumentTotals draft={draft} totals={totals}/>
      <section className="paper-closing invoice-payment-intro"><p>{draft.status==="cancelled"?"Diese Rechnung wurde storniert. Es ist keine Zahlung erforderlich.":draft.status==="paid"?"Der Rechnungsbetrag wurde vollständig beglichen. Vielen Dank für Ihre Zahlung.":`Bitte überweisen Sie den Rechnungsbetrag${due?" bis zum "+due:""} mit dem QR-Zahlteil auf der folgenden Seite.`}</p><DocumentText text={String(company.raw.invoice_footer_text||"Vielen Dank für Ihr Vertrauen. Bei Fragen zu dieser Rechnung stehen wir Ihnen gerne zur Verfügung.")}/><p>Freundliche Grüsse<br/>{company.name}</p></section>
      <footer>{company.footer}</footer>
    </section>
    <section className="paper invoice-paper invoice-page qr-invoice-page" aria-label="Rechnung Seite 2 von 2: Zahlungsinformationen">
      <div className="qr-page-heading"><b>{company.name}</b><span>ZAHLUNGSINFORMATIONEN</span></div><div className="qr-page-reference"><span>Rechnung {draft.number}</span><b>{draft.currency??"CHF"} {money(balance)}</b></div>
      <div className="qr-page-spacer" aria-hidden="true"/>
      {balance===0?<p>{draft.status==="cancelled"?"Storniert – keine Zahlung erforderlich.":"Vollständig bezahlt – keine weitere Zahlung erforderlich."}</p>:payment.svg?<div className="qr-payment-slip" dangerouslySetInnerHTML={{__html:payment.svg}}/>:<div className="payment-setup-notice"><b>QR-Zahlteil noch nicht verfügbar</b><p>{payment.issue}</p></div>}
    </section>
  </div>;
}

export function OfferPreview({ draft = createInitialDraft("Angebot","AN-2026-012"), directory = customerData }: { draft?:DocumentDraft; directory?:CustomerDirectory }) {
  const totals=useDocumentTotals(draft);
  const company=useDocumentCompany();
  const customer=directory[draft.customer] ?? {sector:"",city:"",address:"",zip:""};

  if(company.loading)return <p role="status">Angebotsvorschau wird geladen …</p>;
  if(company.error)return <p role="alert">{company.error}</p>;
  return <div className="document-pages"><section className="paper">
    <div className="paper-brand">{company.logo?<img src={company.logo} alt={company.name}/>:<b>{company.name}</b>}<span>ANGEBOT</span></div>
    <div className="sender-line">{[company.name,company.street,company.city].filter(Boolean).join(" · ")}</div>
    <div className="paper-meta"><div><b>{draft.customer}</b><span>{customer.address}</span><span>{customer.zip} {customer.city}</span></div><div><small>Angebotsnummer</small><b>{draft.number}</b><small>Datum</small><b>{isoToSwiss(draft.date)}</b>{Boolean(company.raw.vat_number||company.raw.uid)&&<><small>MWST / UID</small><b>{String(company.raw.vat_number||company.raw.uid)}</b></>}<small>Gültig bis</small><b>{isoToSwiss(draft.due)}</b></div></div>
    <div className="paper-intro"><h2>{draft.title||"Ihr Angebot"}</h2><p>{draft.note || String(company.raw.quote_intro_text||"Vielen Dank für Ihre Anfrage. Gerne offerieren wir Ihnen die folgenden Leistungen.")}</p></div>
    <table><thead><tr><th>Leistung</th><th>Menge</th><th>Einzelpreis</th><th>Betrag</th></tr></thead><tbody>{draft.positions.map(item=><tr key={item.id}><td>{item.description}</td><td>{numberValue(item.quantity).toLocaleString("de-CH",{maximumFractionDigits:3})}{item.unit&&<small className="paper-unit">{item.unit}</small>}</td><td>{money(numberValue(item.price))}</td><td>{money(numberValue(item.quantity)*numberValue(item.price))}</td></tr>)}</tbody></table>
    <DocumentTotals draft={draft} totals={totals}/>
    <section className="paper-closing"><b>Konditionen</b><p>{draft.due?`Dieses Angebot ist bis zum ${isoToSwiss(draft.due)} gültig. `:""}Alle Beträge sind in {draft.currency??"CHF"} ausgewiesen; die MWST ist im Gesamtbetrag enthalten.</p><DocumentText text={String(company.raw.quote_footer_text||"Die Umsetzung erfolgt nach Ihrer schriftlichen Auftragsbestätigung. Zusätzliche Leistungen stimmen wir vorab mit Ihnen ab. Wir freuen uns auf die Zusammenarbeit.")}/><p>Freundliche Grüsse<br/>{company.name}</p></section>
    <footer>{company.footer}</footer>
  </section></div>;
}

function DocumentText({text}:{text:string}){
  return <>{text.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=><p className="paper-text" key={index}>{paragraph}</p>)}</>;
}
function DocumentTotals({draft,totals}:{draft:DocumentDraft;totals:{subtotal:number;vat:number;total:number}}){
  const taxes=new Map<number,number>();
  for(const item of draft.positions){
    const rate=numberValue(item.vatRate??draft.vatRate);
    taxes.set(rate,(taxes.get(rate)??0)+numberValue(item.quantity)*numberValue(item.price)*rate/100);
  }
  const groups=[...taxes].sort(([a],[b])=>b-a);
  const displayed=groups.map(([rate,amount],index)=>{
    const rounded=index===groups.length-1?Math.round(totals.vat*100)/100-groups.slice(0,index).reduce((sum,[,value])=>sum+Math.round(value*100)/100,0):Math.round(amount*100)/100;
    return [rate,rounded];
  });
  return <div className="paper-total"><span>Nettobetrag <b>{money(totals.subtotal)}</b></span>{displayed.map(([rate,amount])=><span key={rate}>MWST {rate.toFixed(2)} % <b>{money(amount)}</b></span>)}<strong>Gesamtbetrag {draft.currency??"CHF"} <b>{money(totals.total)}</b></strong></div>;
}
