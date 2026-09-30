"use client";

import {useEffect,useState} from "react";
import Link from "next/link";
import {loadConsent,saveConsent} from "@/lib/privacy";
import ToggleSwitch from "@/components/ui/toggle-switch";
import ResponsiveOverlay from "@/components/ui/responsive-overlay";
import {Button} from "@/components/ui/button";
import {useLocale} from "@/components/locale-provider";

export default function CookieConsent(){
 const {t}=useLocale();
 const [open,setOpen]=useState(false);
 const [details,setDetails]=useState(false);
 const [analytics,setAnalytics]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{const consent=loadConsent();if(!consent)setOpen(true);else setAnalytics(consent.analytics)},250);const handler=()=>{const consent=loadConsent();setAnalytics(Boolean(consent?.analytics));setOpen(true);setDetails(true)};window.addEventListener("binso-open-consent",handler);return()=>{window.clearTimeout(timer);window.removeEventListener("binso-open-consent",handler)}},[]);
 const commit=(value:boolean)=>{saveConsent({analytics:value});setOpen(false);setDetails(false)};
 return <ResponsiveOverlay
   open={open}
   title={t("Datenschutz-Einstellungen")}
   onClose={()=>commit(false)}
   size="sm"
   className="consent-overlay"
   closeOnBackdrop={false}
   showHandle={false}
   actions={<div className="consent-actions-central">
     <Button variant="secondary" onClick={()=>commit(false)}>{t("Nur notwendige")}</Button>
     {details?<Button onClick={()=>commit(analytics)}>{t("Auswahl speichern")}</Button>:<Button onClick={()=>commit(true)}>{t("Alle akzeptieren")}</Button>}
   </div>}
 >
   <div className="consent-content">
     <p>{t("Notwendige Funktionen sichern Anmeldung, Sicherheit und Betrieb. Optionale Analyse aktivieren wir nur mit deiner Zustimmung.")}</p>
     <button className="consent-settings-toggle" type="button" onClick={()=>setDetails(v=>!v)}>{details?t("Weniger anzeigen"):t("Einstellungen anpassen")}</button>
     {details&&<div className="consent-options">
       <div className="consent-option-row"><div className="consent-option-copy"><strong>{t("Notwendig")}</strong><span>{t("Anmeldung, Sicherheit, Sprache und Consent-Speicherung.")}</span></div><div className="consent-option-control"><ToggleSwitch checked={true} onChange={()=>{}} disabled label={t("Notwendige Cookies")}/></div></div>
       <div className="consent-option-row"><div className="consent-option-copy"><strong>{t("Analyse")}</strong><span>{t("Hilft uns, die Nutzung zu verstehen. Externe Analyse wird nur nach Zustimmung aktiviert.")}</span></div><div className="consent-option-control"><ToggleSwitch checked={analytics} onChange={setAnalytics} label={t("Analyse")}/></div></div>
     </div>}
     <div className="consent-links"><Link href="/cookies">{t("Cookie-Informationen")}</Link><Link href="/datenschutz">{t("Datenschutz")}</Link></div>
   </div>
 </ResponsiveOverlay>;
}
