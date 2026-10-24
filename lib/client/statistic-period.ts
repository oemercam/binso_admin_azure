'use client';
import {useEffect,useRef,useState} from 'react';
import {businessDate} from '@/lib/financial-status';
import {statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';

/** Existing per-evaluation session keys, with validated restoration. */
export function useStatisticPeriod(key:string,initial:StatisticPeriod|null={months:1,from:'',to:''}){
 const initialPeriod=useRef(initial);
 const [period,setPeriod]=useState(initial),[restoredKey,setRestoredKey]=useState<string|null>(null);
 useEffect(()=>{let active=true;let saved:StatisticPeriod|null|undefined;try{const raw=JSON.parse(sessionStorage.getItem('binso.statistics:'+key)??'null');const candidate=typeof raw==='number'?{months:raw,from:'',to:''}:raw;if(candidate&&statisticBounds(candidate,businessDate()))saved=candidate;}catch{}queueMicrotask(()=>{if(active){setPeriod(saved??initialPeriod.current);setRestoredKey(key)}});return()=>{active=false}},[key]);
 useEffect(()=>{if(restoredKey===key)try{sessionStorage.setItem('binso.statistics:'+key,JSON.stringify(period))}catch{}},[key,period,restoredKey]);
 return [period,setPeriod,restoredKey===key] as const;
}
