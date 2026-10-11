"use client";
import {useId,useState} from 'react';
import type {MonitoringSeries} from '@/lib/observability/model';
import {EmptyState} from './ui';
/** Bounded measured time series. Nulls form gaps; no invented samples or smoothing. */
export function MonitoringChart({series,unavailable=false}:{series:MonitoringSeries;unavailable?:boolean}){
 const id=useId(),[selected,setSelected]=useState<string|null>(null);
 const points=series.points.filter(point=>Number.isFinite(Date.parse(point.at))&&point.value!==null&&Number.isFinite(point.value)).slice(-24);
 const max=Math.max(1,...points.map(point=>point.value!));
 const first=points[0]?Date.parse(points[0].at):0,last=points.at(-1)?Date.parse(points.at(-1)!.at):first;
 const x=(at:string)=>20+(Date.parse(at)-first)/Math.max(1,last-first)*260,y=(value:number)=>110-value/max*90;
 const segments:string[][]=[];let previous=0;
 for(const point of points){const time=Date.parse(point.at);if(!segments.length||time-previous>3600000)segments.push([]);segments.at(-1)!.push(x(point.at)+','+y(point.value!));previous=time;}
 return <section className="bo-monitor-chart" aria-labelledby={id}><h3 id={id}>{series.label}</h3><small>{series.source} · {series.unit}</small>{unavailable||!points.length?<EmptyState compact icon="chart" title={unavailable?'Messdaten veraltet':'Keine Messdaten'} text="Keine verifizierte Zeitreihe verfügbar."/>:<><svg viewBox="0 0 300 140" role="img" aria-label={series.label+' · '+points.length+' gemessene Stundenwerte'}><path d="M20 20V110H280" fill="none" stroke="var(--color-line)"/><text x="20" y="14">{max.toLocaleString('de-CH')}</text><text x="4" y="115">0</text>{segments.map((segment,i)=><polyline key={i} points={segment.join(' ')} fill="none" stroke="currentColor" strokeWidth="2"/>)}{points.map(point=><circle key={point.at} cx={x(point.at)} cy={y(point.value!)} r="3"><title>{new Date(point.at).toLocaleString('de-CH')+': '+point.value+' '+series.unit}</title></circle>)}<text x="20" y="134">{new Date(first).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</text><text x="280" y="134" textAnchor="end">{new Date(last).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</text></svg><div className="bo-monitor-point-list">{points.map(point=><button key={point.at} type="button" aria-pressed={selected===point.at} onClick={()=>setSelected(point.at)}>{new Date(point.at).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}: {point.value!.toLocaleString('de-CH')} {series.unit}</button>)}</div></>}</section>;
}
