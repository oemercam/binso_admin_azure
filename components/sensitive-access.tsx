"use client";
import {useEffect,useRef,useState} from 'react';
import {apiPatch} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText} from '@/lib/client/locale';
import type {SensitiveCapability} from '@/lib/sensitive-access';
import {Button,ErrorState,FormActions,LoadingState,Toggle} from './ui';
import {FormSheet} from './binso-ux';

const labels:Record<SensitiveCapability,string>={
 'hr_sensitive:read':'Sensible Personaldaten lesen','hr_sensitive:write':'Sensible Personaldaten bearbeiten',
 'family:read':'Familiendaten lesen','family:write':'Familiendaten bearbeiten',
 'payroll:read':'Lohndaten lesen','payroll:write':'Lohnvorbereitung bearbeiten','payroll:review':'Lohnläufe prüfen und freigeben','payroll:payment':'Lohnzahlungen bestätigen'
};
type Access={item:{user_id:string;role:string;status:string;module_profile:string;sensitive_grants:SensitiveCapability[];sensitive_grants_version:number};available:SensitiveCapability[]};
export function SensitiveAccess({userId,onClose}:{userId:string;onClose:()=>void}){
 const endpoint='/api/settings/team/members/'+encodeURIComponent(userId)+'/sensitive-access',query=useApiQuery<Access>(endpoint);
 const [grants,setGrants]=useState<SensitiveCapability[]>([]),[original,setOriginal]=useState('[]'),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 useEffect(()=>{if(!query.data?.item)return;const item=query.data.item;queueMicrotask(()=>{setGrants(item.sensitive_grants);setOriginal(JSON.stringify([...item.sensitive_grants].sort()));setRevision(item.sensitive_grants_version);});},[query.data]);
 const save=async()=>{
  if(pending.current||!query.data)return;pending.current=true;setBusy(true);setError('');
  try{
   const body={grants:[...grants].sort(),expectedRevision:revision},serialized=JSON.stringify(body);
   if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const result=await apiPatch<{item:{sensitive_grants_version:number}}>(endpoint,body,undefined,{idempotencyKey:attempt.current.key});
   if(!result.item?.sensitive_grants_version)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');
   onClose();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <FormSheet open onClose={onClose} label="Sensible Fachrechte" busy={busy} dirty={JSON.stringify([...grants].sort())!==original}>
  <p><LocalizedText>{'Diese Rechte werden ausdrücklich vergeben und gelten zusätzlich zur Mandanten- und Modulprüfung. Eigene Lohnabrechnungen werden getrennt geprüft.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:query.data?.item.status!=='active'||query.data.item.module_profile!=='standard'?<p><LocalizedText>{'Fachrechte können nur für aktive Standardzugänge vergeben werden.'}</LocalizedText></p>:<div className="settings-choice-list">{query.data.available.map(capability=><Toggle key={capability} label={labels[capability]} checked={grants.includes(capability)} disabled={busy} onChange={()=>setGrants(current=>current.includes(capability)?current.filter(item=>item!==capability):[...current,capability])}/>)}</div>}
  {error&&<ErrorState>{error}</ErrorState>}
  <FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite disabled={busy||JSON.stringify([...grants].sort())===original||query.loading||!!query.error||!revision||query.data?.item.status!=='active'||query.data.item.module_profile!=='standard'} onClick={()=>void save()}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
 </FormSheet>;
}
