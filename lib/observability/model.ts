/** Public aggregate contract. No customer identifiers, payloads or secret values. */
export type HealthState='healthy'|'warning'|'critical'|'unknown'|'maintenance';
export type DataState='fresh'|'stale'|'unavailable'|'no_permission';
export type MonitoringArea='infrastructure'|'application'|'database'|'jobs'|'integrations'|'events'|'security'|'deployment'|'business';
export type MonitoringMetric={id:string;label:string;area:MonitoringArea;value:number|null;unit:string;source:string;measuredAt:string|null;window:string;state:HealthState;dataState:DataState;detail:string;href?:string};
export type MonitoringService={key:string;name:string;state:HealthState;source:string;measuredAt:string|null;detail:string};
export type MonitoringPoint={at:string;value:number|null};
export type MonitoringSeries={id:string;label:string;unit:string;source:string;points:MonitoringPoint[]};
export type AlarmRule={id:string;metricId:string;threshold:number;window:string;severity:'warning'|'critical';recovery:string;owner:string|null;escalation:string|null};
export type MonitoringAlarm={id:string;ruleId:string;state:HealthState;value:number|null;measuredAt:string|null};
export type MonitoringSnapshot={schemaVersion:1;checkedAt:string;refreshAfterSeconds:number;staleAfterSeconds:number;metrics:MonitoringMetric[];services:MonitoringService[];series:MonitoringSeries[];rules:AlarmRule[];alarms:MonitoringAlarm[];build:{sha:string|null};limitations:string[]};
export const healthLabels:Record<HealthState,string>={healthy:'Verfügbar',warning:'Warnung',critical:'Kritisch',unknown:'Unbekannt',maintenance:'Wartung'};
export const dataLabels:Record<DataState,string>={fresh:'Aktuell',stale:'Veraltet',unavailable:'Keine Messdaten',no_permission:'Keine Berechtigung'};
export function effectiveMetric(metric:MonitoringMetric,now=Date.now(),staleAfterSeconds=120):MonitoringMetric{
 const time=metric.measuredAt?Date.parse(metric.measuredAt):NaN;
 if(metric.dataState==='no_permission')return {...metric,value:null,state:'unknown'};
 if(metric.dataState!=='fresh'||metric.value===null||!Number.isFinite(metric.value)||!Number.isFinite(time)||time>now+5000)return {...metric,value:null,state:'unknown',dataState:metric.dataState==='stale'?'stale':'unavailable'};
 if(now-time>staleAfterSeconds*1000)return {...metric,state:'unknown',dataState:'stale'};
 return metric;
}
/** Unknown inputs cannot yield a healthy overall result. Maintenance is explicit only. */
export function overallHealth(states:readonly HealthState[]):HealthState{
 if(states.includes('critical'))return 'critical';if(states.includes('warning'))return 'warning';if(!states.length||states.includes('unknown'))return 'unknown';if(states.includes('maintenance'))return 'maintenance';return 'healthy';
}
export function evaluateAlarms(metrics:readonly MonitoringMetric[],rules:readonly AlarmRule[],now=Date.now(),staleAfterSeconds=120):MonitoringAlarm[]{
 return rules.map(rule=>{const metric=metrics.find(item=>item.id===rule.metricId);const value=metric?effectiveMetric(metric,now,staleAfterSeconds):null;return {id:rule.id,ruleId:rule.id,state:!value||value.dataState!=='fresh'?'unknown':value.value!>=rule.threshold?rule.severity:'healthy',value:value?.value??null,measuredAt:value?.measuredAt??null};});
}
export function formatMonitoringValue(metric:MonitoringMetric){
 if(metric.value===null||metric.dataState==='no_permission'||metric.dataState==='unavailable')return '—';
 return metric.value.toLocaleString('de-CH',{maximumFractionDigits:metric.unit==='CHF'?2:metric.unit==='s'?0:2})+(metric.unit==='count'?'':' '+metric.unit);
}
