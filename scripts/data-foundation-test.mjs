import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {moduleUrl,moneyModuleUrl,financialModuleUrl} from './data-test-modules.mjs';
const money=await import(moneyModuleUrl),financial=await import(financialModuleUrl);
const periods=await import(moduleUrl((await fs.readFile('lib/finance-periods.ts','utf8')).replace('"./money"',JSON.stringify(moneyModuleUrl))));
assert.equal(money.moneyMinor('1.005'),101);assert.equal(money.moneyMinor('-1.005'),-101);assert.equal(money.sumMoney([0.1,0.2]),0.3);
assert.equal(financial.openAmount({total:'2561.97',paid_amount:'1000.00'}),1561.97);
assert.equal(financial.openAmount({total:'2561.97',paid_amount:'2561.97'}),0);
for(const value of ['NaN','Infinity','1e99'])assert.throws(()=>money.moneyMinor(value));
const db=new PGlite();
try{
 const lines=[{quantity:'1.11',unit_price:'0.05',vat_rate:'8.1'},{quantity:'2.25',unit_price:'12.95',vat_rate:'2.6'},{quantity:'0.335',unit_price:'1.005',vat_rate:'8.125'}];
 const actual=money.documentTotals(lines);
 const expected=(await db.query(`with lines(q,p,v) as (values ($1::numeric(12,2),$2::numeric(12,2),$3::numeric(5,2)),($4::numeric(12,2),$5::numeric(12,2),$6::numeric(5,2)),($7::numeric(12,2),$8::numeric(12,2),$9::numeric(5,2))) select round(sum(q*p),2) subtotal,round(sum(q*p*v/100),2) vat,round(sum(q*p),2)+round(sum(q*p*v/100),2) total from lines`,lines.flatMap(l=>[l.quantity,l.unit_price,l.vat_rate]))).rows[0];
 for(const key of ['subtotal','vat','total'])assert.equal(actual[key],Number(expected[key]),key+' matches actual PostgreSQL numeric and column precision');
}finally{await db.close();}
const data={payments:[{payment_date:'2026-10-01',amount:'0.10'},{payment_date:'2026-10-31',amount:'0.20'},{payment_date:'2026-11-01',amount:'500'}],expenses:[{expense_date:'2026-10-10',amount:'0.10'}],payroll:[],operatingCosts:[]};
const bounds=periods.financeWindow('month','','','2026-10-31');
assert.deepEqual(periods.financeMetrics(data,bounds),{income:0.3,expense:0.1,operating:0,staff:0,costs:0.1,result:0.2});
assert.equal(periods.buildFinanceMonths(data,bounds).items[0].income,0.3);
assert.equal(periods.buildFinanceMonths(data,bounds).items[0].result,0.2);
const platform=periods.platformFinanceInsights({payments:data.payments,subscriptions:[{created_at:'2026-10-01T00:00:00Z',monthly_revenue_chf:'2561.97'},{created_at:'2026-11-01T00:00:00Z',monthly_revenue_chf:'500'}],operatingCosts:[{cost_date:'2026-10-01',amount:'1000'}]},'month','2026-10-31');
assert.equal(platform.volume,0.3);assert.equal(platform.platformRevenue,2561.97);assert.equal(platform.costs,1000);assert.equal(platform.result,1561.97);assert.equal(platform.monthly[0].value,0.3);
assert.equal(periods.platformFinanceInsights({payments:[{payment_date:'2026-08-01',amount:1},{payment_date:'2026-10-31',amount:2},{payment_date:'2026-11-01',amount:4}]},'three','2026-10-31').volume,3,'Platform three months retain current-month semantics with exclusive next-month boundary');
assert.equal(periods.platformFinanceInsights({payments:[{payment_date:'2025-11-01',amount:1},{payment_date:'2026-10-31',amount:2},{payment_date:'2025-10-31',amount:4}]},'year','2026-10-31').volume,3,'12-month platform label retains rolling-year semantics');
const identities=await import(moduleUrl(await fs.readFile('lib/customer-identity.ts','utf8')));
const choices=identities.customerDirectory([{id:'one',name:'Same AG',city:'Bern'},{id:'two',name:'Same AG',city:'Zürich'}]);
assert.equal(Object.keys(choices).length,2,'Same-name customers cannot overwrite each other');assert.equal(identities.resolveCustomer({customer:'Same AG'},choices),undefined,'Ambiguous name alone cannot select a customer');assert.equal(identities.resolveCustomer({customer:'Old name',customerId:'two'},choices).id,'two','Rename retains the selected business ID');assert.equal(identities.resolveCustomer({customer:'Same AG',customerId:'archived'},choices),undefined,'Missing ID cannot silently select a different customer');

