"use client";
import {LocalizedText,LocalizedElement} from "@/lib/client/locale";
import {useEffect,useId,useState} from 'react';
import {FilterSheet} from './binso-ux';
import {Button,Field,Icon,Input,ErrorState} from './ui';
import {sumMoney} from '@/lib/money';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import {aggregateStatistics,statisticBounds,statisticPeriods,type StatisticEvent,type StatisticPeriod} from '@/lib/statistics-period';

export type Series={key:string;label:string;tone:'positive'|'negative'|'neutral'};
type Metric={label:string;value:number;format?:'number'|'money';hint?:string};
/** Segments are parts of one explicitly named total, never independent KPIs. */
export function RingChart({label,parts,currency='CHF',format='money'}:{label:string;parts:readonly {key:string;label:string;tone:Series['tone'];value:number}[];currency?:string;format?:'money'|'number'}){
 const [selected,setSelected]=useState<string|null>(null);
 const valid=parts.every(part=>Number.isFinite(part.value)&&part.value>=0);
 const total=valid?sumMoney(parts.map(part=>part.value)):0;
 const value=(amount:number)=>format==='number'?amount.toLocaleString('de-CH'):formatCurrency(amount,currency);
 if(!valid||total<=0)return <p role="status"><LocalizedText>{"Keine positiven Anteile für "}</LocalizedText><LocalizedText>{label}</LocalizedText>.</p>;
 return <div className="bo-ring-chart"><svg viewBox="0 0 120 120" role="img" aria-label={label+': '+value(total)}><circle cx="60" cy="60" r="48" fill="none" stroke="var(--color-line)" strokeWidth="10"/>{parts.map((part,index)=>{
  const percent=part.value/total*100,start=sumMoney(parts.slice(0,index).map(part=>part.value))/total*100;
  return <circle key={part.key} cx="60" cy="60" r="48" pathLength="100" fill="none" stroke={'var(--chart-'+part.tone+')'} strokeWidth="10" strokeDasharray={`${percent} ${100-percent}`} strokeDashoffset={-start} transform="rotate(-90 60 60)"><title><LocalizedText>{part.label+': '+value(part.value)+' · '+percent.toLocaleString('de-CH',{maximumFractionDigits:1})+' %'}</LocalizedText></title></circle>;
 })}</svg><div className="bo-ring-details"><b><LocalizedText>{label}</LocalizedText></b>{parts.map(part=><button type="button" key={part.key} aria-pressed={selected===part.key} onClick={()=>setSelected(part.key)} onFocus={()=>setSelected(part.key)}><i className={'bo-statistics-'+part.tone}/><span><LocalizedText>{part.label}</LocalizedText></span><strong>{format==='number'&&<>{value(part.value)} · </>}{(part.value/total*100).toLocaleString('de-CH',{maximumFractionDigits:1})} %</strong></button>)}<output aria-live="polite"><LocalizedText>{selected&&parts.some(part=>part.key===selected)?value(parts.find(part=>part.key===selected)!.value):value(total)}</LocalizedText></output></div></div>;
}

