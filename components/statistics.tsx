"use client";
import {LocalizedText,LocalizedElement,useTranslation,useLocale} from "@/lib/client/locale";
import {localeTags} from '@/lib/locales/config';
import Link from "next/link";
import {comparisonBarWidths} from "@/lib/cash-statistics";
import {useId,useState} from 'react';
import {MetricTiles,MetricTile} from './binso-ux';
import {Button,LoadingState} from './ui';
import {sumMoney} from '@/lib/money';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import {aggregateStatistics,lineChartCoordinates,statisticBounds,type StatisticBucket,type StatisticEvent,type StatisticPeriod} from '@/lib/statistics-period';

import {StatisticPeriodPicker} from './statistic-period-picker';
export {StatisticPeriodPicker} from './statistic-period-picker';
import {useStatisticPeriod} from '@/lib/client/statistic-period';

export type Series={key:string;label:string;tone:'positive'|'negative'|'neutral'|'warning'};
export type RingPart={key:string;label:string;tone:Series['tone'];value:number;href?:string};
export type Metric={label:string;value:number;format?:'number'|'money';hint?:string};
/** Segments are parts of one explicitly named total, never independent KPIs. */
export function RingChart({label,parts,currency='CHF',format='money',compact=false,navigate=false}:{compact?:boolean;navigate?:boolean;label:string;parts:readonly RingPart[];currency?:string;format?:'money'|'number'}){
 const translate=useTranslation(),{locale}=useLocale();
 const [selected,setSelected]=useState<string|null>(null);
 const valid=parts.every(part=>Number.isFinite(part.value)&&part.value>=0);
 const total=valid?sumMoney(parts.map(part=>part.value)):0;
 const value=(amount:number)=>format==='number'?amount.toLocaleString(localeTags[locale]):formatCurrency(amount,currency,localeTags[locale]);
 const selectedPart=parts.find(part=>part.key===selected);
 if(!valid||total<=0&&!compact)return <p role="status"><LocalizedText>{"Keine positiven Anteile für "}</LocalizedText><LocalizedText>{label}</LocalizedText>.</p>;
 return <div className="bo-ring-chart" data-compact={compact||undefined}><div className="bo-ring-visual"><svg viewBox="0 0 120 120" role="group" aria-label={translate(label)+': '+value(total)}><circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-line)" strokeWidth="10"/>{parts.map((part,index)=>{
  const percent=valid&&total>0?part.value/total*100:0,start=valid&&total>0?sumMoney(parts.slice(0,index).map(part=>part.value))/total*100:0;
  return <circle key={part.key} role={part.value>0?'button':undefined} tabIndex={part.value>0?0:undefined} aria-label={translate(part.label)+': '+value(part.value)} aria-pressed={selected===part.key} onClick={()=>setSelected(part.key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(part.key)}}} cx="60" cy="60" r="48" pathLength="100" fill="none" stroke={'var(--chart-'+part.tone+')'} strokeWidth="10" strokeDasharray={`${percent} ${100-percent}`} strokeDashoffset={-start} transform="rotate(-90 60 60)"><title>{translate(part.label)+': '+value(part.value)+' · '+percent.toLocaleString(localeTags[locale],{maximumFractionDigits:1})+' %'}</title></circle>;
 })}</svg></div><div className="bo-ring-details"><div className="bo-ring-total"><span><LocalizedText>{label}</LocalizedText></span><strong>{value(total)}</strong></div>{parts.map(part=>{const body=<><i className={'bo-statistics-'+part.tone}/><span><LocalizedText>{part.label}</LocalizedText></span><strong><span>{value(part.value)}</span><small>{valid&&total>0?(part.value/total*100).toLocaleString(localeTags[locale],{maximumFractionDigits:1})+' %':'—'}</small></strong></>;return navigate&&part.href?<Link className="bo-ring-status" key={part.key} href={part.href}>{body}</Link>:<button type="button" key={part.key} aria-pressed={selected===part.key} onClick={()=>setSelected(part.key)} onFocus={()=>setSelected(part.key)}>{body}</button>})}<output aria-live="polite">{selectedPart?<><LocalizedText>{selectedPart.label}</LocalizedText>{': '+value(selectedPart.value)}</>:value(total)}</output>{!navigate&&parts.find(part=>part.key===selected)?.href&&<Button variant="ghost" href={parts.find(part=>part.key===selected)!.href}><LocalizedText>{'Details anzeigen'}</LocalizedText></Button>}</div></div>;
}

