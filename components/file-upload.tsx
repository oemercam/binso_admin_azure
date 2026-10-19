"use client";
import {useRef,useState} from 'react';
import {usePageAccess} from '@/lib/client/page-access';
import {LocalizedText,LocalizedElement} from '@/lib/client/locale';
import {limitsConfig,megabytes} from '@/config/limits';
import {Button,Field,Input} from './ui';

/** A form control, not a second page action. Server content/scan checks remain mandatory. */
export function FileUpload({id,label,file,preview,accept,onSelect,onRemove,busy=false,className=''}:{id?:string;label:string;file:File|null;preview?:string;accept:readonly string[];onSelect:(file:File)=>void;onRemove?:()=>void;busy?:boolean;className?:string}){
 const input=useRef<HTMLInputElement>(null),access=usePageAccess();
 const [error,setError]=useState('');
 const disabled=busy||!access.write;
 return <Field label={label} className={className} error={error||undefined}><Input id={id} ref={input} hidden type="file" accept={accept.join(',')} disabled={disabled} aria-label={label} onChange={event=>{
  const selected=event.target.files?.[0];event.target.value='';if(!selected||disabled)return;
  if(!accept.includes(selected.type)){setError('Bitte einen unterstützten Dateityp auswählen.');return;}
  if(!selected.size||selected.size>limitsConfig.maxFileUploadBytes){setError(`Die Datei muss zwischen 1 Byte und ${megabytes(limitsConfig.maxFileUploadBytes)} MB gross sein.`);return;}
  setError('');onSelect(selected);
 }}/><div className="file-upload-control" aria-busy={busy}>{preview&&<LocalizedElement as="img" src={preview} alt={label}/>}<div className="file-upload-details">{file&&<span><LocalizedText verbatim>{file.name}</LocalizedText></span>}<div className="file-upload-actions"><Button variant="upload" icon="upload" disabled={disabled} onClick={()=>input.current?.click()}><LocalizedText>{file||preview?'Datei ersetzen':'Datei auswählen'}</LocalizedText></Button>{onRemove&&(file||preview)&&<Button variant="ghost" disabled={disabled} onClick={()=>{setError('');onRemove();}}><LocalizedText>Entfernen</LocalizedText></Button>}</div>{busy&&<span role="status"><LocalizedText>Datei wird geprüft und gespeichert.</LocalizedText></span>}</div></div></Field>;
}
