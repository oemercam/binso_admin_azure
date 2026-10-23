"use client";
import {useId,useRef,useState} from 'react';
import {apiPatch} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText} from '@/lib/client/locale';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle} from './ui';

type Bank={id:string;iban:string|null;revision:string};
export function SupplierBank({supplierId,mayWrite,onSaved}:{supplierId:string;mayWrite:boolean;onSaved:()=>void}){
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/bank',query=useApiQuery<{item:Bank}>(endpoint),formId=useId();
 const [open,setOpen]=useState(false),[iban,setIban]=useState(''),[revision,setRevision]=useState(''),[original,setOriginal]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const edit=()=>{if(!query.data?.item)return;setIban(query.data.item.iban??'');setOriginal(query.data.item.iban??'');setRevision(query.data.item.revision);setError('');attempt.current=null;setOpen(true);};
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   const body={iban,expectedRevision:revision},serialized=JSON.stringify(body);
   if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const result=await apiPatch<{item:Bank}>(endpoint,body,undefined,{idempotencyKey:attempt.current.key});
   if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');
   setOpen(false);query.refresh();onSaved();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <section className="surface">
  <SectionTitle title="Bankverbindung" action={mayWrite&&query.data?.item?<ActionsMenu label="Bankverbindung"><ActionRow requiresWrite icon="edit" title="Bankverbindung bearbeiten" onClick={edit}/></ActionsMenu>:undefined}/>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:query.data?.item.iban?<p>{'•••• '+query.data.item.iban.slice(-4)}</p>:<EmptyState title="Keine Bankverbindung"/>}
  <FormSheet open={open} onClose={()=>setOpen(false)} label="Bankverbindung bearbeiten" dirty={iban!==original} busy={busy}>
   <form id={formId} onSubmit={event=>{event.preventDefault();void save();}}><Field label="IBAN" hint="Schweiz oder Liechtenstein. Leer lassen, um die Bankverbindung zu entfernen."><Input value={iban} maxLength={50} autoComplete="off" onChange={event=>setIban(event.target.value)}/></Field></form>
   <p><LocalizedText>{'Die Änderung benötigt eine Sicherheitsbestätigung. Es wird keine Zahlung ausgelöst.'}</LocalizedText></p>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
  </FormSheet>
 </section>;
}
