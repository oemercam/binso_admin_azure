"use client";

import Link from "next/link";
import {ActionRow} from "../binso-ux";
import {useApiQuery} from "@/lib/client/use-api-query";
import { useState } from "react";
import { AppShell } from "../app-shell";
import { apiPatch, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, Icon, LoadingState, ErrorState } from "../ui";

export type NotificationRecord={
  id:string;
  kind:string;
  title:string;
  body:string;
  href?:string|null;
  read_at?:string|null;
  created_at:string;
};

export function notificationIcon(kind:string){
  if(kind==="support") return "support";
  if(kind==="payment"||kind==="billing") return "wallet";
  if(kind==="document") return "file";
  return "bell";
}

export function notificationDate(value:string){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":date.toLocaleString("de-CH",{dateStyle:"short",timeStyle:"short"});
}

export function NotificationsPage() {
  const production=useBackendMode();
  const [read,setRead]=useState<string[]>(["invoice","offer"]);
  const [view,setView]=useState<"all"|"unread">("all");
  const query=useApiQuery<{items:NotificationRecord[]}>(production?"/api/notifications":null);
  const remoteItems=query.data?.items??[];
  const loading=query.loading;
  const [mutationError,setMutationError]=useState<string|null>(null);
  const error=mutationError??query.error;
  const items=[
    ["invoice","wallet","Rechnung bezahlt","Acme AG · RE-2026-019 · CHF 4’346.40","vor 12 Minuten","/rechnungen/RE-2026-019"],
    ["support","support","Neue Support-Antwort","Ticket #5832 wurde beantwortet.","vor 1 Stunde","/support/5832"],
    ["offer","file","Angebot angenommen","Acme AG · AN-2026-012","heute","/angebote/AN-2026-012"],
    ["time","clock","Zeitmessung läuft","Website Redesign · Acme AG","seit 2 Stunden","/zeit"],
  ];

  const load=()=>{setMutationError(null);query.refresh();};
  const markRead=async(id:string)=>{
    try{await apiPatch("/api/notifications/"+encodeURIComponent(id),{});setMutationError(null);}
    catch(err){setMutationError(err instanceof Error?err.message:"Benachrichtigung konnte nicht aktualisiert werden.");}
  };
  const markAll=async()=>{
    try{await apiPatch("/api/notifications",{all:true});setMutationError(null);}
    catch(err){setMutationError(err instanceof Error?err.message:"Benachrichtigungen konnten nicht aktualisiert werden.");}
  };

  if(production){
    const unreadCount=remoteItems.filter(item=>!item.read_at).length;
    const visible=view==="all"?remoteItems:remoteItems.filter(item=>!item.read_at);
    return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={unreadCount>0?<Button variant="secondary" onClick={()=>void markAll()}>Alle gelesen</Button>:undefined}>
      <div className="notification-center">
        <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
        {loading&&remoteItems.length===0&&<LoadingState>Benachrichtigungen werden geladen …</LoadingState>}
        {error&&<ErrorState onRetry={load} retryLabel="Erneut laden">{error}</ErrorState>}
        {!loading&&!error&&visible.length===0&&<EmptyState icon="bell" title={view==="unread"?"Alles gelesen":"Noch keine Benachrichtigungen"} text={view==="unread"?"Es gibt aktuell keine ungelesenen Benachrichtigungen.":"Neue Aktivitäten erscheinen hier automatisch."}/>}
        {!error&&visible.length>0&&<div className="action-list">{visible.map(item=><ActionRow href={item.href||"/dashboard"} key={item.id} icon={notificationIcon(item.kind)} title={item.title} description={item.body} metadata={notificationDate(item.created_at)} endAdornment={!item.read_at?<i className="unread-dot" aria-label="Ungelesen"/>:undefined} onClick={()=>void markRead(item.id)}/>)}</div>}
        <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
      </div>
    </AppShell>;
  }

  const visible=view==="all"?items:items.filter(([id])=>!read.includes(id));
  const unreadCount=items.length-read.length;
  return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={<Button variant="secondary" onClick={()=>setRead(items.map(item=>item[0]))}>Alle gelesen</Button>}>
    <div className="notification-center">
      <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
      {visible.length?<div className="action-list">{visible.map(([id,icon,title,text,time,href])=><ActionRow href={href} key={id} icon={icon} title={title} description={text} metadata={time} endAdornment={!read.includes(id)?<i className="unread-dot" aria-label="Ungelesen"/>:undefined} onClick={()=>setRead(current=>current.includes(id)?current:[...current,id])}/>)}</div>:<EmptyState icon="bell" title="Alles gelesen" text="Es gibt aktuell keine ungelesenen Benachrichtigungen."/>}
      <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
    </div>
  </AppShell>;
}
