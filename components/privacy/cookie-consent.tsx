"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {loadConsent,saveConsent} from "@/lib/privacy";
import ToggleSwitch from "@/components/ui/toggle-switch";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";

export default function CookieConsent(){
 const [open,setOpen]=useState(false);
 const [details,setDetails]=useState(false);
 const [analytics,setAnalytics]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{const consent=loadConsent();if(!consent)setOpen(true);else setAnalytics(consent.analytics)},250);const handler=()=>{const consent=loadConsent();setAnalytics(Boolean(consent?.analytics));setOpen(true);setDetails(true)};window.addEventListener("binso-open-consent",handler);return()=>{window.clearTimeout(timer);window.removeEventListener("binso-open-consent",handler)}},[]);
 const commit=(value:boolean)=>{saveConsent({analytics:value});setOpen(false);setDetails(false)};
 return <ResponsiveOverlay
   open={open}
   title="Deine Datenschutz-Einstellungen"
   onClose={()=>commit(false)}
   size="md"
   closeOnBackdrop={false}
   actions={<div className="consent-actions-central">
     <Button variant="secondary" onClick={()=>commit(false)}>Nur notwendige</Button>
     <Button variant="secondary" onClick={()=>setDetails(v=>!v)}>{details?"Weniger":"Einstellungen"}</Button>
     {details?<Button onClick={()=>commit(analytics)}>Auswahl speichern</Button>:<Button onClick={()=>commit(true)}>Alle akzeptieren</Button>}
   </div>}
 >
   <div className="consent-content">
     <p>Notwendige Funktionen sichern Anmeldung und Betrieb. Optionale Analyse wird nur aktiviert, wenn du sie zulässt.</p>
     {details&&<div className="consent-options">
       <div className="consent-option-row"><div className="consent-option-copy"><strong>Notwendig</strong><span>Anmeldung, Sicherheit, Sprache und Consent-Speicherung.</span></div><div className="consent-option-control"><ToggleSwitch checked={true} onChange={()=>{}} disabled label="Notwendige Cookies"/></div></div>
       <div className="consent-option-row"><div className="consent-option-copy"><strong>Analyse</strong><span>Hilft uns, Nutzung und Pilotphase zu verbessern. Aktuell werden keine externen Tracker automatisch geladen.</span></div><div className="consent-option-control"><ToggleSwitch checked={analytics} onChange={setAnalytics} label="Analyse"/></div></div>
     </div>}
     <div className="consent-links"><Link href="/cookies">Cookie-Informationen</Link><Link href="/datenschutz">Datenschutz</Link></div>
   </div>
 </ResponsiveOverlay>;
}
