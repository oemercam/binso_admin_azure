'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {readClientSession} from '@/lib/client/session-cache';
import {useApiQuery,useDataRevision} from '@/lib/client/use-api-query';
import {apiPost} from '@/lib/client/backend';
import {tenantCan} from '@/lib/permissions';
import {LocalizedText} from '@/lib/client/locale';
import {CustomerImportControl} from './customer-import';
import {FormSheet,ListRow,ActionsMenu,ActionRow} from './binso-ux';
import {Button,Field,Input,FormActions,ErrorState,EmptyState,LoadingState} from './ui';
import ConfirmDialog from './confirm-dialog';
import {CustomerMergeSheet} from './customer-merge';

type Archived={id:string;name:string;customer_no:string;revision:string;merged_into_customer_id?:string|null;merge_target_archived?:boolean};
function ArchiveSheet({onClose}:{onClose:()=>void}){
 const [draft,setDraft]=useState(''),[query,setQuery]=useState(''),[page,setPage]=useState(0),[selected,setSelected]=useState<Archived|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const pending=useRef(false);
 const resource=useApiQuery<{items:Archived[];total:number}>('/api/customers/archive?'+new URLSearchParams({q:query,offset:String(page*50)}));
 const restore=async()=>{if(!selected||pending.current)return;pending.current=true;setBusy(true);setError('');try{await apiPost('/api/customers/archive',{id:selected.id,revision:selected.revision});setSelected(null);resource.refresh();}catch(issue){setSelected(null);setError(issue instanceof Error?issue.message:'Kunde konnte nicht wiederhergestellt werden.');}finally{pending.current=false;setBusy(false);}};
 return <FormSheet label="Kundenarchiv" open onClose={onClose} busy={busy}><form onSubmit={event=>{event.preventDefault();setPage(0);setQuery(draft)}}><Field allowReadOnlyInput label="Suche"><Input value={draft} maxLength={200} onChange={event=>setDraft(event.target.value)} placeholder="Kunden suchen..."/></Field><FormActions><Button type="submit"><LocalizedText>Suchen</LocalizedText></Button></FormActions></form>
  {error&&<ErrorState>{error}</ErrorState>}{resource.error?<ErrorState onRetry={resource.refresh}>{resource.error}</ErrorState>:resource.loading?<LoadingState/>:resource.data?.items.length?resource.data.items.map(item=><ListRow key={item.id} title={item.name} translateTitle={false} meta={item.customer_no} status={item.merged_into_customer_id?'Zusammengeführt':undefined} tone="info" value={item.merged_into_customer_id&&item.merge_target_archived?<LocalizedText>Zielkunde archiviert</LocalizedText>:<ActionsMenu label="Kundenaktionen" busy={busy}>{item.merged_into_customer_id?<ActionRow title="Zielkunde ansehen" icon="arrow" href={'/kunden/'+encodeURIComponent(item.merged_into_customer_id)}/>:<ActionRow title="Wiederherstellen" icon="back" onClick={()=>setSelected(item)}/>}</ActionsMenu>}/>):<EmptyState title="Keine archivierten Kunden"/>}
  <FormActions sheet><Button variant="secondary" disabled={busy||page===0} onClick={()=>setPage(value=>value-1)}><LocalizedText>Zurück</LocalizedText></Button><Button variant="secondary" disabled={busy||!resource.data||(page+1)*50>=resource.data.total} onClick={()=>setPage(value=>value+1)}><LocalizedText>Weiter</LocalizedText></Button></FormActions>
  {selected&&<ConfirmDialog open busy={busy} title="Kunde wiederherstellen?" message="Der Kunde wird mit seinen bisherigen Daten wieder sichtbar. Bestehende Dokumente bleiben unverändert." confirmLabel="Wiederherstellen" onCancel={()=>{if(!pending.current)setSelected(null)}} onConfirm={()=>void restore()}/>}
 </FormSheet>;
}
export function CustomerDataActions({header=false,tools=false,filterAction}:{header?:boolean;tools?:boolean;filterAction?:ReactNode}={}){
 const revision=useDataRevision([]),[allowed,setAllowed]=useState(false),[open,setOpen]=useState(false),[merge,setMerge]=useState(false);
 useEffect(()=>{let active=true;readClientSession().then(session=>{if(active){setOpen(false);setMerge(false);setAllowed(session.authenticated&&!session.tenant?.readOnly&&tenantCan(session.tenant?.role??'','customers:delete',session.tenant?.moduleProfile));}}).catch(()=>{if(active){setAllowed(false);setOpen(false);setMerge(false)}});return()=>{active=false};},[revision]);
 return <><CustomerImportControl header={header} tools={tools} extraActions={filterAction} onOpenArchive={allowed?()=>setOpen(true):undefined} onOpenMerge={allowed?()=>setMerge(true):undefined}/>{allowed&&open&&<ArchiveSheet key={revision} onClose={()=>setOpen(false)}/>} {allowed&&merge&&<CustomerMergeSheet key={revision} onClose={()=>setMerge(false)}/>}</>;
}
