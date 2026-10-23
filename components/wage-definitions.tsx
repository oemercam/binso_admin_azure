"use client";
import {useId,useRef,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch,apiPost} from '@/lib/client/backend';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatQuantity} from '@/lib/display-format';
import {wageDefinitionIssue,type AnnualBasis,type WageDefinitionInput,type WageModel} from '@/lib/wage-definition';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select,Status} from './ui';

type Wage={id:string;definition_id:string;revision:number;is_current:boolean;employment_revision_id:string;employment_current:boolean;starts_on:string;ends_on:string|null;model:WageModel;amount:string;currency:'CHF'|'EUR';annual_basis:AnnualBasis|null;thirteenth_entitled:boolean;payout_day:number|null;payout_last_day:boolean;thirteenth_payout_month:number|null};
type Period={id:string;revision:number;is_current:boolean;starts_on:string;ends_on:string|null;job_title:string};
type Draft={employmentRevisionId:string;startsOn:string;endsOn:string;model:string;amount:string;currency:string;annualBasis:string;entitlement:string;payoutDay:string;thirteenthPayoutMonth:string};
const blank:Draft={employmentRevisionId:'',startsOn:'',endsOn:'',model:'',amount:'',currency:'CHF',annualBasis:'',entitlement:'',payoutDay:'',thirteenthPayoutMonth:''};
const modelLabels:Record<WageModel,string>={monthly:'Monatslohn',hourly:'Stundenlohn',annual:'Jahreslohn'};
const basisLabels:Record<AnnualBasis,string>={including_13th:'Inklusive 13. Monatslohn',excluding_13th:'Exklusive 13. Monatslohn',without_13th:'Ohne Anspruch auf 13. Monatslohn'};
export function WageDefinitions({employeeId,mayWrite}:{employeeId:string;mayWrite:boolean}){
 const endpoint='/api/employees/'+encodeURIComponent(employeeId)+'/wages',query=useApiQuery<{items:Wage[]}>(endpoint),periods=useApiQuery<{items:Period[]}>('/api/employees/'+encodeURIComponent(employeeId)+'/employment'),formId=useId(),{locale}=useLocale(),t=useTranslation();
 const [open,setOpen]=useState(false),[selected,setSelected]=useState<Wage|null>(null),[draft,setDraft]=useState<Draft>(blank),[initial,setInitial]=useState(JSON.stringify(blank)),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null),currentPeriods=periods.data?.items.filter(p=>p.is_current)??[];
 const edit=(item:Wage|null)=>{
  const next:Draft=item?{employmentRevisionId:item.employment_revision_id,startsOn:item.starts_on,endsOn:item.ends_on??'',model:item.model,amount:item.amount,currency:item.currency,annualBasis:item.annual_basis??'',entitlement:item.thirteenth_entitled?'yes':'no',payoutDay:item.payout_last_day?'last_day':String(item.payout_day),thirteenthPayoutMonth:item.thirteenth_payout_month?String(item.thirteenth_payout_month):''}:{...blank};
  setDraft(next);setInitial(JSON.stringify(next));setSelected(item);setError('');attempt.current=null;setOpen(true);
 };
 const field=(name:keyof Draft,value:string)=>setDraft(d=>({...d,[name]:value}));
 const save=async()=>{
  if(pending.current)return;
  if(!draft.model||!draft.entitlement||!draft.payoutDay){setError('Bitte Lohnmodell, Anspruch und Auszahlungsplan ausdrücklich auswählen.');return;}
  const body={employmentRevisionId:draft.employmentRevisionId,startsOn:draft.startsOn,endsOn:draft.endsOn||null,model:draft.model,amount:draft.amount.trim(),currency:draft.currency,annualBasis:draft.annualBasis||null,thirteenthEntitled:draft.entitlement==='yes',payoutDay:draft.payoutDay==='last_day'?'last_day':Number(draft.payoutDay),thirteenthPayoutMonth:draft.entitlement==='yes'?Number(draft.thirteenthPayoutMonth):null,...(selected?{expectedRevision:selected.revision}:{})} as WageDefinitionInput;
  const issue=wageDefinitionIssue(body);if(issue){setError(issue);return;}
  pending.current=true;setBusy(true);setError('');
  try{
   const serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const validate=(result:unknown)=>{if(!result||typeof result!=='object'||!('item' in result)||!result.item||typeof result.item!=='object'||!('id' in result.item)||!result.item.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');};
   if(selected)await apiPatch(endpoint+'/'+encodeURIComponent(selected.definition_id),body,validate,{idempotencyKey:attempt.current.key});else await apiPost(endpoint,body,{validate,idempotencyKey:attempt.current.key});
   setOpen(false);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 return <section className="bo-workspace-section">
  <SectionTitle title="Lohnvertrag" action={mayWrite?<ActionsMenu label="Lohnvertragsaktionen"><ActionRow requiresWrite icon="plus" title="Lohndefinition hinzufügen" onClick={()=>edit(null)}/></ActionsMenu>:undefined}/>
  <p><LocalizedText>{'Vertragsbeträge werden unverändert erfasst. Keine automatische Umrechnung, Pensumskürzung oder Lohnzahlung.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?.items.length?<EmptyState title="Keine Lohndefinitionen"/>:<div className="action-list">{query.data.items.map(item=><div className="assignment-row" key={item.id}>
   <div><b><LocalizedText>{modelLabels[item.model]}</LocalizedText>{' · '}{formatQuantity(item.amount,item.currency,localeTags[locale])}</b><p>{item.starts_on}{' – '}{item.ends_on??t('Unbefristet')}</p>
    {item.annual_basis&&<p><LocalizedText>{basisLabels[item.annual_basis]}</LocalizedText></p>}
    <p><LocalizedText>{item.thirteenth_entitled?'Anspruch auf 13. Monatslohn':'Ohne Anspruch auf 13. Monatslohn'}</LocalizedText>{item.thirteenth_payout_month?' · '+item.thirteenth_payout_month:''}</p>
    <small><LocalizedText>{'Auszahlungstag'}</LocalizedText>{': '}{item.payout_last_day?t('Monatsletzter'):item.payout_day}</small>
    {item.is_current&&!item.employment_current&&<ErrorState><LocalizedText>{'Anstellungsrevision geändert. Lohnvertrag ausdrücklich prüfen und neu bestätigen.'}</LocalizedText></ErrorState>}
   </div><Status tone={item.is_current?'info':'neutral'}><LocalizedText>{item.is_current?'Aktueller Vertragsstand':'Frühere Revision'}</LocalizedText>{' · '}{item.revision}</Status>
   {mayWrite&&item.is_current&&<ActionsMenu label="Lohnvertragsaktionen"><ActionRow requiresWrite icon="edit" title="Lohndefinition korrigieren" onClick={()=>edit(item)}/></ActionsMenu>}
  </div>)}</div>}
  <FormSheet open={open} onClose={()=>setOpen(false)} label={selected?'Lohndefinition korrigieren':'Lohndefinition hinzufügen'} busy={busy} dirty={JSON.stringify(draft)!==initial}>
   {periods.error?<ErrorState onRetry={periods.refresh}>{periods.error}</ErrorState>:periods.loading?<LoadingState/>:<form id={formId} onSubmit={e=>{e.preventDefault();void save();}}><div className="form-grid two">
    <Field label="Anstellungsrevision"><Select required value={draft.employmentRevisionId} onChange={e=>field('employmentRevisionId',e.target.value)}><option value="">{t('Bitte wählen')}</option>{!currentPeriods.some(p=>p.id===draft.employmentRevisionId)&&draft.employmentRevisionId&&<option value={draft.employmentRevisionId} disabled>{t('Frühere Revision')}</option>}{currentPeriods.map(p=><option key={p.id} value={p.id}>{p.job_title}{' · '}{p.starts_on}{' · '}{p.revision}</option>)}</Select></Field>
    <Field label="Lohnmodell"><Select required value={draft.model} onChange={e=>setDraft(d=>({...d,model:e.target.value,annualBasis:'',entitlement:'',thirteenthPayoutMonth:''}))}><option value="">{t('Bitte wählen')}</option>{Object.entries(modelLabels).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
    <Field label="Gültig ab"><Input required type="date" value={draft.startsOn} onChange={e=>field('startsOn',e.target.value)}/></Field><Field label="Gültig bis"><Input type="date" min={draft.startsOn||undefined} value={draft.endsOn} onChange={e=>field('endsOn',e.target.value)}/></Field>
    <Field label="Vertragsbetrag"><Input required inputMode="decimal" value={draft.amount} onChange={e=>field('amount',e.target.value)} maxLength={13}/></Field><Field label="Währung"><Select value={draft.currency} onChange={e=>field('currency',e.target.value)}><option value="CHF">CHF</option><option value="EUR">EUR</option></Select></Field>
    {draft.model==='annual'?<Field label="Jahreslohnbasis"><Select required value={draft.annualBasis} onChange={e=>setDraft(d=>({...d,annualBasis:e.target.value,entitlement:e.target.value?(e.target.value==='without_13th'?'no':'yes'):'',thirteenthPayoutMonth:''}))}><option value="">{t('Bitte wählen')}</option>{Object.entries(basisLabels).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>:<Field label="Anspruch auf 13. Monatslohn"><Select required value={draft.entitlement} onChange={e=>setDraft(d=>({...d,entitlement:e.target.value,thirteenthPayoutMonth:''}))}><option value="">{t('Bitte wählen')}</option><option value="yes">{t('Ja')}</option><option value="no">{t('Nein')}</option></Select></Field>}
    <Field label="Auszahlungstag"><Select required value={draft.payoutDay} onChange={e=>field('payoutDay',e.target.value)}><option value="">{t('Bitte wählen')}</option>{Array.from({length:28},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}<option value="last_day">{t('Monatsletzter')}</option></Select></Field>
    {draft.entitlement==='yes'&&<Field label="Auszahlungsmonat 13. Monatslohn"><Select required value={draft.thirteenthPayoutMonth} onChange={e=>field('thirteenthPayoutMonth',e.target.value)}><option value="">{t('Bitte wählen')}</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</Select></Field>}
   </div></form>}
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy||!mayWrite||periods.loading||!!periods.error||!currentPeriods.length}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
  </FormSheet>
 </section>;
}
