"use client";
import {timeEntryStatus} from '@/lib/time-entry-status';

import {useStatisticPeriod} from '@/lib/client/statistic-period';
import {statisticBounds} from '@/lib/statistics-period';
import {StatisticPeriodPicker} from '../statistic-period-picker';
import {ReportActions} from '../report-actions';
import {TimerControls} from '../timer-controls';
import {dataRevision} from '@/lib/client/data-events';
import {projectAllowsTime} from "@/lib/projects";
import {useProcessDraft} from "../use-process-draft";
import {LocalizedText,LocalizedElement,useTranslation} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";


import { timeMetadata,formatTimeDuration } from "@/lib/display-format";
import {RecordsPagination, TimeEntryGroup, TimeEntryRow } from "../records";

import { businessDate } from "@/lib/financial-status";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {tenantCan} from "@/lib/permissions";
import { filterTimeEntries,timeEntryQuery } from "@/lib/time-entry-filter";
import { readTimer, changeTimer, withIdleTimerContext, type TimerState } from "@/lib/client/time-tracker";
import { AppShell } from "../app-shell";
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import { apiGet, apiPatch, apiPost, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, Icon, SectionTitle, Status, Toast, Input, Select, LoadingState, ErrorState, IconButton, FormActions} from "../ui";
import { DetailTabs, ActionSheet, FormSheet, FilterSheet, ListSearch, CreateAction, ActionsMenu, ActionRow } from "../binso-ux";
import {DirectorySelect} from "../directory-select";
import {TimePriceSource} from '../time-price-source';
import {MonthlyTimeReport} from "../monthly-time-report";
import { formatMinutes, swissDate } from "./shared";

type TimeEntry={id:string;external_resource_id?:string|null;time_category?:string|null;is_work_time?:boolean|null;payroll_relevant?:boolean|null;created_by_user_id?:string|null;report_month?:string|null;review_note?:string|null;project_id?:string|null;project_name?:string|null;customer_id?:string|null;customer_name?:string|null;employee_name?:string|null;description?:string|null;started_at?:string|null;ended_at?:string|null;duration_minutes?:number|null;billable?:boolean;approved?:boolean;submitted_at?:string|null;invoiced_invoice_id?:string|null;created_at?:string|null};

function PriceSourceHeaderTrigger({onClick}:{onClick?:()=>void}){return <ActionsMenu header label="Rapportaktionen"><ActionRow title="Preisquelle" icon="wallet" onClick={onClick}/></ActionsMenu>;}

