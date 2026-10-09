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
 const [state,setState]=useState<{path:string|null;revision:string;data:T|undefined;error:string|null;loading:boolean}>({path:null,revision:'',data:undefined,error:null,loading:Boolean(path)});
 const [retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!path)return;
  let active=true;
  apiGet<T>(path).then(data=>{if(active)setState({path,revision,data,error:null,loading:false});}).catch(error=>{if(active)setState({path,revision,data:undefined,error:error instanceof Error?error.message:'Daten konnten nicht geladen werden.',loading:false});});
  return()=>{active=false;};
 },[path,revision,retry]);
 const current=state.path===path&&state.revision===revision;
 return {data:current?state.data:undefined,error:current?state.error:null,loading:Boolean(path)&&(!current||state.loading),refresh:()=>setRetry(value=>value+1)};
}
