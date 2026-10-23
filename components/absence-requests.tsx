"use client";
import {useId,useRef,useState} from 'react';
import {apiPost,apiPatch} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatQuantity} from '@/lib/display-format';
import {absenceRequestIssue,absenceTypes,type AbsenceRequestInput,type AbsenceType} from '@/lib/absence-request';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select,Status} from './ui';
import {DirectorySelect} from './directory-select';
import ConfirmDialog from './confirm-dialog';
type Absence={id:string;employee_id:string;employee_name:string;absence_type:AbsenceType;start_date:string;end_date:string;days:string;status:'open'|'approved'|'rejected'|'cancelled';version:number;is_v26_request:boolean;created_by_user_id:string;beneficiary_user_id:string|null;employment_current:boolean};
type Data={items:Absence[];total:number;ownEmployeeId:string|null;mayRequest:boolean;mayReadTeam:boolean;mayReview:boolean};
const statusLabels={open:'Offen',approved:'Genehmigt',rejected:'Abgelehnt',cancelled:'Zurückgezogen'};
const reviewTitles={approved:'Antrag genehmigen?',rejected:'Antrag ablehnen?',cancelled:'Antrag zurückziehen?'};
const empty:AbsenceRequestInput={employeeId:'',employmentRevisionId:'',absenceType:'vacation',startDate:'',endDate:'',days:''};
export function AbsenceRequests({scope}:{scope:'self'|'team'}){
 const [page,setPage]=useState(0),endpoint='/api/absences?scope='+scope+'&offset='+page*50,query=useApiQuery<Data>(endpoint),actor=useApiQuery<{user?:{id?:string}}>('/api/auth/session'),t=useTranslation(),{locale}=useLocale(),formId=useId();
 const [open,setOpen]=useState(false),[draft,setDraft]=useState<AbsenceRequestInput>(empty),[initial,setInitial]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[review,setReview]=useState<{item:Absence;status:'approved'|'rejected'|'cancelled'}|null>(null);
 const periods=useApiQuery<{items:{id:string;revision:number;starts_on:string;ends_on:string|null;job_title:string}[]}>(open&&draft.employeeId?'/api/absences/context?employeeId='+encodeURIComponent(draft.employeeId):null),pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const start=()=>{const next={...empty,employeeId:query.data?.ownEmployeeId??''};setDraft(next);setInitial(JSON.stringify(next));setError('');attempt.current=null;setOpen(true);};
 const mutate=async()=>{
  if(pending.current)return;const body=review?{status:review.status,expectedRevision:review.item.version}:draft;
  if(!review){const issue=absenceRequestIssue(body);if(issue){setError(issue);return;}}
  pending.current=true;setBusy(true);setError('');
  try{
   const serialized=JSON.stringify({id:review?.item.id,body});if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const validate=(result:unknown)=>{if(!result||typeof result!=='object'||!('item' in result)||!result.item||typeof result.item!=='object'||!('id' in result.item)||!result.item.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');};
   if(review)await apiPatch('/api/absences/'+encodeURIComponent(review.item.id),body,validate,{idempotencyKey:attempt.current.key});else await apiPost('/api/absences',body,{validate,idempotencyKey:attempt.current.key});
   setOpen(false);setReview(null);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');setReview(null);}finally{pending.current=false;setBusy(false);}
 };
 const field=(key:keyof AbsenceRequestInput,value:string)=>setDraft(d=>({...d,[key]:value}));
 const chooseReview=(item:Absence,status:'approved'|'rejected'|'cancelled')=>{setReview({item,status});setError('');};
 const mayCreate=scope==='team'?query.data?.mayReview:query.data?.mayRequest;
 return <section className="bo-workspace-section">
  <SectionTitle title={scope==='self'?'Meine Abwesenheiten':'Abwesenheitsanträge'} action={mayCreate?<ActionsMenu label="Abwesenheitsaktionen"><ActionRow requiresWrite icon="plus" title="Abwesenheit beantragen" onClick={start}/></ActionsMenu>:undefined}/>
  <p><LocalizedText>{'Beantragte Tage werden ausdrücklich erfasst. Keine automatische Feiertagsberechnung, Ferienbuchung oder Lohnzahlung. Keine Diagnosen erfassen.'}</LocalizedText></p>
  {error&&!open&&<ErrorState>{error}</ErrorState>}
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:scope==='self'&&!query.data?.ownEmployeeId?<EmptyState title="Kein Mitarbeiterdossier verknüpft"/>:!query.data?.items.length?<EmptyState title="Keine Abwesenheitsanträge"/>:<div className="action-list">{query.data.items.map(item=>{
   const independent=!!actor.data?.user?.id&&actor.data.user.id!==item.created_by_user_id&&actor.data.user.id!==item.beneficiary_user_id,mayReview=query.data?.mayReview&&independent;
   const mayWithdraw=item.status==='open'&&(query.data?.mayReview||query.data?.mayRequest&&item.employee_id===query.data.ownEmployeeId)||item.status==='approved'&&mayReview;
   return <div className="assignment-row" key={item.id}><div><b>{scope==='team'?item.employee_name:<LocalizedText>{absenceTypes[item.absence_type]}</LocalizedText>}</b>{scope==='team'&&<p><LocalizedText>{absenceTypes[item.absence_type]}</LocalizedText></p>}<p>{item.start_date}{' – '}{item.end_date}{' · '}{formatQuantity(item.days,t('Tage'),localeTags[locale])}</p>{item.is_v26_request&&item.status==='open'&&!item.employment_current&&<ErrorState><LocalizedText>{'Die Anstellung wurde geändert. Bitte den Antrag neu erfassen.'}</LocalizedText></ErrorState>}</div><Status tone={item.status==='approved'?'info':'neutral'}><LocalizedText>{statusLabels[item.status]}</LocalizedText></Status>
    {item.is_v26_request&&(mayReview&&item.status==='open'||mayWithdraw)&&<ActionsMenu label="Abwesenheitsaktionen">{mayReview&&item.status==='open'&&<><ActionRow requiresWrite icon="check" title="Genehmigen" onClick={()=>chooseReview(item,'approved')}/><ActionRow requiresWrite icon="close" title="Ablehnen" onClick={()=>chooseReview(item,'rejected')}/></>}{mayWithdraw&&<ActionRow requiresWrite icon="close" title="Antrag zurückziehen" onClick={()=>chooseReview(item,'cancelled')}/>}</ActionsMenu>}
   </div>;
  })}</div>}
  {!!query.data?.total&&query.data.total>50&&<FormActions><Button variant="secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}><LocalizedText>{'Zurück'}</LocalizedText></Button><Button variant="secondary" disabled={(page+1)*50>=query.data.total} onClick={()=>setPage(p=>p+1)}><LocalizedText>{'Weiter'}</LocalizedText></Button></FormActions>}
  <FormSheet open={open} onClose={()=>setOpen(false)} label="Abwesenheit beantragen" dirty={JSON.stringify(draft)!==initial} busy={busy}>
   <form id={formId} onSubmit={e=>{e.preventDefault();void mutate();}}><div className="form-grid two">
    {scope==='team'&&<Field label="Mitarbeiter"><DirectorySelect label="Mitarbeiter" required endpoint="/api/employees" value={draft.employeeId} onChange={id=>setDraft(d=>({...d,employeeId:id,employmentRevisionId:''}))}/></Field>}
    <Field label="Anstellungsrevision"><Select required value={draft.employmentRevisionId} onChange={e=>field('employmentRevisionId',e.target.value)}><option value="">{t('Bitte wählen')}</option>{periods.data?.items.map(p=><option key={p.id} value={p.id}>{p.job_title}{' · '}{p.starts_on}{' · '}{p.revision}</option>)}</Select></Field>
    <Field label="Abwesenheitsart"><Select value={draft.absenceType} onChange={e=>field('absenceType',e.target.value)}>{Object.entries(absenceTypes).map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</Select></Field>
    <Field label="Von"><Input required type="date" value={draft.startDate} onChange={e=>field('startDate',e.target.value)}/></Field><Field label="Bis"><Input required type="date" min={draft.startDate||undefined} value={draft.endDate} onChange={e=>field('endDate',e.target.value)}/></Field>
    <Field label="Beantragte Tage"><Input required inputMode="decimal" maxLength={7} value={draft.days} onChange={e=>field('days',e.target.value)}/></Field>
   </div></form>
   {periods.loading&&<LoadingState/>}{periods.error&&<ErrorState onRetry={periods.refresh}>{periods.error}</ErrorState>}{error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy||!mayCreate||periods.loading||!!periods.error}><LocalizedText>{'Antrag einreichen'}</LocalizedText></Button></FormActions>
  </FormSheet>
  <ConfirmDialog open={!!review} busy={busy} title={review?reviewTitles[review.status]:'Antrag genehmigen?'} message="Der gewählte Status wird verbindlich gespeichert. Eine Genehmigung darf nur durch eine andere berechtigte Person erfolgen." onCancel={()=>setReview(null)} onConfirm={()=>void mutate()}/>
 </section>;
}
