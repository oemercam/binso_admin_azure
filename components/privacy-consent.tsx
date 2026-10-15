"use client";

import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Button,SectionTitle,Status} from "@/components/ui";
import {AppShell} from "@/components/app-shell";

export const privacyPreferenceKey="binso.privacy.preferences.v1";
export const privacyPreferenceEvent="binso:privacy-preferences";

type Preferences={essential:true;performance:boolean;updatedAt:string};

function loadPreferences():Preferences|null{
  if(typeof window==="undefined")return null;
  try{
    const raw=window.localStorage.getItem(privacyPreferenceKey);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as Partial<Preferences>;
    if(typeof parsed.performance!=="boolean")return null;
    return {essential:true,performance:parsed.performance,updatedAt:String(parsed.updatedAt??"")};
  }catch{return null;}
}

export function readPerformanceConsent(){
  return loadPreferences()?.performance===true;
}

function storePreferences(performance:boolean){
  const next:Preferences={essential:true,performance,updatedAt:new Date().toISOString()};
  window.localStorage.setItem(privacyPreferenceKey,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(privacyPreferenceEvent,{detail:next}));
}

export function PrivacyConsent(){
  const [ready,setReady]=useState(false);
  const [open,setOpen]=useState(false);
  const [performance,setPerformance]=useState(false);

  useEffect(()=>{
    const existing=loadPreferences();
    queueMicrotask(()=>{
      if(existing)setPerformance(existing.performance);
      setOpen(!existing);
      setReady(true);
    });
    const reopen=()=>{const current=loadPreferences();setPerformance(current?.performance??false);setOpen(true);};
    window.addEventListener("binso:open-privacy-settings",reopen);
    return()=>window.removeEventListener("binso:open-privacy-settings",reopen);
  },[]);

  if(!ready||!open)return null;

  return <div className="privacy-consent-layer" role="dialog" aria-labelledby="privacy-consent-title">
    <section className="privacy-consent-card">
      <div className="privacy-consent-copy">
        <span className="eyebrow"><LocalizedText>{"DATENSCHUTZ"}</LocalizedText></span>
        <h2 id="privacy-consent-title"><LocalizedText>{"Datenschutz-Einstellungen"}</LocalizedText></h2>
        <p><LocalizedText>{"Notwendiger Speicher ermöglicht Anmeldung und Einstellungen. Die optionale Performance-Messung verbessert Ladezeiten. Keine Werbung oder Cross-Site-Tracking."}</LocalizedText></p>
        <Link href="/datenschutz"><LocalizedText>{"Datenschutzerklärung"}</LocalizedText></Link>
      </div>
      <div className="privacy-consent-options">
        <div><span><b><LocalizedText>{"Technisch notwendig"}</LocalizedText></b><small><LocalizedText>{"Für Anmeldung, Sicherheit, Sitzungen und Einstellungen."}</LocalizedText></small></span><strong><LocalizedText>{"Immer aktiv"}</LocalizedText></strong></div>
        <label><span><b><LocalizedText>{"Performance"}</LocalizedText></b><small><LocalizedText>{"Optionale Messung von Ladezeit und Darstellungsstabilität."}</LocalizedText></small></span><input type="checkbox" checked={performance} onChange={e=>setPerformance(e.target.checked)}/></label>
      </div>
      <div className="privacy-consent-actions">
        <Button variant="secondary" onClick={()=>{storePreferences(false);setPerformance(false);setOpen(false);}}><LocalizedText>{"Nur notwendige"}</LocalizedText></Button>
        <Button variant="secondary" onClick={()=>{storePreferences(performance);setOpen(false);}}><LocalizedText>{"Auswahl speichern"}</LocalizedText></Button>
        <Button onClick={()=>{storePreferences(true);setPerformance(true);setOpen(false);}}><LocalizedText>{"Alle erlauben"}</LocalizedText></Button>
      </div>
    </section>
  </div>;
}

export function PrivacySettingsButton(){
  return <button type="button" className="footer-privacy-button" onClick={()=>window.dispatchEvent(new Event("binso:open-privacy-settings"))}><LocalizedText>{"Cookie-/Datenschutz-Einstellungen"}</LocalizedText></button>;
}


export function PrivacySettingsPage(){
  const [performance,setPerformance]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    queueMicrotask(()=>setPerformance(loadPreferences()?.performance??false));
  },[]);

  const save=(value:boolean)=>{
    storePreferences(value);
    setPerformance(value);
    setSaved(true);
    window.setTimeout(()=>setSaved(false),2200);
  };

  return <AppShell title="Datenschutz & Cookies" subtitle="Technisch notwendige Funktionen und optionale Performance-Messung." active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <section className="surface security-card">
      <SectionTitle title="Technisch notwendig"/>
      <div className="context-block"><Status tone="success"><LocalizedText>{"Immer aktiv"}</LocalizedText></Status><b><LocalizedText>{"Anmeldung, Sicherheit und Einstellungen"}</LocalizedText></b><span><LocalizedText>{"Diese Speichermechanismen sind für Sessions, Kontoschutz, Demo-Funktionen und Benutzereinstellungen erforderlich und können nicht deaktiviert werden."}</LocalizedText></span></div>
    </section>
    <section className="surface security-card">
      <SectionTitle title="Performance-Messung"/>
      <div className="context-block"><Status tone={performance?"success":"neutral"}><LocalizedText>{performance?"Erlaubt":"Aus"}</LocalizedText></Status><b><LocalizedText>{"Web-Vitals"}</LocalizedText></b><span><LocalizedText>{"Optional werden technische Kennzahlen wie Ladezeit und Darstellungsstabilität sowie eine gekürzte Route erfasst. Keine Werbung und kein Cross-Site-Tracking."}</LocalizedText></span></div>
      <div className="privacy-settings-actions">
        <Button variant={performance?"secondary":"primary"} onClick={()=>save(false)}><LocalizedText>{"Deaktivieren"}</LocalizedText></Button>
        <Button variant={performance?"primary":"secondary"} onClick={()=>save(true)}><LocalizedText>{"Erlauben"}</LocalizedText></Button>
      </div>
      {saved&&<p className="settings-note" role="status"><LocalizedText>{"Datenschutz-Einstellung gespeichert."}</LocalizedText></p>}
    </section>
    <section className="surface security-card">
      <SectionTitle title="Weitere Informationen"/>
      <p className="settings-note"><LocalizedText>{"Details zur Datenbearbeitung und zu eingesetzten Dienstleistern findest du in der Datenschutzerklärung und der Unterauftragsbearbeiter-Liste."}</LocalizedText></p>
      <div className="privacy-settings-actions"><Button href="/datenschutz" variant="secondary"><LocalizedText>{"Datenschutzerklärung"}</LocalizedText></Button><Button href="/unterauftragsbearbeiter" variant="secondary"><LocalizedText>{"Unterauftragsbearbeiter"}</LocalizedText></Button></div>
    </section>
  </AppShell>;
}
