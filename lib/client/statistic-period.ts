'use client';
import {useCallback,useEffect,useMemo,useState,useSyncExternalStore,type SetStateAction} from 'react';
import {businessDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';

const subscribe=()=>()=>{};
const clientReady=()=>true,serverReady=()=>false;
/** Existing per-evaluation session keys, with validated restoration before the
 * first client paint. SSR/hydration retain the same unresolved fallback. */
export function useStatisticPeriod(key:string,initial:StatisticPeriod|null={months:1,from:'',to:''}){
 const [initialPeriod]=useState(initial);
 const ready=useSyncExternalStore(subscribe,clientReady,serverReady);
 const restored=useMemo(()=>{
  if(ready)try{
   const raw=JSON.parse(sessionStorage.getItem('binso.statistics:'+key)??'null');
   const candidate=typeof raw==='number'?{months:raw,from:'',to:''}:raw;
   if(candidate&&statisticBounds(candidate,businessDate()))return candidate as StatisticPeriod;
  }catch{/* Unavailable or invalid storage retains the existing default. */}
  return initialPeriod;
 },[key,ready,initialPeriod]);
 const [selection,setSelection]=useState<{key:string;period:StatisticPeriod|null}|null>(null);
 const period=selection?.key===key?selection.period:restored;
 const setPeriod=useCallback((next:SetStateAction<StatisticPeriod|null>)=>setSelection(previous=>({key,period:typeof next==='function'?next(previous?.key===key?previous.period:restored):next})),[key,restored]);
 useEffect(()=>{if(ready)try{sessionStorage.setItem('binso.statistics:'+key,JSON.stringify(period))}catch{}},[key,period,ready]);
 return [period,setPeriod,ready] as const;
}
