"use client";
import {LocalizedText,useLocale,useTranslation} from "@/lib/client/locale";
import {localeTags} from "@/lib/locales/config";
import {useId,useState} from 'react';
import type {MonitoringSeries} from '@/lib/observability/model';
import {EmptyState,Select} from './ui';
/** Bounded measured time series. Nulls form gaps; no invented samples or smoothing. */
export function MonitoringChart({series,unavailable=false}:{series:MonitoringSeries;unavailable?:boolean}){
 const {locale}=useLocale(),translate=useTranslation();
 const id=useId();
 const [selectedAt,setSelectedAt]=useState('');
 const timeline=series.points.filter(point=>Number.isFinite(Date.parse(point.at))).slice(-24);
 const points=timeline.filter(point=>point.value!==null&&Number.isFinite(point.value)&&point.value>=0);
 const selected=points.find(point=>point.at===selectedAt)??points.at(-1);
 const max=Math.max(1,...points.map(point=>point.value!));
 const first=timeline[0]?Date.parse(timeline[0].at):0,last=timeline.at(-1)?Date.parse(timeline.at(-1)!.at):first;
 const x=(at:string)=>20+(Date.parse(at)-first)/Math.max(1,last-first)*260,y=(value:number)=>110-value/max*90;
 const segments:string[][]=[];let previous=0,gap=true;
 for(const point of timeline){if(point.value===null||!Number.isFinite(point.value)||point.value<0){gap=true;continue;}const time=Date.parse(point.at);if(gap||time-previous>3600000)segments.push([]);segments.at(-1)!.push(x(point.at)+','+y(point.value));previous=time;gap=false;}
 return <section className="bo-monitor-chart" aria-labelledby={id}><h3 id={id}><LocalizedText>{series.label}</LocalizedText></h3><small><LocalizedText>{series.source}</LocalizedText> · {series.unit}</small>{unavailable||!points.length?<EmptyState   title={unavailable?'Messdaten veraltet':'Keine Messdaten'} description="Keine verifizierte Zeitreihe verfügbar."/>:<><svg viewBox="0 0 300 140" role="img" aria-label={translate(series.label)+' · '+translate('Gemessene Stundenwerte: {0}').replace('{0}',String(points.length))}><path d="M20 20V110H280" fill="none" stroke="var(--color-line)"/><text x="20" y="14">{max.toLocaleString(localeTags[locale])}</text><text x="4" y="115">0</text>{segments.map((segment,i)=><polyline key={i} points={segment.join(' ')} fill="none" stroke="currentColor" strokeWidth="2"/>)}{points.map(point=><circle key={point.at} cx={x(point.at)} cy={y(point.value!)} r={selected?.at===point.at?5:3}><title>{new Date(point.at).toLocaleString(localeTags[locale])+': '+point.value+' '+series.unit}</title></circle>)}<text x="20" y="134">{new Date(first).toLocaleTimeString(localeTags[locale],{hour:'2-digit',minute:'2-digit'})}</text><text x="280" y="134" textAnchor="end">{new Date(last).toLocaleTimeString(localeTags[locale],{hour:'2-digit',minute:'2-digit'})}</text></svg><label className="bo-monitor-point-select"><LocalizedText>{"Messpunkt"}</LocalizedText><Select aria-label={translate(series.label)+' · '+translate('Messpunkt')} value={selected!.at} onChange={event=>setSelectedAt(event.target.value)}>{points.map(point=><option key={point.at} value={point.at}>{new Date(point.at).toLocaleTimeString(localeTags[locale],{hour:'2-digit',minute:'2-digit'})}: {point.value!.toLocaleString(localeTags[locale])} {series.unit}</option>)}</Select></label><output className="bo-monitor-selected-point"><LocalizedText>{new Date(selected!.at).toLocaleString(localeTags[locale],{dateStyle:'short',timeStyle:'short'})+' · '+selected!.value!.toLocaleString(localeTags[locale])+' '+series.unit}</LocalizedText></output></>}</section>;
}
