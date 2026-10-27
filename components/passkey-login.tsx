'use client';
import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {browserSupportsWebAuthnAutofill,startAuthentication,WebAuthnAbortService,type PublicKeyCredentialRequestOptionsJSON} from '@simplewebauthn/browser';
import {ErrorState} from './ui';
import {LocalizedText} from '@/lib/client/locale';
import {apiReadPost} from '@/lib/client/backend';
import {supportsPasskeys,passkeyError} from '@/lib/client/passkeys';
export function PasskeyLogin(props:{remember:boolean;onAuthenticated:(value:Record<string,unknown>)=>void;disabled:boolean;onBusy:(busy:boolean)=>void}){
 const latest=useRef(props);useLayoutEffect(()=>{latest.current=props;},[props]);
 const [error,setError]=useState('');
 const pending=useRef(false),mounted=useRef(false),options=useRef<Promise<PublicKeyCredentialRequestOptionsJSON>|null>(null),issued=useRef(0);
 const prepare=()=>{if(!options.current||Date.now()-issued.current>240_000){issued.current=Date.now();options.current=apiReadPost<PublicKeyCredentialRequestOptionsJSON>('/api/auth/passkeys/options',{mode:'authenticate'});void options.current.catch(()=>{options.current=null;});}return options.current;};
 const verify=async(response:Awaited<ReturnType<typeof startAuthentication>>)=>{
  const result=await apiReadPost<Record<string,unknown>>('/api/auth/passkeys/verify',{mode:'authenticate',response,remember:latest.current.remember});
  options.current=null;if(mounted.current)latest.current.onAuthenticated(result);
 };
 useEffect(()=>{
  mounted.current=true;const available=supportsPasskeys();
  if(available)void (async()=>{
   if(!await browserSupportsWebAuthnAutofill()||!mounted.current)return;
   const opts=await prepare();if(!mounted.current||pending.current||latest.current.disabled)return;
   const response=await startAuthentication({optionsJSON:opts,useBrowserAutofill:true});
   if(!mounted.current||pending.current||latest.current.disabled)return;
   pending.current=true;latest.current.onBusy(true);
   try{await verify(response);}catch(failure){options.current=null;if(mounted.current)setError(passkeyError(failure));}finally{pending.current=false;if(mounted.current)latest.current.onBusy(false);}
  })().catch(()=>{/* Native autofill is optional; the password form stays available. */});
  return()=>{mounted.current=false;WebAuthnAbortService.cancelCeremony();};
  // One conditional ceremony per mounted login, never per render or keystroke.
 },[]);
 useEffect(()=>{if(props.disabled&&!pending.current)WebAuthnAbortService.cancelCeremony();},[props.disabled]);
 // Existing keys remain reachable through the device's credential chooser.
 // Password-manager autofill is the primary UI; no separate ceremony button.
 return error?<ErrorState><LocalizedText>{error}</LocalizedText></ErrorState>:null;
}
