"use client";
import {useId,useRef,useState} from 'react';
import {apiPatch,apiPost} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {businessDate} from '@/lib/financial-status';
import {formatTimestampDate} from '@/lib/display-format';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import {Button,EmptyState,ErrorState,Field,FormActions,Input,LoadingState,SectionTitle,Status,Toggle} from './ui';
import {DirectorySelect} from './directory-select';
import ConfirmDialog from './confirm-dialog';
import {useProcessDraft} from './use-process-draft';

type Resource={id:string;name:string;role_label:string|null;active:boolean;version:number};
type Assignment={id:string;resource_id:string;project_id:string;project_name:string;starts_on:string;ends_on:string|null;revoked_at:string|null;version:number};
type Attempt={body:string;key:string;endpoint:string};
export function ExternalResources({supplierId}:{supplierId:string}){
 const endpoint='/api/suppliers/'+encodeURIComponent(supplierId)+'/resources',query=useApiQuery<{items:Resource[];assignments:Assignment[]}>(endpoint),formId=useId(),{locale}=useLocale();
 const [mode,setMode]=useState<'resource'|'assignment'|null>(null),[selected,setSelected]=useState<Resource|null>(null),[name,setName]=useState(''),[roleLabel,setRoleLabel]=useState(''),[active,setActive]=useState(true),[project,setProject]=useState(''),[start,setStart]=useState(businessDate),[end,setEnd]=useState(''),[original,setOriginal]=useState('');
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState<Attempt|null>(null),[revoking,setRevoking]=useState<Assignment|null>(null);const pending=useRef(false);
 const values={name,roleLabel,active,project,start,end},dirty=JSON.stringify(values)!==original;
 const recovery=useProcessDraft({process:'external-resource:'+supplierId,value:{name,roleLabel,active,replay:attempt},dirty:mode==='resource'&&!selected&&dirty,enabled:mode==='resource'&&!selected,onRestore:value=>{
  if(!value||typeof value.name!=='string'||value.name.length>200||typeof value.roleLabel!=='string'||value.roleLabel.length>160||typeof value.active!=='boolean')return;
  setName(value.name);setRoleLabel(value.roleLabel);setActive(value.active);
  if(value.replay&&typeof value.replay.body==='string'&&value.replay.body.length<=4096&&typeof value.replay.key==='string'&&value.replay.key.length>=8&&value.replay.key.length<=128&&value.replay.endpoint===endpoint)setAttempt(value.replay);
 }});
 const edit=(resource:Resource|null,kind:'resource'|'assignment')=>{
  const next={name:resource?.name??'',roleLabel:resource?.role_label??'',active:resource?.active??true,project:'',start:businessDate(),end:''};
  setSelected(resource);setName(next.name);setRoleLabel(next.roleLabel);setActive(next.active);setProject('');setStart(next.start);setEnd('');setOriginal(JSON.stringify(next));setAttempt(null);setError('');setMode(kind);
 };
 const close=()=>{if(mode==='resource'&&!selected)recovery.clear();setMode(null);setError('');};
 const mutate=async(revoke?:Assignment)=>{
  if(pending.current||!revoke&&mode==='resource'&&!selected&&!recovery.ready)return;pending.current=true;setBusy(true);setError('');
  try{
   const resource=selected,resourceId=revoke?.resource_id??resource?.id;
   const target=revoke||mode==='assignment'?endpoint+'/'+encodeURIComponent(resourceId??'')+'/assignments':endpoint+(resource?'/'+encodeURIComponent(resource.id):'');
   const body=revoke?{id:revoke.id,expectedRevision:revoke.version}:mode==='assignment'?{projectId:project,startsOn:start,endsOn:end||null}:{name,roleLabel,active,...(resource?{expectedRevision:resource.version}:{})};
   const serialized=JSON.stringify(body),replay=attempt?.body===serialized&&attempt.endpoint===target?attempt:{body:serialized,key:crypto.randomUUID(),endpoint:target};setAttempt(replay);
   if(mode==='resource'&&!resource&&!revoke)recovery.persist({name,roleLabel,active,replay});
   const result=revoke||mode==='resource'&&resource?await apiPatch<{item:{id:string}}>(target,body,undefined,{idempotencyKey:replay.key}):await apiPost<{item:{id:string}}>(target,body,{idempotencyKey:replay.key});
   if(!result.item?.id)throw Error('Die Speicherung konnte nicht bestätigt werden. Bitte erneut versuchen.');
   recovery.clear();setRevoking(null);setMode(null);query.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:'Änderung konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 const date=(value:string)=>formatTimestampDate(value+'T00:00:00Z',localeTags[locale]);
 return <section className="surface"><SectionTitle title="Externe Ressourcen" action={<ActionsMenu label="Ressourcenaktionen"><ActionRow requiresWrite icon="plus" title="Externe Person hinzufügen" onClick={()=>edit(null,'resource')}/></ActionsMenu>}/>
  <p className="technical-hint"><LocalizedText>{'Externe Personen gehören zum Lieferanten. Es werden weder Mitarbeiterakte noch Benutzerkonto oder Lohnzahlung erstellt.'}</LocalizedText></p>
  {query.loading?<LoadingState/>:query.error?<ErrorState onRetry={query.refresh}>{query.error}</ErrorState>:!query.data?.items.length?<EmptyState title="Keine externen Ressourcen"/>:<div className="action-list">{query.data.items.map(resource=><div key={resource.id} className="assignment-row"><div><b>{resource.name}</b>{resource.role_label&&<p>{resource.role_label}</p>}</div><Status tone={resource.active?'success':'neutral'}><LocalizedText>{resource.active?'Aktiv':'Inaktiv'}</LocalizedText></Status><ActionsMenu label="Ressourcenaktionen"><ActionRow requiresWrite icon="edit" title="Bearbeiten" onClick={()=>edit(resource,'resource')}/>{resource.active&&<ActionRow requiresWrite icon="plus" title="Einsatz hinzufügen" onClick={()=>edit(resource,'assignment')}/>}</ActionsMenu></div>)}</div>}
  {!!query.data?.assignments.length&&<><SectionTitle title="Externe Einsätze"/><div className="action-list">{query.data.assignments.map(assignment=><div key={assignment.id} className="assignment-row"><div><b>{query.data?.items.find(resource=>resource.id===assignment.resource_id)?.name}</b><p>{assignment.project_name}</p><small>{date(assignment.starts_on)}{' – '}{assignment.ends_on?date(assignment.ends_on):<LocalizedText>{'Unbefristet'}</LocalizedText>}</small></div><Status tone={assignment.revoked_at||assignment.ends_on&&assignment.ends_on<businessDate()?'neutral':'info'}><LocalizedText>{assignment.revoked_at||assignment.ends_on&&assignment.ends_on<businessDate()?'Beendet':assignment.starts_on>businessDate()?'Geplant':'Aktiv'}</LocalizedText></Status>{!assignment.revoked_at&&<ActionsMenu label="Ressourcenaktionen"><ActionRow requiresWrite danger icon="close" title="Einsatz beenden" onClick={()=>{setError('');setAttempt(null);setRevoking(assignment)}}/></ActionsMenu>}</div>)}</div></>}
  {error&&!mode&&<ErrorState>{error}</ErrorState>}
  <FormSheet open={!!mode} onClose={close} label={mode==='assignment'?'Einsatz hinzufügen':selected?'Externe Person bearbeiten':'Externe Person hinzufügen'} dirty={dirty} busy={busy}>
   <form id={formId} onSubmit={event=>{event.preventDefault();void mutate();}}><div className="form-grid two">{mode==='assignment'?<>
    <p>{selected?.name}</p><Field label="Auftrag"><DirectorySelect label="Auftrag" required endpoint="/api/projects" value={project} onChange={setProject}/></Field>
    <Field label="Beginn"><Input required type="date" value={start} onChange={event=>setStart(event.target.value)}/></Field><Field label="Ende"><Input type="date" min={start||undefined} value={end} onChange={event=>setEnd(event.target.value)}/></Field>
   </>:<><Field label="Name"><Input required maxLength={200} value={name} onChange={event=>setName(event.target.value)}/></Field><Field label="Funktion"><Input maxLength={160} value={roleLabel} onChange={event=>setRoleLabel(event.target.value)}/></Field><Toggle label="Aktiv" checked={active} onChange={()=>setActive(value=>!value)}/></>}</div></form>
   {error&&<ErrorState>{error}</ErrorState>}
   <FormActions sheet><Button variant="secondary" disabled={busy} onClick={close}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite type="submit" form={formId} disabled={busy||mode==='resource'&&!selected&&!recovery.ready}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
  </FormSheet>
  <ConfirmDialog open={!!revoking} busy={busy} title="Einsatz beenden?" message="Neue Erfassungen werden gesperrt. Bereits erfasste Zeiten und Nachweise bleiben erhalten." confirmLabel="Einsatz beenden" onCancel={()=>setRevoking(null)} onConfirm={()=>{if(revoking)void mutate(revoking)}}/>
 </section>;
}
