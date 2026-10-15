"use client";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {useEffect,useId,useState} from 'react';
import {FilterSheet,MetricTiles,MetricTile} from './binso-ux';
import {Button,Field,Icon,Input,ErrorState} from './ui';
import {sumMoney} from '@/lib/money';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import {aggregateStatistics,lineChartCoordinates,statisticBounds,statisticPeriods,type StatisticBucket,type StatisticEvent,type StatisticPeriod} from '@/lib/statistics-period';

export type Series={key:string;label:string;tone:'positive'|'negative'|'neutral'};
export type RingPart={key:string;label:string;tone:Series['tone'];value:number;href?:string};
export type Metric={label:string;value:number;format?:'number'|'money';hint?:string};
/** Segments are parts of one explicitly named total, never independent KPIs. */
export function RingChart({label,parts,currency='CHF',format='money'}:{label:string;parts:readonly RingPart[];currency?:string;format?:'money'|'number'}){
 const [selected,setSelected]=useState<string|null>(null);
 const valid=parts.every(part=>Number.isFinite(part.value)&&part.value>=0);
 const total=valid?sumMoney(parts.map(part=>part.value)):0;
 const value=(amount:number)=>format==='number'?amount.toLocaleString('de-CH'):formatCurrency(amount,currency);
 if(!valid||total<=0)return <p role="status"><LocalizedText>{"Keine positiven Anteile für "}</LocalizedText><LocalizedText>{label}</LocalizedText>.</p>;
 return <div className="bo-ring-chart"><svg viewBox="0 0 120 120" role="group" aria-label={label+': '+value(total)}><circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-line)" strokeWidth="10"/>{parts.map((part,index)=>{
  const percent=part.value/total*100,start=sumMoney(parts.slice(0,index).map(part=>part.value))/total*100;
  return <circle key={part.key} role={part.value>0?'button':undefined} tabIndex={part.value>0?0:undefined} aria-label={part.label+': '+value(part.value)} aria-pressed={selected===part.key} onClick={()=>setSelected(part.key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(part.key)}}} cx="60" cy="60" r="48" pathLength="100" fill="none" stroke={'var(--chart-'+part.tone+')'} strokeWidth="10" strokeDasharray={`${percent} ${100-percent}`} strokeDashoffset={-start} transform="rotate(-90 60 60)"><title><LocalizedText>{part.label+': '+value(part.value)+' · '+percent.toLocaleString('de-CH',{maximumFractionDigits:1})+' %'}</LocalizedText></title></circle>;
 })}</svg><div className="bo-ring-details"><b><LocalizedText>{label}</LocalizedText></b>{parts.map(part=><button type="button" key={part.key} aria-pressed={selected===part.key} onClick={()=>setSelected(part.key)} onFocus={()=>setSelected(part.key)}><i className={'bo-statistics-'+part.tone}/><span><LocalizedText>{part.label}</LocalizedText></span><strong>{format==='number'&&<>{value(part.value)} · </>}{(part.value/total*100).toLocaleString('de-CH',{maximumFractionDigits:1})} %</strong></button>)}<output aria-live="polite"><LocalizedText>{selected&&parts.some(part=>part.key===selected)?parts.find(part=>part.key===selected)!.label+': '+value(parts.find(part=>part.key===selected)!.value):value(total)}</LocalizedText></output>{parts.find(part=>part.key===selected)?.href&&<Button variant="ghost" href={parts.find(part=>part.key===selected)!.href}><LocalizedText>{'Details anzeigen'}</LocalizedText></Button>}</div></div>;
}

