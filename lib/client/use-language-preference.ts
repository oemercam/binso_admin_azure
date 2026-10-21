"use client";
import {useRef,useState} from 'react';
import {asLocale} from '@/lib/locales/config';
import {useLocale} from './locale';
import {persistLanguagePreference} from './language-preference';
export function useLanguagePreference(persist:false|"tenant"|"operator"){
 const {locale,choose}=useLocale(),pending=useRef(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const save=async(value:string)=>{
  if(pending.current)return;
  const next=asLocale(value);if(next===locale)return;
  if(!persist){choose(next);return;}
  pending.current=true;setBusy(true);setError('');
  try{choose(await persistLanguagePreference(next,persist));}
  catch{setError('Sprache konnte nicht gespeichert werden.');}
  finally{pending.current=false;setBusy(false);}
 };
 return {locale,save,busy,error};
}
