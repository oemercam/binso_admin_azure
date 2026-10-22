import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {moduleUrl} from './data-test-modules.mjs';
const modelUrl=moduleUrl(await fs.readFile('lib/observability/model.ts','utf8'));
const {validWebVital}=await import(moduleUrl(await fs.readFile('lib/web-vitals.ts','utf8')));
const validVital={name:'INP',value:100,rating:'good',route:'/dashboard'};
for(const name of ['CLS','FCP','INP','LCP','TTFB'])assert.equal(validWebVital({...validVital,name}),true);
for(const patch of [{name:'FID'},{name:'unknown'},{value:-1},{value:null},{value:'100'},{value:Infinity},{rating:'unknown'},{route:'//outside.invalid'},{route:'/go?token=private'},{route:'/go#private'}])assert.equal(validWebVital({...validVital,...patch}),false);
const {effectiveMetric,evaluateAlarms,overallHealth}=await import(modelUrl);
const at='2026-10-11T12:00:00Z',now=Date.parse(at);
const metric={id:'failed',value:1,measuredAt:at,state:'critical',dataState:'fresh'};
const rule={id:'failure',metricId:'failed',threshold:1,severity:'critical'};
assert.equal(evaluateAlarms([metric],[rule],now)[0].state,'critical');
assert.equal(evaluateAlarms([{...metric,value:0}],[rule],now)[0].state,'healthy');
for(const input of [{...metric,value:null},{...metric,measuredAt:null},{...metric,measuredAt:'invalid'},{...metric,measuredAt:'2026-10-11T13:00:00Z'},{...metric,dataState:'no_permission'},{...metric,dataState:'unavailable'}])assert.equal(effectiveMetric(input,now).state,'unknown');
assert.equal(effectiveMetric(metric,now+120001).dataState,'stale');
assert.equal(evaluateAlarms([metric],[rule],now+120001)[0].state,'unknown');
assert.equal(evaluateAlarms([],[rule],now)[0].state,'unknown');
assert.equal(overallHealth(['healthy','unknown']),'unknown');assert.equal(overallHealth([]),'unknown');assert.equal(overallHealth(['healthy','critical']),'critical');assert.equal(overallHealth(['maintenance']),'maintenance');
const permissions=moduleUrl(await fs.readFile('lib/permissions.ts','utf8'));
const repository=moduleUrl((await fs.readFile('lib/server/repositories/observability.ts','utf8')).replace("import 'server-only';",''));
const integrations=moduleUrl("export async function getOperationalIntegrationStatus(){return [{key:'banking',label:'Bank',status:'not_implemented',latencyMs:null,detail:'Nicht aktiviert'},{key:'storage',label:'Storage',status:'configured',latencyMs:null,detail:'Nur konfiguriert'}];}");
const dbUrl=moduleUrl("export async function withPlatform(fn,options){if(!options.snapshot)throw Error('Read-only snapshot required');return globalThis.observabilityDatabase(fn);}");
const source=(await fs.readFile('lib/server/observability.ts','utf8')).replace("import 'server-only';",'').replace("'./db'",JSON.stringify(dbUrl)).replace("'./integrations'",JSON.stringify(integrations)).replace("'@/lib/permissions'",JSON.stringify(permissions)).replace("'./repositories/observability'",JSON.stringify(repository)).replace("'@/lib/observability/model'",JSON.stringify(modelUrl));
const {monitoringSnapshot}=await import(moduleUrl(source));
const db=new PGlite({extensions:{pgcrypto}});
try{
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const name of (await fs.readdir('database/migrations')).filter(n=>n.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+name,'utf8'));
 await db.query("select set_config('app.platform_operator','true',false)");
 const org='00000000-0000-4000-8000-000000000088',demo='00000000-0000-4000-8000-000000000099';
 await db.query("insert into organizations(id,name,slug,is_demo) values($1,'Synthetic monitoring','synthetic-monitoring',false)",[org]);
 await db.query("insert into organization_subscriptions(organization_id,plan,status,billing_interval,unit_amount_chf) values($1,'professional','active','yearly',1200)",[org]);
 await db.query("insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,status,created_by) values($1,'obs-failed','invoice','test','fixture@invalid.test','Test','Test','failed','fixture'),($2,'obs-demo','invoice','test','fixture@invalid.test','Test','Test','failed','fixture')",[org,demo]);
 await db.query("insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency) values($1,'manual','obs-payment',current_date,12.34,'CHF'),($1,'manual','obs-usd',current_date,9999,'EUR'),($2,'demo','obs-demo',current_date,9999,'CHF')",[org,demo]);
 await db.query("insert into web_vitals(metric,value,rating,route,created_at) values('LCP',1200,'good','/dashboard',now()),('LCP',1800,'good','/dashboard',now()),('INP',100,'good','/operator',now())");
 globalThis.observabilityDatabase=fn=>fn({query:(...args)=>db.query(...args)});
 const owner=await monitoringSnapshot('platform_owner');
 const find=(snapshot,id)=>snapshot.metrics.find(m=>m.id===id);
 assert.equal(find(owner,'mail_failed').value,1,'Demo queues excluded');
 assert.equal(find(owner,'payments').value,12.34,'CHF-only actual platform payments');
 assert.equal(find(owner,'vital_LCP').value,1800,'Nearest-rank p75 of two measured values');
 assert.ok(owner.series.find(s=>s.id==='LCP').points.length>0,'Real history');
 assert.equal(find(owner,'azure_cpu').dataState,'unavailable');
 assert.equal(owner.services.find(s=>s.key==='storage').state,'unknown','Configured is not healthy');
 assert.equal(owner.alarms.find(a=>a.id==='mail-failed').state,'critical');
 const customerRepository=await import(moduleUrl((await fs.readFile('lib/server/repositories/operator-customer-overview.ts','utf8')).replace("import 'server-only';",'').replace("'@/lib/permissions'",JSON.stringify(permissions))));
 await db.query("insert into support_cases(case_number,organization_id,created_by_user_id,category,subject,status) values('OBS-open',$1,'fixture','technical','Synthetic ticket','waiting_for_customer'),('OBS-closed',$1,'fixture','technical','Synthetic closed','resolved')",[org]);
 await db.query("insert into organization_restrictions(organization_id,scope,reason,note,starts_at,ends_at,created_by_user_id) values($1,'write','Synthetic','Fixture',now()-interval '1 hour',now()+interval '1 hour','fixture'),($1,'write','Expired','Fixture',now()-interval '2 hours',now()-interval '1 hour','fixture'),($1,'write','Future','Fixture',now()+interval '1 hour',now()+interval '2 hours','fixture')",[org]);
 const customer=await customerRepository.operatorCustomerReadings({query:(...args)=>db.query(...args)},{role:'platform_owner'},org);
 assert.equal(Number(customer.payments_total),12.34);assert.equal(Number(customer.monthly_contract_value),100);assert.equal(customer.open_tickets,1);assert.equal(customer.active_restrictions.length,1,'Only currently effective restriction');
 const customerSupport=await customerRepository.operatorCustomerReadings({query:(...args)=>db.query(...args)},{role:'platform_support'},org);assert.equal(customerSupport.payments_total,null);assert.equal(customerSupport.active_restrictions,null);assert.equal(customerSupport.open_tickets,1);
 const support=await monitoringSnapshot('platform_support');
 for(const id of ['payments','subscriptions','past_due','billing_failed','audit_events']){assert.equal(find(support,id).value,null);assert.equal(find(support,id).dataState,'no_permission',id);}
 assert.ok(!JSON.stringify(owner).includes('fixture@invalid.test'),'No recipients or payloads');
 // The live document sender uses document_deliveries, not mail_outbox.
 // Preserve unknown outcomes and count only stale in-flight claims.
 for(const [index,status,age,tenant] of [
  [0,'not_attempted','1 minute',org],[1,'uncertain','1 minute',org],
  [2,'failed','1 minute',org],[3,'sending','6 minutes',org],
  [4,'sending','1 minute',org],[5,'sent','6 minutes',org],
  [6,'not_attempted','6 minutes',demo],[7,'uncertain','6 minutes',demo],
  [8,'sending','6 minutes',demo],
 ]){
  await db.query("select set_config('app.organization_id',$1,false)",[tenant]);
  await db.query("insert into document_deliveries(organization_id,kind,document_id,recipient,status,request_key,created_by_user_id,created_at) values($1,'invoice',gen_random_uuid(),'private-document@fixture.invalid',$2,$3,'fixture',now()-$4::interval)",[tenant,status,'obs-document-'+index,age]);
 }
 await db.query("select set_config('app.organization_id','',false),set_config('app.platform_operator','false',false)");
 assert.equal((await db.query('select count(*)::int n from document_deliveries')).rows[0].n,0,'No tenant/platform context cannot read dispatch history');
 await db.query("select set_config('app.organization_id',$1,false)",[org]);
 assert.equal((await db.query('select count(*)::int n from document_deliveries')).rows[0].n,6,'Tenant sees its own history only');
 assert.equal((await db.query('select count(*)::int n from document_deliveries where organization_id=$1',[demo])).rows[0].n,0,'Foreign delivery history remains hidden');
 await db.query("select set_config('app.organization_id','',false),set_config('app.platform_operator','true',false)");
 assert.equal((await db.query("update document_deliveries set status='sent' where request_key='obs-document-2' returning id")).rows.length,0,'Platform read scope cannot alter delivery outcomes');
 const documents=await monitoringSnapshot('platform_owner');
 assert.equal(find(documents,'mail_failed').value,2,'Both ledgers feed the existing failure alarm; demo document failures excluded');
 assert.equal(find(documents,'mail_uncertain').value,2,'Historical failed documents remain unknown, never definitely failed or delivered');
 assert.equal(find(documents,'mail_stuck').value,1,'Only document claims older than five minutes count');
 assert.equal(documents.alarms.find(a=>a.id==='mail-uncertain').state,'warning');
 assert.equal(documents.alarms.find(a=>a.id==='mail-stuck').state,'warning');
 assert.equal(find(documents,'mail_failed').source,'mail_outbox + document_deliveries');
 assert.ok(!JSON.stringify(documents).includes('private-document@fixture.invalid'),'Document recipients remain private');
 assert.equal((await db.query("select status from document_deliveries where request_key='obs-document-2'")).rows[0].status,'failed','Monitoring never changes a delivery state');
 const supportDocuments=await monitoringSnapshot('platform_support');
 assert.equal(find(supportDocuments,'mail_uncertain').value,2,'Existing permitted aggregate remains visible');
 assert.equal(find(supportDocuments,'billing_failed').dataState,'no_permission');
 await db.query("select set_config('app.organization_id',$1,false)",[org]);
 await db.query("insert into document_deliveries(organization_id,kind,document_id,recipient,status,request_key,created_by_user_id,created_at,completed_at,purpose,reminder_stage,balance_amount,payment_deadline) select organization_id,kind,document_id,recipient,'sent','obs-document-other-purpose','fixture',now(),now(),'reminder',1,100,current_date+10 from document_deliveries where request_key='obs-document-0'");
 assert.equal(find(await monitoringSnapshot('platform_owner'),'mail_failed').value,2,'Another dispatch purpose cannot hide the failed document attempt');
 await db.query("insert into document_deliveries(organization_id,kind,document_id,recipient,status,request_key,created_by_user_id,created_at,completed_at,purpose) select organization_id,kind,document_id,recipient,'sent','obs-document-recovery','fixture',now(),now(),purpose from document_deliveries where request_key='obs-document-0'");
 assert.equal(find(await monitoringSnapshot('platform_owner'),'mail_failed').value,1,'Later confirmed same-document/recipient/purpose acceptance resolves the definitely unattempted alert without rewriting history');
 for(const tenant of [org,demo]){
  await db.query("select set_config('app.organization_id',$1,false)",[tenant]);
  await db.query("delete from document_deliveries where request_key like 'obs-document-%'");
 }
 await db.query("select set_config('app.organization_id','',false)");
 await db.query("update mail_outbox set status='accepted' where deduplication_key='obs-failed'");
 assert.equal((await monitoringSnapshot('platform_owner')).alarms.find(a=>a.id==='mail-failed').state,'healthy','Recovery only after new measurement');
 globalThis.observabilityDatabase=()=>{throw Error('Synthetic database unavailable with secret');};
 const outage=await monitoringSnapshot('platform_owner');
 assert.equal(find(outage,'customers').value,null);assert.equal(outage.services.find(s=>s.key==='database').state,'critical');assert.equal(outage.alarms.find(a=>a.id==='mail-failed').state,'unknown');assert.ok(!JSON.stringify(outage).includes('secret'));
 // Real migrated subscription prices: normalize yearly amounts without touching records.
 const monthly=(await db.query("select unit_amount_chf/case when billing_interval='yearly' then 12 else 1 end monthly from organization_subscriptions where organization_id=$1",[org])).rows[0];assert.equal(Number(monthly.monthly),100);
}finally{delete globalThis.observabilityDatabase;await db.close();}
console.log('Observability: migrated SQL, demo/currency isolation, role masking, genuine history, missing/stale/future data, boundaries, deduplication, recovery and database outage passed.');
