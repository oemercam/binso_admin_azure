"use client";
import {formatTimestampDate} from '@/lib/display-format';
import {BillingTermsEditor,billingModelLabels} from './billing-terms-editor';
import {billingTermsKey,type BillingTerms,type BillingRateOption} from '@/lib/billing-model';
import {domainConfig} from "@/config/domain";
import {documentDefaults,invoiceDraftFromOffer} from "@/lib/document-defaults";
import {LocalizedText,LocalizedElement,useLocale,useTranslation} from "@/lib/client/locale";
import {localeTags} from "@/lib/locales/config";
import type {InvoiceReadiness} from "@/lib/action-readiness";
import {safeAppPath} from "@/lib/navigation";
import {OfferHistory} from "./offer-history";
import {OfferFollowup} from "./offer-followup";
import {deliveryLabel} from "@/lib/offer-activity";
import {EntityFiles,type EntityFilesHandle} from "./entity-files";
import {setupDestination} from "@/lib/action-readiness";
import {DocumentPositionRow} from "./document-position-row";
import ConfirmDialog from "./confirm-dialog";
import {DirectorySelect} from "./directory-select";
import {customerDirectory,resolveCustomer,type CustomerDirectory} from "@/lib/customer-identity";
import {calculateDocument,calculateBillingDocument,allocateAdvance,applyAdvanceApplications,consolidateCalculations,type DocumentCalculation,type AdvanceApplication,type AdvanceTaxAmount,type Discount} from "@/lib/money";
import {isMinuteDocumentLine,documentUnitOptions,positionNumber,moveDocumentLine,reorderDocumentLine,duplicateDocumentLine,canDuplicateDocumentLine} from '@/lib/document-lines';
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import {FormWizard} from "./form-wizard";
import {allowDraftNavigation} from "./use-browser-back-guard";
import {useProcessDraft} from "./use-process-draft";
import {businessDate,financialStatus,financialStatusTone,financialStatusText,invoiceStatusAxes,openAmount,customerCredit} from "@/lib/financial-status";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {tenantCan} from "@/lib/permissions";
import { invoicePaymentRequirements } from "@/lib/qr-bill";
import { useRouter, useSearchParams } from "next/navigation";

