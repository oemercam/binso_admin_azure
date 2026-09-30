"use client";

import {useCallback,useEffect,useState} from "react";
import {ShieldCheck,ShieldOff} from "lucide-react";
import {apiFetch,isProductionMode} from "@/lib/client/runtime";
import {notify} from "@/lib/notify";
import {useLocale} from "@/components/locale-provider";
import {limitsConfig} from "@/config/limits";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/form-controls";

type Grant={id:string;reason:string;scope:string[];expiresAt:string;revokedAt?:string|null};

export default function SupportAccess({ticketId}:{ticketId:string}){
 const {t,formatDateTime}=useLocale();
 const [item,setItem]=useState<Grant|null>(null);
 const [reason,setReason]=useState(()=>t("Supportanalyse für dieses Ticket"));
 const load=useCallback(async()=>{if(!isProductionMode())return;try{setItem((await apiFetch<{item:Grant|null}>(`/api/support/${ticketId}/access`)).item)}catch{}},[ticketId]);
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
 const active=item&&!item.revokedAt&&new Date(item.expiresAt)>new Date();
 const hours=limitsConfig.supportAccessHours;
 async function grant(){
  try{
   await apiFetch(`/api/support/${ticketId}/access`,{method:"POST",body:JSON.stringify({reason,hours,scope:["diagnostics","ticket_context"]})});
   await load();
   notify(t("Temporärer Supportzugriff für {hours} Stunden erteilt.").replace("{hours}",String(hours)));
  }catch(e){notify(e instanceof Error?e.message:t("Zugriff konnte nicht erteilt werden."),"danger")}
 }
 async function revoke(){await apiFetch(`/api/support/${ticketId}/access`,{method:"DELETE",body:"{}"});await load();notify(t("Supportzugriff wurde widerrufen."))}
 return <section className="workspace-card support-access-card">
  <div className="section-title"><div><h2>{t("Temporärer Supportzugriff")}</h2><span>{t("kontrolliert und zeitlich begrenzt")}</span></div>{active?<ShieldCheck size={20}/>:<ShieldOff size={20}/>}</div>
  <p>{t("Diese Freigabe erlaubt dem Binso Support nur den für dieses Ticket definierten technischen Kontext. Sie erteilt keinen pauschalen Zugriff auf Geschäftsdaten.")}</p>
  {active?<><div className="support-access-active"><strong>{t("Aktiv bis")} {formatDateTime(item.expiresAt)}</strong><span>{item.reason}</span></div><Button variant="secondary" onClick={revoke}>{t("Zugriff widerrufen")}</Button></>:<><label><span>{t("Grund")}</span><Input value={reason} onChange={e=>setReason(e.target.value)}/></label><Button variant="secondary" onClick={grant}>{t("Für {hours} Stunden erlauben").replace("{hours}",String(hours))}</Button></>}
 </section>
}
