"use client";
import {useEffect,useState} from "react";import Link from "next/link";import {loadConsent,saveConsent} from "@/lib/privacy";import ToggleSwitch from "@/components/ui/toggle-switch";
export default function CookieConsent(){
 const [open,setOpen]=useState(false);const [details,setDetails]=useState(false);const [analytics,setAnalytics]=useState(false);
 useEffect(()=>{const t=window.setTimeout(()=>{const c=loadConsent();if(!c)setOpen(true);else setAnalytics(c.analytics)},250);const handler=()=>{const c=loadConsent();setAnalytics(Boolean(c?.analytics));setOpen(true);setDetails(true)};window.addEventListener("binso-open-consent",handler);return()=>{window.clearTimeout(t);window.removeEventListener("binso-open-consent",handler)}},[]);
 if(!open)return null;
 const commit=(value:boolean)=>{saveConsent({analytics:value});setOpen(false);setDetails(false)};
 return <div className="consent-backdrop"><section className="consent-card" role="dialog" aria-modal="true" aria-label="Datenschutz-Einstellungen"><div><div className="eyebrow">Privacy Center</div><h2>Deine Datenschutz-Einstellungen</h2><p>Notwendige Funktionen sichern Anmeldung und Betrieb. Optionale Analyse wird nur aktiviert, wenn du sie zulässt.</p></div>
 {details&&<div className="consent-options">
  <div className="consent-option-row">
    <div className="consent-option-copy"><strong>Notwendig</strong><span>Anmeldung, Sicherheit, Sprache und Consent-Speicherung.</span></div>
    <div className="consent-option-control"><ToggleSwitch checked={true} onChange={()=>{}} disabled label="Notwendige Cookies"/></div>
  </div>
  <div className="consent-option-row">
    <div className="consent-option-copy"><strong>Analyse</strong><span>Hilft uns, Nutzung und Pilotphase zu verbessern. Aktuell werden keine externen Tracker automatisch geladen.</span></div>
    <div className="consent-option-control"><ToggleSwitch checked={analytics} onChange={setAnalytics} label="Analyse"/></div>
  </div>
</div>}
 <div className="consent-links"><Link href="/cookies">Cookie-Informationen</Link><Link href="/datenschutz">Datenschutz</Link></div>
 <div className="consent-actions"><button className="secondary-button" onClick={()=>commit(false)}>Nur notwendige</button><button className="secondary-button" onClick={()=>setDetails(v=>!v)}>{details?"Weniger":"Einstellungen"}</button>{details?<button className="primary-button" onClick={()=>commit(analytics)}>Auswahl speichern</button>:<button className="primary-button" onClick={()=>commit(true)}>Alle akzeptieren</button>}</div></section></div>
}
