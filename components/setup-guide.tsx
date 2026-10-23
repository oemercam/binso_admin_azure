"use client";
import Link from 'next/link';
import {useRef,useState} from 'react';
import type {SetupGuide} from '@/lib/action-readiness';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch} from '@/lib/client/backend';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText} from '@/lib/client/locale';
import {ListRow,SettingsGroup} from './binso-ux';
import {LoadingState,ErrorState,Toggle,ProgressBar} from './ui';
export function SetupGuideView({item}:{item:SetupGuide}){
 const next=item.tasks.find(task=>task.importance==='required'&&!task.complete);
 if(item.dismissed||item.requiredComplete>=item.requiredTotal||!next)return null;
 return <Link href={next.href} className="bo-setup-card"><div className="bo-setup-card-head"><h2><LocalizedText>{'Einrichtung abschliessen'}</LocalizedText></h2><span>{item.requiredComplete}{' '}<LocalizedText>{'von'}</LocalizedText>{' '}{item.requiredTotal}</span></div><ProgressBar value={item.requiredComplete} max={item.requiredTotal} label="Pflichtangaben"/><div className="bo-setup-card-next"><span><LocalizedText>{next.title}</LocalizedText></span><span><LocalizedText>{'Fortsetzen'}</LocalizedText>{' ›'}</span></div></Link>;
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
 return <SettingsGroup title="Einrichtung"><ListRow information title="Einrichtungshilfe anzeigen" meta="Persönliche Anzeige auf der Übersicht" value={<Toggle label="Einrichtungshilfe anzeigen" checked={!dismissed} busy={busy} disabled={!item.editable} onChange={()=>void change()}/>}/>{error&&<ErrorState>{error}</ErrorState>}</SettingsGroup>;
}
