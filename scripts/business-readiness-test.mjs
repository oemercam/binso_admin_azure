import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
import {moduleUrl,planCatalogModuleUrl,planAccessModuleUrl,financialModuleUrl,documentAmountSqlModuleUrl,localeTestModuleUrl} from './data-test-modules.mjs';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import {verifyBusinessReadiness} from './business-readiness-contract.mjs';

// Focused package runner: real migrations, runtime role and document mutations.
// Native mode accepts only an EMPTY disposable loopback QA database.
const address=process.env.BINSO_READINESS_TEST_URL;
if(address){const url=new URL(address);assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_readiness_test'&&url.username==='binso_test'&&!url.search&&!url.hash,'Refuses a non-isolated database');}
const db=address?new pg.Client({connectionString:address}):new PGlite({extensions:{pgcrypto}});
if(address)await db.connect();
const client={query:async(...args)=>{const result=await db.query(...args);return {...result,rowCount:result.rowCount??result.rows.length};}};
const exec=sql=>address?db.query(sql):db.exec(sql);
try{
 assert.equal(Number((await db.query("select count(*) n from information_schema.tables where table_schema='public'")).rows[0].n),0,'Never reset an existing schema');
 await exec('create extension if not exists pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort()){try{await exec(await fs.readFile('database/migrations/'+file,'utf8'));}catch(error){throw new Error(file+': '+error.message);}}
 await exec('reset role');await prepareHistoricalFixtureOwner(db);
 await exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 const compile=async(path,replacements={})=>{let source=(await fs.readFile(path,'utf8')).replaceAll('import "server-only";','').replaceAll("import 'server-only';",'');for(const [key,value] of Object.entries(replacements))source=source.replaceAll(JSON.stringify(key),JSON.stringify(value)).replaceAll("'"+key+"'",JSON.stringify(value));return moduleUrl(source);};
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const permissions=await compile('lib/permissions.ts'),audit=await compile('lib/server/audit.ts');
 const rbac=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissions});
 const qr=await compile('lib/qr-bill.ts',{'swissqrbill/utils':import.meta.resolve('swissqrbill/utils')});
 const replay=await compile('lib/server/business-idempotency.ts',{'./http':http});
 const business=await compile('lib/server/repositories/business-api.ts',{'../http':http,'../audit':audit,'../business-idempotency':replay,'../document-amount-sql':documentAmountSqlModuleUrl,'@/lib/financial-status':financialModuleUrl,'@/lib/permissions':permissions,'@/lib/qr-bill':qr});
 globalThis.__readinessClient=client;
 const scopedDb=moduleUrl('export const withTenant=async(_org,_user,fn)=>fn(globalThis.__readinessClient); export const query=(...args)=>globalThis.__readinessClient.query(...args)');
 const plans=await compile('lib/server/plan-access.ts',{'@/lib/server/db':scopedDb,'@/config/plan-access':planAccessModuleUrl,'@/config/plans':planCatalogModuleUrl,'./http':http});
 const navigation=await compile('lib/navigation.ts'),actions=await compile('lib/action-readiness.ts',{'./navigation':navigation});
 const readiness=await import(await compile('lib/server/business-readiness.ts',{'./http':http,'./rbac':rbac,'./audit':audit,'./plan-access':plans,'@/lib/permissions':permissions,'@/config/plans':planCatalogModuleUrl,'@/config/plan-access':planAccessModuleUrl,'@/lib/qr-bill':qr,'@/lib/action-readiness':actions}));
 const pdf=await compile('lib/server/document-pdf.ts',{'@/lib/locales':await localeTestModuleUrl(),'pdfkit':import.meta.resolve('pdfkit'),'swissqrbill/pdf':import.meta.resolve('swissqrbill/pdf'),'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl});
 const logo=moduleUrl('export async function documentLogo(){return undefined}'); // Synthetic fixture has no company logo; rendering and issuance remain real.
 const versions=await compile('lib/server/offer-versions.ts',{'./http':http,'./repositories/business-api':business,'./document-pdf':pdf,'./document-logo':logo});
 const process=await import(await compile('lib/server/document-process.ts',{'./http':http,'./rbac':rbac,'./audit':audit,'./offer-versions':versions,'@/lib/qr-bill':qr,'@/lib/financial-status':financialModuleUrl,'@/lib/server/plan-access':plans}));
 const {mutateApiBusiness}=await import(business);
 const session={organizationId:'00000000-0000-4000-8000-000000000099',userId:'demo-readonly',role:'owner',sessionId:randomUUID()};
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional'",[session.organizationId]);
 const transaction=async(actor,fn)=>{await exec('begin');try{await exec('set local role binso_runtime');await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[actor.organizationId,actor.userId]);const result=await fn(client);await exec('commit');return result;}catch(error){await exec('rollback');throw error;}};
 const args={p_kind:'invoice',p_customer_id:'10000000-0000-4000-8000-000000000001',p_number:'',p_issue_date:'2026-10-04',p_due_date:'2026-11-04',p_vat_rate:8.1,p_currency:'CHF',p_note:'Readiness fixture',p_items:[{description:'Readiness consulting',quantity:2,unit_price:100}]};
 await verifyBusinessReadiness({service:readiness,sql:(...args)=>client.query(...args),transaction,session,createDraft:()=>transaction(session,c=>mutateApiBusiness(c,session,'create_document_atomic',{...args,p_idempotency_key:randomUUID()})),issue:(c,s,number)=>process.changeDocumentStatus(c,s,number,'issue','')});
 console.log('Focused invoice readiness passed on '+(address?'native PostgreSQL':'PGlite')+'.');
}finally{delete globalThis.__readinessClient;if(address)await db.end();else await db.close();}
