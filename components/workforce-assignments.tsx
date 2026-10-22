"use client";
import {useId,useRef,useState} from 'react';
import {isPlanId,planAllowsModule} from '@/config/plan-access';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPost,apiPatch} from '@/lib/client/backend';
import {businessDate} from '@/lib/financial-status';
import {LocalizedText} from '@/lib/client/locale';
import {Button,Field,Input,Select,SectionTitle,ErrorState,LoadingState,EmptyState,FormActions,Status} from './ui';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import ConfirmDialog from './confirm-dialog';
import {DirectorySelect} from './directory-select';

type Assignment={id:string;employee_name:string;customer_name:string;project_name:string|null;starts_on:string;ends_on:string|null;revoked_at:string|null};
type Payload={items:Assignment[];employees:Array<{id:string;name:string;user_id:string|null}>;members:Array<{user_id:string;email:string;role:string}>};
export function WorkforceAssignments(){
 const formId=useId();
 const session=useApiQuery<{tenant?:{plan?:string}}>('/api/auth/session'),plan=session.data?.tenant?.plan;
 const canBind=!!plan&&isPlanId(plan)&&planAllowsModule(plan,'personal');
 const data=useApiQuery<Payload>('/api/workforce-assignments');
 const [open,setOpen]=useState(false),[employee,setEmployee]=useState(''),[user,setUser]=useState(''),[customer,setCustomer]=useState(''),[project,setProject]=useState(''),[start,setStart]=useState(businessDate),[end,setEnd]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revoking,setRevoking]=useState<string|null>(null);const pending=useRef(false);
 const [identityOnly,setIdentityOnly]=useState(false);const bindingAttempt=useRef<{body:string;key:string}|null>(null);
 const close=()=>{setOpen(false);setIdentityOnly(false);bindingAttempt.current=null;setEmployee('');setUser('');setCustomer('');setProject('');setEnd('');setStart(businessDate());};
 const mutate=async(revoke?:string)=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');try{if(revoke)await apiPatch('/api/workforce-assignments',{id:revoke});else if(identityOnly){const body={mode:'bind_identity',employeeId:employee,userId:user,expectedUserId:data.data?.employees.find(item=>item.id===employee)?.user_id??null},serialized=JSON.stringify(body);if(bindingAttempt.current?.body!==serialized)bindingAttempt.current={body:serialized,key:crypto.randomUUID()};await apiPost('/api/workforce-assignments',body,{idempotencyKey:bindingAttempt.current.key});}else await apiPost('/api/workforce-assignments',{employeeId:employee,userId:user,customerId:customer,projectId:project||null,startsOn:start,endsOn:end||null});setRevoking(null);close();data.refresh();}catch(e){setError(e instanceof Error?e.message:'Zuordnung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false)}};
 return <section className="bo-workspace-section"><SectionTitle title="Zuordnungen" action={<ActionsMenu label="Zuordnungsaktionen"><ActionRow requiresWrite icon="plus" title="Zuordnung hinzufügen" onClick={()=>{setIdentityOnly(false);setOpen(true)}}/>{canBind&&<ActionRow requiresWrite icon="user" title="Mitarbeiterzugang verknüpfen" onClick={()=>{setIdentityOnly(true);setOpen(true)}}/>}</ActionsMenu>}/><p className="technical-hint"><LocalizedText>{'Mitarbeitende sehen nur freigegebene Kunden und Aufträge. Eine Kundenzuordnung ohne Auftrag erlaubt die direkte Zeiterfassung.'}</LocalizedText></p>
 {data.loading?<LoadingState/>:data.error?<ErrorState onRetry={data.refresh}>{data.error}</ErrorState>:!data.data?.items.length?<EmptyState  title="Keine Zuordnungen" />:<div className="action-list">{data.data.items.map(item=><div key={item.id} className="assignment-row"><div><b>{item.employee_name}</b><p>{item.customer_name}{item.project_name?' · '+item.project_name:''}</p><small>{String(item.starts_on).slice(0,10)}{item.ends_on?' – '+String(item.ends_on).slice(0,10):''}</small></div><Status tone={!item.revoked_at&&String(item.starts_on).slice(0,10)<=businessDate()&&(!item.ends_on||String(item.ends_on).slice(0,10)>=businessDate())?'success':'neutral'}>{item.revoked_at||item.ends_on&&String(item.ends_on).slice(0,10)<businessDate()?'Beendet':String(item.starts_on).slice(0,10)>businessDate()?'Geplant':'Aktiv'}</Status>{!item.revoked_at&&<ActionsMenu label="Zuordnungsaktionen"><ActionRow requiresWrite icon="close" title="Zugriff entziehen" danger onClick={()=>setRevoking(item.id)}/></ActionsMenu>}</div>)}</div>}
 {error&&!open&&<ErrorState>{error}</ErrorState>}
 <FormSheet open={open} onClose={close} label={identityOnly?"Mitarbeiterzugang verknüpfen":"Zuordnung"} busy={busy} dirty={!!(employee||user||customer||project||end)||start!==businessDate()}>
 <form id={formId} onSubmit={event=>{event.preventDefault();void mutate()}}>
 <Field label="Mitarbeiter"><Select required value={employee} onChange={e=>{setEmployee(e.target.value);setUser(data.data?.employees.find(item=>item.id===e.target.value)?.user_id??'')}}><option value="">—</option>{data.data?.employees.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Zugang"><Select required value={user} onChange={e=>setUser(e.target.value)}><option value="">—</option>{data.data?.members.map(item=><option key={item.user_id} value={item.user_id}>{item.email}</option>)}</Select></Field>
 {!identityOnly&&<>
 <Field label="Kunde"><DirectorySelect label="Kunde" required endpoint="/api/customers" value={customer} onChange={value=>{setCustomer(value);setProject('')}}/></Field>
 <Field label="Auftrag"><DirectorySelect label="Auftrag" endpoint={customer?"/api/projects":null} disabled={!customer} customerId={customer} emptyLabel="Ohne Auftrag" value={project} onChange={setProject}/></Field>
 <Field label="Beginn"><Input required type="date" value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Ende"><Input type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></Field>
 </>}
 {identityOnly&&<p><LocalizedText>{"Die Verknüpfung erstellt weder ein Konto noch eine Kunden- oder Auftragsfreigabe."}</LocalizedText></p>}
 </form>{error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" onClick={close}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite disabled={busy||!employee||!user||!identityOnly&&(!customer||!start)} type="submit" form={formId}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
 </FormSheet><ConfirmDialog open={!!revoking} title="Zugriff entziehen?" message="Neue Erfassungen werden gesperrt. Bereits erfasste Zeiten und Nachweise bleiben erhalten." busy={busy} onCancel={()=>setRevoking(null)} onConfirm={()=>{if(revoking)void mutate(revoking)}}/>
 </section>;
}
