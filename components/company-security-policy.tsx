'use client';
import {useRef,useState} from 'react';
import {usePageAccess} from '@/lib/client/page-access';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch} from '@/lib/client/backend';
import {LocalizedText} from '@/lib/client/locale';
import {ActionRow,FormSheet,SettingsGroup} from './binso-ux';
import {Button,ErrorState,Field,FormActions,Input,LoadingState} from './ui';
export function CompanySecurityPolicy(){
 const access=usePageAccess(),canManage=access.hasPermission?.('users:manage')===true;
 const query=useApiQuery<{item:{required:boolean}}>(canManage?'/api/settings/security':null);
 const [open,setOpen]=useState(false),[required,setRequired]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false);
 async function save(){if(pending.current)return;pending.current=true;setBusy(true);setError('');try{await apiPatch('/api/settings/security',{required});setOpen(false);query.refresh();}catch(error){setError(error instanceof Error?error.message:'Sicherheitsregel konnte nicht gespeichert werden.')}finally{pending.current=false;setBusy(false)}}
 if(!canManage)return null;
 return <><SettingsGroup title="Unternehmenssicherheit">{query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?<LoadingState/>:<ActionRow icon="lock" title="Authenticator-Pflicht" metadata={query.data.item.required?'Verpflichtend':'Optional'} onClick={()=>{setRequired(query.data!.item.required);setError('');setOpen(true)}}/>}</SettingsGroup>
  <FormSheet open={open} busy={busy} label="Authenticator-Pflicht" onClose={()=>setOpen(false)} dirty={!!query.data&&required!==query.data.item.required}><Field label="Für alle Unternehmenskonten verpflichtend"><Input type="checkbox" checked={required} onChange={event=>setRequired(event.target.checked)}/></Field><p><LocalizedText>Die Regel gilt für alle Mitarbeiter und Administratoren. Ohne eingerichteten Authenticator bleibt nur der Sicherheitsbereich zugänglich.</LocalizedText></p>{error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>Abbrechen</LocalizedText></Button><Button disabled={busy||!query.data||required===query.data.item.required} onClick={()=>void save()}><LocalizedText>Speichern</LocalizedText></Button></FormActions></FormSheet>
 </>;
}
