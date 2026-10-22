"use client";
import {useId,useRef,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch,apiPost} from '@/lib/client/backend';
import {tenantCan} from '@/lib/permissions';
import {safeAppPath} from '@/lib/navigation';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatQuantity,formatTimestampDate} from '@/lib/display-format';
import {commercialContractIssue,contractConditionIssue,commercialUnits,contractExpensePolicies,type CommercialContractInput,type ContractConditionInput} from '@/lib/commercial-contract';
import {AppShell} from './app-shell';
import {RecordRow,RecordsView,RecordsControls,useRecordsController} from './records';
import {ActionRow,ActionsMenu,CreateAction,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select,Status,Textarea} from './ui';
import {DirectorySelect} from './directory-select';
import {EntityFiles} from './entity-files';
import ConfirmDialog from './confirm-dialog';

type Contract={id:string;contract_no:string;name:string;customer_id:string|null;supplier_id:string|null;project_id:string|null;party_name:string|null;start_date:string;end_date:string|null;status:'draft'|'active'|'paused'|'ended'|'cancelled';notice_days:number;billing_interval:CommercialContractInput['billingInterval'];notes:string|null;version:number;is_v26_contract:boolean;created_by_user_id:string;side:'purchase'|'sale'};
type Condition={id:string;condition_id:string;revision:number;is_current:boolean;resource_id:string|null;resource_name:string|null;resource_supplier_id:string|null;starts_on:string;ends_on:string|null;unit:ContractConditionInput['unit'];unit_price:string|null;currency:ContractConditionInput['currency'];tax_treatment:ContractConditionInput['taxTreatment'];vat_rate:string|null;tax_reason:string|null;expense_policy:ContractConditionInput['expensePolicy'];status:'draft'|'approved'|'rejected';created_by_user_id:string;missing:string[]};
type Detail={item:Contract;conditions:Condition[];documentManifest:string;documentsReady:boolean;documentCount:number;reviewSnapshot:{id:string;contract_version:number;document_manifest:string;document_count:number}|null};
const statusLabels:Record<Contract['status'],string>={draft:'Entwurf',active:'Aktiv',paused:'Pausiert',ended:'Beendet',cancelled:'Storniert'};
const sideLabels={purchase:'Einkauf',sale:'Verkauf'},billingLabels={none:'Nach Vereinbarung',monthly:'Monatlich',quarterly:'Quartalsweise',yearly:'Jährlich'},taxLabels={taxable:'Steuerpflichtig',exempt:'Steuerbefreit',out_of_scope:'Ausserhalb des Steuerbereichs'};
const conditionLabels={draft:'Entwurf',approved:'Freigegeben',rejected:'Abgelehnt'};
function conditionLabel(row:Condition,publishedId?:string){return row.status==='approved'?(publishedId===row.id?'Freigegebene Preisrevision':'Frühere Freigabe'):row.is_current?conditionLabels[row.status]:'Frühere Revision';}
const rootConfirmTitles={active:'Vertrag freigeben?',paused:'Vertrag pausieren?',ended:'Vertrag beenden?',cancelled:'Vertrag stornieren?'};
const blank:CommercialContractInput={name:'',side:'purchase',partyId:'',projectId:null,startsOn:'',endsOn:null,noticeDays:0,billingInterval:'none',notes:''};
function rootDraft(item:Contract):CommercialContractInput{return {name:item.name,side:item.side,partyId:item.supplier_id??item.customer_id??'',projectId:item.project_id,startsOn:item.start_date,endsOn:item.end_date,noticeDays:item.notice_days,billingInterval:item.billing_interval,notes:item.notes??''};}
function useContractActor(){return useApiQuery<{user?:{id?:string};tenant?:{role?:string;readOnly?:boolean;moduleProfile?:'standard'|'time_only'}}>('/api/auth/session');}

