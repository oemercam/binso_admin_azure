import {billingAgreementModuleUrl,billingModelModuleUrl} from './data-test-modules.mjs';
import {expensePaymentModuleUrl} from './data-test-modules.mjs';
import {planCatalogModuleUrl,planAccessModuleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import pg from 'pg';
import {acquireMigrationLock} from './migration-lock.mjs';
import {createAttestationPlan,applyAttestation,digest,legacyVersions} from './legacy-checksum-attestation.mjs';
import {checkMigrationVersions} from './schema-contract.mjs';
import {moduleUrl,financialModuleUrl,localeTestModuleUrl,documentAmountSqlModuleUrl} from './data-test-modules.mjs';
// Deliberately accept only this disposable localhost test database. No DATABASE_URL
// fallback, production credentials, schema reset or destructive cleanup is used.
const address=process.env.BINSO_DB_PARALLEL_TEST_URL;
if(!address)throw new Error('BINSO_DB_PARALLEL_TEST_URL is required for the isolated PostgreSQL concurrency gate');
const url=new URL(address);
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Concurrency test refuses any other database');
const pool=new pg.Pool({connectionString:address,max:16});
try{
 const unlock=await acquireMigrationLock(pool);
 const contender=await pool.connect();
 try{
  assert.equal((await contender.query("select pg_try_advisory_lock(hashtextextended($1,0)) as acquired",['binso:canonical:migrations'])).rows[0].acquired,false,'Concurrent migration process cannot enter while another runner owns the session lock');
  await unlock();
  assert.equal((await contender.query("select pg_try_advisory_lock(hashtextextended($1,0)) as acquired",['binso:canonical:migrations'])).rows[0].acquired,true,'Completion releases the lock for the next migration process');
  await contender.query("select pg_advisory_unlock(hashtextextended($1,0))",['binso:canonical:migrations']);
 }finally{contender.release();}
 assert.equal((await pool.query("select count(*)::int n from information_schema.tables where table_schema='public'")).rows[0].n,0,'Requires an empty disposable test database; never resets an existing schema');
 await pool.query('create table schema_migrations(version text primary key,checksum text not null,applied_at timestamptz not null default now())');
 for(const name of (await fs.readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort()){
  const c=await pool.connect();try{await c.query('begin');const sql=await fs.readFile('database/migrations/'+name,'utf8');await c.query(sql);await c.query('insert into schema_migrations(version,checksum) values($1,$2)',[name,createHash('sha256').update(sql).digest('hex')]);await c.query('commit');}catch(error){await c.query('rollback');throw error;}finally{c.release();}
 }
 // Exercise the real PostgreSQL transaction/lock semantics on this disposable
 // localhost fixture, before running the existing business concurrency matrix.
 await pool.query('alter table schema_migrations alter column checksum drop not null');
 await pool.query('update schema_migrations set checksum=null where version=any($1::text[])',[legacyVersions]);
 const releaseAttestationLock=await acquireMigrationLock(pool),attestationClient=await pool.connect();
 try{
  // Only adapt the production database-name identity in this localhost fixture;
  // every lock, query, update, rollback and checksum check uses real PostgreSQL.
  const fixtureClient={query:(sql,args)=>sql==='select current_database() as database,current_user as actor'?Promise.resolve({rows:[{database:'binso_platform',actor:'binso_test'}]}):attestationClient.query(sql,args)};
  const sourceSha='a'.repeat(40),plan=await createAttestationPlan(fixtureClient,sourceSha);
  await assert.rejects(applyAttestation(fixtureClient,sourceSha,'0'.repeat(64)),/Reviewed plan changed/);
  assert.equal((await pool.query('select count(*)::int n from schema_migrations where checksum is null')).rows[0].n,16,'Rejected native plan makes no partial changes');
  const receipt=await applyAttestation(fixtureClient,sourceSha,digest(plan));assert.equal(receipt.updatedVersions.length,16);
  await checkMigrationVersions((await pool.query('select * from schema_migrations')).rows,{checksums:true});
 }finally{attestationClient.release();await releaseAttestationLock();}
 await pool.query('alter table schema_migrations alter column checksum set not null');
 globalThis.__binsoParallelPool=pool;
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const permissions=moduleUrl(await fs.readFile('lib/permissions.ts','utf8'));
 const audit=moduleUrl((await fs.readFile('lib/server/audit.ts','utf8')).replace('import "server-only";',''));
 const qr=moduleUrl((await fs.readFile('lib/qr-bill.ts','utf8')).replace('"swissqrbill/utils"',JSON.stringify(new URL('../node_modules/swissqrbill/lib/esm/shared/utils.js',import.meta.url).href)));
 const replay=moduleUrl((await fs.readFile('lib/server/business-idempotency.ts','utf8')).replace("import 'server-only';",'').replace("'./http'",JSON.stringify(http)));
 const compile=async(path,replacements)=>{let source=(await fs.readFile(path,'utf8')).replace('import "server-only";','').replace("import 'server-only';",'');for(const [name,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(name),JSON.stringify(value)).replaceAll("'"+name+"'",JSON.stringify(value));return moduleUrl(source);};
 const businessModule=await compile('lib/server/repositories/business-api.ts',{'../billing-agreements':billingAgreementModuleUrl,'./billing-agreements':billingAgreementModuleUrl,'@/lib/server/billing-agreements':billingAgreementModuleUrl,'@/lib/billing-model':billingModelModuleUrl,'@/lib/expense-payment':expensePaymentModuleUrl,'../document-amount-sql':documentAmountSqlModuleUrl,'../business-idempotency':replay,'@/lib/financial-status':financialModuleUrl,'../http':http,'../audit':audit,'@/lib/permissions':permissions,'@/lib/qr-bill':qr});const business=await import(businessModule);
 const plans=planAccessModuleUrl;
 const scopedDb=moduleUrl('export async function query(sql,args){return globalThis.__binsoParallelPool.query(sql,args)} export async function withTenant(org,user,fn){const c=await globalThis.__binsoParallelPool.connect();try{await c.query("begin");await c.query("select set_config(\'app.organization_id\',$1,true),set_config(\'app.user_id\',$2,true)",[org,user]);const value=await fn(c);await c.query("commit");return value}catch(e){await c.query("rollback");throw e}finally{c.release()}}');
 const planService=await compile('lib/server/plan-access.ts',{'@/lib/server/db':scopedDb,'@/config/plan-access':plans,'@/config/plans':planCatalogModuleUrl,'./http':http});
 const rbac=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissions});
 const pdfModule=await compile('lib/server/document-pdf.ts',{'@/lib/document-lines':moduleUrl(await fs.readFile('lib/document-lines.ts','utf8')),'@/lib/locales':await localeTestModuleUrl(),'pdfkit':import.meta.resolve('pdfkit'),'swissqrbill/pdf':import.meta.resolve('swissqrbill/pdf'),'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl});
 const versionsModule=await compile('lib/server/offer-versions.ts',{'./billing-agreements':billingAgreementModuleUrl,'./http':http,'./repositories/business-api':businessModule,'./document-pdf':pdfModule,'./document-logo':moduleUrl('export async function documentLogo(){return undefined}')});
 const process=await import(await compile('lib/server/document-process.ts',{'./offer-versions':versionsModule,'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':planService,'./http':http,'./rbac':rbac,'./audit':audit}));
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
 const mergeDto=moduleUrl(await fs.readFile('lib/customer-merge.ts','utf8'));
 const mergeFresh=await compile('lib/server/fresh-authentication.ts',{'./db':scopedDb,'./http':http});
 const mergeCustomers=await compile('lib/server/repositories/customers.ts',{'@/lib/server/db':scopedDb,'@/lib/server/audit':audit,'@/lib/server/http':http,'../business-idempotency':replay,'./business-api':businessModule});
 const mergeService=await import(await compile('lib/server/repositories/customer-merge.ts',{'../db':scopedDb,'../http':http,'../rbac':rbac,'../audit':audit,'../fresh-authentication':mergeFresh,'../business-idempotency':replay,'./customers':mergeCustomers,'@/lib/permissions':permissions,'@/lib/customer-merge':mergeDto}));
 await (await import('./customer-merge-concurrency-contract.mjs')).verifyCustomerMergeConcurrency({pool,service:mergeService,session});
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
 const projectWorkspace=await compile('lib/server/repositories/project-workspace.ts',{'@/lib/permissions':permissions,'@/lib/server/http':projectHttp,'@/lib/server/rbac':rbac,'@/lib/server/audit':audit,'@/lib/projects':moduleUrl(await fs.readFile('lib/projects.ts','utf8')),'@/lib/financial-status':financialModuleUrl,'@/lib/server/document-amount-sql':documentAmountSqlModuleUrl});
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
 const offerRevisionModule=await compile('lib/server/offer-revisions.ts',{'./offer-versions':versionsModule,'./http':http,'./rbac':rbac,'./plan-access':planService,'./business-idempotency':replay,'./audit':audit,'./repositories/business-api':businessModule,'@/lib/financial-status':financialModuleUrl,'@/config/domain':moduleUrl(await fs.readFile('config/domain.ts','utf8'))});
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
 // Exercise the same personal reminder contract on six physical connections.
 await pool.query('create role binso_followup_fixture nologin nosuperuser nocreatedb nocreaterole noinherit noreplication nobypassrls');
 await pool.query('grant usage on schema public to binso_followup_fixture');
 await pool.query('grant select,insert,update,delete on offer_followups,offer_versions,quotes,organization_subscriptions,notification_preferences,in_app_notifications,audit_events to binso_followup_fixture');
 // Existing INVOKER RLS resolvers read membership and workforce scope. Mirror
 // those read dependencies without granting writes or bypassing any policy.
 await pool.query('grant select on organization_memberships,employees,workforce_assignments to binso_followup_fixture');
 const followup=await import(await compile('lib/server/offer-followups.ts',{'./rbac':rbac,'./http':http,'./audit':audit,'@/lib/financial-status':financialModuleUrl,'@/lib/permissions':permissions,'@/config/plan-access':plans,'./plan-access':planService}));
 const followupTransaction=async(actor,fn)=>{const c=await pool.connect();try{await c.query('begin');await c.query('set local role binso_followup_fixture');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[actor.organizationId,actor.userId]);const result=await fn(c);await c.query('commit');return result;}catch(error){await c.query('rollback');throw error;}finally{c.release();}};
 try{await (await import('./offer-followup-contract.mjs')).verifyOfferFollowups({service:followup,sql:(...values)=>pool.query(...values),transaction:followupTransaction,session,today:(await import(financialModuleUrl)).businessDate(),parallel:true,createIssued:()=>txn(async c=>{const row=await business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_kind:'offer',p_number:'',p_valid_until:'2099-12-31',p_idempotency_key:randomUUID()});await process.changeDocumentStatus(c,session,row.number,'issue','');return row;})});}
 finally{await pool.query('revoke all on offer_followups,offer_versions,quotes,organization_subscriptions,notification_preferences,in_app_notifications,audit_events,organization_memberships,employees,workforce_assignments from binso_followup_fixture');await pool.query('revoke usage on schema public from binso_followup_fixture');await pool.query('drop role binso_followup_fixture');}
 // Copy the reviewed grants to a distinct disposable role. Migrations may have
 // already created binso_runtime; never overwrite or weaken that role's contract.
 await pool.query((await fs.readFile('database/operations/provision-runtime-role.sql','utf8')).replaceAll('binso_runtime','binso_receipt_fixture'));
 try{
 const ledgerTransaction=(actor,fn)=>txn(async c=>{await c.query('set local role binso_receipt_fixture');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[actor.organizationId,actor.userId]);return fn(c);});
 await (await import('./discount-contract.mjs')).verifyDiscountPersistence({business,financial:await import(financialModuleUrl),sql:(...values)=>pool.query(...values),transaction:ledgerTransaction,session,parallel:true,issue:(c,s,number)=>process.changeDocumentStatus(c,s,number,'issue','')});
 const refunds=await import(await compile('lib/server/credit-notes.ts',{'./document-process':await compile('lib/server/document-process.ts',{'./offer-versions':versionsModule,'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':planService,'./http':http,'./rbac':rbac,'./audit':audit}),'./business-idempotency':replay,'./rbac':rbac,'./plan-access':planService,'./http':http,'./audit':audit,'@/lib/financial-status':financialModuleUrl,'@/lib/money':(await import('./data-test-modules.mjs')).moneyModuleUrl}));
 const navigationModule=moduleUrl(await fs.readFile('lib/navigation.ts','utf8'));
 const setupModule=await compile('lib/action-readiness.ts',{'./navigation':navigationModule});
 const setupReadinessModule=await compile('lib/setup-readiness.ts',{'./qr-bill':qr,'./navigation':navigationModule,'./action-readiness':setupModule});
 const readiness=await import(await compile('lib/server/business-readiness.ts',{'./http':http,'./rbac':rbac,'./audit':audit,'./plan-access':planService,'@/lib/permissions':permissions,'@/config/plans':planCatalogModuleUrl,'@/config/plan-access':plans,'@/lib/qr-bill':qr,'@/lib/action-readiness':setupModule,'@/lib/setup-readiness':setupReadinessModule}));
 await (await import('./business-readiness-contract.mjs')).verifyBusinessReadiness({service:readiness,sql:(...values)=>pool.query(...values),transaction:ledgerTransaction,session,createDraft:()=>txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_number:'',p_idempotency_key:randomUUID()})),issue:(c,s,number)=>process.changeDocumentStatus(c,s,number,'issue','')});
 globalThis.__parallelOfferMails=[];globalThis.__publicMails=globalThis.__parallelOfferMails;
 const offerBackendPids=new Set();
 globalThis.__parallelOfferTransaction=fn=>txn(async c=>{await c.query('set local role binso_receipt_fixture');await c.query("select set_config('app.organization_id','',true),set_config('app.user_id','',true)");offerBackendPids.add((await c.query('select pg_backend_pid() pid')).rows[0].pid);const role=(await c.query('select current_user name,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0];assert.equal(role.name,'binso_receipt_fixture');assert.equal(role.rolsuper,false);assert.equal(role.rolbypassrls,false);return fn(c)});
 globalThis.__publicTransaction=globalThis.__parallelOfferTransaction;
 const offerDb=moduleUrl('export async function withTransaction(fn){return globalThis.__publicTransaction(fn)}');
 const offerEnv=moduleUrl('export const env={appEncryptionKey:"synthetic-parallel-response-key",appUrl:"https://fixture.invalid"}');
 const offerCrypto=await compile('lib/server/crypto.ts',{'@/lib/server/env':offerEnv});
 const offerMail=moduleUrl('export const mailLayout=(title,body)=>title+body;export async function sendMail(mail){globalThis.__parallelOfferMails.push(mail);await new Promise(resolve=>setTimeout(resolve,80));if(globalThis.__publicMailThrow)throw Error("Synthetic ambiguous result");return {delivered:globalThis.__publicMailAvailable!==false}}');
 const portal=await import(await compile('lib/server/public-offers.ts',{'./db':offerDb,'./http':http,'./crypto':offerCrypto,'./env':offerEnv,'./rbac':rbac,'./audit':audit,'./email':offerMail,'./mail-identity':await compile('lib/server/mail-identity.ts',{}),'@/lib/financial-status':financialModuleUrl,'@/lib/locales':await localeTestModuleUrl()}));
 const createOfferResponseLink=()=>ledgerTransaction(session,async c=>{const row=await business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_kind:'offer',p_number:'',p_valid_until:'2099-12-31',p_idempotency_key:randomUUID()});await process.changeDocumentStatus(c,session,row.number,'issue','');const quote=(await c.query('select * from quotes where organization_id=$1 and id=$2',[organizationId,row.id])).rows[0];const version=await (await import(versionsModule)).sealOfferVersion(c,session,quote);return portal.createOfferLink(c,session,version,'parallel-response@fixture.invalid')});
 const capability=await createOfferResponseLink();
 const token=new URL(capability.url).hash.slice(1);await portal.requestOfferCode(token,'accept');const code=globalThis.__parallelOfferMails.at(-1).text.match(/: (\d{6})\./)[1];const response={action:'accept',code,body:'',requestKey:randomUUID(),confirmed:true},mailCount=globalThis.__parallelOfferMails.length;
 offerBackendPids.clear();
 const attempts=await Promise.all(Array.from({length:6},()=>portal.respondToOffer(token,response)));
 assert.ok(offerBackendPids.size>=6,'At least six distinct PostgreSQL backend PIDs participated');
 assert.ok(attempts.every(item=>item.ok&&['recorded','already_recorded'].includes(item.confirmation)));
 assert.equal(Number((await pool.query("select count(*) n from offer_public_events where organization_id=$1 and link_id=$2 and kind='accepted'",[organizationId,capability.link.id])).rows[0].n),1);
 const deliveries=(await pool.query("select status,attempts from mail_outbox where organization_id=$1 and entity_id=$2 and kind='offer_confirmation'",[organizationId,capability.link.id+':'+response.requestKey])).rows;assert.equal(deliveries.length,1);assert.equal(deliveries[0].status,'accepted');assert.equal(deliveries[0].attempts,1);assert.equal(globalThis.__parallelOfferMails.length,mailCount+1,'Six physical connections produce one provider call');await portal.respondToOffer(token,response);assert.equal(globalThis.__parallelOfferMails.length,mailCount+1);
 await globalThis.__parallelOfferTransaction(async c=>{assert.equal((await c.query('select id from mail_outbox')).rows.length,0,'No context/capability means no outbox disclosure')});
 const recoveryCapability=await createOfferResponseLink();
 const responseContracts=await import('./offer-response-mail-contract.mjs');
 await responseContracts.verifyOfferResponseMail({portal,token:new URL(recoveryCapability.url).hash.slice(1),linkId:recoveryCapability.link.id,session,sql:(...values)=>pool.query(...values)});
 await responseContracts.verifyOfferDecisionSafety({portal,createLink:createOfferResponseLink,session,sql:(...values)=>pool.query(...values)});
 delete globalThis.__publicTransaction;delete globalThis.__publicMails;delete globalThis.__publicMailAvailable;delete globalThis.__publicMailThrow;
 delete globalThis.__parallelOfferMails;delete globalThis.__parallelOfferTransaction;
 console.log('Native offer response: six physical non-superuser/NOBYPASSRLS connections, one decision, durable job, single provider claim, replay and no-context mail isolation passed. Transport is isolated.');
 const ledgerMetrics=await import(await compile('lib/server/repositories/finance.ts',{}));
 await (await import('./invoice-status-contract.mjs')).verifyInvoiceStatuses({financial:await import(financialModuleUrl),expressions:await import(documentAmountSqlModuleUrl),query:(...values)=>pool.query(...values)});
 await (await import('./invoice-overpayment-contract.mjs')).verifyInvoiceOverpayments({business,refunds,financial:await import(financialModuleUrl),metrics:ledgerMetrics.financialMetricsData,cash:ledgerMetrics.cashStatisticsData,sql:(...values)=>pool.query(...values),transaction:ledgerTransaction,session,parallel:true,runtimeRole:'binso_receipt_fixture',createIssued:()=>txn(async c=>{const row=await business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_number:'',p_idempotency_key:randomUUID()});await process.changeDocumentStatus(c,session,row.number,'issue','');return row;})});
 }finally{await pool.query('revoke all privileges on all tables in schema public from binso_receipt_fixture');await pool.query('revoke all privileges on all sequences in schema public from binso_receipt_fixture');await pool.query('revoke all privileges on all functions in schema public from binso_receipt_fixture');await pool.query('revoke usage on schema public from binso_receipt_fixture');await pool.query('drop role binso_receipt_fixture');}
 console.log('Real PostgreSQL: ten parallel numbers, concurrent document/payment replay and competing final payments passed across independent connections. Synthetic disposable database only.');
}finally{delete globalThis.__parallelOfferMails;delete globalThis.__parallelOfferTransaction;delete globalThis.__parallelProjectSession;delete globalThis.__binsoParallelPool;await pool.end();}
