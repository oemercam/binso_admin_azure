"use client";

import { FinancialSummaryRow, FinanceTabs } from "../document-list";
import { openAmount, formatCurrency, businessDate } from "@/lib/financial-status";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordsView } from "../records";
import { payments } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiGet, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { AccessLink, Button, EmptyState, Field, Icon, Status, Toast, Select, Input, FormActions } from "../ui";
import { CreateAction } from "../binso-ux";
import { useDemoRows, swissDate, paymentMethodLabel } from "./shared";

export function PaymentsPage() {
  const {rows:paymentRows,loading,error}=useDemoRows("payments",payments);
  return <AppShell title="Zahlungen" subtitle="Erfasste Zahlungseingänge übersichtlich verwalten." active="zahlungen" actions={<CreateAction href="/zahlungen/neu" label="Zahlung erfassen"/>}>
    <FinanceTabs/><RecordsView countLabel="Zahlungen" loading={loading} error={error} items={paymentRows} placeholder="Zahlungen suchen..." chips={["Alle","Verbucht","Storniert"]} columns={[{label:"Datum",index:1},{label:"Kunde",index:2},{label:"Referenz / Art",index:3},{label:"Betrag",index:4,align:"right"},{label:"Status",index:5,status:true}]} rowHref={row=>`/zahlungen/${row[0]}`}>{([id,date,name,meta,amount,status])=><FinancialSummaryRow href={`/zahlungen/${id}`} title={`${name} · ${date}`} meta={meta} amount={amount} status={status} tone={status==="Verbucht"?"success":"neutral"}/>}</RecordsView>
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
  const [availableInvoices,setAvailableInvoices]=useState<Array<{id:string;number:string;total:number;paid_amount:number;currency?:string;customer?:{name?:string}}>>([]);
  useEffect(()=>{apiGet<{items:Array<{id:string;number:string;total:number;paid_amount:number;currency?:string;status:string;customer?:{name?:string}}> }>(isProductionBackendEnabled()?"/api/documents?kind=invoice":"/api/demo/data?collection=documents&kind=invoice").then(data=>setAvailableInvoices(data.items.filter(item=>!["draft","cancelled","paid"].includes(item.status)&&Number(item.total)>Number(item.paid_amount)))).catch(()=>setToast("Rechnungen konnten nicht geladen werden."));},[]);
  useEffect(()=>{if(!sourceInvoice)return;const item=availableInvoices.find(row=>row.number===sourceInvoice);if(item)queueMicrotask(()=>{setInvoiceId(item.id);setAmount(String(openAmount(item)));});},[sourceInvoice,availableInvoices]);
  const selectedInvoice=availableInvoices.find(item=>item.id===invoiceId);
  const returnTo=sourceInvoice?"/rechnungen/"+encodeURIComponent(sourceInvoice):"/zahlungen";

  const save=async()=>{
    if(savePending.current)return;
    const value=Number(amount.replace(",","."));
    if(!selectedInvoice||!Number.isFinite(value)||value<=0||value>openAmount(selectedInvoice)){
      setToast("Bitte einen gültigen Betrag erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    savePending.current=true;setSaving(true);
    try{
      if(isProductionBackendEnabled()){
        const key=idempotencyKey||window.crypto.randomUUID();
        if(!idempotencyKey) setIdempotencyKey(key);
        await apiPost("/api/payments",{invoiceId,paidOn:date,amount:value,method,note},{idempotencyKey:key});
      }
      else{
        const id=String(Date.now());
        const displayDate=date.split("-").reverse().join(".");
        appendDemoRow("payments",[id,displayDate,selectedInvoice.customer?.name??"Demo",`${selectedInvoice.number} · ${method}`,`CHF ${value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2})}`,"Verbucht"]);
      }
      setSaved(true);setToast("Zahlung gespeichert.");
      window.setTimeout(()=>router.push(returnTo),700);
    }catch(error){
      savePending.current=false;setSaving(false);
      setToast(error instanceof Error?error.message:"Zahlung konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };
  return <AppShell unsavedChanges={saved?false:undefined} title="Zahlung erfassen" subtitle="Rechnungsdaten werden automatisch übernommen." active="zahlungen" backHref={returnTo} backLabel={sourceInvoice?"Rechnung":"Zahlungen"} actions={<Button onClick={save} disabled={saving||!selectedInvoice}>{saving?"Wird gespeichert…":"Zahlung speichern"}</Button>}>
    <div className="form-page narrow" inert={saving}>
      <Field label="Rechnung"><Select value={invoiceId} onChange={e=>{setInvoiceId(e.target.value);setIdempotencyKey("");const item=availableInvoices.find(x=>x.id===e.target.value);setAmount(item?String(openAmount(item)):"")}}><option value="">Rechnung auswählen</option>{availableInvoices.map(item=><option key={item.id} value={item.id}>{item.number} · {item.customer?.name} · {formatCurrency(openAmount(item),item.currency)}</option>)}</Select></Field>
      {selectedInvoice&&<p>Offener Betrag: {formatCurrency(openAmount(selectedInvoice),selectedInvoice.currency)}</p>}
      <div className="form-grid two">
        <Field label="Zahlungsdatum"><Input type="date" value={date} onChange={e=>{setDate(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label={"Zahlungsbetrag "+(selectedInvoice?.currency??"CHF")}><Input inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setIdempotencyKey("")}}/></Field>
        <Field label="Zahlungsmethode"><Select value={method} onChange={e=>{setMethod(e.target.value);setIdempotencyKey("")}}><option>Banküberweisung</option><option>Kreditkarte</option><option>TWINT</option><option>Bar</option></Select></Field>
        <Field label="Notiz"><Input placeholder="Optional" value={note} onChange={e=>{setNote(e.target.value);setIdempotencyKey("")}}/></Field>
      </div>
      <FormActions ><Button onClick={save} disabled={saving||!selectedInvoice}>{saving?"Wird gespeichert…":"Zahlung speichern"}</Button></FormActions>
    </div>
    {toast&&<Toast title={toast} tone={toast==="Zahlung gespeichert."?"success":"danger"}/>}
  </AppShell>;
}

export function PaymentDetail({paymentId="1"}:{paymentId?:string}) {
  const production=useBackendMode();
  const [payment,setPayment]=useState<Record<string,unknown>|null>(null);
  const [paymentError,setPaymentError]=useState<string|null>(null);

  useEffect(()=>{
    if(!production) return;
    apiGet<{item:Record<string,unknown>}>("/api/payments/"+encodeURIComponent(paymentId))
      .then(payload=>queueMicrotask(()=>setPayment(payload.item)))
      .catch(error=>setPaymentError(error instanceof Error?error.message:"Zahlung konnte nicht geladen werden."));
  },[production,paymentId]);

  if(!production) return <AppShell title="Zahlung" subtitle="RE-2026-019 · Acme AG" active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="entity-detail-workspace">

      <div className="desktop-detail-main"><div className="payment-detail-summary"><h2>CHF 4’346.40</h2><Status tone="success">Verbucht</Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>02.10.2026</dd></div><div><dt>Rechnung</dt><dd>RE-2026-019</dd></div><div><dt>Kunde</dt><dd>Acme AG</dd></div><div><dt>Zahlungsart</dt><dd>Banküberweisung</dd></div></dl></section></div>
      <aside className="desktop-context-rail"><section className="desktop-toolbox"><span className="compact-section-label">Zugehörig</span><AccessLink href="/rechnungen/RE-2026-019"><Icon name="receipt"/><span><b>Rechnung öffnen</b><small>RE-2026-019</small></span><Icon name="arrow" size={15}/></AccessLink><AccessLink href="/kunden/acme"><Icon name="users"/><span><b>Kunde öffnen</b><small>Acme AG</small></span><Icon name="arrow" size={15}/></AccessLink></section></aside>
    </div>
  </AppShell>;

  if(!payment) return <AppShell title="Zahlung" subtitle={paymentError?"Zahlung nicht verfügbar":"Daten werden geladen."} active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen"><div role={paymentError?"alert":"status"}><EmptyState icon="wallet" title={paymentError?"Zahlung konnte nicht geladen werden":"Zahlung wird geladen"} text={paymentError??"Die Zahlungsdaten werden abgerufen."}/></div>{paymentError&&<AccessLink className="button" href="/zahlungen">Zur Zahlungsübersicht</AccessLink>}</AppShell>;

  const customer=payment.customer as {name?:string}|null|undefined;
  const invoice=payment.invoice as {number?:string;total?:number}|null|undefined;
  const status=String(payment.status??"booked");
  const statusLabel:Record<string,string>={pending:"Ausstehend",booked:"Verbucht",reversed:"Storniert"};
  return <AppShell title="Zahlung" subtitle={[invoice?.number,customer?.name].filter(Boolean).join(" · ")} active="zahlungen" backHref="/zahlungen" backLabel="Zahlungen">
    <div className="entity-detail-workspace">

      <div className="desktop-detail-main"><div className="payment-detail-summary"><h2>{formatCurrency(Number(payment.amount??0),String(payment.currency??"CHF"))}</h2><Status tone={status==="booked"?"success":status==="reversed"?"danger":"warning"}>{statusLabel[status]??status}</Status></div>
      <section className="surface detail-card"><dl className="detail-list"><div><dt>Datum</dt><dd>{swissDate(payment.paid_on)}</dd></div><div><dt>Rechnung</dt><dd>{invoice?.number?<AccessLink fallback={invoice.number} href={"/rechnungen/"+encodeURIComponent(invoice.number)}>{invoice.number}</AccessLink>:(invoice?.number??"—")}</dd></div><div><dt>Kunde</dt><dd>{payment.customer_id?<AccessLink fallback={customer?.name??"Kunde"} href={"/kunden/"+encodeURIComponent(String(payment.customer_id))}>{customer?.name??"Kunde"}</AccessLink>:(customer?.name??"—")}</dd></div><div><dt>Zahlungsart</dt><dd>{paymentMethodLabel(payment.method)}</dd></div>{Boolean(payment.note)&&<div><dt>{/^RF[- ]/i.test(String(payment.note))?"Referenz":"Notiz"}</dt><dd>{String(payment.note).replace(/DEMO-/gi,"")}</dd></div>}</dl></section></div>
      <aside className="desktop-context-rail"><section className="desktop-toolbox"><span className="compact-section-label">Zugehörig</span>{invoice?.number&&<AccessLink href={"/rechnungen/"+encodeURIComponent(invoice.number)}><Icon name="receipt"/><span><b>Rechnung öffnen</b><small>{invoice.number}</small></span><Icon name="arrow" size={15}/></AccessLink>}<AccessLink href={payment.customer_id?"/kunden/"+encodeURIComponent(String(payment.customer_id)):"/kunden"}><Icon name="users"/><span><b>{payment.customer_id?"Kunde öffnen":"Kundenübersicht"}</b><small>{customer?.name??"Kunde"}</small></span><Icon name="arrow" size={15}/></AccessLink><AccessLink href="/zahlungen"><Icon name="wallet"/><span><b>Alle Zahlungen</b><small>Zahlungsverlauf öffnen</small></span><Icon name="arrow" size={15}/></AccessLink></section></aside>
    </div>
  </AppShell>;
}
