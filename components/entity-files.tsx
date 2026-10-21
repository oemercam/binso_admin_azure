"use client";
import {limitsConfig} from "@/config/limits";
import {fileSelectionError} from '@/lib/file-selection';
import {LocalizedText} from "@/lib/client/locale";
import {useRef,useState} from 'react';
import {fileRelations} from '@/lib/file-associations';
import {tenantCan} from '@/lib/permissions';
import {apiDelete,apiUpload} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {Input,SectionTitle,LoadingState,ErrorState,EmptyState} from './ui';
import {ActionSheet,ActionRow,ListSearch,ListRow,ActionsMenu} from './binso-ux';
import {DocumentModal} from './pdf-preview';
import ConfirmDialog from './confirm-dialog';

type Attachment={id:string;createdBy?:string;fileName:string;mimeType?:string;sizeBytes?:number;createdAt?:string;scanStatus?:string};

/** Entity association is mandatory; every attachment uses the existing file API. */
export function EntityFiles({purpose,entityId,readOnly=false,title="Dateien",emptyTitle="Keine Dateien vorhanden",className=""}:{purpose:string;entityId:string;readOnly?:boolean;title?:string;emptyTitle?:string;className?:string}){
 const relation=fileRelations[purpose],input=useRef<HTMLInputElement>(null),busy=useRef(false);
 const [uploading,setUploading]=useState(false),[error,setError]=useState<string|null>(null);
 const [search,setSearch]=useState(''),[selected,setSelected]=useState<Attachment|null>(null),[preview,setPreview]=useState<Attachment|null>(null),[removing,setRemoving]=useState<Attachment|null>(null),[deleting,setDeleting]=useState(false);
 const session=useApiQuery<{user?:{id:string};tenant?:{role?:string;readOnly?:boolean}}>('/api/auth/session');
 const allowed=Boolean(!readOnly&&relation&&session.data&&!session.data.tenant?.readOnly&&tenantCan(session.data.tenant?.role??'reader',relation.write));
 const files=useApiQuery<{items:Attachment[]}>(relation&&entityId?'/api/files?'+relation.filter+'='+encodeURIComponent(entityId):null);
 const remove=async()=>{if(!removing||busy.current)return;busy.current=true;setDeleting(true);setError(null);try{await apiDelete('/api/files/'+encodeURIComponent(removing.id));setRemoving(null);files.refresh();}catch(reason){setError(reason instanceof Error?reason.message:'Datei konnte nicht entfernt werden.');setRemoving(null);}finally{busy.current=false;setDeleting(false);}};
 const upload=async(file:File|undefined)=>{
  if(!file||!allowed||busy.current)return;
  const issue=fileSelectionError(file,["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv"],limitsConfig.maxFileUploadBytes);if(issue){setError(issue);return;}
  busy.current=true;setUploading(true);setError(null);
  try{const form=new FormData();form.append('file',file);form.append('purpose',purpose);form.append('entityId',entityId);await apiUpload('/api/files',form);}
  catch(e){setError(e instanceof Error?e.message:'Datei konnte nicht hochgeladen werden.');}
  finally{busy.current=false;setUploading(false);if(input.current)input.current.value='';}
 };
 if(!relation||!entityId)return null;
 return <section className={["surface",className].filter(Boolean).join(" ")}><SectionTitle title={title} action={allowed?<ActionsMenu label="Dateiaktionen" busy={uploading}><ActionRow requiresWrite icon="upload" title="Datei hinzufügen" onClick={()=>input.current?.click()}/></ActionsMenu>:undefined}/>
  <Input ref={input} hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv" aria-label="Anhang auswählen" onChange={e=>{const file=e.target.files?.[0];e.target.value="";void upload(file)}}/>
  {files.loading&&<LoadingState><LocalizedText>{"Anhänge werden geladen …"}</LocalizedText></LoadingState>}
  {(error||files.error)&&<ErrorState onRetry={()=>{setError(null);files.refresh()}} retryLabel="Erneut laden"><LocalizedText>{error||files.error}</LocalizedText></ErrorState>}
  {!!files.data?.items.length&&<ListSearch value={search} onChange={setSearch} placeholder="Dateien suchen..."/>}
  {(files.data?.items??[]).filter(file=>file.fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim())).map(file=><ListRow key={file.id} compact translateTitle={false} onClick={()=>setSelected(file)} title={file.fileName} meta={[file.mimeType?.split('/').at(-1)?.toUpperCase(),file.createdAt?new Date(file.createdAt).toLocaleDateString('de-CH'):null].filter(Boolean).join(' · ')}/>)}
  {!!files.data?.items.length&&!files.data.items.some(file=>file.fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))&&<EmptyState  title="Keine passenden Dateien" />}
  {!files.loading&&!files.error&&!files.data?.items.length&&<EmptyState  title={emptyTitle} />}
  <ActionSheet label="Dateiaktionen" description={selected?.fileName} open={!!selected} onClose={()=>setSelected(null)}>{selected&&<div className="action-list">{selected.mimeType==='application/pdf'&&<ActionRow icon="file" title="Vorschau" onClick={()=>{setPreview(selected);setSelected(null)}}/>}<ActionRow icon="download" title="Herunterladen" href={'/api/files/'+encodeURIComponent(selected.id)+'/download'} onClick={()=>setSelected(null)}/>{allowed&&(selected.createdBy===session.data?.user?.id||['owner','admin'].includes(session.data?.tenant?.role??''))&&<ActionRow icon="trash" title="Entfernen" onClick={()=>{setRemoving(selected);setSelected(null)}}/>}</div>}</ActionSheet>
  {preview&&<DocumentModal title="Vorschau" fileUrl={'/api/files/'+encodeURIComponent(preview.id)+'/download'} fileName={preview.fileName.replace(/\.pdf$/i,'')} onClose={()=>setPreview(null)}/>}
  <ConfirmDialog open={!!removing} title="Datei entfernen?" message="Die Datei wird aus den aktiven Anhängen entfernt. Aufbewahrte Nachweise bleiben erhalten." confirmLabel="Entfernen" danger busy={deleting} onCancel={()=>setRemoving(null)} onConfirm={()=>void remove()}/>
 </section>;
}
