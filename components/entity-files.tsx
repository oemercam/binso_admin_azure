"use client";
import {limitsConfig,megabytes} from "@/config/limits";
import {LocalizedText} from "@/lib/client/locale";
import {useRef,useState} from 'react';
import {fileRelations} from '@/lib/file-associations';
import {tenantCan} from '@/lib/permissions';
import {apiGetFile,apiUpload,useBackendMode} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {Input,SectionTitle,LoadingState,ErrorState,EmptyState} from './ui';
import {ActionSheet,ActionRow,FormSheet,ListSearch,ListRow,ActionsMenu} from './binso-ux';
import {DocumentPageViewer} from './pdf-preview';

type Attachment={id:string;fileName:string;mimeType?:string;sizeBytes?:number;createdAt?:string;scanStatus?:string};

/** Entity association is mandatory; every attachment uses the existing file API. */
export function EntityFiles({purpose,entityId,readOnly=false,title="Dateien",emptyTitle="Keine Dateien vorhanden",className=""}:{purpose:string;entityId:string;readOnly?:boolean;title?:string;emptyTitle?:string;className?:string}){
 const production=useBackendMode(),relation=fileRelations[purpose],input=useRef<HTMLInputElement>(null),busy=useRef(false);
 const [uploading,setUploading]=useState(false),[error,setError]=useState<string|null>(null);
 const [search,setSearch]=useState(''),[selected,setSelected]=useState<Attachment|null>(null),[preview,setPreview]=useState(false),[pdf,setPdf]=useState<Blob|null>(null),[previewError,setPreviewError]=useState('');
 const sequence=useRef(0);
 const session=useApiQuery<{demo?:boolean;tenant?:{role?:string;readOnly?:boolean}}>(production?'/api/auth/session':null);
 const allowed=Boolean(!readOnly&&relation&&session.data&&!session.data.tenant?.readOnly&&tenantCan(session.data.tenant?.role??'reader',relation.write));
 const files=useApiQuery<{items:Attachment[]}>(production&&relation&&entityId?'/api/files?'+relation.filter+'='+encodeURIComponent(entityId):null);
 const showPdf=async(file:Attachment)=>{const request=++sequence.current;setSelected(null);setPreview(true);setPdf(null);setPreviewError('');try{const result=await apiGetFile('/api/files/'+encodeURIComponent(file.id)+'/download','application/pdf');if(request===sequence.current)setPdf(result.blob)}catch(e){if(request===sequence.current)setPreviewError(e instanceof Error?e.message:'Datei konnte nicht angezeigt werden.')}};
 const upload=async(file:File|undefined)=>{
  if(!file||!allowed||busy.current)return;
  if(file.size>limitsConfig.maxFileUploadBytes){setError(`Die Datei darf höchstens ${megabytes(limitsConfig.maxFileUploadBytes)} MB gross sein.`);return;}
  if(!["application/pdf","image/png","image/jpeg","image/webp","text/plain","text/csv"].includes(file.type)){setError("Bitte PDF, Bild, Text oder CSV auswählen.");return;}
  busy.current=true;setUploading(true);setError(null);
  try{const form=new FormData();form.append('file',file);form.append('purpose',purpose);form.append('entityId',entityId);await apiUpload('/api/files',form);}
  catch(e){setError(e instanceof Error?e.message:'Datei konnte nicht hochgeladen werden.');}
  finally{busy.current=false;setUploading(false);if(input.current)input.current.value='';}
 };
 if(!production||!relation||!entityId)return null;
 return <section className={["surface",className].filter(Boolean).join(" ")}><SectionTitle title={title} action={allowed?<ActionsMenu label="Dateiaktionen" busy={uploading}><ActionRow requiresWrite icon="upload" title="Datei hinzufügen" onClick={()=>input.current?.click()}/></ActionsMenu>:undefined}/>
  <Input ref={input} hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv" aria-label="Anhang auswählen" onChange={e=>void upload(e.target.files?.[0])}/>
  {files.loading&&<LoadingState><LocalizedText>{"Anhänge werden geladen …"}</LocalizedText></LoadingState>}
  {(error||files.error)&&<ErrorState onRetry={()=>{setError(null);files.refresh()}} retryLabel="Erneut laden"><LocalizedText>{error||files.error}</LocalizedText></ErrorState>}
  {!!files.data?.items.length&&<ListSearch value={search} onChange={setSearch} placeholder="Dateien suchen..."/>}
  {(files.data?.items??[]).filter(file=>file.fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim())).map(file=><ListRow key={file.id} compact translateTitle={false} onClick={()=>setSelected(file)} title={file.fileName} meta={[file.mimeType?.split('/').at(-1)?.toUpperCase(),file.createdAt?new Date(file.createdAt).toLocaleDateString('de-CH'):null].filter(Boolean).join(' · ')}/>)}
  {!!files.data?.items.length&&!files.data.items.some(file=>file.fileName.toLocaleLowerCase().includes(search.toLocaleLowerCase().trim()))&&<EmptyState  title="Keine passenden Dateien" />}
  {!files.loading&&!files.error&&!files.data?.items.length&&<EmptyState  title={emptyTitle} />}
  <ActionSheet label="Dateiaktionen" description={selected?.fileName} open={!!selected} onClose={()=>setSelected(null)}>{selected&&<div className="action-list">{selected.mimeType==='application/pdf'&&<ActionRow icon="file" title="Vorschau" onClick={()=>void showPdf(selected)}/>}<ActionRow icon="download" title="Herunterladen" href={'/api/files/'+encodeURIComponent(selected.id)+'/download'} onClick={()=>setSelected(null)}/></div>}</ActionSheet>
  <FormSheet label="Vorschau" open={preview} onClose={()=>{sequence.current++;setPreview(false);setPdf(null)}}>{previewError?<ErrorState>{previewError}</ErrorState>:pdf?<DocumentPageViewer file={pdf}/>:<LoadingState/>}</FormSheet>
 </section>;
}