function ContractEditor({item,prefill,onClose,onSaved}:{item?:Contract;prefill?:Partial<CommercialContractInput>;onClose:()=>void;onSaved:(id:string)=>void}){
 const [draft,setDraft]=useState<CommercialContractInput>(()=>item?rootDraft(item):{...blank,...prefill}),[initial]=useState(()=>JSON.stringify(item?rootDraft(item):{...blank,...prefill})),[revision]=useState(item?.version),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const formId=useId(),t=useTranslation(),pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const field=<K extends keyof CommercialContractInput>(name:K,value:CommercialContractInput[K])=>setDraft(d=>({...d,[name]:value}));
 const save=async()=>{
  if(pending.current)return;const body={...draft,...(item?{expectedRevision:revision}:{})},issue=commercialContractIssue(body);if(issue){setError(issue);return;}
  pending.current=true;setBusy(true);setError('');try{
   const serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const result=item?await apiPatch<{item:Contract}>('/api/contracts/'+encodeURIComponent(item.id),body,undefined,{idempotencyKey:attempt.current.key}):await apiPost<{item:Contract}>('/api/contracts',body,{idempotencyKey:attempt.current.key});
   if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');onSaved(result.item.id);
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 return <FormSheet open onClose={onClose} label={item?'Vertragsentwurf bearbeiten':'Vertrag erstellen'} dirty={JSON.stringify(draft)!==initial} busy={busy}>
  <form id={formId} onSubmit={e=>{e.preventDefault();void save();}}><div className="form-grid two">
   <Field label="Bezeichnung"><Input required maxLength={200} value={draft.name} onChange={e=>field('name',e.target.value)}/></Field>
   <Field label="Vertragsart"><Select disabled={!!item} value={draft.side} onChange={e=>setDraft(d=>({...d,side:e.target.value as CommercialContractInput['side'],partyId:'',projectId:null}))}>{Object.entries(sideLabels).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
   <Field label="Vertragspartner"><DirectorySelect disabled={!!item} selectedLabel={item?.party_name??undefined} required label="Vertragspartner" endpoint={draft.side==='purchase'?'/api/suppliers':'/api/customers'} value={draft.partyId} onChange={value=>setDraft(d=>({...d,partyId:value,projectId:null}))}/></Field>
   <Field label="Auftrag (optional)"><DirectorySelect disabled={!!item} label="Auftrag" endpoint="/api/projects" customerId={draft.side==='sale'?draft.partyId:null} value={draft.projectId??''} onChange={value=>field('projectId',value||null)}/></Field>
   <Field label="Gültig ab"><Input required type="date" value={draft.startsOn} onChange={e=>field('startsOn',e.target.value)}/></Field><Field label="Gültig bis"><Input type="date" min={draft.startsOn||undefined} value={draft.endsOn??''} onChange={e=>field('endsOn',e.target.value||null)}/></Field>
   <Field label="Kündigungsfrist (Tage)"><Input required type="number" min="0" max="3650" step="1" value={draft.noticeDays} onChange={e=>field('noticeDays',Number(e.target.value))}/></Field>
   <Field label="Abrechnungsperiode"><Select value={draft.billingInterval} onChange={e=>field('billingInterval',e.target.value as CommercialContractInput['billingInterval'])}>{Object.entries(billingLabels).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
  </div><Field label="Notizen"><Textarea maxLength={4000} value={draft.notes} onChange={e=>field('notes',e.target.value)}/></Field></form>
  {error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy}><LocalizedText>{'Entwurf speichern'}</LocalizedText></Button></FormActions>
 </FormSheet>;
}

export function CommercialContractsPage(){
 const router=useRouter(),search=useSearchParams(),actor=useContractActor(),[creating,setCreating]=useState(false);
 const columns:NonNullable<Parameters<typeof useRecordsController>[0]['columns']>=[{label:'Vertrag',index:0},{label:'Nr.',index:1},{label:'Vertragsart',index:5},{label:'Status',index:6,status:true}],chips=['Alle','Entwurf','Aktiv','Pausiert','Beendet'];
 const controller=useRecordsController({placeholder:'Verträge suchen...',chips,columns}),fields:Record<number,string>={0:'name',1:'contract_no',5:'side',6:'status'},statuses:Record<string,string>={Entwurf:'draft',Aktiv:'active',Pausiert:'paused',Beendet:'ended'};
 const side=search.get('side')==='purchase'?'purchase':search.get('side')==='sale'?'sale':'all',partyId=search.get('partyId')??'',params=new URLSearchParams({offset:String(controller.page*50),q:controller.query,status:statuses[controller.activeChip]??'all',side,order:controller.sort==='default'?'created_at.desc':(fields[controller.sortIndex]??'name')+'.'+controller.sort});if(partyId)params.set('partyId',partyId);
 const query=useApiQuery<{items:Contract[];total:number}>('/api/contracts?'+params),rows=(query.data?.items??[]).map(c=>[c.name,c.contract_no,c.party_name??'',c.start_date,c.id,sideLabels[c.side],statusLabels[c.status]]),canWrite=tenantCan(actor.data?.tenant?.role??'reader','contracts:write',actor.data?.tenant?.moduleProfile)&&!actor.data?.tenant?.readOnly;
 const origin=search.has('origin')?safeAppPath(search.get('origin'),'/vertraege'):undefined;
 const returnParams=new URLSearchParams({...(side!=='all'?{side}:{}),...(partyId?{partyId}:{}),...(origin?{origin}:{})}),returnTo='/vertraege'+(returnParams.size?'?'+returnParams:'');
 const href=(id:string)=>'/vertraege/'+encodeURIComponent(id)+'?returnTo='+encodeURIComponent(returnTo);
 return <AppShell title="Verträge" active="vertraege" backHref={origin} actions={<RecordsControls controller={controller} placeholder="Verträge suchen..." chips={chips} columns={columns}>{canWrite&&<CreateAction label="Vertrag erstellen" onClick={()=>setCreating(true)}/>}</RecordsControls>}>
  <RecordsView controller={controller} toolbarActions={false} showCount={false} remote pagination={{total:query.data?.total??0,page:controller.page,pageSize:50,onPage:controller.setPage}} loading={query.loading} error={query.error} items={rows} countLabel="Verträge" placeholder="Verträge suchen..." chips={chips} columns={columns} rowHref={row=>href(row[4])}>{row=><RecordRow href={href(row[4])} icon="file" title={row[0]} meta={[row[1],row[2],row[5]].filter(Boolean).join(' · ')} status={row[6]}/>}</RecordsView>
  {creating&&<ContractEditor prefill={{...(side!=='all'?{side}:{}),...(partyId?{partyId}:{})}} onClose={()=>setCreating(false)} onSaved={id=>{setCreating(false);router.push(href(id));}}/>}
 </AppShell>;
}

type ConditionDraft={resourceId:string;startsOn:string;endsOn:string;unit:string;unitPrice:string;currency:string;taxTreatment:string;vatRate:string;taxReason:string;expensePolicy:string};
function ConditionEditor({parent,item,onClose,onSaved}:{parent:Contract;item:Condition|null;onClose:()=>void;onSaved:()=>void}){
 const initialDraft:ConditionDraft=item?{resourceId:item.resource_id??'',startsOn:item.starts_on,endsOn:item.ends_on??'',unit:item.unit??'',unitPrice:item.unit_price??'',currency:item.currency??'',taxTreatment:item.tax_treatment??'',vatRate:item.vat_rate??'',taxReason:item.tax_reason??'',expensePolicy:item.expense_policy??''}:{resourceId:'',startsOn:parent.start_date,endsOn:parent.end_date??'',unit:'',unitPrice:'',currency:'',taxTreatment:'',vatRate:'',taxReason:'',expensePolicy:''};
 const [draft,setDraft]=useState(initialDraft),[initial]=useState(JSON.stringify(initialDraft)),[supplier,setSupplier]=useState(parent.supplier_id??item?.resource_supplier_id??''),[busy,setBusy]=useState(false),[error,setError]=useState(''),formId=useId(),t=useTranslation(),pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const resources=useApiQuery<{items:{id:string;name:string;active:boolean}[]}>(supplier?'/api/suppliers/'+encodeURIComponent(supplier)+'/resources':null),field=(key:keyof ConditionDraft,value:string)=>setDraft(d=>({...d,[key]:value}));
 const save=async()=>{
  if(pending.current)return;
  const body={resourceId:draft.resourceId||null,startsOn:draft.startsOn,endsOn:draft.endsOn||null,unit:draft.unit||null,unitPrice:draft.unitPrice.trim()||null,currency:draft.currency||null,taxTreatment:draft.taxTreatment||null,vatRate:draft.vatRate.trim()||null,taxReason:draft.taxReason,expensePolicy:draft.expensePolicy||null,...(item?{expectedRevision:item.revision}:{})} as ContractConditionInput;
  const issue=contractConditionIssue(body);if(issue){setError(issue);return;}pending.current=true;setBusy(true);setError('');
  try{const serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};const path='/api/contracts/'+encodeURIComponent(parent.id)+'/conditions';
   const result=item?await apiPatch<{item:Condition}>(path+'/'+encodeURIComponent(item.condition_id),body,undefined,{idempotencyKey:attempt.current.key}):await apiPost<{item:Condition}>(path,body,{idempotencyKey:attempt.current.key});if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');onSaved();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 return <FormSheet open onClose={onClose} label={item?'Konditionsrevision erfassen':'Konditionen erfassen'} dirty={JSON.stringify(draft)!==initial} busy={busy}>
  <p><LocalizedText>{'Unvollständige Konditionen bleiben ein Entwurf. Eine neue Revision ersetzt den freigegebenen Preis erst nach unabhängiger Prüfung.'}</LocalizedText></p>
  <form id={formId} onSubmit={e=>{e.preventDefault();void save();}}><div className="form-grid two">
   {parent.side==='sale'&&parent.project_id&&!item&&<Field label="Ressourcenlieferant (optional)"><DirectorySelect endpoint="/api/suppliers" label="Lieferant" value={supplier} onChange={value=>{setSupplier(value);field('resourceId','');}}/></Field>}
   <Field label="Ressource (optional)"><Select disabled={!!item||parent.side==='sale'&&!parent.project_id} value={draft.resourceId} onChange={e=>field('resourceId',e.target.value)}><option value="">{t('Alle Ressourcen')}</option>{draft.resourceId&&!resources.data?.items.some(r=>r.id===draft.resourceId)&&<option value={draft.resourceId}>{item?.resource_name??t('Bisherige Ressourcenreferenz')}</option>}{resources.data?.items.filter(r=>r.active||r.id===draft.resourceId).map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
   <Field label="Gültig ab"><Input required type="date" min={parent.start_date} value={draft.startsOn} onChange={e=>field('startsOn',e.target.value)}/></Field><Field label="Gültig bis"><Input type="date" min={draft.startsOn||parent.start_date} max={parent.end_date??undefined} value={draft.endsOn} onChange={e=>field('endsOn',e.target.value)}/></Field>
   <Field label="Einheit"><Select value={draft.unit} onChange={e=>field('unit',e.target.value)}><option value="">{t('Noch offen')}</option>{Object.entries(commercialUnits).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
   <Field label={parent.side==='purchase'?'Einkaufspreis':'Verkaufspreis'}><Input type="number" min="0" step="0.01" inputMode="decimal" value={draft.unitPrice} onChange={e=>field('unitPrice',e.target.value)}/></Field>
   <Field label="Währung"><Select value={draft.currency} onChange={e=>field('currency',e.target.value)}><option value="">{t('Noch offen')}</option><option value="CHF">CHF</option><option value="EUR">EUR</option></Select></Field>
   <Field label="Steuerbehandlung"><Select value={draft.taxTreatment} onChange={e=>field('taxTreatment',e.target.value)}><option value="">{t('Noch offen')}</option>{Object.entries(taxLabels).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
   <Field label="MwSt. (%)"><Input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={draft.vatRate} onChange={e=>field('vatRate',e.target.value)}/></Field>
   <Field label="Begründung der Steuerbefreiung"><Input maxLength={300} value={draft.taxReason} onChange={e=>field('taxReason',e.target.value)}/></Field>
   <Field label="Spesenregel"><Select value={draft.expensePolicy} onChange={e=>field('expensePolicy',e.target.value)}><option value="">{t('Noch offen')}</option>{Object.entries(contractExpensePolicies).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
  </div></form>
  {resources.error&&<ErrorState onRetry={resources.refresh}>{resources.error}</ErrorState>}{error&&<ErrorState>{error}</ErrorState>}
  <FormActions sheet><Button variant="secondary" disabled={busy} onClick={onClose}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy}><LocalizedText>{'Entwurf speichern'}</LocalizedText></Button></FormActions>
 </FormSheet>;
}

export function CommercialContractDetail({contractId}:{contractId:string}){
 const query=useApiQuery<Detail>('/api/contracts/'+encodeURIComponent(contractId)),actor=useContractActor(),search=useSearchParams(),t=useTranslation(),{locale}=useLocale();
 const [editing,setEditing]=useState(false),[condition,setCondition]=useState<Condition|null|undefined>(undefined),[command,setCommand]=useState<{kind:'root'|'condition';contractId:string;status:string;condition?:Condition;expectedRevision:number;documentManifest?:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const item=query.data?.item,mayWrite=tenantCan(actor.data?.tenant?.role??'reader','contracts:write',actor.data?.tenant?.moduleProfile)&&!actor.data?.tenant?.readOnly,editable=mayWrite&&item?.is_v26_contract&&['draft','active','paused'].includes(item.status);
 const date=(value:string)=>formatTimestampDate(value+'T00:00:00Z',localeTags[locale]);
 const independent=!!actor.data?.user?.id&&actor.data.user.id!==item?.created_by_user_id,hasPublished=query.data?.conditions.some(r=>r.status==='approved')??false;
 const published=new Map<string,string>();for(const row of query.data?.conditions??[])if(row.status==='approved'&&!published.has(row.condition_id))published.set(row.condition_id,row.id);
 const rootCommand=(status:string)=>{if(item&&query.data)setCommand({kind:'root',contractId:item.id,status,expectedRevision:item.version,documentManifest:query.data.documentManifest});};
 const conditionCommand=(row:Condition,status:string)=>{if(item)setCommand({kind:'condition',contractId:item.id,status,condition:row,expectedRevision:row.revision});};
 const execute=async()=>{
  if(!command||!item||pending.current)return;pending.current=true;setBusy(true);setError('');
  try{const body=command.kind==='root'?{status:command.status,expectedRevision:command.expectedRevision,...(command.status==='active'?{expectedDocumentManifest:command.documentManifest}:{})}:{status:command.status,expectedRevision:command.expectedRevision};const path='/api/contracts/'+encodeURIComponent(command.contractId)+(command.kind==='root'?'/status':'/conditions/'+encodeURIComponent(command.condition!.condition_id)+'/review'),serialized=JSON.stringify({path,body});if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const result=command.kind==='root'?await apiPatch<{item:{id:string}}>(path,body,undefined,{idempotencyKey:attempt.current.key}):await apiPost<{item:{id:string}}>(path,body,{idempotencyKey:attempt.current.key});if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');setCommand(null);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');setCommand(null);}finally{pending.current=false;setBusy(false);}
 };
 return <AppShell title={item?.name??'Vertrag'} titleIsUserContent={!!item} recordLabel={item?.contract_no} active="vertraege" backHref={safeAppPath(search.get('returnTo'),'/vertraege')} actions={editable?<ActionsMenu label="Vertragsaktionen">
  {item.status==='draft'&&<ActionRow requiresWrite icon="edit" title="Vertragsentwurf bearbeiten" onClick={()=>setEditing(true)}/>}
  {['draft','paused'].includes(item.status)&&independent&&<ActionRow requiresWrite icon="check" title="Vertrag freigeben" disabled={!hasPublished||!query.data?.documentsReady} onClick={()=>rootCommand('active')}/>}
  {item.status==='active'&&<ActionRow requiresWrite icon="pause" title="Vertrag pausieren" onClick={()=>rootCommand('paused')}/>}
  {['active','paused'].includes(item.status)&&<ActionRow requiresWrite icon="close" title="Vertrag beenden" onClick={()=>rootCommand('ended')}/>}
  {['draft','active','paused'].includes(item.status)&&<ActionRow requiresWrite icon="close" title="Vertrag stornieren" onClick={()=>rootCommand('cancelled')}/>}
 </ActionsMenu>:undefined}>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:item&&query.data?<div className="entity-detail-workspace"><div className="desktop-detail-main">
   {error&&<ErrorState onRetry={query.refresh}>{error}</ErrorState>}
   <Status tone={item.status==='active'?'info':'neutral'}><LocalizedText>{statusLabels[item.status]}</LocalizedText></Status>
   {!item.is_v26_contract&&<p><LocalizedText>{'Historischer Vertragsstand. Bestehende Angaben und Belege bleiben unverändert.'}</LocalizedText></p>}
   <dl className="detail-list"><div><dt><LocalizedText>{'Vertragsart'}</LocalizedText></dt><dd><LocalizedText>{sideLabels[item.side]}</LocalizedText></dd></div><div><dt><LocalizedText>{'Vertragspartner'}</LocalizedText></dt><dd>{item.party_name??'—'}</dd></div><div><dt><LocalizedText>{'Laufzeit'}</LocalizedText></dt><dd>{date(item.start_date)}{' – '}{item.end_date?date(item.end_date):t('Unbefristet')}</dd></div><div><dt><LocalizedText>{'Kündigungsfrist (Tage)'}</LocalizedText></dt><dd>{item.notice_days}</dd></div><div><dt><LocalizedText>{'Abrechnungsperiode'}</LocalizedText></dt><dd><LocalizedText>{billingLabels[item.billing_interval]}</LocalizedText></dd></div></dl>
   {item.notes&&<p>{item.notes}</p>}
   {['draft','paused'].includes(item.status)&&!hasPublished&&<ErrorState><LocalizedText>{'Bitte zuerst vollständige Konditionen unabhängig freigeben.'}</LocalizedText></ErrorState>}
   {editable&&['draft','paused'].includes(item.status)&&hasPublished&&!independent&&<p><LocalizedText>{'Die Prüfung muss durch eine andere berechtigte Person erfolgen.'}</LocalizedText></p>}
   {!query.data.documentsReady&&<ErrorState><LocalizedText>{'Vertragsdateien sind noch nicht sicher freigegeben.'}</LocalizedText></ErrorState>}
   {query.data.reviewSnapshot&&query.data.reviewSnapshot.document_manifest!==query.data.documentManifest&&<ErrorState><LocalizedText>{'Der Dateistand wurde seit der letzten Vertragsfreigabe geändert.'}</LocalizedText></ErrorState>}
   <section className="bo-workspace-section" id="contract-conditions"><SectionTitle title="Vertragskonditionen" action={editable?<ActionsMenu label="Konditionsaktionen"><ActionRow requiresWrite icon="plus" title="Konditionen erfassen" onClick={()=>setCondition(null)}/></ActionsMenu>:undefined}/>
    {!query.data.conditions.length?<EmptyState title="Keine Konditionen erfasst"/>:<div className="action-list">{query.data.conditions.map(row=><div className="assignment-row" key={row.id}><div><b>{row.resource_id?(row.resource_name??t('Ressourcenkondition')):<LocalizedText>{'Alle Ressourcen'}</LocalizedText>}</b><p>{date(row.starts_on)}{' – '}{row.ends_on?date(row.ends_on):t('Unbefristet')}{' · '}{row.unit_price===null||!row.currency?t('Preis noch offen'):formatQuantity(row.unit_price,row.currency,localeTags[locale])}{row.unit?' / '+t(commercialUnits[row.unit]):''}</p>
     <p>{row.tax_treatment?t(taxLabels[row.tax_treatment]):t('Steuerregel noch offen')}{row.vat_rate!==null?' · '+formatQuantity(row.vat_rate,'%',localeTags[locale]):''}{row.tax_reason?' · '+row.tax_reason:''}</p><small>{row.expense_policy?t(contractExpensePolicies[row.expense_policy]):t('Spesenregel noch offen')}</small>
     {!!row.missing.length&&<p><LocalizedText>{'Vor Freigabe fehlen:'}</LocalizedText>{' '}{row.missing.map(t).join(', ')}</p>}
     {editable&&row.is_current&&row.status==='draft'&&!row.missing.length&&row.created_by_user_id===actor.data?.user?.id&&<p><LocalizedText>{'Die Prüfung muss durch eine andere berechtigte Person erfolgen.'}</LocalizedText></p>}
    </div><Status tone={row.status==='approved'&&published.get(row.condition_id)===row.id?'info':'neutral'}><LocalizedText>{conditionLabel(row,published.get(row.condition_id))}</LocalizedText>{' · '}{row.revision}</Status>
     {editable&&row.is_current&&<ActionsMenu label="Konditionsaktionen"><ActionRow requiresWrite icon="edit" title={row.missing.length?'Konditionen vervollständigen':'Konditionsrevision erfassen'} onClick={()=>setCondition(row)}/>{row.status==='draft'&&actor.data?.user?.id&&actor.data.user.id!==row.created_by_user_id&&<><ActionRow requiresWrite icon="check" title="Konditionen freigeben" disabled={!!row.missing.length} onClick={()=>conditionCommand(row,'approved')}/><ActionRow requiresWrite icon="close" title="Ablehnen" onClick={()=>conditionCommand(row,'rejected')}/></>}</ActionsMenu>}
    </div>)}</div>}
   </section>
   {item.is_v26_contract&&<div id="contract-files"><EntityFiles purpose="contract_document" entityId={item.id} readOnly={!mayWrite||!['draft','paused'].includes(item.status)} title="Vertragsdateien" emptyTitle="Keine Vertragsdateien"/></div>}
  </div></div>:null}
  {editing&&item&&<ContractEditor item={item} onClose={()=>setEditing(false)} onSaved={()=>{setEditing(false);query.refresh();}}/>}
  {condition!==undefined&&item&&<ConditionEditor parent={item} item={condition} onClose={()=>setCondition(undefined)} onSaved={()=>{setCondition(undefined);query.refresh();}}/>}
  <ConfirmDialog open={!!command} busy={busy} title={command?.kind==='condition'?(command.status==='approved'?'Konditionen freigeben?':'Konditionen ablehnen?'):rootConfirmTitles[command?.status as keyof typeof rootConfirmTitles]??'Vertrag freigeben?'} message={command?.kind==='condition'?(command.status==='approved'?'Diese Preisrevision wird unabhängig freigegeben und gilt nur im erfassten Zeitraum.':'Diese Konditionsrevision wird abgelehnt. Frühere Freigaben bleiben unverändert.'):command?.status==='active'?'Vertrag und angezeigter Dateistand werden intern freigegeben. Das ersetzt keine Prüfung einer Unterschrift.':'Neue Preisübernahmen werden angehalten. Bestehende Belege bleiben unverändert.'} danger={command?.status==='rejected'||command?.status==='cancelled'||command?.status==='ended'} onCancel={()=>setCommand(null)} onConfirm={()=>void execute()}/>
 </AppShell>;
}
