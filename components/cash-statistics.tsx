"use client";
import {Statistics,RingChart,StatisticPeriodPicker,type Series} from './statistics';
import {cashStatisticEvents,financialStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';
import {useEffect,useState,type CSSProperties,type ReactNode} from 'react';
import {LocalizedText,useTranslation} from '@/lib/client/locale';
import {aggregateStatistics,statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {previousStatisticBounds,metricTrend} from '@/lib/kpi-trend';
import {businessDate,formatCurrency,formatDate} from '@/lib/financial-status';
import {MetricTiles,MetricTile,ListRow} from './binso-ux';
import {useStatisticPeriod} from '@/lib/client/statistic-period';
import {EmptyState,SectionTitle} from './ui';

/** Shared real ledger presentation; snapshot balances never acquire invented trends. */
export function CashOverview({data,dashboard=false,compact=false,afterMetrics,onPeriodChange}:{data:CashStatisticsData;dashboard?:boolean;compact?:boolean;afterMetrics?:ReactNode;onPeriodChange?:(period:StatisticPeriod)=>void}){
 const [storedPeriod,setPeriod]=useStatisticPeriod(dashboard?'dashboard':'finance-overview'),period=storedPeriod!;
 const [selected,setSelected]=useState<string|null>(null),translate=useTranslation();
 useEffect(()=>{onPeriodChange?.(period)},[onPeriodChange,period]);
 const today=businessDate(),events=financialStatisticEvents(data),bounds=statisticBounds(period,today)!;
 const {totals,buckets:trend}=aggregateStatistics(events,bounds,['revenue','income','costs']);
 const snapshot=data.financial?.snapshot,key=snapshot?'revenue':'income';
 const previous=previousStatisticBounds(bounds),prior=aggregateStatistics(events,previous,['revenue','income','costs']).totals;
 const comparison=translate('Vergleich')+': '+formatDate(bounds.from)+' – '+formatDate(bounds.to)+' / '+formatDate(previous.from)+' – '+formatDate(previous.to);
 const knownRevenue=!!snapshot&&Array.isArray(data.financial?.revenueEvents),knownIncome=Array.isArray(data.payments)&&Array.isArray(data.refunds),knownCosts=Array.isArray(data.outflows)&&!data.incomplete;
 const trendFor=(current:number,before:number,known:boolean,lower=false)=>metricTrend(current,before,known,lower,comparison+(known&&before!==0?'':' · '+translate('Keine vergleichbaren Vorperiodendaten')));
 const neutral=trendFor(0,0,false),revenueTrend=trendFor(totals[key],prior[key],snapshot?knownRevenue:knownIncome);
 const maximum=Math.max(1,...trend.map(bucket=>Math.abs(bucket.values[key]))),modern=dashboard||compact;
 const label=key==='revenue'?'Umsatz':'Eingänge';
 return <section className="bo-cash-overview" data-compact={modern||undefined} aria-label={dashboard?'Monatsüberblick':'Finanzüberblick'}>
  <StatisticPeriodPicker period={period} onChange={value=>{setPeriod(value);onPeriodChange?.(value);setSelected(null)}}/>

  <MetricTiles columns={modern?4:2}>
   <MetricTile label={dashboard||compact&&snapshot?'Umsatz':snapshot?'Fakturiertes Volumen':'Einnahmen'} hint={!modern&&snapshot?'Inklusive MwSt. nach Gutschriften':undefined} value={dashboard&&!snapshot?'—':totals[key]} currency="CHF" compactMoney trend={modern?dashboard&&!snapshot?neutral:revenueTrend:undefined}/>
   {dashboard?<>
    <MetricTile label="Eingänge" value={totals.income} currency="CHF" compactMoney trend={trendFor(totals.income,prior.income,knownIncome)}/>
    <MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney trend={trendFor(totals.costs,prior.costs,knownCosts,true)}/>
    <MetricTile label="Saldo" value={sumMoney([totals.income,-totals.costs])} currency="CHF" compactMoney trend={trendFor(sumMoney([totals.income,-totals.costs]),sumMoney([prior.income,-prior.costs]),knownIncome&&knownCosts)}/>
   </>:<>
    <MetricTile label={compact?'Offen':'Offene Forderungen'} value={snapshot?sumMoney([snapshot.open,snapshot.overdue]):'—'} currency="CHF" compactMoney trend={compact?neutral:undefined}/>
    <MetricTile label="Ausgaben" value={totals.costs} currency="CHF" compactMoney trend={compact?trendFor(totals.costs,prior.costs,knownCosts,true):undefined}/>
    <MetricTile label="Überfällig" value={snapshot?sumMoney([snapshot.overdue]):'—'} currency="CHF" compactMoney trend={compact?neutral:undefined}/>
   </>}
  </MetricTiles>
  {snapshot&&Number(snapshot.credit_balance)>0&&<ListRow information={modern} href={'/rechnungen?status='+encodeURIComponent('Überbezahlt')} title="Kundenguthaben" meta="Erfasstes Kundenguthaben, kein zusätzliches fakturiertes Volumen" value={formatCurrency(snapshot.credit_balance)}/>}
  {afterMetrics}
  <div className="bo-cash-trend"><SectionTitle title={modern?"Entwicklung":"Monatsentwicklung"}/>
   {trend.some(bucket=>bucket.values[key]!==0)?<><p className="bo-chart-legend"><span data-category={key}/><LocalizedText>{label}</LocalizedText><LocalizedText verbatim>{" · CHF"}</LocalizedText></p><div className="bo-overview-bars" data-category={key} data-signed={trend.some(bucket=>bucket.values[key]<0)||undefined} role="group" aria-label={translate('Entwicklung')+' · '+translate(label)+' · CHF'}>{trend.map(bucket=>{const description=bucket.label+': '+formatCurrency(bucket.values[key]);return <button type="button" key={bucket.key} title={description} aria-label={description} aria-pressed={selected===bucket.key} onClick={()=>setSelected(bucket.key)}><span className="bo-overview-bar-track"><i data-negative={bucket.values[key]<0||undefined} style={{'--bar-value':Math.abs(bucket.values[key])/maximum*100+'%'} as CSSProperties}/></span><small>{modern?bucket.label.replace(/\s+\d{2,4}$/,"").replace(/^(\d{1,2})\.(\d{1,2})\.–(\d{1,2})\.\2\.$/,"$1.–$3.$2."):bucket.label}</small></button>})}</div></>:<EmptyState title="Keine Entwicklung im Zeitraum"/>}
   {selected&&<output className="bo-overview-selection">{trend.find(bucket=>bucket.key===selected)?.label} · {formatCurrency(trend.find(bucket=>bucket.key===selected)?.values[key])}</output>}
  </div>
  {modern&&<details className="bo-data-disclosure bo-overview-details"><summary><LocalizedText>{'Details zu den Kennzahlen'}</LocalizedText></summary><p><LocalizedText>{dashboard?'Umsatz: fakturiertes Volumen inklusive MwSt. nach Gutschriften. Eingänge: erfasste Zahlungen nach Rückerstattungen. Ausgaben: nachgewiesene Auszahlungen. Saldo: Eingänge abzüglich Ausgaben, kein Bankkontostand.':'Umsatz: fakturiertes Volumen inklusive MwSt. nach Gutschriften. Ohne Rechnungsdaten werden Einnahmen gezeigt. Offen und überfällig: aktueller Forderungsbestand, unabhängig vom Zeitraumfilter. Ausgaben: nachgewiesene Auszahlungen im gewählten Zeitraum.'}</LocalizedText></p><p><LocalizedText>{'Datenquelle'}</LocalizedText>: <LocalizedText>{snapshot?'Rechnungen nach Gutschriften':'Erfasste Zahlungen nach Rückerstattungen'}</LocalizedText>. {comparison}. <LocalizedText>{'Trends benötigen eine nichtnull Vergleichsbasis. Fehlende Vergleiche werden mit einem Strich dargestellt.'}</LocalizedText></p><ListRow information href="/finanzen/analyse" title="Finanzanalyse" meta=""/></details>}
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
