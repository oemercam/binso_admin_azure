"use client";
import Link from "next/link";
import {Statistics,type Series} from './statistics';
import {cashStatisticEvents,financialStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';
import {useEffect,useState,type CSSProperties} from 'react';
import {LocalizedText} from '@/lib/client/locale';
import {aggregateStatistics,statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {businessDate,formatCurrency} from '@/lib/financial-status';
import {MetricTiles,MetricTile} from './binso-ux';
import {Select,SectionTitle} from './ui';

/** Compact reference overview. Detailed ledger analysis lives at /finanzen/analyse. */
export function CashOverview({data,dashboard=false}:{data:CashStatisticsData;dashboard?:boolean;invoiceCount?:number;customerCount?:number}){
 const [months,setMonths]=useState<1|3|6|12>(1),[selected,setSelected]=useState<string|null>(null);
 const [restored,setRestored]=useState(false);
 useEffect(()=>{
  if(dashboard)return;
  let active=true,saved=1;
  try{saved=Number(sessionStorage.getItem('binso.statistics:finance-overview')??1)}catch{}
  queueMicrotask(()=>{if(active){if([1,3,6,12].includes(saved))setMonths(saved as 1|3|6|12);setRestored(true)}});
  return()=>{active=false};
 },[dashboard]);
 useEffect(()=>{if(!dashboard&&restored)try{sessionStorage.setItem('binso.statistics:finance-overview',String(months))}catch{}},[months,dashboard,restored]);
 const today=businessDate(),period:StatisticPeriod={months,from:'',to:''};
 const events=financialStatisticEvents(data),bounds=statisticBounds(period,today)!;
 const {totals}=aggregateStatistics(events,bounds,['revenue','income','costs']);
 const snapshot=data.financial?.snapshot;
 const trend=aggregateStatistics(events,statisticBounds({months:6,from:'',to:''},today)!,['revenue','income']).buckets;
 const key=snapshot?'revenue':'income',maximum=Math.max(1,...trend.map(bucket=>Math.abs(bucket.values[key])));
 return <section className="bo-cash-overview" aria-label={dashboard?'Monatsüberblick':'Finanzüberblick'}>
  {!dashboard&&<label className="bo-overview-period"><span className="visually-hidden"><LocalizedText>{'Statistikzeitraum'}</LocalizedText></span><Select value={months} onChange={event=>{setMonths(Number(event.target.value) as 1|3|6|12)}}>{[1,3,6,12].map(months=><option key={months} value={months}><LocalizedText>{months===1?'Dieser Monat':`${months} Monate`}</LocalizedText></option>)}</Select></label>}
  <MetricTiles>{(!dashboard||snapshot)&&<MetricTile label={dashboard?(snapshot?'Monatsumsatz':'Zahlungseingänge'):(snapshot?'Umsatz':'Einnahmen')} value={totals[key]} currency="CHF" compactMoney/>}{dashboard?<><MetricTile label="Zahlungseingänge" value={totals.income} currency="CHF" compactMoney/><MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney/><MetricTile label="Zahlungssaldo" value={sumMoney([totals.income,-totals.costs])} currency="CHF" compactMoney hint="Erfasste Zahlungen, kein Kontostand"/></>:<><MetricTile label="Offene Forderungen" value={snapshot?sumMoney([snapshot.open,snapshot.overdue]):'—'} currency="CHF" compactMoney/><MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney/><MetricTile label="Überfällig" value={snapshot?sumMoney([snapshot.overdue]):'—'} currency="CHF" compactMoney/></>}</MetricTiles>
  {!dashboard&&<><SectionTitle title="Monatsentwicklung"/><div className="bo-overview-bars" data-signed={trend.some(bucket=>bucket.values[key]<0)||undefined} role="group" aria-label="Monatsentwicklung">{trend.map(bucket=><button type="button" key={bucket.key} aria-label={bucket.label+': '+formatCurrency(bucket.values[key])} aria-pressed={selected===bucket.key} onClick={()=>setSelected(bucket.key)}><span className="bo-overview-bar-track"><i data-negative={bucket.values[key]<0||undefined} style={{'--bar-value':Math.abs(bucket.values[key])/maximum*100+'%'} as CSSProperties}/></span><small>{bucket.label}</small></button>)}</div>{selected&&<output className="bo-overview-selection">{trend.find(bucket=>bucket.key===selected)?.label} · {formatCurrency(trend.find(bucket=>bucket.key===selected)?.values[key])}</output>}<p className="bo-overview-explanation"><LocalizedText>{'Offene und überfällige Forderungen zeigen den aktuellen Bestand.'}</LocalizedText></p></>}
  {!dashboard&&data.incomplete&&<p className="bo-overview-explanation"><LocalizedText>{'Auszahlungsdaten sind unvollständig. Kosten ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Details findest du in der Finanzanalyse.'}</LocalizedText></p>}
 </section>;
}

const cashSeries:Series[]=[{key:'income',label:'Einnahmen',tone:'positive'},{key:'costs',label:'Ausgaben',tone:'negative'}];
export function CashStatistics({data,storageKey}:{data:CashStatisticsData;storageKey:string}){
 const financial=data.financial,snapshot=financial?.snapshot;
 const refundNotice=data.refunds?.length?'Zahlungseingänge sind nach erfassten Rückerstattungen ausgewiesen. ':'';
 const notice=refundNotice+(data.incomplete?'Auszahlungsdaten sind unvollständig. Betriebskosten und Löhne ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Der Saldo ist kein vollständiger Cashflow oder buchhalterischer Gewinn.':'');
 // An older/incomplete response may still show its known cash ledger, but must
 // never fabricate invoice metrics or compose income and outflow into one ring.
 if(!snapshot)return <Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={cashStatisticEvents(data)} series={cashSeries} metrics={totals=>[{label:'Einnahmen',value:totals.income},{label:'Ausgaben',value:totals.costs},{label:'Ergebnis',value:sumMoney([totals.income,-totals.costs]),hint:'Saldo erfasster Zahlungen'}]} notice={notice}/>;
 return <><Statistics title="Finanzentwicklung" subtitle="Erfasste Zahlungseingänge und nachgewiesene Auszahlungen · CHF" storageKey={storageKey} events={financialStatisticEvents(data)} series={cashSeries} metrics={totals=>[
  {label:'Einnahmen',value:totals.income,hint:'Erfasste Zahlungen nach Rückerstattungen'},
  {label:'Ausgaben',value:totals.costs,hint:'Nachgewiesene Auszahlungen'},
  {label:'Zahlungssaldo',value:sumMoney([totals.income,-totals.costs]),hint:'Kein Bankkontostand'}
 ]} notice={notice}/><details className="financial-snapshot"><summary><LocalizedText>{'Forderungen'}</LocalizedText></summary><p><LocalizedText>{'Bestand am '}</LocalizedText>{snapshot.as_of.split('-').reverse().join('.')}</p><MetricTiles><MetricTile label="Bezahlt" value={Number(snapshot.paid)} currency="CHF"/><MetricTile label="Offen" value={Number(snapshot.open)} currency="CHF"/><Link href={"/rechnungen?status="+encodeURIComponent("Überfällig")}><MetricTile label="Überfällig" value={Number(snapshot.overdue)} currency="CHF"/></Link>{Number(snapshot.credit_balance)>0&&<MetricTile label="Guthaben" value={Number(snapshot.credit_balance)} currency="CHF"/>}</MetricTiles></details></>;
}
