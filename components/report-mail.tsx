"use client";
import {useRef,useState} from 'react';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatDateTime} from '@/lib/display-format';
import {FormSheet,ListRow} from './binso-ux';
import {Button,Field,Input,Textarea,FormActions,ErrorState,LoadingState} from './ui';
import {DocumentModal} from './pdf-preview';

type Outcome={id:string;status:'sending'|'accepted'|'failed'|'uncertain';providerAccepted:boolean;deliveryConfirmed:false};
const deliveryLabels:Record<string,string>={sending:'Versand läuft',accepted:'Vom Anbieter angenommen',failed:'Nicht versendet',uncertain:'Versand ungeklärt'};
const deliveryTone=(status:string)=>status==='failed'?'danger':status==='uncertain'?'warning':'info';
export function ReportMailSheet({id,blob,onClose}:{id:string;blob:Blob;onClose:()=>void}){
 const {locale}=useLocale(),translate=useTranslation(),[recipient,setRecipient]=useState(''),[subject,setSubject]=useState(()=>translate('Berichte')),[message,setMessage]=useState(()=>translate('Im Anhang findest du den angeforderten Bericht.'));
 const key=useRef(crypto.randomUUID()),pending=useRef(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[outcome,setOutcome]=useState<Outcome|null>(null),[preview,setPreview]=useState(false),[dirty,setDirty]=useState(false);
 const history=useApiQuery<{items:Array<{id:string;recipient:string;subject:string;status:string;created_at:string}>}>('/api/reports/exports/'+id+'/send');
 const frozen=busy||!!outcome&&outcome.status!=='failed';
 const accepted=outcome?.status==='accepted';
 const outcomeMessage=accepted?'Versand vom E-Mail-Anbieter angenommen. Zustellung noch nicht nachgewiesen.':outcome?.status==='failed'?'Der Bericht wurde nicht versendet. Bitte die E-Mail-Verbindung prüfen.':'Der Versand läuft oder ist ungeklärt. Bitte den Versandstatus prüfen, nicht erneut senden.';
 const change=()=>{setDirty(true);setError('');setOutcome(null);key.current=crypto.randomUUID();};
 const send=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   const result=await apiPost<Outcome>('/api/reports/exports/'+id+'/send',{recipient,subject,message},{idempotencyKey:key.current});
   if(!['sending','accepted','failed','uncertain'].includes(result.status)||result.providerAccepted!==(result.status==='accepted')||result.deliveryConfirmed!==false)throw Error('Versand konnte nicht bestätigt werden.');
   setOutcome(result);if(result.status==='accepted')setDirty(false);history.refresh();
  }catch(issue){setError(issue instanceof Error?issue.message:'Versand konnte nicht bestätigt werden.');}
  finally{pending.current=false;setBusy(false)}
 };
 return <><FormSheet label="Bericht senden" open busy={busy} dirty={dirty} onClose={onClose}><form onSubmit={event=>{event.preventDefault();void send();}}><div className="sheet-body">
  <Field label="Empfänger"><Input required type="email" autoComplete="email" maxLength={254} disabled={frozen} value={recipient} onChange={event=>{change();setRecipient(event.target.value)}}/></Field>
  <Field label="Betreff"><Input required maxLength={180} disabled={frozen} value={subject} onChange={event=>{change();setSubject(event.target.value)}}/></Field>
  <Field label="Begleittext"><Textarea required maxLength={4000} disabled={frozen} value={message} onChange={event=>{change();setMessage(event.target.value)}}/></Field>
  <Button variant="secondary" disabled={busy} onClick={()=>setPreview(true)}>PDF-Vorschau</Button>
  <p><LocalizedText>Genau diese Berichtsvorschau wird als PDF angehängt. Es wird kein automatischer Folgeversand aktiviert.</LocalizedText></p>
  {outcome&&<p role="status"><LocalizedText>{outcomeMessage}</LocalizedText></p>}
  {error&&<ErrorState>{error}</ErrorState>}
  {history.error?<ErrorState onRetry={history.refresh}>{history.error}</ErrorState>:history.loading?<LoadingState/>:history.data?.items.map(row=><ListRow key={row.id} title={row.recipient} translateTitle={false} meta={[row.subject,formatDateTime(row.created_at,localeTags[locale])].filter(Boolean).join(' · ')} status={deliveryLabels[row.status]??'Versand ungeklärt'} tone={deliveryTone(row.status)}/>)}
 </div><FormActions><Button variant="secondary" disabled={busy} data-sheet-dismiss="true">Schliessen</Button>{!accepted&&<Button type="submit" disabled={busy||!recipient||!subject.trim()||!message.trim()}><LocalizedText>{outcome?'Versandstatus prüfen':'Per E-Mail senden'}</LocalizedText></Button>}</FormActions></form></FormSheet>{preview&&<DocumentModal title="Berichte" fileBlob={blob} fileName="binso-report" onClose={()=>setPreview(false)}/>}</>;
}
