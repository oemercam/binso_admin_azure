"use client";

import {LocalizedText,LocalizedElement,useLocale} from "@/lib/client/locale";
import {localeTags} from '@/lib/locales';
import {formatDateTime} from '@/lib/display-format';
import Link from "next/link";
import {ActionRow,DetailTabs,SettingsGroup} from "../binso-ux";
import {useApiQuery} from "@/lib/client/use-api-query";
import { useEffect, useState } from "react";
import { AppShell } from "../app-shell";
import { apiPatch, apiPost } from "@/lib/client/backend";
import { Button, EmptyState, Icon, LoadingState, ErrorState } from "../ui";

import {notificationGroups} from "@/lib/notification-groups";
import {usePageAccess} from "@/lib/client/page-access";
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

export function notificationDate(value:string,locale="de-CH"){
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":formatDateTime(value,locale);
}

export function NotificationsPage() {

  const {locale}=useLocale();
  const access=usePageAccess();
  const [busy,setBusy]=useState(false);
  const [view,setView]=useState<"all"|"unread">("all");
  const query=useApiQuery<{items:NotificationRecord[]}>("/api/notifications");
  const remoteItems=(query.data?.items??[]).filter(item=>!item.href||access.canOpen(item.href));
  const loading=query.loading;
  const [mutationError,setMutationError]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    void apiPost('/api/notifications/followups',{}).catch(error=>{if(active)setMutationError(error instanceof Error?error.message:'Aktion fehlgeschlagen.');});
    return()=>{active=false;};
  },[]);
  const error=mutationError??query.error;
  const load=()=>{setMutationError(null);query.refresh();};
  const markRead=async(id:string)=>{
    try{await apiPatch("/api/notifications/"+encodeURIComponent(id),{});setMutationError(null);}
    catch(err){setMutationError(err instanceof Error?err.message:"Benachrichtigung konnte nicht aktualisiert werden.");}
  };

  {
    const unreadCount=remoteItems.filter(item=>!item.read_at).length;
    const visible=view==="all"?remoteItems:remoteItems.filter(item=>!item.read_at);
    return <AppShell title="Benachrichtigungen" subtitle="Wichtige Aktivitäten aus deinem Unternehmen." active="einstellungen">
      <div className="notification-center">
        <DetailTabs label="Benachrichtigungen"><button className={view==="all"?"active":""} onClick={()=>setView("all")}><LocalizedText>{"Alle"}</LocalizedText></button><button className={view==="unread"?"active":""} onClick={()=>setView("unread")}><LocalizedText>{"Ungelesen"}</LocalizedText><LocalizedText>{unreadCount>0?` (${unreadCount})`:""}</LocalizedText></button></DetailTabs>
        {loading&&remoteItems.length===0&&<LoadingState><LocalizedText>{"Benachrichtigungen werden geladen …"}</LocalizedText></LoadingState>}
        {error&&<ErrorState onRetry={load} retryLabel="Erneut laden"><LocalizedText>{error}</LocalizedText></ErrorState>}
        {!loading&&!error&&visible.length===0&&<EmptyState  title={view==="unread"?"Alles gelesen":"Noch keine Benachrichtigungen"} />}
        {!error&&visible.length>0&&notificationGroups(visible).map(group=><SettingsGroup key={group.label} title={group.label}><div className="action-list">{group.items.map(item=><ActionRow href={item.href||"/dashboard"} key={item.id} icon={notificationIcon(item.kind)} title={item.title} description={item.body} metadata={notificationDate(item.created_at,localeTags[locale])} endAdornment={!item.read_at?<LocalizedElement as="i" className="unread-dot" aria-label="Ungelesen"/>:undefined} onClick={()=>void markRead(item.id)}/>)}</div></SettingsGroup>)}
        {unreadCount>0&&<Button variant="secondary" disabled={busy} onClick={()=>{setBusy(true);void apiPatch("/api/notifications",{all:true}).then(()=>setMutationError(null)).catch(err=>setMutationError(err instanceof Error?err.message:"Aktualisierung fehlgeschlagen.")).finally(()=>setBusy(false));}}><LocalizedText>{"Alle als gelesen"}</LocalizedText></Button>}
        <Link className="notification-preferences" href="/einstellungen/benachrichtigungen"><Icon name="settings" size={17}/><span><LocalizedText>{"Benachrichtigungseinstellungen"}</LocalizedText></span><Icon name="arrow" size={15}/></Link>
      </div>
    </AppShell>;
  }

}
