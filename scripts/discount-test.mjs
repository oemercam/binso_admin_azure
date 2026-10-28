import {billingAgreementModuleUrl,billingModelModuleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
import {moduleUrl,planCatalogModuleUrl,planAccessModuleUrl,financialModuleUrl,documentAmountSqlModuleUrl,localeTestModuleUrl} from './data-test-modules.mjs';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import {verifyDiscountPersistence} from './discount-contract.mjs';

// Focused package runner: real migrations, runtime role and document mutations.
// Native mode accepts only an EMPTY disposable loopback QA database.
const address=process.env.BINSO_DISCOUNT_TEST_URL;
if(address){const url=new URL(address);assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_discount_test'&&url.username==='binso_test'&&!url.search&&!url.hash,'Refuses a non-isolated database');}
const db=address?new pg.Client({connectionString:address}):new PGlite({extensions:{pgcrypto}});
if(address)await db.connect();
const client={query:async(...args)=>{const result=await db.query(...args);return {...result,rowCount:result.rowCount??result.rows.length};}};
const exec=sql=>address?db.query(sql):db.exec(sql);
try{
 assert.equal(Number((await db.query("select count(*) n from information_schema.tables where table_schema='public'")).rows[0].n),0,'Never reset an existing schema');
 await exec('create extension if not exists pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()){
  const snapshot=async()=>({invoices:(await db.query('select to_jsonb(i) data from invoices i order by id')).rows,quotes:(await db.query('select to_jsonb(q) data from quotes q order by id')).rows});
  const before=file==='0082_document_discount_calculation.sql'?await snapshot():null;
  await exec('begin');try{await exec(await fs.readFile('database/migrations/'+file,'utf8'));await exec('commit');}catch(error){await exec('rollback');throw new Error(file+': '+error.message);}
  if(before){const after={invoices:(await db.query("select to_jsonb(i)-'calculation' data from invoices i order by id")).rows,quotes:(await db.query("select to_jsonb(q)-'calculation' data from quotes q order by id")).rows};assert.deepEqual(after,before,'0082 preserves all legacy document fields');console.log('Migration0082: every existing document value preserved; nullable snapshots leave legacy calculations unchanged.');}
 }
 await exec('reset role');await prepareHistoricalFixtureOwner(db);
 await exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 const compile=async(path,replacements={})=>{let source=(await fs.readFile(path,'utf8')).replaceAll('import "server-only";','').replaceAll("import 'server-only';",'');for(const [key,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(key),JSON.stringify(value)).replaceAll("'"+key+"'",JSON.stringify(value));return moduleUrl(source);};
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const permissions=await compile('lib/permissions.ts'),audit=await compile('lib/server/audit.ts');
 const rbac=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissions});
 const qr=await compile('lib/qr-bill.ts',{'swissqrbill/utils':import.meta.resolve('swissqrbill/utils')});
 const replay=await compile('lib/server/business-idempotency.ts',{'./http':http});
 const expensePayment=await compile('lib/expense-payment.ts');
 const business=await compile('lib/server/repositories/business-api.ts',{'../billing-agreements':billingAgreementModuleUrl,'./billing-agreements':billingAgreementModuleUrl,'@/lib/server/billing-agreements':billingAgreementModuleUrl,'@/lib/billing-model':billingModelModuleUrl,'@/lib/expense-payment':expensePayment,'../http':http,'../audit':audit,'../business-idempotency':replay,'../document-amount-sql':documentAmountSqlModuleUrl,'@/lib/financial-status':financialModuleUrl,'@/lib/permissions':permissions,'@/lib/qr-bill':qr});
 globalThis.__readinessClient=client;
 const scopedDb=moduleUrl('export const withTenant=async(_org,_user,fn)=>fn(globalThis.__readinessClient); export const query=(...args)=>globalThis.__readinessClient.query(...args)');
 const plans=await compile('lib/server/plan-access.ts',{'@/lib/server/db':scopedDb,'@/config/plan-access':planAccessModuleUrl,'@/config/plans':planCatalogModuleUrl,'./http':http});
 const navigation=await compile('lib/navigation.ts'),actions=await compile('lib/action-readiness.ts',{'./navigation':navigation});
 const setupReadiness=await compile('lib/setup-readiness.ts',{'./qr-bill':qr,'./navigation':navigation,'./action-readiness':actions});
 const readiness=await import(await compile('lib/server/business-readiness.ts',{'./billing-agreements':billingAgreementModuleUrl,'./http':http,'./rbac':rbac,'./audit':audit,'./plan-access':plans,'@/lib/permissions':permissions,'@/config/plans':planCatalogModuleUrl,'@/config/plan-access':planAccessModuleUrl,'@/lib/qr-bill':qr,'@/lib/action-readiness':actions,'@/lib/setup-readiness':setupReadiness}));
 const pdf=await compile('lib/server/document-pdf.ts',{'@/lib/document-lines':moduleUrl(await fs.readFile('lib/document-lines.ts','utf8')),'@/lib/locales':await localeTestModuleUrl(),'pdfkit':import.meta.resolve('pdfkit'),'swissqrbill/pdf':import.meta.resolve('swissqrbill/pdf'),'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl});
 const logo=moduleUrl('export async function documentLogo(){return undefined}'); // Synthetic fixture has no company logo; rendering and issuance remain real.
 const versions=await compile('lib/server/offer-versions.ts',{'./http':http,'./repositories/business-api':business,'./document-pdf':pdf,'./document-logo':logo});
 const process=await import(await compile('lib/server/document-process.ts',{'./billing-agreements':billingAgreementModuleUrl,'./http':http,'./rbac':rbac,'./audit':audit,'./offer-versions':versions,'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':plans}));
 const {mutateApiBusiness}=await import(business);
 const session={organizationId:'00000000-0000-4000-8000-000000000099',userId:'demo-readonly',role:'owner',sessionId:randomUUID()};
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional'",[session.organizationId]);
 const transaction=async(actor,fn)=>{await exec('begin');try{await exec('set local role binso_runtime');await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[actor.organizationId,actor.userId]);const result=await fn(client);await exec('commit');return result;}catch(error){await exec('rollback');throw error;}};
 await verifyDiscountPersistence({business:await import(business),financial:await import(financialModuleUrl),sql:(...values)=>client.query(...values),transaction,session,issue:(c,s,number)=>process.changeDocumentStatus(c,s,number,'issue','')});
 console.log('Focused discount persistence passed on '+(address?'native PostgreSQL':'PGlite')+'.');
}finally{delete globalThis.__readinessClient;if(address)await db.end();else await db.close();}
