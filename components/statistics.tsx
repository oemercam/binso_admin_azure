"use client";
import {useEffect,useId,useState} from 'react';
import {FilterSheet} from './binso-ux';
import {Button,Field,Icon,Input,ErrorState} from './ui';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import {aggregateStatistics,statisticBounds,statisticPeriods,type StatisticEvent,type StatisticPeriod} from '@/lib/statistics-period';

type Series={key:string;label:string;tone:'positive'|'negative'|'neutral'};
type Metric={label:string;value:number;format?:'number'|'money';hint?:string};
/** One time control and grouped-column renderer; business providers define the metrics. */
export function Statistics({title,subtitle,events,series,metrics,currency='CHF',storageKey,notice,metricKeys=[]}:{title:string;subtitle:string;events:readonly StatisticEvent[];series:readonly Series[];metrics:(totals:Record<string,number>)=>[Metric,Metric,Metric];currency?:string;storageKey:string;notice?:string;metricKeys?:readonly string[]}){
 const id=useId();
 const [period,setPeriod]=useState<StatisticPeriod>({months:6,from:'',to:''});
 const [restored,setRestored]=useState(false),[open,setOpen]=useState(false),[draft,setDraft]=useState(period),[selected,setSelected]=useState<string|null>(null);
 const today=businessDate();
 useEffect(()=>{let saved:StatisticPeriod|undefined;try{saved=JSON.parse(sessionStorage.getItem('binso.statistics:'+storageKey)??'null')??undefined;}catch{}let active=true;queueMicrotask(()=>{if(!active)return;if(saved&&statisticBounds(saved,businessDate()))setPeriod(saved);setRestored(true)});return()=>{active=false}},[storageKey]);
 useEffect(()=>{if(restored)try{sessionStorage.setItem('binso.statistics:'+storageKey,JSON.stringify(period))}catch{}},[period,restored,storageKey]);
 const bounds=statisticBounds(period,today),pending=statisticBounds(draft,today);
 const aggregated=aggregateStatistics(events,bounds??{from:'',to:''},[...new Set([...series.map(item=>item.key),...metricKeys])]);
 const maximum=Math.max(1,...aggregated.buckets.flatMap(bucket=>series.map(item=>Math.abs(bucket.values[item.key]))));
 const active=aggregated.buckets.find(bucket=>bucket.key===selected),kpis=metrics(aggregated.totals);
 const value=(amount:number,format:Metric['format']='money')=>format==='number'?amount.toLocaleString('de-CH'):formatCurrency(amount,currency);
 const choose=(next:StatisticPeriod)=>{setPeriod(next);setSelected(null)};
 return <section className="bo-statistics" aria-labelledby={id}>
  <header className="bo-statistics-heading"><div><h2 id={id}>{title}</h2><p>{subtitle}</p></div><div className="bo-statistics-periods" aria-label="Statistikzeitraum">{statisticPeriods.map(months=><button type="button" key={months} aria-pressed={period.months===months} onClick={()=>choose({...period,months})}>{months} M</button>)}<button type="button" aria-label="Eigenen Statistikzeitraum wählen" aria-pressed={period.months==='custom'} onClick={()=>{setDraft(period.months==='custom'?period:{months:'custom',from:bounds?.from??today,to:bounds?.to??today});setOpen(true)}}><Icon name="calendar" size={18}/></button></div></header>
  <p className="bo-statistics-dates">{bounds?.from.split('-').reverse().join('.')} – {bounds?.to.split('-').reverse().join('.')}</p>
  <dl className="bo-statistics-kpis">{kpis.map(metric=><div key={metric.label}><dt>{metric.label}</dt><dd>{value(metric.value,metric.format)}{metric.hint&&<small>{metric.hint}</small>}</dd></div>)}</dl>
  {notice&&<p className="bo-statistics-notice">{notice}</p>}
  <div className="bo-statistics-plot" aria-label={series.map(item=>item.label).join(' und ')}>{aggregated.buckets.map(bucket=><button type="button" key={bucket.key} className="bo-statistics-group" aria-pressed={selected===bucket.key} aria-label={`${bucket.label}: ${series.map(item=>item.label+' '+value(bucket.values[item.key])).join(', ')}`} onClick={()=>setSelected(bucket.key)} onFocus={()=>setSelected(bucket.key)} onMouseEnter={()=>setSelected(bucket.key)}><span className="bo-statistics-bars">{series.map(item=><i key={item.key} className={'bo-statistics-bar bo-statistics-'+item.tone} style={{height:`${Math.abs(bucket.values[item.key])/maximum*100}%`}}/>)}</span><span className="bo-statistics-axis">{bucket.label}</span></button>)}</div>
  <div className="bo-statistics-legend">{series.map(item=><span key={item.key}><i className={'bo-statistics-'+item.tone}/>{item.label}</span>)}</div>
  <p className="bo-statistics-detail" role="status">{active?active.label+': '+series.map(item=>item.label+' '+value(active.values[item.key])).join(' · '):events.some(event=>bounds&&event.date>=bounds.from&&event.date<=bounds.to)?'Säule auswählen für Details.':'Keine Buchungen im gewählten Zeitraum.'}</p>
  <FilterSheet label="Statistikzeitraum" open={open} onClose={()=>setOpen(false)}><p>Beide Tage sind eingeschlossen.</p><div className="form-grid two"><Field allowReadOnlyInput label="Von *"><Input type="date" required min="1900-01-01" max={draft.to||'9998-12-31'} value={draft.from} onChange={event=>setDraft({...draft,months:'custom',from:event.target.value})}/></Field><Field allowReadOnlyInput label="Bis *"><Input type="date" required min={draft.from||'1900-01-01'} max="9998-12-31" value={draft.to} onChange={event=>setDraft({...draft,months:'custom',to:event.target.value})}/></Field></div>{!pending&&<ErrorState>Bitte einen gültigen Zeitraum wählen. Beginn darf nicht nach Ende liegen.</ErrorState>}<div className="filter-sheet-actions"><Button variant="secondary" onClick={()=>setOpen(false)}>Abbrechen</Button><Button disabled={!pending} onClick={()=>{choose({...draft,months:'custom'});setOpen(false)}}>Anwenden</Button></div></FilterSheet>
 </section>;
}
