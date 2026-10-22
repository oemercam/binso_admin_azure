"use client";
import {useEffect,useRef,useState} from 'react';
import {Avatar} from './avatar';
import {FileUpload} from './file-upload';
import {FormSheet} from './binso-ux';
import {Button,FormActions,ErrorState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
/** A local preview is never a stored profile URL. Upload starts only on confirmation. */
export function AvatarUpload({name,src,busy,error,onConfirm,onRemove}:{name:string;src:string;busy:boolean;error:string;onConfirm:(file:File)=>Promise<boolean>;onRemove:()=>void}){
 const [candidate,setCandidate]=useState<{file:File;url:string}|null>(null),[saving,setSaving]=useState(false),pending=useRef(false);
 useEffect(()=>()=>{if(candidate)URL.revokeObjectURL(candidate.url)},[candidate]);
 const confirm=async()=>{if(!candidate||busy||pending.current)return;pending.current=true;setSaving(true);try{if(await onConfirm(candidate.file))setCandidate(null)}finally{pending.current=false;setSaving(false)}};
 return <><FileUpload id="profile-avatar-upload" label="Profilbild" file={null} preview={src||undefined} accept={["image/png","image/jpeg","image/webp"]} busy={busy||saving} error={error} onSelect={file=>{if(!busy&&!pending.current)setCandidate({file,url:URL.createObjectURL(file)})}} onRemove={onRemove}/><FormSheet label="Profilbild prüfen" open={!!candidate} busy={busy||saving} onClose={()=>{if(!pending.current)setCandidate(null)}}><div className="sheet-body">{candidate&&<Avatar name={name} src={candidate.url} size="large" preview/>}<p><LocalizedText>{"Der mittige Bildausschnitt wird als Profilbild verwendet."}</LocalizedText></p>{error&&<ErrorState>{error}</ErrorState>}</div><FormActions sheet><Button variant="secondary" disabled={busy||saving} onClick={()=>setCandidate(null)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={busy||saving||!candidate} onClick={()=>void confirm()}><LocalizedText>{"Bild übernehmen"}</LocalizedText></Button></FormActions></FormSheet></>;
}
