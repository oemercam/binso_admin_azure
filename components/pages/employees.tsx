"use client";
import {ContextActions} from "../binso-ux";
import {LocalizedText} from "@/lib/client/locale";
import {contactHref} from '@/lib/contact-links';
import {safeAppPath} from "@/lib/navigation";
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import {useProcessDraft} from "../use-process-draft";
import {useDirtySnapshot} from "../use-dirty-snapshot";
import {FormWizard} from "../form-wizard";
import {Avatar} from "../avatar";

import { formatQuantity, timeMetadata } from "@/lib/display-format";
import { formatCurrency } from "@/lib/financial-status";
import {DetailTabs} from "../binso-ux";

import { tenantCan } from "@/lib/permissions";
import { limitsConfig, megabytes } from "@/config/limits";
import { employeeInputIssue } from "@/lib/employee-validation";
import Link from "next/link";
import { useRouter,useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView, RecordsControls, useRecordsController, TimeEntryRow } from "../records";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, Icon, SectionTitle, Toast, Input, Select, LoadingState, ErrorState, FormSection} from "../ui";
import {allowDraftNavigation} from "../use-browser-back-guard";
import { ActionRow, ActionsMenu, CreateAction, FormSheet } from "../binso-ux";
import { useRecordList, swissDate, formatMinutes } from "./shared";

