"use client";

import {useProcessDraft} from "../use-process-draft";
import {LocalizedText} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";
import {useApiQuery} from "@/lib/client/use-api-query";
import {ActionSheet,FormSheet} from "../binso-ux";

import { businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView, RecordsControls, useRecordsController } from "../records";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, ErrorState, LoadingState, Field, Icon, Toast, Input, Select, Textarea, FormActions } from "../ui";
import { CreateAction } from "../binso-ux";
import {allowDraftNavigation} from '../use-browser-back-guard';
import { useRecordList } from "./shared";

export function ExpensesPage() {
  const columns:NonNullable<Parameters<typeof useRecordsController>[0]["columns"]>=[{label:"Spese",index:0},{label:"Mitarbeiter",index:1},{label:"Datum",index:5},{label:"Betrag",index:2,align:"right"},{label:"Status",index:4,status:true}];
  const chips=["Alle","Entwurf","Eingereicht","Genehmigt","Verbucht","Abgelehnt"];
  const {rows:expenseRows,total,controller,pagination,loading,error}=useRecordList("expenses",{placeholder:"Spesen suchen...",chips,columns,sortFields:{0:"merchant",1:"employee_name",2:"amount",4:"status",5:"expense_date"},defaultOrder:"expense_date.desc",filterValues:{Entwurf:{field:"status",value:"draft"},Eingereicht:{field:"status",value:"submitted"},Genehmigt:{field:"status",value:"approved"},Verbucht:{field:"status",value:"posted"},Abgelehnt:{field:"status",value:"rejected"}}});
  return <AppShell title="Spesen" subtitle={loading?undefined:`${total} Spesen`} active="spesen" actions={<RecordsControls controller={controller} placeholder="Spesen suchen..." chips={chips} columns={columns}><CreateAction href="/spesen/neu" label="Spese erfassen"/></RecordsControls>}>
    <RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={pagination} countLabel="Spesen" loading={loading} error={error} items={expenseRows} placeholder="Spesen suchen..." chips={chips} columns={columns} rowHref={row=>`/spesen/${row[4]?row[3]:"1"}`}>{(row)=>{const [title,person,amount,idOrStatus,statusMaybe,date]=row;const id=statusMaybe?idOrStatus:"1";const status=statusMaybe??idOrStatus;return <RecordRow href={"/spesen/"+id} icon="card" title={title} meta={[date,person].filter(Boolean).join(" · ")} value={amount} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function ExpenseForm({ existing = false, expenseId }: { existing?: boolean; expenseId?: string }) {
  const router=useRouter();
  const searchParams=useSearchParams();
  const returnTo=safeAppPath(searchParams.get("returnTo"),"/spesen");
  const production=useBackendMode();
  const [person,setPerson]=useState(existing?"":searchParams.get("employeeId")??"");
  const employeesQuery=useApiQuery<{items:Array<{id:string;first_name:string;last_name:string}>}>(production?"/api/expenses/options":"/api/demo/data?collection=employees");
  const availableEmployees=employeesQuery.data?.items??[];
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
  const sessionQuery=useApiQuery<{user?:{id?:string};tenant?:{role?:string}}>("/api/auth/session");
  const role=sessionQuery.data?.tenant?.role??"";
  const [expenseCustomer,setExpenseCustomer]=useState("");
  const [expenseBillable,setExpenseBillable]=useState(false);
  const customersQuery=useApiQuery<{items:Array<{id:string;name:string}>}>("/api/customers");
  const expenseCustomers=customersQuery.data?.items??[];
  const [reimbursedAt,setReimbursedAt]=useState<string|null>(null),[reimbursementRef,setReimbursementRef]=useState("");
  const [invoicedId,setInvoicedId]=useState<string|null>(null);
  const canFinanceExpense=["owner","admin","finance"].includes(role);
  const [createdExpenseId,setCreatedExpenseId]=useState(expenseId??"");
  const expenseRequestKey=useRef("");
  const [expenseReplayKey,setExpenseReplayKey]=useState("");
  const expenseMutationPending=useRef(false);
  const receiptScanPending=useRef(false);
  const [editedExpense,setEditedExpense]=useState(false);
  const [savedExpense,setSavedExpense]=useState(false);
  const filesQuery=useApiQuery<{items:Array<{id:string;fileName:string}>}>(expenseId?"/api/files?expenseId="+encodeURIComponent(expenseId):null);
  const expenseFiles=filesQuery.data?.items??[];
  const [editingExpense,setEditingExpense]=useState(false),[expenseActions,setExpenseActions]=useState(false);
  const [expenseBusy,setExpenseBusy]=useState(false),[reimbursementOpen,setReimbursementOpen]=useState(false);
  const expenseQuery=useApiQuery<{item?:Record<string,unknown>;items?:Record<string,unknown>[]}>(existing&&expenseId?(production?"/api/expenses/"+encodeURIComponent(expenseId):"/api/demo/data?collection=expenses&id="+encodeURIComponent(expenseId)):null);
  const canApproveExpense=["owner","admin","project_manager","manager"].includes(role)&&expenseQuery.data?.item?.created_by_user_id!==sessionQuery.data?.user?.id;
  const loadingExpense=expenseQuery.loading;
  const expenseLoadError=expenseQuery.error??(existing&&expenseQuery.data&&!expenseQuery.data.item&&!expenseQuery.data.items?.[0]?"Spese wurde nicht gefunden.":null);
  const [persistedExpenseStatus,setPersistedExpenseStatus]=useState('');
  const lockedExpense=['approved','posted'].includes(persistedExpenseStatus);
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{
    if(editedExpense||!expenseQuery.data)return;
    const item=expenseQuery.data.item??expenseQuery.data.items?.[0];if(!item)return;
    let active=true;queueMicrotask(()=>{if(!active)return;
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
    });return()=>{active=false};
  },[editedExpense,expenseQuery.data]);

  const expenseDraft={person,date,category,amount,currency,vatRate,merchant,description,status,expenseCustomer,expenseBillable,createdExpenseId,requestKey:expenseReplayKey};
  const expenseRecovery=useProcessDraft({process:"expense:create",value:expenseDraft,dirty:editedExpense,enabled:!existing&&!savedExpense,onRestore:value=>{
    if(!value||[value.person,value.date,value.category,value.amount,value.currency,value.vatRate,value.merchant,value.description,value.status,value.expenseCustomer,value.createdExpenseId,value.requestKey].some(field=>typeof field!=="string"||field.length>4000)||typeof value.expenseBillable!=="boolean")return;
    setPerson(value.person);setDate(value.date);setCategory(value.category);setAmount(value.amount);setCurrency(value.currency);setVatRate(value.vatRate);setMerchant(value.merchant);setDescription(value.description);setStatus(value.status);setExpenseCustomer(value.expenseCustomer);setExpenseBillable(value.expenseBillable);setCreatedExpenseId(value.createdExpenseId);expenseRequestKey.current=value.requestKey;setExpenseReplayKey(value.requestKey);setEditedExpense(true);
  }});
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

  const save=async(reviewStatus?:"approved"|"rejected")=>{
    if(expenseMutationPending.current||receiptScanPending.current||lockedExpense||loadingExpense||expenseLoadError||!existing&&!expenseRecovery.ready)return;
    const value=Number(amount.replace(",","."));
    if(expenseBillable&&!expenseCustomer){setToast("Bitte einen Kunden für die Weiterverrechnung wählen.");return;}
    if(!Number.isFinite(value)||value<=0){setToast("Bitte einen gültigen Betrag erfassen.");window.setTimeout(()=>setToast(null),2200);return;}
    const statusMap:Record<string,string>={Entwurf:"draft",Eingereicht:"submitted",Genehmigt:"approved",Abgelehnt:"rejected"};
    expenseMutationPending.current=true;setExpenseBusy(true);try{
      const payload={customerId:expenseCustomer,billable:expenseBillable,employeeId:person,merchant:merchant.trim()||description.trim()||category,expenseDate:date,category,amount:value,currency,vatRate:Number(vatRate),description,status:reviewStatus??statusMap[status]??"submitted"};
      let targetExpenseId=expenseId??createdExpenseId;let receiptUploaded=false;
      if(production){
        if(targetExpenseId){
          if(receiptFile){const form=new FormData();form.append('file',receiptFile);form.append('purpose','expense_receipt');form.append('entityId',targetExpenseId);await apiUpload('/api/files',form);receiptUploaded=true;setReceiptFile(null);}
          const result=await apiPatch<{item:{id:string}}>("/api/expenses/"+encodeURIComponent(targetExpenseId),payload);
          targetExpenseId=result.item?.id??targetExpenseId;
        }else{
          if(!expenseRequestKey.current){expenseRequestKey.current=crypto.randomUUID();setExpenseReplayKey(expenseRequestKey.current);}
          expenseRecovery.persist({...expenseDraft,requestKey:expenseRequestKey.current});
          const result=await apiPost<{item:{id:string}}>("/api/expenses",payload,{idempotencyKey:expenseRequestKey.current});
          targetExpenseId=result.item.id;setCreatedExpenseId(targetExpenseId);expenseRecovery.persist({...expenseDraft,createdExpenseId:targetExpenseId,requestKey:expenseRequestKey.current});
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
      expenseRecovery.clear();setSavedExpense(true);
      setToast(receiptFile?"Spese und Beleg gespeichert.":existing?"Spese gespeichert.":"Spese eingereicht.");
      window.setTimeout(()=>router.push(returnTo),700);
    }catch(error){
      expenseMutationPending.current=false;setExpenseBusy(false);
      setToast(error instanceof Error?error.message:"Spese konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  const recordReimbursement=async()=>{if(expenseMutationPending.current||!expenseId)return;expenseMutationPending.current=true;setExpenseBusy(true);try{const r=await apiPost<{item:{reimbursed_at:string}}>('/api/expenses/'+encodeURIComponent(expenseId)+'/reimbursement',{reference:reimbursementRef});setReimbursedAt(r.item.reimbursed_at);setReimbursementOpen(false);setToast('Erstattung erfasst.')}catch(e){setToast(e instanceof Error?e.message:'Erstattung konnte nicht erfasst werden.')}finally{expenseMutationPending.current=false;setExpenseBusy(false)}};
  const selectedEmployee=availableEmployees.find(item=>item.id===person);
  const storedEmployee=expenseQuery.data?.item?.employee as {first_name?:string;last_name?:string}|undefined;
  const employeeLabel=selectedEmployee?[selectedEmployee.first_name,selectedEmployee.last_name].filter(Boolean).join(" "):[storedEmployee?.first_name,storedEmployee?.last_name].filter(Boolean).join(" ")||"Ohne Mitarbeiter";
  if(existing&&(loadingExpense||expenseLoadError))return <AppShell title="Spese" subtitle={expenseLoadError?"Spesendaten nicht verfügbar":undefined} active="spesen" backHref={returnTo} backLabel="Spesen">{loadingExpense?<LoadingState/>:<><div role="alert"><EmptyState  title="Spese konnte nicht geladen werden" description={expenseLoadError??"Bitte versuche es erneut."}/></div><div className="page-actions"><Button onClick={expenseQuery.refresh}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Button href="/spesen" variant="ghost"><LocalizedText>{"Zur Übersicht"}</LocalizedText></Button></div></>}</AppShell>;
  const close=()=>{if(existing){setEditingExpense(false);setEditedExpense(false);return;}expenseRecovery.clear();allowDraftNavigation();router.push(returnTo)};
  const workspace=<>
    {!existing&&toast&&(savedExpense?<Toast title={toast} tone="success"/>:<ErrorState>{toast}</ErrorState>)}
    {(employeesQuery.error||customersQuery.error||filesQuery.error)&&<div role="alert"><LocalizedText>{employeesQuery.error||customersQuery.error||filesQuery.error}</LocalizedText><Button variant="ghost" onClick={()=>{employeesQuery.refresh();customersQuery.refresh();filesQuery.refresh()}}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button></div>}
    <div className={existing?"entity-detail-workspace expense-detail-workspace":"expense-layout"} onChangeCapture={()=>setEditedExpense(true)}>

      {(!existing||editingExpense)&&!lockedExpense&&<><Button requiresWrite variant="upload" icon="upload" className={`receipt-upload ${scanState==="scanning"?"is-scanning":""}`} disabled={expenseBusy||scanState==="scanning"} onClick={()=>document.getElementById("expense-receipt-upload")?.click()}><b><LocalizedText verbatim={scanState!=="scanning"&&!!receiptFile}>{scanState==="scanning"?"Beleg wird erkannt…":receiptFile?receiptFile.name:"Beleg fotografieren"}</LocalizedText></b><small><LocalizedText>{scanState==="done"?`Erkannt${scanConfidence!==null?` · ${Math.round(scanConfidence*100)}% Sicherheit`:""} – Angaben prüfen`:scanState==="error"?"Erkennung nicht möglich – manuell erfassen":"Kamera oder Datei verwenden · Angaben werden automatisch vorausgefüllt"}</LocalizedText></small></Button><Input id="expense-receipt-upload" hidden disabled={expenseBusy||scanState==="scanning"} type="file" capture="environment" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={e=>void scanReceipt(e.target.files?.[0]??null)}/></>}
      <div className="form-page">
        {expenseFiles.length>0&&<section><h2><LocalizedText>{"Quittungen"}</LocalizedText></h2><div className="compact-list">{expenseFiles.map(f=><a key={f.id} href={'/api/files/'+f.id+'/download'}><span>{f.fileName}</span><Icon name="file"/></a>)}</div></section>}
        {existing&&!editingExpense?<section className="expense-summary"><h2>{merchant}</h2><strong className="expense-summary-amount">{new Intl.NumberFormat('de-CH',{style:'currency',currency}).format(Number(amount))}</strong><p>{date.split('-').reverse().join('.')} · {category}</p>{description&&description!==merchant&&<p>{description}</p>}<details><summary><LocalizedText>{"Details"}</LocalizedText></summary><p>{employeeLabel}</p>{expenseCustomer&&<Link href={'/kunden/'+encodeURIComponent(expenseCustomer)}>{expenseCustomers.find(item=>item.id===expenseCustomer)?.name??'Kunde'}</Link>}{reimbursedAt&&<p><LocalizedText>{"Erstattet am "}</LocalizedText>{new Date(reimbursedAt).toLocaleDateString('de-CH')}</p>}</details></section>:<><fieldset disabled={lockedExpense||expenseBusy||scanState==="scanning"} className="form-grid two form-fieldset">
          <Field label="Händler"><Input value={merchant} onChange={e=>setMerchant(e.target.value)} placeholder="Wird aus dem Beleg erkannt"/></Field>
          <Field label="Mitarbeiter"><Select value={person} onChange={e=>setPerson(e.target.value)}><option value=""><LocalizedText>{"Keine Zuordnung"}</LocalizedText></option>{availableEmployees.map(item=><option key={item.id} value={item.id}>{item.first_name} {item.last_name}</option>)}</Select></Field>
          <Field label="Datum"><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field>
          <Field label="Kategorie"><Select value={category} onChange={e=>setCategory(e.target.value)}><option value={"Reise"}><LocalizedText>{"Reise"}</LocalizedText></option><option value={"Verpflegung"}><LocalizedText>{"Verpflegung"}</LocalizedText></option><option value={"Material"}><LocalizedText>{"Material"}</LocalizedText></option><option value={"Sonstiges"}><LocalizedText>{"Sonstiges"}</LocalizedText></option></Select></Field>
          <Field label="Betrag"><Input inputMode="decimal" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00"/></Field>
          <Field label="Währung"><Select value={currency} onChange={e=>setCurrency(e.target.value)}><option value={"CHF"}><LocalizedText>{"CHF"}</LocalizedText></option><option value={"EUR"}><LocalizedText>{"EUR"}</LocalizedText></option></Select></Field>
          <Field label="MwSt."><Select value={vatRate} onChange={e=>setVatRate(e.target.value)}><option value="8.1">8.1%</option><option value="2.6">2.6%</option><option value="0">0%</option></Select></Field>
          {existing&&<Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}><option value={"Entwurf"}><LocalizedText>{"Entwurf"}</LocalizedText></option><option value={"Eingereicht"}><LocalizedText>{"Eingereicht"}</LocalizedText></option>{(canApproveExpense||status==="Genehmigt")&&<option value={"Genehmigt"} disabled={!canApproveExpense}><LocalizedText>{"Genehmigt"}</LocalizedText></option>}{(canApproveExpense||status==="Abgelehnt")&&<option value={"Abgelehnt"} disabled={!canApproveExpense}><LocalizedText>{"Abgelehnt"}</LocalizedText></option>}</Select></Field>}
          <Field label="Weiterverrechnen"><Select value={expenseBillable?'yes':'no'} onChange={e=>setExpenseBillable(e.target.value==='yes')}><option value="no"><LocalizedText>{"Nicht weiterverrechnen"}</LocalizedText></option><option value="yes"><LocalizedText>{"An Kunden weiterverrechnen"}</LocalizedText></option></Select></Field>
          {expenseBillable&&<Field label="Kunde"><Select value={expenseCustomer} onChange={e=>setExpenseCustomer(e.target.value)}><option value=""><LocalizedText>{"Kunde auswählen"}</LocalizedText></option>{expenseCustomers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>}
          <Field label="Beschreibung" className="full"><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Kurze Beschreibung"/></Field>
        </fieldset>
        </>}
      </div>
      {existing&&<ActionSheet label="Spesenaktionen" open={expenseActions} onClose={()=>setExpenseActions(false)}><section className="context-action-group">{canApproveExpense&&persistedExpenseStatus==="submitted"&&<><Button requiresWrite disabled={expenseBusy} onClick={()=>void save("approved")}><LocalizedText>{"Genehmigen"}</LocalizedText></Button><Button requiresWrite variant="secondary" disabled={expenseBusy} onClick={()=>void save("rejected")}><LocalizedText>{"Ablehnen"}</LocalizedText></Button></>}{!lockedExpense&&(expenseQuery.data?.item?.created_by_user_id===sessionQuery.data?.user?.id||["owner","admin"].includes(role))&&<Button requiresWrite variant="secondary" icon="edit" onClick={()=>{setExpenseActions(false);setEditingExpense(true)}}><LocalizedText>{canApproveExpense?"Prüfen":"Bearbeiten"}</LocalizedText></Button>}{lockedExpense&&<p><LocalizedText>{"Genehmigte Spesen sind gesperrt."}</LocalizedText></p>}{reimbursedAt?<p><LocalizedText>{"Erstattet am "}</LocalizedText>{new Date(reimbursedAt).toLocaleDateString('de-CH')} · {reimbursementRef}</p>:lockedExpense&&canFinanceExpense&&<Button variant="secondary" onClick={()=>setReimbursementOpen(true)}><LocalizedText>{"Erstattung erfassen"}</LocalizedText></Button>}{lockedExpense&&canFinanceExpense&&expenseBillable&&expenseCustomer&&!invoicedId&&<Button href={'/rechnungen/neu?expenses='+encodeURIComponent(expenseId??'')} variant="secondary"><LocalizedText>{"Weiterverrechnen"}</LocalizedText></Button>}{invoicedId&&<p><LocalizedText>{"Bereits einer Rechnung zugeordnet."}</LocalizedText></p>}<Link href="/spesen"><Icon name="card"/><span><b><LocalizedText>{"Alle Spesen"}</LocalizedText></b><small><LocalizedText>{"Zur Spesenübersicht"}</LocalizedText></small></span><Icon name="arrow" size={15}/></Link></section></ActionSheet>}
    </div>
  </>;
  return <AppShell titleIsUserContent={false} editing={!existing||editingExpense} unsavedChanges={existing&&editedExpense&&!savedExpense} title={existing?"Spese":"Spese erfassen"} status={existing?status:undefined} statusTone={status==="Genehmigt"||status==="Verbucht"?"success":status==="Abgelehnt"?"danger":status==="Eingereicht"?"warning":"neutral"} subtitle={existing ? employeeLabel : undefined} active="spesen" backHref={returnTo} backLabel="Spesen" actions={existing&&!editingExpense?<Button variant="ghost" icon="more" ariaLabel="Spesenaktionen" onClick={()=>setExpenseActions(true)}/>:undefined}>
    {existing&&!editingExpense?workspace:<FormSheet workspace label={existing?"Spese bearbeiten":"Spese erfassen"} description="Beleg fotografieren oder Datei auswählen." open onClose={close} busy={expenseBusy||scanState==="scanning"} dirty={editedExpense&&!savedExpense} actions={<><Button variant="secondary" onClick={close}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={expenseBusy||scanState==="scanning"} onClick={()=>void save()}><LocalizedText>{existing?"Speichern":"Einreichen"}</LocalizedText></Button></>}>{workspace}</FormSheet>}
    {reimbursementOpen&&<FormSheet label={"Erfolgte Erstattung erfassen"} description={"Die Zahlung muss bereits erfolgt sein. Es wird keine Überweisung ausgelöst."} open={true} onClose={()=>setReimbursementOpen(false)} busy={expenseBusy} className={""} layerClassName={""} ariaLabel={"Erstattung erfassen"}><Field label="Zahlungsreferenz"><Input value={reimbursementRef} onChange={e=>setReimbursementRef(e.target.value)}/></Field><FormActions sheet><Button variant="secondary" onClick={()=>setReimbursementOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={expenseBusy||!reimbursementRef.trim()} onClick={()=>void recordReimbursement()}><LocalizedText>{"Erstattung erfassen"}</LocalizedText></Button></FormActions></FormSheet>}
    {existing&&toast&&<Toast title={toast} tone={["Spese und Beleg gespeichert.","Spese gespeichert.","Spese eingereicht.","Erstattung erfasst."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}
