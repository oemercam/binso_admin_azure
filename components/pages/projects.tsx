"use client";
import {useRef,useState} from 'react';
import {safeAppPath} from "@/lib/navigation";
import {useSearchParams} from 'next/navigation';
import {useApiQuery} from '@/lib/client/use-api-query';
import {apiPatch} from '@/lib/client/backend';
import {useProcessDraft} from '../use-process-draft';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText,useLocale} from '@/lib/client/locale';
import {localeTags} from '@/lib/locales/config';
import {translateMessage} from '@/lib/locales';
import {AppShell} from '../app-shell';
import {ActionRow,ActionsMenu,CreateAction,FormSheet,MetricTiles,MetricTile,WorkspaceSection} from '../binso-ux';
import {RecordsView,RecordsControls,RecordRow,TimeEntryRow,useRecordsController} from '../records';
import {Button,Field,Input,Select,Textarea,ErrorState,LoadingState,EmptyState,SectionTitle, FormActions} from '../ui';
import {formatMinutes,swissDate} from './shared';
import {DocumentSummaryRow,type DocumentListItem} from '../document-list';
import {projectAllowsTime,projectStatusLabels as labels} from '@/lib/projects';
type Project={id:string;name:string;customer_id:string|null;customer_name:string|null;status:string;hours?:number|string|null;hours_budget:number|string;progress:number|string;notes:string|null;version:number;source_offer:string|null};
type Workspace={item:Project;totals:{hours:number|string;invoiced_hours:number|string;entries:number|string}|null;time:Array<{id:string;work_date:string;hours:number|string;description:string|null;billable:boolean;approved:boolean}>|null;invoices:Array<DocumentListItem&{number:string;total_amount:number|string}>|null};
export function ProjectsPage(){
 const customerId=useSearchParams().get("customerId");
 const {locale}=useLocale();
 const chips=['Alle','Geplant','Aktiv','Blockiert','Abgeschlossen','Storniert'],columns=[{label:'Auftrag',index:0},{label:'Kunde',index:1},{label:'Arbeitszeit',index:2,align:'right' as const},{label:'Status',index:4,status:true}];
 const controller=useRecordsController({placeholder:'Aufträge suchen...',chips,columns});
 const statuses:Record<string,string>={Geplant:'planned',Aktiv:'active',Blockiert:'blocked',Abgeschlossen:'completed',Storniert:'cancelled'};
 const fields:Record<number,string>={0:'name',1:'customer_name',2:'hours',4:'status'};
 const query=new URLSearchParams({limit:'50',offset:String(controller.page*50),order:controller.sort==='default'?'name.asc':(fields[controller.sortIndex]??'name')+'.'+controller.sort});
 if(customerId)query.set('customerId',customerId);
 if(controller.query.trim())query.set('q',controller.query.trim());if(statuses[controller.activeChip])query.set('status',statuses[controller.activeChip]);
 const resource=useApiQuery<{items:Project[];total:number}>('/api/projects?'+query.toString());
 const rows=(resource.data?.items??[]).map(item=>[item.name,item.customer_name??translateMessage('Intern',locale),item.hours===null?'—':formatMinutes(Number(item.hours)*60)+' h',item.id,labels[item.status]??item.status]);
 return <AppShell title="Aufträge" subtitle={resource.loading?undefined:`${resource.data?.total??0} Aufträge`} active="projekte" actions={<RecordsControls controller={controller} placeholder="Aufträge suchen..." chips={chips} columns={columns}><CreateAction href="/projekte/neu?returnTo=%2Fprojekte" label="Auftrag erstellen"/></RecordsControls>}><RecordsView toolbarActions={false} showCount={false} items={rows} controller={controller} remote loading={resource.loading} error={resource.error} columns={columns} chips={chips} placeholder="Aufträge suchen..." countLabel="Aufträge" pagination={{total:resource.data?.total??0,page:controller.page,pageSize:50,onPage:controller.setPage}} rowHref={row=>'/projekte/'+row[3]}>{row=><RecordRow href={'/projekte/'+row[3]} icon="box" title={row[0]} meta={row[1]} value={row[2]} status={row[4]}/>}</RecordsView></AppShell>;
}
export function ProjectDetail({id}:{id:string}){
 const returnTo=safeAppPath(useSearchParams().get("returnTo"),"/projekte");
 const {locale}=useLocale();
 const resource=useApiQuery<Workspace>('/api/projects/'+encodeURIComponent(id));
 const access=usePageAccess(),[draft,setDraft]=useState<{name:string;status:string;notes:string;hoursBudget:string;version:number}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false);
 const item=resource.data?.item;
 const edit=()=>{if(item){setError('');setDraft({name:item.name,status:item.status,notes:item.notes??'',hoursBudget:String(item.hours_budget),version:item.version})}};
 const editDirty=!!draft&&!!item&&(draft.name!==item.name||draft.notes!==(item.notes??'')||draft.status!==item.status||Number(draft.hoursBudget)!==Number(item.hours_budget));
 const recovery=useProcessDraft({process:'project:edit:'+id,value:draft,enabled:draft!==null,dirty:editDirty,onRestore:value=>{
  if(!value||value.version!==item?.version||[value.name,value.status,value.notes,value.hoursBudget].some(field=>typeof field!=='string'||field.length>10000))return;setDraft(value);
 }});
 const close=()=>{recovery.clear();setDraft(null);resource.refresh()};
 const save=async()=>{if(pending.current||!draft||!recovery.ready)return;pending.current=true;setBusy(true);setError('');try{recovery.persist(draft);await apiPatch('/api/projects/'+encodeURIComponent(id),draft);recovery.clear();setDraft(null);resource.refresh();}catch(error){setError(error instanceof Error?error.message:'Auftrag konnte nicht gespeichert werden.')}finally{pending.current=false;setBusy(false)}};
 if(!item)return <AppShell title="Auftrag" active="projekte" backHref={returnTo}>{resource.error?<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>:<LoadingState/>}</AppShell>;
 const data=resource.data!;
 return <AppShell title={item.name} titleIsUserContent active="projekte" backHref="/projekte" backLabel={returnTo.startsWith("/kunden/")?"Kunde":"Aufträge"} status={labels[item.status]??item.status} statusTone={item.status==='completed'?'success':item.status==='blocked'?'warning':'neutral'} actions={<ActionsMenu label="Auftragsaktionen">{access.write&&<ActionRow title="Bearbeiten" icon="edit" navigation requiresWrite onClick={edit}/>}{projectAllowsTime(item.status)&&<ActionRow title="Zeit erfassen" icon="clock" href={'/zeit?manual=1&projectId='+encodeURIComponent(id)+(item.customer_id?'&customerId='+encodeURIComponent(item.customer_id):'')} navigation/>}{item.customer_id&&<ActionRow title="Kunde öffnen" icon="users" href={'/kunden/'+encodeURIComponent(item.customer_id)} navigation/>}{item.source_offer&&<ActionRow title="Angebot öffnen" icon="file" href={'/angebote/'+encodeURIComponent(item.source_offer)} navigation/>}</ActionsMenu>}>
  <WorkspaceSection><dl className="detail-list"><div><dt><LocalizedText>Kunde</LocalizedText></dt><dd translate="no">{item.customer_name??<LocalizedText>Intern</LocalizedText>}</dd></div><div><dt><LocalizedText>Stundenbudget</LocalizedText></dt><dd>{Number(item.hours_budget).toLocaleString(localeTags[locale])} h</dd></div></dl>{item.notes&&<p translate="no">{item.notes}</p>}</WorkspaceSection>
  {data.totals&&<MetricTiles columns={2}><MetricTile label="Arbeitszeit" value={formatMinutes(Number(data.totals.hours)*60)+' h'}/><MetricTile label="Verrechnet" value={formatMinutes(Number(data.totals.invoiced_hours)*60)+' h'}/></MetricTiles>}
  {data.time&&<WorkspaceSection><SectionTitle title="Letzte Zeiteinträge"/>{data.time.length?<div className="time-record-list">{data.time.map(entry=><TimeEntryRow key={entry.id} title={entry.description||"—"} meta={swissDate(entry.work_date)} value={formatMinutes(Number(entry.hours)*60)+" h"}/>)}</div>:<EmptyState  title="Keine Zeiteinträge" />}</WorkspaceSection>}
  {data.invoices&&<WorkspaceSection><SectionTitle title="Rechnungen"/>{data.invoices.length?<div className="records">{data.invoices.map(invoice=><DocumentSummaryRow key={invoice.number} item={invoice} compact returnTo={'/projekte/'+encodeURIComponent(id)}/>)}</div>:<EmptyState  title="Keine Rechnungen" />}</WorkspaceSection>}
  <FormSheet label="Auftrag bearbeiten" dirty={editDirty} open={draft!==null} busy={busy} onClose={close}>{draft&&<form onSubmit={event=>{event.preventDefault();void save()}}><div className="form-grid"><Field label="Bezeichnung"><Input required minLength={2} maxLength={200} disabled={busy} value={draft.name} onChange={event=>setDraft({...draft,name:event.target.value})}/></Field><Field label="Status"><Select disabled={busy} value={draft.status} onChange={event=>setDraft({...draft,status:event.target.value})}>{Object.entries(labels).map(([key,label])=><option key={key} value={key}><LocalizedText>{label}</LocalizedText></option>)}</Select></Field><Field label="Stundenbudget"><Input type="number" min="0" max="1000000" step="0.25" required disabled={busy} value={draft.hoursBudget} onChange={event=>setDraft({...draft,hoursBudget:event.target.value})}/></Field><Field label="Notizen"><Textarea maxLength={10000} disabled={busy} value={draft.notes} onChange={event=>setDraft({...draft,notes:event.target.value})}/></Field></div>{error&&<ErrorState>{error}</ErrorState>}<FormActions sheet><Button variant="secondary" disabled={busy} onClick={close}><LocalizedText>Abbrechen</LocalizedText></Button><Button requiresWrite disabled={busy||!recovery.ready} type="submit"><LocalizedText>{busy?'Wird gespeichert…':'Speichern'}</LocalizedText></Button></FormActions></form>}</FormSheet>
 </AppShell>;
}