/** Time is encoded horizontally; value is encoded vertically around true zero. */
export function LineChart({buckets,series,selected,onSelect,value}:{buckets:readonly StatisticBucket[];series:readonly Series[];selected:string|null;onSelect:(key:string)=>void;value:(amount:number)=>string}){
 const chart=lineChartCoordinates(buckets,series.map(item=>item.key));
 if(!buckets.length||!series.length)return null;
 const labels=[...new Set([0,Math.floor((buckets.length-1)/3),Math.floor((buckets.length-1)*2/3),buckets.length-1])];
 return <><div className="bo-statistics-frame"><div className="bo-statistics-scale" aria-hidden="true">{[chart.maximum,(chart.maximum+chart.minimum)/2,chart.minimum].map((tick,index)=><span key={index} data-value={tick}>{value(tick)}</span>)}</div><LocalizedElement as="div" className="bo-statistics-plot" role="group" aria-label={series.map(item=>item.label).join(' und ')}><svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="group" preserveAspectRatio="none" onClick={event=>{
  const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*chart.width;
  const closest=chart.paths[0].points.reduce((a,b)=>Math.abs(a.x-x)<=Math.abs(b.x-x)?a:b);onSelect(closest.key);
 }}>
  <line className="bo-statistics-zero" x1={chart.inset} x2={chart.width-chart.inset} y1={chart.zeroY} y2={chart.zeroY}/>
  {chart.paths.map((path,index)=><g key={path.key}><polyline className="bo-statistics-line" data-series-key={path.key} points={path.points.map(point=>`${point.x},${point.y}`).join(' ')} stroke={'var(--chart-'+series[index].tone+')'}/>{path.points.map(point=><LocalizedElement as="circle" key={point.key} className="bo-statistics-point" role="button" tabIndex={0} aria-label={point.label+': '+series[index].label+' '+value(point.value)} aria-pressed={selected===point.key} data-value={point.value} cx={point.x} cy={point.y} r={selected===point.key?6:4} fill={'var(--chart-'+series[index].tone+')'} onClick={event=>{event.stopPropagation();onSelect(point.key)}} onFocus={()=>onSelect(point.key)} onMouseEnter={()=>onSelect(point.key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(point.key)}}}/>)}</g>)}
 </svg></LocalizedElement></div><div className="bo-statistics-axis-row" aria-hidden="true">{labels.map(index=><span className="bo-statistics-axis" key={buckets[index].key}><LocalizedText>{buckets[index].label}</LocalizedText></span>)}</div></>;
}

