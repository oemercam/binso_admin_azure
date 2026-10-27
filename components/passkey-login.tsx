'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {browserSupportsWebAuthnAutofill,startAuthentication,WebAuthnAbortService,type PublicKeyCredentialRequestOptionsJSON} from '@simplewebauthn/browser';
import {Button,ErrorState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiReadPost} from '@/lib/client/backend';
import {supportsPasskeys,passkeyError} from '@/lib/client/passkeys';
export function PasskeyLogin(props:{remember:boolean;onAuthenticated:(value:Record<string,unknown>)=>void;disabled:boolean;onBusy:(busy:boolean)=>void}){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const [supported,setSupported]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false),mounted=useRef(false),options=useRef<Promise<PublicKeyCredentialRequestOptionsJSON>|null>(null),issued=useRef(0);
 const prepare=()=>{if(!options.current||Date.now()-issued.current>240_000){issued.current=Date.now();options.current=apiReadPost<PublicKeyCredentialRequestOptionsJSON>('/api/auth/passkeys/options',{mode:'authenticate'});void options.current.catch(()=>{options.current=null;});}return options.current;};
 const verify=async(response:Awaited<ReturnType<typeof startAuthentication>>)=>{
  const result=await apiReadPost<Record<string,unknown>>('/api/auth/passkeys/verify',{mode:'authenticate',response,remember:latest.current.remember});
  options.current=null;if(mounted.current)latest.current.onAuthenticated(result);
 };
 useEffect(()=>{
  mounted.current=true;const available=supportsPasskeys();queueMicrotask(()=>setSupported(available));
  if(available)void (async()=>{
   if(!await browserSupportsWebAuthnAutofill()||!mounted.current)return;
   const opts=await prepare();if(!mounted.current||pending.current||latest.current.disabled)return;
   const response=await startAuthentication({optionsJSON:opts,useBrowserAutofill:true});
   if(!mounted.current||pending.current||latest.current.disabled)return;
   pending.current=true;setBusy(true);latest.current.onBusy(true);
   try{await verify(response);}catch(failure){options.current=null;if(mounted.current)setError(passkeyError(failure));}finally{pending.current=false;if(mounted.current){setBusy(false);latest.current.onBusy(false);}}
  })().catch(()=>{/* Autofill is optional; explicit login remains available. */});
  return()=>{mounted.current=false;WebAuthnAbortService.cancelCeremony();};
  // One conditional ceremony per mounted login, never per render or keystroke.
 },[]);
 useEffect(()=>{if(props.disabled&&!pending.current)WebAuthnAbortService.cancelCeremony();},[props.disabled]);
 const login=async()=>{
  if(pending.current||latest.current.disabled)return;pending.current=true;setBusy(true);latest.current.onBusy(true);setError('');
  WebAuthnAbortService.cancelCeremony();
  try{const opts=await prepare();await verify(await startAuthentication({optionsJSON:opts}));}
  catch(failure){options.current=null;if(mounted.current)setError(passkeyError(failure));}
  finally{pending.current=false;if(mounted.current){setBusy(false);latest.current.onBusy(false);}}
 };
 if(!supported)return null;
 return <><div className="auth-passkey"><Button disabled={props.disabled||busy} onClick={()=>void login()}><LocalizedText>{busy?'Wird geprüft…':'Mit Passkey anmelden'}</LocalizedText></Button>{error&&<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>}</div><div className="auth-divider"><span><LocalizedText>{'oder'}</LocalizedText></span></div></>;
}
