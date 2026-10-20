"use client";
import {LocalizedText} from "@/lib/client/locale";
import {useEffect,useState} from 'react';
import {AppShell} from './app-shell';
import {SettingsGroup} from './binso-ux';
import {Status,LoadingState,ErrorState} from './ui';
import {apiGet} from '@/lib/client/backend';
export function TimeSettingsPage(){
 const [required,setRequired]=useState<boolean|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;void apiGet<{time_approval_required:boolean}>('/api/time-entries/policy').then(policy=>{if(typeof policy.time_approval_required!=='boolean')throw new Error('Freigabeeinstellung konnte nicht geladen werden.');if(active)setRequired(policy.time_approval_required)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Einstellung konnte nicht geladen werden.')});return()=>{active=false}},[]);
 return <AppShell title="Zeiterfassung" active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen">
  <SettingsGroup title="Freigaben"><div className="settings-group-fields">
   {error?<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>:required===null?<LoadingState/>:<>
    <Status tone="info"><LocalizedText>{required?'Unabhängige Freigabe':'Alleiniger Inhaber'}</LocalizedText></Status>
    <p><LocalizedText>{required?'Zeiten werden zuerst eingereicht und durch eine andere berechtigte Person freigegeben.':'Als alleiniger Inhaber kannst du eigene Zeiten ohne Fremdfreigabe verwenden. Monatsrapporte benötigen weiterhin den unterschriebenen Nachweis.'}</LocalizedText></p>
   </>}
  </div></SettingsGroup>
 </AppShell>;
}
