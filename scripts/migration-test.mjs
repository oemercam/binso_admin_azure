import {planCatalogModuleUrl,planAccessModuleUrl} from './data-test-modules.mjs';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import {displayModuleUrl,localeTestModuleUrl} from "./data-test-modules.mjs";
import {randomUUID} from "node:crypto";
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { SwissQRBill } from 'swissqrbill/svg';
import { isQRReferenceValid } from 'swissqrbill/utils';
const db=new PGlite({extensions:{pgcrypto}});
const demo='00000000-0000-4000-8000-000000000099';
try{
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()){
  await db.exec('begin');
  try{
   const presentation=file==='0037_demo_document_presentation.sql';
   const probe='00000000-0000-4000-8000-000000000077';
   if(presentation)await db.query("insert into organizations(id,name,legal_name,slug,is_demo) values($1,'Binso Demo AG','Binso Demo AG','presentation-production-probe',false)",[probe]);
   if(presentation)await db.query("select set_config('app.organization_id',$1,true)",[demo]);
   const snapshotMigration=file==='0045_document_snapshots.sql';
   const snapshotBefore=snapshotMigration?(await db.query("select to_jsonb(i)-'issuer_snapshot'-'customer_snapshot'-'payment_snapshot'-'document_snapshot' data from invoices i order by id")).rows:null;
   const before=presentation?(await db.query('select id,organization_id,customer_id,subtotal,vat_amount,total_amount,paid_amount from invoices order by id')).rows:null;
   const customerTypeBefore=file==='0056_customer_type.sql'?(await db.query('select to_jsonb(c) data from customers c order by id')).rows:null;
   await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));
   if(customerTypeBefore){assert.deepEqual((await db.query("select to_jsonb(c)-'customer_type' data from customers c order by id")).rows,customerTypeBefore,'Customer classification migration must preserve every existing customer value');assert.ok((await db.query('select customer_type from customers')).rows.every(row=>row.customer_type===null),'Existing customers must not receive an invented classification');}
   if(snapshotMigration){
    assert.deepEqual((await db.query("select to_jsonb(i)-'issuer_snapshot'-'customer_snapshot'-'payment_snapshot'-'document_snapshot' data from invoices i order by id")).rows,snapshotBefore,'Snapshot migration must preserve every other persisted invoice field');
    assert.equal((await db.query("select count(*)::int n from invoices where not document_snapshot ? 'version'")).rows[0].n,0,'Legacy invoices are frozen with explicit provenance');
   }
   if(presentation){
    assert.deepEqual((await db.query('select id,organization_id,customer_id,subtotal,vat_amount,total_amount,paid_amount from invoices order by id')).rows,before,'Demo presentation migration must preserve IDs, links and financial amounts');
    assert.equal((await db.query('select name from organizations where id=$1',[probe])).rows[0].name,'Binso Demo AG','Non-demo organizations must remain untouched');
    assert.equal((await db.query('select legal_name from organizations where id=$1',[demo])).rows[0].legal_name,'Alpenblick Digital AG');
    assert.equal((await db.query("select count(*)::int n from invoices where organization_id=$1 and invoice_no like 'DEMO-%'",[demo])).rows[0].n,0);
    await db.query('delete from organizations where id=$1',[probe]);
   }
   await db.exec('commit')
  }catch(e){await db.exec('rollback');throw new Error(file+': '+e.message)}
 }
 await db.exec('reset role');
 await prepareHistoricalFixtureOwner(db);
 await db.query("select set_config('app.user_id','demo-readonly',false)");
 const demoProfiles=(await db.query("select c.id,c.city,c.address,c.email,(select count(*)::int from customer_contacts cc where cc.organization_id=c.organization_id and cc.customer_id=c.id and cc.is_primary and cc.archived_at is null) primary_contacts from customers c where c.organization_id=$1 and c.external_id in ('demo-customer-acme','demo-customer-alpin','demo-customer-nova')",[demo])).rows;
 assert.equal(demoProfiles.length,3);assert.ok(demoProfiles.every(c=>c.city&&c.address&&c.email&&!c.email.endsWith('example.invalid')&&c.primary_contacts===1),'Every canonical demo customer needs a plausible profile and one main contact');
 await db.exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 await db.exec('set role binso_runtime');
 await db.exec(await fs.readFile('scripts/sql/runtime-role-check.sql','utf8'));
 await assert.rejects(()=>db.query('select * from schema_migrations'),/permission denied|does not exist/);
 await assert.rejects(()=>db.exec('alter table invoices add column forbidden_runtime_ddl integer'),/owner/);
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
 const dataModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source.replaceAll("'@/config/plans'",JSON.stringify(planCatalogModuleUrl)).replaceAll('"@/config/plans"',JSON.stringify(planCatalogModuleUrl)),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
 const permissions=dataModule(await fs.readFile('lib/permissions.ts','utf8'));
 const audit=dataModule((await fs.readFile('lib/server/audit.ts','utf8')).replace('import "server-only";',''));
 const http=dataModule('export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const qrSource=(await fs.readFile('lib/qr-bill.ts','utf8')).replace('"swissqrbill/utils"',JSON.stringify(new URL('../node_modules/swissqrbill/lib/esm/shared/utils.js',import.meta.url).href));
 const qrModule=dataModule(qrSource);
 const moneyModule=dataModule(await fs.readFile("lib/money.ts","utf8"));
 const financialModule=dataModule((await fs.readFile("lib/financial-status.ts","utf8")).replace('"./money"',JSON.stringify(moneyModule)));
 const financeModule=dataModule((await fs.readFile('lib/server/repositories/finance.ts','utf8')).replace("import 'server-only';",''));
 const sharedSummaryModule=dataModule((await fs.readFile('lib/server/repositories/financial-summary.ts','utf8')).replace('import "server-only";','').replace("'@/lib/permissions'",JSON.stringify(permissions)).replace('"./finance"',JSON.stringify(financeModule)).replace('"@/lib/money"',JSON.stringify(moneyModule)));

 const idempotencyModule=dataModule((await fs.readFile('lib/server/business-idempotency.ts','utf8')).replace("import 'server-only';",'').replace("'./http'",JSON.stringify(http)));
 const businessSource=(await fs.readFile('lib/server/repositories/business-api.ts','utf8')).replace('import "server-only";','').replace('"../business-idempotency"',JSON.stringify(idempotencyModule)).replace('"../http"',JSON.stringify(http)).replace('"../audit"',JSON.stringify(audit)).replace('"@/lib/permissions"',JSON.stringify(permissions)).replace('"@/lib/qr-bill"',JSON.stringify(qrModule)).replace('"@/lib/financial-status"',JSON.stringify(financialModule));
 const businessModule=dataModule(businessSource);
 const {listApiBusiness,mutateApiBusiness:rawMutation}=await import(businessModule);
 const mutateApiBusiness=(c,s,operation,args)=>rawMutation(c,s,operation,{...args,p_idempotency_key:args.p_idempotency_key??randomUUID()});
 const client={query:async(...args)=>{const result=await db.query(...args);return {...result,rowCount:result.rows.length}}};
 {
 // Execute the dashboard's actual queries against the fully migrated schema.
 globalThis.operatorDashboardClient=client;
 const runtime=dataModule(`export async function requireOperatorSession(){return {role:'platform_owner'}}; export function authorizeOperator(){}; export async function withPlatform(fn){return fn(globalThis.operatorDashboardClient)}; export const json=Response.json; export function apiError(error){throw error}`);
 const dashboardSource=(await fs.readFile('app/api/operator/dashboard/route.ts','utf8')).replace("'@/lib/permissions'",JSON.stringify(permissions)).replace(/'@\/lib\/server\/(?:operator\/session|operator\/rbac|db|http)'/g,JSON.stringify(runtime));
 const {GET}=await import(dataModule(dashboardSource));
 await db.exec('begin');
 try{
 const organization=randomUUID();
 await db.query("insert into organizations(id,name,slug,is_demo) values($1,'Dashboard probe',$2,false)",[organization,'dashboard-'+organization]);
 const before=Number((await (await GET()).json()).stats.payments_30d);
 const contractBefore=Number((await (await GET()).json()).stats.monthly_contract_value);
 await db.query("insert into organization_subscriptions(organization_id,plan,status,billing_interval,unit_amount_chf) values($1,'professional','active','yearly',1200)",[organization]);
 await db.query(`insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount,currency) values
 ($1,'manual','dashboard-chf',current_date,123.45,'CHF'),
 ($1,'manual','dashboard-eur',current_date,500,'EUR'),
 ($1,'manual','dashboard-old',current_date-31,600,'CHF'),
 ($1,'manual','dashboard-30-excluded',current_date-30,650,'CHF'),
 ($1,'manual','dashboard-future',current_date+1,700,'CHF'),
 ($1,'demo','dashboard-demo-provider',current_date,800,'CHF'),
 ($2,'manual','dashboard-demo-organization',current_date,900,'CHF')`,[organization,demo]);
 const response=await GET();assert.equal(response.status,200);
 const dashboard=await response.json();
 assert.equal(Math.round((Number(dashboard.stats.payments_30d)-before)*100),12345,'Dashboard counts only recent non-demo CHF payments');
 assert.equal(Number(dashboard.stats.monthly_contract_value)-contractBefore,100,'Yearly subscription prices contribute one twelfth to the monthly contract value');
 assert.ok(Array.isArray(dashboard.tickets)&&Array.isArray(dashboard.incidents));
 }finally{await db.exec('rollback');delete globalThis.operatorDashboardClient;}
 console.log('Operator dashboard: migrated schema and real CHF payment isolation passed.');
 }
 const session={organizationId:demo,userId:'demo-readonly',role:'owner'};
 {
 const {cashStatisticsData}=await import(dataModule((await fs.readFile('lib/server/repositories/finance.ts','utf8')).replaceAll("import 'server-only';",'')));
 const cashBefore=await cashStatisticsData(client,demo);
 assert.equal(cashBefore.incomplete,true,'Legacy payroll/operating records cannot be relabelled as proven cash outflows');
 assert.equal(cashBefore.outflows.length,0,'Approved but not reimbursed expenses are not cash outflows');
 assert.ok(cashBefore.payments.length>0,'Actual matched payment dates populate income');
 const foreignCash=await cashStatisticsData(client,'00000000-0000-4000-8000-000000000001');
 assert.deepEqual({payments:foreignCash.payments,outflows:foreignCash.outflows,incomplete:foreignCash.incomplete},{payments:[],outflows:[],incomplete:false},'Cash queries do not leak a different tenant population');
 assert.deepEqual(foreignCash.financial.revenueEvents,[]);for(const key of ['paid','open','overdue','receivables','credit_balance'])assert.equal(Number(foreignCash.financial.snapshot[key]),0,'Invoice metrics cannot leak another tenant');
 const fixtureExpense=(await db.query("select id from expenses where organization_id=$1 and currency='CHF' and status in ('approved','posted') limit 1",[demo])).rows[0];
 if(fixtureExpense){await db.query("update expenses set reimbursed_at='2026-10-25T23:30:00Z' where id=$1",[fixtureExpense.id]);const reimbursed=await cashStatisticsData(client,demo);assert.ok(reimbursed.outflows.some(row=>row.payment_date==='2026-10-26'),'Reimbursement uses Europe/Zurich calendar day, not expense date or UTC date');await db.query('update expenses set reimbursed_at=null where id=$1',[fixtureExpense.id]);}
 const workspaceSource=(await fs.readFile('lib/server/repositories/customer-workspace.ts','utf8')).replace('import "server-only";','').replace('"@/lib/permissions"',JSON.stringify(permissions)).replace('"../http"',JSON.stringify(http)).replace('"./business-api"',JSON.stringify(dataModule(businessSource))).replace('"./financial-summary"',JSON.stringify(sharedSummaryModule)).replace('"./customer-activity"',JSON.stringify(dataModule((await fs.readFile('lib/server/repositories/customer-activity.ts','utf8')).replace('import "server-only";','').replace('"@/lib/display-format"',JSON.stringify(displayModuleUrl)).replace('"@/lib/permissions"',JSON.stringify(permissions)))));
 const {customerWorkspace}=await import(dataModule(workspaceSource));
 const statisticsCustomer=(await db.query('select id from customers where organization_id=$1 and archived_at is null order by id limit 1',[demo])).rows[0].id;
 const customerStatistics=await customerWorkspace(client,session,statisticsCustomer);
 assert.ok(customerStatistics.statistics!==null,'Owner can read customer statistics');
 const totals=(await db.query("select currency,sum(total_amount)::text total,count(*)::int n from invoices where organization_id=$1 and customer_id=$2 and archived_at is null and status not in ('draft','cancelled') group by currency",[demo,statisticsCustomer])).rows;
 for(const row of totals){const own=customerStatistics.statistics.filter(event=>event.currency===row.currency);assert.equal(own.reduce((sum,event)=>sum+Number(event.invoice_count),0),row.n);assert.equal(Math.round(own.reduce((sum,event)=>sum+Number(event.billed),0)*100),Math.round(Number(row.total)*100));}
 const limitedStatistics=await customerWorkspace(client,{...session,role:'member'},statisticsCustomer);
 assert.equal(limitedStatistics.statistics,null,'No finance aggregates exposed to a role without payment rights');
 console.log('V22 statistics: real cash dates, expense reimbursement day, currency-separated invoice totals and role/tenant isolation passed.');
 }

 await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 for(const table of ['customers','customer_contacts','products','employees','expenses','documents','payments'])assert.ok((await listApiBusiness(client,session,table,'')).length>0,table+' must have readable canonical fixture data');
 assert.equal((await listApiBusiness(client,session,'documents','number=eq.RE-2026-019')).length,1);
 const documentArgs={p_kind:'invoice',p_customer_id:'10000000-0000-4000-8000-000000000001',p_number:'TEST-001',p_issue_date:'2026-10-04',p_due_date:'2026-11-04',p_vat_rate:8.1,p_currency:'CHF',p_note:'Test',p_items:[{description:'Consulting',quantity:2,unit_price:100}]};
 const company=(await db.query('select * from organizations where id=$1',[demo])).rows[0];
 await db.query('update organizations set iban=null,qr_iban=null where id=$1',[demo]);
 await assert.rejects(()=>mutateApiBusiness(client,session,'create_document_atomic',documentArgs),e=>e.code==='invoice_payment_setup_required');
 await db.query('update organizations set iban=$2 where id=$1',[demo,company.iban]);
 const document=await mutateApiBusiness(client,session,'create_document_atomic',documentArgs);
 // Real trigger tests: template inheritance, explicit replacement, all write
 // paths, issue snapshots, later company changes and frozen historical texts.
 await db.query("update organizations set invoice_intro_text='Invoice original',invoice_footer_text='Invoice closing',quote_intro_text='Offer original',quote_footer_text='Offer closing' where id=$1",[demo]);
 const snapshotInvoice=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'SNAPSHOT-INVOICE',p_note:''});
 const snapshotOffer=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_number:'SNAPSHOT-OFFER',p_valid_until:'2026-11-04',p_note:''});
 assert.equal(snapshotInvoice.document_snapshot.intro,'Invoice original');assert.equal(snapshotInvoice.document_snapshot.closing,'Invoice closing');
 assert.equal(snapshotOffer.document_snapshot.intro,'Offer original');assert.equal(snapshotOffer.document_snapshot.closing,'Offer closing');
 await db.query("update invoices set note='Individual replacement' where id=$1",[snapshotInvoice.id]);
 assert.equal((await listApiBusiness(client,session,'documents','id=eq.'+snapshotInvoice.id))[0].document_snapshot.intro,'Individual replacement');
 await db.query("update invoices set note='' where id=$1",[snapshotInvoice.id]);
 await db.query("update organizations set invoice_intro_text='Invoice newer',invoice_footer_text='New closing',quote_intro_text='Offer newer' where id=$1",[demo]);
 await db.query("update invoices set status='sent' where id=$1",[snapshotInvoice.id]);await db.query("update quotes set status='sent' where id=$1",[snapshotOffer.id]);
 const frozenInvoice=(await listApiBusiness(client,session,'documents','id=eq.'+snapshotInvoice.id))[0];
 assert.equal(frozenInvoice.document_snapshot.intro,'Invoice original');assert.equal(frozenInvoice.document_snapshot.closing,'Invoice closing');assert.equal(frozenInvoice.payment_snapshot.iban,company.iban);
 await db.query("update invoices set document_snapshot='{\"intro\":\"tampered\"}',paid_amount=20 where id=$1",[snapshotInvoice.id]);
 assert.deepEqual((await listApiBusiness(client,session,'documents','id=eq.'+snapshotInvoice.id))[0].document_snapshot,frozenInvoice.document_snapshot,'Issued snapshots cannot be rewritten by a payment or alternate write');
 const newer=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_number:'SNAPSHOT-NEWER',p_valid_until:'2026-11-04',p_note:''});assert.equal(newer.document_snapshot.intro,'Offer newer');
 assert.equal((await listApiBusiness(client,session,'documents','id=eq.'+snapshotOffer.id))[0].document_snapshot.intro,'Offer original');
 await db.query('update organizations set invoice_intro_text=$2,invoice_footer_text=$3,quote_intro_text=$4,quote_footer_text=$5 where id=$1',[demo,company.invoice_intro_text,company.invoice_footer_text,company.quote_intro_text,company.quote_footer_text]);
 console.log('Document snapshots: creation defaults, individual replacement/reset, later template changes, invoice/offer issue and immutable payment/history passed.');
 assert.equal(document.issue_date,'2026-10-04');assert.equal(document.due_date,'2026-11-04');assert.equal(document.status,'draft');
 const {createQrBillData,validSwissIban}=await import(qrModule);
 assert.equal(validSwissIban('CH9300762011623852958'),false);
 const qrData=createQrBillData(company,{reference:document.qr_reference,number:document.number,total:Number(document.total),currency:document.currency});
 assert.equal(qrData.amount,216.2);assert.equal(qrData.creditor.account,company.iban);assert.equal(qrData.reference,undefined);
 const qrReference=createQrBillData({...company,qr_iban:'CH4431999123000889012'},{reference:document.qr_reference,number:document.number,total:Number(document.total)});
 assert.equal(isQRReferenceValid(qrReference.reference),true);assert.equal(qrReference.reference,document.qr_reference);
 assert.equal((await db.query('select qr_reference from invoices where id=$1',[document.id])).rows[0].qr_reference,qrReference.reference);
 const unsafeName={...qrData,creditor:{...qrData.creditor,name:'Test <img src=x onerror=alert(1)>'}};
 const svg=new SwissQRBill(unsafeName,{language:'DE'}).toString();assert.ok(svg.includes('&lt;img'));assert.ok(!svg.includes('<img'));

 assert.equal(Number(document.total),216.2);
 await db.query("update invoices set status='sent' where id=$1",[document.id]);
 const paymentArgs={p_invoice_id:document.id,p_paid_on:'2026-10-04',p_amount:216.2,p_method:'bank',p_note:'Test',p_idempotency_key:'test-payment-0001'};
 const payment=await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs);
 const retry=await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs);
 assert.equal(payment.id,retry.id);
 assert.equal((await db.query('select status from invoices where id=$1',[document.id])).rows[0].status,'paid');
 await assert.rejects(mutateApiBusiness(client,session,'create_payment_idempotent',{...paymentArgs,p_amount:2}),e=>e.status===409);
 await assert.rejects(db.query("insert into tasks(organization_id,external_id,title,project_id) values('00000000-0000-4000-8000-000000000001','cross-tenant','Blocked','30000000-0000-4000-8000-000000000001')"),e=>e.code==='23503');
 const paidList=await listApiBusiness(client,session,'documents','kind=eq.invoice&display_status=eq.paid&q='+encodeURIComponent(document.number)+'&order=total.desc&limit=1');
 assert.equal(paidList[0]?.id,document.id);assert.equal(Number(paidList[0]?.total_count),1,'Document status/search runs before pagination');
 const latePartial=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_due_date:'2000-01-01',p_idempotency_key:'late-partial-list-test'});
 await db.query("update invoices set paid_amount=1,status='partial' where id=$1",[latePartial.id]);
 for(const filter of ['open','overdue'])assert.equal((await listApiBusiness(client,session,'documents','display_status=eq.'+filter+'&q='+encodeURIComponent(latePartial.number)))[0]?.id,latePartial.id,'Derived '+filter+' filter includes late partial invoice');
 await db.query('update invoices set archived_at=now() where id=$1',[latePartial.id]);
 await assert.rejects(()=>listApiBusiness(client,session,'documents','display_status=eq.invalid'),e=>e.code==='invalid_filter');
 await assert.rejects(()=>listApiBusiness(client,session,'documents','order=total.desc;drop table invoices'),e=>e.code==='invalid_order');
 const dashboardModule=dataModule((await fs.readFile('lib/server/repositories/dashboard.ts','utf8')).replace("import 'server-only';",'').replace("'@/lib/permissions'",JSON.stringify(permissions)).replace("'./business-api'",JSON.stringify(businessModule)));
 const {dashboardAnalytics,dashboardAttention,dashboardWork}=await import(dashboardModule);
 const analytics=await dashboardAnalytics(client,demo);
 const october=analytics.analyticsInvoices.find(row=>new Date(row.issue_date).toISOString().startsWith('2026-10'));
 assert.ok(october&&Number(october.invoice_count)>=1&&Number(october.customer_count)>=1);
 assert.ok(analytics.analyticsPayments.length>12);
 assert.equal(analytics.customerCount,Number((await db.query('select count(*) count from customers where organization_id=$1 and archived_at is null',[demo])).rows[0].count),'Dashboard counts all current customers, independently of month invoices');

 // A full credit must not occupy an attention slot before the limit.
 await db.exec('begin');
 try{
  await db.query('update invoices set archived_at=now() where organization_id=$1',[demo]);
  const candidates=[];
  for(let index=0;index<6;index++){
   const item=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_due_date:'2000-01-01',p_idempotency_key:'dashboard-credit-'+index});
   await db.query("update invoices set status='sent',issue_date=(now() at time zone 'Europe/Zurich')::date-10,due_date=$2::date where id=$1",[item.id,'2000-01-0'+(index+1)]);
   if(index<5)await db.query("insert into credit_notes(organization_id,external_id,credit_no,invoice_id,customer_id,credit_date,amount,reason) select organization_id,$2,$2,id,customer_id,(now() at time zone 'Europe/Zurich')::date,total_amount,'Synthetic attention regression' from invoices where id=$1",[item.id,'DASH-CREDIT-'+index]);
   candidates.push(item);
  }
  const attention=await dashboardAttention(client,session);
  assert.deepEqual(attention.map(item=>item.id),[candidates[5].id],'Credits are settled BEFORE the five-item attention limit');
  assert.deepEqual(await dashboardAttention(client,{...session,role:'member'}),[],'A member cannot obtain invoice attention data');
  const memberWork=await dashboardWork(client,{...session,role:'member'});
  assert.equal(memberWork.timeReviews,null);assert.equal(memberWork.expenseReviews,null,'Own work never grants independent review rights');
 }finally{await db.exec('rollback')}
 const fixtureSource=(await fs.readFile('scripts/fixtures/business-data.ts','utf8')).replace('import "server-only";','').replace("'../../lib/server/http'",JSON.stringify(http));
 const {seedDatabaseDemo}=await import(dataModule(fixtureSource));
 const sandbox='00000000-0000-4000-8000-000000000098';
 await db.query("insert into organizations(id,name,slug,is_demo,status) values($1,'Synthetic sandbox','sandbox-test',true,'trial')",[sandbox]);
 await db.query("insert into app_users(id,email,display_name,status) values('sandbox-user','sandbox-user@example.invalid','Demo','active')");
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,'sandbox-user','sandbox-user@example.invalid','owner','active')",[sandbox]);
 await db.query("select set_config('app.organization_id',$1,false),set_config('app.user_id','sandbox-user',false)",[sandbox]);
 await seedDatabaseDemo(client,sandbox,'sandbox-user');
 const sandboxInvoices=await db.query('select id from invoices where organization_id=$1',[sandbox]);
 assert.ok(sandboxInvoices.rows.length>20);
 await seedDatabaseDemo(client,sandbox,'sandbox-user');
 assert.equal((await db.query('select count(*)::int n from invoices where organization_id=$1',[sandbox])).rows[0].n,sandboxInvoices.rows.length);
 const scenarioCount=(await db.query("select count(distinct date_trunc('month',issue_date))::int months,count(*)::int invoices from invoices where organization_id=$1 and external_id like 'v24-invoice-%'",[sandbox])).rows[0];
 assert.equal(scenarioCount.months,12);assert.equal(scenarioCount.invoices,36);
 const scenarioParity=(await db.query("select count(*)::int invalid from invoices i where i.organization_id=$1 and i.external_id like 'v24-invoice-%' and i.paid_amount<>coalesce((select sum(p.amount) from payments p where p.organization_id=i.organization_id and p.invoice_id=i.id),0)",[sandbox])).rows[0];assert.equal(scenarioParity.invalid,0,'Every paid/partial demo amount is backed by matching payments');
 const scenarioRefund=(await db.query("select amount from invoice_refunds where organization_id=$1 and external_id='v24-refund'",[sandbox])).rows;
 assert.equal(scenarioRefund.length,1);assert.equal(Number(scenarioRefund[0].amount),60,'Demo refund is deterministic and backed by its credit scenario');
 const negativeMonths=(await db.query(`with income as(select date_trunc('month',payment_date) as month_bucket,sum(amount) amount from payments where organization_id=$1 group by 1),outflow as(select date_trunc('month',reimbursed_at at time zone 'Europe/Zurich') as month_bucket,sum(quantity*unit_price) amount from expenses where organization_id=$1 and reimbursed_at is not null group by 1) select count(*)::int n from outflow o left join income i using(month_bucket) where o.amount>coalesce(i.amount,0)`,[sandbox])).rows[0];assert.ok(negativeMonths.n>=3,'Loss months remain negative even including the existing template income');
 assert.ok((await db.query("select count(*)::int n from customers where organization_id=$1 and status='inactive'",[sandbox])).rows[0].n>0);
 assert.equal((await db.query("select count(*)::int n from quotes where organization_id=$1 and external_id like 'v24-quote-%' and status in ('declined','expired')",[sandbox])).rows[0].n,2);
 await db.exec('begin');
 try{
  await db.exec('set local role binso_runtime');await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id','sandbox-user',true),set_config('app.platform_operator','false',true)",[sandbox]);
  await seedDatabaseDemo(client,sandbox,'sandbox-user');
  assert.equal((await db.query("select count(*)::int n from invoices where organization_id=$1 and external_id like 'v24-invoice-%'",[sandbox])).rows[0].n,36,'Repeat seeding under the restricted runtime role preserves scenario identity');
  assert.equal((await db.query('select count(*)::int n from invoices where organization_id<>$1',[sandbox])).rows[0].n,0,'Seed restores target tenant context and cannot expose other invoice populations');
 }finally{await db.exec('rollback')}
 await assert.rejects(()=>seedDatabaseDemo(client,'00000000-0000-4000-8000-000000000001','sandbox-user'),e=>e.code==='demo_target_invalid');
 await assert.rejects(()=>seedDatabaseDemo(client,demo,'sandbox-user'),e=>e.code==='demo_target_invalid');
 console.log('V24 demo: 12 months, exact payments, at least three negative cash months, declined/expired offers, inactive customer, idempotent restricted-role seed and non-demo/template denial passed.');

 await db.query("select set_config('app.organization_id',$1,false)",[sandbox]);
 const clonedSession={...session,organizationId:sandbox,userId:'sandbox-user'};
 const clonedCustomer=(await listApiBusiness(client,clonedSession,'customers',''))[0];
 assert.notEqual(clonedCustomer.id,'10000000-0000-4000-8000-000000000001');
 const {translateBusinessWrite}=await import(dataModule(businessSource));
 const employeeWrite=translateBusinessWrite('employees',{first_name:'Test',last_name:'Person',email:'employee-qa@example.invalid',start_date:'2026-10-08',weekly_hours:37.5,workload_percent:80,vacation_days:25},true);
 assert.equal(employeeWrite.data.start_date,'2026-10-08','Employee entry date survives API-to-storage translation');
 assert.equal(translateBusinessWrite('employees',{email:'employee-qa@example.invalid',entry_date:'2026-10-01'},false).data.start_date,'2026-10-01');
 assert.equal(translateBusinessWrite('employees',{email:'employee-qa@example.invalid',start_date:null,entry_date:'2026-10-01'},false).data.start_date,null,'An intentional cleared date does not resurrect a stale alias');
 const expenseWrite=translateBusinessWrite('expenses',{merchant:'Test Hotel',category:'Reise',expense_date:'2026-10-04',amount:123.45,currency:'CHF',vat_rate:8.1,description:'Test expense',status:'submitted'},true);
 const fields={...expenseWrite.data,organization_id:sandbox};const keys=Object.keys(fields);
 const persistedExpense=await client.query(`insert into expenses(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')}) returning id`,Object.values(fields));
 const loadedExpense=(await listApiBusiness(client,clonedSession,'expenses','id=eq.'+persistedExpense.rows[0].id))[0];
 assert.equal(loadedExpense.category,'Reise');assert.equal(loadedExpense.status,'submitted');assert.equal(Number(loadedExpense.amount),123.45);
 const tenantWrapper=dataModule('export async function withTenant(org,user,fn){return globalThis.__customerPersistenceTest(org,user,fn)}');
 globalThis.__customerPersistenceTest=async(org,user,fn)=>{await db.query("select set_config('app.organization_id',$1,false),set_config('app.user_id',$2,false)",[org,user]);return fn(client)};
 const customerSource=(await fs.readFile('lib/server/repositories/customers.ts','utf8')).replace('import "server-only";','').replace('"@/lib/server/db"',JSON.stringify(tenantWrapper)).replace('"@/lib/server/audit"',JSON.stringify(audit)).replace('"@/lib/server/http"',JSON.stringify(http)).replace('"./business-api"',JSON.stringify(dataModule(businessSource))).replace('"../business-idempotency"',JSON.stringify(idempotencyModule));
 const customerRepository=await import(dataModule(customerSource));
 const input={contactFirstName:"Synthetic",contactLastName:"Contact",name:'Persistence Test AG',email:'test@example.invalid',phone:'+41 00 000 00 00',city:'Zürich',postalCode:'8000',sector:'Beratung',address:'Testweg 1',uid:'TEST',language:'de',paymentDays:45,discount:5,notes:'Persistente interne Kundennotiz'};
 const created=await customerRepository.createCustomer(sandbox,'sandbox-user',input);
 const oldTerms=(await db.query('select payment_terms_days from organizations where id=$1',[sandbox])).rows[0].payment_terms_days;
 await db.query('update organizations set payment_terms_days=60 where id=$1',[sandbox]);
 const inheritedCustomer=await customerRepository.createCustomer(sandbox,'sandbox-user',{name:'Company terms fixture',contactFirstName:'Synthetic',contactLastName:'Contact'});
 assert.equal(inheritedCustomer.paymentDays,60,'New customers inherit company terms without another mandatory question');
 await db.query('update organizations set payment_terms_days=365 where id=$1',[sandbox]);
 await assert.rejects(()=>customerRepository.createCustomer(sandbox,'sandbox-user',{name:'Unsupported inherited terms fixture',contactFirstName:'Synthetic',contactLastName:'Contact'}),error=>error.status===400,'An inherited company value outside the existing customer range is rejected before a database constraint fails');
 const zeroTerms=await customerRepository.createCustomer(sandbox,'sandbox-user',{name:'Immediate terms fixture',contactFirstName:'Synthetic',contactLastName:'Contact',paymentDays:0});
 assert.equal(zeroTerms.paymentDays,0,'An explicit customer value overrides company terms');
 assert.equal((await db.query('select payment_days from customers where organization_id=$1 and id=$2',[sandbox,created.id])).rows[0].payment_days,45,'Existing customer conditions remain unchanged');
 await db.query('update organizations set payment_terms_days=$2 where id=$1',[sandbox,oldTerms]);
 const initialContacts=(await db.query('select first_name,last_name,is_primary from customer_contacts where organization_id=$1 and customer_id=$2 and archived_at is null',[sandbox,created.id])).rows;
 assert.deepEqual(initialContacts,[{first_name:'Synthetic',last_name:'Contact',is_primary:true}],'Customer creation atomically creates the structured primary contact');
 const duplicateByName=await customerRepository.customerDuplicates(client,sandbox,{name:'  PERSISTENCE   TEST AG  '});assert.ok(duplicateByName.some(row=>row.id===created.id));
 assert.ok((await customerRepository.customerDuplicates(client,sandbox,{uid:'t-e.s t'})).some(row=>row.id===created.id));
 assert.ok((await customerRepository.customerDuplicates(client,sandbox,{email:'TEST@EXAMPLE.INVALID'})).some(row=>row.id===created.id));
 assert.equal((await customerRepository.customerDuplicates(client,demo,{name:input.name})).length,0,'Duplicate review cannot cross tenants');
 assert.equal((await customerRepository.customerDuplicates(client,sandbox,{name:'%_'})).length,0,'Search wildcards are literal values');
 await assert.rejects(()=>customerRepository.createCustomer(sandbox,'sandbox-user',{contactFirstName:"Synthetic",contactLastName:"Contact",name:'Different label',uid:'t-e.s t'},'duplicate-create-block'),e=>e.code==='customer_duplicate');
 assert.throws(()=>customerRepository.customerInput({contactFirstName:"Synthetic",contactLastName:"Contact",name:'Invalid override',allowDuplicate:'true'}),e=>e.code==='invalid_field');
 const intentionalInput={...input,allowDuplicate:true};const intentionalDuplicate=await customerRepository.createCustomer(sandbox,'sandbox-user',intentionalInput,'duplicate-create-confirmed');
 assert.notEqual(intentionalDuplicate.id,created.id);assert.equal((await customerRepository.createCustomer(sandbox,'sandbox-user',intentionalInput,'duplicate-create-confirmed')).id,intentionalDuplicate.id,'Intentional duplicate retains replay protection');
 const privateInput={name:'Not a company',customerType:'person',contactFirstName:'Private',contactLastName:'Fixture'};
 const privateCustomer=await customerRepository.createCustomer(sandbox,'sandbox-user',privateInput,'v25-private-customer');
 assert.equal(privateCustomer.customerType,'person');assert.equal(privateCustomer.name,'Private Fixture');
 assert.equal((await customerRepository.createCustomer(sandbox,'sandbox-user',privateInput,'v25-private-customer')).id,privateCustomer.id,'Private creation is idempotent');
 assert.equal((await db.query('select customer_type from customers where organization_id=$1 and id=$2',[sandbox,privateCustomer.id])).rows[0].customer_type,'person','Classification is persisted, not just a transient UI option');
 await assert.rejects(()=>customerRepository.updateCustomer(sandbox,'sandbox-user',privateCustomer.id,{customerType:'company'}),error=>error.code==='customer_type_immutable');
 console.log('Customer duplicate review: normalized UID/email/name, literal matching, tenant scope, explicit override and idempotent confirmed creation passed.');
 assert.match(created.customer_no,/^K-\d{6,}$/,'Only the successful server creation returns the assigned business number');
 const minimalInput=customerRepository.customerInput({contactFirstName:"Synthetic",contactLastName:"Contact",name:'Minimal private or business customer'});const minimalCreated=await customerRepository.createCustomer(sandbox,'sandbox-user',minimalInput,'minimal-customer-fixture-key');const minimalReplay=await customerRepository.createCustomer(sandbox,'sandbox-user',minimalInput,'minimal-customer-fixture-key');assert.equal(minimalReplay.id,minimalCreated.id);assert.equal(minimalReplay.customer_no,minimalCreated.customer_no,'A retried create does not allocate another business number');assert.ok(!minimalCreated.city,'A first valid customer needs no artificial mandatory city');assert.equal((await db.query('select count(*)::int n from customers where organization_id=$1 and name=$2',[sandbox,minimalInput.name])).rows[0].n,1);await assert.rejects(()=>customerRepository.createCustomer(sandbox,'sandbox-user',{contactFirstName:"Synthetic",contactLastName:"Contact",name:'Different customer'},'minimal-customer-fixture-key'),e=>e.status===409);
 const updated=await customerRepository.updateCustomer(sandbox,'sandbox-user',created.id,{city:'Bern',sector:'Handel'});
 assert.equal((await db.query('select count(*)::int n from customer_contacts where organization_id=$1 and customer_id=$2',[sandbox,minimalCreated.id])).rows[0].n,1,'A replay cannot create a second contact');
 assert.equal(updated.customer_no,created.customer_no,'Editing master data preserves the original business number');
 assert.equal(updated.notes,input.notes);assert.equal(updated.uid,input.uid);assert.equal(updated.address,input.address);assert.equal(updated.city,'Bern');assert.equal(updated.sector,'Handel');assert.equal(updated.email,input.email);assert.equal(Number(updated.paymentDays),45);
 assert.equal((await customerRepository.listCustomers({...clonedSession,userId:'sandbox-user'})).find(row=>row.id===created.id).postal_code,'8000');
 await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 assert.equal((await listApiBusiness(client,session,'customers','id=eq.'+created.id)).length,0);
 const fileId='f0000000-0000-4000-8000-000000000031';
 await db.query("insert into file_objects(id,organization_id,object_key,original_name,content_type,size_bytes,sha256,created_by,purpose,expense_id) values($1,$2,$3,'test.txt','text/plain',4,encode(digest('test','sha256'),'hex'),'sandbox-user','expense_receipt',$4)",[fileId,sandbox,sandbox+'/files/test.txt',persistedExpense.rows[0].id]);
 await db.query("insert into file_contents(file_id,organization_id,body) values($1,$2,convert_to('test','utf8'))",[fileId,sandbox]);
 assert.equal((await db.query("select convert_from(body,'utf8') value from file_contents where file_id=$1",[fileId])).rows[0].value,'test');
 await assert.rejects(db.query("update file_contents set body=convert_to('fail','utf8') where file_id=$1",[fileId]),e=>e.code==='23514');
 await db.exec('set role binso_runtime');await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 assert.equal((await db.query('select * from file_contents where file_id=$1',[fileId])).rows.length,0);
 await db.exec('reset role');
 assert.equal((await db.query("select count(*)::int n from pg_constraint where contype='f' and not convalidated")).rows[0].n,0);
 const domain=dataModule(await fs.readFile('config/domain.ts','utf8'));
 const plans=dataModule((await fs.readFile('lib/plans.ts','utf8')).replaceAll('"@/config/domain"',JSON.stringify(domain)).replaceAll("'@/config/domain'",JSON.stringify(domain)).replaceAll("'@/config/plans'",JSON.stringify(planCatalogModuleUrl)));
 const fixture=dataModule(fixtureSource);
 const transactions=dataModule('export async function withTransaction(fn){return globalThis.__provisionTest(fn)}');
 globalThis.__provisionTest=async(fn)=>{await db.exec('begin');try{const result=await fn(client);await db.exec('commit');return result}catch(e){await db.exec('rollback');throw e}};
 const provisionSource=(await fs.readFile('lib/server/provisioning.ts','utf8')).replace('import "server-only";','').replace('"./repositories/demo-fixture"',JSON.stringify(fixture)).replace('"@/lib/server/db"',JSON.stringify(transactions)).replace('"@/config/domain"',JSON.stringify(domain)).replace('"@/lib/plans"',JSON.stringify(plans));
 const entitlementModule=dataModule((await fs.readFile('lib/subscription-plans.ts','utf8')).replace("'@/config/domain'",JSON.stringify(domain)).replace("'@/config/plans'",JSON.stringify(planCatalogModuleUrl)));
 const {provisionOrganization}=await import(dataModule(provisionSource.replace("'@/lib/subscription-plans'",JSON.stringify(entitlementModule))));
 await assert.rejects(()=>provisionOrganization({userId:'retired-provision-test',email:'retired@example.invalid',name:'Retired',companyName:'Retired',plan:'business',mode:'demo'}),/entfernt/);
 // Exercise real provisioning for 50 independent production-style trial tenants.
 const trialTenants=[];
 for(let i=0;i<50;i++){
  const trial=await provisionOrganization({userId:`trial-probe-${i}`,email:`trial-probe-${i}@example.invalid`,name:`Synthetic ${i}`,companyName:`Synthetic Company ${i}`,plan:'business',mode:'trial'});
  trialTenants.push(trial.organizationId);
  assert.equal((await db.query('select count(*)::int n from invoices where organization_id=$1',[trial.organizationId])).rows[0].n,0,'Real signup never seeds demo invoices');
  await db.query("select set_config('app.organization_id',$1,false)",[trial.organizationId]);
  await db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,'same-external-id','K-001',$2)",[trial.organizationId,`Customer ${i}`]);
 }
 assert.equal(new Set(trialTenants).size,50);
 await db.exec('set role binso_runtime');
 for(const [i,organizationId] of trialTenants.entries()){
  await db.query("select set_config('app.organization_id',$1,false),set_config('app.user_id',$2,false)",[organizationId,`trial-probe-${i}`]);
  const visible=await db.query('select organization_id,name from customers');
  assert.equal(visible.rows.length,1);assert.equal(visible.rows[0].organization_id,organizationId);assert.equal(visible.rows[0].name,`Customer ${i}`);
  const foreignTenant=trialTenants[(i+1)%trialTenants.length];
  await assert.rejects(db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,'forbidden','K-002','Cross tenant')",[foreignTenant]),e=>e.code==='42501');
  assert.equal((await db.query("update customers set name='forbidden' where organization_id=$1 returning id",[foreignTenant])).rows.length,0);
  assert.equal((await db.query('delete from customers where organization_id=$1 returning id',[foreignTenant])).rows.length,0);
 }
 await db.query("select set_config('app.organization_id','',false)");
 assert.equal((await db.query('select * from customers')).rows.length,0);
 await db.exec('reset role');
 console.log('50 independently provisioned trial tenants: read/write/delete isolation passed (non-superuser RLS).');

 // Expired unpaid trials must become read-only while paid/Stripe-linked trials stay untouched.
 const lifecycleDb=dataModule('export async function query(text,params=[]){return globalThis.__lifecycleQuery(text,params)} export async function withTenant(org,user,fn){return globalThis.__lifecycleTenant(org,user,fn)}');
 globalThis.__lifecycleQuery=(text,params)=>db.query(text,params);
 globalThis.__lifecycleTenant=(org,user,fn)=>db.transaction(async c=>{await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,user]);return fn(c)});
 const lifecycleSource=(await fs.readFile('lib/server/subscription-lifecycle.ts','utf8')).replace('import "server-only";','').replace('"@/lib/server/db"',JSON.stringify(lifecycleDb));
 const {expireUnpaidTrials}=await import(dataModule(lifecycleSource));
 const expiredTrial=await provisionOrganization({userId:'expired-trial-user',email:'expired-trial@example.invalid',name:'Expired Trial',companyName:'Expired Trial AG',plan:'start',mode:'trial'});
 await db.query("update organization_subscriptions set trial_until=now()-interval '1 day' where organization_id=$1",[expiredTrial.organizationId]);
 await expireUnpaidTrials(demo);
 assert.equal((await db.query('select status from organization_subscriptions where organization_id=$1',[expiredTrial.organizationId])).rows[0].status,'trial','An authenticated tenant check cannot expire another tenant');
 await expireUnpaidTrials(expiredTrial.organizationId);
 assert.equal((await db.query('select status from organization_subscriptions where organization_id=$1',[expiredTrial.organizationId])).rows[0].status,'expired');
 assert.equal((await db.query('select status from organizations where id=$1',[expiredTrial.organizationId])).rows[0].status,'read_only');
 assert.equal((await db.query('select platform_status from platform_tenants where organization_id=$1',[expiredTrial.organizationId])).rows[0].platform_status,'read_only');
 const linkedTrial=await provisionOrganization({userId:'linked-trial-user',email:'linked-trial@example.invalid',name:'Linked Trial',companyName:'Linked Trial AG',plan:'start',mode:'trial'});
 await db.query("update organization_subscriptions set trial_until=now()-interval '1 day',billing_subscription_id='sub_pending' where organization_id=$1",[linkedTrial.organizationId]);
 await expireUnpaidTrials();
 assert.equal((await db.query('select status from organization_subscriptions where organization_id=$1',[linkedTrial.organizationId])).rows[0].status,'trial');
 delete globalThis.__lifecycleQuery;delete globalThis.__lifecycleTenant;
 // Use the actual Stripe transport/signature code with an isolated HTTP fixture.
 globalThis.__billingEnv={stripeSecretKey:'sk_test_fixture',stripeWebhookSecret:'whsec_fixture',appUrl:'https://example.invalid',stripePrices:{start:{monthly:'price_start_m'},business:{yearly:'price_business_y'},pro:{}}};
 const billingEnv=dataModule('export const env=globalThis.__billingEnv');
 const billingLimits=dataModule(await fs.readFile('config/limits.ts','utf8'));
 let stripeSource=(await fs.readFile('lib/server/stripe.ts','utf8')).replace("import 'server-only';",'').replace("'@/lib/server/env'",JSON.stringify(billingEnv)).replace("'@/lib/server/http'",JSON.stringify(http)).replace("'@/config/limits'",JSON.stringify(billingLimits));
 const stripeModule=dataModule(stripeSource);
 let billingSource=(await fs.readFile('lib/server/repositories/stripe-billing.ts','utf8')).replace("import 'server-only';",'').replace("'../http'",JSON.stringify(http)).replace("'../env'",JSON.stringify(billingEnv)).replace("'../stripe'",JSON.stringify(stripeModule)).replace("'@/lib/subscription-plans'",JSON.stringify(entitlementModule));
 const {startBillingCheckout,processStripeEvent}=await import(dataModule(billingSource));
 const {verifyStripeSignature,stripeApiVersion}=await import(stripeModule);
 const {createHmac}=await import('node:crypto');
 const payload='{"id":"evt_test"}',timestamp=Math.floor(Date.now()/1000);
 const digest=createHmac('sha256','whsec_fixture').update(timestamp+'.'+payload).digest('hex');
 assert.equal(verifyStripeSignature(payload,`t=${timestamp},v1=${digest}`),true);
 assert.equal(verifyStripeSignature(payload,`t=NaN,v1=${digest}`),false);
 assert.equal(verifyStripeSignature(payload,`t=${timestamp},v1=xyz`),false);
 assert.equal(verifyStripeSignature(payload+'x',`t=${timestamp},v1=${digest}`),false);
 assert.equal(verifyStripeSignature(payload,`t=${timestamp-600},v1=${digest}`),false);
 const billingTenant=await provisionOrganization({userId:'billing-probe',email:'billing-probe@example.invalid',name:'Billing Probe',companyName:'Billing Probe',plan:'start',mode:'trial'});
 const billingSession={organizationId:billingTenant.organizationId,userId:'billing-probe',email:'billing-probe@example.invalid',role:'owner'};
 const prices={price_start_m:{id:'price_start_m',active:true,livemode:false,currency:'chf',unit_amount:2900,recurring:{interval:'month',interval_count:1}},price_business_y:{id:'price_business_y',active:true,livemode:false,currency:'chf',unit_amount:69000,recurring:{interval:'year',interval_count:1}}};
 let authoritative={id:'sub_fixture',customer:'cus_fixture',metadata:{organization_id:billingTenant.organizationId},status:'active',cancel_at_period_end:true,items:{data:[{quantity:1,price:prices.price_business_y,current_period_end:timestamp+86400}]}};
 let failInvoice=false,checkoutCalls=0,expireCalls=0,checkoutState="open";
 const originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{
  assert.equal(options.headers['Stripe-Version'],stripeApiVersion);
  const path=new URL(url).pathname;
  if(path.startsWith('/v1/prices/'))return Response.json(prices[path.split('/').pop()]);
  if(path==='/v1/customers'){assert.ok(options.headers['Idempotency-Key']);return Response.json({id:'cus_fixture'});}
  if(path==='/v1/checkout/sessions'){checkoutCalls++;const form=options.body;assert.ok(options.headers['Idempotency-Key']);assert.equal(form.get('success_url'),'https://example.invalid/einstellungen/abonnement?checkout=success');assert.equal(form.get('customer'),'cus_fixture');return Response.json({id:'cs_fixture_'+checkoutCalls,url:'https://checkout.stripe.com/c/pay_fixture',expires_at:timestamp+86400});}
  if(path.startsWith('/v1/checkout/sessions/')&&options.method==='GET')return Response.json({status:checkoutState});
  if(path.startsWith('/v1/checkout/sessions/')&&path.endsWith('/expire')){expireCalls++;return Response.json({status:'expired'});}
  if(path==='/v1/subscriptions/sub_fixture')return Response.json(authoritative);
  if(path==='/v1/invoices/in_fixture'){if(failInvoice)throw new Error('Simulated failure');return Response.json({id:'in_fixture',customer:'cus_fixture',status:'paid',amount_paid:69000,currency:'chf',status_transitions:{paid_at:timestamp}});}
  throw new Error('Unexpected Stripe request: '+path);
 };
 await db.query("select set_config('app.organization_id',$1,false)",[billingTenant.organizationId]);
 const requestKey='00000000-0000-4000-8000-000000000034';
 await assert.rejects(globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly',requestKey)),e=>e.code==='trial_checkout_policy_pending','Unverified trial has no approved paid start policy');
 await db.query("update organization_subscriptions set trial_until=now()+interval '5 days' where organization_id=$1",[billingTenant.organizationId]);
 await assert.rejects(globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly',requestKey)),e=>e.code==='trial_checkout_policy_pending','Remaining free days cannot be charged under an unapproved policy');
 assert.equal(checkoutCalls,0);
 assert.equal((await db.query('select billing_customer_id from organization_subscriptions where organization_id=$1',[billingTenant.organizationId])).rows[0].billing_customer_id,null,'Blocked checkout does not create a provider customer');
 await db.query("update organization_subscriptions set status='expired',trial_until=now()-interval '1 second' where organization_id=$1",[billingTenant.organizationId]);
 const checkout=await globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly',requestKey));
 assert.ok(checkout.url.startsWith('https://checkout.stripe.com/'));
 const sameCheckout=await globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly','00000000-0000-4000-8000-000000000035'));
 assert.equal(checkout.url,sameCheckout.url);assert.equal(checkoutCalls,1);
 checkoutState='complete';
 await assert.rejects(globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly',requestKey)),e=>e.code==='checkout_pending');
 checkoutState='expired';
 await assert.rejects(globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'business','yearly',requestKey)),e=>e.code==='checkout_request_expired');
 assert.equal(checkoutCalls,1);checkoutState='open';
 await assert.rejects(globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'start','monthly',requestKey)),e=>e.code==='checkout_request_reused');
 await globalThis.__provisionTest(async c=>{await c.query('update organizations set is_demo=true where id=$1',[billingTenant.organizationId]);await assert.rejects(()=>startBillingCheckout(c,billingSession,'start','monthly',requestKey),e=>e.status===403);await c.query('update organizations set is_demo=false where id=$1',[billingTenant.organizationId]);});
 await globalThis.__provisionTest(c=>startBillingCheckout(c,billingSession,'start','monthly','00000000-0000-4000-8000-000000000036'));
 assert.equal(expireCalls,1);assert.equal(checkoutCalls,2);
 assert.equal((await db.query('select count(*)::int total from billing_checkout_sessions where organization_id=$1 and expires_at>now()',[billingTenant.organizationId])).rows[0].total,1);
 const invoiceEvent={id:'evt_fixture',livemode:false,type:'invoice.paid',data:{object:{id:'in_fixture',customer:'cus_fixture',parent:{subscription_details:{subscription:'sub_fixture'}}}}};
 failInvoice=true;
 await assert.rejects(globalThis.__provisionTest(c=>processStripeEvent(c,invoiceEvent)),e=>e.code==='stripe_unavailable');
 assert.equal((await db.query("select * from billing_webhook_events where external_event_id='evt_fixture'")).rows.length,0);
 assert.equal((await db.query('select status from organization_subscriptions where organization_id=$1',[billingTenant.organizationId])).rows[0].status,'expired','Failed provider processing preserves the post-trial state');
 failInvoice=false;
 assert.equal((await globalThis.__provisionTest(c=>processStripeEvent(c,invoiceEvent))).processed,true);
 assert.equal((await globalThis.__provisionTest(c=>processStripeEvent(c,invoiceEvent))).duplicate,true);
 const billed=(await db.query('select * from organization_subscriptions where organization_id=$1',[billingTenant.organizationId])).rows[0];
 assert.equal(billed.plan,'business');assert.equal(billed.status,'active');assert.equal(billed.billing_interval,'yearly');assert.equal(Number(billed.unit_amount_chf),690);assert.equal(billed.cancel_at_period_end,true);
 assert.equal((await db.query('select max_users from organization_entitlements where organization_id=$1',[billingTenant.organizationId])).rows[0].max_users,15);
 const ledger=(await db.query("select * from platform_billing_payments where external_id='in_fixture'")).rows;
 assert.equal(ledger.length,1);assert.equal(Number(ledger[0].amount),690);
 // A stale cancellation event must use current provider state (still active).
 await globalThis.__provisionTest(c=>processStripeEvent(c,{id:'evt_stale',livemode:false,type:'customer.subscription.deleted',data:{object:{id:'sub_fixture',customer:'cus_fixture',status:'canceled'}}}));
 assert.equal((await db.query('select status from organization_subscriptions where organization_id=$1',[billingTenant.organizationId])).rows[0].status,'active');
 await db.query("update organizations set status='suspended' where id=$1",[billingTenant.organizationId]);
 await globalThis.__provisionTest(c=>processStripeEvent(c,{...invoiceEvent,id:'evt_suspended'}));
 assert.equal((await db.query('select status from organizations where id=$1',[billingTenant.organizationId])).rows[0].status,'suspended');
 await assert.rejects(globalThis.__provisionTest(c=>processStripeEvent(c,{...invoiceEvent,id:'evt_wrong_mode',livemode:true})),e=>e.code==='stripe_mode_mismatch');
 authoritative={...authoritative,metadata:{organization_id:demo}};
 await assert.rejects(globalThis.__provisionTest(c=>processStripeEvent(c,{...invoiceEvent,id:'evt_wrong_tenant'})),e=>e.code==='subscription_mapping_invalid');
 await db.exec('set role binso_runtime');await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 assert.equal((await db.query('select * from billing_checkout_sessions')).rows.length,0);
 await db.exec('reset role');
 globalThis.fetch=originalFetch;delete globalThis.__billingEnv;
 console.log('Stripe signature, persisted checkout retries, duplicate/stale events, rollback, billing ledger, entitlements and tenant mapping passed (HTTP fixtures).');

 delete globalThis.__provisionTest;
 delete globalThis.__customerPersistenceTest;
 // Execute the actual timer handlers against the migrated database.
 const timerSession={organizationId:trialTenants[0],userId:'trial-probe-0',name:'Synthetic 0',email:'trial-probe-0@example.invalid',role:'owner'};
 globalThis.__timerSession=timerSession;
 globalThis.__timerTenant=async(org,user,task)=>{await db.exec('begin');try{await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,user]);const result=await task(client);await db.exec('commit');return result;}catch(e){await db.exec('rollback');throw e;}};
 const timerHttp=dataModule(`export class ApiError extends Error {constructor(status,code,message){super(message);this.status=status;this.code=code}} export const apiError=e=>({error:e.code,status:e.status});export const json=x=>x;export const assertSameOrigin=()=>{};export const cleanText=(x)=>typeof x==='string'?x.trim():'';export const readJson=async x=>x.body;`);
 const workforceSource=(await fs.readFile('lib/server/workforce-access.ts','utf8')).replace("import 'server-only';",'').replace("'./http'",JSON.stringify(timerHttp)).replace("'./rbac'",JSON.stringify(dataModule('export const authorize=()=>{};')));
 const workforceModule=dataModule(workforceSource);
 let timerSource=await fs.readFile('app/api/time-tracker/route.ts','utf8');
 const timerDependencies={"@/lib/financial-status":financialModule,"@/lib/server/workforce-access":workforceModule,"@/lib/projects":dataModule(await fs.readFile("lib/projects.ts","utf8")),"@/lib/server/session":dataModule('export const requireSession=async()=>globalThis.__timerSession;'),"@/lib/server/rbac":dataModule('export const authorize=()=>{};'),"@/lib/server/db":dataModule('export const withTenant=(...args)=>globalThis.__timerTenant(...args);'),"@/lib/server/http":timerHttp};
 for(const [key,url] of Object.entries(timerDependencies))timerSource=timerSource.replaceAll(JSON.stringify(key),JSON.stringify(url));
 const timer=await import(dataModule(timerSource));
 await db.query("select set_config('app.organization_id',$1,false)",[timerSession.organizationId]);
 const timerCustomer=(await db.query('select id from customers where organization_id=$1 order by id limit 1',[timerSession.organizationId])).rows[0].id;
 const started=await timer.POST({body:{action:'start',project:'Direct customer work',customerId:timerCustomer,projectId:null}});
 assert.equal(started.tracker.customer_id,timerCustomer);
 assert.equal((await timer.GET()).tracker.customer_id,timerCustomer,'Reload retains customer without a project');
 await db.query('update active_time_trackers set accumulated_seconds=3600,active_since=now() where organization_id=$1 and user_id=$2',[timerSession.organizationId,timerSession.userId]);
 assert.equal((await timer.POST({body:{action:'project',project:'Other work',customerId:null,projectId:null}})).error,'tracker_context_locked');
 const paused=await timer.POST({body:{action:'pause'}});assert.equal(paused.tracker.customer_id,timerCustomer);assert.equal(paused.tracker.state,'paused');
 const finished=await timer.POST({body:{action:'finish'}});assert.ok(finished.item.id);
 const finishedTime=(await db.query('select customer_id,project_id,billable,hours from time_entries where id=$1',[finished.item.id])).rows[0];
 assert.equal(finishedTime.customer_id,timerCustomer);assert.equal(finishedTime.project_id,null);assert.equal(finishedTime.billable,true);assert.ok(Number(finishedTime.hours)>=1);
 assert.equal((await timer.GET()).tracker,null);
 const internal=await timer.POST({body:{action:'start',project:'Internal work',customerId:null,projectId:null}});assert.equal(internal.tracker.billable,false);
 const invalid=await timer.POST({body:{action:'project',project:'Invalid',customerId:'00000000-0000-4000-8000-000000000001',projectId:null}});assert.equal(invalid.error,'customer_invalid');
 await db.query("update active_time_trackers set state='paused', accumulated_seconds=1,active_since=null where organization_id=$1 and user_id=$2",[timerSession.organizationId,timerSession.userId]);
 const shortFinished=await timer.POST({body:{action:'finish'}});
 assert.ok(shortFinished.item.id,'A one-second timer must create a valid entry');
 assert.ok(Math.abs(Number(shortFinished.item.hours)*3600-1)<0.002,'Timer seconds must survive database persistence');
 assert.equal((await timer.GET()).tracker,null);
 assert.deepEqual(await timer.POST({body:{action:'finish'}}),{tracker:null},'Repeated stop must not duplicate an entry');
 delete globalThis.__timerSession;delete globalThis.__timerTenant;
 console.log('Timer customer-only start/reload/pause/finish, context lock and internal work passed.');

 // Exercise the process implementations against migrated PostgreSQL, not source strings.
 const processHttp=dataModule(`export const jsonHeaders={"Cache-Control":"private, no-store"};export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}};export const assertSameOrigin=()=>{};export const cleanText=(v)=>typeof v==='string'?v:'';export const readJson=async r=>r.body;export const readBoundedBody=async r=>Buffer.from(await r.arrayBuffer());export const json=(data,status=200)=>({data,status});export const validEmail=v=>/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(v);export const apiError=e=>({status:e instanceof Response?e.status:e.status??500,data:{error:e.code,message:e.message}});`);
 const processRbac=dataModule((await fs.readFile('lib/server/rbac.ts','utf8')).replace('import "server-only";','').replace('"@/lib/permissions"',JSON.stringify(permissions)));
 const processSession=dataModule('export async function requireSession(){return globalThis.__processSession}');
 const processDb=dataModule('export async function withTenant(org,user,fn){return globalThis.__processTransaction(org,fn)} export async function withPlatform(fn){return globalThis.__processPlatform(fn)}');
 globalThis.__processSession={...session,isDemo:false,organizationStatus:'active',email:'process@example.invalid'};
 globalThis.__processTransaction=async(org,fn)=>{await db.exec('begin');try{await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,globalThis.__processSession.userId]);const r=await fn(client);await db.exec('commit');return r}catch(e){await db.exec('rollback');throw e}};
 globalThis.__processPlatform=async(fn)=>{await db.exec('begin');try{await db.query("select set_config('app.platform_operator','true',true)");const r=await fn(client);await db.exec('commit');return r}catch(e){await db.exec('rollback');throw e}};
 const timePeriodModule=dataModule((await fs.readFile('lib/statistics-period.ts','utf8')).replace("'./money'",JSON.stringify(moneyModule)));
 const timeWorkspaceModule=dataModule((await fs.readFile('lib/server/repositories/time-workspace.ts','utf8')).replace("import 'server-only';",'').replace("'../http'",JSON.stringify(processHttp)).replace("'@/lib/permissions'",JSON.stringify(permissions)).replace("'@/lib/statistics-period'",JSON.stringify(timePeriodModule)));
 const manualTimeSource=(await fs.readFile('app/api/time-entries/route.ts','utf8')).replace('"@/lib/server/repositories/time-workspace"',JSON.stringify(timeWorkspaceModule)).replace('"@/lib/server/workforce-access"',JSON.stringify(workforceModule)).replace('"@/lib/projects"',JSON.stringify(dataModule(await fs.readFile('lib/projects.ts','utf8')))).replace('"@/lib/server/business-idempotency"',JSON.stringify(idempotencyModule)).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/session"',JSON.stringify(processSession)).replace('"@/lib/server/rbac"',JSON.stringify(processRbac)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/permissions"',JSON.stringify(permissions));
 const manualTimeHandler=await import(dataModule(manualTimeSource));globalThis.__processSession={...globalThis.__processSession,name:'Fixture Person'};
 const manualCreated=await manualTimeHandler.POST({headers:new Headers(),body:{customerId:documentArgs.p_customer_id,projectName:'Arbeitszeit',description:'Manual fixture',durationMinutes:60,startedAt:'2026-10-06T12:00:00'}});
 const replayBody={customerId:documentArgs.p_customer_id,projectName:'Arbeitszeit',description:'Idempotent manual fixture',durationMinutes:30,startedAt:'2026-10-06T12:00:00'};
 const replayRequest=body=>({headers:new Headers({'Idempotency-Key':'manual-time-retry-fixture'}),body});
 const firstManualReplay=await manualTimeHandler.POST(replayRequest(replayBody));
 assert.equal(firstManualReplay.status,201);
 assert.equal((await manualTimeHandler.POST(replayRequest(replayBody))).data.item.id,firstManualReplay.data.item.id,'Manual retry reuses committed time entry');
 assert.equal((await manualTimeHandler.POST(replayRequest({...replayBody,durationMinutes:45}))).status,409,'Changed manual time cannot reuse a request key');
 assert.equal(manualCreated.status,201);assert.equal(manualCreated.data.item.customer_id,documentArgs.p_customer_id);assert.equal(manualCreated.data.item.billable,true);assert.equal(manualCreated.data.item.employee_name,'Fixture Person');
 const manualReloaded=(await manualTimeHandler.GET({nextUrl:new URL('https://example.invalid/api/time-entries')})).data.items.find(i=>i.id===manualCreated.data.item.id);
 assert.ok(manualCreated.data.item.customer_name);assert.equal(manualCreated.data.item.customer_name,manualReloaded.customer_name,'Customer label must match the reloaded record immediately');assert.equal(manualReloaded.employee_name,'Fixture Person');

 // Contacts retain structured names and exactly one selected primary under a customer lock.
 const contactSource=(await fs.readFile('lib/server/repositories/contacts.ts','utf8')).replace('import "server-only";','').replace('"../db"',JSON.stringify(processDb)).replace('"../http"',JSON.stringify(processHttp)).replace('"../audit"',JSON.stringify(audit));
 const contactRepository=await import(dataModule(contactSource));

 // Separate synthetic tenant: old time history remains reachable without an unbounded response.
 const historyOrganization=randomUUID(),historySession=globalThis.__processSession;
 try{
  await db.query("insert into organizations(id,name,slug,status) values($1,'Synthetic paged time',$2,'active')",[historyOrganization,'time-history-'+historyOrganization]);
  await db.query("insert into app_users(id,email,display_name,status) values('history-fixture-owner','history@example.invalid','Synthetic history owner','active')");
  await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,'history-fixture-owner','history@example.invalid','owner','active')",[historyOrganization]);
  await db.query("select set_config('app.organization_id',$1,false)",[historyOrganization]);
  await db.query("insert into time_entries(organization_id,external_id,project_label,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id) select $1,'history-'||n,'Synthetic history','Synthetic owner','employee','2005-01-01'::date+n,1,'Synthetic paged history '||n,false,false,'history-fixture-owner' from generate_series(1,1101) n",[historyOrganization]);
  globalThis.__processSession={...session,organizationId:historyOrganization,userId:'history-fixture-owner'};
  const historyRequest=extra=>({nextUrl:new URL('https://fixture.invalid/api/time-entries?limit=50&status=internal&own=1&q=Synthetic%20paged%20history&'+extra)});
  const first=await manualTimeHandler.GET(historyRequest('offset=0')),old=await manualTimeHandler.GET(historyRequest('offset=1100'));
  assert.equal(first.status,200,JSON.stringify(first));assert.equal(first.data.items.length,50);assert.equal(old.data.items.length,1);assert.equal(old.data.items[0].description,'Synthetic paged history 1');
  assert.equal(first.data.total,1101);assert.equal(old.data.total,1101);assert.equal(old.data.total_minutes,1101*60,'The headline total is computed over the full authorized filtered population, not the visible page');
  for(const extra of ['limit=0','offset=-1','from=2026-02-30','status=unknown']){
   const u=new URL(historyRequest('').nextUrl);const [key,value]=extra.split('=');u.searchParams.set(key,value);assert.equal((await manualTimeHandler.GET({nextUrl:u})).status,400);
  }
  globalThis.__processSession={...session,organizationId:sandbox};assert.equal((await manualTimeHandler.GET(historyRequest(''))).data.total,0,'History search is tenant-scoped before counting');
  globalThis.__processSession={...session,organizationId:historyOrganization,userId:'other-time-owner'};assert.equal((await manualTimeHandler.GET(historyRequest(''))).data.total,0,'Own-day mode cannot count another worker');
 }finally{globalThis.__processSession=historySession;await db.query("select set_config('app.organization_id',$1,false)",[demo]);}
 const contactA=await contactRepository.saveCustomerContact(globalThis.__processSession,documentArgs.p_customer_id,null,{firstName:'Anna Maria',lastName:'von Beispiel',email:'anna@example.invalid',isPrimary:true});
 assert.equal(contactA.first_name,'Anna Maria');assert.equal(contactA.last_name,'von Beispiel');assert.equal(contactA.is_primary,true);
 const contactB=await contactRepository.saveCustomerContact(globalThis.__processSession,documentArgs.p_customer_id,null,{firstName:'Max',lastName:'Test',isPrimary:true});
 const contactRows=await listApiBusiness(client,session,'customer_contacts','customer_id=eq.'+documentArgs.p_customer_id);
 assert.equal(contactRows.filter(c=>c.is_primary).length,1);assert.equal(contactRows.find(c=>c.id===contactA.id).first_name,'Anna Maria');assert.equal(contactRows.find(c=>c.id===contactA.id).is_primary,false);
 const editedContact=await contactRepository.saveCustomerContact(globalThis.__processSession,documentArgs.p_customer_id,contactA.id,{firstName:'Anna Maria',lastName:'von Beispiel',jobTitle:'Buchhaltung',isPrimary:true});
 assert.equal(editedContact.job_title,'Buchhaltung');assert.equal(editedContact.is_primary,true);
 await assert.rejects(()=>contactRepository.saveCustomerContact({...globalThis.__processSession,organizationId:sandbox},documentArgs.p_customer_id,contactA.id,{firstName:'Cross',lastName:'Tenant'}),e=>e.code==='not_found');
 await assert.rejects(()=>contactRepository.saveCustomerContact(globalThis.__processSession,documentArgs.p_customer_id,null,{firstName:'Bad',lastName:'Email',email:'invalid'}),e=>e.code==='email_invalid');
 await contactRepository.archiveCustomerContact(globalThis.__processSession,documentArgs.p_customer_id,contactB.id);
 assert.equal((await listApiBusiness(client,session,'customer_contacts','id=eq.'+contactB.id)).length,0);
 assert.ok((await db.query('select archived_at from customer_contacts where id=$1',[contactB.id])).rows[0].archived_at,'Archiving preserves contact references');
 const manualInternal=await manualTimeHandler.POST({headers:new Headers(),body:{customerId:documentArgs.p_customer_id,projectName:'Arbeitszeit',durationMinutes:45,startedAt:'2026-10-06T12:00:00',billable:false,salesRate:125}});
 assert.equal(manualInternal.data.item.billable,false);assert.equal(Number(manualInternal.data.item.sales_rate),125);
 assert.equal((await manualTimeHandler.POST({headers:new Headers(),body:{durationMinutes:60,billable:true}})).data.error,'billable_customer_required');
 assert.equal((await manualTimeHandler.POST({headers:new Headers(),body:{durationMinutes:60,salesRate:-10}})).data.error,'rate_invalid');

 const contactHttpDependencies={"@/lib/server/http":processHttp,"@/lib/server/database":dataModule('export async function requireTenantFeature(){return {session:globalThis.__processSession}}'),"@/lib/server/rbac":processRbac,"@/lib/server/repositories/contacts":dataModule(contactSource)};
 let contactRouteSource=await fs.readFile('app/api/customers/[id]/contacts/[contactId]/route.ts','utf8');
 for(const [key,url] of Object.entries(contactHttpDependencies))contactRouteSource=contactRouteSource.replaceAll(JSON.stringify(key),JSON.stringify(url));
 const contactRoute=await import(dataModule(contactRouteSource));
 globalThis.__processSession={...session,role:'employee'};
 assert.equal((await contactRoute.DELETE({},{params:Promise.resolve({id:documentArgs.p_customer_id,contactId:contactA.id})})).status,403);
 globalThis.__processSession={...session,organizationStatus:'read_only'};
 assert.equal((await contactRoute.PATCH({body:{firstName:'A',lastName:'B'}},{params:Promise.resolve({id:documentArgs.p_customer_id,contactId:contactA.id})})).status,403);
 globalThis.__processSession={...session,isDemo:false,organizationStatus:'active',email:'process@example.invalid'};
 assert.equal((await contactRoute.PATCH({body:{firstName:'Anna Maria',lastName:'von Beispiel',isPrimary:true}},{params:Promise.resolve({id:documentArgs.p_customer_id,contactId:contactA.id})})).status,200);
 console.log('Contact structured names, primary replacement, edit/archive, tenant isolation and manual time rates passed.');
 const processSource=(await fs.readFile('lib/server/document-process.ts','utf8')).replace('"@/lib/qr-bill"',JSON.stringify(qrModule)).replace('"@/lib/financial-status"',JSON.stringify(financialModule)).replace('"@/lib/server/plan-access"',JSON.stringify(dataModule('export async function requireModuleEntitlement(){}'))).replace('import "server-only";','').replace('"./http"',JSON.stringify(processHttp)).replace('"./rbac"',JSON.stringify(processRbac)).replace('"./audit"',JSON.stringify(audit));
 const {changeDocumentStatus}=await import(dataModule(processSource));
 const revisionDependencies={'./http':processHttp,'./rbac':processRbac,'./plan-access':dataModule('export async function requireModuleEntitlement(){}'),'./business-idempotency':idempotencyModule,'./audit':audit,'./repositories/business-api':dataModule(businessSource),'@/lib/financial-status':financialModule,'@/config/domain':dataModule(await fs.readFile('config/domain.ts','utf8'))};
 let revisionSource=(await fs.readFile('lib/server/offer-revisions.ts','utf8')).replace("import 'server-only';",'');
 for(const [specifier,url] of Object.entries(revisionDependencies))revisionSource=revisionSource.replaceAll("'"+specifier+"'",JSON.stringify(url));
 const {createOfferRevision}=await import(dataModule(revisionSource));
 const priorOffer=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_valid_until:'2099-12-31',p_note:'Agreed offer text, retained across revisions'});
 await changeDocumentStatus(client,session,priorOffer.number,'issue','');
 const originalOffer=(await listApiBusiness(client,session,'documents','kind=eq.offer&id=eq.'+priorOffer.id))[0];
 const revisionKey=randomUUID();
 const revised=await globalThis.__processTransaction(demo,c=>createOfferRevision(c,session,priorOffer.number,revisionKey));
 assert.notEqual(revised.number,priorOffer.number);assert.equal(revised.status,'draft');assert.equal(revised.revises_offer,priorOffer.number);assert.equal(revised.customer_id,originalOffer.customer_id);assert.equal(Number(revised.total),Number(originalOffer.total));
 assert.equal(revised.document_snapshot.intro,originalOffer.document_snapshot.intro);assert.equal(revised.document_snapshot.closing,originalOffer.document_snapshot.closing);
 assert.equal((await createOfferRevision(client,session,priorOffer.number,revisionKey)).id,revised.id,'Lost revision response replays the same draft');
 await assert.rejects(()=>globalThis.__processTransaction(demo,c=>createOfferRevision(c,session,priorOffer.number,randomUUID())),e=>e.code==='revision_exists');
 await assert.rejects(()=>createOfferRevision(client,{...session,role:'employee'},priorOffer.number,randomUUID()));
 await assert.rejects(()=>createOfferRevision(client,{...session,organizationStatus:'read_only'},priorOffer.number,randomUUID()));
 await assert.rejects(()=>createOfferRevision(client,{...session,organizationId:sandbox},priorOffer.number,randomUUID()),e=>e.code==='not_found');
 assert.equal((await db.query('select status from quotes where id=$1',[priorOffer.id])).rows[0].status,'sent','Creating a draft does not withdraw the existing offer');
 await globalThis.__processTransaction(demo,c=>changeDocumentStatus(c,session,revised.number,'issue',''));
 const superseded=(await listApiBusiness(client,session,'documents','id=eq.'+priorOffer.id+'&kind=eq.offer'))[0];
 assert.equal(superseded.status,'revised');assert.deepEqual(superseded.document_snapshot,originalOffer.document_snapshot,'Issued historical content is immutable');
 assert.ok(superseded.revisions.some(item=>item.number===revised.number&&item.status==='sent'));
 assert.equal((await listApiBusiness(client,session,'documents','kind=eq.offer&display_status=eq.revised')).some(item=>item.id===priorOffer.id),true);
 await assert.rejects(()=>changeDocumentStatus(client,session,priorOffer.number,'accept',''),e=>e.code==='transition_invalid');
 const acceptanceRaceSource=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_valid_until:'2099-12-31'});
 await changeDocumentStatus(client,session,acceptanceRaceSource.number,'issue','');
 const acceptanceRaceDraft=await globalThis.__processTransaction(demo,c=>createOfferRevision(c,session,acceptanceRaceSource.number,randomUUID()));
 await changeDocumentStatus(client,session,acceptanceRaceSource.number,'accept','Customer accepted the current version');
 await assert.rejects(()=>globalThis.__processTransaction(demo,c=>changeDocumentStatus(c,session,acceptanceRaceDraft.number,'issue','')),e=>e.code==='revision_source_changed');
 assert.equal((await db.query('select status from quotes where id=$1',[acceptanceRaceDraft.id])).rows[0].status,'draft','Source acceptance blocks revision issue atomically');
 console.log('Offer revisions: copied customer/positions/texts, new immutable number, replay, one open draft, tenant/role/read-only guards, preserved issued history, superseded-status filter and acceptance race passed.');
 const capturedLanguageBefore=(await db.query('select language from customers where id=$1',[documentArgs.p_customer_id])).rows[0].language;
 await db.query("update customers set language='fr' where id=$1",[documentArgs.p_customer_id]);
 const localizedOffer=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_valid_until:'2099-12-31'});
 await changeDocumentStatus(client,session,localizedOffer.number,'issue','');
 await db.query("update customers set language='en' where id=$1",[documentArgs.p_customer_id]);
 const localizedFrozen=(await listApiBusiness(client,session,'documents','kind=eq.offer&id=eq.'+localizedOffer.id))[0];
 assert.equal(localizedFrozen.document_snapshot.locale,'fr');assert.equal(localizedFrozen.customer_snapshot.language,'fr');assert.equal(localizedFrozen.customer.language,'en');
 await db.query('update customers set language=$2 where id=$1',[documentArgs.p_customer_id,capturedLanguageBefore]);
 const processQuote=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_number:'FLOW-QUOTE',p_valid_until:'2099-12-31'});
 await assert.rejects(()=>changeDocumentStatus(client,session,processQuote.number,'accept',''),e=>e.code==='transition_invalid');
 await changeDocumentStatus(client,session,processQuote.number,'issue','');
 await assert.rejects(()=>changeDocumentStatus(client,{...session,role:'reader'},processQuote.number,'accept',''));
 await changeDocumentStatus(client,session,processQuote.number,'accept','Telephone acceptance');
 assert.equal((await db.query('select status from quotes where id=$1',[processQuote.id])).rows[0].status,'accepted');
 await assert.rejects(()=>mutateApiBusiness(client,session,'update_document_atomic',{...documentArgs,p_kind:'offer',p_current_number:processQuote.number,p_number:processQuote.number}),e=>e.code==='document_locked');
 const converted=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-INVOICE',p_source_offer:processQuote.number});
 assert.equal((await db.query('select source_quote_id from invoices where id=$1',[converted.id])).rows[0].source_quote_id,processQuote.id);
 await assert.rejects(()=>mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-DUP',p_source_offer:processQuote.number}),e=>e.code==='offer_already_invoiced');
 await changeDocumentStatus(client,session,converted.number,'issue','');
 await assert.rejects(()=>mutateApiBusiness(client,session,'update_document_atomic',{...documentArgs,p_current_number:converted.number,p_number:converted.number}),e=>e.code==='document_locked');
 await changeDocumentStatus(client,session,converted.number,'cancel','Cancelled before payment');
 const expired=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_kind:'offer',p_number:'FLOW-EXPIRED',p_valid_until:'2000-01-01'});
 await changeDocumentStatus(client,session,expired.number,'issue','');
 await assert.rejects(()=>changeDocumentStatus(client,session,expired.number,'accept',''),e=>e.code==='offer_expired');
 // Failed/pending delivery must block edits; sent requests cannot rewrite issued documents.
 const pending=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-PENDING'});
 await db.query("insert into document_deliveries(organization_id,kind,document_id,recipient,status,request_key,created_by_user_id) values($1,'invoice',$2,'fixture@example.invalid','sending','flow-key','fixture')",[demo,pending.id]);
 await assert.rejects(()=>mutateApiBusiness(client,session,'update_document_atomic',{...documentArgs,p_current_number:pending.number,p_number:pending.number}),e=>e.code==='delivery_pending');
 await assert.rejects(()=>changeDocumentStatus(client,session,pending.number,'issue',''),e=>e.code==='delivery_pending');
 const databaseSource=(await fs.readFile('lib/server/database.ts','utf8')).replace('import "server-only";','').replace("'@/lib/business-list-query'",JSON.stringify(dataModule(await fs.readFile('lib/business-list-query.ts','utf8')))).replace('"./repositories/business-api"',JSON.stringify(businessUrlForProcess())).replace('"./plan-access"',JSON.stringify(dataModule('export async function requireModuleEntitlement(){}'))).replace('"./audit"',JSON.stringify(audit)).replace('"@/lib/permissions"',JSON.stringify(permissions)).replace('"./http"',JSON.stringify(processHttp)).replace('"./rbac"',JSON.stringify(processRbac)).replace('"./session"',JSON.stringify(processSession)).replace('"./db"',JSON.stringify(processDb)).replace('"./repositories/operator-customer-overview"',JSON.stringify(dataModule('export function operatorCustomerReadings(){}'))).replace('"./repositories/operator-api"',JSON.stringify(dataModule('export function listOperatorBusiness(){}export function insertOperatorBusiness(){}export function updateOperatorBusiness(){}'))).replace('"./operator/audit"',JSON.stringify(dataModule('export function platformAudit(){}'))).replace('"./operator/session"',JSON.stringify(dataModule('export function requireOperatorSession(){}')));
 function businessUrlForProcess(){return dataModule(businessSource)}
 const databaseProcess=await import(dataModule(databaseSource));
 const employeeValidation=dataModule(await fs.readFile('lib/employee-validation.ts','utf8'));
 const employeeRouteSource=(await fs.readFile('app/api/employees/route.ts','utf8')).replace('"@/lib/employee-validation"',JSON.stringify(employeeValidation)).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/database"',JSON.stringify(dataModule(databaseSource)));
 const employeeRoute=await import(dataModule(employeeRouteSource));
 const employeeBody={firstName:'Regression',lastName:'Employee',email:'regression-employee@example.invalid',jobTitle:'ICT',workloadPercent:80,weeklyHours:37.5,vacationDays:25,entryDate:'2026-10-08'};
 assert.equal((await employeeRoute.POST({body:{...employeeBody,email:'bad-email'}})).status,400);
 assert.equal((await employeeRoute.POST({body:{...employeeBody,entryDate:'2026-02-30'}})).status,400);
 const createdEmployee=await employeeRoute.POST({body:employeeBody});assert.equal(createdEmployee.status,201);
 assert.equal(String((await db.query('select start_date::text from employees where id=$1',[createdEmployee.data.item.id])).rows[0].start_date),'2026-10-08');
 const employeeEditSource=(await fs.readFile('app/api/employees/[id]/route.ts','utf8')).replace('"@/lib/employee-validation"',JSON.stringify(employeeValidation)).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/database"',JSON.stringify(dataModule(databaseSource)));
 const employeeEdit=await import(dataModule(employeeEditSource));
 assert.equal((await employeeEdit.PATCH({body:{...employeeBody,weeklyHours:38}},{params:Promise.resolve({id:createdEmployee.data.item.id})})).status,200);
 assert.equal(String((await db.query('select start_date::text from employees where id=$1',[createdEmployee.data.item.id])).rows[0].start_date),'2026-10-08','Editing hours must not clear the employee entry date');
 for(const [table,input] of [['products',{name:'Replay product fixture',kind:'service',unit:'hour',unit_price:125,vat_rate:8.1,status:'active'}],['employees',{first_name:'Replay',last_name:'Person',email:'replay-person@example.invalid',job_title:'ICT',workload_percent:100,weekly_hours:42,vacation_days:25,status:'active'}]]){
  const key=table+'-creation-replay',first=(await databaseProcess.tenantInsert(table,input,key))[0];
  const again=(await databaseProcess.tenantInsert(table,input,key))[0];assert.equal(again.id,first.id,'Lost-reply retry returns the same '+table+' identity');
  await assert.rejects(()=>databaseProcess.tenantInsert(table,{...input,...(table==='products'?{name:'Changed product'}:{first_name:'Changed person'})},key),e=>e.code==='idempotency_conflict');
 }
 const expenseBody={employee_id:null,customer_id:documentArgs.p_customer_id,billable:true,merchant:'Fixture meal',expense_date:'2026-10-06',category:'Verpflegung',amount:42,currency:'CHF',vat_rate:8.1,status:'submitted'};
 const expenseId=(await databaseProcess.tenantInsert('expenses',expenseBody))[0].id;
 const repeatedExpense=(await databaseProcess.tenantInsert('expenses',expenseBody,'expense-process-retry'))[0].id;
 assert.equal((await databaseProcess.tenantInsert('expenses',expenseBody,'expense-process-retry'))[0].id,repeatedExpense,'Creation retry must return the same expense');
 await assert.rejects(()=>databaseProcess.tenantInsert('expenses',{...expenseBody,amount:99},'expense-process-retry'),e=>e.code==='idempotency_conflict');
 await assert.rejects(()=>databaseProcess.tenantInsert('expenses',{...expenseBody,status:'approved'}),e=>e.code==='submission_required');
 globalThis.__processSession={...session,role:'project_manager'};
 await assert.rejects(()=>databaseProcess.tenantUpdate('expenses',expenseId,{...expenseBody,status:'approved'}),e=>e.code==='self_approval_forbidden');
 globalThis.__processSession=session;
 await assert.rejects(()=>databaseProcess.tenantUpdate('expenses',expenseId,{...expenseBody,status:'approved'}),e=>e.code==='self_approval_forbidden');
 globalThis.__processSession={...session,userId:'independent-expense-reviewer'};
 await databaseProcess.tenantUpdate('expenses',expenseId,{...expenseBody,status:'approved'});
 globalThis.__processSession=session;
 await assert.rejects(()=>databaseProcess.tenantUpdate('expenses',expenseId,{...expenseBody,amount:99,status:'submitted'}),e=>e.code==='expense_locked');
 const expenseInvoice=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-EXPENSE',p_items:[{description:'Fixture meal',quantity:1,unit_price:42,expense_ids:[expenseId]}]});
 assert.equal((await db.query('select invoiced_invoice_id from expenses where id=$1',[expenseId])).rows[0].invoiced_invoice_id,expenseInvoice.id);
 await assert.rejects(()=>globalThis.__processTransaction(demo,c=>mutateApiBusiness(c,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-EXPENSE-DUP',p_items:[{description:'Fixture meal',quantity:1,unit_price:42,expense_ids:[expenseId]}]})),e=>e.code==='expenses_changed');
 assert.equal((await db.query("select count(*)::int n from invoices where invoice_no='FLOW-EXPENSE-DUP'")).rows[0].n,0,'Failed duplicate billing rolls back the invoice');
 const reimbursementSource=(await fs.readFile('app/api/expenses/[id]/reimbursement/route.ts','utf8')).replace('"@/lib/server/plan-access"',JSON.stringify(dataModule('export async function requireModuleEntitlement(){}'))).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/session"',JSON.stringify(processSession)).replace('"@/lib/server/rbac"',JSON.stringify(processRbac)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/server/audit"',JSON.stringify(audit));
 const reimburse=await import(dataModule(reimbursementSource));
 globalThis.__processSession={...session,role:'member'};
 assert.equal((await reimburse.POST({body:{reference:'fixture-transfer'}},{params:Promise.resolve({id:expenseId})})).status,403);
 assert.equal((await db.query('select reimbursed_at from expenses where id=$1',[expenseId])).rows[0].reimbursed_at,null);
 globalThis.__processSession={...session,role:'finance'};
 assert.equal((await reimburse.POST({body:{reference:'fixture-transfer'}},{params:Promise.resolve({id:expenseId})})).status,200);
 assert.equal((await reimburse.POST({body:{reference:'fixture-transfer'}},{params:Promise.resolve({id:expenseId})})).status,200);
 assert.equal((await reimburse.POST({body:{reference:'another-transfer'}},{params:Promise.resolve({id:expenseId})})).status,409);
 // The real team GET must read the entitlement/subscription tables and return names.
 globalThis.__processSession=session;
 const invitePasswords=dataModule((await fs.readFile('lib/server/password.ts','utf8')).replace('import "server-only";',''));
 const inviteMail=dataModule('export function mailLayout(title,body,cta){return body+cta.url} export async function sendMail(mail){globalThis.__invitationMails.push(mail);if(globalThis.__invitationMailMode==="uncertain")throw new Error("ambiguous transport");return {delivered:globalThis.__invitationMailMode!=="unavailable"}}');
 let invitationServiceSource=(await fs.readFile('lib/server/invitations.ts','utf8')).replace('import "server-only";','');
 for(const [specifier,url] of Object.entries({'./http':processHttp,'./db':processDb,'./password':invitePasswords,'./email':inviteMail,'./env':dataModule('export const env={appUrl:"https://fixture.invalid"}'),'./rbac':processRbac,'./audit':audit,'./business-idempotency':idempotencyModule})){invitationServiceSource=invitationServiceSource.replaceAll(JSON.stringify(specifier),JSON.stringify(url));}
 const invitationService=dataModule(invitationServiceSource);
 globalThis.__invitationMails=[];globalThis.__invitationMailMode='accepted';
 const teamSource=(await fs.readFile('app/api/settings/team/invitations/route.ts','utf8')).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/session"',JSON.stringify(processSession)).replace('"@/lib/server/rbac"',JSON.stringify(processRbac)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/server/invitations"',JSON.stringify(invitationService));
 const team=await import(dataModule(teamSource));const teamResult=await team.GET();assert.equal(teamResult.status,200);assert.ok(teamResult.data.members.every(m=>m.email&&m.name));assert.equal(teamResult.data.capacityConfigured,false,"Missing subscription cannot imply a guessed seat quota");assert.equal(teamResult.data.userLimit,null);assert.equal(teamResult.data.plan,"unknown");
 await db.query("select set_config('app.organization_id',$1,false)",[demo]);
 await globalThis.__processTransaction(demo,c=>c.query("insert into organization_entitlements(organization_id,max_users) values($1,50) on conflict(organization_id) do update set max_users=50",[demo]));
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'starter','active') on conflict(organization_id) do nothing",[demo]);
 const invitationPlanBefore=(await db.query('select plan from organization_subscriptions where organization_id=$1',[demo])).rows[0].plan;
 await db.query("update organization_subscriptions set plan='professional' where organization_id=$1",[demo]);
 assert.equal((await team.GET()).data.userLimit,null,'Pro ignores the old stored finite quota');
 for(const [storedPlan,plan,limit] of [['starter','start',3],['business','business',15],['professional','pro',null]]){await db.query('update organization_subscriptions set plan=$2 where organization_id=$1',[demo,storedPlan]);const projection=(await team.GET()).data;assert.equal(projection.plan,plan,'Team API uses the canonical visible tariff');assert.equal(projection.userLimit,limit);}

 const inviteRequest=(email,role,key)=>({body:{email,role},headers:new Headers({'Idempotency-Key':key})});
 const quotaSnapshot=(await db.query('select to_jsonb(e) value from organization_entitlements e where organization_id=$1',[demo])).rows[0].value;
 await db.query('delete from organization_entitlements where organization_id=$1',[demo]);
 const unknownQuota=(await team.GET()).data;assert.equal(unknownQuota.capacityConfigured,false);assert.equal(unknownQuota.userLimit,null);assert.equal(unknownQuota.plan,'unknown','Missing quota is neither a guessed Start quota nor unlimited Pro');
 assert.equal((await team.POST(inviteRequest('unknown-quota@fixture.invalid','member','unknown-quota-invite'))).status,409,'Unknown capacity cannot grant another seat');
 await db.query('insert into organization_entitlements select * from jsonb_populate_record(null::organization_entitlements,$1::jsonb)',[JSON.stringify(quotaSnapshot)]);
 assert.equal((await team.GET()).data.capacityConfigured,true);
 const foreignInvite=await team.POST(inviteRequest('billing-probe@example.invalid','member','invitation-foreign-identity'));
 assert.equal(foreignInvite.status,409,'A foreign company account cannot be invited into another company');
 assert.equal((await db.query("select count(*)::int n from organization_invitations where organization_id=$1 and email='billing-probe@example.invalid'",[demo])).rows[0].n,0,'Foreign identity rejection leaves no pending invitation');
 const atomicInvite=await team.POST(inviteRequest('atomic-invite@fixture.invalid','finance','invitation-atomic-fixture'));assert.equal(atomicInvite.status,201,JSON.stringify(atomicInvite));
 assert.equal((await team.POST(inviteRequest('atomic-invite@fixture.invalid','finance','invitation-atomic-fixture'))).data.id,atomicInvite.data.id);assert.equal(globalThis.__invitationMails.length,1,'A timeout replay does not send twice');
 assert.equal((await team.POST(inviteRequest('atomic-invite@fixture.invalid','reader','invitation-atomic-fixture'))).status,409,'A changed role cannot reuse a replay key');
 assert.equal((await team.POST(inviteRequest('atomic-invite@fixture.invalid','finance','invitation-other-key'))).status,409,'A fresh key cannot duplicate a pending invitation');
 globalThis.__invitationMailMode='unavailable';
 const unavailableInvite=await team.POST(inviteRequest('retry-invite@fixture.invalid','reader','invitation-retry-fixture'));assert.equal(unavailableInvite.status,503);
 const persistedInvite=(await db.query("select i.id,m.role,m.status,o.status delivery,t.metadata from organization_invitations i join mail_outbox o on o.entity_id=i.id::text and o.organization_id=i.organization_id join app_users u on u.email=i.email join organization_memberships m on m.user_id=u.id and m.organization_id=i.organization_id join auth_tokens t on t.user_id=u.id and t.organization_id=i.organization_id and t.metadata->>'invitation_id'=i.id::text where i.organization_id=$1 and i.email='retry-invite@fixture.invalid'",[demo])).rows[0];
 assert.equal(persistedInvite.delivery,'failed');assert.equal(persistedInvite.role,'reader');assert.equal(persistedInvite.status,'invited');assert.equal(persistedInvite.metadata.invitation_id,persistedInvite.id);
 globalThis.__invitationMailMode='accepted';assert.equal((await team.POST(inviteRequest('retry-invite@fixture.invalid','reader','invitation-retry-fixture'))).data.id,persistedInvite.id);
 globalThis.__invitationMailMode='uncertain';assert.equal((await team.POST(inviteRequest('uncertain-invite@fixture.invalid','member','invitation-uncertain-fixture'))).status,503);const attempts=globalThis.__invitationMails.length;
 globalThis.__invitationMailMode='accepted';assert.equal((await team.POST(inviteRequest('uncertain-invite@fixture.invalid','member','invitation-uncertain-fixture'))).status,409);assert.equal(globalThis.__invitationMails.length,attempts,'Ambiguous mail is never blindly sent again');
 globalThis.__processSession={...session,role:'member'};assert.equal((await team.POST(inviteRequest('forbidden-invite@fixture.invalid','admin','invitation-forbidden-fixture'))).status,403);globalThis.__processSession=session;
 // A database failure at the final outbox step rolls back identity, membership,
 // invitation and token. It must not leave a partially invited business user.
 await db.exec("create function reject_fixture_mail() returns trigger language plpgsql as $$ begin if new.recipient='rollback-invite@fixture.invalid' then raise exception 'synthetic outbox failure'; end if; return new; end $$; create trigger reject_fixture_mail before insert on mail_outbox for each row execute function reject_fixture_mail()");
 assert.equal((await team.POST(inviteRequest('rollback-invite@fixture.invalid','member','invitation-rollback-fixture'))).status,500);
 assert.equal((await db.query("select count(*)::int n from app_users where email='rollback-invite@fixture.invalid'")).rows[0].n,0);assert.equal((await db.query("select count(*)::int n from organization_invitations where email='rollback-invite@fixture.invalid'")).rows[0].n,0);
 await db.exec('drop trigger reject_fixture_mail on mail_outbox;drop function reject_fixture_mail()');
 await db.query('update organization_subscriptions set plan=$2 where organization_id=$1',[demo,invitationPlanBefore]);
 delete globalThis.__invitationMails;delete globalThis.__invitationMailMode;
 console.log('Atomic invitation identity/membership/token/outbox, same-key replay, failed-delivery recovery, ambiguous-delivery protection, roles and database rollback passed.');

 for(const table of ['organization_invitations','document_deliveries']){await db.exec('set role binso_runtime');await db.query("select set_config('app.platform_operator','',false)");await db.query("select set_config('app.organization_id',$1,false)",[sandbox]);assert.equal((await db.query('select * from '+table+' where organization_id=$1',[demo])).rows.length,0);await db.exec('reset role');}
 await db.query("select set_config('app.organization_id',$1,false)",[demo]);

 const processTime=(await db.query("insert into time_entries(organization_id,external_id,customer_id,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate) values($1,'process-time',$2,'Fixture person','employee','2026-10-06',2,'Fixture time',true,true,100) returning id",[demo,documentArgs.p_customer_id])).rows[0].id;
 const timeDraft=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-TIME',p_items:[{description:'Work',quantity:2,unit_price:100,time_entry_ids:[processTime]}]});
 assert.equal((await db.query('select invoiced_invoice_id from time_entries where id=$1',[processTime])).rows[0].invoiced_invoice_id,timeDraft.id);
 await changeDocumentStatus(client,session,timeDraft.number,'cancel','');
 assert.equal((await db.query('select invoiced_invoice_id from time_entries where id=$1',[processTime])).rows[0].invoiced_invoice_id,null,'Cancellation releases time for a corrected invoice');
 // Actual PDF generator, including the full Swiss QR page.
 const pdfSource=(await fs.readFile('lib/server/document-pdf.ts','utf8')).replace('import "server-only";','').replace('"@/lib/locales"',JSON.stringify(await localeTestModuleUrl())).replace('"pdfkit"',JSON.stringify(new URL('../node_modules/pdfkit/js/pdfkit.js',import.meta.url).href)).replace('"swissqrbill/pdf"',JSON.stringify(new URL('../node_modules/swissqrbill/lib/esm/pdf/index.js',import.meta.url).href)).replace('"@/lib/qr-bill"',JSON.stringify(qrModule)).replace('"@/lib/financial-status"',JSON.stringify(financialModule));
 const pdfModule=dataModule(pdfSource);const {documentPdf}=await import(pdfModule);
 const pdfInvoice=(await listApiBusiness(client,session,'documents','number=eq.'+pending.number))[0];
 const draftPdf=await documentPdf(pdfInvoice,company);
 const generatedPdf=await documentPdf({...pdfInvoice,status:'sent'},company);
 assert.ok(draftPdf.length<generatedPdf.length,'Draft PDF never exposes a payable QR code');
 assert.ok(generatedPdf.toString('latin1').includes('/FontFile2'),'The real PDF embeds font outlines for consistent preview/download typography');
 assert.ok(generatedPdf.toString('latin1').includes('+LiberationSans-Bold')&&generatedPdf.toString('latin1').includes('+LiberationSans'),'The PDF includes regular and bold faces');
 if(process.env.BINSO_PDF_QA_DIR){await fs.mkdir(process.env.BINSO_PDF_QA_DIR,{recursive:true});for(const [name,doc] of [['invoice',{...pdfInvoice,status:'sent'}],['partial',{...pdfInvoice,status:'partial',paid_amount:100}],['draft',pdfInvoice],['long',{...pdfInvoice,status:'sent',items:Array.from({length:75},(_,i)=>({...pdfInvoice.items[0],description:'Position '+(i+1)+' – professionelle Beratung und Implementation'}))}],['oversized',{...pdfInvoice,status:'sent',items:[{...pdfInvoice.items[0],description:'Lange Beschreibung mit vollständigem Inhalt. '.repeat(300)+'ENDMARKER'}]}]])await fs.writeFile(process.env.BINSO_PDF_QA_DIR+'/'+name+'.pdf',await documentPdf(doc,company));}
 assert.equal(generatedPdf.subarray(0,4).toString(),'%PDF');assert.ok(generatedPdf.length>10000);assert.ok(generatedPdf.toString('latin1').includes('/Count 2'),'Payable invoice and QR slip occupy separate A4 pages');
 const cancelledPdf=await documentPdf((await listApiBusiness(client,session,'documents','number=eq.'+timeDraft.number))[0],company);assert.ok(cancelledPdf.length<generatedPdf.length,'Cancelled document has no payable QR code');
 const previewSource=(await fs.readFile('app/api/documents/preview/route.ts','utf8')).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/session"',JSON.stringify(processSession)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/server/rbac"',JSON.stringify(processRbac)).replace('"@/lib/server/plan-access"',JSON.stringify(dataModule('export async function requireModuleEntitlement(){}'))).replace('"@/lib/server/document-pdf"',JSON.stringify(pdfModule)).replace('"@/lib/server/document-logo"',JSON.stringify(dataModule('export async function documentLogo(){return undefined}')));
 const previewRoute=await import(dataModule(previewSource));
 const previewBody={kind:'Rechnung',customerId:documentArgs.p_customer_id,number:'PREVIEW',date:'2026-10-08',due:'30',currency:'CHF',positions:[{description:'Draft preview',quantity:2,price:100,vatRate:8.1}]};
 const beforePreview=Number((await db.query('select count(*) n from invoices where organization_id=$1',[demo])).rows[0].n);
 const previewResponse=await previewRoute.POST({body:previewBody});assert.equal(previewResponse.status,200);assert.equal(Buffer.from(await previewResponse.arrayBuffer()).subarray(0,4).toString(),'%PDF');
 assert.equal(Number((await db.query('select count(*) n from invoices where organization_id=$1',[demo])).rows[0].n),beforePreview,'Preview does not persist or finalize an invoice');
 assert.equal((await previewRoute.POST({body:{...previewBody,customerId:clonedCustomer.id}})).status,404,'Preview cannot read another tenant customer');
 assert.equal((await previewRoute.POST({body:{...previewBody,positions:[{quantity:-1,price:100}]}})).status,400);
 globalThis.__sendCount=0;globalThis.__sendFail=false;
 const mailFixture=dataModule(`export const mailLayout=(title,body)=>title+body;export async function sendMail(mail){globalThis.__sendCount++;globalThis.__lastMail=mail;if(!mail.attachments[0].content.subarray(0,4).toString().includes('%PDF'))throw Error('Missing PDF');if(globalThis.__sendFail)throw Error('Fixture provider failure');return {delivered:true}}`);
 const domainModule=dataModule(await fs.readFile('config/domain.ts','utf8'));
 const reminderModule=dataModule((await fs.readFile('lib/payment-reminder.ts','utf8')).replace("'@/config/domain'",JSON.stringify(domainModule)).replace("'./financial-status'",JSON.stringify(financialModule)));
 const localeConfigModule=dataModule(await fs.readFile('lib/locales/config.ts','utf8'));
 const mailLocaleModule=dataModule((await fs.readFile('lib/locales/index.ts','utf8')).replace("import catalogue from './messages.json';",'const catalogue='+await fs.readFile('lib/locales/messages.json','utf8')+';').replace('import pluralCatalogue from "./plurals.json";','const pluralCatalogue='+await fs.readFile('lib/locales/plurals.json','utf8')+';').replace('import templateCatalogue from "./templates.json";','const templateCatalogue='+await fs.readFile('lib/locales/templates.json','utf8')+';').replaceAll('"./config"',JSON.stringify(localeConfigModule)));
 const sendSource=(await fs.readFile('app/api/documents/[number]/send/route.ts','utf8')).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/session"',JSON.stringify(processSession)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/server/document-process"',JSON.stringify(dataModule(processSource))).replace('"@/lib/server/repositories/business-api"',JSON.stringify(businessUrlForProcess())).replace('"@/lib/server/document-pdf"',JSON.stringify(pdfModule)).replace('"@/lib/server/document-logo"',JSON.stringify(dataModule('export async function documentLogo(){return undefined}'))).replace('"@/lib/server/email"',JSON.stringify(mailFixture)).replace('"@/lib/server/audit"',JSON.stringify(audit)).replace('"@/lib/payment-reminder"',JSON.stringify(reminderModule)).replace('"@/lib/financial-status"',JSON.stringify(financialModule)).replace('"@/config/domain"',JSON.stringify(domainModule)).replace('"@/lib/locales"',JSON.stringify(mailLocaleModule));
 const sender=await import(dataModule(sendSource));
 const sendInvoice=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-SEND'});
 const sendRequest={body:{recipient:'fixture@example.invalid',requestKey:'send-success'}};
 globalThis.__processSession={...session,isDemo:false};
 assert.equal((await sender.POST(sendRequest,{params:Promise.resolve({number:sendInvoice.number})})).status,409,'Draft sends are blocked before any mail or delivery record');
 assert.equal(globalThis.__sendCount,0);
 await changeDocumentStatus(client,session,sendInvoice.number,'issue','');
 assert.equal((await sender.POST(sendRequest,{params:Promise.resolve({number:sendInvoice.number})})).status,200);
 assert.equal((await sender.POST(sendRequest,{params:Promise.resolve({number:sendInvoice.number})})).status,200);
 assert.equal(globalThis.__sendCount,1,'Identical send requests deliver once');
 assert.equal((await db.query('select status from invoices where id=$1',[sendInvoice.id])).rows[0].status,'sent');
 const failedInvoice=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-SEND-FAIL'});globalThis.__sendFail=true;
 await changeDocumentStatus(client,session,failedInvoice.number,'issue','');
 const failedRequest={body:{recipient:'fixture@example.invalid',requestKey:'send-failure'}};
 assert.equal((await sender.POST(failedRequest,{params:Promise.resolve({number:failedInvoice.number})})).status,502);
 assert.equal((await db.query('select status from invoices where id=$1',[failedInvoice.id])).rows[0].status,'sent');
 assert.equal((await sender.POST(failedRequest,{params:Promise.resolve({number:failedInvoice.number})})).status,409);
 assert.equal(globalThis.__sendCount,2,'Unconfirmed sends do not retry automatically');
 globalThis.__sendFail=false;
 const reminderInvoice=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-REMINDER'});
 await changeDocumentStatus(client,session,reminderInvoice.number,'issue','');
 await db.query("update invoices set due_date=current_date-1,paid_amount=20,status='partial' where id=$1",[reminderInvoice.id]);
 await db.query("insert into credit_notes(organization_id,external_id,credit_no,invoice_id,customer_id,credit_date,amount,reason) values($1,'reminder-credit','GS-REMINDER',$2,$3,current_date,16.2,'Fixture')",[demo,reminderInvoice.id,documentArgs.p_customer_id]);
 const previousLanguage=(await db.query('select language from customers where id=$1',[documentArgs.p_customer_id])).rows[0].language;
 await db.query("update customers set language='fr' where id=$1",[documentArgs.p_customer_id]);
 const reminderRequest=key=>({body:{recipient:'fixture@example.invalid',requestKey:key,purpose:'reminder'}});
 const reminderParams={params:Promise.resolve({number:reminderInvoice.number})};
 const sendCountBefore=globalThis.__sendCount;
 assert.equal((await sender.POST(reminderRequest('reminder-first'),reminderParams)).status,200);
 assert.match(globalThis.__lastMail.subject,/Rappel de paiement/,'Customer language is used for transactional delivery');
 assert.match(globalThis.__lastMail.text,/CHF 180.00/,'Reminder states only the remaining balance after payment and credit');
 assert.equal((await sender.POST(reminderRequest('reminder-first'),reminderParams)).status,200);
 assert.equal(globalThis.__sendCount,sendCountBefore+1,'A reminder replay does not send again');
 assert.equal((await sender.POST({body:{recipient:'fixture@example.invalid',requestKey:'reminder-first',purpose:'document'}},reminderParams)).status,409,'A replay key cannot change the delivery purpose');
 const tooSoon=await sender.POST(reminderRequest('reminder-second-too-soon'),reminderParams);
 assert.equal(tooSoon.status,409);assert.equal(tooSoon.data.error,'reminder_too_soon');
 let reminderHistory=(await listApiBusiness(client,session,'documents','id=eq.'+reminderInvoice.id))[0].reminders;
 assert.equal(reminderHistory.length,1);assert.equal(reminderHistory[0].stage,1);assert.equal(Number(reminderHistory[0].amount),180);assert.equal(reminderHistory[0].status,'sent');
 assert.equal((await db.query("select count(*)::int n from audit_events where organization_id=$1 and entity_id=$2 and action='invoice.reminder.sent'",[demo,reminderInvoice.id])).rows[0].n,1);
 // Synthetic clock/history progression only. No real emails or production rows.
 await db.query("update document_deliveries set payment_deadline=current_date-1 where organization_id=$1 and document_id=$2 and purpose='reminder'",[demo,reminderInvoice.id]);
 assert.equal((await sender.POST(reminderRequest('reminder-second'),reminderParams)).status,200);
 await db.query("update document_deliveries set payment_deadline=current_date-1 where organization_id=$1 and document_id=$2 and purpose='reminder'",[demo,reminderInvoice.id]);
 assert.equal((await sender.POST(reminderRequest('reminder-third'),reminderParams)).status,200);
 assert.equal((await sender.POST(reminderRequest('reminder-fourth'),reminderParams)).data.error,'reminder_complete');
 assert.equal((await db.query("select max(reminder_stage) stage,max(balance_amount) amount from document_deliveries where organization_id=$1 and document_id=$2 and purpose='reminder'",[demo,reminderInvoice.id])).rows[0].stage,3);
 await db.query('update customers set language=$2 where id=$1',[documentArgs.p_customer_id,previousLanguage]);
 globalThis.__processSession={...session,role:'member',isDemo:false};assert.equal((await sender.POST(reminderRequest('reminder-denied-role'),reminderParams)).status,403);
 globalThis.__processSession={...session,organizationStatus:'read_only',isDemo:false};assert.equal((await sender.POST(reminderRequest('reminder-denied-readonly'),reminderParams)).status,403);
 globalThis.__processSession={...session,organizationId:sandbox,isDemo:false};assert.equal((await sender.POST(reminderRequest('reminder-denied-tenant'),reminderParams)).status,404);
 globalThis.__processSession={...session,isDemo:false};
 const paidReminder=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-PAID-REMINDER'});
 await changeDocumentStatus(client,session,paidReminder.number,'issue','');
 await db.query("update invoices set due_date=current_date-1,paid_amount=total_amount,status='paid' where id=$1",[paidReminder.id]);
 assert.equal((await sender.POST(reminderRequest('reminder-paid-block'),{params:Promise.resolve({number:paidReminder.number})})).data.error,'reminder_not_due');
 const changedReminder=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'FLOW-CHANGED-REMINDER'});
 await changeDocumentStatus(client,session,changedReminder.number,'issue','');
 await db.query("update invoices set due_date=current_date-1 where id=$1",[changedReminder.id]);
 const priorTransaction=globalThis.__processTransaction;
 const beforeChangedSend=globalThis.__sendCount;
 globalThis.__processTransaction=async(org,fn)=>{const result=await priorTransaction(org,fn);if(result?.reminder)await db.query("update invoices set paid_amount=10,status='partial' where id=$1",[changedReminder.id]);return result};
 try{assert.equal((await sender.POST(reminderRequest('reminder-changed'),{params:Promise.resolve({number:changedReminder.number})})).data.error,'reminder_changed');}finally{globalThis.__processTransaction=priorTransaction}
 assert.equal(globalThis.__sendCount,beforeChangedSend,'A payment arriving before dispatch prevents an obsolete reminder');
 assert.equal((await db.query("select status from document_deliveries where organization_id=$1 and request_key='reminder-changed'",[demo])).rows[0].status,'failed');
 const beforeFailedReminder=globalThis.__sendCount;globalThis.__sendFail=true;
 assert.equal((await sender.POST(reminderRequest('reminder-provider-failed'),{params:Promise.resolve({number:changedReminder.number})})).status,502);
 assert.equal((await sender.POST(reminderRequest('reminder-provider-failed'),{params:Promise.resolve({number:changedReminder.number})})).status,409);
 assert.equal(globalThis.__sendCount,beforeFailedReminder+1,'An ambiguous reminder provider response is never retried automatically');globalThis.__sendFail=false;
 console.log('Actual reminder endpoint: role/tenant/read-only, net balance, French mail, outbox/history/audit, replay/purpose conflicts, manual stages/deadlines, paid denial, concurrent payment and uncertain-provider handling passed.');
 globalThis.__processSession={...session,isDemo:true};
 assert.equal((await sender.POST({body:{recipient:'fixture@example.invalid',requestKey:'demo-block'}},{params:Promise.resolve({number:failedInvoice.number})})).status,403);
 delete globalThis.__sendCount;delete globalThis.__sendFail;delete globalThis.__lastMail;
 // Invitation activation is atomic, expires/revokes safely and never resets an existing password.
 const activationPlan=(await db.query('select plan from organization_subscriptions where organization_id=$1',[demo])).rows[0].plan;
 // Seat-limit countercases are exercised above. These identity/password cases
 // need room for the newly explicit, independent synthetic reviewers.
 await db.query("update organization_subscriptions set plan='professional' where organization_id=$1",[demo]);
 const passwords=dataModule((await fs.readFile('lib/server/password.ts','utf8')).replace('import "server-only";',''));const {hashPassword}=await import(passwords);
 const invitationSource=(await fs.readFile('app/api/auth/invitation/route.ts','utf8')).replace('"@/lib/money"',JSON.stringify(moneyModule)).replace('"@/lib/server/http"',JSON.stringify(processHttp)).replace('"@/lib/server/db"',JSON.stringify(processDb)).replace('"@/lib/server/password"',JSON.stringify(passwords)).replace('"@/lib/server/rate-limit"',JSON.stringify(dataModule('export async function enforceRateLimit(){}')));
 const invitationHandler=await import(dataModule(invitationSource));
 const {createHash}=await import('node:crypto');
 const seedInvitation=async(userId,email,status,password,token)=>{
  await db.query("insert into app_users(id,email,display_name,status,password_hash) values($1,$2,'Fixture invitee',$3,$4)",[userId,email,status,await hashPassword(password)]);
  await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'finance','invited')",[demo,userId,email]);
  const inv=(await db.query("insert into organization_invitations(organization_id,email,role,expires_at,created_by_user_id) values($1,$2,'finance',now()+interval '1 day','fixture') returning id",[demo,email])).rows[0].id;
  await db.query("insert into auth_tokens(user_id,organization_id,email,token_hash,token_type,metadata,expires_at) values($1,$2,$3,$4,'invitation',$5::jsonb,now()+interval '1 day')",[userId,demo,email,createHash('sha256').update(token).digest('hex'),JSON.stringify({invitation_id:inv})]);return inv;
 };
 await db.query("insert into organization_entitlements(organization_id,max_users) values($1,50) on conflict(organization_id) do update set max_users=50",[demo]);
 const originalPassword='Fixture original password 123';
 const newInvitation=await seedInvitation('flow-new-user','flow-new@example.invalid','invited',originalPassword,'flow-new-token');
 assert.equal((await invitationHandler.GET({nextUrl:new URL('https://example.invalid/?token=flow-new-token')})).data.existingAccount,false);
 assert.equal((await invitationHandler.POST({body:{token:'flow-new-token',password:'short'}})).status,400);
 const acceptedNew=await invitationHandler.POST({body:{token:'flow-new-token',password:'Fixture new password 456',name:'New colleague'}});assert.equal(acceptedNew.status,200,JSON.stringify(acceptedNew));
 assert.equal((await db.query('select role,status from organization_memberships where organization_id=$1 and user_id=$2',[demo,'flow-new-user'])).rows[0].role,'finance');
 assert.equal((await db.query('select status from organization_invitations where id=$1',[newInvitation])).rows[0].status,'accepted');
 assert.equal((await invitationHandler.POST({body:{token:'flow-new-token',password:'Fixture new password 456'}})).status,400);
 const existingInvitation=await seedInvitation('flow-existing-user','flow-existing@example.invalid','active',originalPassword,'flow-existing-token');
 const originalHash=(await db.query('select password_hash from app_users where id=$1',['flow-existing-user'])).rows[0].password_hash;
 assert.equal((await invitationHandler.POST({body:{token:'flow-existing-token',password:'Fixture wrong password 789'}})).status,403);
 assert.equal((await db.query('select status from organization_invitations where id=$1',[existingInvitation])).rows[0].status,'pending');
 assert.equal((await invitationHandler.POST({body:{token:'flow-existing-token',password:originalPassword}})).status,200);
 assert.equal((await db.query('select password_hash from app_users where id=$1',['flow-existing-user'])).rows[0].password_hash,originalHash);
 const revoked=await seedInvitation('flow-revoked-user','flow-revoked@example.invalid','invited',originalPassword,'flow-revoked-token');await db.query("update organization_invitations set status='revoked' where id=$1",[revoked]);
 assert.equal((await invitationHandler.POST({body:{token:'flow-revoked-token',password:originalPassword}})).status,400);
 await db.query('update organization_subscriptions set plan=$2 where organization_id=$1',[demo,activationPlan]);
 console.log('PDF/QR generation, send idempotency/failure/demo guards, cancellation release and new/existing/revoked invitation acceptance passed with synthetic fixtures only.');
 console.log('Team schema, entitlement limits, document status/locks/conversion, expense approval/reimbursement/billing and tenant isolation passed.');

 // Full business process and short paths use actual handlers against isolated PostgreSQL fixtures.
 const projectWorkspaceModule=dataModule((await fs.readFile('lib/server/repositories/project-workspace.ts','utf8')).replace("import 'server-only';",'').replaceAll("'@/lib/projects'",JSON.stringify(dataModule(await fs.readFile('lib/projects.ts','utf8')))).replaceAll("'@/lib/permissions'",JSON.stringify(permissions)).replaceAll("'@/lib/server/http'",JSON.stringify(processHttp)).replaceAll("'@/lib/server/rbac'",JSON.stringify(processRbac)).replaceAll("'@/lib/server/audit'",JSON.stringify(audit)));
 const reportRepoModule=dataModule((await fs.readFile('lib/server/repositories/reports.ts','utf8')).replace("import 'server-only';",'').replaceAll("'@/lib/permissions'",JSON.stringify(permissions)).replaceAll("'@/lib/server/rbac'",JSON.stringify(processRbac)).replaceAll("'@/config/plan-access'",JSON.stringify(planAccessModuleUrl)));
 const reportExportModule=dataModule((await fs.readFile('lib/report-export.ts','utf8')).replace("'./projects'",JSON.stringify(dataModule(await fs.readFile('lib/projects.ts','utf8')))));
 const reportPeriodModule=dataModule((await fs.readFile('lib/statistics-period.ts','utf8')).replace("'./money'",JSON.stringify(moneyModule)));
 const reportLocaleModule=dataModule("export const asLocale=v=>['de','fr','it','en'].includes(v)?v:'de';export const localeCookie='binso_locale';export const translateMessage=(v,locale)=>locale==='fr'?'FR:'+v:v;");
 const actualPlanModule=dataModule((await fs.readFile('lib/server/plan-access.ts','utf8')).replace('import "server-only";','').replace('"@/lib/server/db"',JSON.stringify(processDb)).replace("'./http'",JSON.stringify(processHttp)).replace('"@/config/plan-access"',JSON.stringify(planAccessModuleUrl)));
 const loadProcessRoute=async path=>{let source=await fs.readFile(path,'utf8');for(const [specifier,url] of Object.entries({'@/lib/server/repositories/notifications':dataModule((await fs.readFile('lib/server/repositories/notifications.ts','utf8')).replace("import 'server-only';",'').replace("'@/lib/permissions'",JSON.stringify(permissions))),'@/lib/server/database':dataModule(databaseSource),'@/config/notification-channels':dataModule(await fs.readFile('config/notification-channels.ts','utf8')),'@/config/plan-access':planAccessModuleUrl,'@/lib/server/repositories/dashboard':dashboardModule,'@/lib/server/repositories/financial-summary':sharedSummaryModule,'@/lib/server/repositories/finance':financeModule,'@/lib/server/repositories/business-api':businessModule,'@/lib/projects':dataModule(await fs.readFile('lib/projects.ts','utf8')),'@/lib/server/plan-access':dataModule("export {requireProjectCapacity,requireModuleEntitlement} from "+JSON.stringify(actualPlanModule)+"; export const getOrganizationPlan=async()=>globalThis.__processReportPlan??'pro'"),'@/lib/server/repositories/reports':reportRepoModule,'@/lib/report-export':reportExportModule,'@/lib/financial-status':financialModule,'@/lib/statistics-period':reportPeriodModule,'@/lib/locales':reportLocaleModule,'@/lib/server/file-access':dataModule((await fs.readFile('lib/server/file-access.ts','utf8')).replace('import "server-only";','').replace('"./env"',JSON.stringify(dataModule('export const env={}')))),'@/lib/server/workforce-access':workforceModule,'@/lib/server/repositories/project-workspace':projectWorkspaceModule,'@/lib/money':moneyModule,'@/lib/server/http':processHttp,'@/lib/server/session':processSession,'@/lib/server/db':processDb,'@/lib/server/rbac':processRbac,'@/lib/server/audit':audit,'@/lib/server/business-idempotency':idempotencyModule,'@/lib/permissions':permissions,'@/lib/server/validation':dataModule(await fs.readFile('lib/server/validation.ts','utf8').then(source=>source.replace('import "server-only";','').replace('"./http"',JSON.stringify(processHttp))))})){source=source.replaceAll(JSON.stringify(specifier),JSON.stringify(url)).replaceAll("'"+specifier+"'",JSON.stringify(url));}return import(dataModule(source));};
 const financeWorkspaceHandler=await loadProcessRoute('app/api/finance/overview/route.ts');
 for(const role of ['owner','admin','finance','hr','project_manager','member','reader']){
  globalThis.__processSession={...session,role};
  const response=await financeWorkspaceHandler.GET({nextUrl:new URL('https://fixture.invalid/api/finance/overview?include=workspace&view=cash')});
  if(['member','hr'].includes(role)){assert.equal(response.status,403,'Documents-only roles must not obtain a finance workspace');continue;}
  assert.equal(response.status,200,'Finance workspace must expose permitted sections for '+role);
  assert.equal(response.data.cash!==null,['owner','admin','finance'].includes(role),'No accounting data for '+role);
 }
 globalThis.__processSession={...session,role:'unknown'};
 assert.equal((await financeWorkspaceHandler.GET({nextUrl:new URL('https://fixture.invalid/api/finance/overview?include=workspace')})).status,403);
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional'",[demo]);

 const dashboardHandler=await loadProcessRoute('app/api/dashboard/route.ts');
 for(const role of ['owner','admin','finance','hr','project_manager','member','reader']){
  globalThis.__processSession={...session,role};
  const response=await dashboardHandler.GET();assert.equal(response.status,200,JSON.stringify(response));
  assert.equal(response.data.cash!==null,['owner','admin','finance'].includes(role));
  if(!['owner','admin','project_manager'].includes(role))assert.equal(response.data.work.timeReviews,null,'No review queue for '+role);
  if(!['owner','admin','finance','reader'].includes(role))assert.deepEqual(response.data.attention,[],'No invoice attention for '+role);
  if(role==='hr')assert.equal(response.data.stats.customer_count,null,'HR has no customer count');
 }
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const preferencesHandler=await loadProcessRoute('app/api/settings/notifications/route.ts');
 assert.equal((await preferencesHandler.PATCH({body:{kind:'Support',channel:'push',enabled:true}})).status,409,'An unimplemented push sender cannot be advertised as active');
 assert.equal((await preferencesHandler.GET()).data.channels.push,false);
 const projectHandler=await loadProcessRoute('app/api/projects/route.ts');
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const projectCreated=await projectHandler.POST({body:{name:'Cloud Migration',customerId:documentArgs.p_customer_id,sourceOffer:processQuote.number}});
 assert.equal(projectCreated.status,201,JSON.stringify(projectCreated));
 const projectReplay=await projectHandler.POST({body:{name:'Cloud Migration',customerId:documentArgs.p_customer_id,sourceOffer:processQuote.number}});
 assert.equal(projectCreated.data.item.id,projectReplay.data.item.id,'An offer starts exactly one project');
 const internalProjectRequest={headers:new Headers({'idempotency-key':'internal-project-fixture-key'}),body:{name:'Internal project with a lost response'}};
 const internalCreated=await projectHandler.POST(internalProjectRequest);assert.equal(internalCreated.status,201);
 const internalReplay=await projectHandler.POST(internalProjectRequest);assert.equal(internalReplay.status,201);assert.equal(internalReplay.data.item.id,internalCreated.data.item.id,'Retrying after a lost response returns the original internal project');
 assert.equal((await db.query('select count(*)::int n from projects where organization_id=$1 and name=$2',[demo,internalProjectRequest.body.name])).rows[0].n,1,'The replay never creates a second project');
 assert.equal((await projectHandler.POST({...internalProjectRequest,body:{name:'Changed payload'}})).status,409,'A replay key cannot be reused for different project data');

 // Isolate nested handler rollbacks from this outer synthetic setup transaction.
 const capacityTransaction=globalThis.__processTransaction;
 await db.exec('begin');
 globalThis.__processTransaction=async(org,fn)=>{await db.exec('savepoint capacity_request');try{await db.query("select set_config('app.organization_id',$1,true)",[org]);const result=await fn(client);await db.exec('release savepoint capacity_request');return result}catch(error){await db.exec('rollback to savepoint capacity_request; release savepoint capacity_request');throw error}};
 try{
  await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[demo]);
  await db.query("insert into projects(organization_id,external_id,name,status) select $1,'capacity-'||n,'Synthetic capacity '||n,'active' from generate_series(1,greatest(0,100-(select count(*)::int from projects where organization_id=$1 and archived_at is null))) n",[demo]);
  const before=Number((await db.query('select count(*) n from projects where organization_id=$1 and archived_at is null',[demo])).rows[0].n);
  assert.equal((await projectHandler.POST({body:{name:'Over the protected limit'}})).status,409,'Project writes enforce the actual plan limit in the write transaction');
  assert.equal(Number((await db.query('select count(*) n from projects where organization_id=$1 and archived_at is null',[demo])).rows[0].n),before,'Denied creation writes no project');
  assert.equal((await projectHandler.POST(internalProjectRequest)).data.item.id,internalCreated.data.item.id,'An existing idempotent result remains available even at capacity');
 }finally{globalThis.__processTransaction=capacityTransaction;await db.exec('rollback')}
 assert.equal((await projectHandler.POST({body:{name:'Wrong tenant',customerId:'10000000-0000-4000-8000-000000000002',sourceOffer:processQuote.number}})).status,409);
 const projectDetailHandler=await loadProcessRoute('app/api/projects/[id]/route.ts');
 const projectParams={params:Promise.resolve({id:projectCreated.data.item.id})};
 const projectWorkspaceResult=await projectDetailHandler.GET({},projectParams);assert.equal(projectWorkspaceResult.status,200,JSON.stringify(projectWorkspaceResult));assert.equal(projectWorkspaceResult.data.item.name,'Cloud Migration');
 const projectPage=await projectHandler.GET({nextUrl:new URL('https://fixture.invalid/api/projects?limit=1&q=Cloud')});assert.equal(projectPage.status,200,JSON.stringify(projectPage));assert.equal(projectPage.data.items.length,1);assert.ok(projectPage.data.total>=1);
 assert.equal((await projectHandler.GET({nextUrl:new URL('https://fixture.invalid/api/projects?limit=0')})).status,400);
 assert.equal((await projectHandler.GET({nextUrl:new URL('https://fixture.invalid/api/projects?order=unsafe.sql')})).status,400);
 const updateBody={name:'Cloud Migration',notes:'Reviewed project notes',status:'active',hoursBudget:120,version:projectWorkspaceResult.data.item.version};
 const updatedProject=await projectDetailHandler.PATCH({body:updateBody},projectParams);assert.equal(updatedProject.status,200,JSON.stringify(updatedProject));assert.equal(updatedProject.data.item.version,updateBody.version+1);
 assert.equal((await projectDetailHandler.PATCH({body:updateBody},projectParams)).status,409,'An old project version cannot overwrite a newer update');
 const savedProjectSession=globalThis.__processSession;globalThis.__processSession={...savedProjectSession,organizationId:sandbox};
 assert.equal((await projectDetailHandler.GET({},projectParams)).status,404,'Foreign project direct ID is hidden');assert.equal((await projectDetailHandler.PATCH({body:{...updateBody,version:updatedProject.data.item.version}},projectParams)).status,404);
 globalThis.__processSession={...savedProjectSession,role:'member',userId:'unrelated-project-worker'};
 const memberWorkspace=await projectDetailHandler.GET({},projectParams);assert.equal(memberWorkspace.status,200);assert.equal(Number(memberWorkspace.data.totals.hours),0);assert.equal(memberWorkspace.data.invoices,null);assert.equal(memberWorkspace.data.item.source_offer,null,'Quote identifiers require sales read permission');assert.equal((await projectDetailHandler.PATCH({body:updateBody},projectParams)).status,403);
 globalThis.__processSession={...savedProjectSession,role:'reader'};const readerWorkspace=await projectDetailHandler.GET({},projectParams);assert.equal(readerWorkspace.data.time,null,'A project reader without time permission cannot see time records');const readerProjects=await projectHandler.GET({nextUrl:new URL('https://fixture.invalid/api/projects?limit=1')});assert.equal(readerProjects.status,200);assert.equal(readerProjects.data.items[0].hours,null,'Project lists mask time totals without time permissions');
 globalThis.__processSession=savedProjectSession;
 console.log('Project workspace: paged search, filter validation, optimistic versions, tenant direct-ID denial, role denial and time/invoice masking passed.');
 const timeCreated=await manualTimeHandler.POST({headers:new Headers(),body:{projectId:projectCreated.data.item.id,description:'Migration and rollout',durationMinutes:750,startedAt:'2026-10-01',billable:true,salesRate:180}});
 assert.equal(timeCreated.status,201,JSON.stringify(timeCreated));assert.equal(timeCreated.data.item.customer_id,documentArgs.p_customer_id,'Project supplies customer without redundant selection');
 const ownerProjectTime=await projectDetailHandler.GET({},projectParams);assert.equal(Number(ownerProjectTime.data.totals.hours),12.5);
 globalThis.__processSession={...savedProjectSession,role:'member',userId:'unrelated-project-worker'};const otherWorkerProject=await projectDetailHandler.GET({},projectParams);assert.equal(otherWorkerProject.data.time.length,0);assert.equal(Number(otherWorkerProject.data.totals.hours),0,'Another worker cannot see project time aggregates');
 globalThis.__processSession={...savedProjectSession,role:'member'};assert.equal(Number((await projectDetailHandler.GET({},projectParams)).data.totals.hours),12.5,'Own worker time remains visible');globalThis.__processSession=savedProjectSession;
 const projectRepository=await import(projectWorkspaceModule);
 await assert.rejects(()=>globalThis.__processTransaction(demo,c=>projectRepository.updateProject({query:(sql,args)=>{if(sql.includes('insert into audit_events'))throw Error('synthetic project audit failure');return c.query(sql,args)}},savedProjectSession,projectCreated.data.item.id,{...updateBody,name:'Must roll back',version:updatedProject.data.item.version})),/synthetic project audit failure/);
 assert.equal((await projectDetailHandler.GET({},projectParams)).data.item.name,'Cloud Migration','Project edits roll back if audit insertion fails');
 await db.query("insert into app_users(id,email,display_name,status) values($1,'project-timer@fixture.invalid','Project Timer','active') on conflict(id) do nothing",[savedProjectSession.userId]);
 const projectTimer=await loadProcessRoute('app/api/time-tracker/route.ts');
 const startedProjectTimer=await projectTimer.POST({body:{action:'start',project:'Cloud Migration',projectId:projectCreated.data.item.id}});assert.equal(startedProjectTimer.status,200,JSON.stringify(startedProjectTimer));
 const closingBody={...updateBody,version:updatedProject.data.item.version,status:'completed'};
 assert.equal((await projectDetailHandler.PATCH({body:closingBody},projectParams)).status,409,'A running timer prevents closing the project');
 await db.query('update active_time_trackers set accumulated_seconds=60,active_since=now() where organization_id=$1 and user_id=$2',[demo,savedProjectSession.userId]);assert.equal((await projectTimer.POST({body:{action:'finish'}})).status,200);
 const closedProject=await projectDetailHandler.PATCH({body:closingBody},projectParams);assert.equal(closedProject.status,200);
 assert.equal((await manualTimeHandler.POST({headers:new Headers(),body:{projectId:projectCreated.data.item.id,durationMinutes:60,startedAt:'2026-10-01'}})).status,409,'Closed projects cannot receive new manual time');
 assert.equal((await projectTimer.POST({body:{action:'start',project:'Cloud Migration',projectId:projectCreated.data.item.id}})).status,409,'Closed projects cannot start new timers');
 assert.equal((await projectDetailHandler.PATCH({body:{...updateBody,version:closedProject.data.item.version}},projectParams)).status,200,'Authorized users can reopen a project without losing recorded work');
 const timeReview=await loadProcessRoute('app/api/time-entries/[id]/route.ts');
 const submitted=await timeReview.PATCH({body:{action:'submit'}},{params:Promise.resolve({id:timeCreated.data.item.id})});assert.equal(submitted.status,200,JSON.stringify(submitted));assert.ok(submitted.data.item.submitted_at);
 assert.equal((await timeReview.PATCH({body:{action:'approve'}},{params:Promise.resolve({id:timeCreated.data.item.id})})).status,403,'Self approval is forbidden');
 const timeAuthor=globalThis.__processSession;
 globalThis.__processSession={...timeAuthor,userId:'independent-time-reviewer'};
 assert.equal((await timeReview.PATCH({body:{action:'approve'}},{params:Promise.resolve({id:timeCreated.data.item.id})})).status,200);
 globalThis.__processSession=timeAuthor;
 const serviceArgs={...documentArgs,p_number:'PROCESS-TIME-INVOICE',p_items:[{description:'IT-Support September',quantity:12.5,unit:'Std.',unit_price:180,vat_rate:8.1,time_entry_ids:[timeCreated.data.item.id]},{description:'A long description for the rollout of adapters and workplace connectivity',quantity:2,unit:'Stück',unit_price:60,vat_rate:8.1}]};
 const atomic=(operation,args)=>globalThis.__processTransaction(demo,c=>mutateApiBusiness(c,session,operation,args));
 const timeInvoice=await atomic('create_document_atomic',serviceArgs);assert.equal(Number(timeInvoice.total),2561.97);
 await assert.rejects(()=>atomic('create_document_atomic',{...serviceArgs,p_number:'PROCESS-TIME-DUP'}),e=>e.code==='time_entries_changed');
 assert.equal((await db.query('select count(*)::int n from invoices where organization_id=$1 and invoice_no=$2',[demo,'PROCESS-TIME-DUP'])).rows[0].n,0,'Failed double billing rolls back the whole invoice');
 assert.ok((await projectDetailHandler.GET({},projectParams)).data.invoices.some(item=>item.number===timeInvoice.number),'The project workspace resolves invoices linked through recorded time');
 const reportHandler=await loadProcessRoute('app/api/reports/route.ts');
 const reportRequest=(extra='')=>({nextUrl:new URL('https://fixture.invalid/api/reports?months=custom&from=2026-10-01&to=2026-10-31'+extra),cookies:{get:()=>({value:'de'})}});
 const ownerReport=await reportHandler.GET(reportRequest());assert.equal(ownerReport.status,200,JSON.stringify(ownerReport));assert.ok(Number(ownerReport.data.customers.total)>0);assert.ok(Number(ownerReport.data.time.hours)>=12.5);assert.ok(Array.isArray(ownerReport.data.payments));assert.ok(ownerReport.data.employees);
 globalThis.__processReportPlan='start';assert.equal((await reportHandler.GET(reportRequest())).data.employees,null,'Reports do not bypass the personnel plan entitlement');delete globalThis.__processReportPlan;
 assert.equal((await reportHandler.GET({nextUrl:new URL('https://fixture.invalid/api/reports?months=99')})).status,400);
 assert.equal((await reportHandler.GET({nextUrl:new URL('https://fixture.invalid/api/reports?months=custom&from=2020-01-01&to=2026-10-31')})).status,400);
 globalThis.__processSession={...savedProjectSession,role:'reader'};const readerReport=await reportHandler.GET(reportRequest());assert.equal(readerReport.status,200);assert.equal(readerReport.data.time,null);assert.equal(readerReport.data.payments,null);assert.equal(readerReport.data.employees,null);
 globalThis.__processSession={...savedProjectSession,role:'member'};assert.equal((await reportHandler.GET(reportRequest())).status,403);
 globalThis.__processSession=savedProjectSession;const csvReport=await reportHandler.GET(reportRequest('&format=csv'));assert.equal(csvReport.headers.get('Content-Type'),'text/csv; charset=utf-8');assert.ok(csvReport.headers.get('Cache-Control').includes('no-store'));assert.ok((await csvReport.text()).includes('Kennzahl'));
 const localizedCsv=await reportHandler.GET(reportRequest('&format=csv&lang=fr'));assert.ok((await localizedCsv.text()).includes('FR:Wert'), 'Every CSV header column is localized');
 const csvHelper=await import(reportExportModule);assert.ok(csvHelper.reportCsv([['=HYPERLINK("bad")','-12.50']]).includes("'="),'CSV text cannot become a spreadsheet formula');assert.ok(csvHelper.reportCsv([['  =HYPERLINK("bad")']]).includes("'  ="),'Leading whitespace cannot bypass CSV formula protection');assert.ok(csvHelper.reportCsv([['=HYPERLINK("bad")','-12.50']]).includes('"-12.50"'),'Exact negative decimals remain numeric');
 globalThis.__processSession={...savedProjectSession,organizationId:sandbox};const foreignReport=await reportHandler.GET(reportRequest());assert.equal(foreignReport.status,200);assert.notEqual(foreignReport.data.customers.total,ownerReport.data.customers.total,'Reports are scoped to the current company');globalThis.__processSession=savedProjectSession;
 console.log('Reports: bounded periods, role masking, company isolation and private formula-safe CSV export passed.');
 const unusedTime=await manualTimeHandler.POST({headers:new Headers(),body:{customerId:documentArgs.p_customer_id,description:'Direct customer work',durationMinutes:60,startedAt:'2026-10-01',billable:true,salesRate:180}});
 assert.equal((await timeReview.PATCH({body:{action:'submit'}},{params:Promise.resolve({id:unusedTime.data.item.id})})).status,200,'Time enters review before independent approval');
 globalThis.__processSession={...savedProjectSession,userId:'independent-time-reviewer'};assert.equal((await timeReview.PATCH({body:{action:'approve'}},{params:Promise.resolve({id:unusedTime.data.item.id})})).status,200);globalThis.__processSession=savedProjectSession;
 await assert.rejects(()=>atomic('create_document_atomic',{...serviceArgs,p_number:'PROCESS-INTRA-DUP',p_items:[{description:'One',quantity:1,unit_price:180,time_entry_ids:[unusedTime.data.item.id]},{description:'Two',quantity:1,unit_price:180,time_entry_ids:[unusedTime.data.item.id]}]}),e=>e.code==='duplicate_service');
 assert.equal((await db.query('select invoiced_invoice_id from time_entries where id=$1',[unusedTime.data.item.id])).rows[0].invoiced_invoice_id,null);
 await changeDocumentStatus(client,session,timeInvoice.number,'issue','');
 const paymentBase={p_invoice_id:timeInvoice.id,p_method:'bank',p_note:'Process payment'};
 await assert.rejects(()=>atomic('create_payment_idempotent',{...paymentBase,p_paid_on:'2026-10-01',p_amount:2561.98,p_idempotency_key:'process-overpay'}),e=>e.code==='payment_exceeds_balance');
 await atomic('create_payment_idempotent',{...paymentBase,p_paid_on:'2026-10-03',p_amount:1000,p_idempotency_key:'process-payment-1'});
 let reloaded=(await listApiBusiness(client,session,'documents','id=eq.'+timeInvoice.id))[0];assert.equal(reloaded.payment_status,'partial');assert.equal(reloaded.paid_on,null);assert.equal((await import(financialModule)).openAmount(reloaded),1561.97);
 await atomic('create_payment_idempotent',{...paymentBase,p_paid_on:'2026-10-01',p_amount:500,p_idempotency_key:'process-payment-2'});
 const finalArgs={...paymentBase,p_paid_on:'2026-10-06',p_amount:1061.97,p_idempotency_key:'process-payment-3'};const finalPayment=await atomic('create_payment_idempotent',finalArgs);assert.equal((await atomic('create_payment_idempotent',finalArgs)).id,finalPayment.id);
 reloaded=(await listApiBusiness(client,session,'documents','id=eq.'+timeInvoice.id))[0];assert.equal(reloaded.payment_status,'paid');assert.equal(reloaded.paid_on,'2026-10-06','Completion date comes from chronologically accumulated actual payments');
 await assert.rejects(()=>atomic('create_payment_idempotent',{...finalArgs,p_idempotency_key:'process-paid-duplicate',p_amount:1}),e=>e.code==='payment_exceeds_balance');
 assert.equal((await timeReview.PATCH({body:{action:'approve'}},{params:Promise.resolve({id:timeCreated.data.item.id})})).status,403,'Self-approval stays forbidden for invoiced time');


 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const reviewTotals=await dashboardWork(client,session);
 const timeQueue=await manualTimeHandler.GET({nextUrl:new URL('https://fixture.invalid/api/time-entries?review=1')});
 assert.equal(timeQueue.status,200);assert.equal(timeQueue.data.items.length,reviewTotals.timeReviews,'Dashboard count matches the server-side time review queue');
 assert.ok(timeQueue.data.items.every(row=>row.created_by_user_id!==session.userId&&row.submitted_at&&!row.approved));
 const expenseQueue=await listApiBusiness(client,session,'expenses','review=1');
 assert.equal(Number(expenseQueue[0]?.total_count??0),reviewTotals.expenseReviews,'Dashboard count matches the server-side expense review queue');
 globalThis.__processSession={...session,role:'member'};
 assert.equal((await manualTimeHandler.GET({nextUrl:new URL('https://fixture.invalid/api/time-entries?review=1')})).status,403);
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const reopenHandler=await loadProcessRoute('app/api/support/tickets/[id]/route.ts');
 const replyHandler=await loadProcessRoute('app/api/support/tickets/[id]/messages/route.ts');
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const ticketCreateHandler=await loadProcessRoute('app/api/support/tickets/route.ts');
 const createdTicket=await ticketCreateHandler.POST({headers:new Headers(),body:{subject:'Synthetic closed request',message:'Synthetic fixture only',category:'question'}});assert.equal(createdTicket.status,201,JSON.stringify(createdTicket));
 const closedTicket=createdTicket.data.item;await db.query("update support_cases set status='closed' where id=$1",[closedTicket.id]);
 const ticketParams={params:Promise.resolve({id:closedTicket.id})};
 assert.equal((await replyHandler.POST({body:{body:'Reply before reopening'}},ticketParams)).status,409);
 assert.equal((await reopenHandler.PATCH({body:{action:'reopen'}},ticketParams)).status,200);
 const replyRequest={headers:new Headers({'idempotency-key':'support-reply-retry'}),body:{body:'A single customer reply'}};
 const firstReply=await replyHandler.POST(replyRequest,ticketParams),sameReply=await replyHandler.POST(replyRequest,ticketParams);
 assert.equal(firstReply.status,201);assert.equal(firstReply.data.item.author_type,'customer');assert.equal(sameReply.data.item.id,firstReply.data.item.id,'Lost response retry creates no duplicate support message');
 assert.equal((await reopenHandler.PATCH({body:{action:'close'}},ticketParams)).status,400,'Unapproved customer transitions remain blocked');
 globalThis.__processSession={...session,organizationId:sandbox};
 assert.equal((await reopenHandler.PATCH({body:{action:'reopen'}},ticketParams)).status,404);
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 const notificationRoute=await loadProcessRoute('app/api/notifications/route.ts');
 const notificationId=(await db.query("insert into in_app_notifications(organization_id,user_id,kind,title,body) values($1,$2,'system','Synthetic notification','No personal data') returning id",[demo,session.userId])).rows[0].id;
 const foreignNotificationId=(await db.query("insert into in_app_notifications(organization_id,user_id,kind,title,body) values($1,null,'system','Foreign synthetic notification','No personal data') returning id",[sandbox])).rows[0].id;
 assert.equal((await notificationRoute.PATCH({body:{all:true}})).status,200);assert.ok((await notificationRoute.GET()).data.items.find(item=>item.id===notificationId).readAt);assert.equal((await db.query('select read_at from in_app_notifications where id=$1',[foreignNotificationId])).rows[0].read_at,null,'Read all cannot affect another tenant');
 const policy=await loadProcessRoute('app/api/time-entries/policy/route.ts');assert.equal((await policy.PATCH({body:{required:false}})).status,409,'Legacy settings cannot disable the independent-review invariant');
 await db.query('update organizations set time_approval_required=false where id=$1',[demo]);
 const immediate=await manualTimeHandler.POST({headers:new Headers(),body:{customerId:documentArgs.p_customer_id,description:'Direct work awaits review',durationMinutes:60,billable:true}});assert.equal(immediate.status,201,JSON.stringify(immediate));assert.equal(immediate.data.item.approved,false,'A stored legacy false flag cannot auto-approve normal work');
 const internalProcessTime=await manualTimeHandler.POST({headers:new Headers(),body:{projectName:'Weiterbildung',description:'Internal training',durationMinutes:90,billable:false}});assert.equal(internalProcessTime.status,201);assert.equal(internalProcessTime.data.item.customer_id,null);assert.equal(internalProcessTime.data.item.billable,false);
 await policy.PATCH({body:{required:true}});
 globalThis.__processSession={...globalThis.__processSession,role:'member'};assert.equal((await policy.PATCH({body:{required:false}})).status,403);assert.equal((await projectHandler.POST({body:{name:'Forbidden'}})).status,403);
 globalThis.__processSession={...session,name:'Process Owner',email:'owner@fixture.invalid'};
 assert.equal((await listApiBusiness(client,session,'documents','number=eq.'+processQuote.number))[0].project_id,projectCreated.data.item.id);
 assert.equal((await listApiBusiness(client,session,'documents','id=eq.'+converted.id))[0].source_offer,processQuote.number);

 const summarySource=(await fs.readFile('lib/server/repositories/financial-summary.ts','utf8')).replace('import "server-only";','').replace("'@/lib/permissions'",JSON.stringify(permissions)).replace('"./finance"',JSON.stringify(dataModule((await fs.readFile('lib/server/repositories/finance.ts','utf8')).replace("import 'server-only';",'')))).replace('"@/lib/money"',JSON.stringify(moneyModule));
 const {financialSummary}=await import(dataModule(summarySource));
 const ownerSummary=await financialSummary(client,session,documentArgs.p_customer_id);assert.ok(ownerSummary.invoices.length);assert.ok(Number(ownerSummary.time.ready_hours)>=1);
 const restrictedSummary=await financialSummary(client,{...session,role:'member'},documentArgs.p_customer_id);assert.equal(restrictedSummary.invoices.length,0);assert.equal(restrictedSummary.offers,null,'A shared workspace cannot expose restricted finance data');
 const activitySource=(await fs.readFile('lib/server/repositories/customer-activity.ts','utf8')).replace('import "server-only";','').replace('"@/lib/display-format"',JSON.stringify(displayModuleUrl)).replace('"@/lib/permissions"',JSON.stringify(permissions));
 const activityModule=dataModule(activitySource);
 const workspaceSource=(await fs.readFile('lib/server/repositories/customer-workspace.ts','utf8')).replace('import "server-only";','').replace('"@/lib/permissions"',JSON.stringify(permissions)).replace('"../http"',JSON.stringify(http)).replace('"./business-api"',JSON.stringify(dataModule(businessSource))).replace('"./financial-summary"',JSON.stringify(dataModule(summarySource))).replace('"./customer-activity"',JSON.stringify(activityModule));
 const {customerWorkspace}=await import(dataModule(workspaceSource));
 const workspace=await customerWorkspace(client,session,documentArgs.p_customer_id);assert.equal(workspace.item.id,documentArgs.p_customer_id);assert.deepEqual(workspace.summary,await financialSummary(client,session,documentArgs.p_customer_id,true));assert.ok(workspace.documents.some(item=>item.id===timeInvoice.id));assert.ok(workspace.activity.some(item=>item.title==='Zahlung erhalten'));
 for(const table of ['customers','customer_contacts','documents','payments','products','employees','expenses','projects','time_entries','support_tickets']){
  const ownRows=await listApiBusiness(client,session,table,'');assert.ok(ownRows.length,table+' positive tenant fixture exists');
  const foreignRows=await listApiBusiness(client,{...session,organizationId:sandbox,userId:'sandbox-user'},table,'id=eq.'+encodeURIComponent(String(ownRows[0].id)));assert.equal(foreignRows.length,0,table+' rejects a foreign direct ID in the canonical repository');
 }
 console.log('All ten canonical business repository sources reject foreign direct IDs with positive source fixtures.');
 const restrictedWorkspace=await customerWorkspace(client,{...session,role:'member'},documentArgs.p_customer_id);assert.equal(restrictedWorkspace.documents.length,0);assert.equal(restrictedWorkspace.summary.invoices.length,0);assert.ok(!restrictedWorkspace.activity.some(item=>item.title==='Zahlung erhalten'));
 await assert.rejects(()=>customerWorkspace(client,{...session,organizationId:sandbox},documentArgs.p_customer_id),e=>e.code==='not_found');
 const activityRouteSource=(await fs.readFile('app/api/customers/[id]/activity/route.ts','utf8')).replace("'@/lib/server/repositories/customer-activity'",JSON.stringify(activityModule));
 let compiledActivity=activityRouteSource;for(const [specifier,url] of Object.entries({'@/lib/server/http':processHttp,'@/lib/server/session':processSession,'@/lib/server/db':processDb,'@/lib/server/rbac':processRbac})){compiledActivity=compiledActivity.replaceAll("'"+specifier+"'",JSON.stringify(url));}
 const activity=await import(dataModule(compiledActivity));

 const customerEvents=await activity.GET({}, {params:Promise.resolve({id:documentArgs.p_customer_id})});assert.equal(customerEvents.status,200,JSON.stringify(customerEvents));for(const title of ['Rechnung erstellt','Angebot angenommen','Zahlung erhalten','Auftrag erstellt','Arbeitszeit erfasst'])assert.ok(customerEvents.data.items.some(item=>item.title===title),title);
 // Document retry replay, payload conflict and central counter behavior.
 const retryArgs={...documentArgs,p_idempotency_key:'document-repeat-fixture'};
 const createdOnce=await atomic('create_document_atomic',retryArgs);
 const replay=await atomic('create_document_atomic',retryArgs);
 assert.equal(replay.id,createdOnce.id);assert.equal(replay.number,createdOnce.number);
 await assert.rejects(()=>atomic('create_document_atomic',{...retryArgs,p_note:'Different payload'}),e=>e.code==='idempotency_conflict');
 assert.ok(createdOnce.number.startsWith('RE-'));assert.notEqual(createdOnce.number,retryArgs.p_number,'Incoming numbers cannot bypass the counter');
 await assert.rejects(()=>atomic('update_document_atomic',{...documentArgs,p_current_number:createdOnce.number,p_number:'RENAMED'}),e=>e.code==='number_immutable');
 const numberBefore=(await db.query('select next_value from business_document_counters where organization_id=$1 and kind=\'invoice\' order by period desc limit 1',[demo])).rows[0].next_value;
 const invoiceCountBefore=(await db.query('select count(*)::int n from invoices where organization_id=$1',[demo])).rows[0].n;
 await assert.rejects(()=>atomic('create_document_atomic',{...serviceArgs,p_idempotency_key:'document-rollback-fixture'}),e=>e.code==='time_entries_changed');
 assert.equal((await db.query('select next_value from business_document_counters where organization_id=$1 and kind=\'invoice\' order by period desc limit 1',[demo])).rows[0].next_value,numberBefore,'Failed transaction does not commit a counter reservation');
 assert.equal((await db.query('select count(*)::int n from invoices where organization_id=$1',[demo])).rows[0].n,invoiceCountBefore,'Failed linked billing commits no invoice');
 const roundedOffer=await atomic('create_document_atomic',{...documentArgs,p_kind:'offer',p_items:[{description:'Precision fixture',quantity:1.11,unit_price:0.05,vat_rate:8.1},{description:'Second line',quantity:0.33,unit_price:1.01,vat_rate:8.1}]});
 const {documentTotals}=await import(moneyModule);
 const precision=documentTotals([{quantity:1.11,unit_price:0.05,vat_rate:8.1},{quantity:0.33,unit_price:1.01,vat_rate:8.1}]);
 assert.equal(Number(roundedOffer.total),precision.total);assert.equal(Number(roundedOffer.subtotal),precision.subtotal);assert.equal(Number(roundedOffer.vat_amount),precision.vat);
 const financeRepository=dataModule((await fs.readFile('lib/server/repositories/finance.ts','utf8')).replace("import 'server-only';",''));
 const {financeData}=await import(financeRepository);
 const cash=await financeData(client,demo);const expectedCash=(await db.query("select coalesce(sum(p.amount),0) amount from payments p join invoices i on i.id=p.invoice_id and i.organization_id=p.organization_id where p.organization_id=$1 and p.archived_at is null and p.allocation_status='matched' and i.currency='CHF'",[demo])).rows[0].amount;
 assert.equal(cash.payments.reduce((sum,row)=>sum+Math.round(Number(row.amount)*100),0),Math.round(Number(expectedCash)*100));
 const allDocuments=await listApiBusiness(client,session,'documents','kind=eq.invoice');
 const summaryCheck=await financialSummary(client,session,null);
 for(const bucket of summaryCheck.invoices){const unpaid=allDocuments.filter(row=>row.currency===bucket.currency&&!['draft','cancelled'].includes(row.status));assert.equal(unpaid.reduce((sum,row)=>sum+Math.round(financialOpen(row)*100),0),Math.round(Number(bucket.open_amount)*100));}
 function financialOpen(row){return Math.max(0,Math.round(Number(row.total)*100)-Math.round(Number(row.credit_amount??0)*100)-Math.round(Number(row.paid_amount)*100)+Math.round(Number(row.refund_amount??0)*100))/100;}
 console.log('V21.3 document idempotency/payload conflict, immutable server numbers, transaction/counter rollback, quote precision and cash/open-balance parity passed.');
 // Real upload/download handlers share tenant relations and enforce purpose permissions.
 const fileRelations=dataModule(await fs.readFile('lib/file-associations.ts','utf8'));
 const validation=dataModule((await fs.readFile('lib/server/file-validation.ts','utf8')).replace("'./http'",JSON.stringify(processHttp)));
 const limits=dataModule(await fs.readFile('config/limits.ts','utf8'));
 const fileAccess=dataModule((await fs.readFile('lib/server/file-access.ts','utf8')).replace('import "server-only";','').replace('"./env"',JSON.stringify(dataModule('export const env={}'))));
 const fileRoute=async path=>{let source=await fs.readFile(path,'utf8');for(const [specifier,url] of Object.entries({'@/lib/server/plan-access':actualPlanModule,'@/lib/server/workforce-access':workforceModule,'@/lib/server/file-access':fileAccess,'@/lib/server/file-scan':dataModule('export async function scanFileWithEvidence(){return {status:"pending",evidence:null}}'),'@/lib/server/business-idempotency':idempotencyModule,'@/lib/server/file-relations':fileRelations,'@/lib/server/file-validation':validation,'@/config/limits':limits,'@/lib/server/http':processHttp,'@/lib/server/session':processSession,'@/lib/server/db':processDb,'@/lib/server/rbac':processRbac,'@/lib/permissions':permissions,'@/lib/server/storage':dataModule('export async function getBlobByUrl(){throw new Error("External storage must not be contacted by isolated tests")}')})){source=source.replaceAll(JSON.stringify(specifier),JSON.stringify(url)).replaceAll("'"+specifier+"'",JSON.stringify(url));}return import(dataModule(source));};
 const fileUpload=await fileRoute('app/api/files/route.ts'),fileDownload=await fileRoute('app/api/files/[id]/download/route.ts');
 const uploadRequest=(entityId,mime='text/plain',bytes='synthetic attachment',purpose='customer_document')=>{const form=new FormData();form.set('purpose',purpose);form.set('entityId',entityId);form.set('file',new File([bytes],'fixture.txt',{type:mime}));return new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':crypto.randomUUID()},body:form});};
 const uploaded=await fileUpload.POST(uploadRequest(documentArgs.p_customer_id));assert.equal(uploaded.status,201,JSON.stringify(uploaded));assert.equal(uploaded.data.item.customer_id,documentArgs.p_customer_id);
 const pendingDownload=await fileDownload.GET({}, {params:Promise.resolve({id:uploaded.data.item.id})});assert.equal(pendingDownload.status,423);
 await db.query("update file_objects set scan_status='clean' where id=$1",[uploaded.data.item.id]);
 const downloaded=await fileDownload.GET({}, {params:Promise.resolve({id:uploaded.data.item.id})});assert.equal(downloaded.status,200);assert.equal(await downloaded.text(),'synthetic attachment');assert.equal(downloaded.headers.get('cache-control'),'private, no-store');
 const listed=await fileUpload.GET({nextUrl:new URL('https://fixture.invalid/api/files?customerId='+documentArgs.p_customer_id)});assert.ok(listed.data.items.some(row=>row.id===uploaded.data.item.id));
 assert.equal((await fileUpload.POST(uploadRequest(documentArgs.p_customer_id,'application/pdf','not a PDF'))).status,400);
 globalThis.__processSession={...session,organizationId:sandbox};
 assert.equal((await fileDownload.GET({}, {params:Promise.resolve({id:uploaded.data.item.id})})).status,404);
 assert.equal((await fileUpload.POST(uploadRequest(documentArgs.p_customer_id))).status,404);
 globalThis.__processSession={...session,role:'employee'};
 assert.equal((await fileDownload.GET({}, {params:Promise.resolve({id:uploaded.data.item.id})})).status,403);
 globalThis.__processSession={...session,role:'hr'};
 const unfilteredFiles=await fileUpload.GET({nextUrl:new URL('https://fixture.invalid/api/files')});
 assert.equal(unfilteredFiles.status,200,'Document readers retain permitted listing access');
 assert.ok(!unfilteredFiles.data.items.some(row=>row.id===uploaded.data.item.id),'Omitting a customer filter cannot expose files outside the role permission');
 assert.equal((await fileUpload.GET({nextUrl:new URL('https://fixture.invalid/api/files?customerId='+documentArgs.p_customer_id)})).status,403,'Explicit customer filter remains forbidden to HR');
 globalThis.__processSession=session;
 console.log('Actual file upload/list/download, content signature, cross-tenant association/download denial and role denial passed.');
 globalThis.__processSession={...globalThis.__processSession,name:'Synthetic report author'};
 for(const reportMonth of ['',null,'2026-13','2026-10-extra']){
  const invalid=await manualTimeHandler.POST({headers:new Headers(),body:{reportMonth,customerId:documentArgs.p_customer_id,durationMinutes:60,billable:true}});
  assert.equal(invalid.status,400,'An explicit invalid report month never falls back to an ordinary entry');
 }
 const monthly=await manualTimeHandler.POST({headers:new Headers(),body:{reportMonth:'2001-02',customerId:documentArgs.p_customer_id,description:'Synthetic signed monthly report',durationMinutes:198*60,billable:true}});assert.equal(monthly.status,201,JSON.stringify(monthly));assert.equal(monthly.data.item.approved,false);
 const monthlyParams={params:Promise.resolve({id:monthly.data.item.id})};
 assert.equal((await timeReview.PATCH({body:{action:'submit'}},monthlyParams)).status,409,'A report without evidence cannot be submitted');
 const reportUpload=await fileUpload.POST(uploadRequest(monthly.data.item.id,'text/plain','Synthetic signed timesheet, 198 hours','time_report'));assert.equal(reportUpload.status,201,JSON.stringify(reportUpload));assert.equal(reportUpload.data.item.time_entry_id,monthly.data.item.id);
 assert.equal((await timeReview.PATCH({body:{action:'submit'}},monthlyParams)).status,409,'Pending evidence cannot bypass the strict scan policy');
 await db.query("update file_objects set scan_status='clean' where id=$1",[reportUpload.data.item.id]);
 assert.equal((await timeReview.PATCH({body:{action:'submit'}},monthlyParams)).status,200);
 assert.equal((await fileUpload.POST(uploadRequest(monthly.data.item.id,'text/plain','Extra evidence','time_report'))).status,409,'Submitted report evidence is locked');
 assert.equal((await timeReview.PATCH({body:{action:'approve'}},monthlyParams)).status,403,'A monthly report cannot be self-approved');
 const monthlyAuthor=globalThis.__processSession;globalThis.__processSession={...monthlyAuthor,userId:'independent-time-reviewer'};
 assert.equal((await timeReview.PATCH({body:{action:'reject'}},monthlyParams)).status,400,'A return requires a reason');
 assert.equal((await timeReview.PATCH({body:{action:'reject',note:'Please correct the total'}},monthlyParams)).status,200);
 globalThis.__processSession=monthlyAuthor;
 assert.equal((await timeReview.PATCH({body:{action:'correct',durationMinutes:197*60,description:'Synthetic corrected report'}},monthlyParams)).status,200);
 assert.equal((await timeReview.PATCH({body:{action:'submit'}},monthlyParams)).status,200);
 globalThis.__processSession={...monthlyAuthor,userId:'independent-time-reviewer'};assert.equal((await timeReview.PATCH({body:{action:'approve'}},monthlyParams)).status,200);globalThis.__processSession=monthlyAuthor;
 assert.equal((await timeReview.PATCH({body:{action:'correct',durationMinutes:196*60,description:'Forbidden edit'}},monthlyParams)).status,403,'Approved monthly content stays immutable');
 console.log('Monthly report: 198-hour draft, actual associated file upload, scan/evidence gates, no self-review, reasoned return, correction, resubmission and independent approval passed.');

 // The unused generic record writer was removed. Public finance routes expose no
 // alternate PATCH/DELETE ledger writer that can bypass canonical transitions.
 for(const file of ['app/api/payments/[id]/route.ts','app/api/payments/route.ts']){const source=await fs.readFile(file,'utf8');assert.ok(!/export async function (PATCH|DELETE)/.test(source));}
 console.log('Full customer/offer/project/time/invoice/partial-payment process, direct customer work, internal time, enforced independent approval, exact completion date, overpayment and double-billing protection passed.');
 await db.exec('begin');
 try{
  for(const [table,fields] of Object.entries({products:['name','kind','unit_price','status'],employees:['name','job_title','workload_percent','status'],expenses:['merchant','employee_name','amount','status'],payments:['paid_on','customer_name','invoice_number','amount','status']})){
   for(const field of fields)for(const direction of ['asc','desc'])assert.ok((await listApiBusiness(client,session,table,'order='+field+'.'+direction+'&limit=1')).length>0,'Every offered module sort resolves against actual authorized database fields');
  }
  await db.query("insert into products_services(organization_id,external_id,name,item_type,sku,unit,unit_price,vat_rate,status) values($1,'native-sort-low','Native money sort low','service','SKU-V22-11','hour',9,8.1,'active'),($1,'native-sort-high','Native money sort high','service','SKU-V22-22','hour',10000,8.1,'active')",[demo]);
  const nativePrice=await listApiBusiness(client,session,'products','q=Native%20money%20sort&order=unit_price.desc&limit=1');
  assert.equal(Number(nativePrice[0].unit_price),10000,'Money is sorted numerically in SQL before the page limit');
  assert.equal((await listApiBusiness(client,session,'products','q=SKU%20V22%2022&kind=eq.service'))[0].name,'Native money sort high','Search includes actual SKU values absent from displayed list rows');
  assert.equal((await listApiBusiness(client,session,'products','q=SKU%20V22%2022&kind=eq.product')).length,0,'Only the selected product type is returned');
  assert.equal((await listApiBusiness(client,{...session,organizationId:sandbox},'products','q=SKU%20V22%2022')).length,0,'Module search cannot expose another tenant inventory');
  await db.query("insert into customers(organization_id,external_id,customer_no,name,status,created_at) select $1,'search-bulk-'||i,'K-SYN-'||i,'Search bulk '||i,'active',now()-interval '1 day' from generate_series(1,1001) i",[demo]);
  const target=(await db.query("insert into customers(organization_id,external_id,customer_no,name,status,created_at) values($1,'search-target','K-998877','Search target Zürich AG','active',now()-interval '2 days') returning id",[demo])).rows[0];

  const publicFilters=await import(dataModule(await fs.readFile('lib/business-list-query.ts','utf8')));
  const selectedBeyondPage=await listApiBusiness(client,session,'customers',publicFilters.businessListQuery('customers',new URLSearchParams({id:'eq.'+target.id,limit:'50'}),'name.asc').toString());
  assert.deepEqual(selectedBeyondPage.map(row=>row.id),[target.id],'The public ID filter reloads the exact selected record beyond the first thousand');
  const relatedDocuments=await listApiBusiness(client,session,'documents',publicFilters.businessListQuery('documents',new URLSearchParams({customer_id:'eq.'+documentArgs.p_customer_id})).toString());
  assert.ok(relatedDocuments.length>0&&relatedDocuments.every(row=>row.customer_id===documentArgs.p_customer_id),'Related document lists retain the requested customer scope');
  await assert.rejects(()=>listApiBusiness(client,{...session,role:'member'},'expenses','review=1'),error=>error.status===403);
  assert.equal((await listApiBusiness(client,session,'customers','')).some(row=>row.id===target.id),false,'The target is beyond the old 1000-record loaded window');
  assert.equal((await listApiBusiness(client,session,'customers','q=K998%20877&limit=1'))[0].id,target.id,'Normalized business numbers are searched before the limit');
  const firstPage=await listApiBusiness(client,session,'customers','q=search%20bulk&limit=50&offset=0&order=name.asc');
  const secondPage=await listApiBusiness(client,session,'customers','q=search%20bulk&limit=50&offset=50&order=name.asc');
  assert.equal(Number(firstPage[0].total_count),1001,'A page reports the complete authorized matching population');
  assert.equal(firstPage.length,50);assert.equal(secondPage.length,50);assert.ok(secondPage.every(row=>!firstPage.some(first=>first.id===row.id)),'Stable pages do not duplicate records');
  await assert.rejects(()=>listApiBusiness(client,session,'customers','offset=-1'),error=>error.status===400);
  assert.ok((await listApiBusiness(client,session,'customers','q='+encodeURIComponent('Zürich'))).some(row=>row.id===target.id),'Swiss text remains searchable alongside other customers from the same city');
  assert.equal((await listApiBusiness(client,{...session,organizationId:sandbox},'customers','q=K998877')).length,0,'A full-population search cannot cross the tenant boundary');
  assert.equal((await listApiBusiness(client,session,'customers','q='+encodeURIComponent('%__--'))).length,0,'Punctuation and wildcards cannot match every record');
  const numbered=(await listApiBusiness(client,session,'documents','q=RE%202026%20019&kind=eq.invoice&limit=1'))[0];
  assert.equal(numbered.number,'RE-2026-019','Usual invoice separators are normalized');
  await db.query('update customers set customer_no=$2 where id=$1',[numbered.customer_id,'K-112233']);
  const byCustomer=await listApiBusiness(client,session,'documents','q=K112%20233&kind=eq.invoice');
  assert.ok(byCustomer.length>0&&byCustomer.every(row=>row.customer_id===numbered.customer_id),'Invoice search joins the actual related customer number');
  console.log('V22 search: real 1000-record boundary, normalized invoice/customer numbers, Swiss text, punctuation safety and full-population tenant scope passed.');
 }finally{await db.exec('rollback')}
 // Reconcile the actual list, detail status and payment write against the same
 // credit-adjusted balance used by financial metrics, with all writes rolled back.
 await db.exec('begin');
 try{
  const probe=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'CREDIT-RECONCILIATION'});
  await db.query("update invoices set status='sent',due_date=current_date-1,issue_date=current_date-2 where id=$1",[probe.id]);
  const creditDependencies={'./document-process':dataModule(processSource),'./business-idempotency':idempotencyModule,'./rbac':processRbac,'./plan-access':dataModule('export async function requireModuleEntitlement(){}'),'./http':processHttp,'./audit':audit,'@/lib/financial-status':financialModule,'@/lib/money':moneyModule};
  let creditSource=(await fs.readFile('lib/server/credit-notes.ts','utf8')).replace("import 'server-only';",'');
  for(const [specifier,url] of Object.entries(creditDependencies))creditSource=creditSource.replaceAll("'"+specifier+"'",JSON.stringify(url));
  const {createCreditNote,recordInvoiceRefund}=await import(dataModule(creditSource));
  const creditKey=randomUUID(),creditBody={amount:16.2,reason:'Fixture adjustment'};
  await assert.rejects(()=>createCreditNote(client,{...session,role:'employee'},probe.number,creditBody,randomUUID()));
  await assert.rejects(()=>createCreditNote(client,{...session,organizationStatus:'read_only'},probe.number,creditBody,randomUUID()));
  await assert.rejects(()=>createCreditNote(client,{...session,organizationId:sandbox},probe.number,creditBody,randomUUID()),e=>e.code==='not_found');
  await assert.rejects(()=>createCreditNote(client,session,probe.number,{amount:0.001,reason:'Invalid amount'},randomUUID()),e=>e.code==='amount_invalid');
  await assert.rejects(()=>createCreditNote(client,session,probe.number,{amount:1,reason:'x'},randomUUID()),e=>e.code==='reason_required');
  await assert.rejects(()=>createCreditNote(client,session,probe.number,creditBody,''),e=>e.code==='idempotency_required');
  const credit=await createCreditNote(client,session,probe.number,creditBody,creditKey);
  assert.match(credit.credit_no,/^GS-[0-9]{4}-[0-9]{6}$/);
  assert.deepEqual(await createCreditNote(client,session,probe.number,creditBody,creditKey),credit,'Credit retry cannot create another credit');
  await assert.rejects(()=>createCreditNote(client,session,probe.number,{...creditBody,amount:20},creditKey),e=>e.code==='idempotency_conflict');
  await assert.rejects(()=>createCreditNote(client,session,probe.number,{...creditBody,amount:201},randomUUID()),e=>e.code==='credit_exceeds_invoice');
  assert.equal((await db.query("select count(*)::int n from audit_events where organization_id=$1 and entity_id=$2 and action='invoice.credit.created'",[demo,credit.id])).rows[0].n,1);

  await db.query("insert into credit_notes(organization_id,credit_no,invoice_id,customer_id,credit_date,amount,reason,external_id) values($1,'GS-FUTURE-RECONCILIATION',$2,$3,(now() at time zone 'Europe/Zurich')::date+1,50,'Future credit is not current balance','future-credit-reconciliation')",[demo,probe.id,documentArgs.p_customer_id]);
  assert.equal((await db.query("select credit_date>(now() at time zone 'Europe/Zurich')::date as future from credit_notes where organization_id=$1 and invoice_id=$2 and credit_no='GS-FUTURE-RECONCILIATION'",[demo,probe.id])).rows[0].future,true,'Future-credit fixture must lie beyond the Swiss business day');
  const {openAmount,financialStatus}=await import(financialModule);
  const before=(await listApiBusiness(client,session,'documents','id=eq.'+probe.id))[0];
  assert.equal(Number(before.credit_amount),16.2);assert.equal(openAmount(before),200);assert.equal(financialStatus(before),'overdue');
  const paymentArgs={p_invoice_id:probe.id,p_customer_id:documentArgs.p_customer_id,p_paid_on:new Date().toISOString().slice(0,10),p_amount:200.01,p_method:'bank',p_note:'Credit balance probe',p_idempotency_key:randomUUID()};
  await assert.rejects(()=>mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs),e=>e.code==='payment_exceeds_balance');
  paymentArgs.p_amount=200;
  const payment=await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs);
  assert.deepEqual(JSON.parse(JSON.stringify(await mutateApiBusiness(client,session,'create_payment_idempotent',paymentArgs))),JSON.parse(JSON.stringify(payment)),'Lost payment response replays after credit-adjusted settlement');
  const after=(await listApiBusiness(client,session,'documents','id=eq.'+probe.id))[0];
  assert.equal(openAmount(after),0);assert.equal(after.display_status,'paid');assert.equal(financialStatus(after),'paid');
  assert.equal((await listApiBusiness(client,session,'documents','id=eq.'+probe.id+'&display_status=eq.overdue')).length,0);
  await createCreditNote(client,session,probe.number,{amount:100,reason:'Repayment fixture credit'},randomUUID());
  const refundDate=(await db.query("select (now() at time zone 'Europe/Zurich')::date::text business_day")).rows[0].business_day;
  const refundBody={amount:60,date:refundDate,reason:'Bank transfer completed, REF-123'},refundKey=randomUUID();
  await assert.rejects(()=>recordInvoiceRefund(client,{...session,role:'employee'},probe.number,refundBody,randomUUID()));
  await assert.rejects(()=>recordInvoiceRefund(client,{...session,organizationStatus:'read_only'},probe.number,refundBody,randomUUID()));
  await assert.rejects(()=>recordInvoiceRefund(client,{...session,organizationId:sandbox},probe.number,refundBody,randomUUID()),e=>e.code==='not_found');
  await assert.rejects(()=>recordInvoiceRefund(client,session,probe.number,{...refundBody,amount:100.01},randomUUID()),e=>e.code==='refund_exceeds_credit');
  for(const date of ['2026-02-30','2099-01-01','2020-01-01'])await assert.rejects(()=>recordInvoiceRefund(client,session,probe.number,{...refundBody,date},randomUUID()),e=>e.code==='refund_date_invalid');
  await db.query('update invoices set paid_amount=201 where id=$1',[probe.id]);
  await assert.rejects(()=>recordInvoiceRefund(client,session,probe.number,refundBody,randomUUID()),e=>e.code==='payment_ledger_mismatch');
  await db.query('update invoices set paid_amount=200 where id=$1',[probe.id]);
  const refund=await recordInvoiceRefund(client,session,probe.number,refundBody,refundKey);
  assert.deepEqual(await recordInvoiceRefund(client,session,probe.number,refundBody,refundKey),refund);
  await assert.rejects(()=>recordInvoiceRefund(client,session,probe.number,{...refundBody,amount:1},refundKey),e=>e.code==='idempotency_conflict');
  const refunded=(await listApiBusiness(client,session,'documents','id=eq.'+probe.id))[0];
  assert.equal(Number(refunded.paid_amount),200,'Original payment receipts remain unchanged');assert.equal(Number(refunded.refund_amount),60);assert.equal(refunded.refunds.length,1);assert.equal(openAmount(refunded),0);assert.equal(refunded.display_status,'paid');
  assert.equal((await db.query("select count(*)::int n from audit_events where organization_id=$1 and entity_id=$2 and action='invoice.refund.recorded'",[demo,refund.id])).rows[0].n,1);
  const {cashStatisticsData,financialMetricsData}=await import(financeModule);
  assert.ok((await cashStatisticsData(client,demo)).refunds.some(row=>row.payment_date===refundDate&&Number(row.amount)>=60));
  const metricsBefore=await financialMetricsData(client,demo);
  await recordInvoiceRefund(client,session,probe.number,{...refundBody,amount:40},randomUUID());
  const metricsAfter=await financialMetricsData(client,demo);
  assert.equal(Math.round(Number(metricsBefore.snapshot.credit_balance)*100)-Math.round(Number(metricsAfter.snapshot.credit_balance)*100),4000);
  assert.equal(metricsBefore.snapshot.receivables,metricsAfter.snapshot.receivables,'Repaying a credit cannot reopen a settled receivable');
  assert.deepEqual(metricsBefore.revenueEvents,metricsAfter.revenueEvents,'A refund does not subtract revenue for a second time');
  const customerAfterRefund=await customerWorkspace(client,session,documentArgs.p_customer_id);
  const customerMetric=await financialMetricsData(client,demo,{customerId:documentArgs.p_customer_id});
  assert.equal(Math.round(customerAfterRefund.statistics.filter(row=>row.currency==='CHF').reduce((sum,row)=>sum+Number(row.billed),0)*100),Math.round(customerMetric.revenueEvents.reduce((sum,row)=>sum+Number(row.amount),0)*100),'Customer chart and financial summary share credit-adjusted volume');

  await assert.rejects(()=>recordInvoiceRefund(client,session,probe.number,{...refundBody,amount:0.01},randomUUID()),e=>e.code==='refund_exceeds_credit');
  await db.exec('set local role binso_runtime');await db.query("select set_config('app.organization_id',$1,true)",[sandbox]);
  assert.equal((await db.query('select id from invoice_refunds where id=$1',[refund.id])).rows.length,0,'Refund ledger is RLS-isolated under the restricted role');
  await db.exec('reset role');await db.query("select set_config('app.organization_id',$1,true)",[demo]);
  console.log('Refund ledger: date/amount/rights/tenant guards, original receipt preservation, replay/audit, net cash, credit-liability reconciliation, no double revenue adjustment and restricted-role RLS passed.');
  // Unpaid, credited invoices cannot be cancelled or release billed time.
  const cancelProbe=await mutateApiBusiness(client,session,'create_document_atomic',{...documentArgs,p_number:'CREDIT-CANCEL-PROBE'});
  await db.query("update invoices set status='sent' where id=$1",[cancelProbe.id]);
  await db.query("insert into credit_notes(organization_id,credit_no,invoice_id,customer_id,credit_date,amount,reason,external_id) values($1,'GS-CANCEL-PROBE',$2,$3,current_date,10,'Fixture','cancel-credit-reconciliation')",[demo,cancelProbe.id,documentArgs.p_customer_id]);
  await assert.rejects(()=>changeDocumentStatus(client,session,cancelProbe.number,'cancel',''),e=>e.code==='credit_exists');
  assert.equal((await db.query('select status from invoices where id=$1',[cancelProbe.id])).rows[0].status,'sent');
  console.log('Credit-adjusted list/detail/payment parity, future-credit exclusion, exact balance limit, payment replay and cancellation integrity passed.');
 }finally{await db.exec('rollback')}
 delete globalThis.__processSession;delete globalThis.__processTransaction;delete globalThis.__processPlatform;
 console.log('PostgreSQL migrations, deterministic fixtures and tenant/platform RLS passed.');
}finally{await db.close()}
