"use client";
import {useEffect,useRef,useState} from 'react';
import {AuthWorkspace} from './auth-workspace';
import {Button,Field,Input,ErrorState,LoadingState,FormActions} from './ui';
import {DocumentModal} from './pdf-preview';
import {LocalizedText} from '@/lib/client/locale';

export function PublicReport(){
 const token=useRef(''),key=useRef(crypto.randomUUID()),pending=useRef(false);
 const [valid,setValid]=useState<boolean|null>(null),[busy,setBusy]=useState(false),[sent,setSent]=useState(false),[code,setCode]=useState(''),[error,setError]=useState(''),[file,setFile]=useState<Blob|null>(null),[preview,setPreview]=useState(false);
 useEffect(()=>{token.current=location.hash.slice(1);queueMicrotask(()=>setValid(/^[A-Za-z0-9_-]{43}$/.test(token.current)));},[]);
 const act=async(action:'challenge'|'pdf')=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');if(action==='challenge')setSent(true);
  try{
   const response=await fetch('/api/public/report',{method:'POST',credentials:'omit',cache:'no-store',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token.current,action,...(action==='pdf'?{code,key:key.current}:{})}),signal:AbortSignal.timeout(20000)});
   if(!response.ok){const issue=await response.json().catch(()=>null);throw Error(issue?.message??'Bericht konnte nicht geladen werden.');}
   if(action==='challenge'){const result=await response.json();if(result.providerAccepted!==true||result.deliveryConfirmed!==false)throw Error('Der Codeversand konnte nicht bestätigt werden. Bitte den Posteingang prüfen.');setSent(true);}
   else{if(response.headers.get('Content-Type')?.split(';')[0]!=='application/pdf')throw Error('Bericht konnte nicht geladen werden.');setFile(await response.blob());setPreview(true);setCode('');}
  }catch(issue){setError(issue instanceof Error?issue.message:'Bericht konnte nicht geladen werden.');}
  finally{pending.current=false;setBusy(false)}
 };
 return <AuthWorkspace variant="message"><section className="auth-card"><h1><LocalizedText>Bericht</LocalizedText></h1>
  {valid===null?<LoadingState/>:!valid?<p><LocalizedText>Bitte den vollständigen Berichtslink aus deiner E-Mail öffnen.</LocalizedText></p>:<><p><LocalizedText>Dieser Bericht ist geschützt. Fordere einen Code an die festgelegte E-Mail-Adresse an, um ihn anzusehen.</LocalizedText></p>
   {!file&&<Button disabled={busy} onClick={()=>void act('challenge')}><LocalizedText>{sent?'Neuen Code anfordern':'Code anfordern'}</LocalizedText></Button>}
   {sent&&!file&&<form onSubmit={event=>{event.preventDefault();void act('pdf');}}><Field label="Bestätigungscode"><Input required inputMode="numeric" autoComplete="one-time-code" minLength={6} maxLength={6} pattern="[0-9]{6}" disabled={busy} value={code} onChange={event=>{setCode(event.target.value);key.current=crypto.randomUUID();}}/></Field><FormActions><Button type="submit" disabled={busy||code.length!==6}>Bericht öffnen</Button></FormActions></form>}
   {file&&<Button onClick={()=>setPreview(true)}>PDF ansehen</Button>}
  </>}{error&&<ErrorState>{error}</ErrorState>}
  {preview&&file&&<DocumentModal title="Berichte" fileBlob={file} fileName="binso-report" onClose={()=>setPreview(false)}/>}</section></AuthWorkspace>;
}
