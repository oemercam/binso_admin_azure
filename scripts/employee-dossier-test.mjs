import {verifyMinuteAllocations} from './time-minute-allocation-contract.mjs';
import {verifyTimePriceSources} from './time-price-source-contract.mjs';
import {verifyExternalTimeContract} from './external-time-contract.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {verifySupplierContract} from './supplier-contract.mjs';
import {verifyExpensePaymentContract} from './expense-payment-contract.mjs';
import {verifySupplierBankContract} from './supplier-bank-contract.mjs';
import {verifyEmployeeIdentityContract} from './employee-identity-contract.mjs';
import {verifyInvitationContract} from './invitation-contract.mjs';
import {verifySupplierInvoiceContract} from './supplier-invoice-contract.mjs';
import {verifySupplierReceiptContract} from './supplier-receipt-contract.mjs';
import {verifyExternalResourceContract} from './external-resource-contract.mjs';
import {verifySensitiveAccessContract} from './sensitive-access-contract.mjs';
import {verifyWageDefinitionContract} from './wage-definition-contract.mjs';
import {verifyEmployeeFamilyContract} from './employee-family-contract.mjs';
import {verifyAbsenceContract} from './absence-contract.mjs';
import {verifyCommercialContract} from './commercial-contract-test.mjs';
import {verifyContractDocuments} from './contract-document-test.mjs';

