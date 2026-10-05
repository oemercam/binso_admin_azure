"use client";

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
    if(existing)setPerformance(existing.performance);
    setOpen(!existing);
    setReady(true);
    const reopen=()=>{const current=loadPreferences();setPerformance(current?.performance??false);setOpen(true);};
    window.addEventListener("binso:open-privacy-settings",reopen);
    return()=>window.removeEventListener("binso:open-privacy-settings",reopen);
  },[]);

  if(!ready||!open)return null;

  return <div className="privacy-consent-layer" role="dialog" aria-labelledby="privacy-consent-title">
    <section className="privacy-consent-card">
      <div className="privacy-consent-copy">
        <span className="eyebrow">DATENSCHUTZ</span>
        <h2 id="privacy-consent-title">Deine Datenschutz-Einstellungen</h2>
        <p>Binso One verwendet technisch notwendige Speichermechanismen für Anmeldung, Sicherheit und Einstellungen. Optionale Performance-Messungen helfen uns, Ladezeiten und Bedienqualität zu verbessern. Wir verwenden keine Werbe- oder Cross-Site-Tracking-Cookies.</p>
        <Link href="/datenschutz">Datenschutzerklärung</Link>
      </div>
      <div className="privacy-consent-options">
        <div><span><b>Technisch notwendig</b><small>Für Anmeldung, Sicherheit, Sitzungen und Einstellungen.</small></span><strong>Immer aktiv</strong></div>
        <label><span><b>Performance</b><small>Anonyme Web-Vitals wie Ladezeit und Darstellungsstabilität. Keine Werbung.</small></span><input type="checkbox" checked={performance} onChange={e=>setPerformance(e.target.checked)}/></label>
      </div>
      <div className="privacy-consent-actions">
        <Button variant="secondary" onClick={()=>{storePreferences(false);setPerformance(false);setOpen(false);}}>Nur notwendige</Button>
        <Button variant="secondary" onClick={()=>{storePreferences(performance);setOpen(false);}}>Auswahl speichern</Button>
        <Button onClick={()=>{storePreferences(true);setPerformance(true);setOpen(false);}}>Alle erlauben</Button>
      </div>
    </section>
  </div>;
}

export function PrivacySettingsButton(){
  return <button type="button" className="footer-privacy-button" onClick={()=>window.dispatchEvent(new Event("binso:open-privacy-settings"))}>Cookie-/Datenschutz-Einstellungen</button>;
}


export function PrivacySettingsPage(){
  const [performance,setPerformance]=useState(false);
  const [saved,setSaved]=useState(false);

  useEffect(()=>{
    setPerformance(loadPreferences()?.performance??false);
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
      <div className="context-block"><Status tone="success">Immer aktiv</Status><b>Anmeldung, Sicherheit und Einstellungen</b><span>Diese Speichermechanismen sind für Sessions, Kontoschutz, Demo-Funktionen und Benutzereinstellungen erforderlich und können nicht deaktiviert werden.</span></div>
    </section>
    <section className="surface security-card">
      <SectionTitle title="Performance-Messung"/>
      <div className="context-block"><Status tone={performance?"success":"neutral"}>{performance?"Erlaubt":"Aus"}</Status><b>Web-Vitals</b><span>Optional werden technische Kennzahlen wie Ladezeit und Darstellungsstabilität sowie eine gekürzte Route erfasst. Keine Werbung und kein Cross-Site-Tracking.</span></div>
      <div className="privacy-settings-actions">
        <Button variant={performance?"secondary":"primary"} onClick={()=>save(false)}>Deaktivieren</Button>
        <Button variant={performance?"primary":"secondary"} onClick={()=>save(true)}>Erlauben</Button>
      </div>
      {saved&&<p className="settings-note" role="status">Datenschutz-Einstellung gespeichert.</p>}
    </section>
    <section className="surface security-card">
      <SectionTitle title="Weitere Informationen"/>
      <p className="settings-note">Details zur Datenbearbeitung und zu eingesetzten Dienstleistern findest du in der Datenschutzerklärung und der Unterauftragsbearbeiter-Liste.</p>
      <div className="privacy-settings-actions"><Button href="/datenschutz" variant="secondary">Datenschutzerklärung</Button><Button href="/unterauftragsbearbeiter" variant="secondary">Unterauftragsbearbeiter</Button></div>
    </section>
  </AppShell>;
}
