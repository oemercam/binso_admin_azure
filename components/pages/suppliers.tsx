"use client";
import {useEffect,useId,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {apiPatch,apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {safeAppPath} from '@/lib/navigation';
import {domainConfig} from '@/config/domain';
import {LocalizedText} from '@/lib/client/locale';
import {AppShell} from '../app-shell';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select} from '../ui';
import {FormPage,ActionRow,ActionsMenu,CreateAction} from '../binso-ux';
import {RecordRow,RecordsControls,RecordsView,useRecordsController} from '../records';
import {useRecordList} from './shared';
import {useDirtySnapshot} from '../use-dirty-snapshot';
import {useProcessDraft} from '../use-process-draft';
import {allowDraftNavigation} from '../use-browser-back-guard';
import {SupplierBank} from '../supplier-bank';
import {SupplierInvoices} from '../supplier-invoices';
import {ExternalResources} from '../external-resources';
import {tenantCan} from '@/lib/permissions';

export function SuppliersPage(){
 const columns:NonNullable<Parameters<typeof useRecordsController>[0]['columns']>=[{label:'Lieferant',index:0},{label:'Kontakt',index:1},{label:'Nr.',index:2},{label:'Status',index:4,status:true}],chips=['Alle','Aktiv','Inaktiv'];
 const data=useRecordList('suppliers',{placeholder:'Lieferanten suchen...',chips,columns,sortFields:{0:'name',1:'contact_name',2:'supplier_no',4:'status'},defaultOrder:'name.asc',filterValues:{Aktiv:{field:'status',value:'active'},Inaktiv:{field:'status',value:'inactive'}}});
 return <AppShell title="Lieferanten" active="lieferanten" actions={<RecordsControls controller={data.controller} placeholder="Lieferanten suchen..." chips={chips} columns={columns}><CreateAction href="/lieferanten/neu" label="Lieferant hinzufügen"/></RecordsControls>}>
  <RecordsView controller={data.controller} toolbarActions={false} showCount={false} remote pagination={data.pagination} loading={data.loading} error={data.error} items={data.rows} countLabel="Lieferanten" placeholder="Lieferanten suchen..." chips={chips} columns={columns} rowHref={row=>'/lieferanten/'+row[3]}>{row=><RecordRow href={'/lieferanten/'+row[3]} icon="building" title={row[0]} meta={[row[2],row[1]].filter(Boolean).join(' · ')} status={row[4]}/>}</RecordsView>
 </AppShell>;
}
type Draft={name:string;contactName:string;email:string;phone:string;address:string;uid:string;paymentDays:string;status:string};
const blank:Draft={name:'',contactName:'',email:'',phone:'',address:'',uid:'',paymentDays:String(domainConfig.defaultPaymentDays),status:'active'};
type Supplier={id:string;supplier_no:string;name:string;contact_name:string|null;email:string|null;phone:string|null;address:string|null;uid:string|null;payment_days:number;status:string;revision:string};
export function SupplierForm({supplierId}:{supplierId?:string}){
 const formId=useId();
 const session=useApiQuery<{tenant?:{role?:string;moduleProfile?:'standard'|'time_only'}}>(supplierId?'/api/auth/session':null);
 const role=session.data?.tenant?.role??'',profile=session.data?.tenant?.moduleProfile;
 const existing=!!supplierId,router=useRouter(),params=useSearchParams(),returnTo=safeAppPath(params.get('returnTo'),'/lieferanten');
 const endpoint='/api/suppliers'+(supplierId?'/'+encodeURIComponent(supplierId):'');
 const query=useApiQuery<{item:Supplier}>(existing?endpoint:null),[draft,setDraft]=useState<Draft>(blank),[revision,setRevision]=useState(''),[editing,setEditing]=useState(!existing),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),[attempt,setAttempt]=useState<{body:string;key:string}|null>(null);
 const values=Object.values(draft),{dirty,markPristine}=useDirtySnapshot(values);
 useEffect(()=>{
  if(!query.data?.item||editing)return;const item=query.data.item;
  const next={name:item.name,contactName:item.contact_name??'',email:item.email??'',phone:item.phone??'',address:item.address??'',uid:item.uid??'',paymentDays:String(item.payment_days),status:item.status};
  queueMicrotask(()=>{setDraft(next);setRevision(item.revision);markPristine(Object.values(next));});
 },[query.data,editing,markPristine]);
 const recovery=useProcessDraft<Draft&{replay?:{body:string;key:string}}>({process:'supplier:create',value:{...draft,replay:attempt??undefined},dirty,enabled:!existing,onRestore:value=>{
  if(!value||Object.keys(blank).some(key=>typeof value[key as keyof Draft]!=='string'||value[key as keyof Draft].length>500))return;
  setDraft(Object.fromEntries(Object.keys(blank).map(key=>[key,value[key as keyof Draft]])) as Draft);
  if(value.replay&&typeof value.replay.body==='string'&&value.replay.body.length<=8192&&typeof value.replay.key==='string'&&value.replay.key.length>=8&&value.replay.key.length<=128)setAttempt(value.replay);
 }});
 const field=(key:keyof Draft,value:string)=>setDraft(current=>({...current,[key]:value}));
 const close=()=>{if(existing){setEditing(false);setError('');}else{recovery.clear();allowDraftNavigation();router.push(returnTo);}};
 const save=async()=>{
  if(pending.current||existing&&(query.loading||query.error)||!existing&&!recovery.ready)return;
  pending.current=true;setBusy(true);setError('');
  try{
   const payload={...draft,paymentDays:Number(draft.paymentDays),...(existing?{expectedRevision:revision}:{})},serialized=JSON.stringify(payload);
   const replay=attempt?.body===serialized?attempt:{body:serialized,key:crypto.randomUUID()};setAttempt(replay);
   if(!existing)recovery.persist({...draft,replay});
   const result=existing?await apiPatch<{item:Supplier}>(endpoint,payload,undefined,{idempotencyKey:replay.key}):await apiPost<{item:Supplier}>(endpoint,payload,{idempotencyKey:replay.key});
   if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');
   recovery.clear();allowDraftNavigation();router.push(returnTo);
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 if(existing&&(query.loading||query.error||!query.data?.item))return <AppShell title="Lieferant" active="lieferanten" backHref={returnTo} backLabel="Lieferanten">{query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<EmptyState title="Lieferant wurde nicht gefunden."/>}</AppShell>;
 return <AppShell title={existing?draft.name:'Lieferant hinzufügen'} titleIsUserContent={existing} active="lieferanten" backHref={returnTo} backLabel="Lieferanten" editing={editing} actions={existing&&!editing?<ActionsMenu label="Lieferantenaktionen"><ActionRow requiresWrite icon="edit" title="Bearbeiten" onClick={()=>setEditing(true)}/><ActionRow href={'/vertraege?side=purchase&partyId='+encodeURIComponent(supplierId??'')+'&origin='+encodeURIComponent('/lieferanten/'+(supplierId??''))} icon="file" title="Verträge öffnen" navigation/></ActionsMenu>:undefined}>
  {!editing&&<section className="surface"><SectionTitle title="Stammdaten"/><dl className="detail-list">{[['Nr.',query.data?.item.supplier_no],['Kontakt',draft.contactName],['E-Mail',draft.email],['Telefon',draft.phone],['Adresse',draft.address],['UID',draft.uid],['Zahlungsfrist',draft.paymentDays]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt><LocalizedText>{label}</LocalizedText></dt><dd>{value}</dd></div>)}</dl></section>}
  {!editing&&supplierId&&tenantCan(role,'bank:read',profile)&&<SupplierBank supplierId={supplierId} mayWrite={tenantCan(role,'bank:write',profile)} onSaved={query.refresh}/>}
  {!editing&&supplierId&&<SupplierInvoices supplierId={supplierId} mayWrite={tenantCan(role,'purchasing:write',profile)}/>}
  {!editing&&supplierId&&['owner','admin'].includes(role)&&<ExternalResources supplierId={supplierId}/>}
  <FormPage open={editing} onClose={close} label={existing?'Lieferant bearbeiten':'Lieferant hinzufügen'} busy={busy} dirty={dirty}>
   <form id={formId} onSubmit={event=>{event.preventDefault();void save();}}><div className="form-grid two">
    <Field label="Lieferant"><Input required maxLength={200} value={draft.name} onChange={event=>field('name',event.target.value)}/></Field>
    <Field label="Kontakt"><Input maxLength={200} value={draft.contactName} onChange={event=>field('contactName',event.target.value)}/></Field>
    <Field label="E-Mail"><Input type="email" maxLength={320} value={draft.email} onChange={event=>field('email',event.target.value)}/></Field>
    <Field label="Telefon"><Input type="tel" maxLength={80} value={draft.phone} onChange={event=>field('phone',event.target.value)}/></Field>
    <Field label="Adresse"><Input maxLength={500} value={draft.address} onChange={event=>field('address',event.target.value)}/></Field>
    <Field label="UID"><Input maxLength={80} value={draft.uid} onChange={event=>field('uid',event.target.value)}/></Field>
    <Field label="Zahlungsfrist" hint="Tage"><Input required type="number" min="0" max="180" step="1" value={draft.paymentDays} onChange={event=>field('paymentDays',event.target.value)}/></Field>
    <Field label="Status"><Select value={draft.status} onChange={event=>field('status',event.target.value)}><option value="active"><LocalizedText>{'Aktiv'}</LocalizedText></option><option value="inactive"><LocalizedText>{'Inaktiv'}</LocalizedText></option></Select></Field>
   </div></form>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={close}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy||!existing&&!recovery.ready}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
  </FormPage>
 </AppShell>;
}
