'use client';
import {useEffect,useRef,useState} from 'react';
import {FormSheet} from './binso-ux';
import {Button,Field,Input,FormActions,ErrorState} from './ui';
import {PasswordInput} from './password-input';
import {apiPost,type FreshAuthenticationRequest} from '@/lib/client/backend';
import {LocalizedText} from '@/lib/client/locale';

/** Existing sheet/controls; credentials remain in memory and never enter drafts. */
export function FreshAuthenticationDialog(){
 const [request,setRequest]=useState<FreshAuthenticationRequest|null>(null),current=useRef<FreshAuthenticationRequest|null>(null);
 const [password,setPassword]=useState(''),[code,setCode]=useState(''),[method,setMethod]=useState<'email'|'totp'|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),pending=useRef(false);
 const clear=()=>{setRequest(null);current.current=null;setPassword('');setCode('');setMethod(null);setError('');};
 useEffect(()=>{
  const begin=(event:Event)=>{const next=(event as CustomEvent<FreshAuthenticationRequest>).detail;current.current=next;setRequest(next);};
  const expire=()=>{current.current=null;setRequest(null);setPassword('');setCode('');setMethod(null);setError('');};
  window.addEventListener('binso-fresh-authentication',begin);window.addEventListener('binso-fresh-authentication-expired',expire);
  return()=>{window.removeEventListener('binso-fresh-authentication',begin);window.removeEventListener('binso-fresh-authentication-expired',expire);current.current?.cancel();};
 },[]);
 const cancel=()=>{request?.cancel();clear();};
 const submit=async()=>{
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  const target=current.current;
  try{
   if(!method){const result=await apiPost<{method:'email'|'totp'}>('/api/auth/reauthenticate',{action:'challenge',password});if(current.current===target)setMethod(result.method);}
   else{const result=await apiPost<{ok:boolean}>('/api/auth/reauthenticate',{action:'confirm',password,code});if(result.ok!==true)throw new Error('Sicherheitsbestätigung konnte nicht bestätigt werden.');if(current.current===target){clear();target?.confirm();}}
  }catch(failure){if(current.current===target)setError(failure instanceof Error?failure.message:'Sicherheitsbestätigung fehlgeschlagen.');}finally{pending.current=false;setBusy(false);}
 };
 return <FormSheet open={!!request} label="Aktion bestätigen" busy={busy} onClose={cancel}><form className="settings-form" onSubmit={event=>{event.preventDefault();void submit();}}>
  <p><LocalizedText>{request?.action??'Geschützte Einstellungen ändern'}</LocalizedText></p>
  <Field label="Aktuelles Passwort"><PasswordInput value={password} required maxLength={256} autoComplete="current-password" disabled={busy} onChange={event=>{setPassword(event.target.value);setMethod(null);setCode('');}}/></Field>
  {method&&<Field label={method==='totp'?'Authenticator- oder Recovery-Code':'E-Mail-Code'}><Input value={code} required inputMode={method==='totp'?'text':'numeric'} autoComplete="one-time-code" maxLength={method==='totp'?80:6} disabled={busy} onChange={event=>setCode(method==='totp'?event.target.value:event.target.value.replace(/\D/g,'').slice(0,6))}/></Field>}
  {error&&<ErrorState>{error}</ErrorState>}
  <FormActions sheet><Button type="button" variant="secondary" disabled={busy} onClick={cancel}><LocalizedText>{'Abbrechen'}</LocalizedText></Button><Button type="submit" disabled={busy||!password||!!method&&(method==='totp'?code.trim().length<6:code.length!==6)}><LocalizedText>{method?'Aktion bestätigen':'Weiter'}</LocalizedText></Button></FormActions>
 </form></FormSheet>;
}
