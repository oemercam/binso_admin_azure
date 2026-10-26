"use client";
import {useRef,useState} from 'react';
import {asLocale} from '@/lib/locales/config';
import {loadLocaleCatalogue} from '@/lib/locales/client-catalogue';
import {useLocale} from './locale';
import {persistLanguagePreference} from './language-preference';
import {dataRevision} from './data-events';
export function useLanguagePreference(persist:false|"tenant"|"operator"){
 const {locale,choose,loadError}=useLocale(),pending=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async(value:string)=>{
  if(pending.current)return;
  const next=asLocale(value);if(next===locale)return;
  pending.current=true;setBusy(true);setError('');
  const session=dataRevision([]);
  try{
   await loadLocaleCatalogue(next);
   if(session!==dataRevision([]))throw new Error('Session changed');
   const confirmed=persist?await persistLanguagePreference(next,persist):next;
   if(session!==dataRevision([]))throw new Error('Session changed');
   await choose(confirmed);
  }
  catch{setError('Sprache konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return {locale,save,busy,error:error||loadError};
}
