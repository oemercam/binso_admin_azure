"use client";
import {useEffect,useRef,useState} from 'react';
import {apiGet,apiPost} from '@/lib/client/backend';
import {useApiQuery,useDataRevision} from '@/lib/client/use-api-query';
import {localeTags} from '@/lib/locales/config';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {formatQuantity,formatTimestampDate} from '@/lib/display-format';
import {FormSheet} from './binso-ux';
import {DirectorySelect} from './directory-select';
import {Button,ErrorState,Field,FormActions,Input,LoadingState,Select} from './ui';

type Side='purchase'|'sale';
type Snapshot={id:string;revision:number;source_snapshot:{unitPrice:string;currency:string;vatRate:string;taxTreatment:string;taxReason:string|null;contractId:string;conditionRevisionId:string;revision:number}};
type PriceState={time:{id:string;version:number;work_date:string;customer_id:string|null;supplier_id:string;project_id:string;external_resource_id:string;recorded_duration_minutes:number;billable:boolean;person_name:string};item:Snapshot|null;allocated:boolean};
type Condition={id:string;condition_id:string;revision:number;status:string;resource_id:string|null;starts_on:string;ends_on:string|null;unit:string|null;unit_price:string|null;currency:string|null;vat_rate:string|null;tax_treatment:string|null;tax_reason:string|null};
type ContractDetail={item:{id:string;version:number;name:string};conditions:Condition[]};
/** One source chooser for both financial sides; calculations stay in the finance owner. */
export function TimePriceSource({entryId,billable}:{entryId:string;billable:boolean}){
 const {locale}=useLocale(),t=useTranslation();
 const scope=useDataRevision([]),sequence=useRef(0),busy=useRef(false);
 const [open,setOpen]=useState(false),[side,setSide]=useState<Side>(billable?'sale':'purchase'),[state,setState]=useState<PriceState|null>(null),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false);
 const [contractId,setContractId]=useState(''),[selection,setSelection]=useState<{contractId:string;contractVersion:number;condition:Condition}|null>(null),[replay,setReplay]=useState<{body:string;key:string}|null>(null);
 useEffect(()=>{sequence.current++;queueMicrotask(()=>{setOpen(false);setState(null);setSelection(null);setContractId('');setError(null);setReplay(null)})},[scope]);
 const contract=useApiQuery<ContractDetail>(open&&contractId?'/api/contracts/'+encodeURIComponent(contractId):null);
 const close=()=>{sequence.current++;setOpen(false);setState(null);setSelection(null);setContractId('');setReplay(null);setError(null)};
 const load=async(nextSide:Side)=>{
  const serial=++sequence.current;setSide(nextSide);setState(null);setContractId('');setSelection(null);setError(null);setLoading(true);
  try{const data=await apiGet<PriceState>('/api/time-entries/'+encodeURIComponent(entryId)+'/pricing?side='+nextSide);if(serial===sequence.current)setState(data)}catch(e){if(serial===sequence.current)setError(e instanceof Error?e.message:'Preisquelle konnte nicht geladen werden.')}finally{if(serial===sequence.current)setLoading(false)}
 };
 const launch=()=>{setOpen(true);void load(billable?'sale':'purchase')};
 const detail=contract.data?.item.id===contractId?contract.data:undefined;
 const conditions=(detail?.conditions??[]).filter(row=>row.status==='approved'&&row.unit==='hour'&&row.unit_price!==null&&row.currency!==null&&row.starts_on<=(state?.time.work_date??'')&&(!row.ends_on||row.ends_on>=(state?.time.work_date??''))&&(!row.resource_id||row.resource_id===state?.time.external_resource_id)&&!(detail?.conditions??[]).some(newer=>newer.status==='approved'&&newer.condition_id===row.condition_id&&newer.revision>row.revision));
 const selectionChanged=!!selection&&!!detail&&(detail.item.version!==selection.contractVersion||!conditions.some(row=>row.id===selection.condition.id));
 const save=async()=>{
  if(busy.current||!state||!selection||!detail||selectionChanged||contract.loading||state.allocated)return;
  const body={side,contractId:selection.contractId,conditionId:selection.condition.condition_id,expectedConditionRevisionId:selection.condition.id,expectedContractVersion:selection.contractVersion,expectedTimeRevision:state.time.version,expectedRevision:state.item?.revision??0};
  const serialized=JSON.stringify(body),attempt=replay?.body===serialized?replay:{body:serialized,key:crypto.randomUUID()};setReplay(attempt);busy.current=true;setSaving(true);setError(null);
  try{await apiPost('/api/time-entries/'+encodeURIComponent(entryId)+'/pricing',body,{idempotencyKey:attempt.key});close()}catch(e){setError(e instanceof Error?e.message:'Preisquelle konnte nicht gespeichert werden.')}finally{busy.current=false;setSaving(false)}
 };
 return <><button type="button" className="text-action" onClick={launch}><LocalizedText>{"Preisquelle"}</LocalizedText></button><FormSheet label="Preisquelle bestätigen" description="Einkauf und Verkauf werden getrennt gespeichert. Es wird keine Rechnung erzeugt." open={open} onClose={close} busy={saving} dirty={!!selection}>
  <Field label="Richtung"><Select value={side} disabled={saving} onChange={e=>void load(e.target.value as Side)}><option value="sale" disabled={!billable}><LocalizedText>{"Verkauf"}</LocalizedText></option><option value="purchase"><LocalizedText>{"Einkauf"}</LocalizedText></option></Select></Field>
  {loading&&<LoadingState/>}{error&&<ErrorState>{error}</ErrorState>}{error&&state&&<Button variant="secondary" disabled={saving} onClick={()=>void load(side)}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button>}
  {!loading&&!state&&<Button variant="secondary" onClick={()=>void load(side)}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button>}
  {state&&<><Field label="Leistungsdatum"><Input readOnly value={formatTimestampDate(state.time.work_date,localeTags[locale])}/></Field><Field label="Ressource"><Input readOnly value={state.time.person_name}/></Field>
   <Field label="Gespeicherte Preisquelle"><Input readOnly value={state.item?formatQuantity(state.item.source_snapshot.unitPrice,state.item.source_snapshot.currency,localeTags[locale])+' / h':'—'}/></Field>
   {state.item&&<Button variant="ghost" href={'/vertraege/'+encodeURIComponent(state.item.source_snapshot.contractId)}><LocalizedText>{"Vertrag öffnen"}</LocalizedText></Button>}
   {state.allocated?<p><LocalizedText>{"Bereits zugeordnete Leistungen behalten ihre gespeicherte Preisquelle."}</LocalizedText></p>:<><Field label="Vertrag"><DirectorySelect label="Vertrag" emptyLabel="Vertrag auswählen" endpoint={'/api/contracts?status=active&side='+side+'&partyId='+encodeURIComponent(side==='sale'?state.time.customer_id??'':state.time.supplier_id)} value={contractId} onChange={value=>{setContractId(value);setSelection(null)}}/></Field>
    <Field label="Freigegebener Stundensatz"><Select value={selection?.condition.id??''} disabled={!detail||saving} onChange={e=>{const row=conditions.find(row=>row.id===e.target.value);setSelection(row&&detail?{contractId,contractVersion:detail.item.version,condition:row}:null)}}><option value=""><LocalizedText>{"Kondition auswählen"}</LocalizedText></option>{conditions.map(row=><option key={row.id} value={row.id}>{formatQuantity(row.unit_price,row.currency??'',localeTags[locale])+' / h · '+formatTimestampDate(row.starts_on,localeTags[locale])+' · '+row.revision}</option>)}</Select></Field>
    {contract.loading&&<LoadingState/>}{contract.error&&<ErrorState>{contract.error}</ErrorState>}
    {selectionChanged&&<><ErrorState><LocalizedText>{"Die Leistung oder Preisbindung wurde geändert. Bitte erneut prüfen."}</LocalizedText></ErrorState><Button variant="secondary" onClick={()=>{setSelection(null);contract.refresh()}}><LocalizedText>{"Erneut versuchen"}</LocalizedText></Button></>}
    {contractId&&detail&&!conditions.length&&<p><LocalizedText>{"Für dieses Leistungsdatum fehlt ein passender freigegebener Stundensatz."}</LocalizedText></p>}
    {selection&&<><Field label="Steuerbehandlung"><Input readOnly value={t(selection.condition.tax_treatment==='taxable'?'Steuerpflichtig':selection.condition.tax_treatment==='exempt'?'Steuerbefreit':'Ausserhalb des Steuerbereichs')}/></Field><Field label="MwSt."><Input readOnly value={formatQuantity(selection.condition.vat_rate,'%',localeTags[locale])}/></Field>{selection.condition.tax_reason&&<Field label="Begründung"><Input readOnly value={selection.condition.tax_reason}/></Field>}<p><LocalizedText>{"Die gewählte Revision wird fest gespeichert. Es erfolgt keine Währungsumrechnung."}</LocalizedText></p></>}
   </>}
  </>}
  <FormActions sheet><Button variant="secondary" disabled={saving} onClick={close}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button requiresWrite disabled={saving||!state||state.allocated||!selection||!detail||selectionChanged||contract.loading} onClick={()=>void save()}><LocalizedText>{"Preisquelle bestätigen"}</LocalizedText></Button></FormActions>
 </FormSheet></>;
}
