"use client";
import {LocalizedText} from "@/lib/client/locale";
import {useEffect,useRef,useState} from 'react';
import {AppShell} from './app-shell';
import {SettingsGroup} from './binso-ux';
import {Button, Toggle, FormActions, LoadingState, ErrorState} from "./ui";
import {apiGet,apiPatch} from '@/lib/client/backend';
export function TimeSettingsPage(){
 const [required,setRequired]=useState(true),[initial,setInitial]=useState(true),[allowed,setAllowed]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null),[saved,setSaved]=useState(false);
 const busy=useRef(false);
 useEffect(()=>{let active=true;Promise.all([apiGet<{tenant?:{role?:string;readOnly?:boolean};demo?:boolean}>('/api/auth/session'),apiGet<{time_approval_required:boolean}>('/api/time-entries/policy')]).then(([session,policy])=>{if(!active)return;if(typeof policy.time_approval_required!=="boolean")throw new Error("Freigabeeinstellung konnte nicht geladen werden.");setAllowed(!session.demo&&!session.tenant?.readOnly&&['owner','admin'].includes(session.tenant?.role??''));setRequired(policy.time_approval_required);setInitial(policy.time_approval_required)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Einstellung konnte nicht geladen werden.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const save=async()=>{if(busy.current||!allowed||loading)return;busy.current=true;setSaving(true);setError(null);setSaved(false);try{const result=await apiPatch<{time_approval_required:boolean}>('/api/time-entries/policy',{required});setRequired(result.time_approval_required);setInitial(result.time_approval_required);setSaved(true)}catch(e){setError(e instanceof Error?e.message:'Einstellung konnte nicht gespeichert werden.')}finally{busy.current=false;setSaving(false)}};
 return <AppShell title="Zeiterfassung" active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" unsavedChanges={required!==initial}>
  <SettingsGroup title="Freigaben"><div className="settings-group-fields">
   {loading?<LoadingState><LocalizedText>{"Einstellung wird geladen …"}</LocalizedText></LoadingState>:<div className="preference-channels"><label><b><LocalizedText>{"Freigabe erforderlich"}</LocalizedText></b><Toggle checked={required} disabled={!allowed||saving} label="Freigabe erforderlich" onChange={()=>{setRequired(!required);setSaved(false)}}/></label></div>}
   <p><LocalizedText>{"Neue Zeiten müssen vor der Verrechnung freigegeben werden. Bestehende Freigaben bleiben erhalten."}</LocalizedText></p>
   {!loading&&!allowed&&!error&&<p><LocalizedText>{"Nur Inhaber und Administratoren können diese Einstellung ändern."}</LocalizedText></p>}
   {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
   {saved&&<p role="status"><LocalizedText>{"Zeiterfassungseinstellung gespeichert."}</LocalizedText></p>}
  </div></SettingsGroup>
  {allowed&&<FormActions ><Button requiresWrite disabled={loading||saving||required===initial} onClick={()=>void save()}><LocalizedText>{saving?'Wird gespeichert…':'Speichern'}</LocalizedText></Button></FormActions>}
 </AppShell>
}
