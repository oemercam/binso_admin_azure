"use client";
import {DirectorySelect} from "../directory-select";
import {ContextActions} from "../binso-ux";
import {LocalizedText} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";

import { FinancialSummaryRow, FinanceTabs } from "../document-list";
import { openAmount, formatCurrency, businessDate } from "@/lib/financial-status";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordsView, RecordsControls, useRecordsController } from "../records";
import { appendDemoRow } from "@/lib/demo-storage";
import {useApiQuery} from "@/lib/client/use-api-query";
import { apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { AccessLink, Button, EmptyState, ErrorState, LoadingState, Field, Icon, Status, Toast, Select, Input } from "../ui";
import { CreateAction,FormSheet } from "../binso-ux";
import {useDirtySnapshot} from '../use-dirty-snapshot';
import {allowDraftNavigation} from '../use-browser-back-guard';
import { useRecordList, swissDate, paymentMethodLabel } from "./shared";

export function PaymentsPage() {
  const customerId=useSearchParams().get("customerId");
  const columns:NonNullable<Parameters<typeof useRecordsController>[0]["columns"]>=[{label:"Datum",index:1},{label:"Kunde",index:2},{label:"Referenz",index:3},{label:"Betrag",index:4,align:"right"},{label:"Status",index:5,status:true}];
  const chips=["Alle","Verbucht","Ausstehend"];
  const {rows:paymentRows,total,controller,pagination,loading,error}=useRecordList("payments",{placeholder:"Zahlungen suchen...",chips,columns,sortFields:{1:"paid_on",2:"customer_name",3:"invoice_number",4:"amount",5:"status"},defaultOrder:"paid_on.desc",scope:{customerId},filterValues:{Verbucht:{field:"status",value:"booked"},Ausstehend:{field:"status",value:"pending"}}});
  return <AppShell title="Zahlungen" subtitle={loading?undefined:`${total} Zahlungen`} active="zahlungen" actions={<RecordsControls controller={controller} placeholder="Zahlungen suchen..." chips={chips} columns={columns}><CreateAction href="/zahlungen/neu" label="Zahlung erfassen"/></RecordsControls>}>
    <FinanceTabs/><RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={pagination} countLabel="Zahlungen" loading={loading} error={error} items={paymentRows} placeholder="Zahlungen suchen..." chips={chips} columns={columns} rowHref={row=>`/zahlungen/${row[0]}`}>{([id,date,name,meta,amount,status])=><FinancialSummaryRow href={`/zahlungen/${id}`} title={`${name} · ${date}`} meta={meta} amount={amount} status={status} tone={status==="Verbucht"?"success":"neutral"}/>}</RecordsView>
  </AppShell>;
}

export function PaymentForm() {
  const router=useRouter();
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
  const initialFields=useRef({date,method,note});
  const {dirty,markPristine}=useDirtySnapshot([invoiceId,date,amount,method,note]);
  const production=useBackendMode();
  const [chosenInvoice,setChosenInvoice]=useState<{id:string;number:string;total:number;paid_amount:number;credit_amount:number;refund_amount:number;currency:string;status:string;customer?:{name:string}}|null>(null);
  const {data:invoiceData,error:invoiceError,loading:invoicesLoading}=useApiQuery<{items:Array<{id:string;number:string;total:number;paid_amount:number;currency?:string;status:string;customer?:{name?:string}}> }>(production?"/api/documents?kind=invoice&limit=50"+(sourceInvoice?"&number=eq."+encodeURIComponent(sourceInvoice):"&display_status=eq.open"):"/api/demo/data?collection=documents&kind=invoice");
  const availableInvoices=useMemo(()=>[...(invoiceData?.items??[]),...(chosenInvoice&&!invoiceData?.items.some(item=>item.id===chosenInvoice.id)?[chosenInvoice]:[])].filter(item=>!["draft","cancelled","paid"].includes(item.status)&&openAmount(item)>0) ,[invoiceData,chosenInvoice]);
  useEffect(()=>{if(!sourceInvoice||invoiceId)return;const item=availableInvoices.find(row=>row.number===sourceInvoice);if(item)queueMicrotask(()=>{setInvoiceId(item.id);setAmount(current=>current||String(openAmount(item)));markPristine([item.id,initialFields.current.date,String(openAmount(item)),initialFields.current.method,initialFields.current.note]);});},[sourceInvoice,availableInvoices,invoiceId,markPristine]);
  const selectedInvoice=availableInvoices.find(item=>item.id===invoiceId);
  const returnTo=sourceInvoice?"/rechnungen/"+encodeURIComponent(sourceInvoice):safeAppPath(searchParams.get("returnTo"),"/zahlungen");

  const save=async()=>{
    if(savePending.current)return;
    const value=Number(amount.replace(",","."));
    if(!selectedInvoice||!Number.isFinite(value)||value<=0||value>openAmount(selectedInvoice)){
      setToast("Bitte einen gültigen Betrag erfassen.");
      return;
    }
    savePending.current=true;setSaving(true);setToast(null);
    try{
      if(isProductionBackendEnabled()){
        const key=idempotencyKey||window.crypto.randomUUID();
        if(!idempotencyKey) setIdempotencyKey(key);
        await apiPost("/api/payments",{invoiceId,paidOn:date,amount:value,method,note},{idempotencyKey:key});
      }
      else{
        const id=crypto.randomUUID();
        const displayDate=date.split("-").reverse().join(".");
        appendDemoRow("payments",[id,displayDate,selectedInvoice.customer?.name??"Demo",`${selectedInvoice.number} · ${method}`,`CHF ${value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}`,"Verbucht"]);
      }
      setSaved(true);allowDraftNavigation();setToast("Zahlung gespeichert.");
      window.setTimeout(()=>router.push(returnTo),700);
    }catch(error){
      savePending.current=false;setSaving(false);
      setToast(error instanceof Error?error.message:"Zahlung konnte nicht gespeichert werden.");
    }
  };
  const close=()=>{allowDraftNavigation();router.push(returnTo)};
  return <AppShell editing unsavedChanges={false} title="Zahlung erfassen" active="zahlungen" backHref={returnTo} backLabel="Zahlungen">
    <FormSheet workspace label="Zahlung erfassen" description="Rechnungsdaten werden automatisch übernommen." open onClose={close} busy={saving} dirty={dirty&&!saved} actions={<><Button variant="secondary" onClick={close}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button onClick={save} disabled={saving||!selectedInvoice}><LocalizedText>{saving?"Wird gespeichert…":"Zahlung speichern"}</LocalizedText></Button></>}>
    {toast&&toast!=="Zahlung gespeichert."&&<ErrorState>{toast}</ErrorState>}
    <div className="form-page narrow" inert={saving}>
      <Field label="Rechnung"><DirectorySelect label="Rechnung" required endpoint={production?"/api/documents?kind=invoice&display_status=eq.open":"/api/demo/data?collection=documents&kind=invoice"} value={invoiceId} selectable={item=>!['draft','cancelled','paid'].includes(String(item.status))&&openAmount(item)>0} formatOption={item=>String(item.number)+' · '+String((item.customer as {name?:string})?.name??'')+' · '+formatCurrency(openAmount(item),String(item.currency??'CHF'))} onChange={(value,item)=>{setInvoiceId(value);setIdempotencyKey('');setAmount(item?String(openAmount(item)):'');setChosenInvoice(item?{id:value,number:String(item.number),total:Number(item.total),paid_amount:Number(item.paid_amount),credit_amount:Number(item.credit_amount??0),refund_amount:Number(item.refund_amount??0),currency:String(item.currency??'CHF'),status:String(item.status),customer:item.customer as {name:string}|undefined}:null)}}/></Field>
      {invoiceError&&<ErrorState><LocalizedText>{invoiceError}</LocalizedText></ErrorState>}
      {selectedInvoice&&<p><LocalizedText>{"Offener Betrag: "}</LocalizedText>{formatCurrency(openAmount(selectedInvoice),selectedInvoice.currency)}</p>}
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><Input type="date" value={date} onChange={e=>{setDate(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label={"Zahlungsbetrag "+(selectedInvoice?.currency??"CHF")}><Input inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label="Zahlungsmethode"><Select value={method} onChange={e=>{setMethod(e.target.value);setIdempotencyKey("")}}><option value={"Banküberweisung"}><LocalizedText>{"Banküberweisung"}</LocalizedText></option><option value={"Kreditkarte"}><LocalizedText>{"Kreditkarte"}</LocalizedText></option><option value={"TWINT"}><LocalizedText>{"TWINT"}</LocalizedText></option><option value={"Bar"}><LocalizedText>{"Bar"}</LocalizedText></option></Select></Field>
        <Field label="Notiz"><Input placeholder="Optional" value={note} onChange={e=>{setNote(e.target.value);setIdempotencyKey("")}}/></Field>
      </div>
    </div>
    </FormSheet>
    {toast==="Zahlung gespeichert."&&<Toast title={toast} tone="success"/>}
  </AppShell>;
}

export function PaymentDetail({paymentId="1"}:{paymentId?:string}) {
  const production=useBackendMode();
  const returnTo=safeAppPath(useSearchParams().get("returnTo"),"/zahlungen");
  const {data,error:paymentError}=useApiQuery<{item:Record<string,unknown>}>(production?"/api/payments/"+encodeURIComponent(paymentId):null);
  const payment=data?.item;

  if(!production) return <AppShell title="Zahlung" subtitle="RE-2026-019 · Acme AG" active="zahlungen" backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Zahlungen"}>
    <div className="entity-detail-workspace">

      <div className="desktop-detail-main"><div className="payment-detail-summary"><h2><LocalizedText>{"CHF 4’346.40"}</LocalizedText></h2><Status tone="success"><LocalizedText>{"Verbucht"}</LocalizedText></Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt><LocalizedText>{"Datum"}</LocalizedText></dt><dd>02.10.2026</dd></div><div><dt><LocalizedText>{"Rechnung"}</LocalizedText></dt><dd><LocalizedText>{"RE-2026-019"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Kunde"}</LocalizedText></dt><dd><LocalizedText>{"Acme AG"}</LocalizedText></dd></div><div><dt><LocalizedText>{"Zahlungsart"}</LocalizedText></dt><dd><LocalizedText>{"Banküberweisung"}</LocalizedText></dd></div></dl></section></div>
      <ContextActions><section className="context-action-group"><span className="compact-section-label"><LocalizedText>{"Zugehörig"}</LocalizedText></span><AccessLink href="/rechnungen/RE-2026-019"><Icon name="receipt"/><span><b><LocalizedText>{"Rechnung öffnen"}</LocalizedText></b><small><LocalizedText>{"RE-2026-019"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink><AccessLink href="/kunden/acme"><Icon name="users"/><span><b><LocalizedText>{"Kunde öffnen"}</LocalizedText></b><small><LocalizedText>{"Acme AG"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink></section></ContextActions>
    </div>
  </AppShell>;

  if(!payment) return <AppShell title="Zahlung" subtitle={paymentError?"Zahlung nicht verfügbar":undefined} active="zahlungen" backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Zahlungen"}>{paymentError?<div role="alert"><EmptyState  title="Zahlung konnte nicht geladen werden" description={paymentError}/></div>:<LoadingState/>}{paymentError&&<AccessLink className="button" href="/zahlungen"><LocalizedText>{"Zur Zahlungsübersicht"}</LocalizedText></AccessLink>}</AppShell>;

  const customer=payment.customer as {name?:string}|null|undefined;
  const invoice=payment.invoice as {number?:string;total?:number}|null|undefined;
  const status=String(payment.status??"booked");
  const statusLabel:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
  return <AppShell title="Zahlung" subtitle={[invoice?.number,customer?.name].filter(Boolean).join(" · ")} active="zahlungen" backHref={returnTo} backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Zahlungen"}>
    <div className="entity-detail-workspace">

      <div className="desktop-detail-main"><div className="payment-detail-summary"><h2>{formatCurrency(Number(payment.amount??0),String(payment.currency??"CHF"))}</h2><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}><LocalizedText>{statusLabel[status]??status}</LocalizedText></Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt><LocalizedText>{"Datum"}</LocalizedText></dt><dd>{swissDate(payment.paid_on)}</dd></div><div><dt><LocalizedText>{"Rechnung"}</LocalizedText></dt><dd>{invoice?.number?<AccessLink fallback={invoice.number} href={"/rechnungen/"+encodeURIComponent(invoice.number)}>{invoice.number}</AccessLink>:(invoice?.number??"—")}</dd></div><div><dt><LocalizedText>{"Kunde"}</LocalizedText></dt><dd>{payment.customer_id?<AccessLink fallback={customer?.name??"Kunde"} href={"/kunden/"+encodeURIComponent(String(payment.customer_id))}><LocalizedText verbatim={!!customer?.name}>{customer?.name??"Kunde"}</LocalizedText></AccessLink>:(customer?.name??"—")}</dd></div><div><dt><LocalizedText>{"Zahlungsart"}</LocalizedText></dt><dd>{paymentMethodLabel(payment.method)}</dd></div>{Boolean(payment.note)&&<div><dt><LocalizedText>{/^RF[- ]/i.test(String(payment.note))?"Referenz":"Notiz"}</LocalizedText></dt><dd>{String(payment.note).replace(/DEMO-/gi,"")}</dd></div>}</dl></section></div>
      <ContextActions><section className="context-action-group"><span className="compact-section-label"><LocalizedText>{"Zugehörig"}</LocalizedText></span>{invoice?.number&&<AccessLink href={"/rechnungen/"+encodeURIComponent(invoice.number)}><Icon name="receipt"/><span><b><LocalizedText>{"Rechnung öffnen"}</LocalizedText></b><small>{invoice.number}</small></span><Icon name="arrow" size={15}/></AccessLink>}<AccessLink href={payment.customer_id?"/kunden/"+encodeURIComponent(String(payment.customer_id)):"/kunden"}><Icon name="users"/><span><b><LocalizedText>{payment.customer_id?"Kunde öffnen":"Kundenübersicht"}</LocalizedText></b><small><LocalizedText verbatim={!!customer?.name}>{customer?.name??"Kunde"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink><AccessLink href="/zahlungen"><Icon name="wallet"/><span><b><LocalizedText>{"Alle Zahlungen"}</LocalizedText></b><small><LocalizedText>{"Zahlungsverlauf öffnen"}</LocalizedText></small></span><Icon name="arrow" size={15}/></AccessLink></section></ContextActions>
    </div>
  </AppShell>;
}