// Execute the actual routes, repository, authorization, SQL and audit against
// migrated PostgreSQL/RLS. Replace only session/connection boundaries, never SQL.
const require=createRequire(import.meta.url),cache=new Map(),overrides=new Map();
function load(file){
 file=path.resolve(file);if(overrides.has(file))return overrides.get(file);if(cache.has(file))return cache.get(file);
 const exports={};cache.set(file,exports);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const resolve=name=>{
  if(name==='server-only')return {};
  const base=name.startsWith('@/')?path.resolve(name.slice(2)):name.startsWith('.')?path.resolve(path.dirname(file),name):null;
  if(!base)return require(name);
  const target=[base,base+'.ts',base+'.tsx',base+'/index.ts'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
  if(!target)throw Error('Unresolved employee test dependency: '+name);
  return /\.json$/.test(target)?JSON.parse(fs.readFileSync(target,'utf8')):load(target);
 };
 Function('require','exports',source)(resolve,exports);return exports;
}
const mock=(file,exports)=>overrides.set(path.resolve(file),exports),unavailable=()=>{throw Error('Unrelated platform operation must not be called');};
const db=new PGlite({extensions:{pgcrypto}}),org=randomUUID(),other=randomUUID();
// Match pg.PoolClient's result shape; PGlite names command counts affectedRows.
const client={query:async(...args)=>{const result=await db.query(...args);return {...result,rowCount:result.rows.length||result.affectedRows||0};}};
let session,auditFailure=false,tenantDepth=0;
const transaction=async(organizationId,userId,fn,options={})=>{
 // PGlite has one connection. Emulate a separate nested READ transaction's
 // tenant GUCs with a savepoint, then restore the caller's context. Never use
 // this to claim native multi-connection write/concurrency coverage.
 if(tenantDepth){
  const depth=tenantDepth++,savepoint='nested_tenant_'+depth;
  const prior=(await db.query("select current_setting('app.organization_id',true) org,current_setting('app.user_id',true) usr,current_setting('app.platform_operator',true) platform")).rows[0];
  await db.exec('savepoint '+savepoint);
  try{
   await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true),set_config('app.platform_operator','false',true)",[organizationId,userId]);
   const result=await fn({query:async(sql,...args)=>{if(!/^\s*select\b/i.test(sql))throw Error('Nested write requires native separate-connection coverage');return client.query(sql,...args);}});
   await db.exec('release savepoint '+savepoint);return result;
  }catch(error){await db.exec('rollback to savepoint '+savepoint);await db.exec('release savepoint '+savepoint);throw error;}
  finally{tenantDepth--;await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true),set_config('app.platform_operator',$3,true)",[prior.org??'',prior.usr??'',prior.platform??'false']);}
 }
 tenantDepth++;await db.exec(options.isolation==='repeatable read'?'begin isolation level repeatable read':'begin');try{
  await db.exec('set local role binso_runtime');
  await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true),set_config('app.platform_operator','false',true)",[organizationId,userId]);
  const result=await fn(client);await db.exec('commit');return result;
 }catch(error){await db.exec('rollback');throw error;}finally{tenantDepth--;}
};
let invitationPlatformEnabled=false;
const platformTransaction=async fn=>{
 if(!invitationPlatformEnabled)return unavailable();
 await db.exec('begin');try{
  await db.exec('set local role binso_runtime');
  await db.query("select set_config('app.organization_id','',true),set_config('app.user_id','',true),set_config('app.platform_operator','true',true)");
  const result=await fn(client);await db.exec('commit');return result;
 }catch(error){await db.exec('rollback');throw error;}
};
mock('lib/server/db.ts',{withTenant:transaction,withPlatform:platformTransaction});
mock('lib/server/session.ts',{requireSession:async()=>{if(!session)throw new Response('Unauthenticated',{status:401});return session;}});
mock('lib/server/operator/session.ts',{requireOperatorSession:unavailable});
mock('lib/server/operator/audit.ts',{platformAudit:unavailable});
mock('lib/server/repositories/operator-api.ts',{listOperatorBusiness:unavailable,insertOperatorBusiness:unavailable,updateOperatorBusiness:unavailable});
mock('lib/server/repositories/operator-customer-overview.ts',{operatorCustomerReadings:unavailable});
const realAudit=load('lib/server/audit.ts').audit;
mock('lib/server/audit.ts',{audit:async(...args)=>{await realAudit(...args);if(auditFailure)throw Error('Synthetic audit outage');}});
const routes=load('app/api/employees/route.ts'),detail=load('app/api/employees/[id]/route.ts');
const employment=load('app/api/employees/[id]/employment/route.ts'),employmentDetail=load('app/api/employees/[id]/employment/[periodId]/route.ts');
const {NextRequest}=require('next/server');
const input={firstName:'Synthetic',lastName:'Employee',email:'',jobTitle:'Consultant',workloadPercent:80,weeklyHours:33.6,vacationDays:25,entryDate:'2026-01-01',endDate:'2026-12-31',workLocation:'Bern'};
const request=(body,key=randomUUID(),method='POST')=>new NextRequest('https://employee.invalid/api/employees',{method,headers:{origin:'https://employee.invalid','content-type':'application/json','idempotency-key':key},body:JSON.stringify(body)});
const patch=(id,body)=>detail.PATCH(request(body,randomUUID(),'PATCH'),{params:Promise.resolve({id})});
const read=id=>detail.GET(new Request('https://employee.invalid/api/employees/'+id),{params:Promise.resolve({id})});
const act=(role,organizationId=org,extra={})=>session={organizationId,userId:'employee-dossier-'+role,role,moduleProfile:'standard',organizationStatus:'active',...extra};
try{
 await db.exec('create extension pgcrypto');
 const files=fs.readdirSync('database/migrations').filter(f=>f.endsWith('.sql')).sort();
 let baseline;
 for(const file of files){
  if(file==='0084_employee_basic_dossier.sql')baseline=(await db.query('select to_jsonb(e) item from employees e order by id')).rows;
  await db.exec(fs.readFileSync('database/migrations/'+file,'utf8'));
 }
 assert.deepEqual((await db.query("select to_jsonb(e)-'end_date'-'work_location' item from employees e order by id")).rows,baseline,'Migration preserves all existing employee values');
 await db.exec(fs.readFileSync('database/operations/provision-runtime-role.sql','utf8'));
 for(const id of [org,other]){
  await db.query("insert into organizations(id,name,slug) values($1,'Synthetic dossier',$2)",[id,'dossier-'+id]);
  await db.query("insert into organization_subscriptions(organization_id,plan,status,billing_interval,unit_amount_chf) values($1,'business','active','monthly',69)",[id]);
 }
 for(const role of ['owner','admin','hr','finance','project_manager','manager','member','reader']){
  const id='employee-dossier-'+role;
  await db.query("insert into app_users(id,email,display_name,status) values($1,$2,'Synthetic','active')",[id,id+'@example.invalid']);
  await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,$4,'active')",[org,id,id+'@example.invalid',role]);
 }
 const identityBefore=(await db.query('select count(*)::int n from app_users')).rows[0].n;
 act('owner');const key=randomUUID();
 const first=await routes.POST(request(input,key));assert.equal(first.status,201,await first.clone().text());
 const id=(await first.json()).item.id;
 const replay=await routes.POST(request(input,key));assert.equal(replay.status,201);assert.equal((await replay.json()).item.id,id);
 assert.equal((await routes.POST(request({...input,workLocation:'Basel'},key))).status,409,'Changed body cannot reuse a committed request key');
 const stored=(await transaction(org,session.userId,c=>c.query('select email,user_id,end_date::text,work_location from employees where id=$1',[id]))).rows[0];
 assert.deepEqual(stored,{email:null,user_id:null,end_date:'2026-12-31',work_location:'Bern'});
 assert.equal((await db.query('select count(*)::int n from app_users')).rows[0].n,identityBefore,'No implicit app account or invitation');
 const second=await routes.POST(request({...input,lastName:'Second'}));assert.equal(second.status,201,'Multiple employees may have no email');
 const periodInput={startsOn:'2026-01-01',endsOn:'2026-12-31',workloadPercent:80,weeklyHours:33.6,vacationDays:25,jobTitle:'Consultant',workLocation:'Bern'};
 const createPeriod=(body,key=randomUUID(),employeeId=id)=>employment.POST(request(body,key),{params:Promise.resolve({id:employeeId})});
 const periodKey=randomUUID(),periodResponse=await createPeriod(periodInput,periodKey);
 assert.equal(periodResponse.status,201,await periodResponse.clone().text());const period=(await periodResponse.json()).item;
 assert.equal((await (await createPeriod(periodInput,periodKey)).json()).item.id,period.id,'Employment retry returns the same revision');
 assert.equal((await createPeriod({...periodInput,startsOn:'2026-06-01'})).status,400,'Overlapping employment is rejected');
 assert.equal((await createPeriod({...periodInput,monthly_gross:1000})).status,400,'No payroll fields through employment API');
 assert.equal((await createPeriod({...periodInput,startsOn:'2027-01-01',endsOn:null})).status,201,'Reentry is a separate period');
 const revise=(body,key=randomUUID())=>employmentDetail.PATCH(request(body,key,'PATCH'),{params:Promise.resolve({id,periodId:period.period_id})});
 const changeKey=randomUUID(),change={...periodInput,workLocation:'Basel',expectedRevision:1};
 let changeResponse=await revise(change,changeKey);assert.equal(changeResponse.status,200,await changeResponse.clone().text());
 assert.equal((await changeResponse.json()).item.revision,2);
 assert.equal((await revise(change,changeKey)).status,200,'A lost revision response can be replayed');
 assert.equal((await revise({...change,workLocation:'Stale'})).status,409,'A stale editor cannot overwrite the next revision');
 let historyResponse=await employment.GET(new Request('https://employee.invalid/api/employees/'+id+'/employment'),{params:Promise.resolve({id})});
 const history=(await historyResponse.json()).items;assert.equal(history.length,3);assert.equal(history.find(p=>p.id===period.id).work_location,'Bern');assert.equal(history.find(p=>p.id===period.id).is_current,false);
 await assert.rejects(()=>transaction(org,session.userId,c=>c.query("update employee_employment_periods set work_location='Tampered' where id=$1",[period.id])),e=>e.code==='23514','Employment history cannot be edited in place');
 await assert.rejects(()=>transaction(org,session.userId,c=>c.query("insert into employee_employment_periods(organization_id,employee_id,starts_on,ends_on,workload_percent,weekly_hours,vacation_days,job_title,created_by_user_id) values($1,$2,'2026-05-01','2026-05-02',80,33.6,25,'Overlap',$3)",[org,id,session.userId])),e=>e.code==='23514','Database prevents overlap independently of the route');
 for(const role of ['finance','member','reader']){
  act(role);assert.equal((await createPeriod(periodInput)).status,403);
  assert.equal((await transaction(org,session.userId,c=>c.query('select id from employee_employment_periods where employee_id=$1',[id]))).rows.length,0,'Employment RLS rejects '+role);
 }
 act('owner');auditFailure=true;assert.equal((await revise({...periodInput,expectedRevision:2})).status,500);auditFailure=false;
 assert.equal((await transaction(org,session.userId,c=>c.query('select revision from employee_employment_periods where period_id=$1 and is_current',[period.period_id]))).rows[0].revision,2,'Audit outage rolls supersede and new revision back together');
 for(const extra of [{user_id:randomUUID()},{organization_id:other},{role:'owner'},{iban:'CH-synthetic'},{monthly_gross:1000},{birthDate:'2000-01-01'},{child_allowance:100}]){
  assert.equal((await routes.POST(request({...input,...extra}))).status,400);
  assert.equal((await patch(id,{...input,...extra})).status,400,'Reject unsupported/sensitive fields before any write');
 }
 for(const extra of [{email:'invalid'},{entryDate:'2026-02-30'},{endDate:'2026-02-30'},{endDate:'2025-12-31'},{workLocation:'x'.repeat(181)}])assert.equal((await patch(id,{...input,...extra})).status,400);
 const legacy={...input};delete legacy.endDate;delete legacy.workLocation;
 assert.equal((await patch(id,{...legacy,jobTitle:'Updated'})).status,200);
 let response=await read(id);assert.equal(response.status,200);let item=(await response.json()).item;
 assert.equal(item.end_date.slice(0,10),'2026-12-31');assert.equal(item.work_location,'Bern','Old editor omitting new fields preserves them');
 for(const field of ['user_id','iban','monthly_gross','ahv_number','child_allowance','internal_cost_rate'])assert.equal(Object.hasOwn(item,field),false,'No sensitive fields in general DTO: '+field);
 for(const role of ['owner','admin','hr']){act(role);assert.equal((await read(id)).status,200);assert.equal((await patch(id,input)).status,200);}
 for(const role of ['finance','project_manager','manager','member','reader']){act(role);assert.equal((await read(id)).status,403);assert.equal((await patch(id,input)).status,403);assert.equal((await routes.POST(request(input))).status,403);}
 act('owner',org,{organizationStatus:'read_only'});assert.equal((await patch(id,input)).status,403);
 act('member',org,{moduleProfile:'time_only'});assert.equal((await read(id)).status,403);
 act('owner');await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);
 assert.equal((await read(id)).status,403,'Start has no personnel entitlement');
 await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[org]);
 // A genuine second tenant and owner prove both API scoping and runtime RLS.
 const foreign='employee-dossier-foreign';
 await db.query("insert into app_users(id,email,display_name,status) values($1,'dossier-foreign@example.invalid','Synthetic','active')",[foreign]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'dossier-foreign@example.invalid','owner','active')",[other,foreign]);
 session={...session,organizationId:other,userId:foreign};
 assert.equal((await read(id)).status,404);assert.equal((await patch(id,input)).status,404);
 assert.equal((await transaction(other,foreign,c=>c.query('select id from employees where id=$1',[id]))).rows.length,0);
 assert.equal((await transaction(other,foreign,c=>c.query('select id from employee_employment_periods where employee_id=$1',[id]))).rows.length,0);
 assert.equal((await createPeriod(periodInput)).status,404,'Cross-tenant employment creation is rejected before mutation');
 assert.equal((await transaction('',foreign,c=>c.query('select id from employees where id=$1',[id]))).rows.length,0,'Contextless runtime cannot see employee');
 act('owner');
 await assert.rejects(()=>transaction(org,session.userId,c=>c.query("update employees set end_date='2000-01-01' where id=$1",[id])),e=>e.code==='23514','Database enforces dates independently of API');
 const before=(await transaction(org,session.userId,c=>c.query('select name,title,work_location from employees where id=$1',[id]))).rows;
 const auditBefore=(await db.query("select count(*)::int n from audit_events where organization_id=$1 and entity_type='employees'",[org])).rows[0].n;
 auditFailure=true;assert.equal((await patch(id,{...input,workLocation:'Rollback probe'})).status,500);auditFailure=false;
 assert.deepEqual((await transaction(org,session.userId,c=>c.query('select name,title,work_location from employees where id=$1',[id]))).rows,before,'Failed audit rolls employee changes back');
 assert.equal((await db.query("select count(*)::int n from audit_events where organization_id=$1 and entity_type='employees'",[org])).rows[0].n,auditBefore);
 const employeeCount=(await transaction(org,session.userId,c=>c.query('select count(*)::int n from employees'))).rows[0].n;
 auditFailure=true;assert.equal((await routes.POST(request({...input,lastName:'Rollback'}))).status,500);auditFailure=false;
 assert.equal((await transaction(org,session.userId,c=>c.query('select count(*)::int n from employees'))).rows[0].n,employeeCount,'Failed create audit rolls back employee and replay receipt');
 await verifySupplierContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifyExpensePaymentContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifySupplierBankContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifyEmployeeIdentityContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifySupplierInvoiceContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifySupplierReceiptContract({load,mock,db,transaction,org,other,act,request});
 await verifyExternalResourceContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifySensitiveAccessContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifyWageDefinitionContract({load,db,transaction,org,other,act,request,employeeId:id,setAuditFailure:value=>{auditFailure=value;}});
 await verifyEmployeeFamilyContract({load,db,transaction,org,other,act,request,employeeId:id,setAuditFailure:value=>{auditFailure=value;}});
 await verifyAbsenceContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifyCommercialContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 await verifyContractDocuments({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 const timePriceFixture=await verifyExternalTimeContract({load,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});
 const minuteFixture=await verifyTimePriceSources({load,db,transaction,org,other,act,request,fixture:timePriceFixture,setAuditFailure:value=>{auditFailure=value;}});
 await verifyMinuteAllocations({load,db,transaction,org,other,act,request,fixture:minuteFixture,setAuditFailure:value=>{auditFailure=value;}});
 invitationPlatformEnabled=true;
 try{await verifyInvitationContract({load,mock,db,transaction,org,other,act,request,setAuditFailure:value=>{auditFailure=value;}});}finally{invitationPlatformEnabled=false;}
 mock('lib/server/maintenance.ts',{maintenanceState:async()=>({enabled:false,endsAt:null})});
 const proxy=load('proxy.ts'),headers=await load('next.config.ts').default.headers();
 assert.ok(proxy.config.matcher.includes('/lieferanten/:path*'),'Supplier pages are in the actual proxy matcher');
 for(const pathname of ['/lieferanten','/lieferanten/neu','/lieferanten/supplier-one','/abwesenheiten','/einstellungen/abwesenheiten','/vertraege','/vertraege/contract-one']){
  const response=await proxy.proxy(new NextRequest('https://employee.invalid'+pathname));
  assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location')).pathname,'/login');
 }
 const supplierHeaders=headers.find(rule=>rule.source==='/lieferanten/:path*')?.headers;
 assert.ok(supplierHeaders?.some(header=>header.key==='Cache-Control'&&header.value.includes('no-store')));
 assert.ok(supplierHeaders?.some(header=>header.key==='X-Robots-Tag'&&header.value.includes('noindex')));
 for(const source of ['/abwesenheiten/:path*','/einstellungen/:path*','/vertraege/:path*']){const protectedHeaders=headers.find(rule=>rule.source===source)?.headers;assert.ok(protectedHeaders?.some(h=>h.key==='Cache-Control'&&h.value.includes('no-store')));assert.ok(protectedHeaders?.some(h=>h.key==='X-Robots-Tag'&&h.value.includes('noindex')));}
 session=null;assert.equal((await read(id)).status,401);
 console.log('Employee dossier: actual POST/PATCH/GET, optional email/account, persistence, replay/conflict, legacy field preservation, eight roles, plans, tenants/RLS, date constraints and atomic audit rollback passed.');
 console.log('Employment: separate reentry, immutable revisions, replay/stale conflict, database overlap protection, restricted RLS and supersede/audit rollback passed; no payroll or identity mutation.');
 console.log('Supplier pages: actual proxy matcher/anonymous redirect and private no-store/noindex headers passed.');
}finally{await db.close();}
