"use client";
import {cloneElement,useEffect,useState,type ReactElement} from 'react';
import {AppStart} from './app-start';

/** Keep the existing launch surface until the first usable page is ready.
 * Children mount behind it so their independent reads still run in parallel.
 * Later navigation/background refreshes retain the mounted shell and drafts. */
export function WorkspaceStartup({identityReady,contentReady,children}:{identityReady:boolean;contentReady:boolean;children:ReactElement<{hidden?:boolean}>}){
 const [started,setStarted]=useState(false);
 useEffect(()=>{
  if(identityReady?(!contentReady||started):!started)return;
  let active=true;queueMicrotask(()=>{if(active)setStarted(identityReady)});
  return()=>{active=false};
 },[identityReady,contentReady,started]);
 const pending=!identityReady||!started&&!contentReady;
 return <>{pending&&<AppStart/>}{cloneElement(children,{hidden:pending})}</>;
}
