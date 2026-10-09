"use client";

import { timeMetadata } from "@/lib/display-format";
import { TimeEntryRow } from "../records";

import { businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { filterTimeEntries } from "@/lib/time-entry-filter";
import { readTimer, changeTimer, withIdleTimerContext, type TimerState } from "@/lib/client/time-tracker";
import { AppShell } from "../app-shell";
import { customers } from "@/lib/demo-data";
import { apiGet, apiPatch, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import { Button, Field, Icon, SectionTitle, Status, Toast, Input, Select } from "../ui";
import { DetailTabs, ActionSheet, FormSheet, FilterSheet } from "../binso-ux";
import { formatMinutes, swissDate } from "./shared";

export function TimePage({forceDemo=false}:{forceDemo?:boolean}={}) {
  const searchParams=useSearchParams();
  const returnTo=searchParams.get("returnTo")==="/dashboard"?"/dashboard":undefined;
  const production=useBackendMode()&&!forceDemo;
  const employeeFilter=searchParams.get("employeeId");
  const projectFilter=searchParams.get("projectId");
  const [entriesError,setEntriesError]=useState<string|null>(null);
  const [entriesLoading,setEntriesLoading]=useState(!forceDemo);
  const [entryFilter,setEntryFilter]=useState(searchParams.has("invoice")?"Freigegeben":"Alle");
  const [entryQuery,setEntryQuery]=useState("");
  const [timeFilterOpen,setTimeFilterOpen]=useState(false);
  const [entryFrom,setEntryFrom]=useState("");
  const [entryTo,setEntryTo]=useState("");
  const [pendingFrom,setPendingFrom]=useState("");
  const [pendingTo,setPendingTo]=useState("");
  const [timeSaving,setTimeSaving]=useState(false);
  const timeBusy=useRef(false);
  const [manualBillable,setManualBillable]=useState(true);
  const [manualRate,setManualRate]=useState("0");
  const [canApprove,setCanApprove]=useState(false);
  const [canInvoice,setCanInvoice]=useState(false);
  useEffect(()=>{if(forceDemo)return;apiGet<{tenant?:{role?:string}}>("/api/auth/session").then(data=>{const role=data.tenant?.role;setCanApprove(["owner","admin","project_manager","manager"].includes(role??""));setCanInvoice(["owner","admin","finance"].includes(role??""));}).catch(()=>undefined);},[forceDemo]);
  const [timeTab,setTimeTab]=useState<"timer"|"entries">(employeeFilter||searchParams.has("invoice")?"entries":"timer");
  const [running,setRunning]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [manualOpen,setManualOpen]=useState(!!searchParams.get("customerId")&&!searchParams.has("invoice"));
  const [projectOpen,setProjectOpen]=useState(false);
  const [timerProject,setTimerProject]=useState("Interne Planung");
  const [timerProjectId,setTimerProjectId]=useState<string|null>(null);
  const [timerCustomer,setTimerCustomer]=useState("");
  const timerContext=useRef<Pick<TimerState,"project"|"projectId"|"customerId">|null>(null);
  const [manualDate,setManualDate]=useState("");
  const [manualDuration,setManualDuration]=useState("01:00");
  const [manualCustomer,setManualCustomer]=useState(searchParams.get("customerId")??"");
  const [manualProject,setManualProject]=useState(searchParams.get("projectId")??"");
  const [manualDescription,setManualDescription]=useState("");
  const [manualInternalCategory,setManualInternalCategory]=useState("Administration");
  const [availableProjects,setAvailableProjects]=useState<Array<{id:string;name:string;customer_id?:string|null;status?:string;hours?:number;invoiced_hours?:number;invoice_numbers?:string[]}>>([]);
  const [availableCustomers,setAvailableCustomers]=useState<Array<{id:string;name:string}>>([]);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{if(forceDemo)return;Promise.all([apiGet<{items:typeof availableProjects}>(isProductionBackendEnabled()?"/api/projects":"/api/demo/data?collection=projects"),apiGet<{items:typeof availableCustomers}>(isProductionBackendEnabled()?"/api/customers":"/api/demo/data?collection=customers")]).then(async([projects,customers])=>{setAvailableProjects(projects.items);setAvailableCustomers(customers.items);const selected=projects.items.find(item=>item.id===searchParams.get("projectId"));if(selected){timerContext.current={project:selected.name,projectId:selected.id,customerId:selected.customer_id??null};setManualCustomer(selected.customer_id??"");const state=withIdleTimerContext(await readTimer(),timerContext.current);setTimerProject(state.project);setTimerProjectId(state.projectId??null);setTimerCustomer(state.customerId??"");setRunning(state.running);setSeconds(state.seconds)}}).catch(()=>setToast("Kunden und Projekte konnten nicht geladen werden."));},[forceDemo,searchParams]);
  const [remoteEntries,setRemoteEntries]=useState<Array<{id:string;project_id?:string|null;project_name?:string|null;customer_id?:string|null;customer_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;billable?:boolean;approved?:boolean;submitted_at?:string|null;invoiced_invoice_id?:string|null;created_at?:string|null}>>([]);
  const [selectedTimeIds,setSelectedTimeIds]=useState<string[]>([]);
  const [billingOpen,setBillingOpen]=useState(false),[billingTarget,setBillingTarget]=useState(searchParams.get("invoice")??"");
  const [billingDrafts,setBillingDrafts]=useState<Array<{number:string;customer_id:string;status:string}>>([]),[billingError,setBillingError]=useState<string|null>(null);
  const openBilling=async()=>{setBillingOpen(true);setBillingError(null);try{const data=await apiGet<{items:typeof billingDrafts}>('/api/documents?kind=invoice');setBillingDrafts(data.items.filter(i=>i.status==='draft'));}catch(e){setBillingError(e instanceof Error?e.message:'Rechnungsentwürfe konnten nicht geladen werden.')}};

  useEffect(()=>{
    const sync=()=>{readTimer().then(saved=>{const state=withIdleTimerContext(saved,timerContext.current);setRunning(state.running);setSeconds(state.seconds);setTimerProject(state.project);setTimerProjectId(state.projectId??null);setTimerCustomer(state.customerId??"")}).catch(()=>undefined)};
    sync();
    const syncTimer=window.setInterval(sync,30000);
    window.addEventListener("focus",sync);
    queueMicrotask(()=>setManualDate(businessDate()));
    window.addEventListener("binso-timer-change",sync);
    return()=>{window.clearInterval(syncTimer);window.removeEventListener("focus",sync);window.removeEventListener("binso-timer-change",sync);};
  },[]);

  useEffect(()=>{
    apiGet<{items:Array<{id:string;project_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;created_at?:string|null}>}>(isProductionBackendEnabled()?"/api/time-entries"+(employeeFilter?"?employeeId="+encodeURIComponent(employeeFilter):""):"/api/demo/data?collection=time_entries")
      .then(payload=>queueMicrotask(()=>setRemoteEntries(payload.items)))
      .catch(error=>setEntriesError(error instanceof Error?error.message:"Zeiteinträge konnten nicht geladen werden.")).finally(()=>setEntriesLoading(false));
  },[production,forceDemo,employeeFilter]);

  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(value=>value+1),1000);return()=>window.clearInterval(id);},[running]);

  const setProject=async(project:string)=>{
    try{const selected=availableProjects.find(item=>item.id===project);const customerId=selected?.customer_id??null;const state=await changeTimer("project",selected?.name??project,selected?.id??null,customerId);timerContext.current={project:state.project,projectId:state.projectId??null,customerId:state.customerId??null};setTimerProjectId(selected?.id??null);setTimerCustomer(customerId??"");setTimerProject(state.project);setProjectOpen(false)}
    catch(error){setToast(error instanceof Error?error.message:"Projekt konnte nicht gespeichert werden.")}
  };
  const toggleTimer=async()=>{
    if(timeBusy.current)return;timeBusy.current=true;setTimeSaving(true);
    try{const selected=availableProjects.find(item=>item.id===timerProjectId);const state=await changeTimer(running?"pause":"start",timerProject,selected?.id??null,timerCustomer||null);setRunning(state.running);setSeconds(state.seconds)}
    catch(error){setToast(error instanceof Error?error.message:"Zeitmessung konnte nicht gespeichert werden.")}
    finally{timeBusy.current=false;setTimeSaving(false)}
  };

  const formatted=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60].map(value=>String(value).padStart(2,"0")).join(":");

  const stop=async()=>{
    if(timeBusy.current)return;timeBusy.current=true;setTimeSaving(true);
    try{
      await changeTimer("finish",timerProject);
      setRunning(false);setSeconds(0);setToast("Zeiteintrag gespeichert.");
      if(production){const payload=await apiGet<{items:typeof remoteEntries}>("/api/time-entries"+(employeeFilter?"?employeeId="+encodeURIComponent(employeeFilter):""));setRemoteEntries(payload.items)}
    }catch(error){setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.")}
    finally{timeBusy.current=false;setTimeSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const saveManual=async()=>{
    if(timeBusy.current)return;
    const [hours,minutes]=manualDuration.split(":").map(Number);
    const durationMinutes=(Number.isFinite(hours)?hours:0)*60+(Number.isFinite(minutes)?minutes:0);
    if(!/^\d{1,2}:[0-5]\d$/.test(manualDuration)||durationMinutes<=0||durationMinutes>1440||!/^\d{4}-\d{2}-\d{2}$/.test(manualDate)){
      setToast("Bitte eine gültige Dauer erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    timeBusy.current=true;setTimeSaving(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:typeof remoteEntries[number]}>("/api/time-entries",{customerId:manualCustomer||null,projectId:manualProject||null,projectName:availableProjects.find(item=>item.id===manualProject)?.name||(manualCustomer?"Arbeitszeit":manualInternalCategory),description:manualDescription,startedAt:manualDate+"T12:00:00",durationMinutes,billable:!!manualCustomer&&manualBillable,salesRate:Number(manualRate)});
        setRemoteEntries(current=>[payload.item,...current]);
      }
      setManualOpen(false);
      setToast("Zeiteintrag gespeichert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.");
    }
    finally{timeBusy.current=false;setTimeSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const demoEntries=<div>{[{title:"Website Redesign",meta:"Acme AG · 09:27–11:41",value:"2:14 h"},{title:"Kundenmeeting",meta:"Müller GmbH · 13:00–14:30",value:"1:30 h"},{title:"Planung",meta:"Intern · 15:10–15:54",value:"0:44 h"}].map(item=><TimeEntryRow key={item.title} {...item}/>)}</div>;
  const submitTime=async(id:string)=>{try{const data=await apiPatch<{item:{submitted_at:string}}>("/api/time-entries/"+encodeURIComponent(id),{action:"submit"});setRemoteEntries(current=>current.map(item=>item.id===id?{...item,submitted_at:data.item.submitted_at}:item));}catch(e){setToast(e instanceof Error?e.message:"Zeit konnte nicht eingereicht werden.")}};
  const approveTime=async(id:string)=>{try{await apiPatch("/api/time-entries/"+encodeURIComponent(id),{});setRemoteEntries(current=>current.map(item=>item.id===id?{...item,approved:true}:item));setToast("Zeit freigegeben.");}catch(error){setToast(error instanceof Error?error.message:"Zeit konnte nicht freigegeben werden.");}window.setTimeout(()=>setToast(null),2200)};
  const today=businessDate();
  const visibleEntries=filterTimeEntries(remoteEntries,{projectId:timeTab==="timer"?timerProjectId:projectFilter,customerId:timeTab==="timer"?timerCustomer||null:searchParams.has("invoice")?searchParams.get("customerId"):null,query:timeTab==="entries"?entryQuery:"",from:timeTab==="timer"?today:entryFrom,to:timeTab==="timer"?today:entryTo,status:timeTab==="entries"?entryFilter:"Alle"}).filter(item=>timeTab!=="timer"||((timerCustomer||(!item.customer_id&&!item.billable))&&(timerProjectId||["Arbeitszeit","Interne Planung"].includes(timerProject)||item.project_name===timerProject)));
  const billableSelection=visibleEntries.filter(item=>selectedTimeIds.includes(item.id)&&item.customer_id&&item.billable&&item.approved&&!item.invoiced_invoice_id);
  const mixedCustomers=new Set(billableSelection.map(item=>item.customer_id)).size>1;
  const remoteTotal=visibleEntries.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0);
  const invoiceHref=billableSelection.length?"/rechnungen/neu?timeEntries="+encodeURIComponent(billableSelection.map(item=>item.id).join(",")):"";
  const groupedEntries=Object.entries(visibleEntries.reduce<Record<string,typeof remoteEntries>>((groups,item)=>{const key=JSON.stringify([item.customer_id??(item.billable?"unassigned":"internal"),item.project_id??item.project_name??"no-project"]);(groups[key]??=[]).push(item);return groups},{}));
  const productionEntries=entriesLoading?<p role="status">Zeiteinträge werden geladen …</p>:entriesError?<p role="alert">{entriesError}</p>:visibleEntries.length?<div className="time-groups">{groupedEntries.map(([group,items])=><details className="time-group" key={group}><summary className="time-group-head"><div><b>{items[0].customer_name||(items[0].billable?"Ohne Kundenzuordnung":"Intern")}</b><small>{items[0].project_name||"Ohne Auftrag"}</small></div><strong>{formatMinutes(items.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0))}</strong><Icon name="down" size={16}/></summary><div className="time-record-list">{items.map(item=><TimeEntryRow key={item.id} title={item.description||item.project_name||"Zeiteintrag"} meta={timeMetadata(item.description||item.project_name,item.project_name,item.employee_name,swissDate(item.started_at))} value={formatMinutes(Number(item.duration_minutes??0))+" h"} status={item.invoiced_invoice_id?"Verrechnet":item.billable&&!item.customer_id?"Zuordnen":item.approved?"Freigegeben":item.billable?(item.submitted_at?"Zur Prüfung":"Erfasst"):"Intern"} selection={canInvoice&&item.customer_id&&item.billable&&item.approved&&!item.invoiced_invoice_id?<Input type="checkbox" aria-label="Zeit für Rechnung auswählen" checked={selectedTimeIds.includes(item.id)} onChange={e=>setSelectedTimeIds(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/>:undefined} action={!item.invoiced_invoice_id&&!item.approved&&item.billable?(canApprove?<button type="button" className="text-action" onClick={()=>void approveTime(item.id)}>Freigeben</button>:!item.submitted_at?<button type="button" className="text-action" onClick={()=>void submitTime(item.id)}>Zur Prüfung</button>:undefined):undefined}/>)}</div></details>)}</div>:<p role="status">{remoteEntries.length?"Keine Zeiteinträge für diese Auswahl":"Keine Zeiteinträge erfasst"}</p>;

  return <AppShell title="Zeiterfassung" subtitle="Arbeitszeit einfach und präzise erfassen." active="zeit" backHref={returnTo} backLabel="Übersicht">

    {searchParams.get("projectId")&&availableProjects.filter(project=>project.id===searchParams.get("projectId")).map(project=><section className="surface" key={project.id}><SectionTitle title={project.name}/><p>{availableCustomers.find(customer=>customer.id===project.customer_id)?.name??'Intern'} · {({planned:'Geplant',active:'Aktiv',in_progress:'Aktiv',blocked:'Blockiert',completed:'Abgeschlossen',cancelled:'Storniert'} as Record<string,string>)[project.status??'']??project.status}</p><p>{Number(project.hours??0).toLocaleString('de-CH',{maximumFractionDigits:2})} h erfasst · {Number(project.invoiced_hours??0).toLocaleString('de-CH',{maximumFractionDigits:2})} h verrechnet</p>{project.invoice_numbers?.map(number=><Link key={number} href={'/rechnungen/'+encodeURIComponent(number)}>{number}</Link>)}</section>)}
    <DetailTabs role="tablist" label="Zeiterfassung"><button role="tab" aria-selected={timeTab==="timer"} className={timeTab==="timer"?"active":""} onClick={()=>setTimeTab("timer")}>Timer</button><button role="tab" aria-selected={timeTab==="entries"} className={timeTab==="entries"?"active":""} onClick={()=>setTimeTab("entries")}>Einträge</button></DetailTabs>
    {canApprove&&timeTab==="entries"&&<Button className="time-project-create" variant="secondary" href="/projekte/neu" icon="plus">Auftrag / Projekt starten</Button>}
    {employeeFilter&&<p role="status">Arbeitszeiten des ausgewählten Mitarbeiters · <Link href="/zeit">Alle anzeigen</Link></p>}
    {timeTab==="entries"&&<div className="toolbar time-filter-toolbar"><label className="searchbox"><Icon name="search"/><Input aria-label="Zeiteinträge suchen" placeholder="Kunde, Mitarbeiter oder Tätigkeit suchen" value={entryQuery} onChange={e=>setEntryQuery(e.target.value)}/></label><button type="button" className="icon-button" aria-label="Zeitfilter" onClick={()=>{setPendingFrom(entryFrom);setPendingTo(entryTo);setTimeFilterOpen(true)}}><Icon name="filter"/></button></div>}
    <FilterSheet label="Zeitfilter" open={timeFilterOpen} onClose={()=>setTimeFilterOpen(false)}><div className="sheet-body form-grid two"><Field allowReadOnlyInput label="Von"><Input type="date" value={pendingFrom} max={pendingTo||undefined} onChange={e=>setPendingFrom(e.target.value)}/></Field><Field allowReadOnlyInput label="Bis"><Input type="date" value={pendingTo} min={pendingFrom||undefined} onChange={e=>setPendingTo(e.target.value)}/></Field></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>{setEntryQuery("");setEntryFrom("");setEntryTo("");setEntryFilter("Alle");setSelectedTimeIds([]);setTimeFilterOpen(false)}}>Zurücksetzen</Button><Button disabled={!!pendingFrom&&!!pendingTo&&pendingFrom>pendingTo} onClick={()=>{setEntryFrom(pendingFrom);setEntryTo(pendingTo);setTimeFilterOpen(false)}}>Anwenden</Button></div></FilterSheet>
    {timeTab==="entries"&&<div className="chips" aria-label="Zeitstatus">{["Alle","Erfasst","Zur Prüfung","Freigegeben","Verrechnet","Intern"].map(filter=><button type="button" key={filter} aria-pressed={entryFilter===filter} className={entryFilter===filter?"active":""} onClick={()=>setEntryFilter(filter)}>{filter}</button>)}</div>}
    {mixedCustomers&&<p role="alert">Bitte nur Zeiten eines Kunden für eine Rechnung auswählen.</p>}

    <div className="time-layout">
      <section className="time-section timer-card">
        {timeTab==="timer"?<>
          <div className="timer-project"><Field label="Kunde"><Select disabled={running||seconds>0||!!availableProjects.find(item=>item.id===timerProjectId)?.customer_id} value={timerCustomer} onChange={e=>{timerContext.current={project:e.target.value?"Arbeitszeit":"Interne Planung",projectId:null,customerId:e.target.value||null};setTimerCustomer(e.target.value);setTimerProjectId(null);setTimerProject(e.target.value?"Arbeitszeit":"Interne Planung")}}><option value="">Intern</option>{availableCustomers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Auftrag / Projekt"><button type="button" disabled={running||seconds>0} onClick={()=>setProjectOpen(true)}>{timerProject} <Icon name="down" size={16}/></button></Field></div>
          <div className={`timer-display ${running?"is-running":"is-paused"}`}><div><small>{running?"Läuft":seconds>0?"Pausiert":"Bereit"}</small><strong>{formatted}</strong><span>{timerProject}</span></div></div>
          <div className="timer-actions"><Button requiresWrite disabled={timeSaving} onClick={toggleTimer} icon={running?"pause":"clock"}>{running?"Pause":seconds>0?"Fortsetzen":"Starten"}</Button>{(running||seconds>0)&&<Button requiresWrite variant="secondary" icon="stop" onClick={()=>void stop()} disabled={timeSaving}>Stoppen</Button>}</div>
        </>:<>
          <SectionTitle title={!forceDemo?"Gesamtzeit":"Heutige Einträge"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":"4:28 h"}</strong>}/>
          {!forceDemo?productionEntries:demoEntries}
          <div className="time-entry-actions"><Button requiresWrite variant="secondary" icon="plus" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>{canInvoice&&billableSelection.length>0&&!mixedCustomers&&<Button onClick={()=>void openBilling()} icon="receipt">Verrechnen ({billableSelection.length})</Button>}</div>
        </>}
      </section>
      {timeTab==="timer"&&<section className="time-section time-overview-section">
        <SectionTitle title={!forceDemo?("Heute"):timeTab==="timer"?"Heute":"Diese Woche"} action={<strong>{!forceDemo?formatMinutes(remoteTotal)+" h":timeTab==="timer"?"4:28 h":"28:15 h"}</strong>}/>
        {!forceDemo?productionEntries:timeTab==="timer"?demoEntries:<div className="time-summary-row"><div><small>Montag</small><b>7:42 h</b></div><div><small>Dienstag</small><b>8:05 h</b></div><div><small>Heute</small><b>4:28 h</b></div></div>}
        {timeTab==="timer"&&<Button variant="secondary" icon="plus" className="full-button" onClick={()=>setManualOpen(true)}>Manuell erfassen</Button>}
      </section>}
    </div>
    <ActionSheet label="Projekt auswählen" description="Die Zeit wird direkt dem gewählten Projekt zugeordnet." className="project-sheet" open={projectOpen} onClose={()=>setProjectOpen(false)}><div className="choice-list">{[{id:"Administration",name:"Administration",customer_id:null},{id:"Weiterbildung",name:"Weiterbildung",customer_id:null},{id:"Interne IT",name:"Interne IT",customer_id:null},...availableProjects].map(project=><button type="button" key={project.id} className={timerProjectId===project.id||!timerProjectId&&timerProject===project.name?"active":""} onClick={()=>setProject(project.id)}><div><b>{project.name}</b><small>{availableCustomers.find(customer=>customer.id===project.customer_id)?.name??"Intern"}</small></div>{(timerProjectId===project.id||!timerProjectId&&timerProject===project.name)?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div></ActionSheet>
    <FormSheet label="Zeit erfassen" ariaLabel="Zeit manuell erfassen" description="Eintrag direkt dem Kunden oder Projekt zuordnen." className="manual-time-sheet" open={manualOpen} busy={timeSaving} onClose={()=>setManualOpen(false)}><div className="sheet-body"><div className="form-grid two"><Field label="Datum"><Input type="date" value={manualDate} onChange={e=>setManualDate(e.target.value)}/></Field><Field label="Dauer"><Input type="text" inputMode="text" maxLength={5} placeholder="HH:MM" aria-label="Dauer in Stunden und Minuten" value={manualDuration} onChange={e=>setManualDuration(e.target.value)}/></Field>{production?<Field label="Kunde"><Select disabled={!!availableProjects.find(item=>item.id===manualProject)?.customer_id} value={manualCustomer} onChange={e=>{setManualCustomer(e.target.value);setManualProject("")}}><option value="">Intern</option>{availableCustomers.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>:<Field label="Kunde"><Select value={manualCustomer||"Acme AG"} onChange={e=>setManualCustomer(e.target.value)}><option>Acme AG</option><option>Müller GmbH</option></Select></Field>}{production?<Field label="Auftrag / Projekt"><Select value={manualProject} onChange={e=>{setManualProject(e.target.value);const project=availableProjects.find(item=>item.id===e.target.value);if(project)setManualCustomer(project.customer_id??"")}}><option value="">Keine Zuordnung</option>{availableProjects.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>:<Field label="Projekt"><Select value={manualProject==="Interne Planung"?"Website Redesign":manualProject} onChange={e=>{setManualProject(e.target.value);const project=availableProjects.find(item=>item.id===e.target.value);if(project)setManualCustomer(project.customer_id??"")}}><option>Website Redesign</option><option>Support</option></Select></Field>}<>{!manualCustomer&&!manualProject&&<Field label="Interne Tätigkeit"><Select value={manualInternalCategory} onChange={e=>setManualInternalCategory(e.target.value)}><option>Administration</option><option>Weiterbildung</option><option>Interne IT</option></Select></Field>}</><Field className="full" label="Beschreibung"><Input value={manualDescription} onChange={e=>setManualDescription(e.target.value)} placeholder="Was wurde gemacht?"/></Field>{production&&manualCustomer&&<><Field label="Verrechenbar"><Input type="checkbox" checked={manualBillable} onChange={e=>setManualBillable(e.target.checked)}/></Field><Field label="Stundensatz CHF"><Input type="number" min="0" step="0.05" disabled={!manualBillable} value={manualRate} onChange={e=>setManualRate(e.target.value)}/></Field></>}</div></div><div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setManualOpen(false)}>Abbrechen</Button><Button requiresWrite disabled={timeSaving} onClick={()=>void saveManual()}>{timeSaving?"Wird gespeichert…":"Speichern"}</Button></div></FormSheet>
    <FormSheet label="Zeiten verrechnen" description="Die Verknüpfung erfolgt erst beim Speichern der Rechnung." open={billingOpen} onClose={()=>setBillingOpen(false)}><Field allowReadOnlyInput label="Rechnung"><Select value={billingTarget} onChange={e=>setBillingTarget(e.target.value)}><option value="">Neue Rechnung</option>{billingDrafts.filter(i=>i.customer_id===billableSelection[0]?.customer_id).map(i=><option key={i.number} value={i.number}>{i.number} · Entwurf</option>)}</Select></Field>{billingError&&<p role="alert">{billingError}</p>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setBillingOpen(false)}>Abbrechen</Button><Button disabled={!billableSelection.length||mixedCustomers||!!billingError} href={billingTarget?'/rechnungen/'+encodeURIComponent(billingTarget)+'?timeEntries='+encodeURIComponent(billableSelection.map(i=>i.id).join(',')):invoiceHref}>Positionen übernehmen</Button></div></FormSheet>
    {toast&&<Toast title={toast} tone={["Zeiteintrag gespeichert.","Zeit freigegeben."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}
