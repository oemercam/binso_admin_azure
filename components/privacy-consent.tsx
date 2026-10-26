"use client";

import {LocalizedText} from "@/lib/client/locale";
import Link from "next/link";
import {useEffect,useState} from "react";
import {Button,Toggle,ErrorState} from "@/components/ui";
import {useDialogFocus} from '@/components/use-dialog-focus';
import {ActionRow,SettingsGroup,ListRow} from "@/components/binso-ux";
import {AppShell} from "@/components/app-shell";

export const privacyPreferenceKey="binso.privacy.preferences.v1";
export const privacyPreferenceEvent="binso:privacy-preferences";

const consentVersion=2;
type Preferences={version:2;essential:true;performance:boolean;updatedAt:string};

function loadPreferences():Preferences|null{
  if(typeof window==="undefined")return null;
  try{
    const raw=window.localStorage.getItem(privacyPreferenceKey);
    if(!raw)return null;
    const parsed=JSON.parse(raw) as Partial<Preferences>;
    if((parsed.version!==undefined&&parsed.version!==consentVersion)||typeof parsed.performance!=="boolean")return null;
    return {version:consentVersion,essential:true,performance:parsed.performance,updatedAt:String(parsed.updatedAt??"")};
  }catch{return null;}
}

export function readPerformanceConsent(){
  return loadPreferences()?.performance===true;
}

function storePreferences(performance:boolean){
  const next:Preferences={version:consentVersion,essential:true,performance,updatedAt:new Date().toISOString()};
  window.localStorage.setItem(privacyPreferenceKey,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(privacyPreferenceEvent,{detail:next}));
}

export function PrivacyConsent(){
  const [ready,setReady]=useState(false);
  const [expanded,setExpanded]=useState(false),[error,setError]=useState("");
  const [open,setOpen]=useState(false);
  const [performance,setPerformance]=useState(false);

  useEffect(()=>{
    const existing=loadPreferences();
    queueMicrotask(()=>{
      if(existing)setPerformance(existing.performance);
      setOpen(!existing);
      setReady(true);
    });
    const reopen=()=>{setExpanded(true);const current=loadPreferences();setPerformance(current?.performance??false);setOpen(true);};
    window.addEventListener("binso:open-privacy-settings",reopen);
    return()=>window.removeEventListener("binso:open-privacy-settings",reopen);
  },[]);

  const save=(value:boolean)=>{try{storePreferences(value);setPerformance(value);setOpen(false);setError('');}catch{setError('Datenschutz-Einstellung konnte nicht gespeichert werden.');}};
  const dialogRef=useDialogFocus(ready&&open,()=>setOpen(false));
  if(!ready||!open)return null;

  return <div className="privacy-consent-layer">
    <section ref={dialogRef} className="privacy-consent-card" role="dialog" aria-modal="true" aria-labelledby="privacy-consent-title" tabIndex={-1}>
      <div className="privacy-consent-copy">
        <span className="eyebrow"><LocalizedText>{"DATENSCHUTZ"}</LocalizedText></span>
        <h2 id="privacy-consent-title"><LocalizedText>{"Datenschutz-Einstellungen"}</LocalizedText></h2>
        <p><LocalizedText>{"Notwendiger Speicher ermöglicht Anmeldung und Einstellungen. Die optionale Performance-Messung verbessert Ladezeiten. Keine Werbung oder Cross-Site-Tracking."}</LocalizedText></p>
        <Link href="/datenschutz" onClick={()=>setOpen(false)}><LocalizedText>{"Datenschutzerklärung"}</LocalizedText></Link>
      </div>
      {expanded&&<div className="privacy-consent-options">
        <div><span><b><LocalizedText>{"Technisch notwendig"}</LocalizedText></b><small><LocalizedText>{"Für Anmeldung, Sicherheit, Sitzungen und Einstellungen."}</LocalizedText></small></span><strong><LocalizedText>{"Immer aktiv"}</LocalizedText></strong></div>
        <div><span><b><LocalizedText>{"Performance"}</LocalizedText></b><small><LocalizedText>{"Optionale Messung von Ladezeit und Darstellungsstabilität."}</LocalizedText></small></span><Toggle label="Performance-Messung" checked={performance} onChange={()=>setPerformance(!performance)}/></div>
      </div>
      }
      {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
      <div className="privacy-consent-actions">
        <Button variant="secondary" onClick={()=>save(false)}><LocalizedText>{"Alle ablehnen"}</LocalizedText></Button>
        <Button variant="secondary" onClick={()=>expanded?save(performance):setExpanded(true)}><LocalizedText>{expanded?"Auswahl speichern":"Einstellungen"}</LocalizedText></Button>
        <Button variant="secondary" onClick={()=>save(true)}><LocalizedText>{"Alle akzeptieren"}</LocalizedText></Button>
      </div>
    </section>
  </div>;
}

export function PrivacySettingsPage(){
  const [performance,setPerformance]=useState(false);
  const [saved,setSaved]=useState(false),[saveError,setSaveError]=useState("");

  useEffect(()=>{
    queueMicrotask(()=>setPerformance(loadPreferences()?.performance??false));
  },[]);

  const save=(value:boolean)=>{
    try{storePreferences(value);}catch{setSaveError("Datenschutz-Einstellung konnte nicht gespeichert werden.");return;}
    setSaveError("");setPerformance(value);
    setSaved(true);
    window.setTimeout(()=>setSaved(false),2200);
  };

  return <AppShell title="Datenschutz" active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
    <SettingsGroup title="Technisch notwendig"><ListRow information title="Sicherheit" meta="" value={<LocalizedText>{"Immer aktiv"}</LocalizedText>}/></SettingsGroup>
    <SettingsGroup title="Optional"><ListRow information title="Performance-Messung" meta="" value={<Toggle label="Performance-Messung" checked={performance} onChange={()=>save(!performance)}/>}/>
      <details className="bo-data-disclosure"><summary><LocalizedText>{"Datenhinweise"}</LocalizedText></summary><p className="settings-note"><LocalizedText>{"Optional werden technische Kennzahlen wie Ladezeit und Darstellungsstabilität sowie eine gekürzte Route erfasst. Keine Werbung und kein Cross-Site-Tracking."}</LocalizedText></p></details>
      {saveError&&<ErrorState><LocalizedText>{saveError}</LocalizedText></ErrorState>}
      {saved&&<p className="settings-note" role="status"><LocalizedText>{"Datenschutz-Einstellung gespeichert."}</LocalizedText></p>}
    </SettingsGroup>
    <SettingsGroup title="Rechtliches"><ActionRow href="/einstellungen/rechtliches/datenschutz" icon="file" title="Datenschutzerklärung"/><ActionRow href="/einstellungen/rechtliches/unterauftragsbearbeiter" icon="users" title="Unterauftragsbearbeiter"/></SettingsGroup>
  </AppShell>;
}
