"use client";
import {useState} from 'react';
import type {TimeReport} from '@/lib/report-export';
import {useApiQuery} from '@/lib/client/use-api-query';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {FormSheet,ListRow} from './binso-ux';
import {Button,Field,Input,Select,LoadingState,ErrorState,EmptyState,FormActions,SectionTitle} from './ui';
import {ReportActions} from './report-actions';

export function TimeReportSheet({period,onClose}:{period:Record<string,string>;onClose:()=>void}){
 const {locale}=useLocale(),[draft,setDraft]=useState({q:'',status:'all',groupBy:'detail'}),[filter,setFilter]=useState(draft);
 const query=new URLSearchParams({...period,...filter,kind:'time'}).toString(),resource=useApiQuery<TimeReport>('/api/reports?'+query),data=resource.data;
 const duration=(minutes:number)=>Math.floor(minutes/60)+':'+String(minutes%60).padStart(2,'0');
 const date=(value:string)=>new Intl.DateTimeFormat(localeTags[locale],{dateStyle:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
 return <FormSheet label="Zeitrapport" open onClose={onClose}>
  <form onSubmit={event=>{event.preventDefault();setFilter(draft)}}><div className="form-grid"><Field allowReadOnlyInput label="Suche"><Input maxLength={200} value={draft.q} onChange={event=>setDraft({...draft,q:event.target.value})} placeholder="Kunde, Auftrag oder Mitarbeiter"/></Field><Field allowReadOnlyInput label="Status"><Select value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}><option value="all"><LocalizedText>Alle</LocalizedText></option><option value="approved"><LocalizedText>Genehmigt</LocalizedText></option><option value="invoiced"><LocalizedText>Verrechnet</LocalizedText></option><option value="internal"><LocalizedText>Intern</LocalizedText></option></Select></Field><Field allowReadOnlyInput label="Gruppierung"><Select value={draft.groupBy} onChange={event=>setDraft({...draft,groupBy:event.target.value})}><option value="detail"><LocalizedText>Details</LocalizedText></option><option value="customer"><LocalizedText>Kunde</LocalizedText></option><option value="project"><LocalizedText>Auftrag</LocalizedText></option><option value="employee"><LocalizedText>Mitarbeiter</LocalizedText></option></Select></Field></div><FormActions><Button type="submit"><LocalizedText>Anwenden</LocalizedText></Button></FormActions></form>
  {resource.error?<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>:resource.loading?<LoadingState/>:data&&<><SectionTitle title="Arbeitszeit" action={<ReportActions query={query}/>}/><p>{duration(data.totalMinutes)}</p>{data.groupBy!=='detail'?data.groups.length?data.groups.map((group,index)=><ListRow key={index} translateTitle={false} title={group.label} meta={String(group.entries)} value={duration(group.minutes)}/>):<EmptyState title="Keine Einträge im Zeitraum"/>:data.items.length?data.items.map((item,index)=><ListRow key={index} title={[date(item.date),item.customer,item.project].filter(Boolean).join(' · ')} translateTitle={false} meta={[item.employee,item.activity].filter(Boolean).join(' · ')} value={duration(item.minutes)}/>):<EmptyState title="Keine Einträge im Zeitraum"/>}</>}
 </FormSheet>;
}
