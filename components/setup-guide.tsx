"use client";
import {useRef,useState} from 'react';
import Link from 'next/link';
import type {SetupGuide} from '@/lib/action-readiness';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch} from '@/lib/client/backend';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText} from '@/lib/client/locale';
import {ListRow,SettingsGroup} from './binso-ux';
import {SectionTitle,LoadingState,ErrorState,Toggle} from './ui';
export function SetupGuideView({item}:{item:SetupGuide}){
 if(item.dismissed||item.tasks.every(task=>task.complete))return null;
 return <section className="bo-workspace-section"><SectionTitle title="Einrichtung abschliessen" action={<Link href="/einstellungen"><LocalizedText>{"Einstellungen"}</LocalizedText></Link>}/><p><LocalizedText>{"Für das Ausstellen von Rechnungen. Entwürfe sind auch vorher möglich."}</LocalizedText></p><p><LocalizedText>{"Pflichtangaben"}</LocalizedText>: {item.requiredComplete} / {item.requiredTotal}</p>{item.tasks.map(task=><ListRow key={task.id} href={task.href} title={task.title} meta={task.importance==='required'?'Pflicht':task.importance==='recommended'?'Empfohlen':'Optional'} status={task.complete?'Erledigt':'Offen'} tone={task.complete?'success':'neutral'}/>)}</section>;
}
export function SetupGuidePreference(){
 const {hasPermission}=usePageAccess();
 const eligible=hasPermission?.("organization:write")===true;
 const query=useApiQuery<{item:SetupGuide}>(eligible?'/api/settings/readiness':null);
 const [confirmed,setConfirmed]=useState<{source:SetupGuide;dismissed:boolean}|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 const pending=useRef(false),item=query.data?.item;
 if(!eligible)return null;
 if(query.loading)return <LoadingState/>;
 if(query.error)return <ErrorState onRetry={query.refresh}>{query.error}</ErrorState>;
 if(!item)return null;
 const dismissed=confirmed?.source===item?confirmed.dismissed:item.dismissed;
 const change=async()=>{
  if(pending.current||!item.editable)return;pending.current=true;setBusy(true);setError(null);
  try{const next=!dismissed;const response=await apiPatch<{item:{dismissed:boolean}}>('/api/settings/readiness',{dismissed:next},value=>{const result=value as {item?:{dismissed?:unknown}};if(result?.item?.dismissed!==next)throw new Error('Einstellung konnte nicht bestätigt werden.');});setConfirmed({source:item,dismissed:response.item.dismissed});}
  catch(reason){setError(reason instanceof Error?reason.message:'Einstellung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false)}
 };
 return <SettingsGroup title="Einrichtung"><ListRow title="Einrichtungshilfe anzeigen" meta="Persönliche Anzeige auf der Übersicht" value={<Toggle label="Einrichtungshilfe anzeigen" checked={!dismissed} busy={busy} disabled={!item.editable} onChange={()=>void change()}/>}/>{error&&<ErrorState>{error}</ErrorState>}</SettingsGroup>;
}
