"use client";
import {useId,useRef,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPost,apiPatch} from '@/lib/client/backend';
import {LocalizedText,useLocale,useTranslation} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {formatQuantity} from '@/lib/display-format';
import {childInputIssue,allowanceInputIssue,type ChildInput,type AllowanceInput} from '@/lib/employee-family';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Select,Status,Toggle} from './ui';
type Child={id:string;child_id:string;revision:number;is_current:boolean;display_name:string;birth_date:string;active:boolean};
type Claim={id:string;claim_id:string;revision:number;is_current:boolean;child_revision_id:string;employment_revision_id:string;allowance_type:'child'|'education';starts_on:string;ends_on:string;authority:string;canton:string;decision_reference:string;monthly_amount:string;currency:'CHF';status:AllowanceInput['status'];claim_current:boolean;requested_by_user_id:string;created_by_user_id:string};
type Period={id:string;is_current:boolean;starts_on:string;ends_on:string|null;job_title:string;revision:number};
type ClaimDraft=Omit<AllowanceInput,'expectedRevision'>;
const emptyChild:ChildInput={displayName:'',birthDate:'',active:true};
const emptyClaim:ClaimDraft={childRevisionId:'',employmentRevisionId:'',allowanceType:'child',startsOn:'',endsOn:'',authority:'',canton:'',decisionReference:'',monthlyAmount:'',currency:'CHF',status:'draft'};
const allowanceLabel={child:'Kinderzulage',education:'Ausbildungszulage'};
const statusLabel:Record<Claim['status'],string>={draft:'Entwurf',verified:'Kassenentscheid geprüft',rejected:'Abgelehnt',revoked:'Widerrufen'};
function claimBody(c:Claim):ClaimDraft{return {childRevisionId:c.child_revision_id,employmentRevisionId:c.employment_revision_id,allowanceType:c.allowance_type,startsOn:c.starts_on,endsOn:c.ends_on,authority:c.authority,canton:c.canton,decisionReference:c.decision_reference,monthlyAmount:c.monthly_amount,currency:c.currency,status:c.status};}
export function EmployeeFamily({employeeId,mayWrite,actorId}:{employeeId:string;mayWrite:boolean;actorId?:string}){
 const base='/api/employees/'+encodeURIComponent(employeeId),query=useApiQuery<{children:Child[];claims:Claim[]}>(base+'/family'),periods=useApiQuery<{items:Period[]}>(base+'/employment'),formId=useId(),t=useTranslation(),{locale}=useLocale();
 const [mode,setMode]=useState<'child'|'claim'|null>(null),[child,setChild]=useState<Child|null>(null),[claim,setClaim]=useState<Claim|null>(null),[childDraft,setChildDraft]=useState(emptyChild),[draft,setDraft]=useState<ClaimDraft>(emptyClaim),[initial,setInitial]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),attempt=useRef<{body:string;key:string}|null>(null);
 const activeChildren=query.data?.children.filter(c=>c.is_current&&c.active)??[],currentPeriods=periods.data?.items.filter(p=>p.is_current)??[];
 const openChild=(c:Child|null)=>{const d=c?{displayName:c.display_name,birthDate:c.birth_date,active:c.active}:{...emptyChild};setChild(c);setClaim(null);setChildDraft(d);setInitial(JSON.stringify(d));setMode('child');setError('');attempt.current=null;};
 const openClaim=(c:Claim|null)=>{const d=c?claimBody(c):{...emptyClaim};setClaim(c);setChild(null);setDraft(d);setInitial(JSON.stringify(d));setMode('claim');setError('');attempt.current=null;};
 const review=mode==='claim'&&claim?.status!=='draft'&&!!claim;
 const canReview=!!actorId&&actorId!==claim?.requested_by_user_id&&actorId!==claim?.created_by_user_id;
 const save=async(status:Claim['status']='draft')=>{
  if(pending.current||!mode||!mayWrite)return;
  const body=mode==='child'?{...childDraft,...(child?{expectedRevision:child.revision}:{})}:{...draft,status,...(claim?{expectedRevision:claim.revision}:{})};
  const issue=mode==='child'?childInputIssue(body):allowanceInputIssue(body);if(issue){setError(issue);return;}
  pending.current=true;setBusy(true);setError('');
  try{
   const serialized=JSON.stringify(body);if(attempt.current?.body!==serialized)attempt.current={body:serialized,key:crypto.randomUUID()};
   const path=mode==='child'?base+'/family'+(child?'/'+encodeURIComponent(child.child_id):''):base+'/allowances'+(claim?'/'+encodeURIComponent(claim.claim_id):'');
   const validate=(result:unknown)=>{if(!result||typeof result!=='object'||!('item' in result)||!result.item||typeof result.item!=='object'||!('id' in result.item)||!result.item.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');};
   if(child||claim)await apiPatch(path,body,validate,{idempotencyKey:attempt.current.key});else await apiPost(path,body,{validate,idempotencyKey:attempt.current.key});
   setMode(null);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false);}
 };
 const field=(key:keyof ClaimDraft,value:string)=>setDraft(d=>({...d,[key]:value}));
 return <section className="bo-workspace-section">
  <SectionTitle title="Familie und Zulagen" action={mayWrite?<ActionsMenu label="Familienaktionen"><ActionRow requiresWrite icon="plus" title="Kind erfassen" onClick={()=>openChild(null)}/><ActionRow requiresWrite icon="plus" title="Kassenentscheid erfassen" onClick={()=>openClaim(null)}/></ActionsMenu>:undefined}/>
  <p><LocalizedText>{'Kinderdaten lösen keine Zulage aus. Kassenentscheid, Zeitraum und Betrag werden separat erfasst und unabhängig geprüft. Keine Lohnzahlung.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:<>
   <SectionTitle title="Kinder"/>{!query.data?.children.length?<EmptyState title="Keine Kinder erfasst"/>:<div className="action-list">{query.data.children.map(c=><div className="assignment-row" key={c.id}><div><b>{c.display_name}</b><p>{c.birth_date}</p></div><Status tone={c.is_current&&c.active?'info':'neutral'}><LocalizedText>{c.is_current?(c.active?'Aktiv':'Inaktiv'):'Frühere Revision'}</LocalizedText>{' · '}{c.revision}</Status>{mayWrite&&c.is_current&&<ActionsMenu label="Familienaktionen"><ActionRow requiresWrite icon="edit" title="Kinderdaten korrigieren" onClick={()=>openChild(c)}/></ActionsMenu>}</div>)}</div>}
   <SectionTitle title="Zulagenentscheide"/>{!query.data?.claims.length?<EmptyState title="Keine Zulagenentscheide"/>:<div className="action-list">{query.data.claims.map(c=><div className="assignment-row" key={c.id}><div><b><LocalizedText>{allowanceLabel[c.allowance_type]}</LocalizedText>{' · '}{formatQuantity(c.monthly_amount,'CHF',localeTags[locale])}</b><p>{c.starts_on}{' – '}{c.ends_on}</p><small>{c.authority}{' · '}{c.canton}{' · '}{c.decision_reference}</small>{c.is_current&&c.status==='verified'&&!c.claim_current&&<ErrorState><LocalizedText>{'Entscheid aktuell nicht wirksam: Zeitraum oder Quellrevision prüfen.'}</LocalizedText></ErrorState>}</div><Status tone={c.status==='verified'&&c.claim_current?'info':'neutral'}><LocalizedText>{c.is_current?statusLabel[c.status]:'Frühere Revision'}</LocalizedText>{' · '}{c.revision}</Status><Button variant="secondary" onClick={()=>openClaim(c)}><LocalizedText>{'Details'}</LocalizedText></Button></div>)}</div>}
  </>}
  <FormSheet open={mode!==null} onClose={()=>setMode(null)} label={mode==='child'?(child?'Kinderdaten korrigieren':'Kind erfassen'):'Kassenentscheid'} busy={busy} dirty={JSON.stringify(mode==='child'?childDraft:draft)!==initial}>
   <form id={formId} onSubmit={e=>{e.preventDefault();void save();}}>
    {mode==='child'?<div className="form-grid two"><Field label="Name des Kindes"><Input required maxLength={160} value={childDraft.displayName} onChange={e=>setChildDraft(d=>({...d,displayName:e.target.value}))}/></Field><Field label="Geburtsdatum"><Input required type="date" value={childDraft.birthDate} onChange={e=>setChildDraft(d=>({...d,birthDate:e.target.value}))}/></Field><Toggle label="Aktiv" checked={childDraft.active} onChange={()=>setChildDraft(d=>({...d,active:!d.active}))}/></div>:<>
     {periods.error&&<ErrorState onRetry={periods.refresh}>{periods.error}</ErrorState>}
     <fieldset disabled={busy||review||!!claim&&!claim.is_current||!mayWrite}>
      <div className="form-grid two">
       <Field label="Kind"><Select required value={draft.childRevisionId} onChange={e=>field('childRevisionId',e.target.value)}><option value="">{t('Bitte wählen')}</option>{!activeChildren.some(c=>c.id===draft.childRevisionId)&&draft.childRevisionId&&<option value={draft.childRevisionId}>{t('Frühere Revision')}</option>}{activeChildren.map(c=><option key={c.id} value={c.id}>{c.display_name}{' · '}{c.revision}</option>)}</Select></Field>
       <Field label="Anstellungsrevision"><Select required value={draft.employmentRevisionId} onChange={e=>field('employmentRevisionId',e.target.value)}><option value="">{t('Bitte wählen')}</option>{!currentPeriods.some(p=>p.id===draft.employmentRevisionId)&&draft.employmentRevisionId&&<option value={draft.employmentRevisionId}>{t('Frühere Revision')}</option>}{currentPeriods.map(p=><option key={p.id} value={p.id}>{p.job_title}{' · '}{p.starts_on}{' · '}{p.revision}</option>)}</Select></Field>
       <Field label="Zulagenart"><Select value={draft.allowanceType} onChange={e=>field('allowanceType',e.target.value)}><option value="child">{t('Kinderzulage')}</option><option value="education">{t('Ausbildungszulage')}</option></Select></Field>
       <Field label="Ausgleichskasse"><Input required maxLength={180} value={draft.authority} onChange={e=>field('authority',e.target.value)}/></Field>
       <Field label="Kanton"><Select required value={draft.canton} onChange={e=>field('canton',e.target.value)}><option value="">{t('Bitte wählen')}</option>{['AG','AI','AR','BE','BL','BS','FR','GE','GL','GR','JU','LU','NE','NW','OW','SG','SH','SO','SZ','TG','TI','UR','VD','VS','ZG','ZH'].map(c=><option key={c} value={c}>{c}</option>)}</Select></Field>
       <Field label="Kassenentscheid-Referenz"><Input required maxLength={180} value={draft.decisionReference} onChange={e=>field('decisionReference',e.target.value)}/></Field>
       <Field label="Gültig ab"><Input required type="date" value={draft.startsOn} onChange={e=>field('startsOn',e.target.value)}/></Field><Field label="Gültig bis"><Input required type="date" min={draft.startsOn||undefined} value={draft.endsOn} onChange={e=>field('endsOn',e.target.value)}/></Field>
       <Field label="Bestätigter Monatsbetrag (CHF)"><Input required inputMode="decimal" maxLength={13} value={draft.monthlyAmount} onChange={e=>field('monthlyAmount',e.target.value)}/></Field>
      </div>
     </fieldset>
    </>}
   </form>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={()=>setMode(null)}><LocalizedText>{'Schliessen'}</LocalizedText></Button>
    {mayWrite&&(mode==='child'||!claim||claim.is_current&&claim.status==='draft')&&<Button requiresWrite type="submit" form={formId} disabled={busy||mode==='claim'&&(periods.loading||!!periods.error)}><LocalizedText>{'Speichern'}</LocalizedText></Button>}
    {mayWrite&&claim?.is_current&&claim.status==='draft'&&canReview&&<><Button requiresWrite variant="secondary" disabled={busy||JSON.stringify(draft)!==initial} onClick={()=>void save('rejected')}><LocalizedText>{'Ablehnen'}</LocalizedText></Button><Button requiresWrite disabled={busy||JSON.stringify(draft)!==initial} onClick={()=>void save('verified')}><LocalizedText>{'Kassenentscheid geprüft bestätigen'}</LocalizedText></Button></>}
    {mayWrite&&claim?.is_current&&claim.status==='verified'&&actorId&&actorId!==claim.requested_by_user_id&&<Button requiresWrite variant="secondary" disabled={busy} onClick={()=>void save('revoked')}><LocalizedText>{'Entscheid widerrufen'}</LocalizedText></Button>}
   </FormActions>
  </FormSheet>
 </section>;
}
