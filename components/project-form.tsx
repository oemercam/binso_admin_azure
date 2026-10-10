"use client";
import {useEffect,useRef,useState} from 'react';
import {useSearchParams,useRouter} from 'next/navigation';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {useDirtySnapshot} from './use-dirty-snapshot';
import {AppShell} from './app-shell';
import {Button,Field,Input,Select,ErrorState,LoadingState} from './ui';
import {FormSheet} from './binso-ux';
import {FormWizard} from './form-wizard';
import {allowDraftNavigation} from './use-browser-back-guard';
import {useProcessDraft} from './use-process-draft';

export function ProjectForm(){
 const params=useSearchParams(),router=useRouter(),busy=useRef(false);
 const [name,setName]=useState(''),[customerId,setCustomerId]=useState(params.get('customerId')??'');
 const [error,setError]=useState<string|null>(null),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false);
 const sourceOffer=params.get('sourceOffer');
 const [open,setOpen]=useState(false);
 useEffect(()=>{queueMicrotask(()=>setOpen(true))},[]);
 const returnTo=sourceOffer?'/angebote/'+encodeURIComponent(sourceOffer):'/zeit';
 const [replay,setReplay]=useState<{body:string;key:string}|null>(null);
 const close=()=>{recovery.clear();allowDraftNavigation();setOpen(false);router.replace(returnTo)};
 const directory=useApiQuery<{items:Array<{id:string;name:string}>}>('/api/customers');
 const source=useApiQuery<{item:{title?:string;customer_id:string}}> (sourceOffer?'/api/documents/'+encodeURIComponent(sourceOffer):null);
 const initializedSource=useRef<string|null>(null);
 const {dirty,markPristine}=useDirtySnapshot([name,customerId]);
 useEffect(()=>{
  if(!sourceOffer||!source.data||initializedSource.current===sourceOffer)return;
  initializedSource.current=sourceOffer;
  const initialName=source.data.item.title??'',initialCustomer=source.data.item.customer_id;
  queueMicrotask(()=>{setName(initialName);setCustomerId(initialCustomer);markPristine([initialName,initialCustomer])});
 },[sourceOffer,source.data,markPristine]);
 const loading=directory.loading||source.loading;
 const loadError=directory.error||source.error;
 const recovery=useProcessDraft({process:'project:create:'+(sourceOffer??'internal'),value:{name,customerId,replay},dirty,enabled:!loading&&!loadError,onRestore:value=>{
  if(!value||typeof value.name!=='string'||value.name.length>200||typeof value.customerId!=='string')return;
  if(sourceOffer&&value.customerId!==source.data?.item.customer_id)return;
  if(value.customerId&&!directory.data?.items.some(item=>item.id===value.customerId))return;
  setName(value.name);setCustomerId(value.customerId);
  if(value.replay&&typeof value.replay.body==='string'&&value.replay.body.length<1000&&typeof value.replay.key==='string'&&value.replay.key.length>=8&&value.replay.key.length<=128)setReplay(value.replay);
 }});
 const save=async()=>{
  if(busy.current||!recovery.ready||loading||loadError||sourceOffer&&initializedSource.current!==sourceOffer)return;
  if(name.trim().length<2){setError('Bitte eine Bezeichnung mit mindestens zwei Zeichen erfassen.');return;}
  setError(null);busy.current=true;setSaving(true);
  try{const body={name:name.trim(),customerId,sourceOffer},serialized=JSON.stringify(body);const attempt=replay?.body===serialized?replay:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);recovery.persist({name,customerId,replay:attempt});const result=await apiPost<{item?:{id:string}}>('/api/projects',body,{idempotencyKey:attempt.key});if(typeof result.item?.id!=='string'||!result.item.id)throw new Error('Die Projektanlage konnte nicht bestätigt werden. Bitte den gespeicherten Stand prüfen.');setSaved(true);recovery.clear();allowDraftNavigation();router.push('/zeit?projectId='+encodeURIComponent(result.item.id));}
  catch(e){setError(e instanceof Error?e.message:'Projekt konnte nicht erstellt werden.');}
  finally{busy.current=false;setSaving(false)}
 };
 return <AppShell title="Zeiterfassung" active="zeit" editing unsavedChanges={false}>
  <FormSheet label="Auftrag / Projekt starten" description="Beginne mit der Bezeichnung. Ein Kunde ist nur für kundenbezogene Arbeit nötig." open={open} onClose={close} busy={saving} dirty={dirty&&!saved} wizard>
   {loading?<LoadingState>Projektdaten werden geladen …</LoadingState>:loadError?<ErrorState onRetry={()=>{directory.refresh();source.refresh()}}>{loadError}</ErrorState>:<form onSubmit={event=>{event.preventDefault();void save()}}>
    <FormWizard labels={["Grunddaten"]} step={0} onStep={()=>{}} busy={saving} ariaLabel="Projekt erfassen" cancelAction={<Button variant="secondary" onClick={close}>Abbrechen</Button>} action={<Button requiresWrite type="submit" disabled={saving||!recovery.ready||name.trim().length<2}>{saving?'Wird erstellt…':'Auftrag starten'}</Button>}>
     {error&&<ErrorState>{error}</ErrorState>}
     <div className="form-grid">
     <Field label="Bezeichnung *"><Input required minLength={2} maxLength={200} autoComplete="off" value={name} disabled={saving} onChange={e=>setName(e.target.value)} placeholder="z. B. Cloud Migration"/></Field>
     <Field label="Kunde"><Select disabled={!!sourceOffer||saving} value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Intern</option>{directory.data?.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
     </div>
     {sourceOffer&&<p>Ursprungsangebot: {sourceOffer}</p>}
     <p>* Pflichtfeld</p>
    </FormWizard>
   </form>}
  </FormSheet>
 </AppShell>;
}