export function TimePage() {
  const searchParams=useSearchParams(),router=useRouter(),t=useTranslation();
  const classificationLabels:Record<string,string>={work:"Arbeit",travel:"Reise",break:"Pause",other:"Sonstiges"};
  const classificationMeta=(item:TimeEntry)=>item.time_category?[item.external_resource_id?t("Externe Ressource"):null,t(classificationLabels[item.time_category]??"Sonstiges"),t(item.is_work_time?"Arbeitszeit":"Keine Arbeitszeit"),t(item.payroll_relevant?"Lohnprüfung beantragt":"Nicht lohnrelevant")].filter(Boolean).join(" · "):t("Nicht klassifiziert");
  const returnTo=searchParams.has("returnTo")?safeAppPath(searchParams.get("returnTo"),"/zeit"):undefined;
  const production=true;
  const directoryRevision=useDataRevision(["/api/customers","/api/projects"]);
  const timerRevision=useDataRevision(["/api/time-tracker"]);
  const timerBase=useRef({seconds:0,at:0});
  const employeeFilter=searchParams.get("employeeId");
  const reviewMode=searchParams.get("review")==="1";
  const projectFilter=searchParams.get("projectId");
  const customerFilter=searchParams.get("customerId");
  // A context reset stays in the same evaluation and retains its period/search.
  const [periodScope]=useState(projectFilter);
  const resetContext=(key:"projectId"|"customerId")=>{const params=new URLSearchParams(searchParams.toString());params.delete(key);params.delete("manual");params.set("tab","entries");router.replace("/zeit?"+params.toString(),{scroll:false});};
  const [entryFilter,setEntryFilter]=useState(searchParams.has("invoice")?"Freigegeben":"Alle");
  const [entryQuery,setEntryQuery]=useState("");
  const [timeFilterOpen,setTimeFilterOpen]=useState(false);
  const [pendingStatus,setPendingStatus]=useState("Alle");
  const [entryPeriod,setEntryPeriod,entryPeriodReady]=useStatisticPeriod('time-entries:'+String(employeeFilter??'')+':'+String(periodScope??'')+':'+String(reviewMode),null);
  const entryBounds=entryPeriod&&statisticBounds(entryPeriod,businessDate());
  const entryFrom=entryBounds?.from??'',entryTo=entryBounds?.to??'';
  const [timeSaving,setTimeSaving]=useState(false);
  const timeBusy=useRef(false);
  const [manualBillable,setManualBillable]=useState(true);
  const [manualRate,setManualRate]=useState("0");
  const actor=useApiQuery<{user?:{id?:string};tenant?:{plan?:string;role?:string;moduleProfile?:import("@/lib/permissions").ModuleProfile}}>('/api/auth/session');
  const actorId=actor.data?.user?.id??'',role=actor.data?.tenant?.role??'';
  const canRecordExternal=['owner','admin','project_manager','manager'].includes(role)&&actor.data?.tenant?.moduleProfile!=='time_only'&&['business','pro'].includes(actor.data?.tenant?.plan??'');
  const [manualExternal,setManualExternal]=useState(false),[manualAssignment,setManualAssignment]=useState('');
  const [manualCategory,setManualCategory]=useState('work'),[manualWorkTime,setManualWorkTime]=useState(true),[manualPayroll,setManualPayroll]=useState(false);
  const timeOnly=actor.data?.tenant?.moduleProfile==='time_only';
  const customerEndpoint=timeOnly?'/api/time-entries/options?kind=customers':'/api/customers',projectEndpoint=timeOnly?'/api/time-entries/options?kind=projects':'/api/projects';
  const canApprove=['owner','admin','project_manager','manager'].includes(role),canInvoice=tenantCan(role,'invoices:write',actor.data?.tenant?.moduleProfile),canRecord=tenantCan(role,'time:write',actor.data?.tenant?.moduleProfile);
  const [requestedTimeTab,setTimeTab]=useState<'timer'|'entries'>(employeeFilter||searchParams.has('invoice')||searchParams.get('tab')==='entries'?'entries':'timer');
  const timeTab=actor.data&&!canRecord?'entries':requestedTimeTab;
  const [running,setRunning]=useState(false);
  const [seconds,setSeconds]=useState(0);
  const [manualOpen,setManualOpen]=useState(searchParams.get("manual")==="1"||!!searchParams.get("customerId")&&!searchParams.has("invoice"));
  const [projectOpen,setProjectOpen]=useState(false);
  const [timerProject,setTimerProject]=useState("Interne Planung");
  const [timerProjectId,setTimerProjectId]=useState<string|null>(null);
  const [timerCustomer,setTimerCustomer]=useState("");
  const timerContext=useRef<Pick<TimerState,"project"|"projectId"|"customerId">|null>(null);
  const [manualDate,setManualDate]=useState(()=>businessDate());
  const [manualDuration,setManualDuration]=useState("01:00");
  const [manualCustomer,setManualCustomer]=useState(searchParams.get("customerId")??"");
  const [manualProject,setManualProject]=useState(searchParams.get("projectId")??"");
  const [manualDescription,setManualDescription]=useState("");
  const [manualInternalCategory,setManualInternalCategory]=useState("Administration");
  const [availableProjects,setAvailableProjects]=useState<Array<{id:string;name:string;customer_id?:string|null;status?:string;hours?:number;invoiced_hours?:number;invoice_numbers?:string[]}>>([]);
  const [availableCustomers,setAvailableCustomers]=useState<Array<{id:string;name:string}>>([]);
  const [toast,setToast]=useState<string|null>(null);
  useEffect(()=>{if(!actor.data)return;let active=true;queueMicrotask(()=>{if(active){setAvailableProjects([]);setAvailableCustomers([])}});Promise.all([apiGet<{items:typeof availableProjects}>(projectEndpoint+(timeOnly?"&":"?")+"limit=50"),apiGet<{items:typeof availableCustomers}>(customerEndpoint+(timeOnly?"&":"?")+"limit=50")]).then(async([projects,customers])=>{if(!active)return;const selectedId=searchParams.get("projectId");let projectItems=projects.items;if(selectedId&&!projectItems.some(item=>item.id===selectedId)){const exact=await apiGet<{items:typeof availableProjects}>(projectEndpoint+(timeOnly?"&":"?")+"id=eq."+encodeURIComponent(selectedId));if(!active)return;projectItems=[...projectItems,...exact.items];}setAvailableProjects(projectItems.filter(item=>projectAllowsTime(item.status??'active')));setAvailableCustomers(customers.items);const selected=projectItems.find(item=>item.id===searchParams.get("projectId"));if(selected){timerContext.current={project:selected.name,projectId:selected.id,customerId:selected.customer_id??null};setManualCustomer(selected.customer_id??"");const state=withIdleTimerContext(await readTimer(),timerContext.current);if(!active)return;setTimerProject(state.project);setTimerProjectId(state.projectId??null);setTimerCustomer(state.customerId??"");setRunning(state.running);timerBase.current={seconds:state.seconds,at:Date.now()};setSeconds(state.seconds)}}).catch(()=>{if(active)setToast("Kunden und Aufträge konnten nicht geladen werden.")});return()=>{active=false};},[searchParams,directoryRevision,production,actor.data,projectEndpoint,customerEndpoint,timeOnly]);
  const today=businessDate();
  const [debouncedEntryQuery,setDebouncedEntryQuery]=useState('');
  useEffect(()=>{const timer=window.setTimeout(()=>setDebouncedEntryQuery(entryQuery),180);return()=>window.clearTimeout(timer)},[entryQuery]);
  const entryFilters={projectId:timeTab==='timer'?timerProjectId:projectFilter,customerId:timeTab==='timer'?timerCustomer||null:customerFilter,query:timeTab==='entries'?debouncedEntryQuery:'',from:timeTab==='timer'?today:entryFrom,to:timeTab==='timer'?today:entryTo,status:timeTab==='entries'&&!reviewMode?entryFilter:'Alle'};
  const scopeOptions={employeeId:employeeFilter,review:reviewMode,own:timeTab==='timer',internal:timeTab==='timer'&&!timerCustomer&&!timerProjectId,projectLabel:timeTab==='timer'&&!timerProjectId&&!['Arbeitszeit','Interne Planung'].includes(timerProject)?timerProject:undefined};
  const filterScope=timeEntryQuery(entryFilters,scopeOptions).toString();
  const [pagination,setPagination]=useState({scope:'',page:0});
  const timePage=pagination.scope===filterScope?pagination.page:0;
  const entriesPath='/api/time-entries?'+timeEntryQuery(entryFilters,{...scopeOptions,page:timePage});
  const entriesResource=useApiQuery<{items:TimeEntry[];total?:number;total_minutes?:number}>(timeTab==='timer'||entryPeriodReady?entriesPath:null);
  const [entryOverride,setEntryOverride]=useState<{key:string;items:TimeEntry[]}|null>(null);
  const entryKey=entriesPath+':'+dataRevision([entriesPath]);
  const remoteEntries=entryOverride?.key===entryKey?entryOverride.items:entriesResource.data?.items??[];
  const entriesLoading=entriesResource.loading||(timeTab==="entries"&&(!entryPeriodReady||entryQuery!==debouncedEntryQuery)),entriesError=entriesResource.error;
  const setRemoteEntries=(next:TimeEntry[]|((items:TimeEntry[])=>TimeEntry[]))=>setEntryOverride(current=>{const key=entriesPath+':'+dataRevision([entriesPath]),items=current?.key===key?current.items:entriesResource.data?.items??[];return {key,items:typeof next==='function'?next(items):next};});
  useEffect(()=>{let active=true;queueMicrotask(()=>{if(active)setEntryOverride(null)});return()=>{active=false};},[entriesResource.data]);
  const [selectedTimeIds,setSelectedTimeIds]=useState<string[]>([]);
  const [reviewSelection,setReviewSelection]=useState<string[]>([]),[reviewBusy,setReviewBusy]=useState(false);
  const reviewLock=useRef(false);
  const [billingOpen,setBillingOpen]=useState(false),[billingTarget,setBillingTarget]=useState(searchParams.get("invoice")??"");
  const [billingDrafts,setBillingDrafts]=useState<Array<{number:string;customer_id:string;status:string}>>([]),[billingError,setBillingError]=useState<string|null>(null);
  const openBilling=async()=>{setBillingOpen(true);setBillingError(null);try{const data=await apiGet<{items:typeof billingDrafts}>('/api/documents?kind=invoice');setBillingDrafts(data.items.filter(i=>i.status==='draft'));}catch(e){setBillingError(e instanceof Error?e.message:'Rechnungsentwürfe konnten nicht geladen werden.')}};

  useEffect(()=>{
    let active=true,sequence=0;
    const sync=()=>{const request=++sequence;readTimer().then(saved=>{if(!active||request!==sequence)return;const state=withIdleTimerContext(saved,timerContext.current);setRunning(state.running);timerBase.current={seconds:state.seconds,at:Date.now()};setSeconds(state.seconds);setTimerProject(state.project);setTimerProjectId(state.projectId??null);setTimerCustomer(state.customerId??"")}).catch(()=>undefined)};
    sync();
    const syncTimer=window.setInterval(sync,30000);
    window.addEventListener("focus",sync);

    window.addEventListener("binso-timer-change",sync);
    return()=>{active=false;window.clearInterval(syncTimer);window.removeEventListener("focus",sync);window.removeEventListener("binso-timer-change",sync);};
  },[timerRevision]);



  useEffect(()=>{if(!running)return;const id=window.setInterval(()=>setSeconds(timerBase.current.seconds+Math.floor((Date.now()-timerBase.current.at)/1000)),1000);return()=>window.clearInterval(id);},[running]);

  const setProject=async(project:string,choice?:{id:string;name:string;customer_id?:string|null})=>{
    try{const selected=choice??availableProjects.find(item=>item.id===project);const customerId=selected?.customer_id??null;const state=await changeTimer("project",selected?.name??project,selected?.id??null,customerId);timerContext.current={project:state.project,projectId:state.projectId??null,customerId:state.customerId??null};setTimerProjectId(selected?.id??null);setTimerCustomer(customerId??"");setTimerProject(state.project);setProjectOpen(false)}
    catch(error){setToast(error instanceof Error?error.message:"Auftrag konnte nicht gespeichert werden.")}
  };
  const toggleTimer=async()=>{
    if(timeBusy.current)return;timeBusy.current=true;setTimeSaving(true);
    try{const state=await changeTimer(running?"pause":"start",timerProject,timerProjectId,timerCustomer||null);setRunning(state.running);timerBase.current={seconds:state.seconds,at:Date.now()};setSeconds(state.seconds)}
    catch(error){setToast(error instanceof Error?error.message:"Zeitmessung konnte nicht gespeichert werden.")}
    finally{timeBusy.current=false;setTimeSaving(false)}
  };

  const formatted=[Math.floor(seconds/3600),Math.floor((seconds%3600)/60),seconds%60].map(value=>String(value).padStart(2,"0")).join(":");

  const stop=async()=>{
    if(timeBusy.current)return;timeBusy.current=true;setTimeSaving(true);
    try{
      await changeTimer("finish",timerProject);
      setRunning(false);setSeconds(0);setToast("Zeiteintrag gespeichert.");
      {const payload=await apiGet<{items:typeof remoteEntries}>("/api/time-entries"+(employeeFilter?"?employeeId="+encodeURIComponent(employeeFilter):""));setRemoteEntries(payload.items)}
    }catch(error){setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.")}
    finally{timeBusy.current=false;setTimeSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const [manualReplay,setManualReplay]=useState<{body:string;key:string}|null>(null);
  const manualRecovery=useProcessDraft({process:"time:manual:"+(searchParams.get("customerId")??"internal"),value:{manualDate,manualDuration,manualCustomer,manualProject,manualDescription,manualInternalCategory,manualBillable,manualRate,manualExternal,manualAssignment,manualCategory,manualWorkTime,manualPayroll,manualReplay},dirty:manualExternal||manualCategory!=='work'||!manualWorkTime||manualPayroll||manualDate!==businessDate()||manualDuration!=="01:00"||manualDescription!==""||manualRate!=="0"||!manualBillable||manualInternalCategory!=="Administration"||manualCustomer!==(searchParams.get("customerId")??"")||manualProject!==(searchParams.get("projectId")??""),enabled:manualOpen,onRestore:value=>{
    if(!value||[value.manualDate,value.manualDuration,value.manualCustomer,value.manualProject,value.manualDescription,value.manualInternalCategory,value.manualRate].some(field=>typeof field!=="string"||field.length>2000)||typeof value.manualBillable!=="boolean")return;
    if(typeof value.manualExternal==='boolean')setManualExternal(value.manualExternal);if(typeof value.manualAssignment==='string')setManualAssignment(value.manualAssignment);if(['work','travel','break','other'].includes(value.manualCategory))setManualCategory(value.manualCategory);if(typeof value.manualWorkTime==='boolean')setManualWorkTime(value.manualWorkTime);if(typeof value.manualPayroll==='boolean')setManualPayroll(value.manualPayroll);
    setManualDate(value.manualDate);setManualDuration(value.manualDuration);setManualCustomer(value.manualCustomer);setManualProject(value.manualProject);setManualDescription(value.manualDescription);setManualInternalCategory(value.manualInternalCategory);setManualBillable(value.manualBillable);setManualRate(value.manualRate);
    if(value.manualReplay&&typeof value.manualReplay.body==="string"&&value.manualReplay.body.length<16000&&typeof value.manualReplay.key==="string"&&value.manualReplay.key.length>=8&&value.manualReplay.key.length<=128)setManualReplay(value.manualReplay);
  }});
  const closeManual=()=>{manualRecovery.clear();setManualOpen(false);if(returnTo)router.push(returnTo)};
  const saveManual=async()=>{
    if(timeBusy.current||!manualRecovery.ready)return;
    const [hours,minutes]=manualDuration.split(":").map(Number);
    const durationMinutes=(Number.isFinite(hours)?hours:0)*60+(Number.isFinite(minutes)?minutes:0);
    if(!/^\d{1,2}:[0-5]\d$/.test(manualDuration)||durationMinutes<=0||durationMinutes>1440||!/^\d{4}-\d{2}-\d{2}$/.test(manualDate)){
      setToast("Bitte eine gültige Dauer erfassen.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    timeBusy.current=true;setTimeSaving(true);
    try{
      {}
      {
        const body=manualExternal?{externalAssignmentId:manualAssignment,workDate:manualDate,durationMinutes,description:manualDescription,billable:!!manualCustomer&&manualBillable,timeCategory:manualCategory,isWorkTime:manualWorkTime,payrollRelevant:false}:{timeCategory:manualCategory,isWorkTime:manualWorkTime,payrollRelevant:manualPayroll,customerId:manualCustomer||null,projectId:manualProject||null,projectName:availableProjects.find(item=>item.id===manualProject)?.name||(manualCustomer?"Arbeitszeit":manualInternalCategory),description:manualDescription,startedAt:manualDate+"T12:00:00",durationMinutes,billable:!!manualCustomer&&manualBillable,salesRate:Number(manualRate)};
        const serialized=JSON.stringify(body),attempt=manualReplay?.body===serialized?manualReplay:{body:serialized,key:crypto.randomUUID()};setManualReplay(attempt);
        manualRecovery.persist({manualDate,manualDuration,manualCustomer,manualProject,manualDescription,manualInternalCategory,manualBillable,manualRate,manualExternal,manualAssignment,manualCategory,manualWorkTime,manualPayroll,manualReplay:attempt});
        const payload=await apiPost<{item:typeof remoteEntries[number]}>("/api/time-entries",body,{idempotencyKey:attempt.key});
        setRemoteEntries(current=>[payload.item,...current]);
      }
      manualRecovery.clear();setManualReplay(null);setManualOpen(false);
      setToast("Zeiteintrag gespeichert.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Zeiteintrag konnte nicht gespeichert werden.");
    }
    finally{timeBusy.current=false;setTimeSaving(false)}
    window.setTimeout(()=>setToast(null),2400);
  };

  const submitTime=async(id:string)=>{try{const data=await apiPatch<{item:{submitted_at:string;approved:boolean}}>("/api/time-entries/"+encodeURIComponent(id),{action:"submit"});setRemoteEntries(current=>current.map(item=>item.id===id?{...item,submitted_at:data.item.submitted_at,approved:data.item.approved}:item));}catch(e){setToast(e instanceof Error?e.message:"Zeit konnte nicht eingereicht werden.")}};
  const approveTime=async(id:string)=>{try{await apiPatch("/api/time-entries/"+encodeURIComponent(id),{action:"approve"});setRemoteEntries(current=>current.map(item=>item.id===id?{...item,approved:true}:item));setToast("Zeit freigegeben.");}catch(error){setToast(error instanceof Error?error.message:"Zeit konnte nicht freigegeben werden.");}window.setTimeout(()=>setToast(null),2200)};
  const visibleEntries=filterTimeEntries(remoteEntries,{projectId:timeTab==="timer"?timerProjectId:projectFilter,customerId:timeTab==="timer"?timerCustomer||null:searchParams.has("invoice")?searchParams.get("customerId"):null,query:timeTab==="entries"?entryQuery:"",from:timeTab==="timer"?today:entryFrom,to:timeTab==="timer"?today:entryTo,status:timeTab==="entries"&&!reviewMode?entryFilter:"Alle"}).filter(item=>timeTab!=="timer"||((timerCustomer||(!item.customer_id&&!item.billable))&&(timerProjectId||["Arbeitszeit","Interne Planung"].includes(timerProject)||item.project_name===timerProject)));
  const selectableReview=(item:TimeEntry)=>!item.approved&&!item.invoiced_invoice_id&&(reviewMode?canApprove&&item.created_by_user_id!==actorId&&!!item.submitted_at:canRecord&&item.created_by_user_id===actorId&&!item.submitted_at);
  const selectedReview=visibleEntries.filter(item=>reviewSelection.includes(item.id)&&selectableReview(item));
  const reviewTimes=async()=>{if(reviewLock.current||!selectedReview.length)return;reviewLock.current=true;setReviewBusy(true);try{const result=await apiPost<{items:{id:string;approved:boolean;submitted_at:string|null}[]}>('/api/time-entries/review',{ids:selectedReview.map(item=>item.id),action:reviewMode?'approve':'submit'});const updated=new Map(result.items.map(item=>[item.id,item]));setRemoteEntries(current=>current.map(item=>updated.has(item.id)?{...item,...updated.get(item.id)}:item));setReviewSelection([]);setToast(reviewMode?'Zeiten freigegeben.':'Zeiten eingereicht.')}catch(error){setToast(error instanceof Error?error.message:'Zeiten konnten nicht verarbeitet werden.')}finally{reviewLock.current=false;setReviewBusy(false)}};
  const billableSelection=visibleEntries.filter(item=>selectedTimeIds.includes(item.id)&&(!item.external_resource_id||actor.data?.tenant?.plan==='pro')&&item.customer_id&&item.billable&&item.approved&&!item.invoiced_invoice_id);
  const mixedCustomers=new Set(billableSelection.map(item=>item.customer_id)).size>1;
  const pageMinutes=visibleEntries.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0);
  const remoteTotal=entriesResource.data?.total_minutes==null?pageMinutes:Number(entriesResource.data.total_minutes)+pageMinutes-(entriesResource.data.items??[]).reduce((sum,item)=>sum+Number(item.duration_minutes??0),0);
  const invoiceHref=billableSelection.length?"/rechnungen/neu?timeEntries="+encodeURIComponent(billableSelection.map(item=>item.id).join(",")):"";
  const groupedEntries=Object.entries(visibleEntries.reduce<Record<string,typeof remoteEntries>>((groups,item)=>{const key=JSON.stringify([item.customer_id??(item.billable?"unassigned":"internal"),item.project_id??item.project_name??"no-project"]);(groups[key]??=[]).push(item);return groups},{}));
  const productionEntries=entriesLoading?<LoadingState><LocalizedText>{"Zeiteinträge werden geladen …"}</LocalizedText></LoadingState>:entriesError?<ErrorState><LocalizedText>{entriesError}</LocalizedText></ErrorState>:visibleEntries.length?<div className="time-groups">{groupedEntries.map(([group,items])=><TimeEntryGroup expanded={timeTab==="timer"} key={group} titleVerbatim={!!items[0].customer_name} subtitleVerbatim={!!items[0].project_name} title={items[0].customer_name||(items[0].billable?"Ohne Kundenzuordnung":"Intern")} subtitle={items[0].project_name||"Ohne Auftrag"} value={formatTimeDuration(items.reduce((sum,item)=>sum+Number(item.duration_minutes??0),0),t)}>{items.map(item=>{const priceAllowed=!!item.external_resource_id&&!!item.approved&&canInvoice&&actor.data?.tenant?.plan==='pro';const priceActions=priceAllowed?<TimePriceSource entryId={item.id} billable={item.billable===true} trigger={<PriceSourceHeaderTrigger/>}/>:undefined;const row=(onOpen?:()=>void)=><TimeEntryRow information={timeTab==="timer"} onOpen={onOpen} key={item.id} title={item.description||item.project_name||"Zeiteintrag"} meta={[...new Set((timeMetadata(item.description||item.project_name,item.project_name,item.employee_name,swissDate(item.started_at))+" · "+classificationMeta(item)).split(" · ").filter(part=>part&&part!==(item.description||item.project_name)))].join(" · ")} value={formatTimeDuration(Number(item.duration_minutes??0),t)} status={timeEntryStatus(item)} selectionLabel={selectableReview(item)?reviewMode?"Zur Freigabe auswählen":"Zum Einreichen auswählen":undefined} selection={selectableReview(item)?<Input type="checkbox" aria-label={reviewMode?"Zur Freigabe auswählen":"Zum Einreichen auswählen"} checked={reviewSelection.includes(item.id)} disabled={reviewBusy} onChange={event=>setReviewSelection(current=>event.target.checked?[...new Set([...current,item.id])]:current.filter(id=>id!==item.id))}/>:canInvoice&&(!item.external_resource_id||actor.data?.tenant?.plan==='pro')&&item.customer_id&&item.billable&&item.approved&&!item.invoiced_invoice_id?<Input type="checkbox" aria-label="Zeit für Rechnung auswählen" checked={selectedTimeIds.includes(item.id)} onChange={e=>setSelectedTimeIds(current=>e.target.checked?[...current,item.id]:current.filter(id=>id!==item.id))}/>:undefined} action={<>{!item.report_month&&!item.invoiced_invoice_id&&!item.approved?(canApprove&&item.created_by_user_id!==actorId&&!!item.submitted_at?<button type="button" className="text-action" onClick={()=>void approveTime(item.id)}><LocalizedText>{"Freigeben"}</LocalizedText></button>:canRecord&&item.created_by_user_id===actorId&&!item.submitted_at?<button type="button" className="text-action" onClick={()=>void submitTime(item.id)}><LocalizedText>{"Zur Prüfung einreichen"}</LocalizedText></button>:undefined):undefined}</>}/>;return item.report_month?<MonthlyTimeReport key={item.id} timeOnly={timeOnly} entry={item} readOnly={item.created_by_user_id!==actorId} canReview={canApprove&&item.created_by_user_id!==actorId&&!!item.submitted_at&&!item.approved} headerActions={priceActions} trigger={row}/>:priceAllowed?<TimePriceSource key={item.id} entryId={item.id} billable={item.billable===true} trigger={row()}/>:row();})}</TimeEntryGroup>)}</div>:<EmptyState   title={remoteEntries.length?"Keine Zeiteinträge für diese Auswahl":"Keine Zeiteinträge erfasst"}/>;

  const entriesView=<>{selectedReview.length>0&&<FormActions><Button requiresWrite disabled={reviewBusy} onClick={()=>void reviewTimes()}><LocalizedText>{reviewMode?'Ausgewählte Zeiten freigeben':'Ausgewählte Zeiten einreichen'}</LocalizedText>{' ('+selectedReview.length+')'}</Button><Button variant="secondary" disabled={reviewBusy} onClick={()=>setReviewSelection([])}><LocalizedText>Auswahl aufheben</LocalizedText></Button></FormActions>}{productionEntries}{<RecordsPagination total={entriesResource.data?.total??remoteEntries.length} page={timePage} pageSize={50} loading={entriesLoading} onPage={page=>{setSelectedTimeIds([]);setReviewSelection([]);setPagination({scope:filterScope,page})}}/>}</>;
  const canReadReports=tenantCan(role,'reports:read',actor.data?.tenant?.moduleProfile);
  const reportFrom=entryFilters.from||today.slice(0,7)+'-01',reportTo=entryFilters.to||today;
  const timeReportQuery=new URLSearchParams(timeEntryQuery(entryFilters,scopeOptions));
  timeReportQuery.set('kind','time');timeReportQuery.set('months','custom');timeReportQuery.set('from',reportFrom);timeReportQuery.set('to',reportTo);
  const reportMenu=(onMonthly?:()=>void)=><ReportActions tools label="Listenwerkzeuge" query={timeReportQuery.toString()} caption={swissDate(reportFrom)+' – '+swissDate(reportTo)} disabled={reportFrom>reportTo} extraActions={<><ActionRow title="Filter und Sortierung" icon="filter" onClick={()=>{setPendingStatus(entryFilter);setTimeFilterOpen(true)}}/>{onMonthly&&<ActionRow title="Monatsrapport" icon="file" onClick={onMonthly}/>}</>}/>;
  const headerActions=canRecord?<MonthlyTimeReport timeOnly={timeOnly} trigger={open=>canReadReports?reportMenu(open):<ActionsMenu tools label="Listenwerkzeuge"><ActionRow title="Filter und Sortierung" icon="filter" onClick={()=>{setPendingStatus(entryFilter);setTimeFilterOpen(true)}}/><ActionRow title="Monatsrapport" icon="file" onClick={open}/></ActionsMenu>}/>:canReadReports?reportMenu():undefined;
  return <AppShell title="Zeiterfassung" active="zeit" actions={canRecord?<CreateAction label="Zeit erfassen" onClick={()=>setManualOpen(true)}/>:undefined} backHref={returnTo} backLabel="Übersicht">

    <DetailTabs role="tablist" label="Zeiterfassung">{canRecord&&<button role="tab" aria-selected={timeTab==="timer"} className={timeTab==="timer"?"active":""} onClick={()=>setTimeTab("timer")}><LocalizedText>{"Timer"}</LocalizedText></button>}<button role="tab" aria-selected={timeTab==="entries"} className={timeTab==="entries"?"active":""} onClick={()=>setTimeTab("entries")}><LocalizedText>{"Einträge"}</LocalizedText></button></DetailTabs>

    {employeeFilter&&<p role="status"><LocalizedText>{"Arbeitszeiten des ausgewählten Mitarbeiters · "}</LocalizedText><Link href="/zeit"><LocalizedText>{"Alle anzeigen"}</LocalizedText></Link></p>}
    {timeTab==="entries"&&<div className="toolbar time-filter-toolbar"><ListSearch ariaLabel="Zeiteinträge suchen" placeholder="Kunde, Mitarbeiter oder Tätigkeit suchen" value={entryQuery} onChange={setEntryQuery}/>{headerActions??<IconButton label="Zeitfilter" icon="filter" onClick={()=>{setPendingStatus(entryFilter);setTimeFilterOpen(true)}}/>}</div>}{timeTab==="entries"&&<><StatisticPeriodPicker period={entryPeriod} onChange={setEntryPeriod}/></>}
    <FilterSheet label="Zeitfilter" open={timeFilterOpen} onClose={()=>setTimeFilterOpen(false)}><div className="sheet-body form-grid two">{!reviewMode&&<Field allowReadOnlyInput label="Status"><Select value={pendingStatus} onChange={e=>setPendingStatus(e.target.value)}>{["Alle","Erfasst","Eingereicht","Freigegeben","Zurückgewiesen","Verrechnet","Intern"].map(status=><option key={status} value={status}>{status}</option>)}</Select></Field>}</div><FormActions sheet><Button variant="secondary" onClick={()=>{setEntryQuery("");setEntryPeriod(null);setEntryFilter("Alle");setSelectedTimeIds([]);setTimeFilterOpen(false)}}><LocalizedText>{"Zurücksetzen"}</LocalizedText></Button><Button onClick={()=>{setEntryFilter(pendingStatus);setTimeFilterOpen(false)}}><LocalizedText>{"Anwenden"}</LocalizedText></Button></FormActions></FilterSheet>
    {timeTab==="entries"&&!reviewMode&&entryFilter!=="Alle"&&<button className="filter-chip" type="button" onClick={()=>setEntryFilter("Alle")}>{entryFilter}<Icon name="close" size={14}/></button>}
    {timeTab==="entries"&&(projectFilter||customerFilter)&&<div className="records-active-filters" aria-live="polite">{projectFilter&&<div className="records-active-line"><span><LocalizedText>Auftrag</LocalizedText>{': '}{availableProjects.find(item=>item.id===projectFilter)?.name??<LocalizedText>Ausgewählter Auftrag</LocalizedText>}</span><button type="button" className="records-reset" aria-label={t('Auftragsfilter zurücksetzen')} onClick={()=>resetContext('projectId')}><LocalizedText>Zurücksetzen</LocalizedText></button></div>}{customerFilter&&<div className="records-active-line"><span><LocalizedText>Kunde</LocalizedText>{': '}{availableCustomers.find(item=>item.id===customerFilter)?.name??<LocalizedText>Ausgewählter Kunde</LocalizedText>}</span><button type="button" className="records-reset" aria-label={t('Kundenfilter zurücksetzen')} disabled={searchParams.has('invoice')} title={searchParams.has('invoice')?t('Für Rechnung festgelegt'):undefined} onClick={()=>resetContext('customerId')}><LocalizedText>Zurücksetzen</LocalizedText></button></div>}</div>}
    {mixedCustomers&&<ErrorState><LocalizedText>{"Bitte nur Zeiten eines Kunden für eine Rechnung auswählen."}</LocalizedText></ErrorState>}

    <div className="time-layout">
      <section className="time-section timer-card">
        {timeTab==="timer"?<>


          <TimerControls formatted={formatted} running={running} seconds={seconds} busy={timeSaving} onToggle={toggleTimer} onStop={()=>void stop()}/>
          {timerProjectId&&<Link className="text-action" href={"/projekte/"+encodeURIComponent(timerProjectId)}><LocalizedText>{"Auftragsdetails"}</LocalizedText></Link>}
          <div className="timer-project"><Field label="Kunde"><DirectorySelect label="Kunde" endpoint={customerEndpoint} emptyLabel="Intern" value={timerCustomer} disabled={running||seconds>0||!!availableProjects.find(item=>item.id===timerProjectId)?.customer_id} onChange={value=>{timerContext.current={project:value?"Arbeitszeit":"Interne Planung",projectId:null,customerId:value||null};setTimerCustomer(value);setTimerProjectId(null);setTimerProject(value?"Arbeitszeit":"Interne Planung")}}/></Field><Field label="Auftrag"><button type="button" disabled={running||seconds>0} onClick={()=>setProjectOpen(true)}>{timerProject} <Icon name="down" size={16}/></button></Field></div>
        </>:<>
          <SectionTitle title={"Gesamtzeit"} action={entriesLoading?<LoadingState/>:<strong><LocalizedText>{formatTimeDuration(remoteTotal,t)}</LocalizedText></strong>}/>
          <LocalizedText>{entriesView}</LocalizedText>
          <div className="time-entry-actions">{canInvoice&&billableSelection.length>0&&!mixedCustomers&&<Button onClick={()=>void openBilling()} icon="receipt"><LocalizedText>{"Verrechnen ("}</LocalizedText>{billableSelection.length})</Button>}</div>
        </>}
      </section>
      {timeTab==="timer"&&<section className="time-section time-overview-section">
        <SectionTitle title="Heute" action={entriesLoading?<LoadingState/>:<strong><LocalizedText>{formatTimeDuration(remoteTotal,t)}</LocalizedText></strong>}/>
        {entriesView}

      </section>}
    </div>
    <ActionSheet label="Auftrag wählen" description="Die Zeit wird direkt dem gewählten Auftrag zugeordnet." className="project-sheet" open={projectOpen&&canRecord} onClose={()=>setProjectOpen(false)}><div className="choice-list">{[{id:"Administration",name:"Administration",customer_id:null},{id:"Weiterbildung",name:"Weiterbildung",customer_id:null},{id:"Interne IT",name:"Interne IT",customer_id:null}].map(project=><button type="button" key={project.id} className={timerProjectId===project.id||!timerProjectId&&timerProject===project.name?"active":""} onClick={()=>setProject(project.id)}><div><b>{project.name}</b><small><LocalizedText verbatim={!!project.customer_id}>{availableCustomers.find(customer=>customer.id===project.customer_id)?.name??"Intern"}</LocalizedText></small></div>{(timerProjectId===project.id||!timerProjectId&&timerProject===project.name)?<Icon name="check"/>:<Icon name="arrow"/>}</button>)}</div><Field label="Auftrag"><DirectorySelect label="Auftrag" emptyLabel="Auftrag auswählen" endpoint={projectEndpoint} value={timerProjectId??''} selectable={item=>projectAllowsTime(String(item.status??'active'))} onChange={(value,item)=>{if(item){const selected={id:value,name:String(item.name??''),customer_id:item.customer_id?String(item.customer_id):null,status:String(item.status??'active')};setAvailableProjects(current=>[...current.filter(row=>row.id!==value),selected]);void setProject(value,selected);}}}/></Field></ActionSheet>
    <FormSheet label="Zeit erfassen" ariaLabel="Zeit manuell erfassen" description="Eintrag direkt dem Kunden oder Auftrag zuordnen." className="manual-time-sheet" open={manualOpen&&canRecord} busy={timeSaving} onClose={closeManual}><div className="sheet-body"><div className="form-grid two">{canRecordExternal&&<Field label="Leistungserbringer"><Select value={manualExternal?"external":"internal"} onChange={e=>{setManualExternal(e.target.value==="external");setManualAssignment("");setManualPayroll(false)}}><option value="internal"><LocalizedText>{"Eigene Zeit"}</LocalizedText></option><option value="external"><LocalizedText>{"Externe Ressource"}</LocalizedText></option></Select></Field>}<Field label="Datum"><Input type="date" value={manualDate} onChange={e=>{setManualDate(e.target.value);setManualAssignment("")}}/></Field><Field label="Dauer"><Input type="text" inputMode="text" maxLength={5} placeholder="HH:MM" aria-label="Dauer in Stunden und Minuten" value={manualDuration} onChange={e=>setManualDuration(e.target.value)}/></Field>{<Field label="Kunde"><DirectorySelect label="Kunde" endpoint={customerEndpoint} emptyLabel="Intern" value={manualCustomer} disabled={!!availableProjects.find(item=>item.id===manualProject)?.customer_id} onChange={value=>{setManualCustomer(value);setManualProject("");setManualAssignment("")}}/></Field>}{<Field label="Auftrag"><DirectorySelect label="Auftrag" emptyLabel="Ohne Auftrag" endpoint={projectEndpoint} customerId={manualCustomer||null} value={manualProject} selectable={item=>projectAllowsTime(String(item.status??'active'))} onChange={(value,item)=>{setManualProject(value);setManualAssignment("");if(item){setManualCustomer(String(item.customer_id??''));setAvailableProjects(current=>[...current.filter(row=>row.id!==value),{id:value,name:String(item.name??''),customer_id:item.customer_id?String(item.customer_id):null,status:String(item.status??'active')}]);}}}/></Field>}<>{manualExternal&&<Field label="Externe Ressource"><DirectorySelect label="Externe Ressource" emptyLabel="Ressource auswählen" endpoint={manualProject?"/api/time-entries/options?kind=external&projectId="+encodeURIComponent(manualProject)+"&workDate="+encodeURIComponent(manualDate):null} disabled={!manualProject} required value={manualAssignment} onChange={value=>setManualAssignment(value)}/></Field>}{!manualExternal&&!manualCustomer&&!manualProject&&<Field label="Interne Tätigkeit"><Select value={manualInternalCategory} onChange={e=>setManualInternalCategory(e.target.value)}><option value={"Administration"}><LocalizedText>{"Administration"}</LocalizedText></option><option value={"Weiterbildung"}><LocalizedText>{"Weiterbildung"}</LocalizedText></option><option value={"Interne IT"}><LocalizedText>{"Interne IT"}</LocalizedText></option></Select></Field>}</><Field label="Zeitart"><Select value={manualCategory} onChange={e=>setManualCategory(e.target.value)}><option value="work"><LocalizedText>{"Arbeit"}</LocalizedText></option><option value="travel"><LocalizedText>{"Reise"}</LocalizedText></option><option value="break"><LocalizedText>{"Pause"}</LocalizedText></option><option value="other"><LocalizedText>{"Sonstiges"}</LocalizedText></option></Select></Field><Field label="Arbeitszeit"><Input type="checkbox" checked={manualWorkTime} onChange={e=>setManualWorkTime(e.target.checked)}/></Field>{!manualExternal&&<Field label="Lohnrelevanz beantragen"><Input type="checkbox" checked={manualPayroll} onChange={e=>setManualPayroll(e.target.checked)}/></Field>}<Field className="full" label="Beschreibung"><Input value={manualDescription} onChange={e=>setManualDescription(e.target.value)} placeholder="Was wurde gemacht?"/></Field>{manualCustomer&&<><Field label="Verrechenbar"><Input type="checkbox" checked={manualBillable} onChange={e=>setManualBillable(e.target.checked)}/></Field>{!manualExternal&&<Field label="Stundensatz CHF"><Input type="number" min="0" step="0.05" disabled={!manualBillable} value={manualRate} onChange={e=>setManualRate(e.target.value)}/></Field>}</>}</div></div><FormActions sheet><Button variant="secondary" onClick={closeManual}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={timeSaving||!manualRecovery.ready||manualExternal&&(!canRecordExternal||!manualAssignment)} onClick={()=>void saveManual()}><LocalizedText>{timeSaving?"Wird gespeichert…":"Speichern"}</LocalizedText></Button></FormActions></FormSheet>
    <FormSheet label="Zeiten verrechnen" description="Die Verknüpfung erfolgt erst beim Speichern der Rechnung." open={billingOpen} onClose={()=>setBillingOpen(false)}><Field allowReadOnlyInput label="Rechnung"><Select value={billingTarget} onChange={e=>setBillingTarget(e.target.value)}><option value=""><LocalizedText>{"Neue Rechnung"}</LocalizedText></option>{billingDrafts.filter(i=>i.customer_id===billableSelection[0]?.customer_id).map(i=><option key={i.number} value={i.number}>{i.number}<LocalizedText>{" · Entwurf"}</LocalizedText></option>)}</Select></Field>{billingError&&<ErrorState><LocalizedText>{billingError}</LocalizedText></ErrorState>}<FormActions sheet><Button variant="secondary" onClick={()=>setBillingOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={!billableSelection.length||mixedCustomers||!!billingError} href={billingTarget?'/rechnungen/'+encodeURIComponent(billingTarget)+'?timeEntries='+encodeURIComponent(billableSelection.map(i=>i.id).join(',')):invoiceHref}><LocalizedText>{"Positionen übernehmen"}</LocalizedText></Button></FormActions></FormSheet>
    {toast&&<Toast title={toast} tone={["Zeiteintrag gespeichert.","Zeit freigegeben."].includes(toast)?"success":"danger"}/>}
  </AppShell>;
}
