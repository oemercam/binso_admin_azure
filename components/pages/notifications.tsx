"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "../app-shell";
import { apiGet, apiPatch, useBackendMode } from "@/lib/client/backend";
import { Button, EmptyState, Icon } from "../ui";

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
  const [remoteItems,setRemoteItems]=useState<NotificationRecord[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const items=[
    ["invoice","wallet","Rechnung bezahlt","Acme AG · RE-2026-019 · CHF 4’346.40","vor 12 Minuten","/rechnungen/RE-2026-019"],
    ["support","support","Neue Support-Antwort","Ticket #5832 wurde beantwortet.","vor 1 Stunde","/support/5832"],
    ["offer","file","Angebot angenommen","Acme AG · AN-2026-012","heute","/angebote/AN-2026-012"],
    ["time","clock","Zeitmessung läuft","Website Redesign · Acme AG","seit 2 Stunden","/zeit"],
  ];

  const load=async()=>{
    if(!production) return;
    setLoading(true);
    setError(null);
    try{
      const payload=await apiGet<{items:NotificationRecord[]}>("/api/notifications");
      setRemoteItems(payload.items);
    }catch(err){
      setError(err instanceof Error?err.message:"Benachrichtigungen konnten nicht geladen werden.");
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{
    if(!production) return;
    apiGet<{items:NotificationRecord[]}>("/api/notifications")
      .then(payload=>queueMicrotask(()=>{setRemoteItems(payload.items);setLoading(false);}))
      .catch(err=>queueMicrotask(()=>{setError(err instanceof Error?err.message:"Benachrichtigungen konnten nicht geladen werden.");setLoading(false);}));
  },[production]);

  const markRead=async(id:string)=>{
    setRemoteItems(current=>current.map(item=>item.id===id?{...item,read_at:item.read_at??new Date().toISOString()}:item));
    try{
      await apiPatch("/api/notifications/"+encodeURIComponent(id),{});
    }catch{
      void load();
    }
  };

  const markAll=async()=>{
    setRemoteItems(current=>current.map(item=>({...item,read_at:item.read_at??new Date().toISOString()})));
    try{
      await apiPatch("/api/notifications",{action:"read_all"});
    }catch{
      void load();
    }
  };

  if(production){
    const unreadCount=remoteItems.filter(item=>!item.read_at).length;
    const visible=view==="all"?remoteItems:remoteItems.filter(item=>!item.read_at);
    return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={unreadCount>0?<Button variant="secondary" onClick={()=>void markAll()}>Alle gelesen</Button>:undefined}>
      <div className="notification-center">
        <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
        {loading&&remoteItems.length===0&&<EmptyState icon="bell" title="Benachrichtigungen werden geladen" text="Aktuelle Aktivitäten werden abgerufen."/>}
        {error&&<EmptyState icon="bell" title="Benachrichtigungen nicht verfügbar" text={error} action={<Button variant="secondary" onClick={()=>void load()}>Erneut laden</Button>}/>}
        {!loading&&!error&&visible.length===0&&<EmptyState icon="bell" title={view==="unread"?"Alles gelesen":"Noch keine Benachrichtigungen"} text={view==="unread"?"Es gibt aktuell keine ungelesenen Benachrichtigungen.":"Neue Aktivitäten erscheinen hier automatisch."}/>}
        {!error&&visible.length>0&&<div className="notification-center-list">{visible.map(item=><Link href={item.href||"/dashboard"} className={item.read_at?"notification-center-row":"notification-center-row unread"} key={item.id} onClick={()=>void markRead(item.id)}>
          <span className="activity-icon"><Icon name={notificationIcon(item.kind)}/></span>
          <div><b>{item.title}</b><p>{item.body}</p><small>{notificationDate(item.created_at)}</small></div>
          {!item.read_at&&<i className="unread-dot"/>}
          <Icon name="arrow" size={16}/>
        </Link>)}</div>}
        <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
      </div>
    </AppShell>;
  }

  const visible=view==="all"?items:items.filter(([id])=>!read.includes(id));
  const unreadCount=items.length-read.length;
  return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen" backHref="/dashboard" backLabel="Start" actions={<Button variant="secondary" onClick={()=>setRead(items.map(item=>item[0]))}>Alle gelesen</Button>}>
    <div className="notification-center">
      <div className="notification-center-tabs"><button className={view==="all"?"active":""} onClick={()=>setView("all")}>Alle</button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}>Ungelesen{unreadCount>0?` (${unreadCount})`:""}</button></div>
      {visible.length?<div className="notification-center-list">{visible.map(([id,icon,title,text,time,href])=>{
        const isRead=read.includes(id);
        return <Link href={href} className={isRead?"notification-center-row":"notification-center-row unread"} key={id} onClick={()=>setRead(current=>current.includes(id)?current:[...current,id])}>
          <span className="activity-icon"><Icon name={icon}/></span>
          <div><b>{title}</b><p>{text}</p><small>{time}</small></div>
          {!isRead&&<i className="unread-dot"/>}
          <Icon name="arrow" size={16}/>
        </Link>;
      })}</div>:<EmptyState icon="bell" title="Alles gelesen" text="Es gibt aktuell keine ungelesenen Benachrichtigungen."/>}
      <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span>Benachrichtigungseinstellungen</span><Icon name="arrow" size={15}/></Link>
    </div>
  </AppShell>;
}
