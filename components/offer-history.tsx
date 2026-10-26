'use client';
import {useRef,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPost} from '@/lib/client/backend';
import {ActionRow,ActionsMenu,DetailDisclosure,FormSheet} from './binso-ux';
import {DocumentModal} from './pdf-preview';
import {Button,ErrorState,Field,FormActions,SectionTitle,Textarea} from './ui';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {formatDateTime} from '@/lib/display-format';
import {localeTags} from '@/lib/locales/config';
type Event={id:string;link_id:string;kind:string;body:string;actor:string;created_at:string;version:number;recipient:string;revoked_at:string|null};
type History={versions:Array<{version:number;created_at:string}>;events:Event[];deliveries:Array<{id:string;recipient:string;status:string;created_at:string;version:number|null}>};
import {offerActivityLabel,deliveryLabel} from "@/lib/offer-activity";
export function OfferHistory({number,canWrite}:{number:string;canWrite:boolean}){
 const {locale}=useLocale(),t=useTranslation();
 const path='/api/documents/'+encodeURIComponent(number)+'/versions',query=useApiQuery<History>(path);
 const [reply,setReply]=useState<Event|null>(null),[text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const pending=useRef(false),key=useRef('');
 const requested=Number(useSearchParams().get("historyVersion"));
 const [preview,setPreview]=useState<number|null|undefined>(undefined);
 const submit=async(action:'reply'|'revoke',event:Event)=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   const result=await apiPost<{notification:string}>(path,{action,linkId:event.link_id,message:text,requestKey:action==='reply'?key.current:crypto.randomUUID()});
   setReply(null);setText('');setNotice(action==='revoke'?'Link widerrufen.':result.notification==='provider_accepted'?'Antwort gespeichert; Benachrichtigung vom Anbieter angenommen.':'Antwort gespeichert. Eine erneute Zustellung wurde nicht bestätigt.');query.refresh();
  }catch(reason){setError(reason instanceof Error?reason.message:'Aktion fehlgeschlagen.');}
  finally{pending.current=false;setBusy(false);}
 };
 if(query.loading)return null;
 if(query.error)return <ErrorState onRetry={query.refresh}>{query.error}</ErrorState>;
 const data=query.data;if(!data||!data.versions.length&&!data.deliveries.length)return null;
 const activePreview=preview===undefined?(Number.isSafeInteger(requested)&&data.versions.some(item=>item.version===requested)?requested:null):preview;
 return <><DetailDisclosure label="Versionen und Verlauf">
  {error&&<ErrorState>{error}</ErrorState>}{notice&&<p role="status"><LocalizedText>{notice}</LocalizedText></p>}
  <SectionTitle title="Unveränderliche PDFs"/>{data.versions.map(version=><ActionRow key={version.version} icon="file" title={t('Version')+' '+version.version} metadata={formatDateTime(version.created_at,localeTags[locale])} onClick={()=>setPreview(version.version)}/>)}
  {data.deliveries.length>0&&<><SectionTitle title="Versand"/>{data.deliveries.map(delivery=><p key={delivery.id}>{delivery.recipient} · <LocalizedText>{deliveryLabel(delivery.status)}</LocalizedText> · {formatDateTime(delivery.created_at,localeTags[locale])}</p>)}<p className="technical-hint"><LocalizedText>{'Die Annahme durch den Anbieter ist kein Zustell- oder Lesenachweis.'}</LocalizedText></p></>}
  {data.events.length>0&&<><SectionTitle title="Reaktionen"/>{data.events.map(event=><article key={event.id} className="offer-history-event"><div><strong><LocalizedText>{offerActivityLabel(event.kind)}</LocalizedText></strong><small><LocalizedText>Version</LocalizedText> {event.version} · {event.recipient} · {formatDateTime(event.created_at,localeTags[locale])}</small>{event.body&&<p>{event.body}</p>}</div>{canWrite&&!event.revoked_at&&['question','reply'].includes(event.kind)&&<ActionsMenu label="Nachrichtenaktionen"><ActionRow icon="chat" title="Antworten" onClick={()=>{setReply(event);setText('');setError('');key.current=crypto.randomUUID();}}/><ActionRow icon="close" title="Link widerrufen" onClick={()=>void submit('revoke',event)} disabled={busy}/></ActionsMenu>}</article>)}</>}
  <FormSheet open={!!reply} label="Zum Angebot antworten" busy={busy} onClose={()=>setReply(null)}><div className="sheet-body"><Field label="Antwort"><Textarea value={text} maxLength={4000} onChange={event=>{setText(event.target.value);key.current=crypto.randomUUID();}}/></Field>{error&&<ErrorState>{error}</ErrorState>}</div><FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setReply(null)}>Abbrechen</Button><Button disabled={busy||!text.trim()} onClick={()=>reply&&void submit('reply',reply)}>Antwort senden</Button></FormActions></FormSheet>
 </DetailDisclosure>{activePreview!==null&&<DocumentModal title={number+" · "+t('Version')+" "+activePreview} fileUrl={path+"?version="+activePreview} fileName={number+"-v"+activePreview} onClose={()=>setPreview(null)}/>}</>;
}
