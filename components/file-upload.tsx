"use client";
import {useRef,useState} from 'react';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText,LocalizedElement} from '@/lib/client/locale';
import {limitsConfig} from '@/config/limits';
import {fileSelectionError} from '@/lib/file-selection';
import {Button,Field,Input} from './ui';

/** A form control, not a second page action. Server content/scan checks remain mandatory. */
export function FileUpload({id,label,file,preview,accept,onSelect,onRemove,busy=false,error:externalError,maxBytes=limitsConfig.maxFileUploadBytes,className=''}:{id?:string;label:string;file:File|null;preview?:string;accept:readonly string[];onSelect:(file:File)=>void;onRemove?:()=>void;busy?:boolean;error?:string;maxBytes?:number;className?:string}){
 const input=useRef<HTMLInputElement>(null),access=usePageAccess();
 const [error,setError]=useState('');
 const disabled=busy||!access.write;
 return <Field label={label} className={className} error={error||externalError||undefined}><Input id={id} ref={input} hidden type="file" accept={accept.join(',')} disabled={disabled} aria-label={label} onChange={event=>{
  const selected=event.target.files?.[0];event.target.value='';if(!selected||disabled)return;
  const error=fileSelectionError(selected,accept,maxBytes);if(error){setError(error);return;}
  setError('');onSelect(selected);
 }}/><div className="file-upload-control" aria-busy={busy}>{preview&&<LocalizedElement as="img" src={preview} alt={label}/>}<div className="file-upload-details">{file&&<span><LocalizedText verbatim>{file.name}</LocalizedText></span>}<div className="file-upload-actions"><Button variant="upload" icon="upload" disabled={disabled} onClick={()=>input.current?.click()}><LocalizedText>{file||preview?'Datei ersetzen':'Datei auswählen'}</LocalizedText></Button>{onRemove&&(file||preview)&&<Button variant="ghost" disabled={disabled} onClick={()=>{setError('');onRemove();}}><LocalizedText>Entfernen</LocalizedText></Button>}</div>{busy&&<span role="status"><LocalizedText>Datei wird geprüft und gespeichert.</LocalizedText></span>}</div></div></Field>;
}
