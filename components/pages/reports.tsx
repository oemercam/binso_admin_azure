"use client";
import {useRef,useState} from 'react';
import {apiGetFile} from '@/lib/client/backend';
import {useLocale,LocalizedText} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {useApiQuery} from '@/lib/client/use-api-query';
import type {ReportSummary} from '@/lib/report-export';
import {businessDate} from '@/lib/financial-status';
import {AppShell} from '../app-shell';
import {ActionRow,ActionsMenu,FilterSheet,MetricTiles,MetricTile,WorkspaceSection} from '../binso-ux';
import {Button,Field,Input,Select,ErrorState,LoadingState,EmptyState,SectionTitle, FormActions} from '../ui';
import {projectStatusLabels as projectLabels} from '@/lib/projects';
export function ReportsPage(){
 const {locale}=useLocale(),[period,setPeriod]=useState({months:'1',from:businessDate().slice(0,7)+'-01',to:businessDate()}),[draft,setDraft]=useState(period),[open,setOpen]=useState(false);
 const query=new URLSearchParams(period),resource=useApiQuery<ReportSummary>('/api/reports?'+query.toString()),data=resource.data;
 const hasAccess=!!data&&[data.customers,data.projects,data.time,data.payments,data.expenses,data.employees].some(value=>value!==null);
 const exportPending=useRef(false),[exportBusy,setExportBusy]=useState(false),[exportError,setExportError]=useState('');
 const exportCsv=async()=>{
  if(exportPending.current||!data||!hasAccess)return;
  exportPending.current=true;setExportBusy(true);setExportError('');
  try{
   const file=await apiGetFile('/api/reports?'+query.toString()+'&format=csv&lang='+locale,'text/csv');
   const url=URL.createObjectURL(file.blob),anchor=document.createElement('a');
   anchor.href=url;anchor.download=file.fileName?.endsWith('.csv')?file.fileName:`binso-reports-${data.period.from}-${data.period.to}.csv`;
   try{anchor.hidden=true;document.body.appendChild(anchor);anchor.click()}
   finally{anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000)}
  }catch(error){setExportError(error instanceof Error?error.message:'Daten konnten nicht geladen werden.')}
  finally{exportPending.current=false;setExportBusy(false)}
 };
 const date=(value:string)=>new Intl.DateTimeFormat(localeTags[locale],{dateStyle:'short',timeZone:'UTC'}).format(new Date(value+'T12:00:00Z'));
 const number=(value:string)=>Number(value).toLocaleString(localeTags[locale],{maximumFractionDigits:2});
 return <AppShell title="Berichte" active="berichte" subtitle={data?date(data.period.from)+' – '+date(data.period.to):undefined}>
  <WorkspaceSection><SectionTitle title="Berichtszeitraum" action={<><Button icon="filter" variant="secondary" ariaLabel="Zeitraum" aria-haspopup="dialog" aria-expanded={open} onClick={()=>{setDraft(period);setOpen(true)}}/>{hasAccess&&<ActionsMenu label="Berichtsaktionen" busy={exportBusy}><ActionRow title="CSV exportieren" icon="download" disabled={exportBusy} onClick={()=>void exportCsv()}/></ActionsMenu>}</>}/></WorkspaceSection>
  {resource.error?<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>:resource.loading?<LoadingState/>:data&&<>
   {!hasAccess&&<EmptyState title="Keine Berichtsdaten verfügbar" description="Für diese Rolle und diesen Plan sind keine Berichtsdaten freigegeben."/>}
   {(data.customers||data.projects||data.employees)&&<WorkspaceSection><SectionTitle title="Aktueller Bestand"/><p><LocalizedText>Stand</LocalizedText>: {new Intl.DateTimeFormat(localeTags[locale],{dateStyle:"short",timeStyle:"short",timeZone:"Europe/Zurich"}).format(new Date(data.asOf))}</p><MetricTiles columns={2}>{data.customers&&<MetricTile label="Kunden gesamt" value={number(data.customers.total)}/>} {data.employees&&<MetricTile label="Aktive Mitarbeiter" value={number(data.employees.active)}/>} {data.projects&&<MetricTile label="Aufträge" value={number(String(data.projects.reduce((sum,item)=>sum+Number(item.count),0)))}/>}</MetricTiles>{data.projects&&data.projects.length>0&&<dl className="detail-list">{data.projects.map(item=><div key={item.status}><dt><LocalizedText>{projectLabels[item.status]??item.status}</LocalizedText></dt><dd>{number(item.count)}</dd></div>)}</dl>}</WorkspaceSection>}
   {data.customers&&<WorkspaceSection><MetricTiles columns={2}><MetricTile label="Neue Kunden" value={number(data.customers.added)}/></MetricTiles></WorkspaceSection>}
   {data.time&&<WorkspaceSection><SectionTitle title="Arbeitszeit im Zeitraum"/><MetricTiles columns={2}><MetricTile label="Arbeitszeit" value={number(data.time.hours)+' h'}/><MetricTile label="Verrechnete Zeit" value={number(data.time.invoiced_hours)+' h'}/><MetricTile label="Verrechenbare Zeit" value={number(data.time.billable_hours)+' h'}/></MetricTiles></WorkspaceSection>}
   {data.payments&&<WorkspaceSection><SectionTitle title="Eingegangene Zahlungen"/>{data.payments.length?<MetricTiles columns={2}>{data.payments.map(item=><MetricTile key={item.currency} label="Betrag" value={Number(item.amount)} currency={item.currency}/>)}</MetricTiles>:<EmptyState  title="Keine Zahlungen im Zeitraum" />}</WorkspaceSection>}
   {data.expenses&&<WorkspaceSection><SectionTitle title="Erstattete Spesen"/>{data.expenses.length?<MetricTiles columns={2}>{data.expenses.map(item=><MetricTile key={item.currency} label="Betrag" value={Number(item.amount)} currency={item.currency}/>)}</MetricTiles>:<EmptyState  title="Keine Spesenerstattungen im Zeitraum" />}</WorkspaceSection>}
   <WorkspaceSection>{(data.payments||data.expenses)&&<p><LocalizedText>Zahlungsbeträge enthalten ausschliesslich verbuchte Zahlungseingänge und erfasste Spesenerstattungen. Andere Kosten und Löhne sind darin nicht enthalten.</LocalizedText></p>}{exportError&&<ErrorState>{exportError}</ErrorState>}</WorkspaceSection>
  </>}
  <FilterSheet label="Berichtszeitraum" open={open} onClose={()=>setOpen(false)}><Field allowReadOnlyInput label="Zeitraum"><Select value={draft.months} onChange={event=>setDraft({...draft,months:event.target.value})}><option value="1"><LocalizedText>Dieser Monat</LocalizedText></option><option value="3"><LocalizedText>3 Monate</LocalizedText></option><option value="6"><LocalizedText>6 Monate</LocalizedText></option><option value="12"><LocalizedText>12 Monate</LocalizedText></option><option value="custom"><LocalizedText>Eigener Zeitraum</LocalizedText></option></Select></Field>{draft.months==='custom'&&<><Field allowReadOnlyInput label="Von"><Input type="date" value={draft.from} onChange={event=>setDraft({...draft,from:event.target.value})}/></Field><Field allowReadOnlyInput label="Bis"><Input type="date" value={draft.to} onChange={event=>setDraft({...draft,to:event.target.value})}/></Field></>}<FormActions sheet><Button variant="secondary" onClick={()=>setOpen(false)}><LocalizedText>Abbrechen</LocalizedText></Button><Button onClick={()=>{setPeriod(draft);setExportError('');setOpen(false)}}><LocalizedText>Anwenden</LocalizedText></Button></FormActions></FilterSheet>
 </AppShell>;
}
