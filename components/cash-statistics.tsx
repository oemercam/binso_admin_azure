"use client";
import {Statistics,RingChart,StatisticPeriodPicker,type Series} from './statistics';
import {cashStatisticEvents,financialStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';
import {useEffect,useState,type CSSProperties} from 'react';
import {LocalizedText} from '@/lib/client/locale';
import {aggregateStatistics,statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {businessDate,formatCurrency,formatDate} from '@/lib/financial-status';
import {MetricTiles,MetricTile} from './binso-ux';
import {EmptyState,SectionTitle} from './ui';

/** Compact reference overview. Detailed ledger analysis lives at /finanzen/analyse. */
export function CashOverview({data,dashboard=false}:{data:CashStatisticsData;dashboard?:boolean}){
 const [period,setPeriod]=useState<StatisticPeriod>({months:1,from:"",to:""}),[selected,setSelected]=useState<string|null>(null);
 const [restored,setRestored]=useState(false);
 useEffect(()=>{
  if(dashboard)return;
  let active=true,saved:StatisticPeriod={months:1,from:"",to:""};
  try{const value=JSON.parse(sessionStorage.getItem('binso.statistics:finance-overview')??'1');saved=typeof value==="number"?{months:value as 1|3|6|12,from:"",to:""}:value;}catch{}
  queueMicrotask(()=>{if(active){if(saved&&statisticBounds(saved,businessDate()))setPeriod(saved);setRestored(true)}});
  return()=>{active=false};
 },[dashboard]);
 useEffect(()=>{if(!dashboard&&restored)try{sessionStorage.setItem('binso.statistics:finance-overview',JSON.stringify(period))}catch{}},[period,dashboard,restored]);
 const today=businessDate();
 const events=financialStatisticEvents(data),bounds=statisticBounds(period,today)!;
 const {totals}=aggregateStatistics(events,bounds,['revenue','income','costs']);
 const snapshot=data.financial?.snapshot;
 const trend=aggregateStatistics(events,bounds,['revenue','income']).buckets;
 const key=snapshot?'revenue':'income',maximum=Math.max(1,...trend.map(bucket=>Math.abs(bucket.values[key])));
 return <section className="bo-cash-overview" aria-label={dashboard?'Monatsüberblick':'Finanzüberblick'}>
  {dashboard&&<SectionTitle title="Dieser Monat"/>}
  {!dashboard&&<StatisticPeriodPicker period={period} onChange={value=>{setPeriod(value);setSelected(null)}}/>}
  {!dashboard&&<p className="bo-statistics-dates">{formatDate(bounds.from)} – {formatDate(bounds.to)}</p>}
  <MetricTiles columns={dashboard?4:2}><MetricTile label={snapshot?'Fakturiertes Volumen':dashboard?'Fakturiertes Volumen':'Einnahmen'} hint={snapshot?'Inklusive MwSt. nach Gutschriften':undefined} value={dashboard&&!snapshot?'—':totals[key]} currency="CHF" compactMoney/>{dashboard?<><MetricTile label="Zahlungseingänge" value={totals.income} currency="CHF" compactMoney/><MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney/><MetricTile label="Zahlungssaldo" value={sumMoney([totals.income,-totals.costs])} currency="CHF" compactMoney hint="Erfasste Zahlungen, kein Kontostand"/></>:<><MetricTile label="Offene Forderungen" value={snapshot?sumMoney([snapshot.open,snapshot.overdue]):'—'} currency="CHF" compactMoney/><MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney/><MetricTile label="Überfällig" value={snapshot?sumMoney([snapshot.overdue]):'—'} currency="CHF" compactMoney/></>}</MetricTiles>
  {!dashboard&&<><SectionTitle title="Monatsentwicklung"/>{trend.some(bucket=>bucket.values[key]!==0)?<div className="bo-overview-bars" data-signed={trend.some(bucket=>bucket.values[key]<0)||undefined} role="group" aria-label="Monatsentwicklung">{trend.map(bucket=><button type="button" key={bucket.key} aria-label={bucket.label+': '+formatCurrency(bucket.values[key])} aria-pressed={selected===bucket.key} onClick={()=>setSelected(bucket.key)}><span className="bo-overview-bar-track"><i data-negative={bucket.values[key]<0||undefined} style={{'--bar-value':Math.abs(bucket.values[key])/maximum*100+'%'} as CSSProperties}/></span><small>{bucket.label}</small></button>)}</div>:<EmptyState title="Keine Entwicklung im Zeitraum"/>}{selected&&<output className="bo-overview-selection">{trend.find(bucket=>bucket.key===selected)?.label} · {formatCurrency(trend.find(bucket=>bucket.key===selected)?.values[key])}</output>}<p className="bo-overview-explanation"><LocalizedText>{'Offene und überfällige Forderungen zeigen den aktuellen Bestand.'}</LocalizedText></p></>}
  {data.incomplete&&<p className="bo-overview-explanation"><LocalizedText>{dashboard?'Ausgaben und Saldo enthalten nur nachgewiesene Zahlungen. Weitere Kosten sind noch nicht berücksichtigt.':'Auszahlungsdaten sind unvollständig. Kosten ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Details findest du in der Finanzanalyse.'}</LocalizedText></p>}
 </section>;
}

const cashSeries:Series[]=[{key:'income',label:'Einnahmen',tone:'positive'},{key:'costs',label:'Ausgaben',tone:'negative'}];
export function CashStatistics({data,storageKey}:{data:CashStatisticsData;storageKey:string}){
 const financial=data.financial,snapshot=financial?.snapshot;
 const refundNotice=data.refunds?.length?'Zahlungseingänge sind nach erfassten Rückerstattungen ausgewiesen. ':'';
 const notice=refundNotice+(data.incomplete?'Auszahlungsdaten sind unvollständig. Betriebskosten und Löhne ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Der Saldo ist kein vollständiger Cashflow oder buchhalterischer Gewinn.':'');
 // An older/incomplete response may still show its known cash ledger, but must
 // never fabricate invoice metrics or compose income and outflow into one ring.
 if(!snapshot)return <Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={cashStatisticEvents(data)} series={cashSeries} metrics={totals=>[{label:'Einnahmen',value:totals.income},{label:'Ausgaben',value:totals.costs},{label:'Zahlungssaldo',value:sumMoney([totals.income,-totals.costs]),hint:'Kein Bankkontostand'}]} notice={notice}/>;
 return <><Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={financialStatisticEvents(data)} series={cashSeries} metrics={totals=>[
  {label:'Einnahmen',value:totals.income,hint:'Erfasste Zahlungen nach Rückerstattungen'},
  {label:'Ausgaben',value:totals.costs,hint:'Nachgewiesene Auszahlungen'},
  {label:'Zahlungssaldo',value:sumMoney([totals.income,-totals.costs]),hint:'Kein Bankkontostand'}
 ]} notice={notice}/><details className="financial-snapshot"><summary><LocalizedText>{'Forderungen'}</LocalizedText></summary><p><LocalizedText>{'Bestand am '}</LocalizedText>{snapshot.as_of.split('-').reverse().join('.')}</p><RingChart label="Rechnungsbestand" parts={[{key:'paid',label:'Bezahlt',tone:'positive',value:Number(snapshot.paid),href:'/rechnungen?status='+encodeURIComponent('Bezahlt')},{key:'open',label:'Offen',tone:'neutral',value:Number(snapshot.open),href:'/rechnungen?status='+encodeURIComponent('Offen')},{key:'overdue',label:'Überfällig',tone:'negative',value:Number(snapshot.overdue),href:'/rechnungen?status='+encodeURIComponent('Überfällig')}]}/>{Number(snapshot.credit_balance)>0&&<p><LocalizedText>{'Guthaben'}</LocalizedText>: {formatCurrency(Number(snapshot.credit_balance))}</p>}</details></>;
}
