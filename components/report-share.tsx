"use client";
import {useRef,useState} from 'react';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatDateTime} from '@/lib/display-format';
import {FormSheet,ListRow} from './binso-ux';
import {Button,Field,Input,Select,FormActions,ErrorState,LoadingState} from './ui';
import ConfirmDialog from './confirm-dialog';
type Share={id:string;recipient:string;expiresAt:string;revokedAt:string|null;active:boolean;url?:string};
export function ReportShareSheet({id,onClose}:{id:string;onClose:()=>void}){
 const {locale}=useLocale(),[recipient,setRecipient]=useState(''),[days,setDays]=useState('1'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[created,setCreated]=useState<Share|null>(null),[revoke,setRevoke]=useState<string|null>(null),[copied,setCopied]=useState(false),[dirty,setDirty]=useState(false);
 const key=useRef(crypto.randomUUID()),pending=useRef(false),resource=useApiQuery<{items:Share[]}>('/api/reports/exports/'+id+'/share');
 const change=()=>{key.current=crypto.randomUUID();setCreated(null);setCopied(false);setDirty(true);setError('');};
 const copy=async()=>{try{if(!created?.url||!navigator.clipboard)throw Error('Clipboard unavailable');await navigator.clipboard.writeText(created.url);setCopied(true);}catch{setError('Link konnte nicht kopiert werden.');}};
 const create=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{const {item}=await apiPost<{item:Share}>('/api/reports/exports/'+id+'/share',{action:'create',recipient,days:Number(days)},{idempotencyKey:key.current});
   if(typeof item.url!=='string')throw Error('Freigabelink konnte nicht erstellt werden.');const url=new URL(item.url);if(url.pathname!=='/bericht'||url.username||url.password||url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))||!/^#[A-Za-z0-9_-]{43}$/.test(url.hash))throw Error('Freigabelink konnte nicht erstellt werden.');
   setCreated(item);setDirty(false);resource.refresh();
  }catch(issue){setError(issue instanceof Error?issue.message:'Freigabelink konnte nicht erstellt werden.');}finally{pending.current=false;setBusy(false)}
 };
 const revokeLink=async()=>{
  if(pending.current||!revoke)return;pending.current=true;setBusy(true);setError('');
  try{await apiPost('/api/reports/exports/'+id+'/share',{action:'revoke',linkId:revoke});if(created?.id===revoke){setCreated(null);setCopied(false);key.current=crypto.randomUUID();}setRevoke(null);resource.refresh();}catch(issue){setError(issue instanceof Error?issue.message:'Freigabelink konnte nicht widerrufen werden.');}finally{pending.current=false;setBusy(false)}
 };
 return <><FormSheet label="Bericht freigeben" open busy={busy} dirty={dirty} onClose={onClose}><form onSubmit={event=>{event.preventDefault();void create();}}><div className="sheet-body">
  <Field label="Empfänger"><Input required type="email" autoComplete="email" maxLength={254} disabled={busy} value={recipient} onChange={event=>{change();setRecipient(event.target.value)}}/></Field>
  <Field label="Gültigkeit"><Select disabled={busy} value={days} onChange={event=>{change();setDays(event.target.value)}}><option value="1"><LocalizedText>1 Tag</LocalizedText></option><option value="7"><LocalizedText>7 Tage</LocalizedText></option></Select></Field>
  <p><LocalizedText>Der Link gibt den Bericht erst nach einem Code an den festgelegten Empfänger frei. Die Laufzeit endet spätestens mit der Berichtsvorschau. Es wird keine E-Mail automatisch versendet.</LocalizedText></p>
  {created?.url&&<><Field label="Freigabelink"><Input readOnly value={created.url}/></Field><Button variant="secondary" disabled={busy} onClick={()=>void copy()}>Link kopieren</Button>{copied&&<p role="status"><LocalizedText>Link kopiert</LocalizedText></p>}</>}
  {error&&<ErrorState>{error}</ErrorState>}
  {resource.error?<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>:resource.loading?<LoadingState/>:resource.data?.items.map(link=><section key={link.id}><ListRow title={link.recipient} translateTitle={false} meta={formatDateTime(link.expiresAt,localeTags[locale])} status={link.revokedAt?'Widerrufen':link.active?'Aktiv':'Abgelaufen'} tone="neutral"/>{link.active&&<Button variant="secondary" disabled={busy} onClick={()=>setRevoke(link.id)}>Widerrufen</Button>}</section>)}
  <p><LocalizedText>Widerruf verhindert weitere Abrufe. Bereits gespeicherte Dateien können nicht zurückgerufen werden.</LocalizedText></p>
 </div><FormActions><Button variant="secondary" disabled={busy} data-sheet-dismiss="true">Schliessen</Button><Button type="submit" disabled={busy||!recipient||!!created}>Link erstellen</Button></FormActions></form></FormSheet>
 <ConfirmDialog open={!!revoke} busy={busy} title="Freigabe widerrufen?" message="Der Empfänger kann diesen Link anschliessend nicht mehr verwenden." confirmLabel="Widerrufen" onCancel={()=>setRevoke(null)} onConfirm={()=>void revokeLink()}/></>;
}
