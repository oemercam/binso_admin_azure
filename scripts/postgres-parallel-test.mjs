import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
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
 for(const name of (await fs.readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort()){
  const c=await pool.connect();try{await c.query('begin');await c.query(await fs.readFile('database/migrations/'+name,'utf8'));await c.query('commit');}catch(error){await c.query('rollback');throw error;}finally{c.release();}
 }
 globalThis.__binsoParallelPool=pool;
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const permissions=moduleUrl(await fs.readFile('lib/permissions.ts','utf8'));
 const audit=moduleUrl((await fs.readFile('lib/server/audit.ts','utf8')).replace('import "server-only";',''));
 const qr=moduleUrl((await fs.readFile('lib/qr-bill.ts','utf8')).replace('"swissqrbill/utils"',JSON.stringify(new URL('../node_modules/swissqrbill/lib/esm/shared/utils.js',import.meta.url).href)));
 const replay=moduleUrl((await fs.readFile('lib/server/business-idempotency.ts','utf8')).replace("import 'server-only';",'').replace("'./http'",JSON.stringify(http)));
 const compile=async(path,replacements)=>{let source=(await fs.readFile(path,'utf8')).replace('import "server-only";','');for(const [name,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(name),JSON.stringify(value));return moduleUrl(source);};
 const business=await import(await compile('lib/server/repositories/business-api.ts',{'../business-idempotency':replay,'@/lib/financial-status':financialModuleUrl,'../http':http,'../audit':audit,'@/lib/permissions':permissions,'@/lib/qr-bill':qr}));
 const plans=moduleUrl(await fs.readFile('config/plan-access.ts','utf8'));
 const scopedDb=moduleUrl('export async function query(sql,args){return globalThis.__binsoParallelPool.query(sql,args)} export async function withTenant(org,user,fn){const c=await globalThis.__binsoParallelPool.connect();try{await c.query("begin");await c.query("select set_config(\'app.organization_id\',$1,true)",[org]);const value=await fn(c);await c.query("commit");return value}catch(e){await c.query("rollback");throw e}finally{c.release()}}');
 const rbac=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissions});
 const process=await import(await compile('lib/server/document-process.ts',{'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':await compile('lib/server/plan-access.ts',{'@/lib/server/db':scopedDb,'@/config/plan-access':plans}),'./http':http,'./rbac':rbac,'./audit':audit}));
 const organizationId='00000000-0000-4000-8000-000000000099';
 await pool.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional',status='active'",[organizationId]);
 const session={organizationId,userId:'demo-readonly',name:'Concurrency fixture',role:'owner'};
 const customer=(await pool.query('select id from customers where organization_id=$1 and archived_at is null order by id limit 1',[organizationId])).rows[0];assert.ok(customer);
 const txn=async fn=>{const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[organizationId,session.userId]);const result=await fn(c);await c.query('commit');return result;}catch(error){await c.query('rollback');throw error;}finally{c.release();}};
 const args={p_kind:'invoice',p_customer_id:customer.id,p_date:'2026-10-09',p_due_date:'2026-11-09',p_currency:'CHF',p_vat_rate:0,p_items:[{description:'Synthetic concurrency work',quantity:1,unit_price:2561.97,vat_rate:0}],p_note:'Isolated test'};
 // Ten transactions use distinct physical clients and contend on the same counter.
 const ids=(await Promise.all(Array.from({length:10},(_,i)=>txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',{...args,p_idempotency_key:'parallel-number-'+i})))));
 assert.equal(new Set(ids.map(row=>row.number)).size,10);assert.equal(new Set(ids.map(row=>row.id)).size,10);
 const replayArgs={...args,p_idempotency_key:'parallel-document-replay'};
 const replays=await Promise.all(Array.from({length:6},()=>txn(c=>business.mutateApiBusiness(c,session,'create_document_atomic',replayArgs))));assert.equal(new Set(replays.map(row=>row.id)).size,1);
 const invoice=ids[0];await txn(c=>process.changeDocumentStatus(c,session,invoice.number,'issue',''));
 const payment={p_invoice_id:invoice.id,p_paid_on:'2026-10-09',p_amount:1000,p_method:'bank',p_note:'Isolated payment',p_idempotency_key:'parallel-payment-replay'};
 const payments=await Promise.all(Array.from({length:6},()=>txn(c=>business.mutateApiBusiness(c,session,'create_payment_idempotent',payment))));assert.equal(new Set(payments.map(row=>row.id)).size,1);
 let saved=(await pool.query('select total_amount,paid_amount,status from invoices where id=$1',[invoice.id])).rows[0];assert.equal(Number(saved.paid_amount),1000);assert.equal(saved.status,'partial');
 // Both requests see the same initial balance; row locking allows exactly one.
 const competing=await Promise.allSettled([0,1].map(i=>txn(c=>business.mutateApiBusiness(c,session,'create_payment_idempotent',{...payment,p_amount:1561.97,p_idempotency_key:'parallel-complete-'+i}))));
 assert.equal(competing.filter(result=>result.status==='fulfilled').length,1);assert.equal(competing.filter(result=>result.status==='rejected'&&result.reason.code==='payment_exceeds_balance').length,1);
 saved=(await pool.query('select total_amount,paid_amount,status from invoices where id=$1',[invoice.id])).rows[0];assert.equal(Number(saved.paid_amount),2561.97);assert.equal(saved.status,'paid');
 assert.equal((await pool.query('select count(*)::int n from payments where invoice_id=$1',[invoice.id])).rows[0].n,2);
 console.log('Real PostgreSQL: ten parallel numbers, concurrent document/payment replay and competing final payments passed across independent connections. Synthetic disposable database only.');
}finally{delete globalThis.__binsoParallelPool;await pool.end();}
