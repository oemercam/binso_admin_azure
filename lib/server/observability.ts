import 'server-only';
import {withPlatform} from './db';
import {getOperationalIntegrationStatus} from './integrations';
import {operatorCan,type OperatorRole} from '@/lib/permissions';
import {observabilityReadings} from './repositories/observability';
import {evaluateAlarms,type MonitoringMetric,type MonitoringSnapshot,type MonitoringArea,type HealthState} from '@/lib/observability/model';

export async function monitoringSnapshot(role:OperatorRole):Promise<MonitoringSnapshot>{
 const started=performance.now(),at=new Date().toISOString();
 const billing=operatorCan(role,'subscriptions:read'),audit=operatorCan(role,'platform_audit:read');
 const metrics:MonitoringMetric[]=[];
 const metric=(id:string,label:string,area:MonitoringArea,value:number|null,unit:string,source:string,window:string,detail:string,state:HealthState='healthy',allowed=true,href?:string)=>{
  metrics.push({id,label,area,value:allowed?value:null,unit,source,measuredAt:allowed&&value!==null?at:null,window,detail,state:allowed&&value!==null?state:'unknown',dataState:!allowed?'no_permission':value===null?'unavailable':'fresh',href});
 };
 let readings:Awaited<ReturnType<typeof observabilityReadings>>|null=null;
 let dbLatency:number|null=null;
 try{
  const dbStarted=performance.now();
  readings=await withPlatform(async c=>{await c.query("SET LOCAL statement_timeout='8000ms'");return observabilityReadings(c,{billing,audit});},{snapshot:true});
  dbLatency=Math.round(performance.now()-dbStarted);
 }catch{/* Do not expose provider errors, credentials or SQL to the wallboard. */}
 const integrations=await getOperationalIntegrationStatus();
 const count=(rows:Array<{[key:string]:unknown}>|undefined,key:string,status:string)=>rows?Number(rows.find(row=>row[key]===status)?.count??0):null;
 const sum=(rows:Array<{[key:string]:unknown}>|undefined)=>rows?rows.reduce((n,row)=>n+Number(row.count),0):null;
 metric('db_query_ms','Datenbank-Abfrage','database',dbLatency,'ms','PostgreSQL · read-only snapshot','Einzelmessung','Zeit für die Monitoring-Abfragen, kein Datenbank-Performance-SLA.');
 metric('incidents','Aktive Störungen','events',sum(readings?.incidents),'count','platform_incidents','Aktueller Bestand','Erfasste Störungen, keine automatische Vollständigkeitsgarantie.',sum(readings?.incidents)?'warning':'healthy');
 metric('mail_failed','Fehlgeschlagene E-Mails','jobs',count(readings?.queue,'status','failed'),'count','mail_outbox + document_deliveries','Aktueller Bestand','Definitiv nicht versendete Aufträge; kein erneuter Versand.',count(readings?.queue,'status','failed')?'critical':'healthy');
 metric('mail_uncertain','Unklare E-Mail-Zustellung','jobs',count(readings?.queue,'status','uncertain'),'count','mail_outbox + document_deliveries','Aktueller Bestand','Einschliesslich historisch ungeklärter Dokumentfehler. Beim Anbieter prüfen; nicht automatisch wiederholen.',count(readings?.queue,'status','uncertain')?'warning':'healthy');
 metric('mail_stuck','Unterbrochener Versand','jobs',count(readings?.queue,'status','sending'),'count','mail_outbox + document_deliveries','sending älter als 5 Minuten','Erfasste hängende Zustellungen.',count(readings?.queue,'status','sending')?'warning':'healthy');
 metric('mail_queued','Wartender Versand','jobs',count(readings?.queue,'status','queued'),'count','mail_outbox','Aktueller Bestand','Warteschlangenbestand ist keine Zustellbestätigung.');
 metric('app_errors','Erfasste Anwendungsfehler','application',count(readings?.events,'severity','error'),'count','application_events','24 Stunden','Nur explizit protokollierte Ereignisse; keine HTTP-Fehlerrate.',count(readings?.events,'severity','error')?'warning':'healthy');
 metric('customers','Kunden','business',readings?Number(readings.business.customers):null,'count','organizations · ohne Demo','Aktueller Bestand','Aggregierter Kundenbestand.','healthy',operatorCan(role,'organizations:read'),'/operator/kunden');
 metric('registrations','Neue Kundenkonten','business',readings?Number(readings.business.registrations_24h):null,'count','organizations.created_at · ohne Demo','24 Stunden','Erstellte Konten, keine Messung aller Registrierungsversuche.','healthy',operatorCan(role,'organizations:read'),'/operator/kunden');
 metric('subscriptions','Aktive Abonnemente','business',readings?Number(readings.business.subscriptions):null,'count','organization_subscriptions · ohne Demo','Aktueller Bestand','Gezählter Status active.','healthy',billing,'/operator/abonnemente');
 metric('payments','Zahlungseingänge','business',readings?.finance?Number(readings.finance.payments_30d):null,'CHF','platform_billing_payments · ohne Demo','30 Kalendertage inklusive heute','Erfasste CHF-Zahlungen, kein buchhalterischer Umsatz.','healthy',billing,'/operator/zahlungen');
 metric('past_due','Überfällige Abonnemente','business',readings?.finance?Number(readings.finance.past_due):null,'count','organization_subscriptions · ohne Demo','Aktueller Bestand','Status past_due, kein Betrag offener Rechnungen.','healthy',billing,'/operator/abonnemente');
 metric('billing_failed','Fehlgeschlagene Billing-Webhooks','jobs',readings?.finance?Number(readings.finance.webhook_failed):null,'count','billing_webhook_events','24 Stunden','Protokollierte Verarbeitungsfehler, keine vollständige Zahlungsfehlerrate.',readings?.finance?.webhook_failed?'critical':'healthy',billing);
 metric('audit_events','Administrative Audit-Ereignisse','security',readings?.security?Number(readings.security.count):null,'count','platform_audit_events','24 Stunden','Alle protokollierten Aktionen, keine Authentifizierungsfehlerrate.','healthy',audit,'/operator/audit');
 const series:MonitoringSnapshot['series']=[];
 for(const [name,unit] of [['LCP','ms'],['INP','ms'],['CLS','score']] as const){
  const rows=readings?.vitals.filter(row=>row.metric===name)??[];
  const values=rows.map(row=>Number(row.value)).filter(Number.isFinite).sort((a,b)=>a-b);
  metric('vital_'+name,name+' p75','application',values.length?values[Math.ceil(values.length*.75)-1]:null,unit,'web_vitals · max. 5000 neueste Proben','24 Stunden','Browser-Telemetrie aller Portale; keine API-Antwortzeit.');
  const buckets=new Map<string,number[]>();for(const row of rows){const date=new Date(row.created_at);if(!Number.isFinite(date.getTime())||!Number.isFinite(Number(row.value)))continue;date.setUTCMinutes(0,0,0);const key=date.toISOString();buckets.set(key,[...(buckets.get(key)??[]),Number(row.value)]);}
  series.push({id:name,label:name+' p75 pro Stunde',unit,source:'web_vitals · letzte 24 Stunden',points:[...buckets].sort(([a],[b])=>a.localeCompare(b)).map(([at,values])=>{values.sort((a,b)=>a-b);return {at,value:values[Math.ceil(values.length*.75)-1]};})});
 }
 for(const [id,label,area,unit] of [['azure_cpu','Azure CPU','infrastructure','%'],['azure_memory','Azure Arbeitsspeicher','infrastructure','bytes'],['azure_restarts','Azure Neustarts','infrastructure','count'],['http_requests','HTTP-Requests','application','count'],['http_error_rate','HTTP-Fehlerrate','application','%'],['auth_failures','Authentifizierungsfehler','security','count'],['signup_failures','Fehlgeschlagene Registrierungen','business','count'],['invoice_failures','Fehlerhafte Rechnungsprozesse','business','count'],['deployment_result','Letztes Deployment','deployment','count']] as const)metric(id,label,area,null,unit,'Nicht angebunden','Nicht verfügbar','Erfordert eine verifizierte Datenquelle; keine erfolgreichen Zustände abgeleitet.');
 metric('process_uptime','Laufzeit dieses Workers','infrastructure',Math.floor(process.uptime()),'s','Node.js process.uptime','Aktueller Worker','Kein Verfügbarkeitsverlauf, keine Neustartanzahl.');
 metric('snapshot_ms','Monitoring-Antwortzeit','application',Math.round(performance.now()-started),'ms','Server performance.now','Einzelmessung','Gesamtdauer dieses Snapshots inklusive Provider-Prüfungen.');
 const rules:MonitoringSnapshot['rules']=[
  {id:'mail-failed',metricId:'mail_failed',threshold:1,window:'Aktueller Bestand',severity:'critical',recovery:'Bestand wieder 0 bei frischer Messung',owner:null,escalation:null},
  {id:'mail-uncertain',metricId:'mail_uncertain',threshold:1,window:'Aktueller Bestand',severity:'warning',recovery:'Bestand wieder 0 bei frischer Messung',owner:null,escalation:null},
  {id:'mail-stuck',metricId:'mail_stuck',threshold:1,window:'sending älter als 5 Minuten',severity:'warning',recovery:'Kein hängender Versand bei frischer Messung',owner:null,escalation:null},
  {id:'billing-failed',metricId:'billing_failed',threshold:1,window:'24 Stunden',severity:'critical',recovery:'Keine Fehler im 24h-Fenster bei frischer Messung',owner:null,escalation:null},
 ];
 return {schemaVersion:1,checkedAt:new Date().toISOString(),refreshAfterSeconds:60,staleAfterSeconds:120,metrics,series,rules,alarms:evaluateAlarms(metrics,rules),build:{sha:process.env.BINSO_BUILD_SHA??null},services:[
  {key:'app',name:'Anwendung',state:'healthy',source:'Erfolgreicher authentifizierter API-Aufruf',measuredAt:at,detail:'Dieser Worker antwortet; keine historische Verfügbarkeit.'},
  {key:'database',name:'Datenbank',state:readings?'healthy':'critical',source:'PostgreSQL read-only snapshot',measuredAt:at,detail:readings?'PostgreSQL erreichbar':'Monitoring-Abfrage fehlgeschlagen; Ursache muss geprüft werden.'},
  ...integrations.filter(item=>item.key!=='database').map(item=>({key:item.key,name:item.label,state:(item.status==='degraded'?'critical':item.status==='operational'&&item.latencyMs!==null?'healthy':'unknown') as HealthState,source:item.latencyMs!==null?'Read-only Provider-Probe':'Konfiguration / Implementierungsstand',measuredAt:item.latencyMs!==null?at:null,detail:item.detail})),
 ],limitations:['Azure Monitor, Application Insights, Log Analytics und Deployment-Historie sind noch nicht angebunden.','Alarme werden pro Regel dedupliziert und bei jeder frischen Messung neu bewertet. Persistente Alarmhistorie, Benachrichtigung und Eskalation sind nicht aktiviert.','Zuständigkeiten, Eskalationskanäle und zusätzliche Schwellenwerte benötigen eine freigegebene Betriebskonfiguration.','Fehlende Messwerte, veraltete Daten und fehlende Berechtigungen sind niemals Healthy.']};
}
