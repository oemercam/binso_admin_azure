import assert from 'node:assert/strict';
import {inspectReadiness,readResource,resources} from './azure-readiness-check.mjs';
const fixture=()=>({
 app:{id:resources.app,properties:{state:'Running'}},
 insights:{id:resources.insights,tags:{['hidden-link:'+resources.app]:'Resource'},properties:{}},
 alert:{id:resources.alert,properties:{enabled:true,scopes:[resources.app],criteria:{allOf:[{metricName:'Http5xx',metricNamespace:'Microsoft.Web/sites',operator:'GreaterThan',threshold:0,timeAggregation:'Total'}]},actions:[{actionGroupId:resources.actionGroup}]}},
 actionGroup:{id:resources.actionGroup,properties:{enabled:true}},
 postgres:{id:resources.postgres,properties:{state:'Ready',backup:{backupRetentionDays:7,geoRedundantBackup:'Disabled'}}}
});
const run=(mode,data)=>inspectReadiness(mode,key=>structuredClone(data[key]));
assert.match(run('monitoring',fixture()),/relationships passed/);
assert.match(run('backup',fixture()),/configuration passed/);
const reject=(mode,mutate,pattern)=>{const data=fixture();mutate(data);assert.throws(()=>run(mode,data),pattern);};
for(const key of Object.keys(resources)){
 let calls=0;
 readResource(key,(command,args)=>{
  calls++;assert.equal(command,'az');assert.deepEqual(args.slice(0,2),['resource','show']);
  assert.equal(args[args.indexOf('--ids')+1],resources[key]);
  assert.equal(args[args.indexOf('--subscription')+1],resources[key].split('/')[2]);
  assert(!args.includes('list'));return JSON.stringify(fixture()[key]);
 });assert.equal(calls,1);
 reject(key==='postgres'?'backup':'monitoring',d=>{d[key].id=d[key].id.replace('rg-binso-admin-prod','wrong-rg');},/resource ID/);
 reject(key==='postgres'?'backup':'monitoring',d=>{delete d[key];},/resource ID/);
}
reject('monitoring',d=>{d.alert.properties.scopes=[resources.app.replace('57c41f8a-69de-4655-bea5-fad30de6921a','41e77b08-a365-41cd-a681-b07dc0326bc6')];},/targets/);
reject('monitoring',d=>{d.alert.properties.enabled=false;},/disabled/);
reject('monitoring',d=>{d.actionGroup.properties.enabled=false;},/disabled/);
reject('monitoring',d=>{d.alert.properties.actions=[];},/attached/);
reject('monitoring',d=>{d.alert.properties.criteria.allOf[0].metricName='Requests';},/criteria/);
reject('monitoring',d=>{d.insights.tags={};},/relationship/);
reject('monitoring',d=>{d.insights.tags={['hidden-link:'+resources.app.replace('57c41f8a-69de-4655-bea5-fad30de6921a','41e77b08-a365-41cd-a681-b07dc0326bc6')]:'Resource'};},/relationship/);
reject('monitoring',d=>{d.app.properties.state='Stopped';},/Running/);
reject('backup',d=>{d.postgres.properties.state='Stopped';},/Ready/);
for(const retention of [6,'7',null])reject('backup',d=>{d.postgres.properties.backup.backupRetentionDays=retention;},/retention/);
reject('backup',d=>{delete d.postgres.properties.backup.geoRedundantBackup;},/geo-backup/);
assert.throws(()=>inspectReadiness('monitoring',()=>{throw new Error('Access denied');}),/Access denied/);
assert.throws(()=>readResource('postgres',()=>'{bad JSON'),SyntaxError);
console.log('Azure exact-resource readiness: positive fixtures, two subscriptions, stale targets/links, missing/wrong resources, permissions and invalid backup metadata verified without cloud access.');
