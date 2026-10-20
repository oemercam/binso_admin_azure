'use client';
import {useRef,useState} from 'react';
import {startAuthentication,type PublicKeyCredentialRequestOptionsJSON} from '@simplewebauthn/browser';
import {Button,Field,Input,ErrorState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiPost} from '@/lib/client/backend';

export function PasskeyLogin({remember,onAuthenticated,disabled,onBusy}:{remember:boolean;onAuthenticated:(value:Record<string,unknown>)=>void;disabled:boolean;onBusy:(busy:boolean)=>void}){
 const [open,setOpen]=useState(false),[code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),pending=useRef(false);
 const login=async()=>{
  if(pending.current||disabled)return;pending.current=true;setBusy(true);onBusy(true);setError('');
  try{
   const options=await apiPost<PublicKeyCredentialRequestOptionsJSON>('/api/auth/passkeys/options',{mode:'authenticate'});
   const response=await startAuthentication({optionsJSON:options});
   const result=await apiPost<Record<string,unknown>>('/api/auth/passkeys/verify',{mode:'authenticate',response,code,remember});
   setCode('');onAuthenticated(result);
  }catch(e){setError(e instanceof Error?e.message:'Anmeldung nicht möglich.');}finally{pending.current=false;setBusy(false);onBusy(false)}
 };
 return <div className="auth-form-demo">
  {!open?<Button variant="secondary" disabled={disabled} onClick={()=>{setOpen(true);setError('')}}><LocalizedText>{'Mit Passkey anmelden'}</LocalizedText></Button>:<>
   <Field label="Authenticator-Code"><Input value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000"/></Field>
   <p className="settings-note"><LocalizedText>{'Bei eingerichtetem Authenticator bleibt der zusätzliche Code erforderlich.'}</LocalizedText></p>
   {error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}
   <Button variant="secondary" disabled={busy||disabled} onClick={()=>void login()}><LocalizedText>{busy?'Wird geprüft…':'Passkey verwenden'}</LocalizedText></Button>
  </>}
 </div>;
}
