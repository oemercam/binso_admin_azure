import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
const db=new PGlite({extensions:{pgcrypto}});
const demo='00000000-0000-4000-8000-000000000099';
try{
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()){
  await db.exec('begin');
  try{await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));await db.exec('commit')}catch(e){await db.exec('rollback');throw new Error(file+': '+e.message)}
 }
 await db.exec('reset role');
 await db.exec(`create role tenant_probe; grant usage on schema public to tenant_probe; grant select,insert,update,delete on all tables in schema public to tenant_probe;`);
 await db.exec('set role tenant_probe');
 assert.equal((await db.query('select count(*)::int n from invoices')).rows[0].n,0);
 await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 assert.ok((await db.query('select count(*)::int n from invoices')).rows[0].n>20);
 assert.equal((await db.query("select count(*)::int n from operating_costs where scope='platform'")).rows[0].n,0);
 await db.query("select set_config('app.organization_id',$1,false)",['00000000-0000-4000-8000-000000000001']);
 assert.equal((await db.query('select count(*)::int n from invoices')).rows[0].n,0);
 await db.query("select set_config('app.platform_operator','true',false)");
 assert.equal((await db.query('select count(*)::int n from platform_billing_payments')).rows[0].n,22);
 assert.equal((await db.query("select count(*)::int n from operating_costs where scope='platform' and not is_demo")).rows[0].n,0);
 await db.exec('reset role');
 // Re-running the deterministic fixture cannot create duplicate customers/payments.
 const before=(await db.query('select count(*)::int n from payments')).rows[0].n;
 await db.exec('begin');await db.exec(await fs.readFile('database/migrations/0023_finance_and_demo_fixture.sql','utf8'));await db.exec('commit');
 assert.equal((await db.query('select count(*)::int n from payments')).rows[0].n,before);
 const dataModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText).toString('base64');
 const permissions=dataModule(await fs.readFile('lib/permissions.ts','utf8'));
 const audit=dataModule((await fs.readFile('lib/server/audit.ts','utf8')).replace('import "server-only";',''));
 const http=dataModule('export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const businessSource=(await fs.readFile('lib/server/repositories/business-api.ts','utf8')).replace('import "server-only";','').replace('"../http"',JSON.stringify(http)).replace('"../audit"',JSON.stringify(audit)).replace('"@/lib/permissions"',JSON.stringify(permissions));
 const {listApiBusiness,mutateApiBusiness}=await import(dataModule(businessSource));
 const client={query:async(...args)=>{const result=await db.query(...args);return {...result,rowCount:result.rows.length}}};
 const session={organizationId:demo,userId:'demo-readonly',role:'owner'};
 await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 for(const table of ['customers','customer_contacts','products','employees','expenses','documents','payments'])assert.ok((await listApiBusiness(client,session,table,'')).length>0,table+' must have readable canonical fixture data');
 assert.equal((await listApiBusiness(client,session,'documents','number=eq.RE-2026-019')).length,1);
 const documentArgs={p_kind:'invoice',p_customer_id:'10000000-0000-4000-8000-000000000001',p_number:'TEST-001',p_issue_date:'2026-10-04',p_due_date:'2026-11-04',p_vat_rate:8.1,p_currency:'CHF',p_note:'Test',p_items:[{description:'Consulting',quantity:2,unit_price:100}]};
 const document=await mutateApiBusiness(client,session,'create_document_atomic',documentArgs);
 assert.equal(Number(document.total),216.2);
 await db.query("update invoices set status='sent' where id=$1",[document.id]);
 const paymentArgs={p_invoice_id:document.id,p_paid_on:'2026-10-04',p_amount:216.2,p_method:'bank',p_note:'Test',p_idempotency_key:'test-payment-0001'};
 const payment=await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs);
 const retry=await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs);
 assert.equal(payment.id,retry.id);
 assert.equal((await db.query('select status from invoices where id=$1',[document.id])).rows[0].status,'paid');
 await assert.rejects(mutateApiBusiness(client,session,'create_payment_idempotent',{...paymentArgs,p_amount:2}),e=>e.status===409);
 await assert.rejects(db.query("insert into tasks(organization_id,external_id,title,project_id) values('00000000-0000-4000-8000-000000000001','cross-tenant','Blocked','30000000-0000-4000-8000-000000000001')"),e=>e.code==='23503');
 const {dashboardAnalytics}=await import(dataModule((await fs.readFile('lib/server/repositories/dashboard.ts','utf8')).replace("import 'server-only';",'')));
 const analytics=await dashboardAnalytics(client,demo);
 const october=analytics.analyticsInvoices.find(row=>new Date(row.issue_date).toISOString().startsWith('2026-10'));
 assert.ok(october&&Number(october.invoice_count)>=1&&Number(october.customer_count)>=1);
 assert.ok(analytics.analyticsPayments.length>12);
 console.log('PostgreSQL migrations, deterministic fixtures and tenant/platform RLS passed.');
}finally{await db.close()}