export function EmployeesPage() {
  const columns:NonNullable<Parameters<typeof useRecordsController>[0]["columns"]>=[{label:"Mitarbeiter",index:0,render:row=><span className="person-record"><Avatar name={row[0]} identity={row[4]?row[3]:row[0]}/><span>{row[0]}</span></span>},{label:"Funktion",index:1},{label:"Pensum",index:2},{label:"Status",index:4,status:true}];
  const chips=["Alle","Aktiv","Inaktiv"];
  const {rows:employeeRows,total,controller,pagination,loading,error}=useRecordList("employees",{placeholder:"Mitarbeiter suchen...",chips,columns,sortFields:{0:"name",1:"job_title",2:"workload_percent",4:"status"},defaultOrder:"name.asc",filterValues:{Aktiv:{field:"status",value:"active"},Inaktiv:{field:"status",value:"inactive"}}});
  return <AppShell title="Mitarbeiter" subtitle={loading?undefined:`${total} Mitarbeiter`} active="mitarbeiter" actions={<RecordsControls controller={controller} placeholder="Mitarbeiter suchen..." chips={chips} columns={columns}><CreateAction href="/mitarbeiter/neu" label="Mitarbeiter hinzufügen"/></RecordsControls>}>
    <RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={pagination} countLabel="Mitarbeiter" loading={loading} error={error} items={employeeRows} placeholder="Mitarbeiter suchen..." chips={chips} columns={columns} rowHref={row=>`/mitarbeiter/${row[4]?row[3]:"thomas"}`}>{(row)=>{const [name,role,load,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"thomas";const status=statusMaybe??idOrStatus;return <RecordRow personIdentity={id} href={"/mitarbeiter/"+id} icon="users" title={name} meta={`${role} · ${load}`} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function EmployeeForm({ existing = false, employeeId }: { existing?: boolean; employeeId?: string }) {
  const router=useRouter(),params=useSearchParams();
  const returnTo=existing?"/mitarbeiter":safeAppPath(params.get("returnTo"),"/mitarbeiter");
  const production=useBackendMode();
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [role,setRole]=useState("");
  const [load,setLoad]=useState(existing?"100":"100");
  const [entryDate,setEntryDate]=useState("");
  const [weeklyHours,setWeeklyHours]=useState("42");
  const [vacationDays,setVacationDays]=useState("25");
  const [address,setAddress]=useState("");
  const [status,setStatus]=useState("Aktiv");
  const [wizardStep,setWizardStep]=useState(0);
  const [employeeTab,setEmployeeTab]=useState<"overview"|"time"|"expenses"|"documents">("overview");
  const [toast,setToast]=useState<string|null>(null);
  const recordQuery=useApiQuery<{item?:Record<string,unknown>;items?:Record<string,unknown>[]}>(existing&&employeeId?(production?"/api/employees/"+encodeURIComponent(employeeId):"/api/demo/data?collection=employees&id="+encodeURIComponent(employeeId)):null);
  const loadingRecord=recordQuery.loading;
  const recordError=recordQuery.error??(existing&&recordQuery.data&&!recordQuery.data.item&&!recordQuery.data.items?.length?"Mitarbeiter wurde nicht gefunden.":null);
  const [savingRecord,setSavingRecord]=useState(false);
  const saveRecordPending=useRef(false);
  const {dirty,markPristine}=useDirtySnapshot([firstName,lastName,email,phone,role,load,entryDate,weeklyHours,vacationDays,address,status]);
  const [savedRecord,setSavedRecord]=useState(false);
  const [editingRecord,setEditingRecord]=useState(!existing);

  const ledgerRevision=useDataRevision(["/api/employees","/api/time-entries","/api/expenses","/api/files"]);
  const [canAddDocument,setCanAddDocument]=useState(false),[uploadingDocument,setUploadingDocument]=useState(false);
  const documentUploadBusy=useRef(false);
  useEffect(()=>{apiGet<{tenant?:{role?:string;readOnly?:boolean}}>("/api/auth/session").then(data=>setCanAddDocument(!data.tenant?.readOnly&&tenantCan(data.tenant?.role??"reader","employees:write"))).catch(()=>undefined)},[]);
  const addDocument=async(file:File|undefined)=>{
    if(!file||!employeeId||!canAddDocument||documentUploadBusy.current)return;
    if(file.size>limitsConfig.maxFileUploadBytes){setToast(`Die Datei darf höchstens ${megabytes(limitsConfig.maxFileUploadBytes)} MB gross sein.`);return;}
    if(!["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv"].includes(file.type)){setToast("Bitte PDF, Bild, Text oder CSV auswählen.");return;}
    documentUploadBusy.current=true;setUploadingDocument(true);
    try{const form=new FormData();form.append("file",file);form.append("purpose","employee_document");form.append("entityId",employeeId);await apiUpload("/api/files",form);setLedgerRetry(value=>value+1);setToast("Dokument hinzugefügt.");}catch(error){setToast(error instanceof Error?error.message:"Dokument konnte nicht hinzugefügt werden.");}finally{documentUploadBusy.current=false;setUploadingDocument(false);}
  };
  const [ledgerLoading,setLedgerLoading]=useState(existing);
  const [ledgerErrors,setLedgerErrors]=useState<Partial<Record<"times"|"expenses"|"files",string>>>({});
  const [ledgerRetry,setLedgerRetry]=useState(0);
  const [ledger,setLedger]=useState<{times:Array<{id:string;started_at:string;duration_minutes:number;project_name:string;description?:string;approved?:boolean;billable?:boolean;invoiced_invoice_id?:string|null}>;expenses:Array<{id:string;merchant:string;amount:number;currency?:string;expense_date:string;status?:string}>;files:Array<{id:string;fileName:string}>}>({times:[],expenses:[],files:[]});
  useEffect(()=>{
    if(!existing||!employeeId)return;
    let active=true;
    const encoded=encodeURIComponent(employeeId);
    queueMicrotask(()=>{if(active)setLedgerLoading(true)});
    Promise.allSettled([
      apiGet<{items:Array<{id:string;started_at:string;duration_minutes:number;project_name:string}>}>("/api/time-entries?employeeId="+encoded),
      apiGet<{items:Array<{id:string;merchant:string;amount:number;currency?:string;expense_date:string}>}>("/api/expenses?employeeId="+encoded),
      apiGet<{items:Array<{id:string;fileName:string}>}>("/api/files?employeeId="+encoded),
    ]).then(([times,expenses,files])=>{
      if(!active)return;
      setLedger({times:times.status==="fulfilled"?times.value.items:[],expenses:expenses.status==="fulfilled"?expenses.value.items:[],files:files.status==="fulfilled"?files.value.items:[]});
      const errors:Partial<Record<"times"|"expenses"|"files",string>>={};
      for(const [key,result] of [["times",times],["expenses",expenses],["files",files]] as const){if(result.status==="rejected")errors[key]=result.reason instanceof Error?result.reason.message:"Daten konnten nicht geladen werden.";}
      setLedgerErrors(errors);setLedgerLoading(false);
    });
    return()=>{active=false};
  },[production,existing,employeeId,ledgerRetry,ledgerRevision]);
  useEffect(()=>{
    if(!recordQuery.data||editingRecord)return;
      const item=recordQuery.data.item??recordQuery.data.items?.[0];
      if(!item)return;
      queueMicrotask(()=>{
        setFirstName(String(item.first_name??""));
        setLastName(String(item.last_name??""));
        setEmail(String(item.email??""));
        setPhone(String(item.phone??""));
        setRole(String(item.job_title??""));
        setLoad(String(Number(item.workload_percent??100)));
        setEntryDate(String(item.entry_date??item.start_date??"").slice(0,10));
        setWeeklyHours(String(Number(item.weekly_hours??42)));
        setVacationDays(String(Number(item.vacation_days??25)));
        setAddress(String(item.address??""));
        setStatus(item.status==="inactive"?"Inaktiv":"Aktiv");
        markPristine([String(item.first_name??""),String(item.last_name??""),String(item.email??""),String(item.phone??""),String(item.job_title??""),String(Number(item.workload_percent??100)),String(item.entry_date??item.start_date??"").slice(0,10),String(Number(item.weekly_hours??42)),String(Number(item.vacation_days??25)),String(item.address??""),item.status==="inactive"?"Inaktiv":"Aktiv"]);
      });
  },[recordQuery.data,editingRecord,markPristine]);

  const [replay,setReplay]=useState<{body:string;key:string}|null>(null);
  const recovery=useProcessDraft({process:"employee:create",value:{firstName,lastName,email,phone,role,load,entryDate,weeklyHours,vacationDays,address,status,replay},dirty,enabled:!existing,onRestore:value=>{
   if(!value||[value.firstName,value.lastName,value.email,value.phone,value.role,value.load,value.entryDate,value.weeklyHours,value.vacationDays,value.address,value.status].some(field=>typeof field!=="string"||field.length>2000))return;
   setFirstName(value.firstName);setLastName(value.lastName);setEmail(value.email);setPhone(value.phone);setRole(value.role);setLoad(value.load);setEntryDate(value.entryDate);setWeeklyHours(value.weeklyHours);setVacationDays(value.vacationDays);setAddress(value.address);setStatus(value.status);
   if(value.replay&&typeof value.replay.body==='string'&&value.replay.body.length<16000&&typeof value.replay.key==='string'&&value.replay.key.length>=8&&value.replay.key.length<=128)setReplay(value.replay);
  }});
  const save=async()=>{
    if(saveRecordPending.current||loadingRecord||recordError||!existing&&!recovery.ready)return;
    if(!firstName.trim()||!lastName.trim()||!role.trim()){setToast("Name und Funktion sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    const validation=employeeInputIssue({email,entryDate,workloadPercent:load,weeklyHours,vacationDays});
    if(validation){setToast(validation);return;}
    saveRecordPending.current=true;setSavingRecord(true);
    try{
      const payload={firstName:firstName.trim(),lastName:lastName.trim(),email,phone,jobTitle:role.trim(),workloadPercent:Number(load),entryDate,weeklyHours:Number(weeklyHours),vacationDays:Number(vacationDays),address,status:status==="Inaktiv"?"inactive":"active"};
      if(production){
        let result:{item?:{id?:string}};
        if(existing&&employeeId)result=await apiPatch("/api/employees/"+encodeURIComponent(employeeId),payload);
        else{
         const serialized=JSON.stringify(payload),attempt=replay?.body===serialized?replay:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);recovery.persist({firstName,lastName,email,phone,role,load,entryDate,weeklyHours,vacationDays,address,status,replay:attempt});
         result=await apiPost("/api/employees",payload,{idempotencyKey:attempt.key});
        }
        if(!result.item?.id)throw new Error("Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.");
      }else if(!existing){
        appendDemoRow("employees",[firstName.trim()+" "+lastName.trim(),role.trim(),load+"%",status]);
      }
      setSavedRecord(true);recovery.clear();allowDraftNavigation();
      setToast("Mitarbeiter gespeichert.");
      window.setTimeout(()=>router.push(returnTo),700);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Mitarbeiter konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  const displayName=[firstName,lastName].filter(Boolean).join(" ")||"Mitarbeiter";
  if(loadingRecord||recordError)return <AppShell title="Mitarbeiter" subtitle={recordError?"Mitarbeiterdaten nicht verfügbar":undefined} active="mitarbeiter" backHref={returnTo} backLabel="Mitarbeiter">{loadingRecord?<LoadingState/>:<><div role="alert"><EmptyState icon="users" title="Mitarbeiter konnte nicht geladen werden" text={recordError??"Bitte versuche es erneut."}/></div><div className="page-actions"><Button onClick={recordQuery.refresh}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button><Button href="/mitarbeiter" variant="ghost"><LocalizedText>{"Zur Übersicht"}</LocalizedText></Button></div></>}</AppShell>;
  return <AppShell titleIsUserContent={existing&&!!displayName} unsavedChanges={false} title={existing ? displayName : "Mitarbeiter hinzufügen"} status={existing?status:undefined} statusTone={status==="Aktiv"?"success":"neutral"} editing={editingRecord} subtitle={existing ? role+" · "+formatQuantity(load,"%") : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref={returnTo} backLabel="Mitarbeiter" actions={existing?<><ActionsMenu label="Mitarbeiteraktionen" busy={savingRecord}>{!editingRecord&&<ActionRow requiresWrite icon="edit" onClick={()=>{setEditingRecord(true);setEmployeeTab("overview")}} title="Bearbeiten" navigation/>}<ActionRow href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")} icon="clock" title="Zeiterfassung öffnen" navigation/><ActionRow href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")} icon="card" title="Spese erfassen" navigation/></ActionsMenu></>:undefined}>
    <div className={existing?"entity-detail-workspace":"desktop-detail-single"}>

      <div className="desktop-detail-main">
    {existing && <DetailTabs role="tablist" label="Mitarbeiterbereiche">
      <button role="tab" aria-selected={employeeTab==="overview"} className={employeeTab==="overview"?"active":""} onClick={()=>setEmployeeTab("overview")}><LocalizedText>{"Übersicht"}</LocalizedText></button>
      <button role="tab" aria-selected={employeeTab==="time"} className={employeeTab==="time"?"active":""} onClick={()=>setEmployeeTab("time")}><LocalizedText>{"Arbeitszeit"}</LocalizedText></button>
      <button role="tab" aria-selected={employeeTab==="expenses"} className={employeeTab==="expenses"?"active":""} onClick={()=>setEmployeeTab("expenses")}><LocalizedText>{"Spesen"}</LocalizedText></button>
      <button role="tab" aria-selected={employeeTab==="documents"} className={employeeTab==="documents"?"active":""} onClick={()=>setEmployeeTab("documents")}><LocalizedText>{"Dokumente"}</LocalizedText></button>
    </DetailTabs>}
    {(!existing||employeeTab==="overview")&&<div className="form-page" inert={savingRecord}>
      {!editingRecord?<><dl className="detail-list">
        <div><dt><LocalizedText>{"E-Mail"}</LocalizedText></dt><dd>{email?<a href={contactHref("email",email)}>{email}</a>:<LocalizedText>Keine E-Mail hinterlegt</LocalizedText>}</dd></div>
        {phone&&<div><dt><LocalizedText>{"Telefon"}</LocalizedText></dt><dd><a href={contactHref("phone",phone)}>{phone}</a></dd></div>}
        {entryDate&&<div><dt><LocalizedText>{"Eintritt"}</LocalizedText></dt><dd>{swissDate(entryDate)}</dd></div>}
        <div><dt><LocalizedText>{"Wochenstunden"}</LocalizedText></dt><dd>{formatQuantity(weeklyHours,"h/Woche")}</dd></div>
        <div><dt><LocalizedText>{"Ferientage / Jahr"}</LocalizedText></dt><dd>{formatQuantity(vacationDays,"Tage/Jahr")}</dd></div>
        {address&&<div><dt><LocalizedText>{"Adresse"}</LocalizedText></dt><dd>{address}</dd></div>}
      </dl></>:<FormSheet label={existing?"Mitarbeiter bearbeiten":"Mitarbeiter hinzufügen"} open={editingRecord} onClose={()=>{recovery.clear();allowDraftNavigation();if(existing)setEditingRecord(false);else router.push(returnTo)}} busy={savingRecord} dirty={dirty&&!savedRecord} wizard><FormWizard cancelAction={<Button variant="secondary" onClick={()=>{recovery.clear();allowDraftNavigation();if(existing)setEditingRecord(false);else router.push(returnTo)}} disabled={savingRecord}><LocalizedText>{"Abbrechen"}</LocalizedText></Button>} guided={!existing} labels={["Persönliche Daten","Arbeitsverhältnis"]} step={wizardStep} onStep={setWizardStep} busy={savingRecord} action={<Button requiresWrite disabled={savingRecord} onClick={()=>void save()}><LocalizedText>{savingRecord?"Wird gespeichert…":"Speichern"}</LocalizedText></Button>}><FormSection title="Persönliche Daten" hidden={!existing&&wizardStep!==0}><div className="form-grid two">
        <Field label="Vorname"><Input required autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
        <Field label="Nachname"><Input required autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
        <Field label="E-Mail"><Input required autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefon"><Input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        <Field label="Funktion"><Input required value={role} onChange={e=>setRole(e.target.value)}/></Field>
        <Field label="Pensum (%)"><Input type="number" min="0" max="100" required inputMode="numeric" value={load} onChange={e=>setLoad(e.target.value)} placeholder="%"/></Field>
      </div></FormSection><FormSection title="Arbeitsverhältnis" hidden={!existing&&wizardStep!==1}><div className="form-grid two">
        <Field label="Eintritt"><Input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/></Field>
        <Field label="Wochenstunden (h/Woche)"><Input type="number" min="0.1" max="80" step="0.1" required inputMode="decimal" value={weeklyHours} onChange={e=>setWeeklyHours(e.target.value)}/></Field>
        <Field label="Ferientage / Jahr"><Input type="number" min="0" max="60" step="0.5" required inputMode="decimal" value={vacationDays} onChange={e=>setVacationDays(e.target.value)}/></Field>
        <Field label="Adresse" className="full"><Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Strasse, PLZ Ort"/></Field>
        <Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}><option value={"Aktiv"}><LocalizedText>{"Aktiv"}</LocalizedText></option><option value={"Inaktiv"}><LocalizedText>{"Inaktiv"}</LocalizedText></option></Select></Field>
      </div></FormSection></FormWizard></FormSheet>}
    </div>}
    {existing&&employeeTab==="time"&&<section className="surface employee-tab-panel"><SectionTitle title="Arbeitszeit" action={<Button href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")} variant="secondary"><LocalizedText>{"Zeiterfassung öffnen"}</LocalizedText></Button>}/>{ledgerLoading?<LoadingState><LocalizedText>{"Arbeitszeiten werden geladen …"}</LocalizedText></LoadingState>:ledgerErrors.times?<ErrorState onRetry={()=>setLedgerRetry(value=>value+1)} retryLabel="Erneut versuchen">{ledgerErrors.times}</ErrorState>:null}<div>{ledger.times.map(item=><TimeEntryRow key={item.id} title={item.description||item.project_name||"Zeiteintrag"} meta={timeMetadata(item.description||item.project_name,item.project_name,undefined,swissDate(item.started_at))} value={formatMinutes(Number(item.duration_minutes))+" h"} status={item.invoiced_invoice_id?"Verrechnet":item.approved?"Freigegeben":item.billable===false?"Intern":"Erfasst"}/>)}</div>{!ledgerLoading&&!ledgerErrors.times&&!ledger.times.length&&<EmptyState compact title="Keine Arbeitszeiten erfasst" text=""/>}</section>}
    {existing&&employeeTab==="expenses"&&<section className="surface employee-tab-panel"><SectionTitle title="Spesen" action={<Button href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")} variant="secondary"><LocalizedText>{"Spese erfassen"}</LocalizedText></Button>}/>{ledgerLoading?<LoadingState><LocalizedText>{"Spesen werden geladen …"}</LocalizedText></LoadingState>:ledgerErrors.expenses?<ErrorState onRetry={()=>setLedgerRetry(value=>value+1)} retryLabel="Erneut versuchen">{ledgerErrors.expenses}</ErrorState>:null}<div>{ledger.expenses.map(item=><RecordRow key={item.id} href={"/spesen/"+item.id} title={item.merchant} meta={swissDate(item.expense_date)} value={formatCurrency(item.amount,item.currency??"CHF")} status={({submitted:"Eingereicht",approved:"Genehmigt",posted:"Verbucht",draft:"Entwurf",rejected:"Abgelehnt"} as Record<string,string>)[item.status??""]??item.status}/>)}</div>{!ledgerLoading&&!ledgerErrors.expenses&&!ledger.expenses.length&&<EmptyState compact title="Keine Spesen erfasst" text=""/>}</section>}
    {existing&&employeeTab==="documents"&&<section className="surface employee-tab-panel"><SectionTitle title="Dokumente" action={canAddDocument?<><Button variant="secondary" disabled={uploadingDocument} onClick={()=>document.getElementById("employee-document-upload")?.click()}><LocalizedText>{uploadingDocument?"Wird hochgeladen…":"Dokument hinzufügen"}</LocalizedText></Button><Input id="employee-document-upload" hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv" onChange={e=>{void addDocument(e.target.files?.[0]);e.target.value=""}}/></>:undefined}/>{ledgerLoading?<LoadingState><LocalizedText>{"Dokumente werden geladen …"}</LocalizedText></LoadingState>:ledgerErrors.files?<ErrorState onRetry={()=>setLedgerRetry(value=>value+1)} retryLabel="Erneut versuchen">{ledgerErrors.files}</ErrorState>:null}<div>{ledger.files.map(item=><RecordRow key={item.id} href={"/api/files/"+item.id+"/download"} title={item.fileName} meta=""/>)}</div>{!ledgerLoading&&!ledgerErrors.files&&!ledger.files.length&&<EmptyState compact title="Keine Dokumente erfasst" text=""/>}</section>}
      </div>
      {existing&&<ContextActions><section className="context-action-group">{employeeTab!=="time"&&<Link href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")}><Icon name="clock"/><span><b><LocalizedText>{"Zeiterfassung"}</LocalizedText></b><small><LocalizedText>{"Arbeitszeiten öffnen"}</LocalizedText></small></span><Icon name="arrow" size={15}/></Link>}{employeeTab!=="expenses"&&<Link href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")}><Icon name="card"/><span><b><LocalizedText>{"Spese erfassen"}</LocalizedText></b><small><LocalizedText>{"Neue Ausgabe hinzufügen"}</LocalizedText></small></span><Icon name="arrow" size={15}/></Link>}</section></ContextActions>}
    </div>
    {toast&&<Toast title={toast} tone={toast==="Mitarbeiter gespeichert."||toast==="Dokument hinzugefügt."?"success":"danger"}/>}
  </AppShell>;
}