/** One period control, signed line chart and shared KPI renderer. */
export function Statistics({title,subtitle,events,series,metrics,currency='CHF',storageKey,notice,metricKeys=[],composition,defaultTrendVisible,hideHeading=false,compact=false}:{compact?:boolean;hideHeading?:boolean;title:string;subtitle:string;events:readonly StatisticEvent[];series:readonly Series[];metrics:(totals:Record<string,number>)=>readonly Metric[];currency?:string;storageKey:string;notice?:string;metricKeys?:readonly string[];composition?:{label:string;parts:readonly RingPart[]};defaultTrendVisible?:boolean}){
 const id=useId(),{locale}=useLocale();
 const [storedPeriod,setPeriod,periodReady]=useStatisticPeriod(storageKey,{months:6,from:'',to:''});
 const period=storedPeriod!;
 const [selected,setSelected]=useState<string|null>(null);
 const [showTrend,setShowTrend]=useState(defaultTrendVisible??!composition);
 const [showMoreMetrics,setShowMoreMetrics]=useState(false);
 const today=businessDate();
 const bounds=statisticBounds(period,today);
 const aggregated=aggregateStatistics(events,bounds??{from:'',to:''},[...new Set([...series.map(item=>item.key),...metricKeys])]);
 const active=aggregated.buckets.find(bucket=>bucket.key===selected),kpis=metrics(aggregated.totals);
 const value=(amount:number,format:Metric['format']='money')=>format==='number'?amount.toLocaleString(localeTags[locale]):formatCurrency(amount,currency,localeTags[locale]);
 const hasEntries=events.some(event=>bounds&&event.date>=bounds.from&&event.date<=bounds.to);
 const hasTrend=hasEntries&&aggregated.buckets.some(bucket=>series.some(item=>bucket.values[item.key]!==0));
 const choose=(next:StatisticPeriod)=>{setPeriod(next);setSelected(null)};
 if(!periodReady)return <LoadingState/>;
 return <section className="bo-statistics" data-compact={compact||undefined} aria-labelledby={id}>
  <header className="bo-statistics-heading"><div className={hideHeading?"visually-hidden":undefined}><h2 id={id}><LocalizedText>{title}</LocalizedText></h2>{subtitle&&<p><LocalizedText>{subtitle}</LocalizedText></p>}</div><StatisticPeriodPicker period={period} onChange={choose}/></header>
  <MetricTiles columns={Math.min(4,Math.max(2,kpis.length)) as 2|3|4}>{kpis.slice(0,4).map(metric=><MetricTile key={metric.label} label={metric.label} value={metric.format==='number'?value(metric.value,'number'):metric.value} currency={metric.format==='number'?undefined:currency} compactMoney={compact} hint={compact?undefined:metric.hint}/>)}</MetricTiles>
  {kpis.length>4&&<><Button variant="ghost" aria-expanded={showMoreMetrics} aria-controls={id+'-more-metrics'} onClick={()=>setShowMoreMetrics(value=>!value)}><LocalizedText>{showMoreMetrics?'Weniger anzeigen':'Mehr anzeigen'}</LocalizedText></Button><div id={id+'-more-metrics'} hidden={!showMoreMetrics}><MetricTiles>{kpis.slice(4).map(metric=><MetricTile key={metric.label} label={metric.label} value={metric.format==='number'?value(metric.value,'number'):metric.value} currency={metric.format==='number'?undefined:currency} hint={metric.hint}/>)}</MetricTiles></div></>}
  {compact&&kpis.some(metric=>metric.hint)&&<details className="bo-statistics-notice"><summary><LocalizedText>{"Details zu den Kennzahlen"}</LocalizedText></summary>{kpis.filter(metric=>metric.hint).map(metric=><p key={metric.label}><LocalizedText>{metric.label}</LocalizedText>{": "}<LocalizedText>{metric.hint}</LocalizedText></p>)}</details>}
  {notice&&<details className="bo-statistics-notice"><summary><LocalizedText>{"Datenhinweise"}</LocalizedText></summary><p><LocalizedText>{notice}</LocalizedText></p></details>}
  {composition&&<RingChart label={composition.label} currency={currency} parts={composition.parts}/>}{hasTrend&&(composition||defaultTrendVisible===false)&&<button type="button" className="text-action" aria-expanded={showTrend} aria-controls={id+"-trend"} onClick={()=>setShowTrend(value=>!value)}><LocalizedText>{showTrend?"Zeitverlauf ausblenden":"Zeitverlauf anzeigen"}</LocalizedText></button>}
  <div id={id+"-trend"} hidden={!showTrend}>
  {hasTrend?<LineChart buckets={aggregated.buckets} series={series} selected={selected} onSelect={setSelected} value={value}/>:null}
  {hasTrend&&<div className="bo-statistics-legend">{series.map(item=><span key={item.key}><i className={'bo-statistics-'+item.tone}/><LocalizedText>{item.label}</LocalizedText></span>)}</div>}
  </div>
  {(showTrend||!hasTrend)&&<p className={compact&&hasTrend&&!active?"sr-only":"bo-statistics-detail"} role="status"><LocalizedText>{active?active.label+': '+series.map(item=>item.label+' '+value(active.values[item.key])).join(' · '):hasTrend?'Datenpunkt auswählen für Details.':'Keine Entwicklung im Zeitraum'}</LocalizedText></p>}

 </section>;
}

/** Compact cash comparison uses ledger values, never formatted DOM text. */
export function ComparisonBars({title,caption,income,costs,balance}:{title:string;caption:string;income:number;costs:number;balance:number}){
 const {locale}=useLocale(),t=useTranslation(),widths=comparisonBarWidths(income,costs);
 const money=(value:number)=>formatCurrency(value,'CHF',localeTags[locale]);
 return <section className="bo-comparison-card" aria-label={t(title)}><header><h2><LocalizedText>{title}</LocalizedText></h2><span>{caption}</span></header>{[{key:'income',label:'Einnahmen',value:income,tone:'positive',width:widths.income},{key:'costs',label:'Ausgaben',value:costs,tone:'negative',width:widths.costs}].map(item=><div className="bo-comparison-row" key={item.key}><div><span><LocalizedText>{item.label}</LocalizedText></span><strong>{money(item.value)}</strong></div>{item.value!==0&&<div className="bo-comparison-track" aria-hidden="true"><i className={'bo-statistics-'+item.tone} style={{'--bar-value':item.width+'%'} as import('react').CSSProperties}/></div>}</div>)}<footer><span><LocalizedText>Saldo</LocalizedText></span><strong>{money(balance)}</strong></footer></section>;
}
