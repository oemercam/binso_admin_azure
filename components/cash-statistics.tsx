"use client";
import {RingChart,StatisticPeriodPicker,ComparisonBars} from './statistics';
import {cashStatisticEvents,financialStatisticEvents,type CashStatisticsData} from '@/lib/cash-statistics';
import {sumMoney} from '@/lib/money';
import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {LocalizedText,useTranslation,useLocale} from '@/lib/client/locale';
import {aggregateStatistics,statisticBounds,type StatisticPeriod} from '@/lib/statistics-period';
import {previousStatisticBounds,metricTrend} from '@/lib/kpi-trend';
import {businessDate,formatCurrency,formatDate} from '@/lib/financial-status';
import {ActionsMenu,ActionRow,ActionSheet,DetailDisclosure,MetricTiles,MetricTile,ListRow} from './binso-ux';
import {useStatisticPeriod} from '@/lib/client/statistic-period';
import {EmptyState,SectionTitle,LoadingState,ErrorState} from './ui';
import {localeTags} from '@/lib/locales/config';
import {usePageAccess} from '@/lib/client/page-access';
import {useApiQuery} from '@/lib/client/use-api-query';
import {listStateStore} from '@/lib/client/list-state';
import {financialStatusText} from '@/lib/financial-status';
import type {ReportSummary} from '@/lib/report-export';

/** Shared real ledger presentation; snapshot balances never acquire invented trends. */
export function CashOverview({data,dashboard=false,compact=false,afterMetrics,onPeriodChange,tools}:{data:CashStatisticsData;dashboard?:boolean;compact?:boolean;afterMetrics?:ReactNode;tools?:ReactNode;onPeriodChange?:(period:StatisticPeriod)=>void}){
 const [storedPeriod,setPeriod,periodReady]=useStatisticPeriod(dashboard?'dashboard':'finance-overview'),period=storedPeriod!;
 const [selected,setSelected]=useState<string|null>(null),translate=useTranslation(),{locale}=useLocale();
 useEffect(()=>{if(periodReady)onPeriodChange?.(period)},[onPeriodChange,period,periodReady]);
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
 if(!periodReady)return <LoadingState/>;
 return <section className="bo-cash-overview" data-compact={modern||undefined} aria-label={dashboard?'Monatsüberblick':'Finanzüberblick'}>
  <div className="records-search-row"><StatisticPeriodPicker period={period} onChange={value=>{setPeriod(value);onPeriodChange?.(value);setSelected(null)}}/>{tools}</div>

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
  {!dashboard?(knownIncome&&knownCosts?<ComparisonBars title="Finanzentwicklung" caption={formatDate(bounds.from,localeTags[locale])+' – '+formatDate(bounds.to,localeTags[locale])} income={totals.income} costs={totals.costs} balance={sumMoney([totals.income,-totals.costs])}/>:<EmptyState title="Keine Finanzdaten verfügbar"/>):trend.some(bucket=>bucket.values[key]!==0)&&<div className="bo-cash-trend"><SectionTitle title={modern?"Entwicklung":"Monatsentwicklung"}/>
   {trend.some(bucket=>bucket.values[key]!==0)?<><p className="bo-chart-legend"><span data-category={key}/><LocalizedText>{label}</LocalizedText><LocalizedText verbatim>{" · CHF"}</LocalizedText></p><div className="bo-overview-bars" data-category={key} data-signed={trend.some(bucket=>bucket.values[key]<0)||undefined} role="group" aria-label={translate('Entwicklung')+' · '+translate(label)+' · CHF'}>{trend.map(bucket=>{const description=bucket.label+': '+formatCurrency(bucket.values[key]);return <button type="button" key={bucket.key} title={description} aria-label={description} aria-pressed={selected===bucket.key} onClick={()=>setSelected(bucket.key)}><span className="bo-overview-bar-track"><i data-negative={bucket.values[key]<0||undefined} style={{'--bar-value':Math.abs(bucket.values[key])/maximum*100+'%'} as CSSProperties}/></span><small>{modern?bucket.label.replace(/\s+\d{2,4}$/,"").replace(/^(\d{1,2})\.(\d{1,2})\.–(\d{1,2})\.\2\.$/,"$1.–$3.$2."):bucket.label}</small></button>})}</div></>:<EmptyState title="Keine Entwicklung im Zeitraum"/>}
   {selected&&<output className="bo-overview-selection">{trend.find(bucket=>bucket.key===selected)?.label} · {formatCurrency(trend.find(bucket=>bucket.key===selected)?.values[key])}</output>}
  </div>}
  {modern&&<details className="bo-data-disclosure bo-overview-details"><summary><LocalizedText>{'Details zu den Kennzahlen'}</LocalizedText></summary><p><LocalizedText>{dashboard?'Umsatz: fakturiertes Volumen inklusive MwSt. nach Gutschriften. Eingänge: erfasste Zahlungen nach Rückerstattungen. Ausgaben: nachgewiesene Auszahlungen. Saldo: Eingänge abzüglich Ausgaben, kein Bankkontostand.':'Umsatz: fakturiertes Volumen inklusive MwSt. nach Gutschriften. Ohne Rechnungsdaten werden Einnahmen gezeigt. Offen und überfällig: aktueller Forderungsbestand, unabhängig vom Zeitraumfilter. Ausgaben: nachgewiesene Auszahlungen im gewählten Zeitraum.'}</LocalizedText></p><p><LocalizedText>{'Datenquelle'}</LocalizedText>: <LocalizedText>{snapshot?'Rechnungen nach Gutschriften':'Erfasste Zahlungen nach Rückerstattungen'}</LocalizedText>. {comparison}. <LocalizedText>{'Trends benötigen eine nichtnull Vergleichsbasis. Fehlende Vergleiche werden mit einem Strich dargestellt.'}</LocalizedText></p><ListRow information href="/finanzen/analyse" title="Finanzanalyse" meta=""/></details>}
  {data.incomplete&&<p className="bo-overview-explanation"><LocalizedText>{dashboard?'Ausgaben und Saldo enthalten nur nachgewiesene Zahlungen. Weitere Kosten sind noch nicht berücksichtigt.':'Auszahlungsdaten sind unvollständig. Kosten ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Details findest du in der Finanzanalyse.'}</LocalizedText></p>}
 </section>;
}