/** Time is encoded horizontally; value is encoded vertically around true zero. */
export function LineChart({buckets,series,selected,onSelect,value}:{buckets:readonly StatisticBucket[];series:readonly Series[];selected:string|null;onSelect:(key:string)=>void;value:(amount:number)=>string}){
 const chart=lineChartCoordinates(buckets,series.map(item=>item.key));
 if(!buckets.length||!series.length)return null;
 const labels=[...new Set([0,Math.floor((buckets.length-1)/3),Math.floor((buckets.length-1)*2/3),buckets.length-1])];
 return <><LocalizedElement as="div" className="bo-statistics-plot" aria-label={series.map(item=>item.label).join(' und ')}><svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="group" preserveAspectRatio="none" onClick={event=>{
  const rect=event.currentTarget.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*chart.width;
  const closest=chart.paths[0].points.reduce((a,b)=>Math.abs(a.x-x)<=Math.abs(b.x-x)?a:b);onSelect(closest.key);
 }}>
  <line className="bo-statistics-zero" x1={chart.inset} x2={chart.width-chart.inset} y1={chart.zeroY} y2={chart.zeroY}/>
  {chart.paths.map((path,index)=><g key={path.key}><polyline className="bo-statistics-line" data-series-key={path.key} points={path.points.map(point=>`${point.x},${point.y}`).join(' ')} stroke={'var(--chart-'+series[index].tone+')'}/>{path.points.map(point=><LocalizedElement as="circle" key={point.key} className="bo-statistics-point" role="button" tabIndex={0} aria-label={point.label+': '+series[index].label+' '+value(point.value)} aria-pressed={selected===point.key} data-value={point.value} cx={point.x} cy={point.y} r={selected===point.key?6:4} fill={'var(--chart-'+series[index].tone+')'} onClick={event=>{event.stopPropagation();onSelect(point.key)}} onFocus={()=>onSelect(point.key)} onMouseEnter={()=>onSelect(point.key)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onSelect(point.key)}}}/>)}</g>)}
 </svg></LocalizedElement><div className="bo-statistics-axis-row" aria-hidden="true">{labels.map(index=><span className="bo-statistics-axis" key={buckets[index].key}><LocalizedText>{buckets[index].label}</LocalizedText></span>)}</div></>;
}

