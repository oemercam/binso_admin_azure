"use client";
import {useRef,useState} from 'react';
import {fileRelations} from '@/lib/file-associations';
import {tenantCan} from '@/lib/permissions';
import {apiUpload,useBackendMode} from '@/lib/client/backend';
import {useApiQuery} from '@/lib/client/use-api-query';
import {Button,Input,SectionTitle,LoadingState,ErrorState,EmptyState} from './ui';
import {RecordRow} from './records';

/** Entity association is mandatory; every attachment uses the existing file API. */
export function EntityFiles({purpose,entityId}:{purpose:string;entityId:string}){
 const production=useBackendMode(),relation=fileRelations[purpose],input=useRef<HTMLInputElement>(null),busy=useRef(false);
 const [uploading,setUploading]=useState(false),[error,setError]=useState<string|null>(null);
 const session=useApiQuery<{demo?:boolean;tenant?:{role?:string;readOnly?:boolean}}>(production?'/api/auth/session':null);
 const allowed=Boolean(relation&&session.data&&!session.data.tenant?.readOnly&&tenantCan(session.data.tenant?.role??'reader',relation.write));
 const files=useApiQuery<{items:Array<{id:string;fileName:string}>}>(production&&relation&&entityId?'/api/files?'+relation.filter+'='+encodeURIComponent(entityId):null);
 const upload=async(file:File|undefined)=>{
  if(!file||!allowed||busy.current)return;
  busy.current=true;setUploading(true);setError(null);
  try{const form=new FormData();form.append('file',file);form.append('purpose',purpose);form.append('entityId',entityId);await apiUpload('/api/files',form);}
  catch(e){setError(e instanceof Error?e.message:'Datei konnte nicht hochgeladen werden.');}
  finally{busy.current=false;setUploading(false);if(input.current)input.current.value='';}
 };
 if(!production||!relation||!entityId)return null;
 return <section className="surface"><SectionTitle title="Anhänge" action={allowed?<Button requiresWrite variant="secondary" disabled={uploading} onClick={()=>input.current?.click()}>{uploading?'Wird hochgeladen…':'Datei hinzufügen'}</Button>:undefined}/>
  <Input ref={input} hidden type="file" accept="application/pdf,image/png,image/jpeg,image/webp,text/plain,text/csv" aria-label="Anhang auswählen" onChange={e=>void upload(e.target.files?.[0])}/>
  {files.loading&&<LoadingState>Anhänge werden geladen …</LoadingState>}
  {(error||files.error)&&<ErrorState onRetry={()=>{setError(null);files.refresh()}} retryLabel="Erneut laden">{error||files.error}</ErrorState>}
  {(files.data?.items??[]).map(file=><RecordRow key={file.id} href={'/api/files/'+encodeURIComponent(file.id)+'/download'} title={file.fileName} meta=""/>)}
  {!files.loading&&!files.error&&!files.data?.items.length&&<EmptyState compact title="Keine Anhänge vorhanden" text=""/>}
 </section>;
}
