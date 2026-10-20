import {planCatalogModuleUrl,planAccessModuleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import pg from 'pg';
import {moduleUrl,financialModuleUrl} from './data-test-modules.mjs';
// Deliberately accept only this disposable localhost test database. No DATABASE_URL
// fallback, production credentials, schema reset or destructive cleanup is used.
const address=process.env.BINSO_DB_PARALLEL_TEST_URL;
if(!address)throw new Error('BINSO_DB_PARALLEL_TEST_URL is required for the isolated PostgreSQL concurrency gate');
const url=new URL(address);
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Concurrency test refuses any other database');
const pool=new pg.Pool({connectionString:address,max:16});
try{
 assert.equal((await pool.query("select count(*)::int n from information_schema.tables where table_schema='public'")).rows[0].n,0,'Requires an empty disposable test database; never resets an existing schema');
 await pool.query('create table schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())');
 for(const name of (await fs.readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort()){
  const c=await pool.connect();try{await c.query('begin');const sql=await fs.readFile('database/migrations/'+name,'utf8');await c.query(sql);await c.query('insert into schema_migrations(version,checksum) values($1,$2)',[name,createHash('sha256').update(sql).digest('hex')]);await c.query('commit');}catch(error){await c.query('rollback');throw error;}finally{c.release();}
 }
 globalThis.__binsoParallelPool=pool;
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const permissions=moduleUrl(await fs.readFile('lib/permissions.ts','utf8'));
 const audit=moduleUrl((await fs.readFile('lib/server/audit.ts','utf8')).replace('import "server-only";',''));
 const qr=moduleUrl((await fs.readFile('lib/qr-bill.ts','utf8')).replace('"swissqrbill/utils"',JSON.stringify(new URL('../node_modules/swissqrbill/lib/esm/shared/utils.js',import.meta.url).href)));
 const replay=moduleUrl((await fs.readFile('lib/server/business-idempotency.ts','utf8')).replace("import 'server-only';",'').replace("'./http'",JSON.stringify(http)));
 const compile=async(path,replacements)=>{let source=(await fs.readFile(path,'utf8')).replace('import "server-only";','').replace("import 'server-only';",'');for(const [name,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(name),JSON.stringify(value)).replaceAll("'"+name+"'",JSON.stringify(value));return moduleUrl(source);};
 const businessModule=await compile('lib/server/repositories/business-api.ts',{'../business-idempotency':replay,'@/lib/financial-status':financialModuleUrl,'../http':http,'../audit':audit,'@/lib/permissions':permissions,'@/lib/qr-bill':qr});const business=await import(businessModule);
 const plans=planAccessModuleUrl;
 const scopedDb=moduleUrl('export async function query(sql,args){return globalThis.__binsoParallelPool.query(sql,args)} export async function withTenant(org,user,fn){const c=await globalThis.__binsoParallelPool.connect();try{await c.query("begin");await c.query("select set_config(\'app.organization_id\',$1,true),set_config(\'app.user_id\',$2,true)",[org,user]);const value=await fn(c);await c.query("commit");return value}catch(e){await c.query("rollback");throw e}finally{c.release()}}');
 const planService=await compile('lib/server/plan-access.ts',{'@/lib/server/db':scopedDb,'@/config/plan-access':plans,'@/config/plans':planCatalogModuleUrl,'./http':http});
 const rbac=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissions});
 const process=await import(await compile('lib/server/document-process.ts',{'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':planService,'./http':http,'./rbac':rbac,'./audit':audit}));
 const organizationId='00000000-0000-4000-8000-000000000099';
 await pool.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional',status='active'",[organizationId]);
 const session={organizationId,userId:'v213-parallel-fixture',name:'Concurrency fixture',role:'owner'};
 await pool.query("insert into app_users(id,email,display_name,status) values($1,'parallel@fixture.invalid','Concurrency fixture','active')",[session.userId]);
 await pool.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'parallel@fixture.invalid','owner','active')",[organizationId,session.userId]);
 const customer=(await pool.query('select id from customers where organization_id=$1 and archived_at is null order by id limit 1',[organizationId])).rows[0];assert.ok(customer);
 const txn=async fn=>{const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[organizationId,session.userId]);const result=await fn(c);await c.query('commit');return result;}catch(error){await c.query('rollback');throw error;}finally{c.release();}};
 // Six physical clients retry the same customer request; the counter advances once.
 const customerRepository=await import(await compile('lib/server/repositories/customers.ts',{'@/lib/server/db':scopedDb,'@/lib/server/audit':audit,'@/lib/server/http':http,'../business-idempotency':replay,'./business-api':businessModule}));
 const customerCounter=async()=>Number((await pool.query("select next_value from business_document_counters where organization_id=$1 and kind='customer' and period=''",[organizationId])).rows[0]?.next_value??1);
 const beforeCustomers=await customerCounter();
 const sameCustomers=await Promise.all(Array.from({length:6},()=>customerRepository.createCustomer(organizationId,session.userId,{contactFirstName:"Synthetic",contactLastName:"Contact",name:'Synthetic parallel minimal customer'},'parallel-customer-replay')));
 assert.equal(new Set(sameCustomers.map(row=>row.id)).size,1);assert.equal(new Set(sameCustomers.map(row=>row.customer_no)).size,1);assert.equal(await customerCounter(),beforeCustomers+1);assert.equal((await pool.query('select count(*)::int n from customers where organization_id=$1 and name=$2',[organizationId,'Synthetic parallel minimal customer'])).rows[0].n,1);
 const distinctCustomers=await Promise.all(Array.from({length:10},(_,i)=>customerRepository.createCustomer(organizationId,session.userId,{contactFirstName:"Synthetic",contactLastName:"Contact",name:'Synthetic distinct customer '+i},'parallel-customer-number-'+i)));
 assert.equal(new Set(distinctCustomers.map(row=>row.id)).size,10);assert.equal(new Set(distinctCustomers.map(row=>row.customer_no)).size,10);assert.equal(await customerCounter(),beforeCustomers+11);
 const competingDuplicates=await Promise.allSettled(Array.from({length:4},(_,i)=>customerRepository.createCustomer(organizationId,session.userId,{contactFirstName:"Synthetic",contactLastName:"Contact",name:'Parallel duplicate '+i,uid:i%2?'CHE123456789':'CHE-123.456.789 MWST'},'parallel-duplicate-'+i)));
 assert.equal(competingDuplicates.filter(result=>result.status==='fulfilled').length,1,'Distinct request keys cannot bypass concurrent duplicate detection');
 assert.ok(competingDuplicates.filter(result=>result.status==='rejected').every(result=>result.reason.code==='customer_duplicate'));
 // Internal projects use the same transaction-bound replay owner after a lost reply.
 globalThis.__parallelProjectSession=session;
 const projectHttp=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}} export const assertSameOrigin=()=>{};export const cleanText=v=>typeof v==="string"?v:"";export const readJson=async r=>r.body;export const json=(data,status=200)=>({data,status});export const apiError=e=>{throw e}');
 const projectWorkspace=await compile('lib/server/repositories/project-workspace.ts',{'@/lib/permissions':permissions,'@/lib/server/http':projectHttp,'@/lib/server/rbac':rbac,'@/lib/server/audit':audit,'@/lib/projects':moduleUrl(await fs.readFile('lib/projects.ts','utf8'))});
 const projects=await import(await compile('app/api/projects/route.ts',{'@/lib/server/plan-access':planService,'@/lib/server/repositories/project-workspace':projectWorkspace,'@/lib/server/session':moduleUrl('export async function requireSession(){return globalThis.__parallelProjectSession}'),'@/lib/server/rbac':rbac,'@/lib/server/db':scopedDb,'@/lib/server/http':projectHttp,'@/lib/server/audit':audit,'@/lib/server/business-idempotency':replay,'@/lib/permissions':permissions}));
 const projectRequest={headers:new Headers({'idempotency-key':'parallel-internal-project-replay'}),body:{name:'Synthetic concurrent internal project'}};
 const projectReplays=await Promise.all(Array.from({length:6},()=>projects.POST(projectRequest)));assert.ok(projectReplays.every(result=>result.status===201));assert.equal(new Set(projectReplays.map(result=>result.data.item.id)).size,1);assert.equal((await pool.query('select count(*)::int n from projects where organization_id=$1 and name=$2',[organizationId,projectRequest.body.name])).rows[0].n,1);delete globalThis.__parallelProjectSession;

 globalThis.__parallelProjectSession=session;
 await pool.query("update organization_subscriptions set plan='starter' where organization_id=$1",[organizationId]);
 await pool.query("insert into projects(organization_id,external_id,name,status) select $1,'capacity-parallel-'||n,'Synthetic capacity '||n,'active' from generate_series(1,greatest(0,99-(select count(*)::int from projects where organization_id=$1 and archived_at is null))) n",[organizationId]);
 const atCapacity=await Promise.allSettled([0,1].map(index=>projects.POST({body:{name:'Last plan slot '+index}})));
 assert.equal(atCapacity.filter(result=>result.status==='fulfilled').length,1,'Only one independent transaction can take the final plan slot');
 assert.equal(atCapacity.filter(result=>result.status==='rejected'&&result.reason.code==='project_limit').length,1);
 assert.equal(Number((await pool.query('select count(*) n from projects where organization_id=$1 and archived_at is null',[organizationId])).rows[0].n),100);
 assert.equal((await projects.POST(projectRequest)).data.item.id,projectReplays[0].data.item.id,'Replay remains available at capacity');
 await pool.query("update organization_subscriptions set plan='professional' where organization_id=$1",[organizationId]);delete globalThis.__parallelProjectSession;
 console.log('Real PostgreSQL: six concurrent customer/project retries return one record; ten distinct customer creations allocate unique numbers with exact counter increments.');
 const args={p_kind:'invoice',p_customer_id:customer.id,p_issue_date:'2026-10-09',p_due_date:'2026-11-09',p_currency:'CHF',p_vat_rate:0,p_items:[{description:'Synthetic concurrency work',quantity:1,unit_price:2561.97,vat_rate:0}],p_note:'Isolated test'};
 // Ten transactions use distinct physical clients and contend on the same counter.
 const ids=(await Promise.all(Array.from({length:10},(_,i)=>txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_idempotency_key:'parallel-number-'+i})))));
 assert.equal(new Set(ids.map(row=>row.number)).size,10);assert.equal(new Set(ids.map(row=>row.id)).size,10);
 const replayArgs={...args,p_idempotency_key:'parallel-document-replay'};
 const replays=await Promise.all(Array.from({length:6},()=>txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',replayArgs))));assert.equal(new Set(replays.map(row=>row.id)).size,1);
 const offerRevisionModule=await compile('lib/server/offer-revisions.ts',{'./http':http,'./rbac':rbac,'./plan-access':planService,'./business-idempotency':replay,'./audit':audit,'./repositories/business-api':businessModule,'@/lib/financial-status':financialModuleUrl,'@/config/domain':moduleUrl(await fs.readFile('config/domain.ts','utf8'))});
 const {createOfferRevision}=await import(offerRevisionModule);
 const sourceOffer=await txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',{p_kind:'offer',p_customer_id:customer.id,p_number:'',p_issue_date:'2026-10-09',p_valid_until:'2099-12-31',p_currency:'CHF',p_vat_rate:8.1,p_note:'Parallel offer revision fixture',p_items:[{description:'Synthetic item',quantity:1,unit_price:100,vat_rate:8.1}],p_idempotency_key:'parallel-offer-source'}));
 await txn(c=>process.changeDocumentStatus(c,session,sourceOffer.number,'issue',''));
 const revisions=await Promise.allSettled(Array.from({length:4},(_,i)=>txn(c=>createOfferRevision(c,session,sourceOffer.number,'parallel-revision-'+i))));
 assert.equal(revisions.filter(result=>result.status==='fulfilled').length,1,'Concurrent distinct requests may create only one revision draft');
 assert.ok(revisions.filter(result=>result.status==='rejected').every(result=>result.reason.code==='revision_exists'));
 const invoice=ids[0];await txn(c=>process.changeDocumentStatus(c,session,invoice.number,'issue',''));
 const payment={p_invoice_id:invoice.id,p_paid_on:'2026-10-09',p_amount:1000,p_method:'bank',p_note:'Isolated payment',p_idempotency_key:'parallel-payment-replay'};
 const payments=await Promise.all(Array.from({length:6},()=>txn(c=>business.mutateApiBusiness(c,session,'create_payment_idempotent',payment))));assert.equal(new Set(payments.map(row=>row.id)).size,1);
 let saved=(await pool.query('select total_amount,paid_amount,status from invoices where id=$1',[invoice.id])).rows[0];assert.equal(Number(saved.paid_amount),1000);assert.equal(saved.status,'partial');
 // Both requests see the same initial balance; row locking allows exactly one.
 const competing=await Promise.allSettled([0,1].map(i=>txn(c=>business.mutateApiBusiness(c,session,'create_payment_idempotent',{...payment,p_amount:1561.97,p_idempotency_key:'parallel-complete-'+i}))));
 assert.equal(competing.filter(result=>result.status==='fulfilled').length,1);assert.equal(competing.filter(result=>result.status==='rejected'&&result.reason.code==='payment_exceeds_balance').length,1);
 saved=(await pool.query('select total_amount,paid_amount,status from invoices where id=$1',[invoice.id])).rows[0];assert.equal(Number(saved.paid_amount),2561.97);assert.equal(saved.status,'paid');
 assert.equal((await pool.query('select count(*)::int n from payments where invoice_id=$1',[invoice.id])).rows[0].n,2);
 // Two synthetic devices execute the real timer route over independent clients.
 globalThis.__parallelTimerSession={...session,email:'timer@fixture.invalid'};
 const timerHttp=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}} export const assertSameOrigin=()=>{};export const cleanText=v=>typeof v==="string"?v:"";export const readJson=async r=>r.body;export const json=data=>data;export const apiError=e=>{throw e}');
 const workforce=await compile('lib/server/workforce-access.ts',{'./http':timerHttp,'./rbac':rbac});
 const timer=await import(await compile('app/api/time-tracker/route.ts',{'@/lib/financial-status':financialModuleUrl,'@/lib/server/workforce-access':workforce,'@/lib/projects':moduleUrl(await fs.readFile('lib/projects.ts','utf8')),'@/lib/server/session':moduleUrl('export async function requireSession(){return globalThis.__parallelTimerSession}'),'@/lib/server/rbac':rbac,'@/lib/server/db':scopedDb,'@/lib/server/http':timerHttp}));
 const baseline=(await pool.query('select count(*)::int n from time_entries where organization_id=$1 and created_by_user_id=$2',[organizationId,session.userId])).rows[0].n;
 await Promise.all([0,1].map(()=>timer.POST({body:{action:'start',project:'Interne Planung',customerId:null,projectId:null}})));
 assert.equal((await pool.query('select count(*)::int n from active_time_trackers where organization_id=$1 and user_id=$2',[organizationId,session.userId])).rows[0].n,1,'Concurrent devices share exactly one timer');
 await pool.query("update active_time_trackers set active_since=now()-interval '75 seconds' where organization_id=$1 and user_id=$2",[organizationId,session.userId]);
 const finishes=await Promise.all([0,1].map(()=>timer.POST({body:{action:'finish'}})));assert.equal(finishes.filter(result=>result.item).length,1);
 assert.equal((await pool.query('select count(*)::int n from time_entries where organization_id=$1 and created_by_user_id=$2',[organizationId,session.userId])).rows[0].n,baseline+1,'Concurrent stop stores one time entry');assert.equal((await timer.GET()).tracker,null);delete globalThis.__parallelTimerSession;
 console.log('Real PostgreSQL: concurrent device timer start/stop yields one tracker and one time entry.');
 console.log('Real PostgreSQL: ten parallel numbers, concurrent document/payment replay and competing final payments passed across independent connections. Synthetic disposable database only.');
}finally{delete globalThis.__parallelProjectSession;delete globalThis.__binsoParallelPool;await pool.end();}