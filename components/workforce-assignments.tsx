"use client";
import {useRef,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPost,apiPatch} from '@/lib/client/backend';
import {businessDate} from '@/lib/financial-status';
import {LocalizedText} from '@/lib/client/locale';
import {Button,Field,Input,Select,SectionTitle,ErrorState,LoadingState,EmptyState,FormActions,Status} from './ui';
import {ActionRow,ActionsMenu,FormSheet} from './binso-ux';
import ConfirmDialog from './confirm-dialog';

type Assignment={id:string;employee_name:string;customer_name:string;project_name:string|null;starts_on:string;ends_on:string|null;revoked_at:string|null};
type Payload={items:Assignment[];employees:Array<{id:string;name:string;user_id:string|null}>;members:Array<{user_id:string;email:string;role:string}>};
export function WorkforceAssignments(){
 const data=useApiQuery<Payload>('/api/workforce-assignments');
 const customers=useApiQuery<{items:Array<{id:string;name:string}>}>('/api/customers');
 const projects=useApiQuery<{items:Array<{id:string;name:string;customer_id:string|null}>}>('/api/projects');
 const [open,setOpen]=useState(false),[employee,setEmployee]=useState(''),[user,setUser]=useState(''),[customer,setCustomer]=useState(''),[project,setProject]=useState(''),[start,setStart]=useState(businessDate),[end,setEnd]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[revoking,setRevoking]=useState<string|null>(null);const pending=useRef(false);
 const close=()=>{setOpen(false);setEmployee('');setUser('');setCustomer('');setProject('');setEnd('');setStart(businessDate());};
 const mutate=async(revoke?:string)=>{if(pending.current)return;pending.current=true;setBusy(true);setError('');try{if(revoke)await apiPatch('/api/workforce-assignments',{id:revoke});else await apiPost('/api/workforce-assignments',{employeeId:employee,userId:user,customerId:customer,projectId:project||null,startsOn:start,endsOn:end||null});setRevoking(null);close();data.refresh();}catch(e){setError(e instanceof Error?e.message:'Zuordnung konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false)}};
 return <section className="bo-workspace-section"><SectionTitle title="Zuordnungen" action={<Button requiresWrite icon="plus" ariaLabel="Zuordnung hinzufügen" variant="secondary" onClick={()=>setOpen(true)}/>}/><p className="technical-hint"><LocalizedText>{'Mitarbeitende sehen nur freigegebene Kunden und Aufträge. Eine Kundenzuordnung ohne Auftrag erlaubt die direkte Zeiterfassung.'}</LocalizedText></p>
 {data.loading?<LoadingState/>:data.error?<ErrorState onRetry={data.refresh}>{data.error}</ErrorState>:!data.data?.items.length?<EmptyState compact title="Keine Zuordnungen" text="Kunden und Aufträge gezielt freigeben."/>:<div className="action-list">{data.data.items.map(item=><div key={item.id} className="assignment-row"><div><b>{item.employee_name}</b><p>{item.customer_name}{item.project_name?' · '+item.project_name:''}</p><small>{String(item.starts_on).slice(0,10)}{item.ends_on?' – '+String(item.ends_on).slice(0,10):''}</small></div><Status tone={!item.revoked_at&&String(item.starts_on).slice(0,10)<=businessDate()&&(!item.ends_on||String(item.ends_on).slice(0,10)>=businessDate())?'success':'neutral'}>{item.revoked_at||item.ends_on&&String(item.ends_on).slice(0,10)<businessDate()?'Beendet':String(item.starts_on).slice(0,10)>businessDate()?'Geplant':'Aktiv'}</Status>{!item.revoked_at&&<ActionsMenu label="Zuordnungsaktionen"><ActionRow requiresWrite icon="close" title="Zugriff entziehen" danger onClick={()=>setRevoking(item.id)}/></ActionsMenu>}</div>)}</div>}
 {error&&<ErrorState>{error}</ErrorState>}
 <FormSheet open={open} onClose={close} label="Zuordnung" busy={busy}>
 <Field label="Mitarbeiter"><Select required value={employee} onChange={e=>{setEmployee(e.target.value);setUser(data.data?.employees.find(item=>item.id===e.target.value)?.user_id??'')}}><option value="">—</option>{data.data?.employees.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Zugang"><Select required value={user} onChange={e=>setUser(e.target.value)}><option value="">—</option>{data.data?.members.map(item=><option key={item.user_id} value={item.user_id}>{item.email}</option>)}</Select></Field>
 <Field label="Kunde"><Select required value={customer} onChange={e=>{setCustomer(e.target.value);setProject('')}}><option value="">—</option>{customers.data?.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Auftrag"><Select value={project} onChange={e=>setProject(e.target.value)}><option value=""><LocalizedText>{'Ohne Auftrag'}</LocalizedText></option>{projects.data?.items.filter(item=>item.customer_id===customer).map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Beginn"><Input required type="date" value={start} onChange={e=>setStart(e.target.value)}/></Field><Field label="Ende"><Input type="date" min={start} value={end} onChange={e=>setEnd(e.target.value)}/></Field>
 {error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" onClick={close}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button requiresWrite disabled={busy||!employee||!user||!customer||!start} onClick={()=>void mutate()}><LocalizedText>{'Speichern'}</LocalizedText></Button></FormActions>
 </FormSheet><ConfirmDialog open={!!revoking} title="Zugriff entziehen?" message="Neue Erfassungen werden gesperrt. Bereits erfasste Zeiten und Nachweise bleiben erhalten." busy={busy} onCancel={()=>setRevoking(null)} onConfirm={()=>{if(revoking)void mutate(revoking)}}/>
 </section>;
}
