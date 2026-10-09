"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWorkspaceViewport } from "../use-workspace-viewport";
import { AppShell } from "../app-shell";
import { RecordRow, RecordsView } from "../records";
import { apiGet, apiPost, apiUpload, isProductionBackendEnabled, useBackendMode } from "@/lib/client/backend";
import {Button, EmptyState, Field, Icon, Toast, Input, Select, Textarea, FormActions, LoadingState, ErrorState, MessageBubble} from "../ui";
import { ActionRow, ActionsMenu, CreateAction, MetricTiles, MetricTile } from "../binso-ux";

export function supportReference(id:string,caseNumber?:string|null){
  const raw=String(caseNumber??id);
  if(/^(?:T-)?[0-9a-f-]{20,}$/i.test(raw))return "T-"+id.replace(/-/g,"").slice(0,8).toUpperCase();
  return raw.startsWith("#")?raw:"#"+raw;
}

export function useSupportRows(){
  const [rows,setRows]=useState<string[][]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    apiGet<{items:Array<{id:string;case_number?:string;subject:string;status:string;updated_at:string}>}>(isProductionBackendEnabled()?"/api/support/tickets":"/api/demo/data?collection=support_tickets")
      .then(payload=>{
        const statusMap:Record<string,string>={new:"Neu",open:"Offen",in_progress:"In Bearbeitung",waiting_customer:"Warten auf Kunde",resolved:"Gelöst",closed:"Geschlossen"};
        queueMicrotask(()=>setRows(payload.items.map(item=>[item.id,item.subject?.trim()||"Support-Anfrage",new Date(item.updated_at).toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"}),statusMap[item.status]??item.status,supportReference(item.id,item.case_number)])));
      })
      .catch(error=>setError(error instanceof Error?error.message:"Tickets konnten nicht geladen werden."))
      .finally(()=>setLoading(false));
  },[]);
  return {rows,loading,error};
}

export function SupportPage() {
  const {rows:ticketRows,loading,error}=useSupportRows();
  return <AppShell title="Support" subtitle="Hilfe direkt in Binso One – persönlich und nachvollziehbar." active="support" actions={<CreateAction href="/support/neu" label="Neues Ticket"/>}>
    {!loading&&!error&&<MetricTiles><MetricTile label="Offene Tickets" value={String(ticketRows.filter(row=>!["Gelöst","Geschlossen"].includes(row[3])).length)}/><MetricTile label="Gelöste Tickets" value={String(ticketRows.filter(row=>["Gelöst","Geschlossen"].includes(row[3])).length)}/></MetricTiles>}
    <div className="tablet-master-detail support-master-detail">
      <RecordsView countLabel="Tickets" loading={loading} error={error} items={ticketRows} placeholder="Tickets suchen..." chips={["Alle","Offen","In Bearbeitung","Gelöst","Geschlossen"]} statusGroups={{Offen:["Neu","Warten auf Kunde"]}} columns={[{label:"Ticket",index:4},{label:"Betreff",index:1},{label:"Aktualisiert",index:2},{label:"Status",index:3,status:true}]} rowHref={row=>`/support/${row[0]}`}>{([id,subject,updated,status])=><RecordRow href={`/support/${id}`} icon="support" title={subject} meta={`Ticket ${id} · ${updated}`} status={status}/>}</RecordsView>

    </div>
  </AppShell>;
}

export function SupportTicketForm() {
  const router=useRouter();
  const [subject,setSubject]=useState("");
  const [saved,setSaved]=useState(false);
  const [submitting,setSubmitting]=useState(false);
  const submitPending=useRef(false);
  const [category,setCategory]=useState("Allgemeine Frage");
  const [message,setMessage]=useState("");
  const [attachment,setAttachment]=useState<File|null>(null);
  const [toast,setToast]=useState<string|null>(null);
  const save=async()=>{
    if(submitPending.current||saved)return;
    if(!subject.trim()||!message.trim()){
      setToast("Betreff und Nachricht sind erforderlich.");
      window.setTimeout(()=>setToast(null),2200);
      return;
    }
    submitPending.current=true;
    setSubmitting(true);
    try{
      if(!isProductionBackendEnabled())throw new Error("Die Vorschau ist schreibgeschützt. Bitte eine Datenbank-Demo starten.");
      if(isProductionBackendEnabled()){
        const payload=await apiPost<{item:{id:string}}>("/api/support/tickets",{subject,category,priority:"normal",message});
        if(attachment){
          const form=new FormData();
          form.append("file",attachment);
          form.append("purpose","support_attachment");
          form.append("entityId",payload.item.id);
          await apiUpload("/api/files",form);
        }
        setSaved(true);
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
  return <AppShell title="Neue Support-Anfrage" unsavedChanges={!saved&&Boolean(subject||message||attachment||category!=="Allgemeine Frage")} subtitle="Beschreibe kurz, wobei wir helfen können." active="support" backHref="/support" backLabel="Support">
    <div className="form-page narrow">
      <div className="form-grid">
        <Field label="Betreff" className="full"><Input autoFocus value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Worum geht es?"/></Field>
        <Field label="Kategorie" className="full"><Select value={category} onChange={e=>setCategory(e.target.value)}><option>Allgemeine Frage</option><option>Rechnung</option><option>Zeiterfassung</option><option>Technisches Problem</option></Select></Field>
        <Field label="Nachricht" className="full"><Textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Beschreibe dein Anliegen kurz..."/></Field>
      </div>
      <label className="attachment-button" htmlFor="support-file-upload"><Icon name="upload"/><span>{attachment?attachment.name:"Screenshot oder Datei hinzufügen"}</span></label><Input id="support-file-upload" hidden type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={e=>setAttachment(e.target.files?.[0]??null)}/>
      <p className="technical-hint">Browser, App-Version und Zeitpunkt werden automatisch mitgesendet.</p>
      <FormActions ><Button onClick={save} disabled={submitting||saved}>{submitting?"Wird erstellt…":"Ticket erstellen"}</Button></FormActions>
    </div>
    {toast&&<Toast title={toast} tone={toast==="Ticket erstellt."?"success":"danger"}/>}
  </AppShell>;
}

export function SupportChat({ticketId="5832"}:{ticketId?:string}) {
  useWorkspaceViewport();
  const messagesRef=useRef<HTMLDivElement>(null);
  const production=useBackendMode();
  const [draft,setDraft]=useState("");
  const [ticketLoading,setTicketLoading]=useState(true);
  const [ticketError,setTicketError]=useState<string|null>(null);
  const [ticketRetry,setTicketRetry]=useState(0);
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
    queueMicrotask(()=>{if(active){setTicketLoading(true);setTicketError(null)}});
    Promise.all([
      apiGet<{items:Array<{id:string;case_number?:string|null;subject?:string|null;status?:string|null;priority?:string|null;created_at?:string|null}>}>("/api/support/tickets"),
      apiGet<{items:Array<{id:string;author_type:string;body:string;created_at:string}>}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages"),
    ]).then(([tickets,messages])=>{
      if(!active)return;
      const current=tickets.items.find(item=>item.id===ticketId);
      if(!current)throw new Error("Ticket wurde nicht gefunden.");
      setTicket(current);setRemote(messages.items);
    }).catch(error=>{if(active)setTicketError(error instanceof Error?error.message:"Ticket konnte nicht geladen werden.")}).finally(()=>{if(active)setTicketLoading(false)});
    return()=>{active=false};
  },[ticketId,ticketRetry]);

  const send=async()=>{
    const value=draft.trim();
    if(!value||sendPending.current||ticketLoading||ticketError)return;
    sendPending.current=true;
    setSending(true);
    setDraft("");
    if(isProductionBackendEnabled()){
      try{
        const payload=await apiPost<{item:{id:string;author_type:string;body:string;created_at:string}}>("/api/support/tickets/"+encodeURIComponent(ticketId)+"/messages",{body:value});
        setRemote(current=>[...current,payload.item]);
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

  return <AppShell title="Support-Chat" actions={<ActionsMenu label="Chataktionen"><ActionRow href="/support" icon="support" title="Alle Tickets" navigation/><ActionRow href="/support/neu" icon="plus" title="Neues Ticket" navigation/></ActionsMenu>} status={ticket?ticketStatusLabel[ticketStatus]??ticketStatus:undefined} statusTone={ticketStatus==="resolved"||ticketStatus==="closed"?"success":"info"} subtitle={ticketReference} active="support" backHref="/support" backLabel="Support">
    <div className="entity-detail-workspace support-detail-workspace">

      <div className="desktop-detail-main"><div className="support-thread"><div className="thread-messages" tabIndex={0} role="log" ref={messagesRef} aria-label="Nachrichtenverlauf">
      {ticketLoading?<LoadingState>Ticket wird geladen …</LoadingState>:ticketError?<ErrorState onRetry={()=>setTicketRetry(value=>value+1)} retryLabel="Erneut versuchen">{ticketError}</ErrorState>:<div className="thread-day">Heute</div>}
      {production ? remote.map(message=><MessageBubble outgoing={message.author_type==="customer"} time={<>{new Date(message.created_at).toLocaleTimeString("de-CH",{hour:"2-digit",minute:"2-digit"})}</>} author={message.author_type!=="customer"?"Binso Support":undefined} key={message.id}>{message.body}</MessageBubble>) : <>
        <MessageBubble outgoing={true} time={<>10:24</>}>Ich habe eine Frage zu einer Rechnung. Können Sie mir bitte weiterhelfen?</MessageBubble>
        <MessageBubble outgoing={false} time={<>10:37</>} author={<>Binso Support</>}>Hallo Thomas. Gerne helfe ich dir weiter. Um welche Rechnung geht es genau?</MessageBubble>
        <MessageBubble outgoing={true} time={<>10:41</>}>Es geht um die Rechnung RE-2026-019 von Acme AG.</MessageBubble>
        <MessageBubble outgoing={false} time={<>10:42</>} author={<>Binso Support</>}>Super, ich schaue das gerne für dich nach.</MessageBubble>
        {sent.map((text,i)=><MessageBubble outgoing={true} time={<>jetzt</>} key={text+"-"+i}>{text}</MessageBubble>)}
      </>}
      {production&&!ticketLoading&&!ticketError&&remote.length===0&&<EmptyState icon="support" title="Noch keine Nachrichten" text="Schreibe die erste Nachricht in diesem Ticket."/>}
      </div><div className="thread-composer"><label className="icon-button" htmlFor={"support-thread-file-"+ticketId} aria-label={uploading?"Datei wird hochgeladen":"Datei anhängen"}><Icon name="upload"/></label><Input id={"support-thread-file-"+ticketId} hidden type="file" disabled={uploading||ticketLoading||!!ticketError} accept="image/png,image/jpeg,image/webp,application/pdf,text/plain" onChange={e=>void uploadSupportFile(e.target.files?.[0])}/><Input aria-label="Nachricht" disabled={ticketLoading||!!ticketError} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void send();}}} placeholder="Nachricht schreiben..."/><button type="button" onClick={()=>void send()} disabled={sending||ticketLoading||!!ticketError||!draft.trim()} aria-label={sending?"Nachricht wird gesendet":"Senden"}><Icon name="arrow"/></button></div>
    </div></div>
      <aside className="desktop-context-rail"><section className="desktop-summary-card"><span className="compact-section-label">Ticket</span><strong>{ticketReference}</strong><small>{ticketSubject}</small><div className="desktop-summary-facts"><span>Status <b>{ticketStatusLabel[ticketStatus]??ticketStatus}</b></span><span>Nachrichten <b>{production?remote.length:4+sent.length}</b></span></div></section><section className="desktop-toolbox"><Link href="/support"><Icon name="support"/><span><b>Alle Tickets</b><small>Zur Supportübersicht</small></span><Icon name="arrow" size={15}/></Link><Link href="/support/neu"><Icon name="plus"/><span><b>Neues Ticket</b><small>Weitere Anfrage erstellen</small></span><Icon name="arrow" size={15}/></Link></section></aside>
    </div>
    {toast&&<Toast title={toast} tone={toast==="Datei angehängt."?"success":toast==="Datei im Demo-Modus nicht dauerhaft gespeichert."?"info":"danger"}/>}
  </AppShell>;
}
