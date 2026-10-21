'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {apiPost,apiReadPost,ClientApiError} from '@/lib/client/backend';
import {LocalizedText} from '@/lib/client/locale';
import {isCustomerMergePreview,isCustomerMergeReceipt,isCustomerMergeCancellation,type CustomerMergePreview,type CustomerMergeReceipt} from '@/lib/customer-merge';
import {FormSheet,ListRow} from './binso-ux';
import {DirectorySelect} from './directory-select';
import {Button,Checkbox,Field,FormActions,ErrorState,Status} from './ui';

const changeLabel=(mode:string)=>mode==='fill'?'Wird ergänzt':'Wert der Dublette bleibt im Archiv';
type Intent={sourceId:string;targetId:string;revision:string;key:string};
export function CustomerMergeSheet({onClose}:{onClose:()=>void}){
 const router=useRouter(),[sourceId,setSource]=useState(''),[targetId,setTarget]=useState(''),[preview,setPreview]=useState<CustomerMergePreview|null>(null),[confirmed,setConfirmed]=useState(false),[intent,setIntent]=useState<Intent|null>(null),[retry,setRetry]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),generation=useRef(0);
 useEffect(()=>()=>{generation.current++},[]);
 const invalid=()=>new ClientApiError('Der Vorgang konnte nicht bestätigt werden. Bitte den Status prüfen.','invalid_response',502);
 const finish=(result:CustomerMergeReceipt)=>{onClose();router.push('/kunden/'+encodeURIComponent(result.item.id));};
 const resetIntent=()=>{setIntent(null);setPreview(null);setConfirmed(false);setRetry(false);};
 const run=async(work:(current:number)=>Promise<void>)=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');const current=generation.current;
  try{await work(current);}catch(failure){if(current===generation.current){setRetry(false);setError(failure instanceof Error?failure.message:'Der Vorgang konnte nicht bestätigt werden. Bitte den Status prüfen.');}}
  finally{pending.current=false;if(current===generation.current)setBusy(false);}
 };
 const review=()=>run(async current=>{
  const data=await apiReadPost<{item:unknown}>('/api/customers/merge',{action:'preview',sourceId,targetId});
  if(!isCustomerMergePreview(data?.item,sourceId,targetId))throw invalid();
  if(current===generation.current){setPreview(data.item);setConfirmed(false);}
 });
 const commit=()=>run(async current=>{
  if(!intent&&(!preview?.eligible||!confirmed))return;
  const next=intent??{sourceId,targetId,revision:preview!.revision,key:crypto.randomUUID()};setIntent(next);setRetry(false);
  const result=await apiPost<CustomerMergeReceipt>('/api/customers/merge',{action:'commit',sourceId:next.sourceId,targetId:next.targetId,revision:next.revision,confirmed:true},{idempotencyKey:next.key,validate:value=>{if(isCustomerMergeCancellation(value,next.sourceId,next.targetId))throw new ClientApiError('Dieser Vorgang wurde abgebrochen.','merge_cancelled',409);if(!isCustomerMergeReceipt(value,next.sourceId,next.targetId))throw invalid();}});
  if(current===generation.current)finish(result);
 });
 const status=()=>run(async current=>{
  if(!intent)return;const data=await apiReadPost<{state?:unknown;result?:unknown}>('/api/customers/merge',{action:'status',key:intent.key});if(current!==generation.current)return;
  if(data?.state==='completed'&&isCustomerMergeReceipt(data.result,intent.sourceId,intent.targetId)){finish(data.result);return;}
  if(data?.state==='cancelled'&&isCustomerMergeCancellation(data.result,intent.sourceId,intent.targetId)){resetIntent();setError('Dieser Vorgang wurde abgebrochen.');return;}
  if(data?.state==='not_recorded'){setRetry(true);setError('Noch kein gespeichertes Ergebnis. Eine erneute Bestätigung verwendet denselben Vorgang.');return;}
  if(data?.state==='pending'){setRetry(false);setError('Der Vorgang läuft noch. Bitte den Status später erneut prüfen.');return;}
  throw invalid();
 });
 const close=()=>{
  if(pending.current)return;if(!intent){onClose();return;}
  void run(async current=>{
   const result=await apiPost<unknown>('/api/customers/merge',{action:'cancel',sourceId:intent.sourceId,targetId:intent.targetId,revision:intent.revision},{idempotencyKey:intent.key,validate:value=>{if(!isCustomerMergeReceipt(value,intent.sourceId,intent.targetId)&&!isCustomerMergeCancellation(value,intent.sourceId,intent.targetId))throw invalid();}});
   if(current!==generation.current)return;if(isCustomerMergeReceipt(result,intent.sourceId,intent.targetId))finish(result);else onClose();
  });
 };
 const choose=(which:'source'|'target',value:string)=>{if(pending.current||intent)return;if(which==='source')setSource(value);else setTarget(value);setPreview(null);setConfirmed(false);setError('');};
 return <FormSheet label="Kundendubletten zusammenführen" description="Nur noch nicht geschäftlich verwendete Dubletten. Bestehende Zieldaten bleiben erhalten; fehlende Angaben werden ergänzt." open onClose={close} busy={busy} dirty={!!sourceId||!!targetId}>
  <Field label="Dublette"><DirectorySelect endpoint="/api/customers" value={sourceId} onChange={value=>choose('source',value)} label="Dublette" required disabled={busy||!!intent} selectedLabel={preview?.source.name}/></Field>
  <Field label="Zielkunde"><DirectorySelect endpoint="/api/customers" value={targetId} onChange={value=>choose('target',value)} label="Zielkunde" required disabled={busy||!!intent} selectedLabel={preview?.target.name}/></Field>
  {preview&&<>
   <dl className="detail-list"><div><dt><LocalizedText>Kontakte übernehmen</LocalizedText></dt><dd>{preview.contactsToMove}</dd></div><div><dt><LocalizedText>Aktivitäten übernehmen</LocalizedText></dt><dd>{preview.activitiesToMove}</dd></div></dl>
   {preview.changes.filter(change=>change.sourceValue&&change.mode!=='same').map(change=><ListRow key={change.field} title={change.label} meta={<><LocalizedText>{changeLabel(change.mode)}</LocalizedText>{change.mode==='keep'?' · '+change.sourceValue:''}</>} value={change.mode==='fill'?change.sourceValue:change.targetValue}/>)}
   {preview.eligible?<><Status tone="info">Keine geschützten Verknüpfungen gefunden</Status><p><LocalizedText>Kontakte und Aktivitäten werden übernommen. Die Dublette bleibt mit ihren ursprünglichen Angaben im Archiv und kann nicht einzeln wiederhergestellt werden. Geschäftliche Belege und Berechtigungen werden nicht verschoben.</LocalizedText></p><Field label="Ich bestätige, dass beide Datensätze denselben Kunden betreffen."><Checkbox checked={confirmed} disabled={busy||!!intent} onChange={event=>setConfirmed(event.target.checked)}/></Field></>:<ErrorState><LocalizedText>Diese Dublette kann nicht direkt zusammengeführt werden.</LocalizedText> {preview.blockers.map((blocker,index)=><span key={index}>{index?' · ':''}<LocalizedText>{blocker}</LocalizedText></span>)}</ErrorState>}
  </>}
  {error&&<ErrorState>{error}</ErrorState>}
  {intent&&<p><LocalizedText>Bei unklarer Antwort zuerst den Status prüfen. Abbrechen setzt keinen abgeschlossenen Vorgang zurück.</LocalizedText></p>}
  <FormActions sheet><Button data-sheet-dismiss variant="secondary" disabled={busy}><LocalizedText>Abbrechen</LocalizedText></Button>{intent?<Button disabled={busy} onClick={()=>void (retry?commit():status())}><LocalizedText>{retry?'Erneut bestätigen':'Status prüfen'}</LocalizedText></Button>:preview?<Button disabled={busy||!preview.eligible||!confirmed} onClick={()=>void commit()}><LocalizedText>Zusammenführen</LocalizedText></Button>:<Button disabled={busy||!sourceId||!targetId||sourceId===targetId} onClick={()=>void review()}><LocalizedText>Vorschau prüfen</LocalizedText></Button>}</FormActions>
 </FormSheet>;
}
