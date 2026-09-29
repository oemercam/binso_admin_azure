"use client";
import {useCallback,useEffect,useState} from "react";
import {RefreshCw} from "lucide-react";
type Health={status:"ok"|"degraded";service:string;mode:string;database:"disabled"|"ok"|"error";timestamp:string};
type State={loading:boolean;health:Health|null;error:boolean};
export default function StatusClient(){
 const [state,setState]=useState<State>({loading:true,health:null,error:false});
 const load=useCallback(async()=>{setState(x=>({...x,loading:true}));try{const r=await fetch("/api/health",{cache:"no-store"});const data=await r.json() as Health;setState({loading:false,health:data,error:!r.ok})}catch{setState({loading:false,health:null,error:true})}},[]);
 useEffect(()=>{const t=window.setTimeout(()=>void load(),0);return()=>window.clearTimeout(t)},[load]);
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
  <div className={overall?"status-ok":"status-ok degraded"}><i/>{state.loading?"Status wird geprüft …":overall?"Keine bekannte Kernstörung":"Beeinträchtigung erkannt"}</div>
  <div className="status-page-title"><div><h1>Binso One Status</h1><p>Live-Prüfung der öffentlich messbaren Kernkomponenten. Nicht öffentlich geprüfte Dienste werden bewusst nicht als «betriebsbereit» behauptet.</p></div><button className="secondary-button" onClick={()=>void load()} disabled={state.loading}><RefreshCw size={15}/>{state.loading?"Prüft …":"Neu prüfen"}</button></div>
  <section className="status-services">{rows.map(x=><div key={x.label}><span>{x.label}</span><strong className={x.neutral?"neutral":x.ok?"":"degraded"}><i/>{x.value}</strong></div>)}</section>
  <section className="workspace-card"><h2>Geplante Wartungen</h2><p>Zurzeit sind keine öffentlichen Wartungsfenster angekündigt.</p>{state.health?.timestamp&&<small>Letzte technische Prüfung: {new Date(state.health.timestamp).toLocaleString("de-CH")}</small>}</section>
 </>
}
