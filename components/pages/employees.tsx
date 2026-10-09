"use client";
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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView, TimeEntryRow } from "../records";
import { employees, expenses } from "@/lib/demo-data";
import { appendDemoRow } from "@/lib/demo-storage";
import { apiGet, apiPatch, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, Field, Icon, SectionTitle, Toast, Input, Select } from "../ui";
import { ActionRow, ActionsMenu, CreateAction } from "../binso-ux";
import { useDemoRows, swissDate, formatMinutes } from "./shared";

export function EmployeesPage() {
  const {rows:employeeRows,loading,error}=useDemoRows("employees",employees);
  return <AppShell title="Mitarbeiter" subtitle="Team, Rollen und Stammdaten verwalten." active="mitarbeiter" actions={<CreateAction href="/mitarbeiter/neu" label="Mitarbeiter hinzufügen"/>}>
    <RecordsView countLabel="Mitarbeiter" loading={loading} error={error} items={employeeRows} placeholder="Mitarbeiter suchen..." columns={[{label:"Mitarbeiter",index:0,render:row=><span className="person-record"><Avatar name={row[0]} identity={row[4]?row[3]:row[0]}/><span>{row[0]}</span></span>},{label:"Funktion",index:1},{label:"Pensum",index:2},{label:"Status",index:4,status:true}]} rowHref={row=>`/mitarbeiter/${row[4]?row[3]:"thomas"}`}>{(row)=>{const [name,role,load,idOrStatus,statusMaybe]=row;const id=statusMaybe?idOrStatus:"thomas";const status=statusMaybe??idOrStatus;return <RecordRow personIdentity={id} href={"/mitarbeiter/"+id} icon="users" title={name} meta={`${role} · ${load}`} status={status}/>}}</RecordsView>
  </AppShell>;
}