/** One period control, signed line chart and shared KPI renderer. */
export function Statistics({title,subtitle,events,series,metrics,currency='CHF',storageKey,notice,metricKeys=[],composition}:{title:string;subtitle:string;events:readonly StatisticEvent[];series:readonly Series[];metrics:(totals:Record<string,number>)=>readonly Metric[];currency?:string;storageKey:string;notice?:string;metricKeys?:readonly string[];composition?:{label:string;parts:readonly RingPart[]}}){
 const id=useId();
 const [period,setPeriod]=useState<StatisticPeriod>({months:6,from:'',to:''});
 const [restored,setRestored]=useState(false),[open,setOpen]=useState(false),[draft,setDraft]=useState(period),[selected,setSelected]=useState<string|null>(null);
 const [showTrend,setShowTrend]=useState(!composition);
 const [showMoreMetrics,setShowMoreMetrics]=useState(false);
 const today=businessDate();
 useEffect(()=>{let saved:StatisticPeriod|undefined;try{saved=JSON.parse(sessionStorage.getItem('binso.statistics:'+storageKey)??'null')??undefined;}catch{}let active=true;queueMicrotask(()=>{if(!active)return;if(saved&&statisticBounds(saved,businessDate()))setPeriod(saved);setRestored(true)});return()=>{active=false}},[storageKey]);
 useEffect(()=>{if(restored)try{sessionStorage.setItem('binso.statistics:'+storageKey,JSON.stringify(period))}catch{}},[period,restored,storageKey]);
 const bounds=statisticBounds(period,today),pending=statisticBounds(draft,today);
 const aggregated=aggregateStatistics(events,bounds??{from:'',to:''},[...new Set([...series.map(item=>item.key),...metricKeys])]);
 const active=aggregated.buckets.find(bucket=>bucket.key===selected),kpis=metrics(aggregated.totals);
 const value=(amount:number,format:Metric['format']='money')=>format==='number'?amount.toLocaleString('de-CH'):formatCurrency(amount,currency);
 const hasEntries=events.some(event=>bounds&&event.date>=bounds.from&&event.date<=bounds.to);
 const choose=(next:StatisticPeriod)=>{setPeriod(next);setSelected(null)};
 return <section className="bo-statistics" aria-labelledby={id}>
  <header className="bo-statistics-heading"><div><h2 id={id}><LocalizedText>{title}</LocalizedText></h2><p><LocalizedText>{subtitle}</LocalizedText></p></div><LocalizedElement as="div" className="bo-statistics-periods" aria-label="Statistikzeitraum">{statisticPeriods.map(months=><button type="button" key={months} aria-pressed={period.months===months} onClick={()=>choose({...period,months})}>{months}<LocalizedText>{" M"}</LocalizedText></button>)}<LocalizedElement as="button" type="button" aria-label="Eigenen Statistikzeitraum wählen" aria-pressed={period.months==='custom'} onClick={()=>{setDraft(period.months==='custom'?period:{months:'custom',from:bounds?.from??today,to:bounds?.to??today});setOpen(true)}}><Icon name="calendar" size={18}/></LocalizedElement></LocalizedElement></header>
  <p className="bo-statistics-dates">{bounds?.from.split('-').reverse().join('.')} – {bounds?.to.split('-').reverse().join('.')}</p>
  <MetricTiles columns={Math.min(4,Math.max(2,kpis.length)) as 2|3|4}>{kpis.slice(0,4).map(metric=><MetricTile key={metric.label} label={metric.label} value={value(metric.value,metric.format)} hint={metric.hint}/>)}</MetricTiles>
  {kpis.length>4&&<><Button variant="ghost" aria-expanded={showMoreMetrics} aria-controls={id+'-more-metrics'} onClick={()=>setShowMoreMetrics(value=>!value)}><LocalizedText>{showMoreMetrics?'Weniger anzeigen':'Mehr anzeigen'}</LocalizedText></Button><div id={id+'-more-metrics'} hidden={!showMoreMetrics}><MetricTiles>{kpis.slice(4).map(metric=><MetricTile key={metric.label} label={metric.label} value={value(metric.value,metric.format)} hint={metric.hint}/>)}</MetricTiles></div></>}
  {notice&&<details className="bo-statistics-notice"><summary><LocalizedText>{"Auszahlungsdaten unvollständig"}</LocalizedText></summary><p><LocalizedText>{notice}</LocalizedText></p></details>}
  {composition&&<><RingChart label={composition.label} currency={currency} parts={composition.parts}/><button type="button" className="text-action" aria-expanded={showTrend} aria-controls={id+"-trend"} onClick={()=>setShowTrend(value=>!value)}><LocalizedText>{showTrend?"Zeitverlauf ausblenden":"Zeitverlauf anzeigen"}</LocalizedText></button></>}
  <div id={id+"-trend"} hidden={!showTrend}>
  <LineChart buckets={aggregated.buckets} series={series} selected={selected} onSelect={setSelected} value={value}/>
  <div className="bo-statistics-legend">{series.map(item=><span key={item.key}><i className={'bo-statistics-'+item.tone}/><LocalizedText>{item.label}</LocalizedText></span>)}</div>
  </div>
  {(showTrend||!hasEntries)&&<p className="bo-statistics-detail" role="status"><LocalizedText>{active?active.label+': '+series.map(item=>item.label+' '+value(active.values[item.key])).join(' · '):hasEntries?'Datenpunkt auswählen für Details.':'Keine Buchungen im gewählten Zeitraum.'}</LocalizedText></p>}
  <FilterSheet label="Statistikzeitraum" open={open} onClose={()=>setOpen(false)}><p><LocalizedText>{"Beide Tage sind eingeschlossen."}</LocalizedText></p><div className="form-grid two"><Field allowReadOnlyInput label="Von *"><Input type="date" required min="1900-01-01" max={draft.to||'9998-12-31'} value={draft.from} onChange={event=>setDraft({...draft,months:'custom',from:event.target.value})}/></Field><Field allowReadOnlyInput label="Bis *"><Input type="date" required min={draft.from||'1900-01-01'} max="9998-12-31" value={draft.to} onChange={event=>setDraft({...draft,months:'custom',to:event.target.value})}/></Field></div>{!pending&&<ErrorState><LocalizedText>{"Bitte einen gültigen Zeitraum wählen. Beginn darf nicht nach Ende liegen."}</LocalizedText></ErrorState>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={!pending} onClick={()=>{choose({...draft,months:'custom'});setOpen(false)}}><LocalizedText>{"Anwenden"}</LocalizedText></Button></div></FilterSheet>
 </section>;
}