/** One time control and grouped-column renderer; business providers define the metrics. */
export function Statistics({title,subtitle,events,series,metrics,currency='CHF',storageKey,notice,metricKeys=[],composition=false}:{title:string;subtitle:string;events:readonly StatisticEvent[];series:readonly Series[];metrics:(totals:Record<string,number>)=>[Metric,Metric,Metric];currency?:string;storageKey:string;notice?:string;metricKeys?:readonly string[];composition?:boolean}){
 const id=useId();
 const [period,setPeriod]=useState<StatisticPeriod>({months:6,from:'',to:''});
 const [restored,setRestored]=useState(false),[open,setOpen]=useState(false),[draft,setDraft]=useState(period),[selected,setSelected]=useState<string|null>(null);
 const [showTrend,setShowTrend]=useState(!composition);
 const today=businessDate();
 useEffect(()=>{let saved:StatisticPeriod|undefined;try{saved=JSON.parse(sessionStorage.getItem('binso.statistics:'+storageKey)??'null')??undefined;}catch{}let active=true;queueMicrotask(()=>{if(!active)return;if(saved&&statisticBounds(saved,businessDate()))setPeriod(saved);setRestored(true)});return()=>{active=false}},[storageKey]);
 useEffect(()=>{if(restored)try{sessionStorage.setItem('binso.statistics:'+storageKey,JSON.stringify(period))}catch{}},[period,restored,storageKey]);
 const bounds=statisticBounds(period,today),pending=statisticBounds(draft,today);
 const aggregated=aggregateStatistics(events,bounds??{from:'',to:''},[...new Set([...series.map(item=>item.key),...metricKeys])]);
 const maximum=Math.max(1,...aggregated.buckets.flatMap(bucket=>series.map(item=>Math.abs(bucket.values[item.key]))));
 const active=aggregated.buckets.find(bucket=>bucket.key===selected),kpis=metrics(aggregated.totals);
 const value=(amount:number,format:Metric['format']='money')=>format==='number'?amount.toLocaleString('de-CH'):formatCurrency(amount,currency);
 const hasEntries=events.some(event=>bounds&&event.date>=bounds.from&&event.date<=bounds.to);
 const choose=(next:StatisticPeriod)=>{setPeriod(next);setSelected(null)};
 return <section className="bo-statistics" aria-labelledby={id}>
  <header className="bo-statistics-heading"><div><h2 id={id}><LocalizedText>{title}</LocalizedText></h2><p><LocalizedText>{subtitle}</LocalizedText></p></div><LocalizedElement as="div" className="bo-statistics-periods" aria-label="Statistikzeitraum">{statisticPeriods.map(months=><button type="button" key={months} aria-pressed={period.months===months} onClick={()=>choose({...period,months})}>{months}<LocalizedText>{" M"}</LocalizedText></button>)}<LocalizedElement as="button" type="button" aria-label="Eigenen Statistikzeitraum wählen" aria-pressed={period.months==='custom'} onClick={()=>{setDraft(period.months==='custom'?period:{months:'custom',from:bounds?.from??today,to:bounds?.to??today});setOpen(true)}}><Icon name="calendar" size={18}/></LocalizedElement></LocalizedElement></header>
  <p className="bo-statistics-dates">{bounds?.from.split('-').reverse().join('.')} – {bounds?.to.split('-').reverse().join('.')}</p>
  <dl className="bo-statistics-kpis">{kpis.map(metric=><div key={metric.label}><dt><LocalizedText>{metric.label}</LocalizedText></dt><dd>{value(metric.value,metric.format)}{metric.hint&&<small><LocalizedText>{metric.hint}</LocalizedText></small>}</dd></div>)}</dl>
  {notice&&<details className="bo-statistics-notice"><summary><LocalizedText>{"Auszahlungsdaten unvollständig"}</LocalizedText></summary><p><LocalizedText>{notice}</LocalizedText></p></details>}
  {composition&&<><RingChart label="Zahlungsvolumen" currency={currency} parts={series.map(item=>({...item,value:aggregated.totals[item.key]}))}/><button type="button" className="text-action" aria-expanded={showTrend} aria-controls={id+"-trend"} onClick={()=>setShowTrend(value=>!value)}><LocalizedText>{showTrend?"Zeitverlauf ausblenden":"Zeitverlauf anzeigen"}</LocalizedText></button></>}
  <div id={id+"-trend"} hidden={!showTrend}>
  <LocalizedElement as="div" className="bo-statistics-plot" aria-label={series.map(item=>item.label).join(' und ')}>{aggregated.buckets.map(bucket=><LocalizedElement as="button" type="button" key={bucket.key} className="bo-statistics-group" aria-pressed={selected===bucket.key} aria-label={`${bucket.label}: ${series.map(item=>item.label+' '+value(bucket.values[item.key])).join(', ')}`} onClick={()=>setSelected(bucket.key)} onFocus={()=>setSelected(bucket.key)} onMouseEnter={()=>setSelected(bucket.key)}><span className="bo-statistics-bars">{series.map(item=><i key={item.key} className={'bo-statistics-bar bo-statistics-'+item.tone} style={{height:`${Math.abs(bucket.values[item.key])/maximum*100}%`}}/>)}</span><span className="bo-statistics-axis"><LocalizedText>{bucket.label}</LocalizedText></span></LocalizedElement>)}</LocalizedElement>
  <div className="bo-statistics-legend">{series.map(item=><span key={item.key}><i className={'bo-statistics-'+item.tone}/><LocalizedText>{item.label}</LocalizedText></span>)}</div>
  </div>
  {(showTrend||!hasEntries)&&<p className="bo-statistics-detail" role="status"><LocalizedText>{active?active.label+': '+series.map(item=>item.label+' '+value(active.values[item.key])).join(' · '):hasEntries?'Säule auswählen für Details.':'Keine Buchungen im gewählten Zeitraum.'}</LocalizedText></p>}
  <FilterSheet label="Statistikzeitraum" open={open} onClose={()=>setOpen(false)}><p><LocalizedText>{"Beide Tage sind eingeschlossen."}</LocalizedText></p><div className="form-grid two"><Field allowReadOnlyInput label="Von *"><Input type="date" required min="1900-01-01" max={draft.to||'9998-12-31'} value={draft.from} onChange={event=>setDraft({...draft,months:'custom',from:event.target.value})}/></Field><Field allowReadOnlyInput label="Bis *"><Input type="date" required min={draft.from||'1900-01-01'} max="9998-12-31" value={draft.to} onChange={event=>setDraft({...draft,months:'custom',to:event.target.value})}/></Field></div>{!pending&&<ErrorState><LocalizedText>{"Bitte einen gültigen Zeitraum wählen. Beginn darf nicht nach Ende liegen."}</LocalizedText></ErrorState>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setOpen(false)}><LocalizedText>{"Abbrechen"}</LocalizedText></Button><Button disabled={!pending} onClick={()=>{choose({...draft,months:'custom'});setOpen(false)}}><LocalizedText>{"Anwenden"}</LocalizedText></Button></div></FilterSheet>
 </section>;
}
