"use client";

import {useEffect,useRef,useState} from "react";
import {Button,LoadingState,ErrorState,Logo} from "@/components/ui";
import {AuthWorkspace} from '@/components/auth-workspace';
import {authRequest} from '@/lib/client/auth-request';
import {safeAppPath} from '@/lib/navigation';
import {useLocale} from '@/lib/client/locale';
import {registrationLocale,registrationText,type MailLocale} from "@/lib/i18n";
import {clearClientSession} from "@/lib/client/backend";

export default function VerifyEmailPage(){
 const {locale:workspaceLocale,choose}=useLocale(),[locale,setLocale]=useState<MailLocale>(workspaceLocale),initialLocale=useRef(workspaceLocale);
 const [state,setState]=useState<'loading'|'success'|'already'|'invalid'|'unavailable'>('loading'),[next,setNext]=useState('/login'),[attempt,setAttempt]=useState(0);
 useEffect(()=>{const requested=registrationLocale(new URLSearchParams(window.location.search).get('lang')??workspaceLocale);queueMicrotask(()=>setLocale(requested));if(requested!=='tr'&&requested!==workspaceLocale)choose(requested);},[choose,workspaceLocale]);
 const flight=useRef<Promise<{ok:boolean;status:number;alreadyVerified?:boolean;next?:string}>|null>(null);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search),token=params.get('token');
  if(!flight.current)flight.current=token?authRequest('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}).then(async response=>({...await response.json(),ok:response.ok,status:response.status})):Promise.resolve({ok:false,status:400});
  let active=true;
  flight.current.then(payload=>{
   if(!active)return;
   if(!payload.ok){setState(payload.status===400?'invalid':'unavailable');return;}
   setState(payload.alreadyVerified?'already':'success');
   if(!payload.alreadyVerified)clearClientSession();
   if(payload.next)setNext(safeAppPath(payload.next,'/login'));
   // A consumed bearer token must not remain in history, analytics or outgoing referrers.
   window.history.replaceState(window.history.state,'','/email-bestaetigen?lang='+registrationLocale(new URLSearchParams(window.location.search).get('lang')??initialLocale.current));
  }).catch(()=>{if(active)setState('unavailable')});
  return()=>{active=false};
 },[attempt]);
 const t=(key:Parameters<typeof registrationText>[0])=>registrationText(key,locale);
 const card=<section className="auth-card">{locale==='tr'&&<Logo/>}
  {state==='loading'?<><h1>{t('verification')}</h1><LoadingState>{t('sending')}</LoadingState></>:state==='unavailable'?<><h1>{t('verification')}</h1><ErrorState>{t('connectionFailure')}</ErrorState><Button onClick={()=>{flight.current=null;setState('loading');setAttempt(value=>value+1)}}>{t('tryAgain')}</Button></>:state==='invalid'?<><h1>{t('verification')}</h1><p>{t('invalidCode')}</p><Button href={'/login?lang='+locale}>{t('signIn')}</Button></>:<><h1>{t('verified')}</h1><p>{t(state==='already'?'alreadyVerified':'verified')}</p><Button href={state==='already'?'/login?lang='+locale:next}>{t(state==='already'?'signIn':'open')}</Button></>}
 </section>;
 // Registration mail supports Turkish; the general workspace currently has
 // four locales. Preserve the translated verification without inventing a
 // partially translated Turkish workspace or changing the user's app locale.
 return locale==='tr'?<main className="auth-page" lang={locale}>{card}</main>:<AuthWorkspace lang={locale}>{card}</AuthWorkspace>;
}