export function EmployeeForm({ existing = false, employeeId }: { existing?: boolean; employeeId?: string }) {
  const router=useRouter();
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
  const [loadingRecord,setLoadingRecord]=useState(existing);
  const [recordError,setRecordError]=useState<string|null>(null);
  const [savingRecord,setSavingRecord]=useState(false);
  const saveRecordPending=useRef(false);
  const {dirty,markPristine}=useDirtySnapshot([firstName,lastName,email,phone,role,load,entryDate,weeklyHours,vacationDays,address,status]);
  const [savedRecord,setSavedRecord]=useState(false);
  const [editingRecord,setEditingRecord]=useState(!existing);

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
  },[production,existing,employeeId,ledgerRetry]);
  useEffect(()=>{
    if(!existing||!employeeId) return;
    apiGet<{item?:Record<string,unknown>;items?:Record<string,unknown>[]}>(isProductionBackendEnabled()?"/api/employees/"+encodeURIComponent(employeeId):"/api/demo/data?collection=employees&id="+encodeURIComponent(employeeId)).then(payload=>{
      const item=payload.item??payload.items?.[0];
      if(!item)throw new Error("Mitarbeiter wurde nicht gefunden.");
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
    }).catch(error=>setRecordError(error instanceof Error?error.message:"Mitarbeiter konnte nicht geladen werden.")).finally(()=>setLoadingRecord(false));
  },[production,existing,employeeId,markPristine]);

  const save=async()=>{
    if(saveRecordPending.current||loadingRecord||recordError)return;
    if(!firstName.trim()||!lastName.trim()||!role.trim()){setToast("Name und Funktion sind erforderlich.");window.setTimeout(()=>setToast(null),2200);return;}
    const validation=employeeInputIssue({email,entryDate,workloadPercent:load,weeklyHours,vacationDays});
    if(validation){setToast(validation);return;}
    saveRecordPending.current=true;setSavingRecord(true);
    try{
      const payload={firstName:firstName.trim(),lastName:lastName.trim(),email,phone,jobTitle:role.trim(),workloadPercent:Number(load),entryDate,weeklyHours:Number(weeklyHours),vacationDays:Number(vacationDays),address,status:status==="Inaktiv"?"inactive":"active"};
      if(production){
        if(existing&&employeeId) await apiPatch("/api/employees/"+encodeURIComponent(employeeId),payload);
        else await apiPost("/api/employees",payload);
      }else if(!existing){
        appendDemoRow("employees",[firstName.trim()+" "+lastName.trim(),role.trim(),load+"%",status]);
      }
      setSavedRecord(true);
      setToast("Mitarbeiter gespeichert.");
      window.setTimeout(()=>router.push("/mitarbeiter"),700);
    }catch(error){
      saveRecordPending.current=false;setSavingRecord(false);
      setToast(error instanceof Error?error.message:"Mitarbeiter konnte nicht gespeichert werden.");
      window.setTimeout(()=>setToast(null),2600);
    }
  };

  const displayName=[firstName,lastName].filter(Boolean).join(" ")||"Mitarbeiter";
  if(loadingRecord||recordError)return <AppShell title="Mitarbeiter" subtitle={recordError?"Mitarbeiterdaten nicht verfügbar":"Daten werden geladen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter">{loadingRecord?<div role="status"><EmptyState icon="users" title="Mitarbeiter wird geladen" text="Die Mitarbeiterdaten werden abgerufen."/></div>:<><div role="alert"><EmptyState icon="users" title="Mitarbeiter konnte nicht geladen werden" text={recordError??"Bitte versuche es erneut."}/></div><div className="page-actions"><Button onClick={()=>window.location.reload()}>Erneut versuchen</Button><Button href="/mitarbeiter" variant="ghost">Zur Übersicht</Button></div></>}</AppShell>;
  return <AppShell unsavedChanges={dirty&&!savedRecord} title={existing ? displayName : "Mitarbeiter hinzufügen"} status={existing?status:undefined} statusTone={status==="Aktiv"?"success":"neutral"} editing={editingRecord} subtitle={existing ? role+" · "+formatQuantity(load,"%") : "Nur die wichtigsten Stammdaten erfassen."} active="mitarbeiter" backHref="/mitarbeiter" backLabel="Mitarbeiter" actions={existing?<><ActionsMenu label="Mitarbeiteraktionen" busy={savingRecord}>{!editingRecord&&<ActionRow requiresWrite icon="edit" onClick={()=>{setEditingRecord(true);setEmployeeTab("overview")}} title="Bearbeiten" navigation/>}<ActionRow href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")} icon="clock" title="Zeiterfassung öffnen" navigation/><ActionRow href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")} icon="card" title="Spese erfassen" navigation/></ActionsMenu></>:undefined}>
    <div className={existing?"entity-detail-workspace":"desktop-detail-single"}>

      <div className="desktop-detail-main">
    {existing && <DetailTabs role="tablist" label="Mitarbeiterbereiche">
      <button role="tab" aria-selected={employeeTab==="overview"} className={employeeTab==="overview"?"active":""} onClick={()=>setEmployeeTab("overview")}>Übersicht</button>
      <button role="tab" aria-selected={employeeTab==="time"} className={employeeTab==="time"?"active":""} onClick={()=>setEmployeeTab("time")}>Arbeitszeit</button>
      <button role="tab" aria-selected={employeeTab==="expenses"} className={employeeTab==="expenses"?"active":""} onClick={()=>setEmployeeTab("expenses")}>Spesen</button>
      <button role="tab" aria-selected={employeeTab==="documents"} className={employeeTab==="documents"?"active":""} onClick={()=>setEmployeeTab("documents")}>Dokumente</button>
    </DetailTabs>}
    {(!existing||employeeTab==="overview")&&<div className="form-page" inert={savingRecord}>
      {!editingRecord?<><div className="settings-profile"><Avatar name={displayName} identity={employeeId} size="large"/><span>{role}</span></div><SectionTitle title="Mitarbeiterdetails"/><dl className="detail-list">
        <div className="detail-list-stacked"><dt>E-Mail</dt><dd>{email?<a href={"mailto:"+email}>{email}</a>:"Keine E-Mail hinterlegt"}</dd></div>
        {phone&&<div><dt>Telefon</dt><dd><a href={"tel:"+phone}>{phone}</a></dd></div>}
        {entryDate&&<div><dt>Eintritt</dt><dd>{swissDate(entryDate)}</dd></div>}
        <div><dt>Wochenstunden</dt><dd>{formatQuantity(weeklyHours,"h/Woche")}</dd></div>
        <div><dt>Ferientage / Jahr</dt><dd>{formatQuantity(vacationDays,"Tage/Jahr")}</dd></div>
        {address&&<div><dt>Adresse</dt><dd>{address}</dd></div>}
      </dl></>:<FormWizard guided={!existing} labels={["Persönliche Daten","Arbeitsverhältnis"]} step={wizardStep} onStep={setWizardStep} busy={savingRecord} action={<Button requiresWrite disabled={savingRecord} onClick={()=>void save()}>{savingRecord?"Wird gespeichert…":"Speichern"}</Button>}><div className="form-grid two" hidden={!existing&&wizardStep!==0}>
        <Field label="Vorname"><Input required autoComplete="given-name" value={firstName} onChange={e=>setFirstName(e.target.value)}/></Field>
        <Field label="Nachname"><Input required autoComplete="family-name" value={lastName} onChange={e=>setLastName(e.target.value)}/></Field>
        <Field label="E-Mail"><Input required autoComplete="email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/></Field>
        <Field label="Telefon"><Input type="tel" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)}/></Field>
        <Field label="Funktion"><Input required value={role} onChange={e=>setRole(e.target.value)}/></Field>
        <Field label="Pensum (%)"><Input type="number" min="0" max="100" required inputMode="numeric" value={load} onChange={e=>setLoad(e.target.value)} placeholder="%"/></Field>
      </div><div className="form-grid two" hidden={!existing&&wizardStep!==1}>
        <Field label="Eintritt"><Input type="date" value={entryDate} onChange={e=>setEntryDate(e.target.value)}/></Field>
        <Field label="Wochenstunden (h/Woche)"><Input type="number" min="0.1" max="80" step="0.1" required inputMode="decimal" value={weeklyHours} onChange={e=>setWeeklyHours(e.target.value)}/></Field>
        <Field label="Ferientage / Jahr"><Input type="number" min="0" max="60" step="0.5" required inputMode="decimal" value={vacationDays} onChange={e=>setVacationDays(e.target.value)}/></Field>
        <Field label="Adresse" className="full"><Input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Strasse, PLZ Ort"/></Field>
        <Field label="Status"><Select value={status} onChange={e=>setStatus(e.target.value)}><option>Aktiv</option><option>Inaktiv</option></Select></Field>
      </div></FormWizard>}
    </div>}
    {existing&&employeeTab==="time"&&<section className="surface employee-tab-panel"><SectionTitle title="Arbeitszeit" action={<Button href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")} variant="secondary">Zeiterfassung öffnen</Button>}/>{ledgerLoading?<p role="status">Arbeitszeiten werden geladen …</p>:ledgerErrors.times?<div role="alert"><p>{ledgerErrors.times}</p><Button variant="secondary" onClick={()=>setLedgerRetry(value=>value+1)}>Erneut versuchen</Button></div>:null}<div>{ledger.times.map(item=><TimeEntryRow key={item.id} title={item.description||item.project_name||"Zeiteintrag"} meta={timeMetadata(item.description||item.project_name,item.project_name,undefined,swissDate(item.started_at))} value={formatMinutes(Number(item.duration_minutes))+" h"} status={item.invoiced_invoice_id?"Verrechnet":item.approved?"Freigegeben":item.billable===false?"Intern":"Erfasst"}/>)}</div>{!ledgerLoading&&!ledgerErrors.times&&!ledger.times.length&&<EmptyState compact title="Keine Arbeitszeiten erfasst" text=""/>}</section>}
    {existing&&employeeTab==="expenses"&&<section className="surface employee-tab-panel"><SectionTitle title="Spesen" action={<Button href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")} variant="secondary">Spese erfassen</Button>}/>{ledgerLoading?<p role="status">Spesen werden geladen …</p>:ledgerErrors.expenses?<div role="alert"><p>{ledgerErrors.expenses}</p><Button variant="secondary" onClick={()=>setLedgerRetry(value=>value+1)}>Erneut versuchen</Button></div>:null}<div>{ledger.expenses.map(item=><RecordRow key={item.id} href={"/spesen/"+item.id} title={item.merchant} meta={swissDate(item.expense_date)} value={formatCurrency(item.amount,item.currency??"CHF")} status={({submitted:"Eingereicht",approved:"Genehmigt",posted:"Verbucht",draft:"Entwurf",rejected:"Abgelehnt"} as Record<string,string>)[item.status??""]??item.status}/>)}</div>{!ledgerLoading&&!ledgerErrors.expenses&&!ledger.expenses.length&&<EmptyState compact title="Keine Spesen erfasst" text=""/>}</section>}
    {existing&&employeeTab==="documents"&&<section className="surface employee-tab-panel"><SectionTitle title="Dokumente" action={canAddDocument?<><Button variant="secondary" disabled={uploadingDocument} onClick={()=>document.getElementById("employee-document-upload")?.click()}>{uploadingDocument?"Wird hochgeladen…":"Dokument hinzufügen"}</Button><Input id="employee-document-upload" hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv" onChange={e=>{void addDocument(e.target.files?.[0]);e.target.value=""}}/></>:undefined}/>{ledgerLoading?<p role="status">Dokumente werden geladen …</p>:ledgerErrors.files?<div role="alert"><p>{ledgerErrors.files}</p><Button variant="secondary" onClick={()=>setLedgerRetry(value=>value+1)}>Erneut versuchen</Button></div>:null}<div>{ledger.files.map(item=><RecordRow key={item.id} href={"/api/files/"+item.id+"/download"} title={item.fileName} meta=""/>)}</div>{!ledgerLoading&&!ledgerErrors.files&&!ledger.files.length&&<EmptyState compact title="Keine Dokumente erfasst" text=""/>}</section>}
      </div>
      {existing&&<aside className="desktop-context-rail"><section className="desktop-toolbox">{employeeTab!=="time"&&<Link href={"/zeit?employeeId="+encodeURIComponent(employeeId??"")}><Icon name="clock"/><span><b>Zeiterfassung</b><small>Arbeitszeiten öffnen</small></span><Icon name="arrow" size={15}/></Link>}{employeeTab!=="expenses"&&<Link href={"/spesen/neu?employeeId="+encodeURIComponent(employeeId??"")}><Icon name="card"/><span><b>Spese erfassen</b><small>Neue Ausgabe hinzufügen</small></span><Icon name="arrow" size={15}/></Link>}</section></aside>}
    </div>
    {toast&&<Toast title={toast} tone={toast==="Mitarbeiter gespeichert."||toast==="Dokument hinzugefügt."?"success":"danger"}/>}
  </AppShell>;
}
