"use client";

import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {safeAppPath} from "@/lib/navigation";

import {allowDraftNavigation} from "../use-browser-back-guard";
import {FileUpload} from '../file-upload';
import {fileSelectionError} from '@/lib/file-selection';
import {limitsConfig} from '@/config/limits';
import {useProcessDraft} from "../use-process-draft";
import {useDirtySnapshot} from "../use-dirty-snapshot";
import Link from "next/link";
import {formatDateTime,messageDay} from "@/lib/display-format";
import {supportReference} from "@/lib/support-reference";
import {useApiQuery,useDataRevision} from "@/lib/client/use-api-query";
import { useRouter,useSearchParams } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { useWorkspaceViewport } from "../use-workspace-viewport";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView, RecordsControls, useRecordsController } from "../records";
import { apiGet, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, Icon, Toast, Input, Select, Textarea, FormActions, LoadingState, ErrorState, MessageBubble, Status} from "../ui";
import { ActionRow, ActionsMenu, CreateAction, FormSheet } from "../binso-ux";


export function SupportPage() {
 const production=useBackendMode(),placeholder="Tickets suchen...";
 const chips=["Alle","Neu","Offen","In Bearbeitung","Warten auf Kunde","Gelöst","Geschlossen"];
 const columns=[{label:"Ticket",index:4},{label:"Betreff",index:1},{label:"Aktualisiert",index:2},{label:"Status",index:3,status:true}];
 const controller=useRecordsController({placeholder,chips,columns}),pageSize=50;
 const fields:Record<number,string>={4:'case_number',1:'subject',2:'updated_at',3:'status'};
 const params=new URLSearchParams({limit:String(pageSize),offset:String(controller.page*pageSize),order:controller.sort==='default'?'updated_at.desc':fields[controller.sortIndex]+'.'+controller.sort});
 if(controller.query.trim())params.set('q',controller.query.trim());
 const statusMap:Record<string,string>={new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
 const selected=Object.entries(statusMap).find(([,label])=>label===controller.activeChip)?.[0];if(selected)params.set('status',selected);
 const query=useApiQuery<{items:Array<{id:string;case_number?:string;subject:string;status:string;updated_at:string}>;total?:number}>(production?"/api/support/tickets?"+params:"/api/demo/data?collection=support_tickets&"+params);
 const rows=(query.data?.items??[]).map(item=>[item.id,item.subject?.trim()||"Support-Anfrage",formatDateTime(item.updated_at),statusMap[item.status]??item.status,supportReference(item.id,item.case_number)]);
 const total=query.data?.total??rows.length;
 return <AppShell title="Support" subtitle={query.loading?undefined:`${total} Tickets`} active="support" actions={<RecordsControls controller={controller} placeholder={placeholder} chips={chips} columns={columns}><CreateAction href="/support/neu" label="Neues Ticket"/></RecordsControls>}>
  <RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={{total,page:controller.page,pageSize,onPage:controller.setPage}} countLabel="Tickets" loading={query.loading} error={query.error} items={rows} placeholder={placeholder} chips={chips} columns={columns} rowHref={row=>`/support/${row[0]}`}>{([id,subject,updated,status,reference])=><RecordRow href={`/support/${id}`} icon="support" title={subject} meta={`${reference} · ${updated}`} status={status}/>}</RecordsView>
 </AppShell>;
}

export function SupportTicketForm() {
  const router=useRouter(),params=useSearchParams();
  const returnTo=safeAppPath(params.get("returnTo"),"/support");
  const [subject,setSubject]=useState("");
  const [saved,setSaved]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const submitPending=useRef(false);
  const [category,setCategory]=useState("Allgemeine Frage");
  const [message,setMessage]=useState("");
  const [attachment,setAttachment]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{queueMicrotask(()=>setOpen(true))},[]);
  const [replay,setReplay]=useState<{body:string;key:string}|null>(null);
  const [createdId,setCreatedId]=useState<string|null>(null);
  const {dirty}=useDirtySnapshot([subject,category,message,attachment]);
  const recovery=useProcessDraft({process:'support:create',value:{subject,category,message,replay,createdId},dirty,enabled:!saved,onRestore:value=>{
   if(!value||typeof value.subject!=='string'||value.subject.length>160||typeof value.message!=='string'||value.message.length>5000||typeof value.category!=='string')return;
   setSubject(value.subject);setCategory(value.category);setMessage(value.message);
   if(value.replay&&typeof value.replay.body==='string'&&value.replay.body.length<10000&&typeof value.replay.key==='string'&&value.replay.key.length>=8&&value.replay.key.length<=128)setReplay(value.replay);
   if(typeof value.createdId==='string')setCreatedId(value.createdId);
  }});
  const close=()=>{recovery.clear();allowDraftNavigation();setOpen(false);router.push(returnTo)};
  const save=async()=>{
    if(submitPending.current||saved||!recovery.ready)return;
    if(subject.trim().length<3||!message.trim()){
      setToast("Betreff und Nachricht sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    submitPending.current=true;
    setSubmitting(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const body={subject:subject.trim(),category,priority:"normal",message:message.trim()},serialized=JSON.stringify(body);
        const attempt=replay?.body===serialized?replay:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);recovery.persist({subject,category,message,replay:attempt,createdId});
        const payload=createdId?{item:{id:createdId}}:await apiPost<{item:{id:string}}>("/api/support/tickets",body,{idempotencyKey:attempt.key});
        if(!payload.item?.id)throw new Error('Die Ticketanlage konnte nicht bestätigt werden.');
        setCreatedId(payload.item.id);recovery.persist({subject,category,message,replay:attempt,createdId:payload.item.id});
        if(attachment){
          const form=new FormData();
          form.append("file",attachment);
          form.append("purpose","support_attachment");
          form.append("entityId",payload.item.id);
          await apiUpload("/api/files",form);
        }
        setSaved(true);recovery.clear();allowDraftNavigation();
        router.push("/support/"+payload.item.id);
      }else{
        setToast("Ticket erstellt.");
        window.setTimeout(()=>router.push("/support/5832"),700);
      }
    }catch(error){
      setToast(error instanceof Error?error.message:"Ticket konnte nicht erstellt werden.");
      window.setTimeout(()=>setToast(null),2600);
    }finally{
      submitPending.current=false;
      setSubmitting(false);
    }
  };
  return <AppShell title="Neue Support-Anfrage" editing unsavedChanges={false} subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref={returnTo} backLabel="Support">
    <FormSheet workspace label="Neue Support-Anfrage" open={open} onClose={close} busy={submitting} dirty={dirty&&!saved}>
    <form onSubmit={event=>{event.preventDefault();void save()}}>
      <div className="form-grid">
        <Field label="Betreff" className="full"><Input required minLength={3} maxLength={160} disabled={submitting||!!createdId} autoFocus value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Worum geht es?"/></Field>
        <Field label="Kategorie" className="full"><Select disabled={submitting||!!createdId} value={category} onChange={e=>setCategory(e.target.value)}><option value={"Allgemeine Frage"}><LocalizedText>{"Allgemeine Frage"}</LocalizedText></option><option value={"Rechnung"}><LocalizedText>{"Rechnung"}</LocalizedText></option><option value={"Zeiterfassung"}><LocalizedText>{"Zeiterfassung"}</LocalizedText></option><option value={"Technisches Problem"}><LocalizedText>{"Technisches Problem"}</LocalizedText></option></Select></Field>
        <Field label="Nachricht" className="full"><Textarea required maxLength={5000} disabled={submitting||!!createdId} value={message} onChange={e=>setMessage(e.target.value)} placeholder="Beschreibe dein Anliegen kurz..."/></Field>
      </div>
      <FileUpload id="support-file-upload" label="Anhang" file={attachment} accept={["image/png","image/jpeg","image/webp","application/pdf","text/plain"]} busy={submitting} onSelect={setAttachment} onRemove={()=>setAttachment(null)}/>
      <p className="technical-hint"><LocalizedText>{"Browser, App-Version und Zeitpunkt werden automatisch mitgesendet."}</LocalizedText></p>
      {createdId&&<p aria-live="polite"><LocalizedText>{"Das Ticket ist gespeichert. Ein fehlgeschlagener Anhang kann erneut hochgeladen werden."}</LocalizedText></p>}
      <FormActions><Button variant="secondary" onClick={close} disabled={submitting}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button type="submit" disabled={submitting||saved||!recovery.ready}><LocalizedText>{submitting?"Wird erstellt…":createdId?"Anhang speichern":"Ticket erstellen"}</LocalizedText></Button></FormActions>
    </form></FormSheet>
    {toast&&<Toast title={toast} tone={toast==="Ticket erstellt."?"success":"danger"}/>}
  </AppShell>;
}

