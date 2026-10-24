"use client";
import {useEffect,useState,useSyncExternalStore} from 'react';
import {apiGet} from './backend';
import {dataRevision,subscribeClientData} from './data-events';
import {clearQuerySnapshots,readQuerySnapshot,writeQuerySnapshot} from './query-snapshot';

let snapshotSession=dataRevision([]);
subscribeClientData(()=>{const session=dataRevision([]);if(session!==snapshotSession){clearQuerySnapshots();snapshotSession=session;}});

/** Revalidate mounted consumers only; an obsolete response cannot overwrite newer state. */
export function useDataRevision(paths:readonly string[]){
 const key=JSON.stringify(paths);
 return useSyncExternalStore(subscribeClientData,()=>dataRevision(JSON.parse(key)),()=> '');
}
export function useApiQuery<T>(path:string|null){
 const revision=useDataRevision(path?[path]:[]);
 const [state,setState]=useState<{path:string|null;revision:string;session:string;attempt:number;data:T|undefined;error:string|null;loading:boolean}>({path:null,revision:'',session:'',attempt:-1,data:undefined,error:null,loading:Boolean(path)});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!path)return;
  const interval=window.setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine)setRetry(value=>value+1)},60000);
  return()=>window.clearInterval(interval);
 },[path]);
 useEffect(()=>{
  if(!path)return;
  let active=true;
  const session=dataRevision([]);
  const snapshot=retry===0?readQuerySnapshot<T>(path,revision,session):undefined;
  if(snapshot!==undefined){queueMicrotask(()=>{if(active)setState({path,revision,session,attempt:retry,data:snapshot,error:null,loading:false})});return()=>{active=false;};}
  queueMicrotask(()=>{if(active)setState(previous=>({path,revision,session,attempt:retry,data:previous.path===path&&previous.session===session?previous.data:undefined,error:null,loading:true}));});
  apiGet<T>(path).then(data=>{if(active){writeQuerySnapshot(path,revision,session,data);setState({path,revision,session,attempt:retry,data,error:null,loading:false});}}).catch(error=>{const denied=typeof error==='object'&&error!==null&&'status' in error&&[401,403,404].includes(Number(error.status));if(denied)clearQuerySnapshots();if(active)setState(previous=>({path,revision,session,attempt:retry,data:!denied&&previous.path===path&&previous.session===session?previous.data:undefined,error:error instanceof Error?error.message:'Daten konnten nicht geladen werden.',loading:false}));});
  return()=>{active=false;};
 },[path,revision,retry]);
 const current=state.path===path&&state.revision===revision&&state.attempt===retry;
 const sameSession=state.path===path&&state.session===dataRevision([]);
 // A newly mounted page must not first show a five-minute-old result. Existing
 // mounted data can remain during background refresh; navigation uses the same
 // 30-second freshness window as the request shortcut above.
 const data=(sameSession?state.data:undefined)??(path?readQuerySnapshot<T>(path,revision,dataRevision([])):undefined);
 return {data,error:current?state.error:null,loading:Boolean(path)&&data===undefined&&(!current||state.loading),refreshing:Boolean(path)&&(!current||state.loading)&&data!==undefined,refresh:()=>setRetry(value=>value+1)};
}
