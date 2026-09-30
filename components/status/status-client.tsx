"use client";
import {useCallback,useEffect,useState} from "react";
import {useLocale} from "@/components/locale-provider";
import {RefreshCw} from "lucide-react";
import {apiPublicFetch} from "@/lib/client/runtime";
import {Button} from "@/components/ui/button";
type Health={status:"ok"|"degraded";service:string;mode:string;database:"disabled"|"ok"|"error";timestamp:string};
type State={loading:boolean;health:Health|null;error:boolean};
export default function StatusClient(){const {t,formatDateTime}=useLocale();
 const [state,setState]=useState<State>({loading:true,health:null,error:false});
 const load=useCallback(async()=>{setState(x=>({...x,loading:true}));try{const {ok,body}=await apiPublicFetch<Health>("/api/health",{cache:"no-store"});setState({loading:false,health:body,error:!ok})}catch{setState({loading:false,health:null,error:true})}},[]);
 useEffect(()=>{const timer=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(timer)},[load]);
 const appOk=!state.error&&Boolean(state.health);const db=state.health?.database;const overall=appOk&&db!=="error";
 const rows=[
  {label:"Web-Anwendung",value:appOk?"Betriebsbereit":"Nicht erreichbar",ok:appOk},
  {label:"Datenbank",value:db==="ok"?"Betriebsbereit":db==="disabled"?"Nicht öffentlich geprüft":"Beeinträchtigt",ok:db!=="error"},
  {label:"Authentifizierung",value:"Über Anwendungsstatus überwacht",ok:appOk},
  {label:"Dateispeicher",value:"Nicht öffentlich geprüft",ok:true,neutral:true},
  {label:"Zahlungsabwicklung",value:"Nicht öffentlich geprüft",ok:true,neutral:true},
  {label:"Support",value:"Über Anwendungsstatus überwacht",ok:appOk},
 ];
 return <>
  <div className={overall?"status-ok":"status-ok degraded"}><i/>{state.loading?t("Status wird geprüft …"):overall?t("Keine bekannte Kernstörung"):t("Beeinträchtigung erkannt")}</div>
  <div className="status-page-title"><div><h1>{t("Binso One Status")}</h1><p>{t("Live-Prüfung der öffentlich messbaren Kernkomponenten. Nicht öffentlich geprüfte Dienste werden bewusst nicht als «betriebsbereit» behauptet.")}</p></div><Button variant="secondary" onClick={()=>void load()} disabled={state.loading} icon={<RefreshCw size={15}/>}>{state.loading?t("Prüft …"):t("Neu prüfen")}</Button></div>
  <section className="status-services">{rows.map(x=><div key={x.label}><span>{t(x.label)}</span><strong className={x.neutral?"neutral":x.ok?"":"degraded"}><i/>{t(x.value)}</strong></div>)}</section>
  <section className="workspace-card"><h2>{t("Geplante Wartungen")}</h2><p>{t("Zurzeit sind keine öffentlichen Wartungsfenster angekündigt.")}</p>{state.health?.timestamp&&<small>{t("Letzte technische Prüfung")}: {formatDateTime(state.health.timestamp)}</small>}</section>
 </>
}
