import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export const resources=JSON.parse(fs.readFileSync(new URL('../.github/model-a/readiness-resources.json',import.meta.url),'utf8'));
const versions={app:'2023-12-01',postgres:'2024-08-01',insights:'2020-02-02',alert:'2018-03-01',actionGroup:'2023-01-01'};
const same=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const check=(condition,message)=>{if(!condition)throw new Error(message);};

// Exact resource GETs only: no subscription discovery, settings/secrets or SQL.
export function readResource(key,execute=execFileSync){
 const id=resources[key];
 check(Boolean(id&&versions[key]),'Unknown readiness resource');
 return JSON.parse(execute('az',['resource','show','--ids',id,'--subscription',id.split('/')[2],'--api-version',versions[key],'-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
}
export function inspectReadiness(mode,read=readResource){
 check(['monitoring','backup'].includes(mode),'Expected monitoring or backup');
 const get=key=>{
  const value=read(key);
  check(same(value?.id,resources[key]),`Wrong or missing resource ID: ${key}`);
  check(value.properties&&typeof value.properties==='object',`Missing resource properties: ${key}`);
  return value;
 };
 if(mode==='backup'){
  const p=get('postgres').properties;
  check(p.state==='Ready','PostgreSQL is not Ready');
  check(Number.isInteger(p.backup?.backupRetentionDays)&&p.backup.backupRetentionDays>=7,'Backup retention must be at least 7 days');
  check(['Enabled','Disabled'].includes(p.backup.geoRedundantBackup),'Missing or invalid geo-backup metadata');
  return 'Backup configuration passed; restore capability still requires a separately approved restore test.';
 }
 const app=get('app'),insights=get('insights'),alert=get('alert'),group=get('actionGroup');
 check(app.properties.state==='Running','App Service is not Running');
 const linked=(from,to)=>Object.entries(from.tags??{}).some(([key,value])=>key.toLowerCase()===`hidden-link:${to}`.toLowerCase()&&String(value).toLowerCase()==='resource');
 check(linked(insights,resources.app)||linked(app,resources.insights),'Application Insights relationship metadata missing or stale; telemetry must be verified separately');
 check(alert.properties.enabled===true,'HTTP-5xx alert is disabled');
 check(Array.isArray(alert.properties.scopes)&&alert.properties.scopes.length===1&&same(alert.properties.scopes[0],resources.app),'HTTP-5xx alert targets a different, deleted or moved resource');
 const criteria=alert.properties.criteria?.allOf;
 check(Array.isArray(criteria)&&criteria.length>0&&criteria.every(c=>c.metricName==='Http5xx'&&same(c.metricNamespace,'Microsoft.Web/sites')&&c.operator==='GreaterThan'&&c.threshold===0&&c.timeAggregation==='Total'),'HTTP-5xx alert criteria do not detect server errors');
 check(alert.properties.actions?.some(a=>same(a.actionGroupId,resources.actionGroup)),'Expected action group is not attached');
 check(group.properties.enabled===true,'Action group is disabled');
 return 'Monitoring relationships passed; telemetry ingestion, recipient coverage and delivery remain separate operational evidence.';
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{console.log(inspectReadiness(process.argv[2]));}
 catch(error){console.error('::error::'+error.message);process.exitCode=1;}
}
