"use client";
import {useEffect,useRef,useState} from 'react';
import {useSearchParams,useRouter} from 'next/navigation';
import {apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {useDirtySnapshot} from './use-dirty-snapshot';
import {AppShell} from './app-shell';
import {Button,Field,Input,Select,FormActions,ErrorState,LoadingState} from './ui';

export function ProjectForm(){
 const params=useSearchParams(),router=useRouter(),busy=useRef(false);
 const [name,setName]=useState(''),[customerId,setCustomerId]=useState(params.get('customerId')??'');
 const [error,setError]=useState<string|null>(null),[saving,setSaving]=useState(false),[saved,setSaved]=useState(false);
 const sourceOffer=params.get('sourceOffer');
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
 const save=async()=>{
  if(busy.current||loading||loadError||sourceOffer&&initializedSource.current!==sourceOffer)return;
  if(name.trim().length<2){setError('Bitte eine Bezeichnung mit mindestens zwei Zeichen erfassen.');return;}
  setError(null);busy.current=true;setSaving(true);
  try{const result=await apiPost<{item:{id:string}}>('/api/projects',{name:name.trim(),customerId,sourceOffer});setSaved(true);router.push('/zeit?projectId='+result.item.id);}
  catch(e){setError(e instanceof Error?e.message:'Projekt konnte nicht erstellt werden.');}
  finally{busy.current=false;setSaving(false)}
 };
 return <AppShell title="Auftrag / Projekt starten" active="zeit" editing unsavedChanges={dirty&&!saved} backHref={sourceOffer?'/angebote/'+encodeURIComponent(sourceOffer):'/zeit'}><div className="form-page narrow">
  {loading?<LoadingState>Projektdaten werden geladen …</LoadingState>:loadError?<ErrorState onRetry={()=>{directory.refresh();source.refresh()}}>{loadError}</ErrorState>:<>
   {error&&<ErrorState>{error}</ErrorState>}
   <Field label="Bezeichnung"><Input required minLength={2} maxLength={200} value={name} disabled={saving} onChange={e=>setName(e.target.value)} placeholder="z. B. Cloud Migration"/></Field>
   <Field label="Kunde"><Select disabled={!!sourceOffer||saving} value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Intern</option>{directory.data?.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
   {sourceOffer&&<p>Ursprungsangebot: {sourceOffer}</p>}
   <FormActions><Button requiresWrite disabled={saving||name.trim().length<2} onClick={()=>void save()}>{saving?'Wird erstellt…':'Auftrag starten'}</Button></FormActions>
  </>}
 </div></AppShell>;
}
