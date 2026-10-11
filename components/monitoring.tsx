"use client";
import Link from 'next/link';
import {applyTheme} from '@/lib/client/theme';
import {useEffect,useState} from 'react';
import {useApiQuery} from '@/lib/client/use-api-query';
import {useBackendMode} from '@/lib/client/backend';
import {effectiveMetric,evaluateAlarms,formatMonitoringValue,healthLabels,dataLabels,overallHealth,type MonitoringSnapshot,type MonitoringMetric,type MonitoringSeries,type HealthState,type MonitoringArea} from '@/lib/observability/model';
import {DetailTabs,MetricTiles,MetricTile,WorkspaceSection} from './binso-ux';
import {Button,EmptyState,ErrorState,LoadingState,SectionTitle,Status,Select} from './ui';
import {MonitoringChart} from './monitoring-chart';

type Profile='technical'|'business'|'combined';
const areas:ReadonlyArray<[MonitoringArea,string]>=[['infrastructure','Infrastruktur'],['application','Anwendung und APIs'],['database','Datenbank'],['jobs','Hintergrundprozesse'],['integrations','Integrationen'],['events','Fehler und Ereignisse'],['security','Sicherheitsereignisse'],['deployment','Deployments'],['business','Geschäftsprozesse']];
function HealthBadge({state}:{state:HealthState}){return <Status tone={state==='healthy'?'success':state==='critical'?'danger':state==='warning'?'warning':'neutral'}>{healthLabels[state]}</Status>;}
function MetricReading({metric,wallboard}:{metric:MonitoringMetric;wallboard:boolean}){
 const hint=dataLabels[metric.dataState]+' · '+metric.window;
 return <div className="bo-monitor-reading" data-metric-id={metric.id} data-health={metric.state}><MetricTile label={metric.label} value={formatMonitoringValue(metric)} hint={hint}/>{!wallboard&&<><HealthBadge state={metric.state}/><small>{metric.source}{metric.measuredAt?' · '+new Date(metric.measuredAt).toLocaleTimeString('de-CH'):''}</small><p>{metric.detail}</p>{metric.href&&metric.dataState==='fresh'&&<Link href={metric.href}>Details öffnen</Link>}</>}</div>;
}
/** Compact portal overview; source explanations stay available on demand. */
function MonitoringOverview({metrics,services,series,alarms,data,unavailable}:{metrics:MonitoringMetric[];services:MonitoringSnapshot['services'];series:MonitoringSeries[];alarms:ReturnType<typeof evaluateAlarms>;data:MonitoringSnapshot;unavailable:boolean}){
 const [chart,setChart]=useState(series[0]?.id??'');
 const headline=metrics.filter(item=>['db_query_ms','snapshot_ms','app_errors','mail_failed'].includes(item.id));
 const active=alarms.filter(item=>item.state!=='healthy');
 return <>
  <MetricTiles>{headline.map(metric=><MetricTile key={metric.id} label={metric.label} value={formatMonitoringValue(metric)} hint={healthLabels[metric.state]}/>)}</MetricTiles>
  <WorkspaceSection><SectionTitle title="Performance im Verlauf"/>
   <div className="bo-monitor-chart-tabs"><DetailTabs label="Performance-Diagramm">{series.map(item=><button key={item.id} type="button" className={chart===item.id?'active':''} onClick={()=>setChart(item.id)}>{item.label.split(' ')[0]}</button>)}</DetailTabs></div>
   <div className="bo-monitor-charts">{series.map(item=><div key={item.id} className="bo-monitor-chart-slot" data-selected={chart===item.id}><MonitoringChart series={item} unavailable={unavailable}/></div>)}</div>
  </WorkspaceSection>
  <WorkspaceSection className="monitoring-panel"><SectionTitle title="Service-Status"/><div className="bo-monitor-services">{services.map(service=><details key={service.key} data-service-status={service.state}><summary><b>{service.name}</b><HealthBadge state={service.state}/></summary><p>{service.detail}</p></details>)}</div></WorkspaceSection>
  <WorkspaceSection><SectionTitle title="Alarme"/>{active.length?<div className="bo-monitor-alarms">{active.map(alarm=>{const rule=data.rules.find(item=>item.id===alarm.ruleId)!;return <details key={alarm.id} data-alarm-id={alarm.id}><summary><b>{metrics.find(item=>item.id===rule.metricId)?.label??rule.id}</b><HealthBadge state={alarm.state}/></summary><p>Schwelle ≥ {rule.threshold} · {rule.window} · Wiederherstellung: {rule.recovery} · Zuständigkeit: {rule.owner??'Nicht zugewiesen'} · Eskalation: {rule.escalation??'Nicht eingerichtet'}</p></details>;})}</div>:<p>Keine Regel ausgelöst in den verfügbaren Messdaten.</p>}</WorkspaceSection>
  <details className="bo-monitor-details"><summary>Messwerte und technische Details</summary>{areas.filter(([area])=>area!=='integrations').map(([area,label])=><WorkspaceSection key={area}><SectionTitle title={label}/><div className="bo-monitor-detail-metrics">{metrics.filter(item=>item.area===area).map(metric=><details key={metric.id} data-metric-id={metric.id} data-health={metric.state}><summary><span>{metric.label}</span><strong>{formatMonitoringValue(metric)}</strong><HealthBadge state={metric.state}/></summary><p>{metric.detail}</p><small>{metric.source} · {dataLabels[metric.dataState]} · {metric.window}</small>{metric.href&&metric.dataState==='fresh'&&<Link href={metric.href}>Details öffnen</Link>}</details>)}</div></WorkspaceSection>)}</details>
  <details className="bo-monitor-details"><summary>Datenquellen und Grenzen</summary><p>Lokale Regelauswertung · keine aktive Benachrichtigung oder Eskalation.</p>{data.limitations.map(text=><p key={text}>{text}</p>)}<p>Aktiver Worker: <code>{data.build.sha??'Nicht verfügbar'}</code></p></details>
 </>;
}
/** One endpoint, polling policy and presentation for portal and authenticated wallboard. */
export function MonitoringPanel({wallboard=false,initialProfile='combined'}:{wallboard?:boolean;initialProfile?:Profile}){
 const backend=useBackendMode();
 const production=wallboard||backend;
 const resource=useApiQuery<MonitoringSnapshot>(production?'/api/operator/monitoring':null);
 const [profile,setProfile]=useState<Profile>(initialProfile),[now,setNow]=useState(0),[offline,setOffline]=useState(false),[fullscreenError,setFullscreenError]=useState('');
 useEffect(()=>{const update=()=>{setNow(Date.now());setOffline(!navigator.onLine);};const timer=window.setInterval(update,1000);window.addEventListener('online',update);window.addEventListener('offline',update);update();return()=>{window.clearInterval(timer);window.removeEventListener('online',update);window.removeEventListener('offline',update);};},[]);
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();setFullscreenError('');}catch{setFullscreenError('Vollbild ist in diesem Browser nicht verfügbar.');}};
 const theme=()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
 const data=resource.data?.schemaVersion===1?resource.data:undefined;
 if(!production)return <EmptyState icon="chart" title="Monitoring benötigt eine Admin-Anmeldung" text="In der Demo werden keine produktiven Messwerte oder simulierten Systemzustände angezeigt."/>;
 if(resource.loading)return <LoadingState>Messdaten werden geladen …</LoadingState>;
 if(!data)return <ErrorState onRetry={resource.refresh}>{resource.error??'Keine verifizierten Monitoring-Daten verfügbar.'}</ErrorState>;
 const disconnected=offline||Boolean(resource.error),stale=now>0&&now-Date.parse(data.checkedAt)>data.staleAfterSeconds*1000;
 const unavailable=disconnected||stale;
 const metrics=data.metrics.map(item=>effectiveMetric(unavailable&&item.dataState==='fresh'?{...item,dataState:'stale'}:item,now||Date.parse(data.checkedAt),data.staleAfterSeconds));
 const services=data.services.map(item=>({...item,state:unavailable||!item.measuredAt||now-Date.parse(item.measuredAt)>data.staleAfterSeconds*1000?'unknown' as const:item.state}));
 const alarms=evaluateAlarms(metrics,data.rules,now||Date.parse(data.checkedAt),data.staleAfterSeconds);
 const visible=metrics.filter(item=>profile==='combined'||profile==='business'&&item.area==='business'||profile==='technical'&&item.area!=='business');
 const selected=wallboard?visible.filter(item=>profile==='business'?['customers','registrations','subscriptions','payments','past_due','signup_failures','invoice_failures'].includes(item.id):profile==='technical'?['db_query_ms','snapshot_ms','process_uptime','app_errors','mail_failed','mail_stuck','vital_LCP','azure_cpu'].includes(item.id):['customers','subscriptions','payments','past_due','db_query_ms','snapshot_ms','mail_failed','app_errors'].includes(item.id)):visible;
 const state=overallHealth([...services.map(item=>item.state),...alarms.map(item=>item.state)]);
 const series:MonitoringSeries[]=unavailable?data.series.map(item=>({...item,points:[]})):data.series;
 return <div className={wallboard?'bo-monitoring bo-monitoring-wallboard':'bo-monitoring bo-monitoring-portal'}>
  <div className="bo-monitor-toolbar"><div>{wallboard&&<h2>Binso One · Monitoring</h2>}<HealthBadge state={state}/><p role="status">{disconnected?'Verbindung unterbrochen':stale?'Messdaten veraltet':'Automatische Aktualisierung · 60 Sekunden'} · {new Date(data.checkedAt).toLocaleTimeString('de-CH',{hour:'2-digit',minute:'2-digit'})}</p></div><div className="bo-monitor-controls">{wallboard?<><Select aria-label="Wallboard-Profil" value={profile} onChange={e=>setProfile(e.target.value as Profile)}><option value="technical">Technical</option><option value="business">Business</option><option value="combined">Combined</option></Select><Button variant="secondary" onClick={theme}>Hell / Dunkel</Button><Button variant="secondary" onClick={()=>void fullscreen()}>Vollbild</Button><Link href="/operator/monitoring">Adminportal</Link></>:<><Button variant="secondary" onClick={resource.refresh}>Aktualisieren</Button><Link href="/operator/wallboard">Wallboard öffnen</Link></>}</div></div>
  {resource.error&&<ErrorState onRetry={resource.refresh}>{resource.error} · Messwerte bleiben als veraltet gekennzeichnet.</ErrorState>}{fullscreenError&&<ErrorState>{fullscreenError}</ErrorState>}
  {!wallboard?<MonitoringOverview metrics={metrics} services={services} series={series} alarms={alarms} data={data} unavailable={unavailable}/>:<>
  {wallboard&&<MetricTiles>{selected.map(metric=><MetricReading key={metric.id} metric={metric} wallboard/>)}</MetricTiles>}
  {profile!=='business'&&<WorkspaceSection className="monitoring-panel"><SectionTitle title="Service-Status"/><div className="monitoring-list">{services.map(service=><div data-service-status={service.state} key={service.key}><span><b>{service.name}</b>{!wallboard&&<small>{service.detail}</small>}</span><HealthBadge state={service.state}/></div>)}</div></WorkspaceSection>}
  {profile!=='business'&&<WorkspaceSection><SectionTitle title="Historische Auswertungen"/><div className="bo-monitor-charts">{series.map(item=><MonitoringChart key={item.id} series={item} unavailable={unavailable}/>)}</div></WorkspaceSection>}
  <WorkspaceSection><SectionTitle title="Alarmzentrale"/><p>Lokale Regelauswertung · keine aktive Benachrichtigung oder Eskalation.</p><div className="bo-monitor-alarms">{alarms.filter(alarm=>!wallboard||alarm.state!=='healthy').map(alarm=>{const rule=data.rules.find(item=>item.id===alarm.ruleId)!;const metric=metrics.find(item=>item.id===rule.metricId);return <div key={alarm.id} data-alarm-id={alarm.id}><b>{metric?.label??rule.id}</b><HealthBadge state={alarm.state}/>{!wallboard&&<small>Schwelle ≥ {rule.threshold} · {rule.window} · Wiederherstellung: {rule.recovery} · Zuständigkeit: {rule.owner??'Nicht zugewiesen'} · Eskalation: {rule.escalation??'Nicht eingerichtet'}</small>}</div>;})}</div>{wallboard&&alarms.every(item=>item.state==='healthy')&&<p>Keine Regel ausgelöst in den verfügbaren Messdaten.</p>}</WorkspaceSection>
  {wallboard?<footer className="bo-monitor-wallboard-footer">Worker: {data.build.sha?.slice(0,7)??'Unbekannt'} · Azure-Telemetrie und Deployment-Historie nicht angebunden · keine Kundendetails</footer>:<WorkspaceSection><SectionTitle title="Datenquellen und Grenzen"/>{data.limitations.map(text=><p key={text}>{text}</p>)}</WorkspaceSection>}
  </>}
 </div>;
}
