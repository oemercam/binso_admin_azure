'use client';
import {useRef,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPost} from '@/lib/client/backend';
import {businessDate,formatDate} from '@/lib/financial-status';
import {localeTags} from '@/lib/locales/config';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {ActionRow,DetailDisclosure,FormSheet} from './binso-ux';
import {Button,Checkbox,DateInput,ErrorState,Field,FormActions,LoadingState} from './ui';
type History={eligible:boolean;currentVersion:number;items:Array<{id:string;due_date:string;version:number;state:'scheduled'|'notified'|'cancelled'|'skipped'}>};
const stateLabel={scheduled:'Geplant',notified:'In-App-Hinweis erstellt',cancelled:'Abgebrochen',skipped:'Nicht mehr erforderlich'};
const explanation='Persönlicher In-App-Hinweis beim Öffnen der Benachrichtigungen. Keine E-Mail und kein Hintergrundversand.';
export function OfferFollowup({number,open,onClose}:{number:string;open:boolean;onClose:()=>void}){
 const path='/api/documents/'+encodeURIComponent(number)+'/followups',query=useApiQuery<History>(path),{locale}=useLocale(),t=useTranslation(),data=query.data;
 return <>
  {data&&data.items.length>0&&<DetailDisclosure label="Erinnerung"><p><LocalizedText>{explanation}</LocalizedText></p>{data.items.map(item=><ActionRow key={item.id} icon="clock" title={t(stateLabel[item.state])} metadata={formatDate(item.due_date,localeTags[locale])+' · '+t('Version')+' '+item.version}/>)}</DetailDisclosure>}
  {open&&(data?<FollowupEditor number={number} path={path} data={data} onClose={onClose}/>:<FormSheet open label="Erinnerung planen" onClose={onClose}>{query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<LoadingState/>}</FormSheet>)}
  {!open&&query.error&&<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>}
 </>;
}
function FollowupEditor({number,path,data,onClose}:{number:string;path:string;data:History;onClose:()=>void}){
 const {locale}=useLocale(),current=data.items.find(item=>item.version===data.currentVersion),today=businessDate();
 const [date,setDate]=useState(current&&current.due_date>=today?current.due_date:today),[optIn,setOptIn]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false);
 const canSchedule=data.eligible&&(!current||['scheduled','cancelled'].includes(current.state));
 const submit=async(action:'schedule'|'cancel')=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{await apiPost(path,action==='schedule'?{action,dueDate:date,optIn}:{action},{validate:value=>{if(!value||typeof value!=='object'||!('ok' in value)||value.ok!==true)throw new Error('Die Speicherung konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.');}});onClose();}
  catch(reason){setError(reason instanceof Error?reason.message:'Aktion fehlgeschlagen.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <FormSheet open label={canSchedule?'Erinnerung planen':'Erinnerung'} busy={busy} onClose={onClose}><form onSubmit={event=>{event.preventDefault();void submit('schedule');}}><div className="sheet-body">
  <p><LocalizedText>{explanation}</LocalizedText></p>
  {canSchedule?<><Field label="Datum"><DateInput min={today} value={date} required onChange={event=>{setDate(event.target.value);setOptIn(false);}}/></Field>
   <p><LocalizedText>Angebot nachfassen</LocalizedText>: {number} · {formatDate(date,localeTags[locale])}</p>
   <Field label="Persönliche Erinnerung aktivieren"><Checkbox checked={optIn} onChange={event=>setOptIn(event.target.checked)} required/></Field></>:<p><LocalizedText>Für dieses Angebot ist keine Erinnerung möglich.</LocalizedText></p>}
  <p><LocalizedText>Nach einer Entscheidung, bei Ablauf oder Versionswechsel wird kein Hinweis erstellt. Deaktivierte Angebotsbenachrichtigungen werden berücksichtigt.</LocalizedText></p>
  {error&&<ErrorState>{error}</ErrorState>}
 </div><FormActions sheet><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Abbrechen</Button>{data.items.some(item=>item.state==='scheduled')&&<Button type="button" variant="secondary" disabled={busy} onClick={()=>void submit('cancel')}>Erinnerung entfernen</Button>}{canSchedule&&<Button type="submit" disabled={busy||!optIn||!date}>Speichern</Button>}</FormActions></form></FormSheet>;
}
