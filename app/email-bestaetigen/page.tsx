"use client";

import {useEffect,useRef,useState} from "react";
import {Button,Logo} from "@/components/ui";
import {registrationLocale,registrationText,type MailLocale} from "@/lib/i18n";
import {clearDemoClientSession} from "@/lib/client/backend";

export default function VerifyEmailPage(){
 const [state,setState]=useState<'loading'|'success'|'already'|'invalid'>('loading'),[locale,setLocale]=useState<MailLocale>('de'),[next,setNext]=useState('/login');
 const flight=useRef<Promise<{ok:boolean;alreadyVerified?:boolean;next?:string}>|null>(null);
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search),token=params.get('token');
  queueMicrotask(()=>setLocale(registrationLocale(params.get('lang'))));
  if(!flight.current)flight.current=token?fetch('/api/auth/verify-email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})}).then(async response=>({...await response.json(),ok:response.ok})):Promise.resolve({ok:false});
  let active=true;
  flight.current.then(payload=>{
   if(!active)return;
   if(!payload.ok){setState('invalid');return;}
   setState(payload.alreadyVerified?'already':'success');
   if(!payload.alreadyVerified)clearDemoClientSession();
   if(payload.next?.startsWith('/')&&!payload.next.startsWith('//'))setNext(payload.next);
   // A consumed bearer token must not remain in history, analytics or outgoing referrers.
   window.history.replaceState(window.history.state,'','/email-bestaetigen?lang='+registrationLocale(params.get('lang')));
  }).catch(()=>{if(active)setState('invalid')});
  return()=>{active=false};
 },[]);
 const t=(key:Parameters<typeof registrationText>[0])=>registrationText(key,locale);
 return <main className="auth-page" lang={locale}><section className="auth-card"><Logo/>
  {state==='loading'?<><h1>{t('verification')}</h1><p>{t('sending')}</p></>:state==='invalid'?<><h1>{t('verification')}</h1><p>{t('invalidCode')}</p><Button href={'/login?lang='+locale}>{t('signIn')}</Button></>:<><h1>{t('verified')}</h1><p>{t(state==='already'?'alreadyVerified':'verified')}</p><Button href={state==='already'?'/login?lang='+locale:next}>{t(state==='already'?'signIn':'open')}</Button></>}
 </section></main>;
}
