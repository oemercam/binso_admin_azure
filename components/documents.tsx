"use client";
import {FormWizard} from "./form-wizard";
import {financialStatus,financialStatusLabels} from "@/lib/financial-status";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {tenantCan} from "@/lib/permissions";
import { invoicePaymentIssue } from "@/lib/qr-bill";
import { useRouter, useSearchParams } from "next/navigation";
import { useDialogFocus } from "./use-dialog-focus";
import { AppShell } from "./app-shell";
import { ActionRow, ActionSheet, FormSheet } from "./binso-ux";
import {DocumentPageViewer} from "./pdf-preview";
import { Button, EmptyState, Field, Icon, IconButton, Toast, FormActions, Input, Select, Textarea } from "./ui";
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
  paidOn?:string;
  sourceOffer?:string;
  invoiceNumber?:string;
  projectId?:string;
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
    status:kind==="Angebot"?financialStatus({...item,kind:"offer"}):String(item.status??"draft"),
    paidAmount:Number(item.paid_amount??0),
    paidOn:String(item.paid_on??""),
    sourceOffer:String(item.source_offer??""),
    invoiceNumber:String(item.invoice_number??""),
    projectId:String(item.project_id??""),
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

function editableDocumentSnapshot(draft:DocumentDraft){const value={...draft};delete value.subtotal;delete value.vat;delete value.total;return JSON.stringify(value);}

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
  const [wizardStep,setWizardStep]=useState(0);
  const documentActionPending=useRef(false);
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
  const documentSavePending=useRef(false);
  const [dirty,setDirty]=useState(false);
  const draftBaseline=useRef<string|null>(null);
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
          setDraft(current=>({...source,id:undefined,status:"draft",paidAmount:0,paidOn:undefined,number:current.number,date:current.date,due:"30"}));
        })).catch(()=>undefined);
      return;
    }
    apiGet<{items:Array<Record<string,unknown>>}>("/api/demo/data?collection=documents&number="+encodeURIComponent(sourceOffer)).then(payload=>{if(payload.items[0]){const source=remoteDraftFromItem(payload.items[0],"Angebot");setDraft(current=>({...source,id:undefined,status:"draft",paidAmount:0,paidOn:undefined,number:current.number,date:current.date,due:"30"}));}}).catch(()=>undefined);
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
      draftBaseline.current??=editableDocumentSnapshot(draft);
      setDraft(current=>({...current,customer:sources[0].customer_name,customerId:customer,currency:expenses[0]?.currency??current.currency,positions:existing?[...current.positions,...positions]:positions,subtotal:undefined,vat:undefined,total:undefined}));setDirty(true);setEditing(true);
    };void load().catch(e=>setActionError(e instanceof Error?e.message:'Positionen konnten nicht geladen werden.'));
  },[existing,kind,sourceTimeEntriesParam,sourceExpenseParam,documentLoad.loading,draft,documentKey,setDraft]);

  useEffect(()=>{
    if(existing||!isProductionBackendEnabled()) return;
    const names=Object.keys(directory);
    if(names.length&&(!draft.customer||!directory[draft.customer])) queueMicrotask(()=>setDraft(current=>({...current,customer:names[0]})));
  },[existing,directory,draft.customer,setDraft]);

  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2300);};
  const save=async()=>{
    if(documentSavePending.current||companyPending||documentLoad.loading||documentLoad.error||customersLoading||customersError)return;
    if(isProductionBackendEnabled()&&!draft.customer){show("Bitte zuerst einen Kunden erfassen.");return;}
    if(paymentIssue){show(paymentIssue);return;}
    documentSavePending.current=true;setSaving(true);
    let savedNumber=draft.number;
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload={...documentPayload(kind,draft),sourceOffer:sourceOffer||undefined,customerId:directory[draft.customer]?.id??draft.customerId};
        const response=existing?await apiPatch<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number),payload):await apiPost<{item:Record<string,unknown>}>("/api/documents",payload);
        savedNumber=String(response.item.number);
        setDraft(remoteDraftFromItem(response.item,kind));
      }
      draftBaseline.current=null;setDirty(false);
      show(existing?`${kind} gespeichert.`:`${kind} erstellt.`);
      if(existing){documentSavePending.current=false;setEditing(false);}
      else window.setTimeout(()=>router.push("/"+plural+"/"+encodeURIComponent(savedNumber)),900);
    }catch(error){
      documentSavePending.current=false;
      show(error instanceof Error?error.message:`${kind} konnte nicht gespeichert werden.`);
    }finally{if(!documentSavePending.current)setSaving(false);}
  };

  const canWrite=!documentReadOnly&&tenantCan(documentRole,kind==="Rechnung"?"invoices:write":"sales:write");
  const canEdit=canWrite&&(!existing||draft.status==="draft");
  const processAction=async(action:string)=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/status",{action});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setMoreOpen(false);show("Status aktualisiert.")}catch(e){setActionError(e instanceof Error?e.message:"Status konnte nicht geändert werden.")}finally{documentActionPending.current=false;setActionBusy(false)}};
  const sendDocument=async()=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/send",{recipient,requestKey:sendKey});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setSendOpen(false);show("Dokument als PDF versendet.")}catch(e){setActionError(e instanceof Error?e.message:"Versand konnte nicht bestätigt werden.")}finally{documentActionPending.current=false;setActionBusy(false)}};
  const canRecordPayment=tenantCan(documentRole,"payments:write")&&kind==="Rechnung"&&!["draft","paid","cancelled"].includes(draft.status??"draft")&&Number(draft.total??0)>Number(draft.paidAmount??0);
  const presentation=documentPresentation(kind,draft,useDocumentTotals(draft).total);
  const title=existing?`${kind} ${draft.number||documentKey||""}`:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons">{canEdit&&<IconButton label="Bearbeiten" icon="edit" onClick={()=>setEditing(true)}/>}<IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/></div>;
  const desktopActions=headerActions;

  return <AppShell title={title} status={existing&&!editing&&!documentLoad.loading&&!documentLoad.error?presentation.statusLabel:undefined} statusTone={presentation.statusTone} subtitle={existing&&!editing?undefined:production?"Wird sicher gespeichert":"Schreibgeschützte Vorschau"} active={plural} backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={desktopActions} mobileActions={existing&&!editing?headerActions:undefined} preview={preview} editing={editing} unsavedChanges={dirty}>
    {actionError&&!moreOpen&&!sendOpen&&<p role="alert">{actionError}</p>}
    {editing&&companyPending&&<p role="status">Firmendaten werden geladen …</p>}
    {editing&&paymentIssue&&<div className="document-source-note" role="status"><span>{paymentIssue}</span><Link href="/einstellungen/dokumente">Einstellungen</Link></div>}
    {sourceOffer&&!existing&&<div className="document-source-note"><span>Erstellt aus Angebot</span><b>{sourceOffer}</b></div>}
    {customersLoading?<p role="status">Kunden werden geladen …</p>:customersError?<p role="alert">{customersError}</p>:documentLoad.loading?<p role="status">Dokument wird geladen …</p>:documentLoad.error?<EmptyState icon="file" title="Dokument konnte nicht geladen werden" text={documentLoad.error}/>:existing&&!editing
      ? <div className="document-desktop-workspace">
          <div className="document-desktop-detail">
            <DocumentReadView type={kind} draft={draft} directory={directory}/>
          </div>
          {(kind==="Angebot"&&draft.status==="accepted"&&(tenantCan(documentRole,"invoices:write")||tenantCan(documentRole,"projects:write"))||canRecordPayment)&&<aside className="document-desktop-rail">
            <section className="document-toolbox" aria-label="Dokumentaktionen">
              <span className="compact-section-label">Aktionen</span>
              {kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"projects:write")&&<Link href={draft.projectId?"/zeit?projectId="+draft.projectId:"/projekte/neu?customerId="+encodeURIComponent(draft.customerId??"")+"&sourceOffer="+encodeURIComponent(draft.number)}><Icon name="clock"/><span><b>{draft.projectId?"Projekt öffnen":"Auftrag starten"}</b></span><Icon name="arrow" size={15}/></Link>}
              {kind==="Angebot"
                ? tenantCan(documentRole,"invoices:write")&&<Link href={draft.invoiceNumber?"/rechnungen/"+encodeURIComponent(draft.invoiceNumber):"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)}><Icon name="receipt" size={17}/><span><b>{draft.invoiceNumber?"Rechnung öffnen":"Rechnung erstellen"}</b><small>Daten aus Angebot übernehmen</small></span><Icon name="arrow" size={15}/></Link>
                : canRecordPayment&&<Link href={"/zahlungen/neu?invoice="+encodeURIComponent(documentKey??draft.number)}><Icon name="wallet" size={17}/><span><b>Zahlung erfassen</b><small>Zahlung zuordnen</small></span><Icon name="arrow" size={15}/></Link>}
            </section>
          </aside>}
        </div>
      : !existing?<FormWizard labels={["Kunde und Dokumentdaten","Positionen","Zahlungsbedingungen","Prüfen und als Entwurf speichern"]} step={wizardStep} onStep={setWizardStep} busy={saving} action={<Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</Button>}><DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} step={!existing?wizardStep:undefined}/>{wizardStep===3&&<DocumentReadView type={kind} draft={draft} directory={directory}/>}</FormWizard>:<DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} step={!existing?wizardStep:undefined}/>}
    {editing&&kind==="Rechnung"&&draft.customerId&&tenantCan(documentRole,"invoices:write")&&<Button variant="secondary" href={"/zeit?invoice="+encodeURIComponent(existing?draft.number:"")+"&customerId="+encodeURIComponent(draft.customerId)}>Freigegebene Zeiten hinzufügen</Button>}
    {editing&&existing&&<FormActions><Button disabled={saving||companyPending||Boolean(paymentIssue)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</Button></FormActions>}
    {preview&&<DocumentModal previewDraft={{...draft,kind,sourceNumber:existing&&editing?documentKey:undefined}} pdfNumber={existing&&!editing?documentKey??draft.number:undefined} title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}/>}
    <ActionSheet label="Weitere Aktionen" open={moreOpen} busy={actionBusy} onClose={()=>setMoreOpen(false)}><div className="action-list">
      <ActionRow onClick={()=>{setMoreOpen(false);setPreview(true)}} icon="file" title="Vorschau" navigation/>
      <ActionRow href={"/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/pdf"} icon="file" title="PDF herunterladen"/>
      {canWrite&&!['draft','cancelled','declined','expired'].includes(draft.status??'')&&<ActionRow disabled={demoDocument||actionBusy} onClick={()=>{setSendKey(crypto.randomUUID());setActionError(null);setMoreOpen(false);setSendOpen(true)}} icon="mail" title={demoDocument?'Versand in der Demo deaktiviert':'Als PDF senden'} navigation/>}
      {canWrite&&draft.status==='draft'&&<ActionRow disabled={actionBusy} onClick={()=>void processAction('issue')} icon="check" title={kind==='Rechnung'?'Rechnung stellen':'Als versendet erfassen'}/>}
      {canWrite&&kind==='Angebot'&&draft.status==='sent'&&<><ActionRow disabled={actionBusy} onClick={()=>void processAction('accept')} icon="check" title="Kundenannahme erfassen"/><ActionRow disabled={actionBusy} onClick={()=>void processAction('decline')} icon="close" title="Kundenablehnung erfassen" danger/></>}
      {canWrite&&kind==='Rechnung'&&Number(draft.paidAmount??0)===0&&['draft','sent','overdue'].includes(draft.status??'')&&<ActionRow disabled={actionBusy} onClick={()=>void processAction('cancel')} icon="close" title="Rechnung stornieren" danger/>}
      </div>{actionError&&<p role="alert">{actionError}</p>}</ActionSheet>
    <FormSheet label="Dokument senden" description={kind+" als PDF · "+draft.number} open={sendOpen} busy={actionBusy} onClose={()=>setSendOpen(false)}><div className="sheet-body"><Field label="Empfänger"><Input type="email" value={recipient} onChange={e=>{setRecipient(e.target.value);setSendKey(crypto.randomUUID())}} autoComplete="email"/></Field><p>Das ausgestellte Dokument wird als PDF versendet.</p>{actionError&&<p role="alert">{actionError}</p>}</div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setSendOpen(false)}>Abbrechen</Button><Button disabled={actionBusy||!recipient} onClick={()=>void sendDocument()}>{actionBusy?'Wird versendet …':'PDF senden'}</Button></div></FormSheet>
    {toast&&<Toast title={toast} tone={[`${kind} gespeichert.`,`${kind} erstellt.`,"Status aktualisiert.","Dokument als PDF versendet."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}

function documentPresentation(type:DocumentKind,draft:DocumentDraft,total:number){
  const isInvoice=type==="Rechnung";
  const dueDate=isInvoice&&draft.date&&draft.due?invoiceDueDate(draft.date,draft.due):"";
  const displayStatus=financialStatus({kind:isInvoice?"invoice":"offer",status:draft.status,total,paid_amount:draft.paidAmount,due_date:dueDate?dueDate.split(".").reverse().join("-"):null,valid_until:isInvoice?null:draft.due});
  const statusLabel=financialStatusLabels[displayStatus]??({draft:"Entwurf",sent:type==="Angebot"?"Versendet":"Gestellt",open:"Offen",paid:"Bezahlt",partial:"Teilweise bezahlt",overdue:"Überfällig",cancelled:"Storniert",accepted:"Angenommen",declined:"Abgelehnt",expired:"Abgelaufen",rejected:"Abgelehnt"} as Record<string,string>)[draft.status??""]??draft.status;
  const statusTone: "success"|"danger"|"warning"|"neutral"=displayStatus==="paid"||displayStatus==="accepted"?"success":displayStatus==="overdue"||displayStatus==="cancelled"||displayStatus==="declined"||displayStatus==="expired"?"danger":["open","partial","sent"].includes(displayStatus)?"warning":"neutral";
  return {displayStatus,statusLabel,statusTone,dueDate};
}

function DocumentReadView({type,draft,directory}:{type:DocumentKind;draft:DocumentDraft;directory:CustomerDirectory}){
  const totals=useDocumentTotals(draft);
  const customer=directory[draft.customer]??{sector:"",city:"",address:"",zip:""};
  const currency=draft.currency??"CHF";
  const isInvoice=type==="Rechnung";
  const dueDate=isInvoice&&draft.date&&draft.due?invoiceDueDate(draft.date,draft.due):"";
  const outstanding=Math.max(0,totals.total-Number(draft.paidAmount??0));
  const {displayStatus}=documentPresentation(type,draft,totals.total);
  return <div className="document-detail-view">
    <section className="document-detail-section">
      <span className="eyebrow">KUNDE</span>
      <div className="document-customer-heading"><h2>{draft.customer}</h2></div>
      {[customer.address,customer.zip,customer.city].some(Boolean)&&<p>{[customer.address,[customer.zip,customer.city].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p>}
    </section>
    <section className="document-facts">
      <div><small>{type==="Rechnung"?"Rechnungsdatum":"Angebotsdatum"}</small><b>{isoToSwiss(draft.date)}</b></div>
      {type==="Angebot"
        ? <div><small>Gültig bis</small><b>{draft.due&&isoToSwiss(draft.due)}</b></div>
        : <>{displayStatus==="paid"?(draft.paidOn&&<div><small>Bezahlt am</small><b>{isoToSwiss(draft.paidOn)}</b></div>):dueDate&&<div><small>Fällig am</small><b>{dueDate}</b></div>}</>}
    </section>
    {isInvoice&&draft.due&&<p className="document-payment-term">Zahlungsfrist: {draft.due} Tage</p>}
    <section className="document-detail-section document-lines-section">
      <div className="section-title"><h2>Positionen</h2></div>
      <div className="document-read-table">
        <div className="document-read-head" aria-hidden="true"><span>Bezeichnung</span><span>Menge / Einheit</span><span>Einzelpreis</span><span>Betrag</span></div>
        {draft.positions.map(item=><div className="document-read-row" key={item.id}>
          <b>{item.description}</b>
          <span>{item.quantity} {({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"}<small className="document-mobile-price"> × {currency} {money(numberValue(item.price))}</small></span>
          <span>{currency} {money(numberValue(item.price))}</span>
          <strong>{currency} {money(numberValue(item.quantity)*numberValue(item.price))}</strong>
        </div>)}
      </div>
      <div className="invoice-totals">
        <span>Zwischentotal <b>{currency} {money(totals.subtotal)}</b></span>
        <span>MwSt. {Number(draft.vatRate).toLocaleString("de-CH",{maximumFractionDigits:2})} % <b>{currency} {money(totals.vat)}</b></span>
        <strong>Total <b>{currency} {money(totals.total)}</b></strong>
      </div>
    </section>
    {isInvoice&&!["draft","paid","cancelled"].includes(displayStatus)&&outstanding>0&&<section className="document-payment-facts" aria-label="Zahlungsstand"><h2>Zahlungsstand</h2>
      {Number(draft.paidAmount??0)>0&&<span>Bereits bezahlt <b>{currency} {money(Number(draft.paidAmount??0))}</b></span>}
      <span>Offener Betrag <b>{currency} {money(outstanding)}</b></span>
    </section>}
    {draft.sourceOffer&&<p>Ursprungsangebot: <Link href={"/angebote/"+encodeURIComponent(draft.sourceOffer)}>{draft.sourceOffer}</Link></p>}{draft.invoiceNumber&&<p>Rechnung: <Link href={"/rechnungen/"+encodeURIComponent(draft.invoiceNumber)}>{draft.invoiceNumber}</Link></p>}
    {draft.note&&<section className="document-detail-section"><span className="eyebrow">NOTIZ</span><p>{draft.note}</p></section>}
  </div>;
}

function DocumentEditor({ type, draft, onChange, directory, step }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory;step?:number }) {
  const production=useBackendMode();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
  const [noteOpen,setNoteOpen]=useState(Boolean(draft.note));
  const [mobilePositionId,setMobilePositionId]=useState<string|null>(null);
  const [positionDraft,setPositionDraft]=useState<LineItem|null>(null);
  const closePosition=()=>{setMobilePositionId(null);setPositionDraft(null);};
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
      <div hidden={step!==undefined&&step!==0} className="form-section customer-form-section">
        <span className="compact-section-label">Kunde</span>
        <Field label="Kunde auswählen">
          <Select value={draft.customer} onChange={e=>onChange({...draft,customer:e.target.value,customerId:undefined})}>
            {names.map(name=><option key={name}>{name}</option>)}
          </Select>
        </Field>
        {[customer.sector,customer.city].some(Boolean)&&<div className="document-customer-hint"><span>{[customer.sector,customer.city].filter(Boolean).join(" · ")}</span></div>}
      </div>
      <div hidden={step!==undefined&&step!==0&&step!==2} className="form-section">
        <h2>{type}details</h2>
        <div className="form-grid document-meta-grid">
          <Field className="document-number-field" label={type==="Rechnung" ? "Rechnungsnummer" : "Angebotsnummer"}><Input value={draft.number} placeholder="Wird beim Erstellen vergeben" readOnly aria-readonly="true"/></Field>
          <Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><Input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field>
          <Field label={type==="Rechnung" ? "Zahlungsfrist" : "Gültig bis"}>
            {type==="Rechnung" ? <Select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}>{!["10","30","45"].includes(draft.due)&&<option value={draft.due}>{draft.due} Tage</option>}<option value="10">10 Tage</option><option value="30">30 Tage</option><option value="45">45 Tage</option></Select> : <Input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field>
          <Field label="MwSt."><Select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value,positions:draft.positions.map(item=>({...item,vatRate:e.target.value}))})}><option value="8.1">8.10 %</option><option value="2.6">2.60 %</option><option value="0">0.00 %</option></Select></Field>
        </div>
      </div>
      <div hidden={step!==undefined&&step!==1} className="form-section">
        <div className="section-title"><h2>Positionen</h2><button className="icon-action" type="button" onClick={addPosition} aria-label="Position hinzufügen"><Icon name="plus" size={18}/></button></div>
        <div className="line-items document-line-items">
          <div className="line-head"><span>Beschreibung</span><span>Menge</span><span>Einheit</span><span>Einzelpreis</span><span>Total</span><span/></div>
          {draft.positions.map(item=>{
            const lineTotal=numberValue(item.quantity)*numberValue(item.price);
            return <div className="document-line-item" key={item.id}>
              <button className="mobile-position-summary" type="button" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}>
                <span><b>{item.description}</b><small>{item.quantity} {({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"} × {draft.currency??"CHF"} {money(numberValue(item.price))}</small></span>
                <strong>{draft.currency??"CHF"} {money(lineTotal)}</strong><Icon name="arrow" size={16}/>
              </button>
              <label className="mobile-line-field description"><span>Beschreibung</span><Input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Menge</span><Input aria-label="Menge" inputMode="decimal" value={item.quantity} onChange={e=>updatePosition(item.id,{quantity:e.target.value})}/></label>
              <label className="mobile-line-field"><span>Einheit</span><Select aria-label="Einheit" value={item.unit??"Stück"} onChange={e=>updatePosition(item.id,{unit:e.target.value})}><option value="Stück">Stück</option><option value="Stunden">Stunden</option></Select></label>
              <label className="mobile-line-field"><span>Einzelpreis</span><Input aria-label="Einzelpreis" inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/></label>
              <div className="mobile-line-total"><span>Total</span><b>{money(lineTotal)}</b></div>
              <button className="line-remove" type="button" aria-label="Position entfernen" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}><Icon name="close" size={15}/></button>
            </div>;
          })}
        </div>
        <div className="invoice-totals"><span>Zwischentotal <b>{draft.currency??"CHF"} {money(totals.subtotal)}</b></span><span>MwSt. {Number(draft.vatRate).toLocaleString("de-CH",{maximumFractionDigits:2})} % <b>{draft.currency??"CHF"} {money(totals.vat)}</b></span><strong>Total <b>{draft.currency??"CHF"} {money(totals.total)}</b></strong></div>
      </div>
      {mobilePositionId&&(()=>{const item=positionDraft;if(!item)return null;return <FormSheet label={"Position bearbeiten"} description={item.description} open={true} onClose={closePosition} busy={false} className={"mobile-position-sheet"} layerClassName={"mobile-position-layer"} ariaLabel={"Position bearbeiten"}><div className="sheet-body mobile-position-fields"><Field label="Beschreibung"><Input value={item.description} onChange={e=>setPositionDraft({...item,description:e.target.value})}/></Field><div><Field label="Menge"><Input inputMode="decimal" value={item.quantity} onChange={e=>setPositionDraft({...item,quantity:e.target.value})}/></Field><Field label="Einheit"><Select value={item.unit??"Stück"} onChange={e=>setPositionDraft({...item,unit:e.target.value})}><option value="Stück">Stück</option><option value="Stunden">Stunden</option></Select></Field><Field label="Einzelpreis"><Input inputMode="decimal" value={item.price} onChange={e=>setPositionDraft({...item,price:e.target.value})}/></Field></div><div className="mobile-position-sheet-total"><span>Total</span><b>{draft.currency??"CHF"} {money(numberValue(item.quantity)*numberValue(item.price))}</b></div><button className="text-action mobile-position-remove" type="button" disabled={draft.positions.length===1} onClick={()=>{removePosition(item.id);closePosition()}}>Position entfernen</button></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={closePosition}>Abbrechen</Button><Button onClick={()=>{updatePosition(item.id,item);closePosition()}}>Übernehmen</Button></div></FormSheet>})()}
      <div hidden={step!==undefined&&step!==2} className="form-section optional-row document-note-section">{!noteOpen?<button className="text-action add-note-action" type="button" onClick={()=>setNoteOpen(true)}><Icon name="plus" size={16}/> Notiz hinzufügen</button>:<><div className="section-title"><h2>Notiz</h2>{!draft.note&&<button className="text-action" type="button" onClick={()=>setNoteOpen(false)}>Schliessen</button>}</div><Field label="Text für den Kunden"><Textarea autoFocus value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optional"/></Field></>}</div>
    </section>
  </div>;
}

export function DocumentModal({ title, onClose, pdfNumber, previewDraft, fileUrl }: { title:string; onClose:()=>void; pdfNumber?:string;previewDraft?:DocumentDraft&{kind:DocumentKind;sourceNumber?:string};fileUrl?:string }) {
  const [pdfBlob,setPdfBlob]=useState<Blob|null>(null);
  const [pdfError,setPdfError]=useState<string|null>(null);
  const pdfFile=useRef<File|null>(null);
  const previewJson=JSON.stringify(previewDraft);
  useEffect(()=>{
    let active=true;
    fetch(fileUrl??(pdfNumber?"/api/documents/"+encodeURIComponent(pdfNumber)+"/pdf":"/api/documents/preview"),fileUrl||pdfNumber?undefined:{method:"POST",headers:{"Content-Type":"application/json"},body:previewJson}).then(async response=>{if(!response.ok)throw new Error("PDF konnte nicht geladen werden.");return response.blob()}).then(blob=>{if(!active)return;pdfFile.current=new File([blob],(pdfNumber||"Entwurf")+".pdf",{type:"application/pdf"});setPdfBlob(blob)}).catch(reason=>{if(active)setPdfError(reason instanceof Error?reason.message:"PDF konnte nicht geladen werden.")});
    return()=>{active=false;pdfFile.current=null};
  },[pdfNumber,previewJson,fileUrl]);
  const [zoomed,setZoomed]=useState(false);
  const modalDialog=useDialogFocus(true,onClose);
  const share=async()=>{
    if(pdfFile.current&&navigator.canShare?.({files:[pdfFile.current]})){try{await navigator.share({title,files:[pdfFile.current]})}catch{/* share dialog closed */}return;}
    if(pdfBlob){const url=URL.createObjectURL(pdfBlob);const link=document.createElement("a");link.href=url;link.download=(pdfNumber||"Entwurf")+".pdf";link.click();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
  };
  return <section ref={modalDialog} tabIndex={-1} className="document-modal" role="dialog" aria-modal="true" aria-label={title}>
    <header><span className="document-modal-header-spacer" aria-hidden="true"/><strong>{title}</strong><div className="document-modal-header-actions"><button type="button" aria-label={zoomed?"Auf Bildschirm einpassen":"Vorschau vergrössern"} aria-pressed={zoomed} onClick={()=>setZoomed(value=>!value)}><Icon name="search"/></button><button type="button" disabled={!pdfBlob} aria-label="Teilen oder herunterladen" onClick={()=>void share()}><Icon name="upload"/></button><button type="button" aria-label="Vorschau schliessen" onClick={onClose}><Icon name="close"/></button></div></header>
    <div className="document-modal-body">{pdfError?<p role="alert">{pdfError}</p>:pdfBlob?<DocumentPageViewer key={previewJson+String(pdfNumber)} file={pdfBlob} zoomed={zoomed}/>:<p role="status">PDF wird geladen …</p>}</div>
  </section>;
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
