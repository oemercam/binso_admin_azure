"use client";
import {domainConfig} from "@/config/domain";
import {documentDefaults,invoiceDraftFromOffer} from "@/lib/document-defaults";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import type {InvoiceReadiness} from "@/lib/action-readiness";
import {safeAppPath} from "@/lib/navigation";
import {OfferHistory} from "./offer-history";
import {OfferFollowup} from "./offer-followup";
import {deliveryLabel} from "@/lib/offer-activity";
import {EntityFiles} from "./entity-files";
import {DirectorySelect} from "./directory-select";
import {customerDirectory,resolveCustomer,type CustomerDirectory} from "@/lib/customer-identity";
import {calculateDocument,type Discount} from "@/lib/money";
import {documentUnitOptions,positionNumber,moveDocumentLine,duplicateDocumentLine,canDuplicateDocumentLine} from '@/lib/document-lines';
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import {FormWizard} from "./form-wizard";
import {allowDraftNavigation} from "./use-browser-back-guard";
import {useProcessDraft} from "./use-process-draft";
import {businessDate,financialStatus,financialStatusTone,financialStatusText,invoiceStatusAxes,openAmount,customerCredit} from "@/lib/financial-status";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {tenantCan} from "@/lib/permissions";
import { invoicePaymentIssue } from "@/lib/qr-bill";
import { useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "./app-shell";
import { ActionRow, ActionSheet, ActionsMenu, FormSheet,DetailDisclosure,MetricTiles,MetricTile } from "./binso-ux";
import {DocumentModal} from "./pdf-preview";
export {DocumentModal} from "./pdf-preview";
import {Button, EmptyState, Field, Icon, IconButton, Toast, FormActions, Input, Select, Textarea, ErrorState, LoadingState, SectionTitle, Status} from "./ui";
import { apiGet, apiPatch, apiPost, apiDelete, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

type DocumentKind = "Rechnung" | "Angebot";

type LineItem = {
  id: string;
  description: string;
  quantity: string;
  price: string;
  discount?:Discount;
  taxExempt?:boolean;
  lineTotal?:string;
  vatRate?: string;
  unit?: string;
  expenseIds?: string[];
  timeEntryIds?: string[];
  priceBaseQuantity?:1|60;
  timeAllocations?:Array<{timeEntryId:string;minutes:number;priceSourceId:string}>;
  availableMinutes?:number;
};

type DocumentDraft = {
  discount?:Discount;
  discountOrigin?:'manual'|'customer'|'removed';
  calculation?:ReturnType<typeof calculateDocument>;
  updatedAt?:string;
  id?: string;
  reference?: string;
  title?: string;
  customer: string;
  customerId?: string;
  offerVersion?:number;
  status?: string;
  paidAmount?: number;
  creditAmount?:number;
  refundAmount?:number;
  refunds?:Array<{id:string;date:string;amount:number;reason:string}>;
  credits?:Array<{number:string;date:string;amount:number;reason:string}>;
  reminders?:Array<{id:string;stage:number;status:string;recipient:string;amount:number;deadline:string;completed_at:string|null}>;
  paidOn?:string;
  deliveryStatus?:string|null;
  sourceOffer?:string;
  revisesOffer?:string;
  revisions?:Array<{number:string;status:string}>;
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


function useCustomerDirectory(enabled=true,selectedId?:string) {
  const {data,loading,error,refresh}=useApiQuery<{items:Array<{id:string;name:string;email?:string;discount?:number;sector?:string;street?:string;postal_code?:string;city?:string}>}>(enabled?("/api/customers?limit=50"):null);
  const selected=useApiQuery<{item?:Parameters<typeof customerDirectory>[0][number]}>(enabled&&selectedId&&true?"/api/customers/"+encodeURIComponent(selectedId):null);
  const directory=useMemo(()=>{const items=data?.items??[],item=selected.data?.item;return customerDirectory(item&&!items.some(row=>row.id===item.id)?[...items,item]:items);},[data,selected.data]);
  return {directory,loading:loading||selected.loading,error:error??selected.error,refresh:()=>{refresh();selected.refresh()}};
}

function createInitialDraft(kind:DocumentKind):DocumentDraft {
  return {customer:"",number:"",date:"",due:kind==="Rechnung"?"30":"",vatRate:"8.1",note:"",positions:[{id:"line-1",description:"",quantity:"1",unit:"Stück",price:"0.00"}]};
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
    discount:cleanDiscount(draft.discount,draft.currency??'CHF'),
    discountOrigin:draft.discount?.kind==='none'?'removed':draft.id?'manual':draft.discountOrigin??'manual',
    calculationRevision:1,
    expectedUpdatedAt:draft.id?draft.updatedAt:undefined,
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
    items:draft.positions.map(item=>({discount:cleanDiscount(item.discount,draft.currency??'CHF'),taxExempt:item.taxExempt??false,unit:item.unit??"Stück",description:item.description,quantity:numberValue(item.quantity),unitPrice:numberValue(item.price),vatRate:numberValue(item.vatRate??draft.vatRate),expenseIds:item.expenseIds??[],timeEntryIds:item.timeEntryIds??[],priceBaseQuantity:item.priceBaseQuantity??1,timeAllocations:item.timeAllocations??[]})),
  };
}

function documentPreviewPayload(kind:DocumentKind,draft:DocumentDraft,sourceNumber?:string){return {...draft,kind,sourceNumber,discount:cleanDiscount(draft.discount,draft.currency??'CHF'),positions:draft.positions.map(item=>({...item,quantity:decimalInput(item.quantity),price:decimalInput(item.price),vatRate:decimalInput(item.vatRate??draft.vatRate),discount:cleanDiscount(item.discount,draft.currency??'CHF')}))};}
function useDocumentDraft(initial:DocumentDraft) {
  return useState(initial);
}

function decimalInput(value:string){return value.replace(/['’\s]/g,'').replace(',','.');}
function cleanDiscount(value:Discount|undefined,currency:string):Discount{if(!value||value.kind==='none')return {kind:'none'};return value.kind==='percent'?{kind:'percent',value:decimalInput(value.value)}:{kind:'fixed',value:decimalInput(value.value),currency:value.currency||currency};}
function calculateDraft(draft:DocumentDraft){
 if(draft.total!==undefined&&!draft.calculation)return {subtotal:draft.subtotal??0,vat:draft.vat??0,total:draft.total,calculation:undefined,error:null as string|null};
 try{
  for(const item of draft.positions)if(item.timeAllocations?.length){const quantity=Number(decimalInput(item.quantity));if(!Number.isInteger(quantity)||quantity<1||quantity!==item.timeAllocations.reduce((n,a)=>n+a.minutes,0)||quantity>(item.availableMinutes??144000))throw new RangeError('Bitte gültige ganze Minuten innerhalb der verfügbaren Restmenge erfassen.');}
  const calculation=draft.total!==undefined&&draft.calculation?draft.calculation:calculateDocument(draft.positions.map(item=>({quantity:decimalInput(item.quantity),price_base_quantity:item.priceBaseQuantity??1,unit_price:decimalInput(item.price),vat_rate:decimalInput(item.vatRate??draft.vatRate),discount:cleanDiscount(item.discount,draft.currency??'CHF'),tax_exempt:item.taxExempt??false})),draft.currency??'CHF',cleanDiscount(draft.discount,draft.currency??'CHF'));
  return {subtotal:draft.subtotal??Number(calculation.subtotal),vat:draft.vat??Number(calculation.vat),total:draft.total??Number(calculation.total),calculation,error:null as string|null};
 }catch(error){return {subtotal:0,vat:0,total:0,calculation:undefined,error:error instanceof Error?error.message:'Ungültige Berechnung.'};}
}
function useDocumentTotals(draft:DocumentDraft){return useMemo(()=>calculateDraft(draft),[draft]);}
function lineAmount(item:LineItem,calculation:ReturnType<typeof calculateDocument>|undefined,index:number){return Number(calculation?.lines[index]?.net??item.lineTotal??0);}

function remoteDraftFromItem(item:Record<string,unknown>,kind:DocumentKind):DocumentDraft {
  const customer=item.customer as {name?:string}|null|undefined;
  const rawItems=Array.isArray(item.items)?item.items as Array<Record<string,unknown>>:[];
  const issueDate=dateOnly(item.issue_date);
  const dueDate=dateOnly(item.due_date);
  let due="";
  if(kind==="Angebot") due=dateOnly(item.valid_until);
  else if(dueDate){
    const start=new Date(issueDate+"T12:00:00");
    const end=new Date(dueDate+"T12:00:00");
    const days=Math.round((end.getTime()-start.getTime())/86400000);
    due=Number.isFinite(days)?String(days):"";
  }
  return {
    discount:(item.calculation as DocumentDraft['calculation'])?.discount??{kind:'none'},
    calculation:item.calculation as DocumentDraft['calculation'],
    updatedAt:String(item.document_revision??item.updated_at??''),
    discountOrigin:'manual',
    id:String(item.id??""),
    reference:String(item.qr_reference??""),
    title:String(item.title??""),
    customer:String(customer?.name??""),
    customerId:String(item.customer_id??""),
    currency:String(item.currency??"CHF"),
    status:kind==="Angebot"?financialStatus({...item,kind:"offer"}):String(item.status??"draft"),
    paidAmount:Number(item.paid_amount??0),
    creditAmount:Number(item.credit_amount??0),
    refundAmount:Number(item.refund_amount??0),
    refunds:Array.isArray(item.refunds)?item.refunds:[],
    credits:Array.isArray(item.credits)?item.credits:[],
    reminders:Array.isArray(item.reminders)?item.reminders:[],
    paidOn:String(item.paid_on??""),
    deliveryStatus:['sending','sent','failed','uncertain','not_attempted'].includes(String(item.delivery_status))?String(item.delivery_status):null,
    sourceOffer:String(item.source_offer??""),
    revisesOffer:String(item.revises_offer??""),
    offerVersion:Number(item.offer_version)||undefined,
    revisions:Array.isArray(item.revisions)?item.revisions:[],
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
      discount:line.discount as Discount??{kind:'none'},
      taxExempt:line.tax_exempt===true,
      lineTotal:String(line.line_total??0),
      description:String(line.description??""),
      quantity:String(line.quantity??"1"),
      price:String(line.unit_price??"0.00"),
      unit:String(line.unit??"Stück"),
      expenseIds:Array.isArray(line.expense_ids)?line.expense_ids.map(String):[],
      timeEntryIds:Array.isArray(line.time_entry_ids)?line.time_entry_ids.map(String):[],
      priceBaseQuantity:line.price_base_quantity===60?60:1,
      timeAllocations:Array.isArray(line.time_allocations)?line.time_allocations.map(a=>({timeEntryId:String(a.time_entry_id),minutes:Number(a.minutes),priceSourceId:String(a.price_source_id)})):[],
      vatRate:String(line.vat_rate??item.vat_rate??"0"),
    })),
  };
}

function useExistingDocument(kind:DocumentKind,documentKey:string|undefined,setDraft:(draft:DocumentDraft)=>void,editing=false){
  const dataRevision=useDataRevision(editing?[]:["/api/documents"]);
  const [loading,setLoading]=useState(Boolean(documentKey));
  const [refreshVersion,setRefreshVersion]=useState(0);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    if(!documentKey) return;
    const url="/api/documents/"+encodeURIComponent(documentKey);
    let active=true;
    apiGet<{item?:Record<string,unknown>;items?:Array<Record<string,unknown>>}>(url)
      .then(payload=>{if(!active)return;const item=payload.item??payload.items?.[0];if(!item)throw new Error("Dokument wurde nicht gefunden.");setDraft(remoteDraftFromItem(item,kind));setLoading(false);setError(null);})
      .catch(error=>{if(active){setLoading(false);setError(error instanceof Error?error.message:"Dokument konnte nicht geladen werden.");}});
    return()=>{active=false};
  },[documentKey,kind,setDraft,dataRevision,refreshVersion]);
  return {loading,error,refresh:()=>setRefreshVersion(value=>value+1)};
}

