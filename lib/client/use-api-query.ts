"use client";
import {useEffect,useState,useSyncExternalStore} from 'react';
import {apiGet} from './backend';
import {dataRevision,subscribeClientData} from './data-events';

/** Revalidate mounted consumers only; an obsolete response cannot overwrite newer state. */
export function useDataRevision(paths:readonly string[]){
 const key=JSON.stringify(paths);
 return useSyncExternalStore(subscribeClientData,()=>dataRevision(JSON.parse(key)),()=> '');
}
export function useApiQuery<T>(path:string|null){
 const revision=useDataRevision(path?[path]:[]);
 const [state,setState]=useState<{path:string|null;revision:string;session:string;data:T|undefined;error:string|null;loading:boolean}>({path:null,revision:'',session:'',data:undefined,error:null,loading:Boolean(path)});
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
  apiGet<T>(path).then(data=>{if(active)setState({path,revision,session,data,error:null,loading:false});}).catch(error=>{if(active)setState({path,revision,session,data:undefined,error:error instanceof Error?error.message:'Daten konnten nicht geladen werden.',loading:false});});
  return()=>{active=false;};
 },[path,revision,retry]);
 const current=state.path===path&&state.revision===revision;
 const sameSession=state.path===path&&state.session===dataRevision([]);
 const data=sameSession?state.data:undefined;
 return {data,error:current?state.error:null,loading:Boolean(path)&&data===undefined&&(!current||state.loading),refreshing:Boolean(path)&&!current&&data!==undefined,refresh:()=>setRetry(value=>value+1)};
}
