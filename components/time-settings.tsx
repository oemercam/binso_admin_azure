"use client";
import {useEffect,useRef,useState} from 'react';
import {AppShell} from './app-shell';
import { Button, Field, Input, FormActions } from "./ui";
import {apiGet,apiPatch} from '@/lib/client/backend';
export function TimeSettingsPage(){
 const [required,setRequired]=useState(true),[initial,setInitial]=useState(true),[allowed,setAllowed]=useState(false),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState<string|null>(null),[saved,setSaved]=useState(false);
 const busy=useRef(false);
 useEffect(()=>{let active=true;Promise.all([apiGet<{tenant?:{role?:string;readOnly?:boolean};demo?:boolean}>('/api/auth/session'),apiGet<{time_approval_required:boolean}>('/api/time-entries/policy')]).then(([session,policy])=>{if(!active)return;if(typeof policy.time_approval_required!=="boolean")throw new Error("Freigabeeinstellung konnte nicht geladen werden.");setAllowed(!session.demo&&!session.tenant?.readOnly&&['owner','admin'].includes(session.tenant?.role??''));setRequired(policy.time_approval_required);setInitial(policy.time_approval_required)}).catch(e=>{if(active)setError(e instanceof Error?e.message:'Einstellung konnte nicht geladen werden.')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const save=async()=>{if(busy.current||!allowed||loading)return;busy.current=true;setSaving(true);setError(null);setSaved(false);try{const result=await apiPatch<{time_approval_required:boolean}>('/api/time-entries/policy',{required});setRequired(result.time_approval_required);setInitial(result.time_approval_required);setSaved(true)}catch(e){setError(e instanceof Error?e.message:'Einstellung konnte nicht gespeichert werden.')}finally{busy.current=false;setSaving(false)}};
 return <AppShell title="Zeiterfassung" active="einstellungen" backHref="/einstellungen" backLabel="Einstellungen" unsavedChanges={required!==initial}>
  <section className="settings-section"><h2>Freigabe neuer Zeiteinträge</h2><p>Legt fest, ob neue Zeiteinträge vor der Verrechnung freigegeben werden müssen. Bestehende Freigaben bleiben erhalten.</p>
   {loading?<p role="status">Einstellung wird geladen …</p>:<Field label="Freigabe erforderlich"><Input type="checkbox" checked={required} disabled={!allowed||saving} onChange={e=>{setRequired(e.target.checked);setSaved(false)}}/></Field>}
   {!loading&&!allowed&&!error&&<p>Nur Inhaber und Administratoren können diese Einstellung ändern.</p>}
   {error&&<p role="alert">{error}</p>}
   {saved&&<p role="status">Zeiterfassungseinstellung gespeichert.</p>}
  </section>
  {allowed&&<FormActions ><Button requiresWrite disabled={loading||saving||required===initial} onClick={()=>void save()}>{saving?'Wird gespeichert…':'Speichern'}</Button></FormActions>}
 </AppShell>
}