/** Existing cash ledger and current receivables remain distinct time bases. */
export function CashStatistics({data,storageKey}:{data:CashStatisticsData;storageKey:string}){
 const [storedPeriod,setPeriod,periodReady]=useStatisticPeriod(storageKey),period=storedPeriod!;
 const {locale}=useLocale(),translate=useTranslation(),access=usePageAccess();
 const today=businessDate(),bounds=statisticBounds(period,today)!,previous=previousStatisticBounds(bounds);
 const events=cashStatisticEvents(data),keys=['income','costs'];
 const current=aggregateStatistics(events,bounds,keys).totals,prior=aggregateStatistics(events,previous,keys).totals;
 const balance=sumMoney([current.income,-current.costs]),previousBalance=sumMoney([prior.income,-prior.costs]);
 const knownIncome=Array.isArray(data.payments)&&Array.isArray(data.refunds),knownCosts=Array.isArray(data.outflows)&&!data.incomplete;
 const comparison=translate('Vergleich')+': '+formatDate(bounds.from,localeTags[locale])+' – '+formatDate(bounds.to,localeTags[locale])+' / '+formatDate(previous.from,localeTags[locale])+' – '+formatDate(previous.to,localeTags[locale]);
 const trend=(value:number,before:number,known:boolean,lower=false)=>{const result=metricTrend(value,before,known,lower,comparison);return result.percent===null?undefined:result};
 const balanceTrend=trend(balance,previousBalance,knownIncome&&knownCosts);
 if(balanceTrend&&balance<=0&&balanceTrend.tone==='positive')balanceTrend.tone='neutral';
 const snapshot=data.financial?.snapshot,validSnapshot=!!snapshot&&[snapshot.paid,snapshot.open,snapshot.overdue].every(value=>value!==null&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0);
 const receivables=validSnapshot?sumMoney([snapshot.open,snapshot.overdue]):null;
 const money=(value:number)=>formatCurrency(value,'CHF',localeTags[locale]);
 const date=(day:string)=>new Intl.DateTimeFormat(localeTags[locale],{dateStyle:'medium',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));
 const caption=period.months===1?new Intl.DateTimeFormat(localeTags[locale],{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(bounds.from+'T12:00:00Z')):date(bounds.from)+' – '+date(bounds.to);
 const reportRange=(Date.parse(bounds.to)-Date.parse(bounds.from))/86400000<366;
 const report=useApiQuery<ReportSummary>(periodReady&&access.canOpen('/berichte')&&access.canOpen('/angebote')&&reportRange?'/api/reports?'+new URLSearchParams({months:'custom',from:bounds.from,to:bounds.to}):null);
 const offerRows=report.data?.offers,offerStates=['draft','sent','accepted','declined','expired','revised','cancelled'];
 const offersKnown=Array.isArray(offerRows),offerCounts=Object.fromEntries(offerStates.map(status=>[status,offersKnown?offerRows.filter(row=>row.status===status).reduce((total,row)=>total+Number(row.count),0):0]));
 const offerTotal=offersKnown?offerRows.reduce((total,row)=>total+Number(row.count),0):null;
 const [expanded,setExpanded]=useState({receivables:false,offers:false}),[notes,setNotes]=useState(false),restored=useRef(false),scrollRestore=useRef<number|null>(null);
 const stateKey='binso.list:analysis:'+storageKey;
 useEffect(()=>{const saved=listStateStore.get(stateKey);let state:{receivables?:boolean;offers?:boolean;y?:number}={};try{state=JSON.parse(saved??'{}')}catch{}const frame=requestAnimationFrame(()=>{scrollRestore.current=Number.isFinite(state.y)&&state.y!>=0?state.y!:null;setExpanded({receivables:state.receivables===true,offers:state.offers===true});restored.current=true});return()=>cancelAnimationFrame(frame)},[stateKey]);
 useEffect(()=>{if(!restored.current||report.loading||scrollRestore.current===null)return;let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(()=>{if(scrollRestore.current!==null){window.scrollTo({top:scrollRestore.current,behavior:'instant'});scrollRestore.current=null}})});return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second)}},[expanded,report.loading,stateKey]);
 const remember=(next=expanded,y=window.scrollY)=>{if(restored.current)listStateStore.set(stateKey,JSON.stringify({...next,y}))};
 const expand=(key:'receivables'|'offers',open:boolean)=>{const next={...expanded,[key]:open};setExpanded(next);remember(next)};
 if(!periodReady)return <LoadingState/>;
 return <div className="bo-finance-analysis bo-statistics" data-compact onClickCapture={event=>{const link=event.target instanceof Element?event.target.closest('a[href]'):null;if(link&&event.button===0&&!event.metaKey&&!event.ctrlKey&&!event.shiftKey&&!event.altKey)remember()}}>
  <div className="records-search-row"><StatisticPeriodPicker period={period} onChange={setPeriod}/><ActionsMenu tools label="Analysewerkzeuge"><ActionRow icon="file" title="Datenhinweise" onClick={()=>setNotes(true)}/></ActionsMenu></div>
  <MetricTiles columns={4}>
   <MetricTile label="Einnahmen" value={current.income} currency="CHF" compactMoney trend={trend(current.income,prior.income,knownIncome)}/>
   <MetricTile label="Ausgaben" value={current.costs} currency="CHF" compactMoney trend={trend(current.costs,prior.costs,knownCosts,true)}/>
   <MetricTile label="Saldo" value={balance} currency="CHF" compactMoney trend={balanceTrend}/>
   <MetricTile label="Offen" value={receivables??'—'} currency="CHF" compactMoney/>
  </MetricTiles>
  <ComparisonBars title="Finanzentwicklung" caption={caption} income={current.income} costs={current.costs} balance={balance}/>
  <DetailDisclosure label="Forderungen" open={expanded.receivables} onOpenChange={open=>expand('receivables',open)} summaryValue={receivables===null?'—':money(receivables)}>
   {validSnapshot?<><p className="bo-analysis-asof"><LocalizedText>Stand</LocalizedText>{': '+formatDate(snapshot.as_of,localeTags[locale])}</p><RingChart compact navigate label="Rechnungsbestand" parts={[{key:'paid',label:'Bezahlt',tone:'positive',value:Number(snapshot.paid),href:'/rechnungen?status='+encodeURIComponent('Bezahlt')},{key:'open',label:'Offen',tone:'warning',value:Number(snapshot.open),href:'/rechnungen?status='+encodeURIComponent('Offen')},{key:'overdue',label:'Überfällig',tone:'negative',value:Number(snapshot.overdue),href:'/rechnungen?status='+encodeURIComponent('Überfällig')}]}/>{Number(snapshot.credit_balance)>0&&<ListRow information title="Kundenguthaben" meta="" value={money(Number(snapshot.credit_balance))}/>}</>:<EmptyState title="Keine Finanzdaten verfügbar"/>}
  </DetailDisclosure>
  {access.canOpen('/angebote')&&<DetailDisclosure label="Angebote" open={expanded.offers} onOpenChange={open=>expand('offers',open)} summaryValue={offerTotal===null?'—':offerTotal.toLocaleString(localeTags[locale])}>
   {report.loading?<LoadingState/>:report.error?<ErrorState onRetry={report.refresh}>{report.error}</ErrorState>:!offersKnown?<EmptyState title="Keine Berichtsdaten verfügbar"/>:<><p className="bo-analysis-asof">{caption}</p>{offerStates.filter(status=>['draft','sent','accepted'].includes(status)||offerCounts[status]>0).map(status=><ListRow key={status} information href={'/angebote?status='+encodeURIComponent(financialStatusText(status,'offer'))} title={status==='draft'?'Entwürfe':financialStatusText(status,'offer')} meta="" value={offerCounts[status].toLocaleString(localeTags[locale])}/>)}</>}
  </DetailDisclosure>}
  <ActionSheet label="Datenhinweise" open={notes} onClose={()=>setNotes(false)}><div className="bo-analysis-notes"><p><LocalizedText>Saldo: Eingänge abzüglich Ausgaben, kein Bankkontostand.</LocalizedText></p><p><LocalizedText>Offen: aktueller Forderungsbestand inklusive überfälliger Beträge, unabhängig vom Zeitraumfilter.</LocalizedText></p><p><LocalizedText>Rechnungsbestand: beglichene und ausstehende Rechnungsanteile.</LocalizedText></p><p>{comparison}</p>{data.refunds?.length?<p><LocalizedText>Zahlungseingänge sind nach erfassten Rückerstattungen ausgewiesen.</LocalizedText></p>:null}{data.incomplete&&<p role="status"><LocalizedText>Auszahlungsdaten sind unvollständig. Betriebskosten und Löhne ohne nachgewiesenes Zahlungsdatum sind nicht enthalten. Der Saldo ist kein vollständiger Cashflow oder buchhalterischer Gewinn.</LocalizedText></p>}</div></ActionSheet>
 </div>;
}
