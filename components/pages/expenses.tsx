"use client";
import {ActionSheet,FormSheet} from "../binso-ux";

import { businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useDialogFocus } from "../use-dialog-focus";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView } from "../records";
import { expenses } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, Field, Icon, Toast, Input, Select, Textarea, FormActions } from "../ui";
import { CreateAction } from "../binso-ux";
import { useDemoRows } from "./shared";

export function ExpensesPage() {
  const {rows:expenseRows,loading,error}=useDemoRows("expenses",expenses);
  return <AppShell title="Spesen" subtitle="Quittungen erfassen, prüfen und freigeben." active="spesen" actions={<CreateAction href="/spesen/neu" label="Spese erfassen"/>}>
    <RecordsView countLabel="Spesen" loading={loading} error={error} items={expenseRows} placeholder="Spesen suchen..." chips={["Alle","Entwurf","Eingereicht","Genehmigt","Verbucht","Abgelehnt"]} columns={[{label:"Spese",index:0},{label:"Mitarbeiter",index:1},{label:"Betrag",index:2,align:"right"},{label:"Status",index:4,status:true}]} rowHref={row=>`/spesen/${row[4]?row[3]:"1"}`}>{(row)=>{const [title,person,amount,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"1";const status=statusMaybe??idOrStatus;return <RecordRow href={"/spesen/"+id} icon="card" title={title} meta={person} value={amount} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ExpenseForm({ existing = false, expenseId }: { existing?: boolean; expenseId?: string }) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const production=useBackendMode();
  const [person,setPerson]=useState(existing?"":searchParams.get("employeeId")??"");
  const [availableEmployees,setAvailableEmployees]=useState<Array<{id:string;first_name:string;last_name:string}>>([]);
  const [date,setDate]=useState(()=>businessDate());
  const [category,setCategory]=useState(existing?"Reise":"Reise");
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState("CHF");
  const [vatRate,setVatRate]=useState("8.1");
  const [merchant,setMerchant]=useState("");
  const [description,setDescription]=useState("");
  const [scanState,setScanState]=useState<"idle"|"scanning"|"done"|"error">("idle");
  const [scanConfidence,setScanConfidence]=useState<number|null>(null);
  const [status,setStatus]=useState(existing?"Eingereicht":"Eingereicht");
  const [canApproveExpense,setCanApproveExpense]=useState(false);
  useEffect(()=>{apiGet<{tenant?:{role?:string}}>("/api/auth/session").then(data=>setCanApproveExpense(["owner","admin","project_manager","manager"].includes(data.tenant?.role??""))).catch(()=>undefined);},[]);
  const [expenseCustomer,setExpenseCustomer]=useState("");
  const [expenseBillable,setExpenseBillable]=useState(false);
  const [expenseCustomers,setExpenseCustomers]=useState<Array<{id:string;name:string}>>([]);
  const [reimbursedAt,setReimbursedAt]=useState<string|null>(null),[reimbursementRef,setReimbursementRef]=useState("");
  const [invoicedId,setInvoicedId]=useState<string|null>(null),[canFinanceExpense,setCanFinanceExpense]=useState(false);
  const [createdExpenseId,setCreatedExpenseId]=useState(expenseId??"");
  const expenseRequestKey=useRef("");
  const expenseMutationPending=useRef(false);
  const receiptScanPending=useRef(false);
  const [editedExpense,setEditedExpense]=useState(false);
  const [savedExpense,setSavedExpense]=useState(false);
  const [expenseFiles,setExpenseFiles]=useState<Array<{id:string;fileName:string}>>([]);
  const [expenseBusy,setExpenseBusy]=useState(false),[reimbursementOpen,setReimbursementOpen]=useState(false);
  const [loadingExpense,setLoadingExpense]=useState(existing);
  const [expenseLoadError,setExpenseLoadError]=useState<string|null>(null);
  useEffect(()=>{apiGet<{tenant?:{role?:string}}>("/api/auth/session").then(s=>setCanFinanceExpense(["owner","admin","finance"].includes(s.tenant?.role??""))).catch(()=>{});apiGet<{items:Array<{id:string;name:string}>}>("/api/customers").then(s=>setExpenseCustomers(s.items)).catch(()=>{});},[]);
  const [persistedExpenseStatus,setPersistedExpenseStatus]=useState('');
  const lockedExpense=['approved','posted'].includes(persistedExpenseStatus);
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{if(!expenseId)return;apiGet<{items:typeof expenseFiles}>("/api/files?expenseId="+encodeURIComponent(expenseId)).then(s=>setExpenseFiles(s.items)).catch(()=>setToast('Quittungen konnten nicht geladen werden.'));},[expenseId]);

  useEffect(()=>{apiGet<{items:typeof availableEmployees}>(isProductionBackendEnabled()?"/api/expenses/options":"/api/demo/data?collection=employees").then(data=>setAvailableEmployees(data.items)).catch(()=>setToast("Mitarbeiter konnten nicht geladen werden."));},[]);

  useEffect(()=>{
    if(!existing||!expenseId) return;
    apiGet<{item?:Record<string,unknown>;items?:Record<string,unknown>[]}>(isProductionBackendEnabled()?"/api/expenses/"+encodeURIComponent(expenseId):"/api/demo/data?collection=expenses&id="+encodeURIComponent(expenseId)).then(payload=>{
      const item=payload.item??payload.items?.[0];
      if(!item)throw new Error("Spese wurde nicht gefunden.");
      queueMicrotask(()=>{
        setPersistedExpenseStatus(String(item.status));setPerson(String(item.employee_id??""));setExpenseCustomer(String(item.customer_id??""));setExpenseBillable(item.billable===true);setReimbursedAt(item.reimbursed_at?String(item.reimbursed_at):null);setReimbursementRef(String(item.reimbursement_reference??""));setInvoicedId(item.invoiced_invoice_id?String(item.invoiced_invoice_id):null);
        setDate(String(item.expense_date??"").slice(0,10));
        setCategory(({travel:"Reise",expense:"Verpflegung",material:"Material",other:"Sonstiges"} as Record<string,string>)[String(item.category)]??String(item.category??"Reise"));
        setAmount(Number(item.amount??0).toFixed(2));
        setCurrency(String(item.currency??"CHF"));
        setVatRate(String(item.vat_rate??"8.1"));
        setMerchant(String(item.merchant??""));
        setDescription(String(item.description??""));
        const map:Record<string,string>={draft:"Entwurf",submitted:"Eingereicht",approved:"Genehmigt",posted:"Verbucht",rejected:"Abgelehnt"};
        setStatus(map[String(item.status)]??"Eingereicht");
      });
    }).catch(error=>setExpenseLoadError(error instanceof Error?error.message:"Spese konnte nicht geladen werden.")).finally(()=>setLoadingExpense(false));
  },[production,existing,expenseId]);

  const scanReceipt=async(file:File|null)=>{
    if(receiptScanPending.current||expenseMutationPending.current||lockedExpense||!file)return;
    receiptScanPending.current=true;setEditedExpense(true);setReceiptFile(file);setScanState("scanning");
    try{
      if(production){
        const form=new FormData();form.append("file",file);
        const result=await apiUpload<{merchant?:string;date?:string;total?:number;currency?:string;confidence?:number;filename?:string}>("/api/expenses/scan-receipt",form);
        if(result.merchant)setMerchant(result.merchant);if(result.date)setDate(result.date);if(typeof result.total==="number")setAmount(result.total.toFixed(2));if(result.currency)setCurrency(result.currency);setScanConfidence(result.confidence??null);
        if(result.filename)setReceiptFile(new File([file],result.filename,{type:file.type,lastModified:file.lastModified}));
      }else{
        setMerchant("SBB CFF FFS");setDate(new Date().toLocaleDateString("en-CA"));setAmount("89.00");setCurrency("CHF");setVatRate("8.1");setScanConfidence(.96);
        const ext=(file.name.split(".").pop()||"jpg").toLowerCase();setReceiptFile(new File([file],`${new Date().toLocaleDateString("en-CA")}_SBB-CFF-FFS_89.00-CHF.${ext}`,{type:file.type,lastModified:file.lastModified}));
      }
      setScanState("done");
    }catch(error){setScanState("error");setToast(error instanceof Error?error.message:"Beleg konnte nicht erkannt werden.");window.setTimeout(()=>setToast(null),2800)}finally{receiptScanPending.current=false;}
  };

  const save=async()=>{
    if(expenseMutationPending.current||receiptScanPending.current||lockedExpense||loadingExpense||expenseLoadError)return;
    const value=Number(amount.replace(",","."));
    if(expenseBillable&&!expenseCustomer){setToast("Bitte einen Kunden für die Weiterverrechnung wählen.");return;}
    if(!Number.isFinite(value)||value<=0){setToast("Bitte einen gültigen Betrag erfassen.");window.setTimeout(()=>setToast(null),2200);return;}
    const statusMap:Record<string,string>={Entwurf:"draft",Eingereicht:"submitted",Genehmigt:"approved",Abgelehnt:"rejected"};
    expenseMutationPending.current=true;setExpenseBusy(true);try{
      const payload={customerId:expenseCustomer,billable:expenseBillable,employeeId:person,merchant:merchant.trim()||description.trim()||category,expenseDate:date,category,amount:value,currency,vatRate:Number(vatRate),description,status:statusMap[status]??"submitted"};
      let targetExpenseId=expenseId??createdExpenseId;let receiptUploaded=false;
      if(production){
        if(targetExpenseId){
          if(receiptFile){const form=new FormData();form.append('file',receiptFile);form.append('purpose','expense_receipt');form.append('entityId',targetExpenseId);await apiUpload('/api/files',form);receiptUploaded=true;setReceiptFile(null);}
          const result=await apiPatch<{item:{id:string}}>("/api/expenses/"+encodeURIComponent(targetExpenseId),payload);
          targetExpenseId=result.item?.id??targetExpenseId;
        }else{
          if(!expenseRequestKey.current)expenseRequestKey.current=crypto.randomUUID();
          const result=await apiPost<{item:{id:string}}>("/api/expenses",payload,{idempotencyKey:expenseRequestKey.current});
          targetExpenseId=result.item.id;setCreatedExpenseId(targetExpenseId);
        }
        if(receiptFile&&targetExpenseId&&!receiptUploaded){
          const form=new FormData();
          form.append("file",receiptFile);
          form.append("purpose","expense_receipt");
          form.append("entityId",targetExpenseId);
          await apiUpload("/api/files",form);
        }
      }else if(!existing){
        appendDemoRow("expenses",[merchant.trim()||description.trim()||category,person,"CHF "+value.toLocaleString("de-CH",{minimumFractionDigits:2,maximumFractionDigits:2}),"Eingereicht"]);
      }
      setSavedExpense(true);
      setToast(receiptFile?"Spese und Beleg gespeichert.":existing?"Spese gespeichert.":"Spese eingereicht.");
      window.setTimeout(()=>router.push("/spesen"),700);
    }catch(error){
      expenseMutationPending.current=false;setExpenseBusy(false);
      setToast(error instanceof Error?error.message:"Spese konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  const recordReimbursement=async()=>{if(expenseMutationPending.current||!expenseId)return;expenseMutationPending.current=true;setExpenseBusy(true);try{const r=await apiPost<{item:{reimbursed_at:string}}>('/api/expenses/'+encodeURIComponent(expenseId)+'/reimbursement',{reference:reimbursementRef});setReimbursedAt(r.item.reimbursed_at);setReimbursementOpen(false);setToast('Erstattung erfasst.')}catch(e){setToast(e instanceof Error?e.message:'Erstattung konnte nicht erfasst werden.')}finally{expenseMutationPending.current=false;setExpenseBusy(false)}};
  const selectedEmployee=availableEmployees.find(item=>item.id===person);
  const employeeLabel=selectedEmployee?[selectedEmployee.first_name,selectedEmployee.last_name].filter(Boolean).join(" "):"Ohne Mitarbeiter";
  if(existing&&(loadingExpense||expenseLoadError))return <AppShell title="Spese" subtitle={expenseLoadError?"Spesendaten nicht verfügbar":"Daten werden geladen."} active="spesen" backHref="/spesen" backLabel="Spesen">{loadingExpense?<div role="status"><EmptyState icon="card" title="Spese wird geladen" text="Die Spesendaten werden abgerufen."/></div>:<><div role="alert"><EmptyState icon="card" title="Spese konnte nicht geladen werden" text={expenseLoadError??"Bitte versuche es erneut."}/></div><div className="page-actions"><Button onClick={()=>window.location.reload()}>Erneut versuchen</Button><Button href="/spesen" variant="ghost">Zur Übersicht</Button></div></>}</AppShell>;
  return <AppShell unsavedChanges={editedExpense&&!savedExpense} title={existing ? merchant||description||"Spese" : "Spese erfassen"} status={existing?status:undefined} statusTone={status==="Genehmigt"||status==="Verbucht"?"success":status==="Abgelehnt"?"danger":status==="Eingereicht"?"warning":"neutral"} subtitle={existing ? employeeLabel : "Beleg fotografieren oder Datei auswählen."} active="spesen" backHref="/spesen" backLabel="Spesen" actions={!existing?<Button requiresWrite disabled={expenseBusy||scanState==="scanning"} onClick={()=>void save()}>Einreichen</Button>:undefined}>
    <div className={existing?"entity-detail-workspace expense-detail-workspace":"expense-layout"} onChangeCapture={()=>setEditedExpense(true)}>

      {!lockedExpense&&<><label className={`receipt-upload ${scanState==="scanning"?"is-scanning":""}`} htmlFor="expense-receipt-upload"><span><Icon name="upload" size={25}/></span><b>{scanState==="scanning"?"Beleg wird erkannt…":receiptFile?receiptFile.name:"Beleg fotografieren"}</b><small>{scanState==="done"?`Erkannt${scanConfidence!==null?` · ${Math.round(scanConfidence*100)}% Sicherheit`:""} – Angaben prüfen`:scanState==="error"?"Erkennung nicht möglich – manuell erfassen":"Kamera oder Datei verwenden · Angaben werden automatisch vorausgefüllt"}</small></label><Input id="expense-receipt-upload" hidden disabled={expenseBusy||scanState==="scanning"} type="file" capture="environment" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>void scanReceipt(e.target.files?.[0]??null)}/></>}
      <div className="form-page">
        {expenseFiles.length>0&&<section><h2>Quittungen</h2><div className="compact-list">{expenseFiles.map(f=><a key={f.id} href={'/api/files/'+f.id+'/download'}><span>{f.fileName}</span><Icon name="file"/></a>)}</div></section>}
        <fieldset disabled={lockedExpense||expenseBusy||scanState==="scanning"} className="form-grid two" style={{border:0,padding:0,margin:0}}>
          <Field label="Händler / Firma"><Input value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="Wird aus dem Beleg erkannt"/></Field>
          <Field label="Mitarbeiter"><Select value={person} onChange={e=>setPerson(e.target.value)}><option value="">Keine Zuordnung</option>{availableEmployees.map(item=><option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}</Select></Field>
          <Field label="Datum"><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
          <Field label="Kategorie"><Select value={category} onChange={e=>setCategory(e.target.value)}><option>Reise</option><option>Verpflegung</option><option>Material</option><option>Sonstiges</option></Select></Field>
          <Field label="Betrag"><Input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></Field>
          <Field label="Währung"><Select value={currency} onChange={e=>setCurrency(e.target.value)}><option>CHF</option><option>EUR</option></Select></Field>
          <Field label="MwSt."><Select value={vatRate} onChange={e=>setVatRate(e.target.value)}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></Select></Field>
          {existing&&<Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}><option>Entwurf</option><option>Eingereicht</option>{(canApproveExpense||status==="Genehmigt")&&<option disabled={!canApproveExpense}>Genehmigt</option>}{(canApproveExpense||status==="Abgelehnt")&&<option disabled={!canApproveExpense}>Abgelehnt</option>}</Select></Field>}
          <Field label="Weiterverrechnen"><Select value={expenseBillable?'yes':'no'} onChange={e=>setExpenseBillable(e.target.value==='yes')}><option value="no">Nicht weiterverrechnen</option><option value="yes">An Kunden weiterverrechnen</option></Select></Field>
          {expenseBillable&&<Field label="Kunde"><Select value={expenseCustomer} onChange={e=>setExpenseCustomer(e.target.value)}><option value="">Kunde auswählen</option>{expenseCustomers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>}
          <Field label="Beschreibung" className="full"><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </fieldset>
        {!lockedExpense&&<FormActions ><Button requiresWrite disabled={expenseBusy||scanState==="scanning"} onClick={()=>void save()}>{existing ? "Speichern" : "Einreichen"}</Button></FormActions>}
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-toolbox">{lockedExpense&&<p>Genehmigte Spesen sind gesperrt.</p>}{reimbursedAt?<p>Erstattet am {new Date(reimbursedAt).toLocaleDateString('de-CH')} · {reimbursementRef}</p>:lockedExpense&&canFinanceExpense&&<Button variant="secondary" onClick={()=>setReimbursementOpen(true)}>Erstattung erfassen</Button>}{lockedExpense&&canFinanceExpense&&expenseBillable&&expenseCustomer&&!invoicedId&&<Button href={'/rechnungen/neu?expenses='+encodeURIComponent(expenseId??'')} variant="secondary">Weiterverrechnen</Button>}{invoicedId&&<p>Bereits einer Rechnung zugeordnet.</p>}<Link href="/spesen"><Icon name="card"/><span><b>Alle Spesen</b><small>Zur Spesenübersicht</small></span><Icon name="arrow" size={15}/></Link></section></aside>}
    </div>
    {reimbursementOpen&&<FormSheet label={"Erfolgte Erstattung erfassen"} description={"Die Zahlung muss bereits erfolgt sein. Es wird keine Überweisung ausgelöst."} open={true} onClose={()=>setReimbursementOpen(false)} busy={expenseBusy} className={""} layerClassName={""} ariaLabel={"Erstattung erfassen"}><Field label="Zahlungsreferenz"><Input value={reimbursementRef} onChange={e=>setReimbursementRef(e.target.value)}/></Field><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setReimbursementOpen(false)}>Abbrechen</Button><Button disabled={expenseBusy||!reimbursementRef.trim()} onClick={()=>void recordReimbursement()}>Erstattung erfassen</Button></div></FormSheet>}
    {toast&&<Toast title={toast} tone={["Spese und Beleg gespeichert.","Spese gespeichert.","Spese eingereicht.","Erstattung erfasst."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}