import { AppShell } from "./app-shell";
import { ActionRow, ActionSheet, ActionsMenu, FormSheet,DetailDisclosure,MetricTiles,MetricTile } from "./binso-ux";
import {DocumentModal} from "./pdf-preview";
export {DocumentModal} from "./pdf-preview";
import {Button, EmptyState, Field, Icon, IconButton, Toast, FormActions, Input, Select, Textarea, ErrorState, LoadingState, SectionTitle, Status} from "./ui";
import {apiReadPost, apiGet, apiPatch, apiPost, apiDelete, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";

type DocumentKind = "Rechnung" | "Angebot";

type LineItem = {
  billingAgreementId?:string;
  billingPart?:'fixed'|'time'|'quantity';billingSourcePosition?:number;
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
  priceBaseQuantity?:number;
  timeAllocations?:Array<{timeEntryId:string;minutes:number;priceSourceId:string}>;
  availableMinutes?:number;
};

type DocumentDraft = {
  billingAgreementOwned?:boolean;advanceReversals?:Array<{number:string;amount:string;reversedAt:string}>;
  advanceApplications?:Array<AdvanceApplication&{sourceCalculation?:DocumentCalculation;priorAllocations?:AdvanceTaxAmount[][]}>;
  billingScopes?:Array<{agreementId:string;projectId?:string;label?:string;conditions?:string;terms?:BillingTerms;templatePositions?:LineItem[];context:{procedure:string;period?:number|string;milestoneId?:string};discount?:Discount}>;
  billingTemplatePositions?:LineItem[];billingCompletedMilestones?:string[];billingRateOptions?:BillingRateOption[];sourceProject?:string;billingTerms?:BillingTerms;billingContext?:{procedure:string;period?:number|string;milestoneId?:string};billingAgreementId?:string;
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

function money(value:number,locale='de-CH') {
  return new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
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
    billingAgreementId:kind==='Rechnung'&&!draft.billingScopes?.length?draft.billingAgreementId:undefined,advanceApplications:draft.advanceApplications?.map(({advanceInvoiceId,agreementId,amount})=>({advanceInvoiceId,agreementId,amount})),billingScopes:draft.billingScopes?.map(({agreementId,projectId,context,discount})=>({agreementId,projectId,context,discount})),sourceProject:draft.sourceProject,billingTerms:draft.billingTerms,billingContext:draft.billingContext,
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
    items:draft.positions.map(item=>({billingAgreementId:draft.billingScopes?.length?item.billingAgreementId:undefined,billingPart:item.billingPart,billingSourcePosition:item.billingSourcePosition,discount:cleanDiscount(item.discount,draft.currency??'CHF'),taxExempt:item.taxExempt??false,unit:item.unit??"Stück",description:item.description,quantity:numberValue(item.quantity),unitPrice:numberValue(item.price),vatRate:numberValue(item.vatRate??draft.vatRate),expenseIds:item.expenseIds??[],timeEntryIds:item.timeEntryIds??[],priceBaseQuantity:item.priceBaseQuantity??1,timeAllocations:item.timeAllocations??[]})),
  };
}

function documentPreviewPayload(kind:DocumentKind,draft:DocumentDraft,sourceNumber?:string){return {...draft,billingScopes:draft.billingScopes?.map(({agreementId,projectId,context,discount})=>({agreementId,projectId,context,discount})),advanceApplications:draft.advanceApplications?.map(({advanceInvoiceId,agreementId,amount})=>({advanceInvoiceId,agreementId,amount})),kind,sourceNumber,discount:cleanDiscount(draft.discount,draft.currency??'CHF'),positions:draft.positions.map(item=>({...item,quantity:decimalInput(item.quantity),price:decimalInput(item.price),vatRate:decimalInput(item.vatRate??draft.vatRate),discount:cleanDiscount(item.discount,draft.currency??'CHF')}))};}
function useDocumentDraft(initial:DocumentDraft) {
  return useState(initial);
}

function decimalInput(value:string){return value.replace(/['’\s]/g,'').replace(',','.');}
function cleanDiscount(value:Discount|undefined,currency:string):Discount{if(!value||value.kind==='none')return {kind:'none'};return value.kind==='percent'?{kind:'percent',value:decimalInput(value.value)}:{kind:'fixed',value:decimalInput(value.value),currency:value.currency||currency};}
function calculateDraft(draft:DocumentDraft){
 if(draft.total!==undefined&&!draft.calculation)return {subtotal:draft.subtotal??0,vat:draft.vat??0,total:draft.total,calculation:undefined,error:null as string|null};
 let sourceInvalid=false;
 try{
  for(const item of draft.positions)if(item.timeAllocations?.length){const quantity=Number(decimalInput(item.quantity));if(!Number.isInteger(quantity)||quantity<1||quantity!==item.timeAllocations.reduce((n,a)=>n+a.minutes,0)||quantity>(item.availableMinutes??144000)){sourceInvalid=true;throw new RangeError('Bitte gültige ganze Minuten innerhalb der verfügbaren Restmenge erfassen.');}}
  let calculation=draft.total!==undefined&&draft.calculation?draft.calculation:calculateBillingDocument(draft.positions.map(item=>({billing_source_position:item.billingSourcePosition,billing_agreement_id:item.billingAgreementId,quantity:decimalInput(item.quantity),price_base_quantity:item.priceBaseQuantity??1,unit_price:decimalInput(item.price),vat_rate:decimalInput(item.vatRate??draft.vatRate),discount:cleanDiscount(item.discount,draft.currency??'CHF'),tax_exempt:item.taxExempt??false})),draft.currency??'CHF',cleanDiscount(draft.discount,draft.currency??'CHF'),draft.billingScopes);
  if(draft.total===undefined&&draft.advanceApplications?.length){const applications=draft.advanceApplications.map(a=>({...a,taxGroups:a.sourceCalculation?allocateAdvance(a.sourceCalculation,a.amount,a.priorAllocations):a.taxGroups}));if('billingScopes' in calculation){calculation=consolidateCalculations((calculation.billingScopes as ReturnType<typeof consolidateCalculations>['billingScopes']).map(scope=>({id:scope.agreementId,positions:scope.positions,calculation:applyAdvanceApplications(scope.calculation,applications.filter(a=>a.agreementId===scope.agreementId))})),draft.currency??'CHF');}else calculation=applyAdvanceApplications(calculation,applications);}
  return {subtotal:draft.subtotal??Number(calculation.subtotal),vat:draft.vat??Number(calculation.vat),total:draft.total??Number(calculation.total),calculation,error:null as string|null};
 }catch(error){return {subtotal:0,vat:0,total:0,calculation:undefined,sourceInvalid,error:error instanceof Error?error.message:'Ungültige Berechnung.'};}
}
type DocumentTotalsResult={subtotal:number;vat:number;total:number;calculation?:ReturnType<typeof calculateDocument>;error:string|null;sourceInvalid?:boolean;pending?:boolean;refresh?:()=>void};
const DocumentTotalsContext=createContext<DocumentTotalsResult|null>(null);
function useDocumentTotals(draft:DocumentDraft){const inherited=useContext(DocumentTotalsContext);const local=useMemo(()=>calculateDraft(draft),[draft]);return inherited??local;}
function useAuthoritativeDocumentTotals(kind:DocumentKind,draft:DocumentDraft):DocumentTotalsResult{
 const local=useMemo(()=>calculateDraft(draft),[draft]),identity=useDataRevision(['/api/documents','/api/time-entries','/api/projects']);
 const needsServer=!('sourceInvalid' in local&&local.sourceInvalid)&&kind==='Rechnung'&&draft.total===undefined&&Boolean(draft.customerId&&draft.date&&(draft.billingAgreementId||draft.billingScopes?.length||draft.advanceApplications?.length));
 const body=needsServer?JSON.stringify({...documentPreviewPayload(kind,draft,draft.id?draft.number:undefined),output:'calculation'}):'',key=identity+'|'+body;
 const [attempt,setAttempt]=useState(0),[remote,setRemote]=useState<{key:string;calculation?:ReturnType<typeof calculateDocument>;error?:string}>({key:''});
 useEffect(()=>{
  if(!body)return;
  let active=true;const controller=new AbortController();let timeout:ReturnType<typeof setTimeout>|undefined;
  const timer=setTimeout(()=>{timeout=setTimeout(()=>controller.abort(),15000);void apiReadPost<{calculation:ReturnType<typeof calculateDocument>}>('/api/documents/preview',JSON.parse(body),controller.signal).then(({calculation})=>{
   if(!calculation||calculation.revision!==1||calculation.currency!==(JSON.parse(body).currency??'CHF')||!Array.isArray(calculation.lines)||calculation.lines.length!==JSON.parse(body).positions.length)throw new Error('Die Berechnung konnte nicht bestätigt werden.');
   if(active)setRemote({key,calculation});
  }).catch(error=>{if(active)setRemote({key,error:error instanceof Error?error.message:'Die Berechnung konnte nicht bestätigt werden.'});}).finally(()=>clearTimeout(timeout));},180);
  return()=>{active=false;clearTimeout(timer);clearTimeout(timeout);controller.abort();};
 },[body,key,attempt]);
 if(!needsServer)return local;
 const current=remote.key===key;
 if(!current)return {...local,error:null,pending:true};
 if(remote.error)return {...local,error:remote.error,pending:false,refresh:()=>{setRemote({key:''});setAttempt(n=>n+1);}};
 const c=remote.calculation!;return {subtotal:Number(c.subtotal),vat:Number(c.vat),total:Number(c.total),calculation:c,error:null,pending:false};
}
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
    advanceApplications:(item.calculation as {advanceApplications?:AdvanceApplication[]}|null)?.advanceApplications,billingScopes:Array.isArray(item.billing_scopes)&&item.billing_scopes.length?item.billing_scopes as DocumentDraft['billingScopes']:undefined,billingCompletedMilestones:Array.isArray(item.billing_completed_milestones)?item.billing_completed_milestones.map(String):[],sourceProject:kind==='Rechnung'?String(item.project_id??''):undefined,billingTerms:item.billing_terms as BillingTerms|undefined,advanceReversals:Array.isArray(item.advance_reversals)?item.advance_reversals as DocumentDraft['advanceReversals']:undefined,billingAgreementOwned:item.billing_agreement_owned===true,billingAgreementId:String(item.billing_agreement_id??''),billingContext:item.billing_context?{...(item.billing_context as {procedure:string}),...((item.billing_context as {period?:string}).period!==undefined?{period:Number((item.billing_context as {period?:string}).period)}:{})}:undefined,
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
    subtotal:item.subtotal==null?undefined:Number(item.subtotal),
    vat:item.vat_amount==null?undefined:Number(item.vat_amount),
    total:item.total==null?undefined:Number(item.total),
    number:String(item.number??""),
    date:issueDate,
    due,
    vatRate:String(item.vat_rate??"8.1"),
    note:String(item.note??""),
    positions:rawItems.sort((a,b)=>Number(a.position??0)-Number(b.position??0)).map((line,index)=>({
      id:String(line.id??("line-"+(index+1))),billingPart:line.billing_part as LineItem['billingPart'],billingSourcePosition:line.billing_source_position?Number(line.billing_source_position):kind==='Angebot'?Number(line.position??index+1):undefined,
      discount:line.discount as Discount??{kind:'none'},
      taxExempt:line.tax_exempt===true,
      lineTotal:String(line.line_total??0),
      description:String(line.description??""),
      quantity:String(line.quantity??"1"),
      price:String(line.unit_price??"0.00"),
      unit:String(line.unit??"Stück"),
      expenseIds:Array.isArray(line.expense_ids)?line.expense_ids.map(String):[],
      timeEntryIds:Array.isArray(line.time_entry_ids)?line.time_entry_ids.map(String):[],
      billingAgreementId:line.billing_agreement_id?String(line.billing_agreement_id):undefined,priceBaseQuantity:Number(line.price_base_quantity??1),
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

function editableDocumentSnapshot(draft:DocumentDraft){const value:Record<string,unknown>={...draft};if(draft.billingTerms)value.billingTerms=billingTermsKey(draft.billingTerms);delete value.subtotal;delete value.vat;delete value.total;delete value.calculation;return JSON.stringify(value);}

export function OfferEditor({ existing = false, documentKey }: { existing?: boolean; documentKey?: string }) {
  return <DocumentPage kind="Angebot" existing={existing} documentKey={documentKey}/>;
}

export function InvoiceEditor({ existing = false, documentKey }: { existing?: boolean; documentKey?: string }) {
  return <DocumentPage kind="Rechnung" existing={existing} documentKey={documentKey}/>;
}

function DocumentPage({kind,existing=false,documentKey}:{kind:DocumentKind;existing?:boolean;documentKey?:string}){
  const translate=useTranslation();
  const router=useRouter();
  const searchParams=useSearchParams();
  const plural=kind==="Angebot"?"angebote":"rechnungen";
  const returnTo=safeAppPath(searchParams.get("returnTo"),"/"+plural);

  const attachmentUpload=useRef<EntityFilesHandle>(null);
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
  const [confirmCloseEditor,setConfirmCloseEditor]=useState(false);
  const draftBaseline=useRef<string|null>(null);
  const [draft,setDraft]=useDocumentDraft(createInitialDraft(kind));
  const refundableAmount=customerCredit({total:draft.total,paid_amount:draft.paidAmount,credit_amount:draft.creditAmount,refund_amount:draft.refundAmount});
  const {directory,loading:customersLoading,error:customersError,refresh:refreshCustomers}=useCustomerDirectory(editing||sendOpen,draft.customerId??searchParams.get("customerId")??undefined);
  useEffect(()=>{if(!sendOpen||recipientTouched.current)return;const email=resolveCustomer(draft,directory)?.email;if(email){recipientTouched.current=true;queueMicrotask(()=>setRecipient(email));}},[sendOpen,draft,directory]);
  const company=useDocumentCompany();
  useEffect(()=>{if(existing||dirty||company.loading||searchParams.get("sourceOffer"))return;setDraft(current=>({...current,...documentDefaults(company.raw,resolveCustomer(current,directory),kind,current.date||businessDate()),...((current.sourceProject||current.billingAgreementId||current.billingScopes?.length)&&current.note?{note:current.note}:{})}));},[existing,dirty,company.loading,company.raw,draft.customerId,directory,kind,setDraft,searchParams]);
  const companyPending=editing&&company.loading;
  const paymentRequirement=kind==="Rechnung"&&!company.loading&&!company.error?invoicePaymentRequirements(company.raw)[0]:undefined;
  const paymentIssue=paymentRequirement?.message??null;
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
  const sourceProject=kind==='Rechnung'?searchParams.get('sourceProject'):null;
  const sourceAgreement=kind==='Rechnung'?searchParams.get('billingAgreementId'):null;
  const agreementSource=useApiQuery<{item:{id:string;terms:BillingTerms;customer_id:string;billing_completed_milestones?:string[];commercial_snapshot?:{note?:string;items?:Record<string,unknown>[];calculation?:Record<string,unknown>}}}>(!existing&&sourceAgreement?'/api/documents/billing-agreements/'+encodeURIComponent(sourceAgreement):null);
  const initializedAgreement=useRef<string|null>(null);
  useEffect(()=>{const agreement=agreementSource.data?.item;if(existing||!sourceAgreement||!agreement||initializedAgreement.current===sourceAgreement)return;initializedAgreement.current=sourceAgreement;const terms=agreement.terms;queueMicrotask(()=>setDraft(current=>{const snapshot=agreement.commercial_snapshot;const source=remoteDraftFromItem({currency:terms.currency,items:snapshot?.items?.map((p,n)=>({...p,billing_source_position:n+1}))??[{description:'Neue Position',quantity:1,unit_price:'amount' in terms?terms.amount??0:'hourlyRate' in terms?terms.hourlyRate??0:0,unit:terms.model==='time'?'Stunden':'Stück',vat_rate:current.vatRate,billing_part:terms.model==='time'?'time':terms.model==='quantity'?'quantity':'fixed'}],calculation:snapshot?.calculation},'Angebot');return {...current,customerId:agreement.customer_id,billingAgreementId:agreement.id,billingTerms:terms,billingCompletedMilestones:agreement.billing_completed_milestones,billingTemplatePositions:source.positions,currency:terms.currency,billingContext:{procedure:searchParams.get('procedure')==='final'?'final':'partial',...(terms.model==='recurring'?{period:Number(searchParams.get('period')??0)}:{})},positions:source.positions,note:snapshot?.note??current.note,discount:source.discount,calculation:undefined,subtotal:undefined,vat:undefined,total:undefined};}));},[existing,sourceAgreement,agreementSource.data,setDraft,searchParams]);

  const projectSource=useApiQuery<{item:Record<string,unknown>}>(!existing&&sourceProject?'/api/projects/'+encodeURIComponent(sourceProject):null);
  const initializedProject=useRef<string|null>(null);
  useEffect(()=>{if(existing||sourceOffer||!sourceProject||!projectSource.data?.item||company.loading||customersLoading||initializedProject.current===sourceProject)return;const item=projectSource.data.item;initializedProject.current=sourceProject;queueMicrotask(()=>setDraft(current=>{const terms=item.billing_terms as BillingTerms|undefined;const snapshot=item.billing_snapshot as {note?:string;items?:Record<string,unknown>[];calculation?:Record<string,unknown>}|undefined;const positions=snapshot?.items?.map((line,index)=>({...line,position:index+1,billing_source_position:index+1}));const source=remoteDraftFromItem({customer_id:item.customer_id,customer:{name:item.customer_name},currency:terms?.currency??current.currency,number:item.source_offer??'',issue_date:current.date,note:snapshot?.note??'',calculation:snapshot?.calculation,items:positions??[{description:item.name,quantity:1,unit:terms?.model==='time'?'Stunden':'Stück',unit_price:terms&&'amount' in terms?terms.amount??'0':terms&&'hourlyRate' in terms?terms.hourlyRate??'0':'0',vat_rate:current.vatRate}],billing_terms:terms,billing_completed_milestones:item.billing_completed_milestones},'Angebot');return {...invoiceDraftFromOffer(source,current,company.raw,resolveCustomer(source,directory)),billingTemplatePositions:snapshot?.items?source.positions:undefined,billingAgreementId:String(item.billing_agreement_id??''),sourceProject,sourceOffer:String(item.source_offer??''),billingContext:{procedure:'standard',...(terms?.model==='recurring'?{period:0}:{})}}}));},[existing,sourceOffer,sourceProject,projectSource.data,company.loading,company.raw,customersLoading,directory,setDraft]);
  const sourceTimeEntriesParam=kind==="Rechnung"?(searchParams.get("timeEntries")??""):"";

  const sourceQuery=useApiQuery<{item?:Record<string,unknown>;items?:Array<Record<string,unknown>>}>(!existing&&sourceOffer?("/api/documents/"+encodeURIComponent(sourceOffer)):null);
  const sourceItem=sourceQuery.data?.item??sourceQuery.data?.items?.[0];
  const sourceCustomer=useApiQuery<{item?:Parameters<typeof customerDirectory>[0][number]}>(sourceItem?.customer_id&&sourceOffer?"/api/customers/"+encodeURIComponent(String(sourceItem.customer_id)):null);
  const sourceLoading=agreementSource.loading||sourceQuery.loading||sourceCustomer.loading||projectSource.loading;
  const sourceInvalid=!existing&&sourceOffer&&!sourceLoading&&!sourceQuery.error&&(!sourceItem||sourceItem.kind!=="offer"||sourceItem.status!=="accepted"||Boolean(sourceItem.invoice_number)&&!sourceItem.billing_agreement_id);
  const sourceError=agreementSource.error||projectSource.error||sourceQuery.error||sourceCustomer.error||(sourceInvalid?"Das Ursprungsangebot muss angenommen und noch nicht verrechnet sein.":null);
  const initializedOffer=useRef<string|null>(null);
  useEffect(()=>{
    if(existing||!sourceOffer||!sourceItem||sourceError||company.loading||customersLoading||sourceCustomer.loading||sourceCustomer.error||initializedOffer.current===sourceOffer)return;
    initializedOffer.current=sourceOffer;
    const source=remoteDraftFromItem(sourceItem,"Angebot");
    queueMicrotask(()=>setDraft(current=>({...invoiceDraftFromOffer(source,current,company.raw,sourceCustomer.data?.item??resolveCustomer(source,directory)),billingTemplatePositions:source.positions,billingContext:{procedure:searchParams.get("procedure")==="partial"?"partial":"standard",...(source.billingTerms?.model==="recurring"?{period:0}:{})}})));
  },[existing,sourceOffer,sourceItem,sourceError,company.loading,company.raw,customersLoading,sourceCustomer.loading,sourceCustomer.error,sourceCustomer.data,directory,setDraft,searchParams]);

  const sourceExpenseParam=kind==='Rechnung'?(searchParams.get('expenses')??''):'';
  const recovery=useProcessDraft({process:kind+":"+searchParams.toString(),value:{draft,step:wizardStep,replay:draftReplay},dirty,enabled:!existing&&!customersLoading&&!customersError&&!sourceLoading&&!sourceError&&!sourceTimeEntriesParam&&!sourceExpenseParam,onRestore:stored=>{
    if(!stored?.draft||!Array.isArray(stored.draft.positions)||!stored.draft.positions.length||stored.draft.id||stored.draft.number||['customer','number','date','due','vatRate','note'].some(key=>typeof (stored.draft as unknown as Record<string,unknown>)[key]!=='string')||stored.draft.positions.some(item=>!item||['id','description','quantity','price'].some(key=>typeof (item as unknown as Record<string,unknown>)[key]!=='string'))||stored.replay&&(typeof stored.replay.body!=='string'||typeof stored.replay.key!=='string'))return;
    draftBaseline.current=editableDocumentSnapshot(draft);setDraft(stored.draft);setWizardStep(Math.max(0,Math.min(3,Number(stored.step)||0)));createRequest.current=stored.replay??null;setDraftReplay(stored.replay??null);setDirty(true);
  }});
  const timeSource=useApiQuery<{items:Array<{id:string;hours:number;description?:string;sales_rate:number;billing_agreement_id?:string;billing_terms?:BillingTerms;project_id?:string;billing_rate_options?:BillingRateOption[];billing_source_position?:number;billing_discount?:Discount;billing_document_discount?:Discount;billing_conditions?:string;customer_id:string;customer_name:string;project_name:string;external_resource_id?:string;remaining_minutes?:number;price_source_id?:string;price_base_quantity?:number;price_currency?:string;vat_rate?:string;tax_treatment?:string}>}>(kind==='Rechnung'&&sourceTimeEntriesParam&&true?'/api/time-entries/billing?minuteAllocations=1&ids='+encodeURIComponent(sourceTimeEntriesParam):null);
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
      const currency=existing?draft.currency:expenses[0]?.currency??times.find(t=>t.price_currency)?.price_currency??draft.currency??'CHF';
      if(times.some(t=>(t.price_currency??'CHF')!==currency)||expenses.some(e=>e.currency!==currency))throw new Error('Leistungspreis und Rechnungswährung müssen übereinstimmen. Es erfolgt keine automatische Umrechnung.');
      const groups=Object.values(times.filter(t=>!t.external_resource_id).reduce<Record<string,typeof times>>((all,item)=>{(all[JSON.stringify([item.project_name,Number(item.sales_rate),item.billing_agreement_id,item.billing_source_position,item.vat_rate,item.billing_rate_options&&item.billing_rate_options.length>1&&!item.billing_source_position?item.id:undefined])]??=[]).push(item);return all},{}));
      const positions:LineItem[]=[...groups.map((items,index)=>({id:"time-"+index,billingAgreementId:items[0].billing_agreement_id,billingPart:'time' as const,discount:items[0].billing_discount,billingSourcePosition:items[0].billing_source_position,vatRate:items[0].vat_rate,taxExempt:items[0].tax_treatment==='exempt',description:items[0].project_name,quantity:items.reduce((sum,item)=>sum+Number(item.hours),0).toFixed(2),unit:"Stunden",price:String(items[0].sales_rate||0),timeEntryIds:items.map(item=>item.id) })),...times.filter(t=>t.external_resource_id).map(t=>({id:'minute-'+t.id,billingAgreementId:t.billing_agreement_id,billingPart:'time' as const,description:t.project_name+(t.description?' · '+t.description:''),quantity:String(t.remaining_minutes),unit:'min',price:String(t.sales_rate),vatRate:String(t.vat_rate??0),taxExempt:t.tax_treatment!=='taxable',priceBaseQuantity:Number(t.price_base_quantity??60),availableMinutes:t.remaining_minutes,timeAllocations:[{timeEntryId:t.id,minutes:Number(t.remaining_minutes),priceSourceId:t.price_source_id!}]})),...expenses.map(i=>({id:'expense-'+i.id,description:i.description,quantity:String(i.quantity),price:String(i.unit_price),unit:'Stück',vatRate:String(i.vat_rate),expenseIds:[i.id]}))];
      const agreementIds=[...new Set([...times.map(t=>t.billing_agreement_id).filter(Boolean),...(existing?[currentAgreement(draft)]:[])].filter(Boolean))] as string[];
      const consolidated=agreementIds.length>1||Boolean(draft.billingScopes?.length);
      if(consolidated&&positions.some(p=>!p.billingAgreementId))throw new Error('Jede Position benötigt eine Preisvereinbarung.');
      const billingScopes=consolidated?agreementIds.map(agreementId=>draft.billingScopes?.find(s=>s.agreementId===agreementId)??{agreementId,projectId:times.find(t=>t.billing_agreement_id===agreementId)?.project_id,label:times.find(t=>t.billing_agreement_id===agreementId)?.project_name,conditions:times.find(t=>t.billing_agreement_id===agreementId)?.billing_conditions,terms:times.find(t=>t.billing_agreement_id===agreementId)?.billing_terms,context:{procedure:'partial'},discount:times.find(t=>t.billing_agreement_id===agreementId)?.billing_document_discount??(agreementId===draft.billingAgreementId?draft.discount:undefined)}):undefined;
      draftBaseline.current??=editableDocumentSnapshot(draft);
      setDraft(current=>({...current,billingScopes,billingTerms:consolidated?undefined:current.billingTerms??times.find(t=>t.billing_terms)?.billing_terms,billingAgreementId:consolidated?undefined:current.billingAgreementId??times.find(t=>t.billing_agreement_id)?.billing_agreement_id,billingRateOptions:times.find(t=>t.billing_rate_options?.length)?.billing_rate_options,sourceProject:consolidated?undefined:current.sourceProject,billingContext:consolidated?undefined:current.billingContext,discount:consolidated?{kind:'none'}:existing?current.discount:times.find(t=>t.billing_document_discount)?.billing_document_discount??current.discount,customer:sources[0].customer_name,customerId:customer,currency:currency??current.currency,positions:existing?[...current.positions.filter(item=>!((current.billingTerms?.model==='time'||item.billingPart==='time')&&!item.timeEntryIds?.length&&!item.timeAllocations?.length)),...positions].map(p=>({...p,billingAgreementId:p.billingAgreementId??current.billingAgreementId})):positions,subtotal:undefined,vat:undefined,total:undefined}));setDirty(true);setEditing(true);setBillingSourceError(null);
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
    const totals=calculationTotals;if(totals.pending)return;if(totals.error){show(totals.error);return;}
    if(!resolveCustomer(draft,directory)){show("Bitte zuerst einen Kunden erfassen.");return;}
    if(company.error){show(company.error);return;}
    documentSavePending.current=true;setSaving(true);
    let savedNumber=draft.number;
    try{
      {}
      {
        const payload={...documentPayload(kind,draft),sourceOffer:sourceOffer||draft.sourceOffer||undefined,sourceProject:sourceProject||draft.sourceProject||undefined,customerId:resolveCustomer(draft,directory)?.id??draft.customerId};
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
  const calculationTotals=useAuthoritativeDocumentTotals(kind,draft);
  const presentation=documentPresentation(kind,draft,calculationTotals.total);
  const title=existing?kind:`${kind} erstellen`;
  const headerActions=existing&&!editing
    ? <div className="document-header-icons"><IconButton label="Weitere Aktionen" icon="more" onClick={()=>setMoreOpen(true)}/></div>
    : <div className="document-header-icons"><IconButton label="Vorschau" icon="file" onClick={()=>setPreview(true)}/></div>;
  const desktopActions=headerActions;

  const closeCreation=()=>{recovery.clear();allowDraftNavigation();router.push(returnTo)};
  const closeEdit=()=>{if(draftBaseline.current)setDraft(JSON.parse(draftBaseline.current) as DocumentDraft);draftBaseline.current=null;recovery.clear();setDirty(false);setEditing(false)};
  const finishCloseEditor=()=>{setConfirmCloseEditor(false);if(existing)closeEdit();else closeCreation()};
  const requestCloseEditor=()=>{if(saving)return;if(dirty)setConfirmCloseEditor(true);else finishCloseEditor()};
  const feedback=toast&&<Toast title={toast} tone={[`${kind} gespeichert.`,`${kind} erstellt.`,"Status aktualisiert.","Dokument als PDF versendet.","Gutschrift erfasst.","Rückerstattung erfasst.","Zahlungserinnerung versendet.","Nummer kopiert."].includes(toast)?"success":"danger"}/>;
  const readinessFeedback=issueReadiness&&issueReadiness.number===(documentKey??draft.number)&&!issueReadiness.ready&&<ErrorState><LocalizedText>{issueReadiness.message||"Bitte Rechnungsangaben prüfen."}</LocalizedText>{issueReadiness.recovery&&<Button variant="secondary" onClick={()=>{const target=issueReadiness.recovery!.href;if(target==="/rechnungen/"+encodeURIComponent(documentKey??draft.number)){documentLoad.refresh();company.refresh();setIssueReadiness(null);setMoreOpen(false)}else router.push(safeAppPath(target,"/einstellungen"))}}><LocalizedText>{issueReadiness.recovery.label}</LocalizedText></Button>}</ErrorState>;
  const documentContent=<>
    {!existing&&feedback}
    {actionError&&!moreOpen&&!sendOpen&&!creditOpen&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}
    {editing&&productQuery.error&&<ErrorState onRetry={productQuery.refresh}>{productQuery.error}</ErrorState>}
    {!moreOpen&&readinessFeedback}
    {editing&&company.error&&<ErrorState onRetry={company.refresh}>{company.error}</ErrorState>}
    {editing&&companyPending&&<LoadingState><LocalizedText>{"Firmendaten werden geladen …"}</LocalizedText></LoadingState>}
    {editing&&paymentIssue&&<div className="document-source-note" role="status"><span><LocalizedText>{paymentIssue}</LocalizedText></span>{tenantCan(documentRole,"organization:write")&&(existing?<Link href={setupDestination(paymentRequirement?.field??"iban","/"+plural+"/"+encodeURIComponent(documentKey??draft.number)+"?"+searchParams.toString())}><LocalizedText>Angaben ergänzen</LocalizedText></Link>:<Button variant="ghost" disabled={!recovery.ready} onClick={()=>{if(dirty)recovery.persist({draft,step:wizardStep,replay:draftReplay});allowDraftNavigation();router.push(setupDestination(paymentRequirement?.field??"iban","/"+plural+"/neu?"+searchParams.toString()))}}><LocalizedText>Angaben ergänzen</LocalizedText></Button>)}</div>}
    {sourceOffer&&!existing&&<div className="document-source-note"><span><LocalizedText>{"Erstellt aus Angebot"}</LocalizedText></span><b>{sourceOffer}</b></div>}
    {customersLoading?<LoadingState><LocalizedText>{"Kunden werden geladen …"}</LocalizedText></LoadingState>:customersError?<ErrorState onRetry={refreshCustomers}><LocalizedText>{customersError}</LocalizedText></ErrorState>:sourceLoading?<LoadingState><LocalizedText>{"Ursprungsangebot wird geladen …"}</LocalizedText></LoadingState>:sourceError?<ErrorState onRetry={()=>{sourceQuery.refresh();sourceCustomer.refresh();projectSource.refresh();agreementSource.refresh()}}><LocalizedText>{sourceError}</LocalizedText></ErrorState>:billingLoading?<LoadingState><LocalizedText>{"Verrechenbare Positionen werden geladen …"}</LocalizedText></LoadingState>:billingError?<ErrorState onRetry={()=>{timeSource.refresh();expenseSource.refresh()}}><LocalizedText>{billingError}</LocalizedText></ErrorState>:documentLoad.loading?<LoadingState><LocalizedText>{"Dokument wird geladen …"}</LocalizedText></LoadingState>:documentLoad.error?<EmptyState  title="Dokument konnte nicht geladen werden" description={documentLoad.error}/>:existing&&!editing
      ? <div className="document-desktop-workspace">
          <div className="document-desktop-detail">
            <DocumentReadView type={kind} draft={draft} directory={directory} canWrite={canWrite} followup={kind==="Angebot"&&canWrite?<OfferFollowup number={draft.number} open={followupOpen} onClose={()=>setFollowupOpen(false)}/>:undefined}/>
            {draft.id&&<EntityFiles purpose={kind==="Rechnung"?"invoice_attachment":"offer_attachment"} entityId={draft.id} uploadRef={attachmentUpload}/>}
          </div>

        </div>
      : !existing?<FormWizard cancelAction={<Button variant="secondary" onClick={requestCloseEditor} disabled={saving}><LocalizedText>{"Abbrechen"}</LocalizedText></Button>} labels={["Kunde und Dokumentdaten","Positionen",kind==="Angebot"?"Gültig bis":"Zahlungsbedingungen","Prüfen und als Entwurf speichern"]} step={wizardStep} onStep={setWizardStep} busy={saving} action={<Button disabled={saving||productQuery.loading||Boolean(productQuery.error)||companyPending||Boolean(company.error)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":existing?"Speichern":"Als Entwurf speichern"}</LocalizedText></Button>}><DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,calculation:undefined,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} lockedCustomer={Boolean(sourceOffer||sourceProject||draft.sourceOffer||draft.sourceProject)} step={!existing?wizardStep:undefined}/>{wizardStep===3&&<DocumentReview type={kind} draft={draft} onStep={setWizardStep}/>}{wizardStep===1&&editing&&kind==="Rechnung"&&draft.customerId&&tenantCan(documentRole,"invoices:write")&&<Button variant="secondary" href={"/zeit?invoice="+encodeURIComponent(existing?draft.number:"")+"&customerId="+encodeURIComponent(draft.customerId)}><LocalizedText>{"Freigegebene Zeiten hinzufügen"}</LocalizedText></Button>}</FormWizard>:<DocumentEditor type={kind} draft={draft} onChange={next=>{draftBaseline.current??=editableDocumentSnapshot(draft);setDirty(editableDocumentSnapshot(next)!==draftBaseline.current);setDraft({...next,subtotal:undefined,vat:undefined,total:undefined})}} directory={directory} lockedCustomer={Boolean(sourceOffer||sourceProject||draft.sourceOffer||draft.sourceProject)} step={!existing?wizardStep:undefined}/>}
    {editing&&existing&&kind==="Rechnung"&&draft.customerId&&tenantCan(documentRole,"invoices:write")&&<Button variant="secondary" href={"/zeit?invoice="+encodeURIComponent(draft.number)+"&customerId="+encodeURIComponent(draft.customerId)}><LocalizedText>{"Freigegebene Zeiten hinzufügen"}</LocalizedText></Button>}
    {editing&&existing&&<FormActions><Button variant="secondary" onClick={requestCloseEditor}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={saving||calculationTotals.pending||Boolean(calculationTotals.error)||companyPending||Boolean(company.error)||documentLoad.loading||customersLoading||Boolean(customersError)||Boolean(documentLoad.error)} onClick={()=>void save()}><LocalizedText>{saving?"Wird gespeichert…":existing?"Speichern":kind+" erstellen"}</LocalizedText></Button></FormActions>}
  </>;
  return <DocumentTotalsContext.Provider value={calculationTotals}><AppShell title={existing?editing?kind+" bearbeiten":kind:title} titleIsUserContent={false} status={undefined} statusTone={presentation.statusTone} subtitle={undefined} active={plural} backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":returnTo==="/dashboard"?"Übersicht":kind==="Angebot"?"Angebote":"Rechnungen"} actions={editing?<IconButton label="Schliessen" icon="close" onClick={requestCloseEditor}/>:desktopActions} mobileActions={editing?<IconButton label="Schliessen" icon="close" onClick={requestCloseEditor}/>:existing?headerActions:undefined} preview={preview} editing={editing} unsavedChanges={editing&&dirty}>
    <section className="document-entry-page" aria-busy={saving||undefined} aria-label={title} onKeyDown={event=>{if(editing&&event.key==="Escape"&&!event.defaultPrevented&&!(event.target as Element).closest('[role="dialog"],[role="listbox"]')){event.preventDefault();requestCloseEditor()}}}>{documentContent}</section>
    <ConfirmDialog open={confirmCloseEditor} busy={saving} title="Änderungen verwerfen?" message="Deine Änderungen sind noch nicht gespeichert und gehen verloren." cancelLabel="Weiter bearbeiten" confirmLabel="Verwerfen" onCancel={()=>setConfirmCloseEditor(false)} onConfirm={finishCloseEditor}/>
    {preview&&<DocumentModal previewDraft={documentPreviewPayload(kind,draft,existing&&editing?documentKey:undefined)} pdfNumber={existing&&!editing?documentKey??draft.number:undefined} title={kind==="Angebot"?"Angebotsvorschau":"Rechnungsvorschau"} onClose={()=>setPreview(false)}/>}
    <ActionSheet label="Weitere Aktionen" open={moreOpen} busy={actionBusy} onClose={()=>setMoreOpen(false)}><div className="action-list">{canWrite&&draft.id&&<ActionRow requiresWrite icon="upload" title="Datei hinzufügen" onClick={()=>{setMoreOpen(false);attachmentUpload.current?.chooseFile()}}/>}
      {canWrite&&kind==='Rechnung'&&draft.billingAgreementId&&draft.status!=='cancelled'&&draft.status!=='draft'&&draft.billingContext?.procedure!=='final'&&<><ActionRow icon="receipt" title="Teilrechnung erstellen" href={'/rechnungen/neu?'+new URLSearchParams({billingAgreementId:draft.billingAgreementId,customerId:draft.customerId??'',period:String(draft.billingContext?.period??0),procedure:'partial'})}/><ActionRow icon="receipt" title="Schlussrechnung erstellen" href={'/rechnungen/neu?'+new URLSearchParams({billingAgreementId:draft.billingAgreementId,customerId:draft.customerId??'',period:String(draft.billingContext?.period??0),procedure:'final'})}/></>}
      {canEdit&&<ActionRow icon="edit" title="Bearbeiten" onClick={()=>{draftBaseline.current=editableDocumentSnapshot(draft);setMoreOpen(false);setEditing(true)}} navigation/>}
      <ActionRow icon="copy" title="Nummer kopieren" onClick={()=>{void navigator.clipboard.writeText(draft.number).then(()=>{setMoreOpen(false);show("Nummer kopiert.")}).catch(()=>{setActionError("Nummer konnte nicht kopiert werden.")})}}/>
      {canRecordPayment&&<ActionRow href={"/zahlungen/neu?invoice="+encodeURIComponent(documentKey??draft.number)} icon="wallet" title="Zahlung erfassen"/>}
      {kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"projects:write")&&<ActionRow href={draft.projectId?"/projekte/"+encodeURIComponent(draft.projectId):"/projekte/neu?customerId="+encodeURIComponent(draft.customerId??"")+"&sourceOffer="+encodeURIComponent(draft.number)} icon="clock" title={draft.projectId?"Auftrag öffnen":"Auftrag starten"}/>}
      {kind==="Angebot"&&draft.status==="accepted"&&tenantCan(documentRole,"invoices:write")&&<ActionRow href={draft.invoiceNumber?"/rechnungen/"+encodeURIComponent(draft.invoiceNumber):"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)} icon="receipt" title={draft.invoiceNumber?"Rechnung öffnen":"Rechnung erstellen"}/>}
      {kind==="Angebot"&&draft.status==="accepted"&&draft.billingAgreementId&&draft.invoiceNumber&&tenantCan(documentRole,"invoices:write")&&<ActionRow href={"/rechnungen/neu?sourceOffer="+encodeURIComponent(documentKey??draft.number)+"&procedure=partial"} icon="receipt" title="Teilrechnung"/>}
      <ActionRow onClick={()=>{setMoreOpen(false);setPreview(true)}} icon="file" title="Vorschau" navigation/>
      <ActionRow href={"/api/documents/"+encodeURIComponent(documentKey??draft.number)+"/pdf"} icon="file" title="PDF herunterladen"/>
      {canWrite&&!(kind==='Rechnung'&&draft.status==='draft')&&!['cancelled','declined','expired','revised'].includes(draft.status??'')&&<ActionRow disabled={demoDocument||actionBusy} onClick={()=>{recipientTouched.current=false;setRecipient(resolveCustomer(draft,directory)?.email??"");setMailSubject(translate(kind)+" "+draft.number);setMailMessage(translate(kind==="Angebot"?"Guten Tag\n\nIm Anhang findest du unser Angebot. Über den sicheren Link kannst du das Angebot prüfen und beantworten.\n\nFreundliche Grüsse":"Guten Tag\n\nIm Anhang findest du unsere Rechnung.\n\nFreundliche Grüsse"));setSendPurpose('document');setSendKey(crypto.randomUUID());setActionError(null);setMoreOpen(false);setSendOpen(true)}} icon="mail" title={demoDocument?'Versand in der Demo deaktiviert':'Per E-Mail senden'} navigation/>}
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
    <FormSheet label={sendingReminder?"Zahlungserinnerung senden":"Dokument senden"} description={translate(kind==="Angebot"?"Angebot als PDF":"Rechnung als PDF")+" · "+draft.number} open={sendOpen} busy={actionBusy} onClose={()=>setSendOpen(false)}><div className="sheet-body"><Field label="Empfänger"><Input type="email" value={recipient} onChange={e=>{recipientTouched.current=true;setRecipient(e.target.value);setSendKey(crypto.randomUUID())}} autoComplete="email"/></Field>{!sendingReminder&&<><Field label="Betreff"><Input value={mailSubject} maxLength={180} onChange={event=>{setMailSubject(event.target.value);setSendKey(crypto.randomUUID())}}/></Field><Field label="Begleittext"><Textarea value={mailMessage} maxLength={4000} onChange={event=>{setMailMessage(event.target.value);setSendKey(crypto.randomUUID())}}/></Field><Button variant="secondary" onClick={()=>setPreview(true)}>PDF-Vorschau</Button></>}<p>{kind==="Angebot"&&draft.status==="draft"&&<LocalizedText>{"Mit dem Versand wird diese Angebotsversion verbindlich ausgestellt. "}</LocalizedText>}<LocalizedText>{sendingReminder?"Der aktuelle offene Betrag wird geprüft. Der Versand erhöht die Mahnstufe; es werden keine Gebühren berechnet.":kind==="Angebot"?"PDF und sicherer, versionierter Angebotslink werden versendet.":"Das ausgestellte Dokument wird als PDF versendet."}</LocalizedText></p>{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</div><FormActions sheet><Button variant="secondary" onClick={()=>setSendOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={actionBusy||!recipient||(!sendingReminder&&!mailSubject.trim())} onClick={()=>void sendDocument()}><LocalizedText>{sendButtonLabel}</LocalizedText></Button></FormActions></FormSheet>
    <FormSheet label="Entwurf verwerfen" open={discardOpen} busy={actionBusy} onClose={()=>setDiscardOpen(false)}><div className="sheet-body"><p><LocalizedText>{"Der Entwurf wird archiviert. Reservierte Minuten werden freigegeben. Es wird keine Rechnung ausgestellt."}</LocalizedText></p>{actionError&&<ErrorState><LocalizedText>{actionError}</LocalizedText></ErrorState>}</div><FormActions sheet><Button variant="secondary" disabled={actionBusy} onClick={()=>setDiscardOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={actionBusy} onClick={()=>void discardDraft()}><LocalizedText>{"Entwurf verwerfen"}</LocalizedText></Button></FormActions></FormSheet>
    {existing&&feedback}
  </AppShell></DocumentTotalsContext.Provider>;
}

/** Review the real draft as an app task; the separately opened PDF owns paper layout. */
function DocumentReview({type,draft,onStep}:{type:DocumentKind;draft:DocumentDraft;onStep:(step:number)=>void}){
 const {locale}=useLocale();
 const totals=useDocumentTotals(draft),currency=draft.currency??"CHF";
 return <div className="document-review">
  <section className="form-section"><SectionTitle title="Kunde" action={<Button variant="ghost" icon="edit" onClick={()=>onStep(0)}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>}/><strong>{draft.customer}</strong><p><LocalizedText>{type==="Rechnung"?"Rechnungsdatum":"Angebotsdatum"}</LocalizedText>: {isoToSwiss(draft.date)}</p></section>
  <section className="form-section"><SectionTitle title="Positionen" action={<Button variant="ghost" icon="edit" onClick={()=>onStep(1)}><LocalizedText>{"Bearbeiten"}</LocalizedText></Button>}/><div className="document-review-positions">{draft.positions.map((item,index)=><div key={item.id}><span><b>{item.description}</b><small>{item.quantity} × {currency} {money(numberValue(item.price),localeTags[locale])}{isMinuteDocumentLine(item)&&<>{' / '}{item.priceBaseQuantity??60}<LocalizedText>{' min'}</LocalizedText></>}</small></span><strong>{currency} {money(lineAmount(item,totals.calculation,draft.positions.indexOf(item)),localeTags[locale])}</strong></div>)}</div></section>
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
 const {locale}=useLocale();
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
          <span>{item.quantity} <LocalizedText>{({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"}</LocalizedText><small className="document-mobile-price"><LocalizedText>{" × "}</LocalizedText>{currency} {money(numberValue(item.price),localeTags[locale])}{isMinuteDocumentLine(item)&&<>{' / '}{item.priceBaseQuantity??60}<LocalizedText>{' min'}</LocalizedText></>}</small></span>
          <span>{currency} {money(numberValue(item.price),localeTags[locale])}{isMinuteDocumentLine(item)&&<>{' / '}{item.priceBaseQuantity??60}<LocalizedText>{' min'}</LocalizedText></>}</span>
          <strong>{currency} {money(lineAmount(item,totals.calculation,draft.positions.indexOf(item)),localeTags[locale])}</strong>
        </div>)}
      </div>
      <DocumentTotals draft={draft} totals={totals}/>{Boolean(draft.advanceReversals?.length)&&<DetailDisclosure label="Aufgehobene Akonto-Anrechnungen">{draft.advanceReversals!.map((a,index)=><p key={index}><span translate="no">{a.number}</span> · {currency} {money(Number(a.amount),localeTags[locale])} · {formatTimestampDate(a.reversedAt,localeTags[locale])}</p>)}</DetailDisclosure>}
    </section>
    {isInvoice&&Number(draft.creditAmount??0)>0&&<p><LocalizedText>{"Gutschriften"}</LocalizedText>: {currency} {money(Number(draft.creditAmount),localeTags[locale])}</p>}
    {isInvoice&&creditBalance>0&&<MetricTile label="Kundenguthaben" value={`${currency} ${money(creditBalance,localeTags[locale])}`}/>}
    {hasClaim&&<LocalizedElement as="section" className="document-payment-facts" aria-label="Zahlungsstand"><SectionTitle title="Zahlungsstand"/>
      <MetricTile label="Bereits bezahlt" value={`${currency} ${money(Number(draft.paidAmount??0),localeTags[locale])}`}/>
    </LocalizedElement>}
    {!isInvoice&&draft.number&&<OfferHistory number={draft.number} canWrite={canWrite}/>}{followup}
    {(Boolean(draft.billingTerms||draft.credits?.length||draft.reminders?.length||draft.refunds?.length||draft.revisesOffer||draft.revisions?.length||draft.sourceOffer||draft.invoiceNumber||draft.note))&&<DetailDisclosure label="Weitere Angaben">
    {isInvoice&&Boolean(draft.credits?.length)&&<section className="document-detail-section"><SectionTitle title="Gutschriften"/>{draft.credits?.map(credit=><p key={credit.number}><b>{credit.number}</b> · {credit.date.split('-').reverse().join('.')} · {currency} {money(Number(credit.amount),localeTags[locale])}<br/>{credit.reason}</p>)}</section>}
    {isInvoice&&Boolean(draft.reminders?.length)&&<section className="document-detail-section"><SectionTitle title="Mahnhistorie"/>{draft.reminders?.map(reminder=><p key={reminder.id}><b><LocalizedText>{reminder.stage===1?'Zahlungserinnerung':reminder.stage===2?'1. Mahnung':'2. Mahnung'}</LocalizedText></b> · <LocalizedText>{deliveryLabel(reminder.status)}</LocalizedText><br/>{reminder.recipient} · {currency} {money(Number(reminder.amount),localeTags[locale])} · <LocalizedText>{"Zahlungsfrist"}</LocalizedText>: {reminder.deadline.split('-').reverse().join('.')}</p>)}</section>}
    {isInvoice&&Boolean(draft.refunds?.length)&&<section className="document-detail-section"><SectionTitle title="Rückerstattungen"/>{draft.refunds?.map(refund=><p key={refund.id}>{refund.date.split('-').reverse().join('.')} · {currency} {money(Number(refund.amount),localeTags[locale])}<br/>{refund.reason}</p>)}</section>}
    {draft.revisesOffer&&<p><LocalizedText>{"Vorherige Angebotsversion"}</LocalizedText>: <Link href={'/angebote/'+encodeURIComponent(draft.revisesOffer)}>{draft.revisesOffer}</Link></p>}
    {Boolean(draft.revisions?.length)&&<section className="document-detail-section"><SectionTitle title="Überarbeitete Angebotsversionen"/>{draft.revisions?.map(revision=>{const label=financialStatusText(revision.status,'offer');return <p key={revision.number}><Link href={'/angebote/'+encodeURIComponent(revision.number)}>{revision.number}</Link> · <LocalizedText>{label}</LocalizedText></p>})}</section>}
    {draft.billingTerms&&<p><LocalizedText>Abrechnungsmodell</LocalizedText>: <LocalizedText>{billingModelLabels[draft.billingTerms.model]}</LocalizedText></p>}{draft.sourceOffer&&<p><LocalizedText>{"Ursprungsangebot: "}</LocalizedText><Link href={"/angebote/"+encodeURIComponent(draft.sourceOffer)}>{draft.sourceOffer}</Link></p>}{draft.invoiceNumber&&<p><LocalizedText>{"Rechnung: "}</LocalizedText><Link href={"/rechnungen/"+encodeURIComponent(draft.invoiceNumber)}>{draft.invoiceNumber}</Link></p>}
    {draft.note&&<section className="document-detail-section"><span className="eyebrow"><LocalizedText>{"NOTIZ"}</LocalizedText></span><p>{draft.note}</p></section>}
    </DetailDisclosure>}
  </div>;
}

function DiscountFields({value,onChange,currency,label}:{value:Discount;onChange:(value:Discount)=>void;currency:string;label:string}){
 return <section className="document-discount-fields"><Field label={label}><Select value={value.kind} onChange={e=>onChange(e.target.value==='none'?{kind:'none'}:e.target.value==='percent'?{kind:'percent',value:'0'}:{kind:'fixed',value:'0',currency})}><option value="none"><LocalizedText>{"Kein Rabatt"}</LocalizedText></option><option value="percent"><LocalizedText>{"Prozent"}</LocalizedText></option><option value="fixed"><LocalizedText>{"Fixbetrag"}</LocalizedText></option></Select></Field>{value.kind!=='none'&&<Field label={value.kind==='percent'?'Rabatt in Prozent':'Rabattbetrag'}><Input inputMode="decimal" value={value.value} onChange={e=>onChange({...value,value:e.target.value})}/></Field>}</section>;
}
function DocumentTotals({draft,totals}:{draft:DocumentDraft;totals:DocumentTotalsResult}){
 const {locale}=useLocale();
 const currency=draft.currency??'CHF',c=totals.calculation;
 const adjustmentLabel=c&&'settlementAdjustment' in c&&(c.settlementAdjustment as {kind?:string}).kind==='cumulative'?'Kumulativer Rundungsausgleich':'Rundungsausgleich Schlussrechnung';
 if(totals.pending)return <LoadingState/>;
 if(totals.error)return <ErrorState onRetry={totals.refresh}><LocalizedText>{totals.error}</LocalizedText></ErrorState>;
 return <div className="invoice-totals"><span><LocalizedText>{"Zwischentotal"}</LocalizedText><b>{currency} {money(c?Number(c.raw):totals.subtotal,localeTags[locale])}</b></span>
 {c?.lines.some(l=>l.discount.kind!=='none')&&<span><LocalizedText>{"Positionsrabatte"}</LocalizedText><b>−{currency} {money(Number(c.positionDiscountDisplay),localeTags[locale])}</b></span>}
 {c&&(c.discount.kind!=='none'||'billingScopes' in c&&Number(c.discountDisplay)>0)&&<span><LocalizedText>{"Gesamtrabatt"}</LocalizedText><b>−{currency} {money(Number(c.discountDisplay),localeTags[locale])}</b></span>}
 {c?c.taxGroups.map((g,index)=><span key={index}><span><LocalizedText>{g.exempt?'Steuerbefreit':'MwSt.'}</LocalizedText>{!g.exempt&&' '+Number(g.rate)+' %'}</span><b>{currency} {money(Number(g.tax),localeTags[locale])}</b></span>):<span><LocalizedText>{"MwSt."}</LocalizedText><b>{currency} {money(totals.vat,localeTags[locale])}</b></span>}
 {c&&c.positionRoundingCents!=='0'&&<span><LocalizedText>{"Rundung"}</LocalizedText><b>{currency} {money(Number(c.positionRoundingCents)/100,localeTags[locale])}</b></span>}
 {c&&c.discountRoundingCents!=='0'&&<span><LocalizedText>{"Rundung"}</LocalizedText><b>{currency} {money(Number(c.discountRoundingCents)/100,localeTags[locale])}</b></span>}
 {c&&'advanceApplications' in c&&(c.advanceApplications as AdvanceApplication[]).map(a=><span key={a.advanceInvoiceId+a.agreementId}><span><LocalizedText>Angerechnetes Akonto</LocalizedText>{a.advanceNumber&&<> <span translate="no">{a.advanceNumber}{a.agreementLabel?' · '+a.agreementLabel:''}</span></>}</span><b>−{currency} {money(a.taxGroups.reduce((n,g)=>n+Number(g.net),0),localeTags[locale])}</b></span>)}
 {c&&'settlementAdjustment' in c&&<span><LocalizedText>{adjustmentLabel}</LocalizedText><b>{currency} {money(Number((c.settlementAdjustment as {net:string}).net),localeTags[locale])}</b></span>}
 <strong><LocalizedText>{"Total"}</LocalizedText><b>{currency} {money(totals.total,localeTags[locale])}</b></strong></div>;
}

function BillingContextFields({draft,onChange,type}:{draft:DocumentDraft;onChange:(draft:DocumentDraft)=>void;type:DocumentKind}){
 const {locale}=useLocale();const terms=draft.billingTerms;if(!terms)return null;
 const context={procedure:'standard',...(terms.model==='recurring'?{period:0}:{}),...draft.billingContext};
 const patch=(value:{procedure?:string;period?:number;milestoneId?:string})=>{const milestone=terms.model==='milestone'?terms.milestones.find(m=>m.id===value.milestoneId):null;onChange({...draft,...(value.procedure==='advance'?{advanceApplications:draft.advanceApplications?.filter(a=>a.agreementId!==draft.billingAgreementId)}:{}),billingContext:{...context,...value},...(value.procedure==='advance'&&(terms.model==='time'||terms.model==='quantity'||terms.model==='mixed'&&terms.amount===null)?{positions:draft.positions.map(p=>({...p,billingPart:'fixed' as const}))}:{}),...(milestone&&draft.billingTemplatePositions?{positions:draft.billingTemplatePositions.filter(line=>line.billingSourcePosition===(terms.model==='milestone'?terms.milestones.findIndex(m=>m.id===milestone.id)+1:0))}:milestone&&draft.positions.length===1?{positions:[{...draft.positions[0],price:milestone.amount??'0'}]}:{})})};
 return <div className="form-grid">
  {type==='Rechnung'&&<><Field label="Rechnungsverfahren"><Select value={context.procedure} onChange={e=>patch({procedure:e.target.value})}><option value="standard"><LocalizedText>Rechnung</LocalizedText></option><option value="advance" disabled={draft.positions.some(p=>p.timeEntryIds?.length||p.timeAllocations?.length||p.expenseIds?.length)}><LocalizedText>Akonto</LocalizedText></option><option value="partial"><LocalizedText>Teilrechnung</LocalizedText></option><option value="final"><LocalizedText>Schlussrechnung</LocalizedText></option></Select></Field>{terms.model==='recurring'&&<Field label="Periodennummer"><Input type="number" min="1" max="120001" step="1" value={Number(context.period??0)+1} onChange={e=>patch({period:Number(e.target.value)-1})}/></Field>}{terms.model==='milestone'&&<Field label="Meilenstein"><Select value={context.milestoneId??''} onChange={e=>patch({milestoneId:e.target.value})}><option value=""><LocalizedText>Bitte wählen</LocalizedText></option>{terms.milestones.map(m=><option key={m.id} value={m.id} disabled={!m.completed&&!draft.billingCompletedMilestones?.includes(m.id)}>{m.label}</option>)}</Select></Field>}</>}
  {!!draft.billingRateOptions?.length&&draft.positions.filter(item=>item.timeEntryIds?.length).map(item=><Field key={item.id} label="Stundensatz"><Select value={item.billingSourcePosition??(draft.billingRateOptions!.length===1?'agreed':'')} onChange={e=>{const option=draft.billingRateOptions!.find(p=>String(p.position??'agreed')===e.target.value);if(option)onChange({...draft,positions:draft.positions.map(l=>l.id===item.id?{...l,billingSourcePosition:option.position,price:option.unitPrice,vatRate:option.vatRate??l.vatRate,taxExempt:option.taxExempt??l.taxExempt,discount:option.discount??l.discount}:l)})}}><option value=""><LocalizedText>Bitte wählen</LocalizedText></option>{draft.billingRateOptions!.map((option,index)=><option key={index} value={option.position??'agreed'}>{option.description??''} · {terms.currency} {money(Number(option.unitPrice),localeTags[locale])}</option>)}</Select></Field>)}
  {terms.model==='mixed'&&draft.positions.map(item=><Field key={item.id} label="Leistungsart"><Select value={item.billingPart??''} onChange={e=>onChange({...draft,positions:draft.positions.map(l=>l.id===item.id?{...l,billingPart:e.target.value as LineItem['billingPart']}:l)})}><option value=""><LocalizedText>Bitte wählen</LocalizedText></option>{terms.amount!==null&&<option value="fixed"><LocalizedText>Pauschal/Fixpreis</LocalizedText></option>}{terms.additionalTime&&<option value="time"><LocalizedText>Nach Aufwand</LocalizedText></option>}{terms.quantity&&<option value="quantity"><LocalizedText>Nach Menge</LocalizedText></option>}</Select><small translate="no">{item.description}</small></Field>)}
 </div>;
}

function DocumentEditor({ type, draft, onChange, directory, step,lockedCustomer=false }: { type:DocumentKind; draft:DocumentDraft; onChange:(draft:DocumentDraft)=>void; directory:CustomerDirectory;step?:number;lockedCustomer?:boolean }) {
 const {locale}=useLocale();

  const company=useDocumentCompany();
  const totals=useDocumentTotals(draft);
  const names=Object.keys(directory);
  const sourceLinked=draft.positions.some(item=>Boolean(item.timeEntryIds?.length||item.timeAllocations?.length||item.expenseIds?.length));
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
    onChange({...draft,positions:[...draft.positions,{id,description:"Neue Position",quantity:"1",price:"0.00",billingAgreementId:draft.billingScopes?.[0]?.agreementId}]});
  };

  const removePosition=(id:string)=>{
    if(draft.positions.length===1) return;
    const positions=draft.positions.filter(item=>item.id!==id),scopes=draft.billingScopes?.filter(scope=>positions.some(p=>p.billingAgreementId===scope.agreementId));
    onChange({...draft,positions,billingScopes:scopes,advanceApplications:draft.advanceApplications?.filter(a=>!draft.billingScopes||scopes?.some(s=>s.agreementId===a.agreementId))});
  };

  if(names.length===0){
    return <div className="invoice-workspace"><section className="invoice-form"><EmptyState  title="Zuerst einen Kunden erfassen"  /><FormActions><Button href="/kunden/neu"><LocalizedText>{"Kunde erfassen"}</LocalizedText></Button></FormActions></section></div>;
  }

  return <div className="invoice-workspace">
    <section className={`invoice-form ${type==="Angebot"?"offer-form":""}`}>
      <div hidden={step!==undefined&&step!==0} className="form-section customer-form-section">
        {!draft.billingScopes?.length&&<BillingTermsEditor positionsOwnRates value={draft.billingTerms} currency={draft.currency==='EUR'?'EUR':'CHF'} disabled={type==='Rechnung'&&!!(draft.sourceOffer||draft.sourceProject||draft.billingAgreementId&&(!draft.billingAgreementOwned||sourceLinked))} onChange={billingTerms=>onChange({...draft,billingTerms,currency:billingTerms.currency,positions:draft.positions.map(l=>({...l,billingPart:billingTerms.model==='mixed'?(draft.billingTerms?.model==='mixed'?l.billingPart:undefined):billingTerms.model==='time'?'time':billingTerms.model==='quantity'?'quantity':'fixed',...(billingTerms.model==='time'||billingTerms.model==='mixed'&&l.billingPart==='time'?{unit:'Stunden',...('hourlyRate' in billingTerms&&billingTerms.hourlyRate!=null?{price:billingTerms.hourlyRate}:{})}:{})}))})}/>}<BillingContextFields draft={draft} onChange={onChange} type={type}/>
        {type==='Rechnung'&&<InvoiceBillingAssociations draft={draft} onChange={onChange}/>}
        <span className="compact-section-label"><LocalizedText>{"Kunde"}</LocalizedText></span>
        <Field label="Kunde auswählen"><DirectorySelect label="Kunde auswählen" disabled={lockedCustomer||sourceLinked} required endpoint={"/api/customers"} value={draft.customerId??''} onChange={(value,item)=>{if(item)onChange({...draft,customer:String(item.name??''),customerId:value,...(type==='Rechnung'?{due:documentDefaults(company.raw,{paymentDays:item.paymentDays==null?undefined:Number(item.paymentDays)},'Rechnung',draft.date).due}:{})})}}/></Field>
      </div>
      <div hidden={step!==undefined&&step!==0&&step!==2} className="form-section">
        <h2><LocalizedText>{step===2?(type==="Angebot"?"Gültig bis":"Zahlungsbedingungen"):"Dokumentdaten"}</LocalizedText></h2>
        <div className="form-grid document-meta-grid">
          {draft.id&&type==='Rechnung'&&<Field className="document-number-field" label="Rechnungsnummer"><Input value={draft.number} readOnly aria-readonly="true"/></Field>}
          <div hidden={step===2}><Field label={type==="Rechnung" ? "Rechnungsdatum" : "Angebotsdatum"}><Input type="date" value={draft.date} onChange={e=>onChange({...draft,date:e.target.value})}/></Field></div>
          <div hidden={step===0}><Field label={type==="Rechnung" ? "Zahlungsfrist" : "Gültig bis"}>
            {type==="Rechnung" ? <Select value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}>{!["10","30","45"].includes(draft.due)&&<option value={draft.due}>{draft.due}<LocalizedText>{" Tage"}</LocalizedText></option>}<option value="10"><LocalizedText>{"10 Tage"}</LocalizedText></option><option value="30"><LocalizedText>{"30 Tage"}</LocalizedText></option><option value="45"><LocalizedText>{"45 Tage"}</LocalizedText></option></Select> : <Input type="date" value={draft.due} onChange={e=>onChange({...draft,due:e.target.value})}/>}
          </Field></div>
          <div hidden={step===0}><Field label="MwSt."><Select value={draft.vatRate} onChange={e=>onChange({...draft,vatRate:e.target.value,positions:draft.positions.map(item=>isMinuteDocumentLine(item)?item:({...item,vatRate:e.target.value,taxExempt:false}))})}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate.toLocaleString(localeTags[locale])} %</option>)}</Select></Field></div>
        </div>
      </div>
      <div hidden={step!==undefined&&step!==1} className="form-section">
        <SectionTitle title="Positionen" action={<LocalizedElement as="button" className="icon-action" type="button" onClick={addPosition} aria-label="Position hinzufügen"><Icon name="plus" size={18}/></LocalizedElement>}/>
        {sourceIds&&capacity.error&&<ErrorState onRetry={capacity.refresh}><LocalizedText>{capacity.error}</LocalizedText></ErrorState>}
        <div className="line-items document-line-items" role="list">
          {draft.positions.map((item,index)=><DocumentPositionRow key={item.id} id={item.id} number={positionNumber(index)} title={item.description} meta={<>{item.quantity} <LocalizedText>{({hour:"Std.",piece:"Stück",flat:"Pauschal"} as Record<string,string>)[item.unit??""]??item.unit??"Stück"}</LocalizedText>{" × "}{draft.currency??"CHF"} {money(numberValue(item.price),localeTags[locale])}{isMinuteDocumentLine(item)&&<>{' / '}{item.priceBaseQuantity??60}<LocalizedText>{' min'}</LocalizedText></>}</>} amount={<>{draft.currency??"CHF"} {money(lineAmount(item,totals.calculation,index),localeTags[locale])}</>} onEdit={()=>{setPositionDraft({...item});setMobilePositionId(item.id)}} onMove={direction=>onChange({...draft,positions:moveDocumentLine(draft.positions,item.id,direction)})} onReorder={targetId=>onChange({...draft,positions:reorderDocumentLine(draft.positions,item.id,targetId)})} canDuplicate={canDuplicateDocumentLine(item)} canRemove={draft.positions.length>1} onDuplicate={()=>onChange({...draft,positions:duplicateDocumentLine(draft.positions,item.id,crypto.randomUUID())})} onRemove={()=>removePosition(item.id)}/>)}
        </div>
        <div className="document-discount-actions">{!draft.id&&!draft.sourceOffer&&draft.discount===undefined&&customerDiscount>0&&<p><LocalizedText>{"Kundenrabatt vorgeschlagen"}</LocalizedText>: {customerDiscount} %</p>}<Button variant="secondary" onClick={()=>openDiscount()}><LocalizedText>Gesamtrabatt</LocalizedText></Button>{!draft.id&&!draft.sourceOffer&&customerDiscount>0&&<Button variant="secondary" onClick={()=>openDiscount(true)}><LocalizedText>Kundenrabatt übernehmen</LocalizedText></Button>}</div><DocumentTotals draft={draft} totals={totals}/>
      </div>
      {mobilePositionId&&(()=>{const item=positionDraft;if(!item)return null;return <FormSheet label={"Position bearbeiten"} description={item.description} open={true} onClose={closePosition} busy={false} className={"mobile-position-sheet"} layerClassName={"mobile-position-layer"} ariaLabel={"Position bearbeiten"}><div className="sheet-body mobile-position-fields">{draft.billingScopes?.length&&<Field label="Auftrag"><Select value={item.billingAgreementId??''} disabled={Boolean(item.timeEntryIds?.length||item.timeAllocations?.length)} onChange={e=>setPositionDraft({...item,billingAgreementId:e.target.value})}>{draft.billingScopes.map(scope=><option key={scope.agreementId} value={scope.agreementId}>{scope.label??<LocalizedText>Auftrag</LocalizedText>}</option>)}</Select></Field>}{item.timeAllocations?.length===1&&<p><LocalizedText>{"Verfügbare Minuten"}</LocalizedText>: {available(item)??'—'}</p>}<Field label="Beschreibung"><Input value={item.description} onChange={e=>setPositionDraft({...item,description:e.target.value})}/></Field><div><Field label={isMinuteDocumentLine(item)?"Minuten":"Menge"}><Input readOnly={Boolean(item.timeAllocations?.length&&(item.timeAllocations.length>1||capacity.loading||capacity.error))} inputMode={isMinuteDocumentLine(item)?"numeric":"decimal"} value={item.quantity} onChange={e=>setPositionDraft({...item,...quantityPatch(item,e.target.value)})}/></Field><Field label="Einheit"><Select disabled={isMinuteDocumentLine(item)} value={item.unit??"Stück"} onChange={e=>setPositionDraft({...item,unit:e.target.value})}>{documentUnitOptions(item.unit).map(unit=><option key={unit} value={unit}><LocalizedText>{unit}</LocalizedText></option>)}</Select></Field><Field label="Einzelpreis"><Input readOnly={isMinuteDocumentLine(item)} inputMode="decimal" value={item.price} onChange={e=>setPositionDraft({...item,price:e.target.value})}/>{isMinuteDocumentLine(item)&&<small><>{' / '}{item.priceBaseQuantity??60}<LocalizedText>{' min'}</LocalizedText></></small>}</Field></div><DiscountFields value={item.discount??{kind:'none'}} currency={draft.currency??'CHF'} label="Positionsrabatt" onChange={discount=>setPositionDraft({...item,discount})}/><Field label="MwSt."><Select value={item.vatRate??draft.vatRate} disabled={item.taxExempt||isMinuteDocumentLine(item)} onChange={e=>setPositionDraft({...item,vatRate:e.target.value})}>{domainConfig.vatRates.map(rate=><option key={rate} value={rate}>{rate} %</option>)}</Select></Field><Field label="Steuerbefreit"><Input type="checkbox" disabled={isMinuteDocumentLine(item)} checked={item.taxExempt??false} onChange={e=>setPositionDraft({...item,taxExempt:e.target.checked,...(e.target.checked?{vatRate:'0'}:{})})}/></Field>{positionTotals.error&&<ErrorState><LocalizedText>{positionTotals.error}</LocalizedText></ErrorState>}<div className="mobile-position-sheet-total"><span><LocalizedText>{"Total"}</LocalizedText></span><b><LocalizedText>{draft.currency??"CHF"}</LocalizedText> {money(lineAmount(item,positionTotals.calculation,draft.positions.findIndex(l=>l.id===item.id)),localeTags[locale])}</b></div><div className="document-position-editor-actions"><Button variant="secondary" disabled={!canDuplicateDocumentLine(item)} onClick={()=>{const id=crypto.randomUUID();onChange({...draft,positions:duplicateDocumentLine(draft.positions,item.id,id).map(line=>line.id===id?{...item,id}:line)});closePosition()}}><LocalizedText>Duplizieren</LocalizedText></Button><Button variant="secondary" disabled={draft.positions[0]?.id===item.id} onClick={()=>onChange({...draft,positions:moveDocumentLine(draft.positions,item.id,-1)})}><LocalizedText>Nach oben</LocalizedText></Button><Button variant="secondary" disabled={draft.positions.at(-1)?.id===item.id} onClick={()=>onChange({...draft,positions:moveDocumentLine(draft.positions,item.id,1)})}><LocalizedText>Nach unten</LocalizedText></Button></div><button className="text-action mobile-position-remove" type="button" disabled={draft.positions.length===1} onClick={()=>{removePosition(item.id);closePosition()}}><LocalizedText>{"Position entfernen"}</LocalizedText></button></div><FormActions sheet><Button variant="secondary" onClick={closePosition}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={Boolean(positionTotals.error)} onClick={()=>{updatePosition(item.id,item);closePosition()}}><LocalizedText>{"Übernehmen"}</LocalizedText></Button></FormActions></FormSheet>})()}
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

function currentAgreement(draft:DocumentDraft){return draft.billingAgreementId??draft.billingScopes?.[0]?.agreementId;}

function InvoiceBillingAssociations({draft,onChange}:{draft:DocumentDraft;onChange:(draft:DocumentDraft)=>void}){
 const {locale}=useLocale();
 const [projectId,setProjectId]=useState(''),[issue,setIssue]=useState<string|null>(null);
 const project=useApiQuery<{item:Record<string,unknown>}>(projectId?'/api/projects/'+encodeURIComponent(projectId):null);
 type AdvanceSource={id:string;agreement_id:string;agreement_label?:string;number:string;currency:string;calculation:DocumentCalculation;terms:BillingTerms;prior_allocations:AdvanceTaxAmount[][];allocated_amount:string;credited_amount:string};
 const advances=useApiQuery<{items:AdvanceSource[]}>(draft.customerId?'/api/documents/advances?'+new URLSearchParams({customerId:draft.customerId,...(draft.id?{draft:draft.id}:{})}):null);
 const scopes=draft.billingScopes??(draft.billingAgreementId?[{agreementId:draft.billingAgreementId,projectId:draft.sourceProject,terms:draft.billingTerms,label:'Auftrag',context:draft.billingContext??{procedure:'standard'},discount:draft.discount}]:[]);
 const addProject=()=>{try{
  const item=project.data?.item,terms=item?.billing_terms as BillingTerms|undefined;
  if(!item||!terms||!item.billing_agreement_id||item.customer_id!==draft.customerId)throw new Error('Bitte einen Auftrag mit Preisvereinbarung dieses Kunden auswählen.');
  const agreementId=String(item.billing_agreement_id);
  if(scopes.some(s=>s.agreementId===agreementId))throw new Error('Diese Preisvereinbarung ist bereits enthalten.');
  const populated=draft.positions.some(p=>Number(decimalInput(p.price))!==0||p.timeEntryIds?.length||p.timeAllocations?.length||p.expenseIds?.length);
  if(populated&&!scopes.length)throw new Error('Vorhandene Positionen benötigen zuerst eine Preisvereinbarung.');
  if(scopes.length&&terms.currency!==draft.currency)throw new Error('Leistungspreis und Rechnungswährung müssen übereinstimmen. Es erfolgt keine automatische Umrechnung.');
  const snapshot=item.billing_snapshot as {note?:string;items?:Record<string,unknown>[];calculation?:Record<string,unknown>}|undefined;
  const source=remoteDraftFromItem({customer_id:draft.customerId,currency:terms.currency,calculation:snapshot?.calculation,items:snapshot?.items?.map((l,n)=>({...l,billing_source_position:n+1}))??[{description:item.name,quantity:1,unit_price:'amount' in terms?terms.amount??0:'hourlyRate' in terms?terms.hourlyRate??0:0,unit:terms.model==='time'?'Stunden':'Stück',vat_rate:draft.vatRate,billing_part:terms.model==='time'?'time':terms.model==='quantity'?'quantity':'fixed'}]},'Angebot');
  const positions=source.positions.map(p=>({...p,id:crypto.randomUUID(),billingAgreementId:agreementId}));
  onChange({...draft,billingScopes:[...scopes,{agreementId,projectId,terms,conditions:snapshot?.note,templatePositions:positions,label:String(item.name),context:{procedure:'partial',...(terms.model==='recurring'?{period:0}:{})},discount:source.discount}],billingAgreementId:undefined,billingTerms:undefined,billingContext:undefined,sourceProject:undefined,sourceOffer:undefined,currency:terms.currency,discount:{kind:'none'},positions:[...(scopes.length?draft.positions.map(p=>({...p,billingAgreementId:p.billingAgreementId??draft.billingAgreementId})):[]),...positions]});
  setProjectId('');setIssue(null);
 }catch(error){setIssue(error instanceof Error?error.message:'Auftrag konnte nicht geladen werden.');}};
 const patchApplication=(source:AdvanceSource,amount:string|null)=>{
  const applications=(draft.advanceApplications??[]).filter(a=>a.advanceInvoiceId!==source.id||a.agreementId!==source.agreement_id);
  if(amount!==null)applications.push({agreementLabel:source.agreement_label,advanceNumber:source.number,advanceInvoiceId:source.id,agreementId:source.agreement_id,amount,taxGroups:[],sourceCalculation:source.calculation,priorAllocations:source.prior_allocations});
  onChange({...draft,...(!scopes.length&&amount!==null?{billingAgreementId:source.agreement_id,billingTerms:source.terms,billingContext:{procedure:'partial'},positions:draft.positions.map(p=>({...p,billingPart:source.terms?.model==='time'?'time' as const:source.terms?.model==='quantity'?'quantity' as const:p.billingPart}))}:{}),advanceApplications:applications});
 };
 const eligible=(advances.data?.items??[]).filter(a=>a.currency===draft.currency&&(scopes.some(s=>s.agreementId===a.agreement_id&&s.context.procedure!=='advance')||!scopes.length));
 return <>
  {draft.customerId&&<div className="form-grid"><Field label="Auftrag hinzufügen"><DirectorySelect endpoint="/api/projects" customerId={draft.customerId} value={projectId} label="Auftrag hinzufügen" onChange={value=>setProjectId(value)}/></Field><Button variant="secondary" disabled={!project.data?.item||project.loading||Boolean(project.error)} onClick={addProject}><LocalizedText>Übernehmen</LocalizedText></Button></div>}
  {project.error&&<ErrorState onRetry={project.refresh}>{project.error}</ErrorState>}{issue&&<ErrorState><LocalizedText>{issue}</LocalizedText></ErrorState>}
  {draft.billingScopes?.map(scope=><div key={scope.agreementId} className="form-section"><SectionTitle title="Auftrag"/>{scope.label&&<p translate="no">{scope.label}</p>}{scope.conditions&&<DetailDisclosure label="Vereinbarte Konditionen"><p translate="no">{scope.conditions}</p></DetailDisclosure>}{scope.terms&&<BillingContextFields type="Rechnung" draft={{...draft,billingAgreementId:scope.agreementId,advanceApplications:draft.advanceApplications?.filter(a=>a.agreementId===scope.agreementId),billingTerms:scope.terms,billingTemplatePositions:scope.templatePositions,billingContext:scope.context,positions:draft.positions.filter(p=>p.billingAgreementId===scope.agreementId)}} onChange={changed=>onChange({...draft,advanceApplications:[...(draft.advanceApplications??[]).filter(a=>a.agreementId!==scope.agreementId),...(changed.advanceApplications??[])],positions:draft.positions.flatMap((p,index)=>p.billingAgreementId!==scope.agreementId?[p]:index===draft.positions.findIndex(p=>p.billingAgreementId===scope.agreementId)?changed.positions:[]),billingScopes:draft.billingScopes!.map(s=>s.agreementId===scope.agreementId?{...s,context:changed.billingContext??s.context}:s)})}/>}<DiscountFields label="Gesamtrabatt" currency={draft.currency??'CHF'} value={scope.discount??{kind:'none'}} onChange={discount=>onChange({...draft,billingScopes:draft.billingScopes!.map(s=>s.agreementId===scope.agreementId?{...s,discount}:s)})}/></div>)}
  {advances.error&&<ErrorState onRetry={advances.refresh}>{advances.error}</ErrorState>}
  {eligible.length>0&&<section className="form-section"><SectionTitle title="Akonto anrechnen"/>{eligible.map(source=>{const application=draft.advanceApplications?.find(a=>a.advanceInvoiceId===source.id&&a.agreementId===source.agreement_id);const remaining=(Math.round(Number(source.calculation.total)*100)-Math.round(Number(source.allocated_amount)*100)-Math.round(Number(source.credited_amount)*100))/100;return <div key={source.id+source.agreement_id} className="form-grid two"><label className="form-check"><Input type="checkbox" checked={Boolean(application)} disabled={remaining<=0&&!application} onChange={e=>patchApplication(source,e.target.checked?String(remaining):null)}/><span translate="no">{source.number} · {source.agreement_label??''} · {source.currency} {money(remaining,localeTags[locale])}</span></label>{application&&<Field label="Anrechnungsbetrag"><Input inputMode="decimal" value={application.amount} onChange={e=>patchApplication(source,e.target.value.replace(',','.'))}/></Field>}</div>})}</section>}
 </>;
}