function editableDocumentSnapshot(draft:DocumentDraft){const value={...draft};delete value.subtotal;delete value.vat;delete value.total;delete value.calculation;return JSON.stringify(value);}

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
  const returnTo=!existing?safeAppPath(searchParams.get("returnTo"),"/"+plural):"/"+plural;

  const [preview,setPreview]=useState(false);
  const [editing,setEditing]=useState(!existing);
  const [wizardStep,setWizardStep]=useState(0);
  const documentActionPending=useRef(false);
  const [moreOpen,setMoreOpen]=useState(false);
  const [followupOpen,setFollowupOpen]=useState(false);
  const [documentRole,setDocumentRole]=useState("");
  const [demoDocument,setDemoDocument]=useState(true);
  const [documentReadOnly,setDocumentReadOnly]=useState(true);
  const [sendPurpose,setSendPurpose]=useState<"document"|"reminder">("document");
  const [sendOpen,setSendOpen]=useState(false),[recipient,setRecipient]=useState("");
  const recipientTouched=useRef(false);
  const [mailSubject,setMailSubject]=useState(""),[mailMessage,setMailMessage]=useState("");
  const [issueReadiness,setIssueReadiness]=useState<InvoiceReadiness|null>(null);
  const [discardOpen,setDiscardOpen]=useState(false);
  const discardKey=useRef<{revision:string;key:string}|null>(null);
  const [actionBusy,setActionBusy]=useState(false),[actionError,setActionError]=useState<string|null>(null);
  const [creditOpen,setCreditOpen]=useState(false),[creditAmount,setCreditAmount]=useState(""),[creditReason,setCreditReason]=useState("");
  const [adjustmentKind,setAdjustmentKind]=useState<"credit"|"refund">("credit");
  const [refundDate,setRefundDate]=useState(businessDate);
  const adjustmentIsRefund=adjustmentKind==='refund';
  const creditKey=useRef("");
  const [sendKey,setSendKey]=useState("");
  useEffect(()=>{apiGet<{demo?:boolean;tenant?:{role?:string;readOnly?:boolean}}>("/api/auth/session").then(s=>{setDocumentRole(s.tenant?.role??"");setDocumentReadOnly(s.tenant?.readOnly===true);setDemoDocument(s.demo===true)}).catch(()=>{});},[]);
  const [toast,setToast]=useState<string|null>(null);
  const [saving,setSaving]=useState(false);
  const documentSavePending=useRef(false);
  const createRequest=useRef<{body:string;key:string}|null>(null);
  const [draftReplay,setDraftReplay]=useState<{body:string;key:string}|null>(null);
  const [dirty,setDirty]=useState(false);
  const draftBaseline=useRef<string|null>(null);
  const [draft,setDraft]=useDocumentDraft(createInitialDraft(kind));
  const refundableAmount=customerCredit({total:draft.total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount});
  const {directory,loading:customersLoading,error:customersError,refresh:refreshCustomers}=useCustomerDirectory(editing||sendOpen,draft.customerId??searchParams.get("customerId")??undefined);
  useEffect(()=>{if(!sendOpen||recipientTouched.current)return;const email=resolveCustomer(draft,directory)?.email;if(email){recipientTouched.current=true;queueMicrotask(()=>setRecipient(email));}},[sendOpen,draft,directory]);
  const company=useDocumentCompany();
  useEffect(()=>{if(existing||dirty||company.loading||searchParams.get("sourceOffer"))return;setDraft(current=>({...current,...documentDefaults(company.raw,resolveCustomer(current,directory),kind,current.date||businessDate())}));},[existing,dirty,company.loading,company.raw,draft.customerId,directory,kind,setDraft,searchParams]);
  const companyPending=editing&&company.loading;
  const paymentIssue=kind==="Rechnung"&&!company.loading&&!company.error?invoicePaymentIssue(company.raw):null;
  const documentLoad=useExistingDocument(kind,existing?documentKey:undefined,setDraft,editing);
  useEffect(()=>{if(existing)return;queueMicrotask(()=>setDraft(current=>({...current,date:current.date||new Date().toLocaleDateString("en-CA"),customer:current.customer})))},[existing,directory,setDraft]);
  const selectedProductId=!existing?searchParams.get("productId"):null;
  const productQuery=useApiQuery<{item?:Record<string,unknown>}>(selectedProductId?"/api/products/"+encodeURIComponent(selectedProductId):null);
  const initializedProduct=useRef<string|null>(null);
  useEffect(()=>{const product=productQuery.data?.item;if(!selectedProductId||!product||initializedProduct.current===selectedProductId||dirty)return;initializedProduct.current=selectedProductId;setDraft(current=>({...current,positions:[{id:"product-"+selectedProductId,description:String(product.name??""),quantity:"1",unit:String(product.unit??"piece"),price:String(product.unit_price??0),vatRate:String(product.vat_rate??current.vatRate)}]}));},[selectedProductId,productQuery.data,dirty,setDraft]);
  const selectedCustomerId=!existing?searchParams.get("customerId"):null;
  const initializedCustomer=useRef<string|null>(null);
  useEffect(()=>{if(!selectedCustomerId||initializedCustomer.current===selectedCustomerId)return;const customer=Object.entries(directory).find(([,item])=>item.id===selectedCustomerId);if(customer){initializedCustomer.current=selectedCustomerId;setDraft(current=>({...current,customer:customer[1].name??customer[0],customerId:selectedCustomerId}));}},[selectedCustomerId,directory,setDraft]);
  const sourceOffer=kind==="Rechnung"?searchParams.get("sourceOffer"):null;
  const sourceTimeEntriesParam=kind==="Rechnung"?(searchParams.get("timeEntries")??""):"";

  const sourceQuery=useApiQuery<{item?:Record<string,unknown>;items?:Array<Record<string,unknown>>}>(!existing&&sourceOffer?("/api/documents/"+encodeURIComponent(sourceOffer)):null);
  const sourceItem=sourceQuery.data?.item??sourceQuery.data?.items?.[0];
  const sourceCustomer=useApiQuery<{item?:Parameters<typeof customerDirectory>[0][number]}>(sourceItem?.customer_id&&sourceOffer?"/api/customers/"+encodeURIComponent(String(sourceItem.customer_id)):null);
  const sourceLoading=sourceQuery.loading||sourceCustomer.loading;
  const sourceInvalid=!existing&&sourceOffer&&!sourceLoading&&!sourceQuery.error&&(!sourceItem||sourceItem.kind!=="offer"||sourceItem.status!=="accepted"||Boolean(sourceItem.invoice_number));
  const sourceError=sourceQuery.error||sourceCustomer.error||(sourceInvalid?"Das Ursprungsangebot muss angenommen und noch nicht verrechnet sein.":null);
  const initializedOffer=useRef<string|null>(null);
  useEffect(()=>{
    if(existing||!sourceOffer||!sourceItem||sourceError||company.loading||customersLoading||sourceCustomer.loading||sourceCustomer.error||initializedOffer.current===sourceOffer)return;
    initializedOffer.current=sourceOffer;
    const source=remoteDraftFromItem(sourceItem,"Angebot");
    queueMicrotask(()=>setDraft(current=>invoiceDraftFromOffer(source,current,company.raw,sourceCustomer.data?.item??resolveCustomer(source,directory))));
  },[existing,sourceOffer,sourceItem,sourceError,company.loading,company.raw,customersLoading,sourceCustomer.loading,sourceCustomer.error,sourceCustomer.data,directory,setDraft]);

  const sourceExpenseParam=kind==='Rechnung'?(searchParams.get('expenses')??''):'';
  const recovery=useProcessDraft({process:kind+":"+searchParams.toString(),value:{draft,step:wizardStep,replay:draftReplay},dirty,enabled:!existing&&!customersLoading&&!customersError&&!sourceLoading&&!sourceError&&!sourceTimeEntriesParam&&!sourceExpenseParam,onRestore:stored=>{
    if(!stored?.draft||!Array.isArray(stored.draft.positions)||!stored.draft.positions.length||stored.draft.id||stored.draft.number||['customer','number','date','due','vatRate','note'].some(key=>typeof (stored.draft as unknown as Record<string,unknown>)[key]!=='string')||stored.draft.positions.some(item=>!item||['id','description','quantity','price'].some(key=>typeof (item as unknown as Record<string,unknown>)[key]!=='string'))||stored.replay&&(typeof stored.replay.body!=='string'||typeof stored.replay.key!=='string'))return;
    draftBaseline.current=editableDocumentSnapshot(draft);setDraft(stored.draft);setWizardStep(Math.max(0,Math.min(3,Number(stored.step)||0)));createRequest.current=stored.replay??null;setDraftReplay(stored.replay??null);setDirty(true);
  }});
  const timeSource=useApiQuery<{items:Array<{id:string;hours:number;description?:string;sales_rate:number;customer_id:string;customer_name:string;project_name:string;external_resource_id?:string;remaining_minutes?:number;price_source_id?:string;price_currency?:string;vat_rate?:string;tax_treatment?:string}>}>(kind==='Rechnung'&&sourceTimeEntriesParam&&true?'/api/time-entries/billing?minuteAllocations=1&ids='+encodeURIComponent(sourceTimeEntriesParam):null);
  const expenseSource=useApiQuery<{items:Array<{id:string;customer_id:string;customer_name:string;description:string;quantity:number;unit_price:number;vat_rate:number;currency:string}>}>(kind==='Rechnung'&&sourceExpenseParam&&true?'/api/expenses/billing?ids='+encodeURIComponent(sourceExpenseParam):null);
  const [billingSourceError,setBillingSourceError]=useState<string|null>(null);
  const billingLoading=timeSource.loading||expenseSource.loading;
  const billingError=timeSource.error||expenseSource.error||billingSourceError;
  const importedSources=useRef("");
  useEffect(()=>{
    if(kind!=="Rechnung"||(!sourceTimeEntriesParam&&!sourceExpenseParam)||!true||billingLoading||timeSource.error||expenseSource.error||existing&&(documentLoad.loading||!draft.id))return;
    const key=(documentKey??'new')+':'+sourceTimeEntriesParam+':'+sourceExpenseParam;
    if(importedSources.current===key)return;importedSources.current=key;
    const load=async()=>{
      const times=timeSource.data?.items??[];
      const expenses=expenseSource.data?.items??[];
      if(times.length!==sourceTimeEntriesParam.split(',').filter(Boolean).length||expenses.length!==sourceExpenseParam.split(',').filter(Boolean).length)throw new Error('Mindestens ein Eintrag ist nicht mehr verrechenbar.');
      const sources=[...times,...expenses];const customer=sources[0]?.customer_id;
      if(!customer||sources.some(i=>i.customer_id!==customer)||existing&&draft.customerId!==customer)throw new Error('Alle Positionen müssen zum Kunden dieser Rechnung gehören.');
      if(existing&&draft.status!=='draft')throw new Error('Zeiten und Spesen können nur einem Rechnungsentwurf hinzugefügt werden.');
      if(expenses.some(i=>i.currency!==(existing?draft.currency:expenses[0].currency)))throw new Error('Die Währungen der Spesen und Rechnung müssen übereinstimmen.');
      const currency=existing?draft.currency:expenses[0]?.currency??times.find(t=>t.external_resource_id)?.price_currency??draft.currency;
      if(times.some(t=>(t.external_resource_id?t.price_currency:'CHF')!==currency)||expenses.some(e=>e.currency!==currency))throw new Error('Leistungspreis und Rechnungswährung müssen übereinstimmen. Es erfolgt keine automatische Umrechnung.');
      const groups=Object.values(times.filter(t=>!t.external_resource_id).reduce<Record<string,typeof times>>((all,item)=>{(all[JSON.stringify([item.project_name,Number(item.sales_rate)])]??=[]).push(item);return all},{}));
      const positions:LineItem[]=[...groups.map((items,index)=>({id:"time-"+index,description:items[0].project_name,quantity:items.reduce((sum,item)=>sum+Number(item.hours),0).toFixed(2),unit:"Stunden",price:String(items[0].sales_rate||0),timeEntryIds:items.map(item=>item.id) })),...times.filter(t=>t.external_resource_id).map(t=>({id:'minute-'+t.id,description:t.project_name+(t.description?' · '+t.description:''),quantity:String(t.remaining_minutes),unit:'min',price:String(t.sales_rate),vatRate:String(t.vat_rate??0),taxExempt:t.tax_treatment!=='taxable',priceBaseQuantity:60 as const,availableMinutes:t.remaining_minutes,timeAllocations:[{timeEntryId:t.id,minutes:Number(t.remaining_minutes),priceSourceId:t.price_source_id!}]})),...expenses.map(i=>({id:'expense-'+i.id,description:i.description,quantity:String(i.quantity),price:String(i.unit_price),unit:'Stück',vatRate:String(i.vat_rate),expenseIds:[i.id]}))];
      draftBaseline.current??=editableDocumentSnapshot(draft);
      setDraft(current=>({...current,customer:sources[0].customer_name,customerId:customer,currency:currency??current.currency,positions:existing?[...current.positions,...positions]:positions,subtotal:undefined,vat:undefined,total:undefined}));setDirty(true);setEditing(true);setBillingSourceError(null);
    };void load().catch(e=>{importedSources.current='';setBillingSourceError(e instanceof Error?e.message:'Positionen konnten nicht geladen werden.');});
  },[existing,kind,sourceTimeEntriesParam,sourceExpenseParam,documentLoad.loading,draft,documentKey,setDraft,billingLoading,timeSource.data,timeSource.error,expenseSource.data,expenseSource.error]);

  useEffect(()=>{
    if(existing||!true) return;
    const selected=resolveCustomer({customer:draft.customer,customerId:draft.customerId},directory),first=Object.values(directory)[0];
    if(selected&&((selected.name??draft.customer)!==draft.customer||selected.id!==draft.customerId))queueMicrotask(()=>setDraft(current=>({...current,customer:selected.name??current.customer,customerId:selected.id})));
    else if(!draft.customer&&!draft.customerId&&first&&Object.keys(directory).length===1)queueMicrotask(()=>setDraft(current=>current.customer||current.customerId?current:{...current,customer:first.name??'',customerId:first.id}));
  },[existing,directory,draft.customer,draft.customerId,setDraft]);

  const show=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(null),2300);};
  const save=async()=>{
    if(documentSavePending.current||companyPending||documentLoad.loading||documentLoad.error||customersLoading||customersError||sourceLoading||sourceError||billingLoading||billingError||!recovery.ready)return;
    const totals=calculateDraft({...draft,subtotal:undefined,vat:undefined,total:undefined,calculation:undefined});if(totals.error){show(totals.error);return;}
    if(!resolveCustomer(draft,directory)){show("Bitte zuerst einen Kunden erfassen.");return;}
    if(company.error){show(company.error);return;}
    documentSavePending.current=true;setSaving(true);
    let savedNumber=draft.number;
    try{
      {}
      {
        const payload={...documentPayload(kind,draft),sourceOffer:sourceOffer||undefined,customerId:resolveCustomer(draft,directory)?.id??draft.customerId};
        const requestBody=JSON.stringify(payload);
        if(createRequest.current?.body!==requestBody){createRequest.current={body:requestBody,key:crypto.randomUUID()};setDraftReplay(createRequest.current);}
        if(!existing)recovery.persist({draft,step:wizardStep,replay:createRequest.current});
        const response=existing?await apiPatch<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number),payload,undefined,{idempotencyKey:createRequest.current?.key}):await apiPost<{item:Record<string,unknown>}>("/api/documents",payload,{idempotencyKey:createRequest.current?.key});
        if(Number(response.item.total)!==totals.total)throw new Error('Berechnung wurde geändert. Bitte den gespeicherten Stand prüfen.');
        savedNumber=String(response.item.number);
        setDraft(remoteDraftFromItem(response.item,kind));
      }
      recovery.clear();draftBaseline.current=null;setDirty(false);
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
  const processAction=async(action:string)=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{setIssueReadiness(null);if(kind==="Rechnung"&&action==="issue"){const number=documentKey??draft.number;const response=await apiGet<{item:InvoiceReadiness}>("/api/settings/readiness?"+new URLSearchParams({action:"issue_invoice",number}));if(response.item.number!==number||typeof response.item.ready!=="boolean")throw new Error("Prüfung konnte nicht bestätigt werden.");if(!response.item.ready){setIssueReadiness(response.item);return;}}await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/status",{action});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setMoreOpen(false);show("Status aktualisiert.")}catch(e){setActionError(e instanceof Error?e.message:"Status konnte nicht geändert werden.")}finally{documentActionPending.current=false;setActionBusy(false)}};
  const discardDraft=async()=>{
    if(documentActionPending.current||documentSavePending.current||!canWrite||kind!=='Rechnung'||draft.status!=='draft'||!draft.updatedAt)return;
    documentActionPending.current=true;setActionBusy(true);setActionError(null);
    try{if(discardKey.current?.revision!==draft.updatedAt)discardKey.current={revision:draft.updatedAt,key:crypto.randomUUID()};const result=await apiDelete<{item:{discarded:boolean}}>('/api/documents/'+encodeURIComponent(documentKey??draft.number),{expectedUpdatedAt:draft.updatedAt},{idempotencyKey:discardKey.current.key});if(result.item?.discarded!==true)throw new Error('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.');setDirty(false);recovery.clear();setDiscardOpen(false);allowDraftNavigation();router.push('/rechnungen');}
    catch(error){setActionError(error instanceof Error?error.message:'Entwurf konnte nicht verworfen werden.');}
    finally{documentActionPending.current=false;setActionBusy(false);}
  };
  const revisionKey=useRef<{number:string;key:string}|null>(null);
  const reviseOffer=async()=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{const sourceNumber=documentKey??draft.number;if(revisionKey.current?.number!==sourceNumber)revisionKey.current={number:sourceNumber,key:crypto.randomUUID()};const response=await apiPost<{item:Record<string,unknown>&{number:string}}>('/api/documents/'+encodeURIComponent(documentKey??draft.number)+'/revision',{}, {idempotencyKey:revisionKey.current.key});if(!response.item?.number)throw new Error('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.');revisionKey.current=null;const revisedDraft=remoteDraftFromItem(response.item as Record<string,unknown>,kind);draftBaseline.current=editableDocumentSnapshot(revisedDraft);setMoreOpen(false);setDirty(false);setEditing(true);setDraft(revisedDraft);documentActionPending.current=false;setActionBusy(false);if(sourceNumber!==response.item.number)router.replace('/angebote/'+encodeURIComponent(response.item.number))}catch(error){documentActionPending.current=false;setActionBusy(false);setActionError(error instanceof Error?error.message:'Angebot konnte nicht überarbeitet werden.')}};
  const bookCredit=async()=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+(adjustmentIsRefund?"/refunds":"/credits"),{amount:Number(creditAmount),reason:creditReason,...(adjustmentIsRefund?{date:refundDate}:{})},{idempotencyKey:creditKey.current});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setCreditOpen(false);show(adjustmentIsRefund?'Rückerstattung erfasst.':'Gutschrift erfasst.')}catch(e){setActionError(e instanceof Error?e.message:adjustmentIsRefund?"Rückerstattung konnte nicht erfasst werden.":"Gutschrift konnte nicht erfasst werden.")}finally{documentActionPending.current=false;setActionBusy(false)}};
  const sendDocument=async()=>{if(documentActionPending.current||documentSavePending.current)return;documentActionPending.current=true;setActionBusy(true);setActionError(null);try{await apiPost("/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/send",{recipient,requestKey:sendKey,purpose:sendPurpose,...(sendPurpose==="document"?{subject:mailSubject,message:mailMessage,issueConfirmed:kind==="Angebot"&&draft.status==="draft"}:{})});const payload=await apiGet<{item:Record<string,unknown>}>("/api/documents/"+encodeURIComponent(documentKey??draft.number));setDraft(remoteDraftFromItem(payload.item,kind));setSendOpen(false);show('Versand vom E-Mail-Anbieter angenommen. Zustellung noch nicht nachgewiesen.')}catch(e){setActionError(e instanceof Error?e.message:"Versand konnte nicht bestätigt werden.")}finally{documentActionPending.current=false;setActionBusy(false)}};
  const sendingReminder=sendPurpose==='reminder';
  const sendButtonLabel=actionBusy?"Wird versendet …":sendingReminder?"Zahlungserinnerung senden":kind==="Angebot"&&draft.status==="draft"?"Ausstellen und senden":"PDF senden";
  const canRecordPayment=!documentReadOnly&&tenantCan(documentRole,"payments:write")&&kind==="Rechnung"&&!["draft","cancelled"].includes(draft.status??"draft");
  const presentation=documentPresentation(kind,draft,useDocumentTotals(draft).total);
  const title=existing?kind:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons"><IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/></div>;
  const desktopActions=headerActions;

  const closeCreation=()=>{recovery.clear();allowDraftNavigation();router.push(returnTo)};
  const closeEdit=()=>{if(draftBaseline.current)setDraft(JSON.parse(draftBaseline.current) as DocumentDraft);draftBaseline.current=null;recovery.clear();setDirty(false);setEditing(false)};
  const feedback=toast&&<Toast title={toast} tone={[`${kind} gespeichert.`,`${kind} erstellt.`,"Status aktualisiert.","Dokument als PDF versendet.","Gutschrift erfasst.","Rückerstattung erfasst.","Zahlungserinnerung versendet.","Nummer kopiert."].includes(toast)?"success":"danger"}/>;
  const readinessFeedback=issueReadiness&&issueReadiness.number===(documentKey??draft.number)&&!issueReadiness.ready&&<ErrorState><LocalizedText>{issueReadiness.message||"Bitte Rechnungsangaben prüfen."}</LocalizedText>{issueReadiness.recovery&&<Button variant="secondary" onClick={()=>{const target=issueReadiness.recovery!.href;if(target==="/rechnungen/"+encodeURIComponent(documentKey??draft.number)){documentLoad.refresh();company.refresh();setIssueReadiness(null);setMoreOpen(false)}else router.push(safeAppPath(target,"/einstellungen"))}}><LocalizedText>{issueReadiness.recovery.label}</LocalizedText></Button>}</ErrorState>;
  const documentContent=<>
    {!existing&&feedback}
    {actionError&&!moreOpen&&!sendOpen&&!creditOpen&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}
    {editing&&productQuery.error&&<ErrorState onRetry={productQuery.refresh}>{productQuery.error}</ErrorState>}
    {!moreOpen&&readinessFeedback}
    {editing&&company.error&&<ErrorState onRetry={company.refresh}>{company.error}</ErrorState>}
    {editing&&companyPending&&<LoadingState><LocalizedText>{"Firmendaten werden geladen …"}</LocalizedText></LoadingState>}
    {editing&&paymentIssue&&<div className="document-source-note" role="status"><span><LocalizedText>{paymentIssue}</LocalizedText></span>{tenantCan(documentRole,"organization:write")&&<Link href="/einstellungen/dokumente"><LocalizedText>{"Einstellungen"}</LocalizedText></Link>}</div>}
    {sourceOffer&&!existing&&<div className="document-source-note"><span><LocalizedText>{"Erstellt aus Angebot"}</LocalizedText></span><b>{sourceOffer}</b></div>}
    {customersLoading?<LoadingState><LocalizedText>{"Kunden werden geladen …"}</LocalizedText></LoadingState>:customersError?<ErrorState onRetry={refreshCustomers}><LocalizedText>{customersError}</LocalizedText></ErrorState>:sourceLoading?<LoadingState><LocalizedText>{"Ursprungsangebot wird geladen …"}</LocalizedText></LoadingState>:sourceError?<ErrorState onRetry={()=>{sourceQuery.refresh();sourceCustomer.refresh()}}><LocalizedText>{sourceError}</LocalizedText></ErrorState>:billingLoading?<LoadingState><LocalizedText>{"Verrechenbare Positionen werden geladen …"}</LocalizedText></LoadingState>:billingError?<ErrorState onRetry={()=>{timeSource.refresh();expenseSource.refresh()}}><LocalizedText>{billingError}</LocalizedText></ErrorState>:documentLoad.loading?<LoadingState><LocalizedText>{"Dokument wird geladen …"}</LocalizedText></LoadingState>:documentLoad.error?<EmptyState  title="Dokument konnte nicht geladen werden" description={documentLoad.error}/>:existing&&!editing
      ? <div className="document-desktop-workspace">
          <div className="document-desktop-detail">
            <DocumentReadView type={kind} draft={draft} directory={directory} canWrite={canWrite} followup={kind==="Angebot"&&canWrite?<OfferFollowup number={draft.number} open={followupOpen} onClose={()=>setFollowupOpen(false)}/>:undefined}/>
            {draft.id&&<EntityFiles purpose={kind==="Rechnung"?"invoice_attachment":"offer_attachment"} entityId={draft.id}/>}
          </div>

        </div>
      : !existing?<FormWizard cancelAction={<Button variant="secondary" onClick={closeCreation} disabled={saving}><LocalizedText>{"Abbrechen"}</LocalizedText></Button>} labels={["Kunde und Dokumentdaten","Positionen",kind==="Angebot"?"Gültig bis":"Zahlungsbedingungen","Prüfen und als Entwurf speichern"]} step={wizardStep} onStep={setWizardStep} busy={saving} action={<Button disabled={saving||productQuery.loading||Boolean(productQuery.error)||companyPending||Boolean(company.error)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":existing?"Speichern":"Als Entwurf speichern"}</LocalizedText></Button>}><DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,calculation:undefined,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} lockedCustomer={Boolean(sourceOffer)} step={!existing?wizardStep:undefined}/>{wizardStep===3&&<DocumentReview type={kind} draft={draft} onStep={setWizardStep}/>}{wizardStep===1&&editing&&kind==="Rechnung"&&draft.customerId&&tenantCan(documentRole,"invoices:write")&&<Button variant="secondary" href={"/zeit?invoice="+encodeURIComponent(existing?draft.number:"")+"&customerId="+encodeURIComponent(draft.customerId)}><LocalizedText>{"Freigegebene Zeiten hinzufügen"}</LocalizedText></Button>}</FormWizard>:<DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} lockedCustomer={Boolean(sourceOffer)} step={!existing?wizardStep:undefined}/>}
    {editing&&existing&&kind==="Rechnung"&&draft.customerId&&tenantCan(documentRole,"invoices:write")&&<Button variant="secondary" href={"/zeit?invoice="+encodeURIComponent(draft.number)+"&customerId="+encodeURIComponent(draft.customerId)}><LocalizedText>{"Freigegebene Zeiten hinzufügen"}</LocalizedText></Button>}
    {editing&&existing&&<FormActions><Button variant="secondary" onClick={closeEdit}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={saving||companyPending||Boolean(company.error)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</LocalizedText></Button></FormActions>}
  </>;
  return <AppShell title={existing?editing?kind+" bearbeiten":kind:title} titleIsUserContent={false} status={undefined} statusTone={presentation.statusTone} subtitle={undefined} active={plural} backHref={returnTo} backLabel={returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={desktopActions} mobileActions={existing&&!editing?headerActions:undefined} preview={preview} editing={editing} unsavedChanges={false}>
    {existing?(editing?<FormSheet workspace label={kind+" bearbeiten"} open onClose={closeEdit} busy={saving} dirty={dirty}>{documentContent}</FormSheet>:documentContent):<FormSheet workspace label={title} open onClose={closeCreation} busy={saving} dirty={dirty} wizard className="document-entry-workspace">{documentContent}</FormSheet>}
    {preview&&<DocumentModal previewDraft={documentPreviewPayload(kind,draft,existing&&editing?documentKey:undefined)} pdfNumber={existing&&!editing?documentKey??draft.number:undefined} title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}/>}
    <ActionSheet label="Weitere Aktionen" open={moreOpen} busy={actionBusy} onClose={()=>setMoreOpen(false)}><div className="action-list">
      {canEdit&&<ActionRow icon="edit" title="Bearbeiten" onClick={()=>{draftBaseline.current=editableDocumentSnapshot(draft);setMoreOpen(false);setEditing(true)}} navigation/>}
      <ActionRow icon="copy" title="Nummer kopieren" onClick={()=>{void navigator.clipboard.writeText(draft.number).then(()=>{setMoreOpen(false);show("Nummer kopiert.")}).catch(()=>{setActionError("Nummer konnte nicht kopiert werden.")})}}/>
      {canRecordPayment&&<ActionRow href={"/zahlungen/neu?invoice="+encodeURIComponent(documentKey??draft.number)} icon="wallet" title="Zahlung erfassen"/>}
      {kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"projects:write")&&<ActionRow href={draft.projectId?"/projekte/"+encodeURIComponent(draft.projectId):"/projekte/neu?customerId="+encodeURIComponent(draft.customerId??"")+"&sourceOffer="+encodeURIComponent(draft.number)} icon="clock" title={draft.projectId?"Auftrag öffnen":"Auftrag starten"}/>}
      {kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"invoices:write")&&<ActionRow href={draft.invoiceNumber?"/rechnungen/"+encodeURIComponent(draft.invoiceNumber):"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)} icon="receipt" title={draft.invoiceNumber?"Rechnung öffnen":"Rechnung erstellen"}/>}
      <ActionRow onClick={()=>{setMoreOpen(false);setPreview(true)}} icon="file" title="Vorschau" navigation/>
      <ActionRow href={"/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/pdf"} icon="file" title="PDF herunterladen"/>
      {canWrite&&!(kind==='Rechnung'&&draft.status==='draft')&&!['cancelled','declined','expired','revised'].includes(draft.status??'')&&<ActionRow disabled={demoDocument||actionBusy} onClick={()=>{recipientTouched.current=false;setRecipient(resolveCustomer(draft,directory)?.email??"");setMailSubject(kind+" "+draft.number);setMailMessage("Guten Tag\n\nIm Anhang findest du "+(kind==="Angebot"?"unser Angebot.":"unsere Rechnung.")+(kind==="Angebot"?" Über den sicheren Link kannst du das Angebot prüfen und beantworten.":"")+"\n\nFreundliche Grüsse");setSendPurpose('document');setSendKey(crypto.randomUUID());setActionError(null);setMoreOpen(false);setSendOpen(true)}} icon="mail" title={demoDocument?'Versand in der Demo deaktiviert':'Per E-Mail senden'} navigation/>}
      {canWrite&&kind==='Angebot'&&presentation.displayStatus==='sent'&&<ActionRow icon="clock" title="Erinnerung" navigation onClick={()=>{setMoreOpen(false);setFollowupOpen(true)}}/>}
      {canWrite&&kind==='Rechnung'&&presentation.displayStatus==='overdue'&&<ActionRow disabled={demoDocument||actionBusy} onClick={()=>{setSendPurpose('reminder');setSendKey(crypto.randomUUID());setActionError(null);setMoreOpen(false);setSendOpen(true)}} icon="mail" title={demoDocument?'Versand in der Demo deaktiviert':'Zahlungserinnerung senden'} navigation/>}
      {canWrite&&kind==='Rechnung'&&draft.status==='draft'&&!demoDocument&&<ActionRow disabled={actionBusy} onClick={()=>{setActionError(null);setMoreOpen(false);setDiscardOpen(true)}} icon="trash" title="Entwurf verwerfen" danger/>}
      {canWrite&&draft.status==='draft'&&<ActionRow disabled={actionBusy} onClick={()=>void processAction('issue')} icon="check" title={kind==='Rechnung'?'Rechnung stellen':'Als extern versendet erfassen'}/>}
      {canWrite&&kind==='Angebot'&&['sent','expired','declined'].includes(draft.status??'')&&<ActionRow disabled={actionBusy} onClick={()=>void reviseOffer()} icon="edit" title="Angebot überarbeiten" navigation/>}
      {canWrite&&kind==='Angebot'&&draft.status==='sent'&&<><ActionRow disabled={actionBusy} onClick={()=>void processAction('accept')} icon="check" title="Kundenannahme erfassen"/><ActionRow disabled={actionBusy} onClick={()=>void processAction('decline')} icon="close" title="Kundenablehnung erfassen" danger/></>}
      {canWrite&&kind==='Rechnung'&&!['draft','cancelled'].includes(draft.status??'draft')&&Number(draft.total??0)>Number(draft.creditAmount??0)&&<ActionRow disabled={actionBusy} onClick={()=>{setAdjustmentKind("credit");creditKey.current=crypto.randomUUID();setCreditAmount("");setCreditReason("");setActionError(null);setMoreOpen(false);setCreditOpen(true)}} icon="receipt" title="Gutschrift erfassen" navigation/>}
      {canWrite&&tenantCan(documentRole,'payments:write')&&kind==='Rechnung'&&refundableAmount>0&&<ActionRow disabled={actionBusy} onClick={()=>{setAdjustmentKind('refund');setRefundDate(businessDate());creditKey.current=crypto.randomUUID();setCreditAmount('');setCreditReason('');setActionError(null);setMoreOpen(false);setCreditOpen(true)}} icon="wallet" title="Rückerstattung erfassen" navigation/>}
      {canWrite&&kind==='Rechnung'&&Number(draft.paidAmount??0)===0&&Number(draft.creditAmount??0)===0&&['draft','sent','overdue'].includes(draft.status??'')&&<ActionRow disabled={actionBusy} onClick={()=>void processAction('cancel')} icon="close" title="Rechnung stornieren" danger/>}
      </div>{readinessFeedback}{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</ActionSheet>
    <FormSheet label={adjustmentIsRefund?"Rückerstattung erfassen":"Gutschrift erfassen"} description={draft.number} open={creditOpen} busy={actionBusy} onClose={()=>setCreditOpen(false)}><form onSubmit={event=>{event.preventDefault();void bookCredit()}}><div className="sheet-body"><Field label="Betrag"><Input type="number" inputMode="decimal" min="0.01" step="0.01" max={adjustmentIsRefund?refundableAmount:Math.max(0,Number(draft.total??0)-Number(draft.creditAmount??0))} value={creditAmount} onChange={event=>{setCreditAmount(event.target.value);creditKey.current=crypto.randomUUID()}} required/></Field><Field label="Interne Begründung"><Textarea value={creditReason} onChange={event=>{setCreditReason(event.target.value);creditKey.current=crypto.randomUUID()}} minLength={3} maxLength={2000} required/></Field>{adjustmentIsRefund&&<Field label="Rückerstattungsdatum"><Input type="date" max={businessDate()} value={refundDate} onChange={event=>{setRefundDate(event.target.value);creditKey.current=crypto.randomUUID()}} required/></Field>}<p><LocalizedText>{adjustmentIsRefund?"Nur eine bereits ausserhalb von Binso One ausgeführte Rückerstattung erfassen. Es wird keine Bankzahlung ausgelöst.":"Die Gutschrift reduziert die Forderung. Eine Rückerstattung wird nicht ausgelöst."}</LocalizedText></p>{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</div><FormActions><Button type="button" variant="secondary" disabled={actionBusy} onClick={()=>setCreditOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button type="submit" disabled={actionBusy||!creditAmount||creditReason.trim().length<3}><LocalizedText>{actionBusy?'Wird gespeichert…':adjustmentIsRefund?'Rückerstattung erfassen':'Gutschrift erfassen'}</LocalizedText></Button></FormActions></form></FormSheet>
    <FormSheet label={sendingReminder?"Zahlungserinnerung senden":"Dokument senden"} description={kind+" als PDF · "+draft.number} open={sendOpen} busy={actionBusy} onClose={()=>setSendOpen(false)}><div className="sheet-body"><Field label="Empfänger"><Input type="email" value={recipient} onChange={e=>{recipientTouched.current=true;setRecipient(e.target.value);setSendKey(crypto.randomUUID())}} autoComplete="email"/></Field>{!sendingReminder&&<><Field label="Betreff"><Input value={mailSubject} maxLength={180} onChange={event=>{setMailSubject(event.target.value);setSendKey(crypto.randomUUID())}}/></Field><Field label="Begleittext"><Textarea value={mailMessage} maxLength={4000} onChange={event=>{setMailMessage(event.target.value);setSendKey(crypto.randomUUID())}}/></Field><Button variant="secondary" onClick={()=>setPreview(true)}>PDF-Vorschau</Button></>}<p>{kind==="Angebot"&&draft.status==="draft"&&<LocalizedText>{"Mit dem Versand wird diese Angebotsversion verbindlich ausgestellt. "}</LocalizedText>}<LocalizedText>{sendingReminder?"Der aktuelle offene Betrag wird geprüft. Der Versand erhöht die Mahnstufe; es werden keine Gebühren berechnet.":kind==="Angebot"?"PDF und sicherer, versionierter Angebotslink werden versendet.":"Das ausgestellte Dokument wird als PDF versendet."}</LocalizedText></p>{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</div><FormActions sheet><Button variant="secondary" onClick={()=>setSendOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={actionBusy||!recipient||(!sendingReminder&&!mailSubject.trim())} onClick={()=>void sendDocument()}><LocalizedText>{sendButtonLabel}</LocalizedText></Button></FormActions></FormSheet>
    <FormSheet label="Entwurf verwerfen" open={discardOpen} busy={actionBusy} onClose={()=>setDiscardOpen(false)}><div className="sheet-body"><p><LocalizedText>{"Der Entwurf wird archiviert. Reservierte Minuten werden freigegeben. Es wird keine Rechnung ausgestellt."}</LocalizedText></p>{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</div><FormActions sheet><Button variant="secondary" disabled={actionBusy} onClick={()=>setDiscardOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={actionBusy} onClick={()=>void discardDraft()}><LocalizedText>{"Entwurf verwerfen"}</LocalizedText></Button></FormActions></FormSheet>
    {existing&&feedback}
  </AppShell>;
}

/** Review the real draft as an app task; the separately opened PDF owns paper layout. */
function DocumentReview({type,draft,onStep}:{type:DocumentKind;draft:DocumentDraft;onStep:(step:number)=>void}){
 const totals=useDocumentTotals(draft),currency=draft.currency??"CHF";
 return <div className="document-review">
  <section className="form-section"><SectionTitle title="Kunde" action={<Button variant="ghost" icon="edit" onClick={()=>onStep(0)}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>}/><strong>{draft.customer}</strong><p><LocalizedText>{type==="Rechnung"?"Rechnungsdatum":"Angebotsdatum"}</LocalizedText>: {isoToSwiss(draft.date)}</p></section>
  <section className="form-section"><SectionTitle title="Positionen" action={<Button variant="ghost" icon="edit" onClick={()=>onStep(1)}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>}/><div className="document-review-positions">{draft.positions.map((item,index)=><div key={item.id}><span><b>{item.description}</b><small>{item.quantity} × {currency} {money(numberValue(item.price))}{item.priceBaseQuantity===60&&<LocalizedText>{" / 60 min"}</LocalizedText>}</small></span><strong>{currency} {money(lineAmount(item,totals.calculation,draft.positions.indexOf(item)))}</strong></div>)}</div></section>
  <section className="form-section"><SectionTitle title={type==="Angebot"?"Gültig bis":"Zahlungsbedingungen"} action={<Button variant="ghost" icon="edit" onClick={()=>onStep(2)}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>}/><p>{type==="Rechnung"?<>{draft.due}<LocalizedText>{" Tage"}</LocalizedText></>:isoToSwiss(draft.due)}</p>{draft.note&&<p>{draft.note}</p>}</section>
  <DocumentTotals draft={draft} totals={totals}/>
 </div>;
}

function documentPresentation(type:DocumentKind,draft:DocumentDraft,total:number){
  const isInvoice=type==="Rechnung";
  const dueDate=isInvoice&&draft.date&&draft.due?invoiceDueDate(draft.date,draft.due):"";
  const displayStatus=financialStatus({kind:isInvoice?"invoice":"offer",status:draft.status,total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount,due_date:dueDate?dueDate.split(".").reverse().join("-"):null,valid_until:isInvoice?null:draft.due});
  const statusLabel=financialStatusText(displayStatus,isInvoice?'invoice':'offer');
  const statusTone=financialStatusTone({kind:isInvoice?"invoice":"offer",status:displayStatus,total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount},displayStatus);
  return {displayStatus,statusLabel,statusTone,dueDate};
}

function DocumentReadView({type,draft,directory,canWrite,followup}:{type:DocumentKind;draft:DocumentDraft;directory:CustomerDirectory;canWrite:boolean;followup?:ReactNode}){
  const totals=useDocumentTotals(draft);
  const currency=draft.currency??"CHF";
  const isInvoice=type==="Rechnung";
  const dueDate=isInvoice&&draft.date&&draft.due?invoiceDueDate(draft.date,draft.due):"";
  const outstanding=openAmount({total:totals.total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount});
  const document={kind:'invoice',status:draft.status,total:totals.total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount,due_date:dueDate?dueDate.split('.').reverse().join('-'):null};
  const axes=invoiceStatusAxes(document),creditBalance=customerCredit(document),hasClaim=isInvoice&&axes.document==='issued'&&outstanding>0;
  const {statusLabel,statusTone}=documentPresentation(type,draft,totals.total);
  return <div className="document-detail-view">
    <section className="document-detail-section">
      <div className="document-reference-row"><strong>{draft.number}</strong>{!isInvoice&&draft.offerVersion&&<span><LocalizedText>{"Version"}</LocalizedText> {draft.offerVersion}</span>}</div>
      <div className="document-customer-heading"><h2>{draft.customerId?<Link href={"/kunden/"+encodeURIComponent(draft.customerId)}>{draft.customer}</Link>:draft.customer}</h2></div>
    </section>
    <section className="document-detail-section"><MetricTiles columns={2}><MetricTile label={hasClaim?"Offener Betrag":"Total"} value={hasClaim?outstanding:totals.total} currency={currency}/><MetricTile label={isInvoice&&axes.payment?'Zahlung':'Status'} value={<Status appearance="pill" tone={isInvoice&&axes.payment?financialStatusTone(document,axes.payment):statusTone}>{isInvoice&&axes.payment?financialStatusText(axes.payment,'invoice'):statusLabel}</Status>}/></MetricTiles></section>
    <section className="document-facts">
      <div><small><LocalizedText>{type==="Rechnung"?"Rechnungsdatum":"Angebotsdatum"}</LocalizedText></small><b>{isoToSwiss(draft.date)}</b></div>
      {type==="Angebot"
        ? <div><small><LocalizedText>{"Gültig bis"}</LocalizedText></small><b><LocalizedText>{draft.due&&isoToSwiss(draft.due)}</LocalizedText></b></div>
        : <>{['paid','overpaid'].includes(axes.payment??'')&&draft.paidOn?<div><small><LocalizedText>{"Bezahlt am"}</LocalizedText></small><b>{isoToSwiss(draft.paidOn)}</b></div>:axes.due&&<div><small><LocalizedText>{"Fällig am"}</LocalizedText></small>{dueDate&&<b>{dueDate}</b>}<Status appearance="pill" tone={financialStatusTone(document,axes.due)}>{financialStatusText(axes.due)}</Status></div>}{axes.document==='issued'&&<div><small><LocalizedText>Dokument</LocalizedText></small><Status appearance="pill" tone="info"><LocalizedText>Ausgestellt</LocalizedText></Status></div>}<div><small><LocalizedText>Letzter Versand</LocalizedText></small><b><LocalizedText>{draft.deliveryStatus?deliveryLabel(draft.deliveryStatus):'Kein Versandnachweis'}</LocalizedText></b></div></>}
      {isInvoice&&draft.due&&<div className="document-payment-term"><small><LocalizedText>{"Zahlungsfrist"}</LocalizedText></small><b>{draft.due}<LocalizedText>{" Tage"}</LocalizedText></b></div>}
    </section>
    <section className="document-detail-section document-lines-section">
      <SectionTitle title="Positionen"/>
      <div className="document-read-table">
        <div className="document-read-head" aria-hidden="true"><span><LocalizedText>{"Bezeichnung"}</LocalizedText></span><span><LocalizedText>{"Menge"}</LocalizedText></span><span><LocalizedText>{"Einzelpreis"}</LocalizedText></span><span><LocalizedText>{"Betrag"}</LocalizedText></span></div>
        {draft.positions.map(item=><div className="document-read-row" key={item.id}>
          <b><LocalizedText verbatim={true}>{item.description}</LocalizedText></b>
          <span>{item.quantity} <LocalizedText>{({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"}</LocalizedText><small className="document-mobile-price"><LocalizedText>{" × "}</LocalizedText>{currency} {money(numberValue(item.price))}{item.priceBaseQuantity===60&&<LocalizedText>{" / 60 min"}</LocalizedText>}</small></span>
          <span>{currency} {money(numberValue(item.price))}{item.priceBaseQuantity===60&&<LocalizedText>{" / 60 min"}</LocalizedText>}</span>
          <strong>{currency} {money(lineAmount(item,totals.calculation,draft.positions.indexOf(item)))}</strong>
        </div>)}
      </div>
      <DocumentTotals draft={draft} totals={totals}/>
    </section>
    {isInvoice&&Number(draft.creditAmount??0)>0&&<p><LocalizedText>{"Gutschriften"}</LocalizedText>: {currency} {money(Number(draft.creditAmount))}</p>}
    {isInvoice&&creditBalance>0&&<MetricTile label="Kundenguthaben" value={`${currency} ${money(creditBalance)}`}/>}
    {hasClaim&&<LocalizedElement as="section" className="document-payment-facts" aria-label="Zahlungsstand"><SectionTitle title="Zahlungsstand"/>
      <MetricTile label="Bereits bezahlt" value={`${currency} ${money(Number(draft.paidAmount??0))}`}/>
    </LocalizedElement>}
    {!isInvoice&&draft.number&&<OfferHistory number={draft.number} canWrite={canWrite}/>}{followup}
    {(Boolean(draft.credits?.length||draft.reminders?.length||draft.refunds?.length||draft.revisesOffer||draft.revisions?.length||draft.sourceOffer||draft.invoiceNumber||draft.note))&&<DetailDisclosure label="Weitere Angaben">
    {isInvoice&&Boolean(draft.credits?.length)&&<section className="document-detail-section"><SectionTitle title="Gutschriften"/>{draft.credits?.map(credit=><p key={credit.number}><b>{credit.number}</b> · {credit.date.split('-').reverse().join('.')} · {currency} {money(Number(credit.amount))}<br/>{credit.reason}</p>)}</section>}
    {isInvoice&&Boolean(draft.reminders?.length)&&<section className="document-detail-section"><SectionTitle title="Mahnhistorie"/>{draft.reminders?.map(reminder=><p key={reminder.id}><b><LocalizedText>{reminder.stage===1?'Zahlungserinnerung':reminder.stage===2?'1. Mahnung':'2. Mahnung'}</LocalizedText></b> · <LocalizedText>{deliveryLabel(reminder.status)}</LocalizedText><br/>{reminder.recipient} · {currency} {money(Number(reminder.amount))} · <LocalizedText>{"Zahlungsfrist"}</LocalizedText>: {reminder.deadline.split('-').reverse().join('.')}</p>)}</section>}
    {isInvoice&&Boolean(draft.refunds?.length)&&<section className="document-detail-section"><SectionTitle title="Rückerstattungen"/>{draft.refunds?.map(refund=><p key={refund.id}>{refund.date.split('-').reverse().join('.')} · {currency} {money(Number(refund.amount))}<br/>{refund.reason}</p>)}</section>}
    {draft.revisesOffer&&<p><LocalizedText>{"Vorherige Angebotsversion"}</LocalizedText>: <Link href={'/angebote/'+encodeURIComponent(draft.revisesOffer)}>{draft.revisesOffer}</Link></p>}
    {Boolean(draft.revisions?.length)&&<section className="document-detail-section"><SectionTitle title="Überarbeitete Angebotsversionen"/>{draft.revisions?.map(revision=>{const label=financialStatusText(revision.status,'offer');return <p key={revision.number}><Link href={'/angebote/'+encodeURIComponent(revision.number)}>{revision.number}</Link> · <LocalizedText>{label}</LocalizedText></p>})}</section>}
    {draft.sourceOffer&&<p><LocalizedText>{"Ursprungsangebot: "}</LocalizedText><Link href={"/angebote/"+encodeURIComponent(draft.sourceOffer)}>{draft.sourceOffer}</Link></p>}{draft.invoiceNumber&&<p><LocalizedText>{"Rechnung: "}</LocalizedText><Link href={"/rechnungen/"+encodeURIComponent(draft.invoiceNumber)}>{draft.invoiceNumber}</Link></p>}
    {draft.note&&<section className="document-detail-section"><span className="eyebrow"><LocalizedText>{"NOTIZ"}</LocalizedText></span><p>{draft.note}</p></section>}
    </DetailDisclosure>}
  </div>;
}

function DiscountFields({value,onChange,currency,label}:{value:Discount;onChange:(value:Discount)=>void;currency:string;label:string}){
 return <section className="document-discount-fields"><Field label={label}><Select value={value.kind} onChange={e=>onChange(e.target.value==='none'?{kind:'none'}:e.target.value==='percent'?{kind:'percent',value:'0'}:{kind:'fixed',value:'0',currency})}><option value="none"><LocalizedText>{"Kein Rabatt"}</LocalizedText></option><option value="percent"><LocalizedText>{"Prozent"}</LocalizedText></option><option value="fixed"><LocalizedText>{"Fixbetrag"}</LocalizedText></option></Select></Field>{value.kind!=='none'&&<Field label={value.kind==='percent'?'Rabatt in Prozent':'Rabattbetrag'}><Input inputMode="decimal" value={value.value} onChange={e=>onChange({...value,value:e.target.value})}/></Field>}</section>;
}
function DocumentTotals({draft,totals}:{draft:DocumentDraft;totals:ReturnType<typeof calculateDraft>}){
 const currency=draft.currency??'CHF',c=totals.calculation;
 if(totals.error)return <ErrorState><LocalizedText>{totals.error}</LocalizedText></ErrorState>;
 return <div className="invoice-totals"><span><LocalizedText>{"Zwischentotal"}</LocalizedText><b>{currency} {money(c?Number(c.raw):totals.subtotal)}</b></span>
 {c?.lines.some(l=>l.discount.kind!=='none')&&<span><LocalizedText>{"Positionsrabatte"}</LocalizedText><b>−{currency} {money(Number(c.positionDiscountDisplay))}</b></span>}
 {c&&c.discount.kind!=='none'&&<span><LocalizedText>{"Gesamtrabatt"}</LocalizedText><b>−{currency} {money(Number(c.discountDisplay))}</b></span>}
 {c?c.taxGroups.map((g,index)=><span key={index}><span><LocalizedText>{g.exempt?'Steuerbefreit':'MwSt.'}</LocalizedText>{!g.exempt&&' '+Number(g.rate)+' %'}</span><b>{currency} {money(Number(g.tax))}</b></span>):<span><LocalizedText>{"MwSt."}</LocalizedText><b>{currency} {money(totals.vat)}</b></span>}
 {c&&c.positionRoundingCents!=='0'&&<span><LocalizedText>{"Rundung"}</LocalizedText><b>{currency} {money(Number(c.positionRoundingCents)/100)}</b></span>}
 {c&&c.discountRoundingCents!=='0'&&<span><LocalizedText>{"Rundung"}</LocalizedText><b>{currency} {money(Number(c.discountRoundingCents)/100)}</b></span>}
 <strong><LocalizedText>{"Total"}</LocalizedText><b>{currency} {money(totals.total)}</b></strong></div>;
}

function DocumentEditor({ type, draft, onChange, directory, step,lockedCustomer=false }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory;step?:number;lockedCustomer?:boolean }) {

  const company=useDocumentCompany();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
  const [noteOpen,setNoteOpen]=useState(Boolean(draft.note));
  const [mobilePositionId,setMobilePositionId]=useState<string|null>(null);
  const [positionDraft,setPositionDraft]=useState<LineItem|null>(null);
  const [discountOpen,setDiscountOpen]=useState(false),[discountDraft,setDiscountDraft]=useState<Discount>({kind:'none'}),[discountOrigin,setDiscountOrigin]=useState<'manual'|'customer'>('manual');
  const customerDiscount=Number(resolveCustomer(draft,directory)?.discount??0);
  const discountTotals=calculateDraft({...draft,discount:discountDraft,calculation:undefined,subtotal:undefined,vat:undefined,total:undefined});
  const positionTotals=positionDraft?calculateDraft({...draft,positions:draft.positions.map(l=>l.id===positionDraft.id?positionDraft:l),calculation:undefined,subtotal:undefined,vat:undefined,total:undefined}):totals;
  const openDiscount=(customer=false)=>{setDiscountDraft(customer?{kind:'percent',value:String(customerDiscount)}:draft.discount??{kind:'none'});setDiscountOrigin(customer?'customer':'manual');setDiscountOpen(true);};
  const closePosition=()=>{setMobilePositionId(null);setPositionDraft(null);};


  const sourceIds=draft.positions.flatMap(l=>l.timeAllocations?.map(a=>a.timeEntryId)??[]).sort().join(',');
  const capacity=useApiQuery<{items:Array<{id:string;remaining_minutes:number}>}>(sourceIds?'/api/time-entries/billing?'+new URLSearchParams({minuteAllocations:'1',ids:sourceIds,...(draft.id?{draft:draft.number}:{})}):null);
  const available=(item:LineItem)=>item.timeAllocations?.length===1?(capacity.loading||capacity.error?undefined:capacity.data?.items.find(t=>t.id===item.timeAllocations![0].timeEntryId)?.remaining_minutes??0):undefined;
  const quantityPatch=(item:LineItem,quantity:string):Partial<LineItem>=>({quantity,...(item.timeAllocations?.length===1?{availableMinutes:available(item),timeAllocations:[{...item.timeAllocations[0],minutes:Number(decimalInput(quantity))}]}:{})});
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

  if(names.length===0){
    return <div className="invoice-workspace"><section className="invoice-form"><EmptyState  title="Zuerst einen Kunden erfassen"  /><FormActions><Button href="/kunden/neu"><LocalizedText>{"Kunde erfassen"}</LocalizedText></Button></FormActions></section></div>;
  }

  return <div className="invoice-workspace">
    <section className={`invoice-form ${type==="Angebot"?"offer-form":""}`}>
      <div hidden={step!==undefined&&step!==0} className="form-section customer-form-section">
        <span className="compact-section-label"><LocalizedText>{"Kunde"}</LocalizedText></span>
        <Field label="Kunde auswählen"><DirectorySelect label="Kunde auswählen" disabled={lockedCustomer||draft.positions.some(item=>Boolean(item.timeAllocations?.length))} required endpoint={"/api/customers"} value={draft.customerId??''} onChange={(value,item)=>{if(item)onChange({...draft,customer:String(item.name??''),customerId:value,...(type==='Rechnung'?{due:documentDefaults(company.raw,{paymentDays:item.paymentDays==null?undefined:Number(item.paymentDays)},'Rechnung',draft.date).due}:{})})}}/></Field>
      </div>
      <div hidden={step!==undefined&&step!==0&&step!==2} className="form-section">
        <h2><LocalizedText>{step===2?(type==="Angebot"?"Gültig bis":"Zahlungsbedingungen"):"Dokumentdaten"}</LocalizedText></h2>
        <div className="form-grid document-meta-grid">
          {draft.id&&type==='Rechnung'&&<Field className="document-number-field" label="Rechnungsnummer"><Input value={draft.number} readOnly aria-readonly="true"/></Field>}
          <div hidden={step===2}><Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><Input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field></div>
          <div hidden={step===0}><Field label={type==="Rechnung" ? "Zahlungsfrist" : "Gültig bis"}>
            {type==="Rechnung" ? <Select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}>{!["10","30","45"].includes(draft.due)&&<option value={draft.due}>{draft.due}<LocalizedText>{" Tage"}</LocalizedText></option>}<option value="10"><LocalizedText>{"10 Tage"}</LocalizedText></option><option value="30"><LocalizedText>{"30 Tage"}</LocalizedText></option><option value="45"><LocalizedText>{"45 Tage"}</LocalizedText></option></Select> : <Input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field></div>
          <div hidden={step===0}><Field label="MwSt."><Select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value,positions:draft.positions.map(item=>item.priceBaseQuantity===60?item:({...item,vatRate:e.target.value,taxExempt:false}))})}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate.toLocaleString("de-CH")} %</option>)}</Select></Field></div>
        </div>
      </div>
      <div hidden={step!==undefined&&step!==1} className="form-section">
        <SectionTitle title="Positionen" action={<LocalizedElement as="button" className="icon-action" type="button" onClick={addPosition} aria-label="Position hinzufügen"><Icon name="plus" size={18}/></LocalizedElement>}/>
        {sourceIds&&capacity.error&&<ErrorState onRetry={capacity.refresh}><LocalizedText>{capacity.error}</LocalizedText></ErrorState>}
        <div className="line-items document-line-items">
          <div className="line-head"><span><LocalizedText>{"Beschreibung"}</LocalizedText></span><span><LocalizedText>{"Menge"}</LocalizedText></span><span><LocalizedText>{"Einheit"}</LocalizedText></span><span><LocalizedText>{"Einzelpreis"}</LocalizedText></span><span><LocalizedText>{"Total"}</LocalizedText></span><span/></div>
          {draft.positions.map((item,index)=>{
            const lineTotal=lineAmount(item,totals.calculation,index);
            return <div className="document-line-item" key={item.id}>
              <button className="mobile-position-summary" type="button" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}>
                <span><b>{positionNumber(index)} <LocalizedText verbatim={true}>{item.description}</LocalizedText></b><small>{item.quantity} <LocalizedText>{({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"}</LocalizedText><LocalizedText>{" × "}</LocalizedText><LocalizedText>{draft.currency??"CHF"}</LocalizedText> {money(numberValue(item.price))}{item.priceBaseQuantity===60&&<LocalizedText>{" / 60 min"}</LocalizedText>}</small></span>
                <strong><LocalizedText>{draft.currency??"CHF"}</LocalizedText> {money(lineTotal)}</strong><Icon name="arrow" size={16}/>
              </button>
              <label className="mobile-line-field description"><span><LocalizedText>{"Beschreibung"}</LocalizedText></span><b className="document-position-number">{positionNumber(index)}</b><Input aria-label="Beschreibung" value={item.description} onChange={e=>updatePosition(item.id,{description:e.target.value})}/></label>
              <label className="mobile-line-field"><span><LocalizedText>{item.priceBaseQuantity===60?"Minuten":"Menge"}</LocalizedText>{item.timeAllocations?.length===1&&<> · <LocalizedText>{"Verfügbar"}</LocalizedText>: {available(item)??'—'}</>}</span><Input aria-label="Menge" readOnly={Boolean(item.timeAllocations?.length&&(item.timeAllocations.length>1||capacity.loading||capacity.error))} inputMode={item.priceBaseQuantity===60?"numeric":"decimal"} value={item.quantity} onChange={e=>updatePosition(item.id,quantityPatch(item,e.target.value))}/></label>
              <label className="mobile-line-field"><span><LocalizedText>{"Einheit"}</LocalizedText></span><Select disabled={item.priceBaseQuantity===60} aria-label="Einheit" value={item.unit??"Stück"} onChange={e=>updatePosition(item.id,{unit:e.target.value})}>{documentUnitOptions(item.unit).map(unit=><option key={unit} value={unit}><LocalizedText>{unit}</LocalizedText></option>)}</Select></label>
              <label className="mobile-line-field"><span><LocalizedText>{"Einzelpreis"}</LocalizedText></span><Input aria-label="Einzelpreis" readOnly={item.priceBaseQuantity===60} inputMode="decimal" value={item.price} onChange={e=>updatePosition(item.id,{price:e.target.value})}/>{item.priceBaseQuantity===60&&<small><LocalizedText>{" / 60 min"}</LocalizedText></small>}</label>
              <div className="mobile-line-total"><span><LocalizedText>{"Total"}</LocalizedText></span><b>{money(lineTotal)}</b></div>
              <div className="document-line-actions"><ActionsMenu label={'Position '+positionNumber(index)}><ActionRow title="Bearbeiten" icon="edit" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}/><ActionRow title="Rabatt" icon="edit" onClick={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}}/><ActionRow title="Duplizieren" icon="copy" disabled={!canDuplicateDocumentLine(item)} onClick={()=>onChange({...draft,positions:duplicateDocumentLine(draft.positions,item.id,crypto.randomUUID())})}/><ActionRow title="Nach oben" icon="arrow" disabled={index===0} onClick={()=>onChange({...draft,positions:moveDocumentLine(draft.positions,item.id,-1)})}/><ActionRow title="Nach unten" icon="arrow" disabled={index===draft.positions.length-1} onClick={()=>onChange({...draft,positions:moveDocumentLine(draft.positions,item.id,1)})}/><ActionRow title="Entfernen" icon="trash" disabled={draft.positions.length===1} onClick={()=>removePosition(item.id)}/></ActionsMenu></div>
            </div>;
          })}
        </div>
        <div className="document-discount-actions">{!draft.id&&!draft.sourceOffer&&draft.discount===undefined&&customerDiscount>0&&<p><LocalizedText>{"Kundenrabatt vorgeschlagen"}</LocalizedText>: {customerDiscount} %</p>}<ActionsMenu label="Rabattoptionen"><ActionRow title="Gesamtrabatt" icon="edit" onClick={()=>openDiscount()}/>{!draft.id&&!draft.sourceOffer&&customerDiscount>0&&<ActionRow title="Kundenrabatt übernehmen" icon="check" onClick={()=>openDiscount(true)}/>}</ActionsMenu></div><DocumentTotals draft={draft} totals={totals}/>
      </div>
      {mobilePositionId&&(()=>{const item=positionDraft;if(!item)return null;return <FormSheet label={"Position bearbeiten"} description={item.description} open={true} onClose={closePosition} busy={false} className={"mobile-position-sheet"} layerClassName={"mobile-position-layer"} ariaLabel={"Position bearbeiten"}><div className="sheet-body mobile-position-fields">{item.timeAllocations?.length===1&&<p><LocalizedText>{"Verfügbare Minuten"}</LocalizedText>: {available(item)??'—'}</p>}<Field label="Beschreibung"><Input value={item.description} onChange={e=>setPositionDraft({...item,description:e.target.value})}/></Field><div><Field label={item.priceBaseQuantity===60?"Minuten":"Menge"}><Input readOnly={Boolean(item.timeAllocations?.length&&(item.timeAllocations.length>1||capacity.loading||capacity.error))} inputMode={item.priceBaseQuantity===60?"numeric":"decimal"} value={item.quantity} onChange={e=>setPositionDraft({...item,...quantityPatch(item,e.target.value)})}/></Field><Field label="Einheit"><Select disabled={item.priceBaseQuantity===60} value={item.unit??"Stück"} onChange={e=>setPositionDraft({...item,unit:e.target.value})}>{documentUnitOptions(item.unit).map(unit=><option key={unit} value={unit}><LocalizedText>{unit}</LocalizedText></option>)}</Select></Field><Field label="Einzelpreis"><Input readOnly={item.priceBaseQuantity===60} inputMode="decimal" value={item.price} onChange={e=>setPositionDraft({...item,price:e.target.value})}/>{item.priceBaseQuantity===60&&<small><LocalizedText>{" / 60 min"}</LocalizedText></small>}</Field></div><DiscountFields value={item.discount??{kind:'none'}} currency={draft.currency??'CHF'} label="Positionsrabatt" onChange={discount=>setPositionDraft({...item,discount})}/><Field label="MwSt."><Select value={item.vatRate??draft.vatRate} disabled={item.taxExempt||item.priceBaseQuantity===60} onChange={e=>setPositionDraft({...item,vatRate:e.target.value})}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate} %</option>)}</Select></Field><Field label="Steuerbefreit"><Input type="checkbox" disabled={item.priceBaseQuantity===60} checked={item.taxExempt??false} onChange={e=>setPositionDraft({...item,taxExempt:e.target.checked,...(e.target.checked?{vatRate:'0'}:{})})}/></Field>{positionTotals.error&&<ErrorState><LocalizedText>{positionTotals.error}</LocalizedText></ErrorState>}<div className="mobile-position-sheet-total"><span><LocalizedText>{"Total"}</LocalizedText></span><b><LocalizedText>{draft.currency??"CHF"}</LocalizedText> {money(lineAmount(item,positionTotals.calculation,draft.positions.findIndex(l=>l.id===item.id)))}</b></div><button className="text-action mobile-position-remove" type="button" disabled={draft.positions.length===1} onClick={()=>{removePosition(item.id);closePosition()}}><LocalizedText>{"Position entfernen"}</LocalizedText></button></div><FormActions sheet><Button variant="secondary" onClick={closePosition}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={Boolean(positionTotals.error)} onClick={()=>{updatePosition(item.id,item);closePosition()}}><LocalizedText>{"Übernehmen"}</LocalizedText></Button></FormActions></FormSheet>})()}
      <FormSheet label="Gesamtrabatt" open={discountOpen} onClose={()=>setDiscountOpen(false)} layerClassName="mobile-position-layer"><div className="sheet-body"><DiscountFields value={discountDraft} currency={draft.currency??'CHF'} label="Rabattart" onChange={value=>{setDiscountDraft(value);setDiscountOrigin('manual')}}/>{discountTotals.error?<ErrorState><LocalizedText>{discountTotals.error}</LocalizedText></ErrorState>:<DocumentTotals draft={draft} totals={discountTotals}/>}</div><FormActions sheet><Button variant="secondary" onClick={()=>setDiscountOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={Boolean(discountTotals.error)} onClick={()=>{onChange({...draft,discount:discountDraft,discountOrigin:discountDraft.kind==='none'?'removed':discountOrigin});setDiscountOpen(false)}}><LocalizedText>{"Übernehmen"}</LocalizedText></Button></FormActions></FormSheet>
      <div hidden={step!==undefined&&step!==2} className="form-section optional-row document-note-section">{!noteOpen?<button className="text-action add-note-action" type="button" onClick={()=>setNoteOpen(true)}><Icon name="plus" size={16}/><LocalizedText>{" Notiz hinzufügen"}</LocalizedText></button>:<><SectionTitle title="Notiz" action={!draft.note&&<button className="text-action" type="button" onClick={()=>setNoteOpen(false)}><LocalizedText>{"Schliessen"}</LocalizedText></button>}/><Field label="Text für den Kunden"><Textarea autoFocus value={draft.note} onChange={e=>onChange({...draft,note:e.target.value})} placeholder="Optional"/></Field></>}</div>
    </section>
  </div>;
}

const EMPTY_COMPANY:Record<string,unknown>={};
function useDocumentCompany(){

 const query=useApiQuery<{item:Record<string,unknown>}>('/api/settings/company');
 const company=query.data?.item??EMPTY_COMPANY;
 const loading=query.loading,error=query.error;
 return {loading,error,refresh:query.refresh,raw:company,name:String(company.legal_name||company.name||''),street:[company.street,company.building_number].filter(Boolean).join(' '),city:[company.postal_code,company.city].filter(Boolean).join(' '),iban:String(company.iban||company.qr_iban||''),logo:String(company.logo_url||''),footer:[company.legal_name||company.name,company.vat_number||company.uid,company.email,company.phone,company.website].filter(Boolean).join(' · ')};
}
