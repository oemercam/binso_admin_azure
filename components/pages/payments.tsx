"use client";
import {DirectorySelect} from "../directory-select";
import {ContextActions} from "../binso-ux";
import {localeTags} from '@/lib/locales/config';
import {LocalizedText,useTranslation,useLocale} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";

import { FinancialSummaryRow, FinanceTabs } from "../document-list";
import { openAmount, formatCurrency, businessDate, financialStatus, financialStatusText, paymentEntryIssue, paymentBalance, samePaymentBalance, type PaymentBalanceReview } from "@/lib/financial-status";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordsView, RecordsControls, useRecordsController } from "../records";
import {useCustomerScope} from "@/lib/client/customer-scope";
import {useApiQuery} from "@/lib/client/use-api-query";
import { apiPost, ClientApiError, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { AccessLink, Button, Checkbox, EmptyState, ErrorState, LoadingState, Field, Icon, Status, Toast, Select, Input } from "../ui";
import { CreateAction,FormSheet } from "../binso-ux";
import {useDirtySnapshot} from '../use-dirty-snapshot';
import {allowDraftNavigation} from '../use-browser-back-guard';
import { useRecordList, swissDate, paymentMethodLabel } from "./shared";

export function PaymentsPage() {
  const customerScope=useCustomerScope();
  const customerId=customerScope.customerId;
  const columns:NonNullable<Parameters<typeof useRecordsController>[0]["columns"]>=[{label:"Datum",index:1},{label:"Kunde",index:2},{label:"Referenz",index:3},{label:"Betrag",index:4,align:"right"},{label:"Status",index:5,status:true}];
  const chips=["Alle","Verbucht","Ausstehend"];
  const {rows:paymentRows,total,controller,pagination,loading,error}=useRecordList("payments",{placeholder:"Zahlungen suchen...",chips,columns,sortFields:{1:"paid_on",2:"customer_name",3:"invoice_number",4:"amount",5:"status"},defaultOrder:"paid_on.desc",scope:{customerId},filterValues:{Verbucht:{field:"status",value:"booked"},Ausstehend:{field:"status",value:"pending"}}});
  return <AppShell title="Zahlungen" backHref={customerScope.returnTo} subtitle={loading?undefined:`${total} Zahlungen`} active="zahlungen" actions={<RecordsControls scope={customerScope.scope} controller={controller} placeholder="Zahlungen suchen..." chips={chips} columns={columns}><CreateAction href="/zahlungen/neu" label="Zahlung erfassen"/></RecordsControls>}>
    <RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={pagination} countLabel="Zahlungen" loading={loading} error={error} items={paymentRows} placeholder="Zahlungen suchen..." chips={chips} columns={columns} rowHref={row=>customerScope.detailHref(`/zahlungen/${row[0]}`)}>{([id,date,name,meta,amount,status])=><FinancialSummaryRow href={customerScope.detailHref(`/zahlungen/${id}`)} title={`${name} · ${date}`} meta={meta} amount={amount} status={status} tone={status==="Verbucht"?"success":"neutral"}/>}</RecordsView>
  </AppShell>;
}

export function PaymentForm() {
  const router=useRouter();
  const t=useTranslation();
  const searchParams=useSearchParams();
  const sourceInvoice=searchParams.get("invoice");
  const [saving,setSaving]=useState(false);
  const [saved,setSaved]=useState(false);
  const savePending=useRef(false);
  const [toast,setToast]=useState<string|null>(null);
  const [date,setDate]=useState(()=>businessDate());
  const [amount,setAmount]=useState("");
  const [method,setMethod]=useState("Banküberweisung");
  const [idempotencyKey,setIdempotencyKey]=useState("");
  const [invoiceId,setInvoiceId]=useState("");
  const [note,setNote]=useState("");
  const [overpaymentReview,setOverpaymentReview]=useState<{invoiceId:string;amount:number;balance:PaymentBalanceReview}|null>(null);
  const initialFields=useRef({date,method,note});
  const {dirty,markPristine}=useDirtySnapshot([invoiceId,date,amount,method,note]);

  const [chosenNumber,setChosenNumber]=useState<string|null>(null),selectedNumber=chosenNumber??sourceInvoice;
  const invoiceQuery=useApiQuery<{item:{id:string;number:string;kind:string;total:number;paid_amount:number;credit_amount:number;refund_amount:number;currency:string;status:string;customer?:{name:string};[key:string]:unknown}}>(selectedNumber?'/api/documents/'+encodeURIComponent(selectedNumber):null);
  const candidate=invoiceQuery.data?.item,validInvoice=candidate?.kind==='invoice'&&!['draft','cancelled'].includes(candidate.status);
  const invoiceError=invoiceQuery.error||(invoiceQuery.data&&!validInvoice?t('Bitte eine ausgestellte Rechnung auswählen.'):null);
  useEffect(()=>{if(!sourceInvoice||invoiceId||!candidate||!validInvoice)return;const item=candidate,initialAmount=openAmount(item)>0?String(openAmount(item)):'';queueMicrotask(()=>{setInvoiceId(item.id);setAmount(current=>current||initialAmount);markPristine([item.id,initialFields.current.date,initialAmount,initialFields.current.method,initialFields.current.note]);});},[sourceInvoice,candidate,validInvoice,invoiceId,markPristine]);
  const selectedInvoice=validInvoice&&candidate?.id===invoiceId?candidate:null;
  const numericAmount=Number(amount.replace(',','.')),remaining=selectedInvoice?openAmount(selectedInvoice):0;
  const overpayment=Number.isFinite(numericAmount)?Math.max(0,Math.round((numericAmount-remaining)*100)/100):0;
  const overpaymentConfirmed=!!overpaymentReview&&overpaymentReview.invoiceId===invoiceId&&overpaymentReview.amount===numericAmount&&!!selectedInvoice&&samePaymentBalance(overpaymentReview.balance,paymentBalance(selectedInvoice));
  const returnTo=sourceInvoice?"/rechnungen/"+encodeURIComponent(sourceInvoice):safeAppPath(searchParams.get("returnTo"),"/zahlungen");

  const save=async()=>{
    if(savePending.current)return;
    const value=Number(amount.replace(",","."));
    if(!selectedInvoice||paymentEntryIssue(value,remaining,overpaymentConfirmed,overpaymentReview?.balance.openAmount)){
      setToast(overpayment>0?"Bitte die tatsächlich eingegangene Überzahlung bestätigen.":"Bitte einen gültigen Betrag erfassen.");
      return;
    }
    savePending.current=true;setSaving(true);setToast(null);
    try{
      {
        const key=idempotencyKey||window.crypto.randomUUID();
        if(!idempotencyKey) setIdempotencyKey(key);
        await apiPost("/api/payments",{invoiceId,paidOn:date,amount:value,method,note,...(overpaymentConfirmed?{confirmOverpayment:true,expectedBalance:overpaymentReview.balance}:{})},{idempotencyKey:key});
      }
      setSaved(true);allowDraftNavigation();setToast("Zahlung gespeichert.");
      window.setTimeout(()=>router.push(returnTo),700);
    }catch(error){
      savePending.current=false;setSaving(false);
      if(error instanceof ClientApiError&&error.code==='payment_balance_changed'){setOverpaymentReview(null);void invoiceQuery.refresh();}
      setToast(error instanceof Error?error.message:"Zahlung konnte nicht gespeichert werden.");
    }
  };
  const close=()=>{allowDraftNavigation();router.push(returnTo)};
  return <AppShell editing unsavedChanges={false} title="Zahlung erfassen" active="zahlungen" backHref={returnTo} backLabel="Zahlungen">
    <FormSheet workspace label="Zahlung erfassen" description="Rechnungsdaten werden automatisch übernommen." open onClose={close} busy={saving} dirty={dirty&&!saved} actions={<><Button variant="secondary" onClick={close}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button onClick={save} disabled={saving||!selectedInvoice||overpayment>0&&!overpaymentConfirmed}><LocalizedText>{saving?"Wird gespeichert…":"Zahlung speichern"}</LocalizedText></Button></>}>
    {toast&&toast!=="Zahlung gespeichert."&&<ErrorState>{toast}</ErrorState>}
    <div className="form-page narrow" inert={saving}>
      <Field label="Rechnung"><DirectorySelect label="Rechnung" emptyResultLabel="Keine ausgestellte Rechnung verfügbar" emptyHref="/rechnungen" emptyAction="Rechnungen öffnen" required disabled={!!sourceInvoice&&invoiceQuery.loading} endpoint={"/api/documents?kind=invoice&payment_candidates=1"} value={invoiceId} selectedItem={selectedInvoice??undefined} selectable={item=>!['draft','cancelled'].includes(String(item.status))} formatOption={item=>String(item.number)+' · '+String((item.customer as {name?:string})?.name??'')+' · '+(openAmount(item)>0?formatCurrency(openAmount(item),String(item.currency??'CHF')):t(financialStatusText(financialStatus({...item,kind:'invoice'}),'invoice')))} onChange={(value,item)=>{setInvoiceId(value);setIdempotencyKey('');setOverpaymentReview(null);setAmount(item&&openAmount(item)>0?String(openAmount(item)):'');setChosenNumber(item?String(item.number):null)}}/></Field>
      {invoiceError&&<ErrorState onRetry={invoiceQuery.refresh}><LocalizedText>{invoiceError}</LocalizedText></ErrorState>}
      {selectedInvoice&&<p><LocalizedText>{"Offener Betrag: "}</LocalizedText>{formatCurrency(openAmount(selectedInvoice),selectedInvoice.currency)}</p>}
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><Input type="date" max={businessDate()} value={date} onChange={e=>{setDate(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label={"Zahlungsbetrag "+(selectedInvoice?.currency??"CHF")}><Input inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label="Zahlungsmethode"><Select value={method} onChange={e=>{setMethod(e.target.value);setIdempotencyKey("")}}><option value={"Banküberweisung"}><LocalizedText>{"Banküberweisung"}</LocalizedText></option><option value={"Kreditkarte"}><LocalizedText>{"Kreditkarte"}</LocalizedText></option><option value={"TWINT"}><LocalizedText>{"TWINT"}</LocalizedText></option><option value={"Bar"}><LocalizedText>{"Bar"}</LocalizedText></option></Select></Field>
        <Field label="Notiz"><Input placeholder="Optional" value={note} onChange={e=>{setNote(e.target.value);setIdempotencyKey("")}}/></Field>
      </div>
      {selectedInvoice&&overpayment>0&&<><p><LocalizedText>Zusätzliches Kundenguthaben</LocalizedText>: {formatCurrency(overpayment,selectedInvoice.currency)}</p><Field label="Tatsächliche Überzahlung bestätigen"><Checkbox checked={overpaymentConfirmed} onChange={event=>{setOverpaymentReview(event.target.checked?{invoiceId,amount:numericAmount,balance:paymentBalance(selectedInvoice)}:null);setIdempotencyKey('');}}/></Field><p><LocalizedText>Nur einen tatsächlich eingegangenen Betrag erfassen. Das zusätzliche Guthaben wird nicht als Umsatz gezählt. Es wird keine Bankzahlung ausgelöst.</LocalizedText></p></>}
    </div>
    </FormSheet>
    {toast==="Zahlung gespeichert."&&<Toast title={toast} tone="success"/>}
  </AppShell>;
}

export function PaymentDetail({paymentId="1"}:{paymentId?:string}) {
  const {locale}=useLocale();

  const returnTo=safeAppPath(useSearchParams().get("returnTo"),"/zahlungen");
  const {data,error:paymentError}=useApiQuery<{item:Record<string,unknown>}>("/api/payments/"+encodeURIComponent(paymentId));
  const payment=data?.item;

  {}

  if(!payment) return <AppShell title="Zahlung" subtitle={paymentError?"Zahlung nicht verfügbar":undefined} active="zahlungen" backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Zahlungen"}>{paymentError?<div role="alert"><EmptyState  title="Zahlung konnte nicht geladen werden" description={paymentError}/></div>:<LoadingState/>}{paymentError&&<AccessLink className="button" href="/zahlungen"><LocalizedText>{"Zur Zahlungsübersicht"}</LocalizedText></AccessLink>}</AppShell>;

  const customer=payment.customer as {name?:string}|null|undefined;
  const invoice=payment.invoice as {number?:string;total?:number}|null|undefined;
  const status=String(payment.status??"booked");
  const statusLabel:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
  return <AppShell title="Zahlung" subtitle={[invoice?.number,customer?.name].filter(Boolean).join(" · ")} active="zahlungen" backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Zahlungen"}>
    <div className="entity-detail-workspace">

      <div className="desktop-detail-main"><div className="payment-detail-summary"><h2>{formatCurrency(Number(payment.amount??0),String(payment.currency??"CHF"),localeTags[locale])}</h2><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}><LocalizedText>{statusLabel[status]??status}</LocalizedText></Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt><LocalizedText>{"Datum"}</LocalizedText></dt><dd>{swissDate(payment.paid_on,localeTags[locale])}</dd></div><div><dt><LocalizedText>{"Rechnung"}</LocalizedText></dt><dd>{invoice?.number?<AccessLink fallback={invoice.number} href={"/rechnungen/"+encodeURIComponent(invoice.number)}>{invoice.number}</AccessLink>:(invoice?.number??"—")}</dd></div><div><dt><LocalizedText>{"Kunde"}</LocalizedText></dt><dd>{payment.customer_id?<AccessLink fallback={customer?.name??"Kunde"} href={"/kunden/"+encodeURIComponent(String(payment.customer_id))}><LocalizedText verbatim={!!customer?.name}>{customer?.name??"Kunde"}</LocalizedText></AccessLink>:(customer?.name??"—")}</dd></div><div><dt><LocalizedText>{"Zahlungsart"}</LocalizedText></dt><dd><LocalizedText>{paymentMethodLabel(payment.method)}</LocalizedText></dd></div>{Boolean(payment.note)&&<div><dt><LocalizedText>{/^RF[- ]/i.test(String(payment.note))?"Referenz":"Notiz"}</LocalizedText></dt><dd>{String(payment.note).replace(/DEMO-/gi,"")}</dd></div>}</dl></section></div>
      <ContextActions><section className="context-action-group"><span className="compact-section-label"><LocalizedText>{"Zugehörig"}</LocalizedText></span>{invoice?.number&&<AccessLink href={"/rechnungen/"+encodeURIComponent(invoice.number)}><Icon name="receipt"/><span><b><LocalizedText>{"Rechnung öffnen"}</LocalizedText></b><small>{invoice.number}</small></span><Icon name="arrow" size={15}/></AccessLink>}<AccessLink href={payment.customer_id?"/kunden/"+encodeURIComponent(String(payment.customer_id)):"/kunden"}><Icon name="users"/><span><b><LocalizedText>{payment.customer_id?"Kunde öffnen":"Kundenübersicht"}</LocalizedText></b><small><LocalizedText verbatim={!!customer?.name}>{customer?.name??"Kunde"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink><AccessLink href="/zahlungen"><Icon name="wallet"/><span><b><LocalizedText>{"Alle Zahlungen"}</LocalizedText></b><small><LocalizedText>{"Zahlungsverlauf öffnen"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink></section></ContextActions>
    </div>
  </AppShell>;
}