// Exercise the real transport, invalidation graph, cross-tab events and session fencing.
const original={fetch:globalThis.fetch,window:globalThis.window,document:globalThis.document,BroadcastChannel:globalThis.BroadcastChannel};
const listeners={},messages=[];let received;
globalThis.window={addEventListener:(name,fn)=>listeners[name]=fn,dispatchEvent(){},localStorage:{getItem:()=>null},location:{pathname:'/dashboard'}};
globalThis.document={addEventListener:(name,fn)=>listeners[name]=fn,querySelector:()=>null,visibilityState:'visible'};
globalThis.BroadcastChannel=class {set onmessage(fn){received=fn}postMessage(value){messages.push(value)}};
try{
 const draftUrl=moduleUrl(await fs.readFile('lib/client/process-draft.ts','utf8'));
 const listStateUrl=moduleUrl(await fs.readFile('lib/client/list-state.ts','utf8'));
 const listState=await import(listStateUrl);
 const eventsUrl=moduleUrl((await fs.readFile('lib/client/data-events.ts','utf8')).replace("'./process-draft'",JSON.stringify(draftUrl)).replace("'./list-state'",JSON.stringify(listStateUrl)));
 const events=await import(eventsUrl);
 const cacheUrl=moduleUrl((await fs.readFile('lib/client/session-cache.ts','utf8')).replace('"./data-events"',JSON.stringify(eventsUrl)));
 const backend=await import(moduleUrl((await fs.readFile('lib/client/backend.ts','utf8')).replace('import { useEffect, useState } from "react";','').replace('"./data-events"',JSON.stringify(eventsUrl)).replace('"./session-cache"',JSON.stringify(cacheUrl))));
 const paths=['/api/documents','/api/finance/overview','/api/customers/one/activity','/api/payments','/api/dashboard'];
 const before=events.dataRevision(paths),unrelated=events.dataRevision(['/api/support/tickets']);
 events.subscribeClientData(()=>{});
 globalThis.fetch=async()=>new Response(JSON.stringify({item:{id:'payment'}}));
 await backend.apiPost('/api/payments',{amount:1000},{idempotencyKey:'same-request-key'});
 assert.notEqual(events.dataRevision(paths),before);
 for(const path of paths)assert.notEqual(events.dataRevision([path]),'0:0',path+' invalidated after payment');
 assert.equal(events.dataRevision(['/api/support/tickets']),unrelated,'Payment does not reload unrelated support');
 assert.deepEqual(Object.keys(messages.at(-1)).sort(),['domains','type'],'No business payload or credential broadcast');
 const committed=events.dataRevision(paths);
 for(const response of [()=>new Response(JSON.stringify({error:'conflict',message:'Changed'}),{status:409}),()=>new Response('<html>unavailable</html>'),...[null,{}, {item:{}},{item:{id:''}}].map(payload=>()=>new Response(JSON.stringify(payload))),()=>{throw new Error('offline')}]){
  globalThis.fetch=async()=>response();await assert.rejects(()=>backend.apiPost('/api/payments',{}));assert.equal(events.dataRevision(paths),committed,'Failed mutation cannot broadcast success');
 }
 for(const payload of [null,{}, {item:{id:'document'}},{item:{id:'document',number:''}}]){
  globalThis.fetch=async()=>new Response(JSON.stringify(payload));await assert.rejects(()=>backend.apiPost('/api/documents',{}),error=>error.code==='invalid_response');assert.equal(events.dataRevision(paths),committed,'Incomplete document confirmation cannot broadcast success');
 }
 globalThis.fetch=async()=>new Response(JSON.stringify({item:{id:'document',number:'RE-2026-1'}}));await backend.apiPost('/api/documents',{});
 for(const path of ['/api/customers','/api/employees','/api/products','/api/projects','/api/expenses','/api/time-entries','/api/support/tickets','/api/files']){
  const beforeBusiness=events.dataRevision([path]);
  for(const payload of [null,{}, {ok:true},{item:{}},{item:{id:''}}]){
   globalThis.fetch=async()=>new Response(JSON.stringify(payload),{status:201});
   await assert.rejects(()=>backend.apiPost(path,{}),error=>error.code==='invalid_response',path+' requires persisted identity');
   assert.equal(events.dataRevision([path]),beforeBusiness,'Unconfirmed '+path+' cannot invalidate consumers');
  }
  globalThis.fetch=async()=>new Response(JSON.stringify({item:{id:'confirmed-business-record'}}),{status:201});
  await backend.apiPost(path,{});assert.notEqual(events.dataRevision([path]),beforeBusiness,path+' confirmed persistence invalidates consumers');
 }


 for(const path of ['/api/customers/customer-one','/api/employees/employee-one','/api/products/product-one','/api/expenses/expense-one']){
  const beforeEdit=events.dataRevision([path]);
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}));
  await assert.rejects(()=>backend.apiPatch(path,{}),error=>error.code==='invalid_response',path+' edit requires persisted identity');assert.equal(events.dataRevision([path]),beforeEdit);
  globalThis.fetch=async()=>new Response(JSON.stringify({item:{id:'confirmed-edit'}}));await backend.apiPatch(path,{});assert.notEqual(events.dataRevision([path]),beforeEdit);
  globalThis.fetch=async()=>new Response(JSON.stringify({ok:true}));await backend.apiDelete(path);
 }
 let reads=0,resolveRead;
 globalThis.fetch=()=>{reads++;return new Promise(resolve=>{resolveRead=resolve})};
 const a=backend.apiGet('/api/documents'),b=backend.apiGet('/api/documents');
 assert.equal(reads,1);resolveRead(new Response(JSON.stringify({items:[]})));await Promise.all([a,b]);
 const stale=backend.apiGet('/api/documents');listState.listStateStore.set('private-search','customer@example.invalid');events.resetClientData();assert.equal(listState.listStateStore.size,0,'Session changes purge in-memory search context');resolveRead(new Response(JSON.stringify({items:[{id:'old-tenant'}]})));
 await assert.rejects(stale,error=>error.code==='session_changed','Old tenant response rejected after logout');
 const cachedSession=await import(cacheUrl);
 globalThis.fetch=async()=>new Response(JSON.stringify({authenticated:true,tenant:{id:'one',role:'owner'}}));await cachedSession.readClientSession();
 received({data:{type:'session'}});assert.equal(cachedSession.cachedClientSession(),null,'Other-tab logout clears cached permissions');
 const oldRevision=events.dataRevision(['/api/documents']),sessionBeforeRefresh=events.dataRevision([]);listeners.online();assert.notEqual(events.dataRevision(['/api/documents']),oldRevision);assert.equal(events.dataRevision([]),sessionBeforeRefresh,'Online refresh is not a session change');
 await cachedSession.readClientSession();const sameIdentity=events.dataRevision([]);listeners.visibilitychange();await cachedSession.readClientSession();assert.equal(events.dataRevision([]),sameIdentity,'Visibility rechecks authentication without discarding the same tenant');
 globalThis.fetch=async()=>new Response(JSON.stringify({authenticated:true,tenant:{id:'two',role:'reader'}}));listeners.visibilitychange();await cachedSession.readClientSession();assert.notEqual(events.dataRevision([]),sameIdentity,'A real tenant/role change invalidates private query data');
 const beforeUserChange=events.dataRevision([]);globalThis.fetch=async()=>new Response(JSON.stringify({authenticated:true,user:{id:'another-person'},tenant:{id:'two',role:'reader'}}));listeners.visibilitychange();await cachedSession.readClientSession();assert.notEqual(events.dataRevision([]),beforeUserChange,'A different person in the same tenant invalidates private state');
 const previous=events.dataRevision(['/api/finance']);received({data:{type:'changed',domains:['finance']}});assert.notEqual(events.dataRevision(['/api/finance']),previous);
}finally{Object.assign(globalThis,original);}
const httpUrl=moduleUrl((await fs.readFile('lib/server/http.ts','utf8')).replace('"next/server"',JSON.stringify(moduleUrl('export const NextResponse={json:(data,init)=>new Response(JSON.stringify(data),init)}'))));
const http=await import(httpUrl);
for(const [code,status] of [['23505',409],['23503',409],['22P02',400],['40001',409],['57014',503]]){const result=http.apiError({code,message:'SECRET_DATABASE_ROW'});assert.equal(result.status,status);assert.ok(!(await result.text()).includes('SECRET'));}
for(const [status,meaning] of [[401,'not_authenticated'],[403,'forbidden'],[404,'not_found'],[409,'conflict'],[429,'rate_limited'],[503,'service_unavailable']]){const result=http.apiError(new Response('PRIVATE INTERNAL DETAIL',{status}));assert.equal((await result.json()).error,meaning);}
await assert.rejects(()=>http.readJson({headers:new Headers(),text:async()=>JSON.stringify({name:'ä'.repeat(10)})},20),e=>e.code==='request_too_large');
const fields=await import(moduleUrl((await fs.readFile('lib/server/validation.ts','utf8')).replace('import "server-only";','').replace('"./http"',JSON.stringify(httpUrl))));
for(const check of [()=>fields.asObject([]),()=>fields.stringField({},'name'),()=>fields.stringField({name:42},'name'),()=>fields.emailField({email:'bad'}),()=>fields.enumField({role:'operator'},'role',['member'])]){try{check();assert.fail('Invalid input was accepted');}catch(error){assert.ok(error instanceof http.ApiError);assert.equal(http.apiError(error).status,400);}}
const validation=await import(moduleUrl((await fs.readFile('lib/server/file-validation.ts','utf8')).replace("'./http'",JSON.stringify(httpUrl))));
validation.validateFileContent(Buffer.from('%PDF-1.7 fixture'),'application/pdf');
assert.throws(()=>validation.validateFileContent(Buffer.from('<script>bad</script>'),'application/pdf'),e=>e.code==='file_content_invalid');
assert.throws(()=>validation.validateFileContent(Buffer.from('%PDF-1.7'),'image/png'));
console.log('V21.3: decimal/PostgreSQL precision, partial/full balances, finance/calendar parity, targeted payment invalidation, read deduplication, mutation failures, old-session fencing, cross-tab logout/reconnect, safe API errors and file signatures passed.');
