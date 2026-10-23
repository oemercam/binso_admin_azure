"use client";
import {useId,useRef,useState} from 'react';
import {apiPatch,apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatQuantity,formatTimestampDate} from '@/lib/display-format';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Status} from './ui';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';

type Period={id:string;period_id:string;revision:number;is_current:boolean;starts_on:string;ends_on:string|null;workload_percent:string;weekly_hours:string;vacation_days:string;job_title:string;work_location:string|null};
type Draft={startsOn:string;endsOn:string;workloadPercent:string;weeklyHours:string;vacationDays:string;jobTitle:string;workLocation:string};
export function EmploymentPeriods({employeeId,mayWrite,prefill}:{employeeId:string;mayWrite:boolean;prefill:Draft}){
 const endpoint='/api/employees/'+encodeURIComponent(employeeId)+'/employment';
 const query=useApiQuery<{items:Period[]}>(endpoint),formId=useId(),{locale}=useLocale(),translate=useTranslation();
 const [open,setOpen]=useState(false),[selected,setSelected]=useState<Period|null>(null),[draft,setDraft]=useState<Draft>(prefill),[initial,setInitial]=useState(JSON.stringify(prefill));
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const date=(value:string)=>formatTimestampDate(value+'T00:00:00Z',localeTags[locale]);
 const edit=(period:Period|null)=>{
  const next=period?{startsOn:period.starts_on,endsOn:period.ends_on??'',workloadPercent:String(period.workload_percent),weeklyHours:String(period.weekly_hours),vacationDays:String(period.vacation_days),jobTitle:period.job_title,workLocation:period.work_location??''}:prefill;
  setSelected(period);setDraft(next);setInitial(JSON.stringify(next));setError('');attempt.current=null;setOpen(true);
 };
 const field=(key:keyof Draft,value:string)=>setDraft(current=>({...current,[key]:value}));
 const save=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   const payload={...draft,endsOn:draft.endsOn||null,workloadPercent:Number(draft.workloadPercent),weeklyHours:Number(draft.weeklyHours),vacationDays:Number(draft.vacationDays),...(selected?{expectedRevision:selected.revision}:{})};
   const serialized=JSON.stringify(payload);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const validate=(result:unknown)=>{if(!result||typeof result!=='object'||!('item' in result)||!result.item||typeof result.item!=='object'||!('id' in result.item)||!result.item.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');};
   if(selected)await apiPatch(endpoint+'/'+encodeURIComponent(selected.period_id),payload,validate,{idempotencyKey:attempt.current.key});
   else await apiPost(endpoint,payload,{idempotencyKey:attempt.current.key,validate});
   setOpen(false);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return <section className="bo-workspace-section">
  <SectionTitle title="Anstellungsperioden" action={mayWrite?<ActionsMenu label="Anstellungsaktionen"><ActionRow requiresWrite icon="plus" title="Anstellungsperiode hinzufügen" onClick={()=>edit(null)}/></ActionsMenu>:undefined}/>
  <p className="technical-hint"><LocalizedText>{'Vertragsstände bleiben als Revisionen erhalten. Eine Anstellung erstellt keinen App-Zugang und löst keine Lohnzahlung aus.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?.items.length?<EmptyState title="Keine Anstellungsperioden"/>:<div className="action-list">{query.data.items.map(period=><div key={period.id} className="assignment-row">
   <div><b>{period.job_title}</b><p>{date(period.starts_on)}{' – '}{period.ends_on?date(period.ends_on):<LocalizedText>{'Unbefristet'}</LocalizedText>}</p><small>{formatQuantity(period.workload_percent,'%',localeTags[locale])}{' · '}{formatQuantity(period.weekly_hours,translate('h/Woche'),localeTags[locale])}{period.work_location?' · '+period.work_location:''}</small></div>
   <Status tone={period.is_current?'info':'neutral'}><LocalizedText>{period.is_current?'Aktueller Vertragsstand':'Frühere Revision'}</LocalizedText>{' · '}{period.revision}</Status>
   {mayWrite&&period.is_current&&<ActionsMenu label="Anstellungsaktionen"><ActionRow requiresWrite icon="edit" title="Vertragsstand korrigieren" onClick={()=>edit(period)}/></ActionsMenu>}
  </div>)}</div>}
  <FormSheet open={open} onClose={()=>setOpen(false)} label={selected?'Vertragsstand korrigieren':'Anstellungsperiode hinzufügen'} dirty={JSON.stringify(draft)!==initial} busy={busy}>
   <form id={formId} onSubmit={event=>{event.preventDefault();void save();}}>
    <div className="form-grid two">
     <Field label="Eintritt"><Input required type="date" value={draft.startsOn} onChange={event=>field('startsOn',event.target.value)}/></Field>
     <Field label="Austritt"><Input type="date" min={draft.startsOn||undefined} value={draft.endsOn} onChange={event=>field('endsOn',event.target.value)}/></Field>
     <Field label="Funktion"><Input required maxLength={160} value={draft.jobTitle} onChange={event=>field('jobTitle',event.target.value)}/></Field>
     <Field label="Arbeitsort"><Input maxLength={180} value={draft.workLocation} onChange={event=>field('workLocation',event.target.value)}/></Field>
     <Field label="Pensum (%)"><Input required type="number" min="0" max="100" step="0.01" value={draft.workloadPercent} onChange={event=>field('workloadPercent',event.target.value)}/></Field>
     <Field label="Wochenstunden (h/Woche)"><Input required type="number" min="0.01" max="80" step="0.01" value={draft.weeklyHours} onChange={event=>field('weeklyHours',event.target.value)}/></Field>
     <Field label="Ferientage" hint="Pro Jahr"><Input required type="number" min="0" max="60" step="0.01" value={draft.vacationDays} onChange={event=>field('vacationDays',event.target.value)}/></Field>
    </div>
   </form>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
  </FormSheet>
 </section>;
}
