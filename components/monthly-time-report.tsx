"use client";
import {useRef,useState} from 'react';
import {apiPost,apiPatch} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {businessDate} from '@/lib/financial-status';
import {LocalizedText} from '@/lib/client/locale';
import {FormSheet} from './binso-ux';
import {EntityFiles} from './entity-files';
import {Button,Field,Input,Textarea,Select,ErrorState,FormActions} from './ui';

type Entry={id:string;report_month?:string|null;duration_minutes?:number|null;customer_id?:string|null;project_id?:string|null;description?:string|null;submitted_at?:string|null;approved?:boolean;review_note?:string|null};
export function MonthlyTimeReport({entry,readOnly=false,canReview=false}:{entry?:Entry;readOnly?:boolean;canReview?:boolean}){
 const [open,setOpen]=useState(false),[id,setId]=useState(entry?.id??''),[month,setMonth]=useState(entry?.report_month?.slice(0,7)??businessDate().slice(0,7)),[hours,setHours]=useState(entry?String(Number(entry.duration_minutes??0)/60):''),[customer,setCustomer]=useState(entry?.customer_id??''),[project,setProject]=useState(entry?.project_id??''),[description,setDescription]=useState(entry?.description??''),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false),replay=useRef<string>('');const [baseline,setBaseline]=useState(()=>JSON.stringify([entry?.report_month?.slice(0,7)??businessDate().slice(0,7),entry?String(Number(entry.duration_minutes??0)/60):'',entry?.customer_id??'',entry?.project_id??'',entry?.description??'']));
 const customers=useApiQuery<{items:Array<{id:string;name:string}>}>(open?'/api/customers':null),projects=useApiQuery<{items:Array<{id:string;name:string;customer_id:string|null}>}>(open?'/api/projects':null);
 const [reviewNote,setReviewNote]=useState('');
 const review=async(action:'approve'|'reject')=>{if(!entry||pending.current)return;if(action==='reject'&&!reviewNote.trim()){setError('Bitte eine Begründung eingeben.');return;}pending.current=true;setBusy(true);setError('');try{await apiPatch('/api/time-entries/'+encodeURIComponent(entry.id),{action,note:reviewNote});setOpen(false)}catch(e){setError(e instanceof Error?e.message:'Prüfung konnte nicht gespeichert werden.')}finally{pending.current=false;setBusy(false)}};
 const locked=readOnly||!!entry?.submitted_at||!!entry?.approved;
 const save=async(submit=false)=>{
  if(pending.current)return;const value=Number(hours.replace(',','.'));
  if(!Number.isFinite(value)||value<=0||value>744||!customer){setError('Bitte Monat, Kunde und Stunden prüfen.');return;}
  pending.current=true;setBusy(true);setError('');
  try{
   let saved=id;
   if(!saved){replay.current||=crypto.randomUUID();const result=await apiPost<{item:{id:string}}>('/api/time-entries',{reportMonth:month,durationMinutes:value*60,customerId:customer,projectId:project||null,description,projectName:projects.data?.items.find(item=>item.id===project)?.name??'Monatsrapport',billable:true},{idempotencyKey:replay.current});saved=result.item.id;setId(saved);}
   else if(!locked)await apiPatch('/api/time-entries/'+encodeURIComponent(saved),{action:'correct',durationMinutes:value*60,description});
   setBaseline(JSON.stringify([month,hours,customer,project,description]));
   if(submit){await apiPatch('/api/time-entries/'+encodeURIComponent(saved),{action:'submit'});setOpen(false);if(!entry){setId('');setHours('');setCustomer('');setProject('');setDescription('');replay.current='';setBaseline(JSON.stringify([month,'','','','']));}}
  }catch(e){setError(e instanceof Error?e.message:'Monatsrapport konnte nicht gespeichert werden.');}finally{pending.current=false;setBusy(false)}
 };
 return <><Button requiresWrite={!entry} variant="secondary" onClick={()=>setOpen(true)}><LocalizedText>{entry?'Rapport':'Monatsrapport'}</LocalizedText></Button><FormSheet label="Monatsrapport" open={open} onClose={()=>setOpen(false)} busy={busy} dirty={!!reviewNote||!locked&&JSON.stringify([month,hours,customer,project,description])!==baseline}>
 <p className="technical-hint"><LocalizedText>{'Gesamtstunden des Monats erfassen und den unterschriebenen Stundenrapport als Nachweis hochladen. Bereits erfasste Einzelzeiten dürfen nicht nochmals enthalten sein.'}</LocalizedText></p>
 <Field label="Monat"><Input type="month" required disabled={!!id} value={month} onChange={e=>setMonth(e.target.value)}/></Field>
 <Field label="Kunde"><Select required disabled={!!id} value={customer} onChange={e=>{setCustomer(e.target.value);setProject('')}}><option value="">—</option>{customers.data?.items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Auftrag"><Select disabled={!!id} value={project} onChange={e=>setProject(e.target.value)}><option value=""><LocalizedText>{'Ohne Auftrag'}</LocalizedText></option>{projects.data?.items.filter(item=>item.customer_id===customer).map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</Select></Field>
 <Field label="Stunden"><Input required inputMode="decimal" disabled={locked} placeholder="198" value={hours} onChange={e=>setHours(e.target.value)}/></Field>
 <Field label="Beschreibung"><Textarea rows={2} disabled={locked} value={description} onChange={e=>setDescription(e.target.value)}/></Field>
 {entry?.review_note&&<p role="status">{entry.review_note}</p>}
 {id&&<EntityFiles purpose="time_report" entityId={id} readOnly={locked}/>}
 {canReview&&<Field label="Begründung"><Textarea rows={2} maxLength={2000} value={reviewNote} onChange={e=>setReviewNote(e.target.value)}/></Field>}
 {error&&<ErrorState>{error}</ErrorState>}{customers.error&&<ErrorState onRetry={customers.refresh}>{customers.error}</ErrorState>}{projects.error&&<ErrorState onRetry={projects.refresh}>{projects.error}</ErrorState>}
 <FormActions sheet>{canReview&&<><Button requiresWrite disabled={busy} variant="secondary" onClick={()=>void review("reject")}><LocalizedText>{"Zurückweisen"}</LocalizedText></Button><Button requiresWrite disabled={busy} onClick={()=>void review("approve")}><LocalizedText>{"Freigeben"}</LocalizedText></Button></>}<Button variant="secondary" onClick={()=>setOpen(false)}><LocalizedText>{'Abbrechen'}</LocalizedText></Button>{!locked&&<><Button requiresWrite disabled={busy} variant="secondary" onClick={()=>void save()}><LocalizedText>{id?'Speichern':'Entwurf speichern'}</LocalizedText></Button>{id&&<Button requiresWrite disabled={busy} onClick={()=>void save(true)}><LocalizedText>{'Einreichen'}</LocalizedText></Button>}</>}</FormActions>
 </FormSheet></>;
}
