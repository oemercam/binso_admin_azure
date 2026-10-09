"use client";
import {useCallback,useEffect,useRef,useState} from 'react';
import {readClientSession} from '@/lib/client/session-cache';
import {draftScope,readProcessDraft,writeProcessDraft,removeProcessDraft} from '@/lib/client/process-draft';
import {useDataRevision} from '@/lib/client/use-api-query';

/** One recovery owner: identity checked before reading; session fences clear it. */
export function useProcessDraft<T>({process,value,dirty,enabled,onRestore}:{process:string;value:T;dirty:boolean;enabled:boolean;onRestore:(value:T)=>void}){
 const revision=useDataRevision(['/api/auth/session']);
 const [state,setState]=useState<{process:string;revision:string;key:string|null;ready:boolean}|null>(null);
 const latest=useRef({value,dirty,onRestore});
 useEffect(()=>{latest.current={value,dirty,onRestore}},[value,dirty,onRestore]);
 const restored=useRef<string|null>(null),discarded=useRef(false);
 const scopeRevision=useRef<string|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  if(scopeRevision.current!==null&&scopeRevision.current!==revision){discarded.current=true;return;}
  scopeRevision.current=revision;
  let active=true;
  void readClientSession().then(session=>{
   if(!active)return;
   const key=session.authenticated&&!session.tenant?.readOnly&&session.user?.id&&session.tenant?.id&&session.tenant.role?draftScope(session.user.id,session.tenant.id,session.tenant.role,process):null;
   // Missing authenticated identity never grants access to a saved draft.
   setState({process,revision,key,ready:true});
  }).catch(()=>{if(active)setState({process,revision,key:null,ready:true})});
  return()=>{active=false};
 },[enabled,process,revision]);
 const key=state?.process===process&&state.revision===revision?state.key:null;
 const ready=!enabled||Boolean(state?.process===process&&state.revision===revision&&state.ready);
 useEffect(()=>{
  if(!enabled||!ready||!key||restored.current===key)return;
  restored.current=key;discarded.current=false;
  const saved=readProcessDraft<T>(window.sessionStorage,key);
  // A late identity response cannot replace input entered in this document.
  if(saved&&!latest.current.dirty)latest.current.onRestore(saved);
 },[enabled,ready,key]);
 const persist=useCallback((next:T)=>{if(key&&!discarded.current)writeProcessDraft(window.sessionStorage,key,next)},[key]);
 const clear=useCallback(()=>{discarded.current=true;if(key)removeProcessDraft(window.sessionStorage,key)},[key]);
 useEffect(()=>{if(enabled&&ready&&dirty&&key&&!discarded.current)persist(value)},[enabled,ready,dirty,key,value,persist]);
 useEffect(()=>{
  if(!key)return;
  const flush=()=>{if(latest.current.dirty&&!discarded.current)writeProcessDraft(window.sessionStorage,key,latest.current.value)};
  const discard=()=>clear();
  window.addEventListener('pagehide',flush);window.addEventListener('binso-draft-discard',discard);
  return()=>{window.removeEventListener('pagehide',flush);window.removeEventListener('binso-draft-discard',discard)};
 },[key,clear]);
 return {ready,persist,clear};
}