export function SupportChat({ticketId="5832"}:{ticketId?:string}) {
  useWorkspaceViewport();
  const messagesRef=useRef<HTMLDivElement>(null);
  const composerRef=useRef<HTMLTextAreaElement>(null);
  const attachmentRef=useRef<HTMLInputElement>(null);
  const production=useBackendMode();
  const [draft,setDraft]=useState("");
  useEffect(()=>{
    const input=composerRef.current;if(!input)return;
    const resize=()=>{input.style.height="auto";input.style.height=`${Math.min(input.scrollHeight,(window.visualViewport?.height??innerHeight)<=400?48:144)}px`};
    resize();window.addEventListener("resize",resize);window.visualViewport?.addEventListener("resize",resize);
    return()=>{window.removeEventListener("resize",resize);window.visualViewport?.removeEventListener("resize",resize)};
  },[draft]);
  const [ticketLoading,setTicketLoading]=useState(true);
  const [ticketError,setTicketError]=useState<string|null>(null);
  const [ticketRetry,setTicketRetry]=useState(0);
  const revision=useDataRevision(["/api/support/tickets"]);
  const [sending,setSending]=useState(false);
  const sendPending=useRef(false);
  const uploadPending=useRef(false);
  const [uploading,setUploading]=useState(false);
  const [sent,setSent]=useState<string[]>([]);
  const [remote,setRemote]=useState<Array<{id:string;author_type:string;body:string;created_at:string}>>([]);
  const [toast,setToast]=useState<string|null>(null);
  const [ticket,setTicket]=useState<{id:string;case_number?:string|null;subject?:string|null;status?:string|null;priority?:string|null;created_at?:string|null}|null>(null);
  useEffect(()=>{const list=messagesRef.current;if(list)list.scrollTop=list.scrollHeight},[remote,sent]);
  const ticketReference=supportReference(ticket?.id??ticketId,ticket?.case_number);
  const ticketSubject=ticket?.subject?.trim()||(!production?"Frage zu einer Rechnung":"Support-Anfrage");
  const ticketStatus=String(ticket?.status??"open");
  const ticketStatusLabel:Record<string,string>={new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting:"Wartet",waiting_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
  const ticketPriorityLabel:Record<string,string>={low:"Niedrig",normal:"Normal",medium:"Mittel",high:"Hoch",urgent:"Dringend"};

  const uploadSupportFile=async(file:File|undefined)=>{
    if(!file||uploadPending.current||ticketLoading||ticketError)return;
    const issue=fileSelectionError(file,["image/png","image/jpeg","image/webp","application/pdf","text/plain"],limitsConfig.maxFileUploadBytes);if(issue){setToast(issue);return;}
    if(!isProductionBackendEnabled()){
      setToast("Datei im Demo-Modus nicht dauerhaft gespeichert.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    uploadPending.current=true;
    setUploading(true);
    try{
      const form=new FormData();
      form.append("file",file);
      form.append("purpose","support_attachment");
      form.append("entityId",ticketId);
      await apiUpload("/api/files",form);
      setToast("Datei angehängt.");
    }catch(error){
      setToast(error instanceof Error?error.message:"Datei konnte nicht angehängt werden.");
    }finally{
      uploadPending.current=false;
      setUploading(false);
    }
    window.setTimeout(()=>setToast(null),2400);
  };

  useEffect(()=>{
    if(!isProductionBackendEnabled()){queueMicrotask(()=>setTicketLoading(false));return;}
    let active=true;
    queueMicrotask(()=>{if(active){setTicketError(null)}});
    Promise.all([
      apiGet<{items:Array<{id:string;case_number?:string|null;subject?:string|null;status?:string|null;priority?:string|null;created_at?:string|null}>}>("/api/support/tickets?id="+encodeURIComponent(ticketId)),
      apiGet<{items:Array<{id:string;author_type:string;body:string;created_at:string}>}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages"),
    ]).then(([tickets,messages])=>{
      if(!active)return;
      const current=tickets.items.find(item=>item.id===ticketId);
      if(!current)throw new Error("Ticket wurde nicht gefunden.");
      setTicket(current);setRemote(messages.items);
    }).catch(error=>{if(active)setTicketError(error instanceof Error?error.message:"Ticket konnte nicht geladen werden.")}).finally(()=>{if(active)setTicketLoading(false)});
    return()=>{active=false};
  },[ticketId,ticketRetry,revision]);

  const send=async()=>{
    const value=draft.trim();
    if(!value||sendPending.current||ticketLoading||ticketError)return;
    sendPending.current=true;
    setSending(true);
    setDraft("");
    if(isProductionBackendEnabled()){
      try{
        const payload=await apiPost<{item:{id:string;author_type:string;body:string;created_at:string}}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages",{body:value});
        setRemote(current=>current.some(item=>item.id===payload.item.id)?current:[...current,payload.item]);
      }catch(error){
        setDraft(current=>current.trim()?`${value}\n${current}`:value);
        setToast(error instanceof Error?error.message:"Nachricht konnte nicht gesendet werden.");
        window.setTimeout(()=>setToast(null),2600);
      }
      sendPending.current=false;
      setSending(false);
      return;
    }
    setSent(current=>[...current,value]);
    sendPending.current=false;
    setSending(false);
  };

  return <AppShell headingPlacement="header" title="Support" active="support" backHref="/support" backLabel="Support">
    <div className="entity-detail-workspace support-detail-workspace">

      <div className="desktop-detail-main"><div className="support-thread"><div className="thread-context"><span title={ticketReference}>{ticketSubject}</span>{ticket&&<Status tone={ticketStatus==="resolved"||ticketStatus==="closed"?"success":"info"}>{ticketStatusLabel[ticketStatus]??ticketStatus}</Status>}</div><LocalizedElement as="div" className="thread-messages" tabIndex={0} role="log" ref={messagesRef} aria-label="Nachrichtenverlauf">
      {ticketLoading?<LoadingState><LocalizedText>{"Ticket wird geladen …"}</LocalizedText></LoadingState>:ticketError?<ErrorState onRetry={()=>setTicketRetry(value=>value+1)} retryLabel="Erneut versuchen"><LocalizedText>{ticketError}</LocalizedText></ErrorState>:!production&&<div className="thread-day"><LocalizedText>{"Heute"}</LocalizedText></div>}
      {production ? remote.map((message,index)=><Fragment key={message.id}>{messageDay(message.created_at)!==messageDay(remote[index-1]?.created_at??"")&&<div className="thread-day">{messageDay(message.created_at)}</div>}<MessageBubble outgoing={message.author_type==="customer"} time={<>{new Date(message.created_at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit",timeZone:"Europe/Zurich"})}</>} author={message.author_type!=="customer"?"Binso Support":undefined}>{message.body}</MessageBubble></Fragment>) : <>
        <MessageBubble outgoing={true} time={<>10:24</>}><LocalizedText>{"Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?"}</LocalizedText></MessageBubble>
        <MessageBubble outgoing={false} time={<>10:37</>} author={<><LocalizedText>{"Binso Support"}</LocalizedText></>}><LocalizedText>{"Hallo Thomas. Gerne helfe ich dir weiter. Um welche Rechnung geht es genau?"}</LocalizedText></MessageBubble>
        <MessageBubble outgoing={true} time={<>10:41</>}><LocalizedText>{"Es geht um die Rechnung RE-2026-019 von Acme AG."}</LocalizedText></MessageBubble>
        <MessageBubble outgoing={false} time={<>10:42</>} author={<><LocalizedText>{"Binso Support"}</LocalizedText></>}><LocalizedText>{"Super, ich schaue das gerne für dich nach."}</LocalizedText></MessageBubble>
        {sent.map((text,i)=><MessageBubble outgoing={true} time={<><LocalizedText>{"jetzt"}</LocalizedText></>} key={text+"-"+i}><LocalizedText verbatim={true}>{text}</LocalizedText></MessageBubble>)}
      </>}
      {production&&!ticketLoading&&!ticketError&&remote.length===0&&<EmptyState  title="Noch keine Nachrichten" />}
      </LocalizedElement><div className="thread-composer"><ActionsMenu label="Chataktionen" busy={uploading||ticketLoading||!!ticketError}><ActionRow icon="upload" title="Datei anhängen" onClick={()=>attachmentRef.current?.click()}/></ActionsMenu><Input ref={attachmentRef} id={"support-thread-file-"+ticketId} hidden type="file" disabled={uploading||ticketLoading||!!ticketError} accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void uploadSupportFile(file)}}/><Textarea ref={composerRef} rows={1} autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="enter" aria-label="Nachricht" disabled={ticketLoading||!!ticketError} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)&&!e.nativeEvent.isComposing){e.preventDefault();void send();}}} placeholder="Nachricht schreiben..."/><LocalizedElement as="button" type="button" onClick={()=>void send()} disabled={sending||ticketLoading||!!ticketError||!draft.trim()} aria-label={sending?"Nachricht wird gesendet":"Senden"}><Icon name="arrow"/></LocalizedElement></div>
    </div></div>

    </div>
    {toast&&<Toast title={toast} tone={toast==="Datei angehängt."?"success":toast==="Datei im Demo-Modus nicht dauerhaft gespeichert."?"info":"danger"}/>}
  </AppShell>;
}
