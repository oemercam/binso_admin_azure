"use client";
import {createContext,useContext,useEffect,useState} from 'react';
import {greetingPeriod,greetingZone,nextGreetingChange} from '@/lib/dashboard-greeting';
import {useTranslation} from './locale';

/** Reuses the shell's existing profile query, without another request or poll. */
export const UserProfileContext=createContext<Record<string,unknown>|null>(null);
export function useDashboardGreeting(){
 const profile=useContext(UserProfileContext),translate=useTranslation();
 const zone=greetingZone(profile?.timezone??profile?.time_zone);
 const [period,setPeriod]=useState<string|null>(null);
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>|undefined;
  const update=()=>{clearTimeout(timer);const now=new Date();setPeriod(greetingPeriod(now,zone));timer=setTimeout(update,nextGreetingChange(now,zone)-now.getTime()+100);};
  const resume=()=>{if(document.visibilityState==='visible')update();};
  update();document.addEventListener('visibilitychange',resume);window.addEventListener('focus',update);
  return()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',resume);window.removeEventListener('focus',update);};
 },[zone]);
 const firstName=typeof profile?.first_name==='string'?profile.first_name.trim():'';
 // Do not flash an assumed time of day or an anonymous greeting before the
 // shell's existing profile request has resolved.
 return period===null||profile===null?'':translate(period)+(firstName?', '+firstName:'');
}
