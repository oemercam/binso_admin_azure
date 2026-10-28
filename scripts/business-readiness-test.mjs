import {billingAgreementModuleUrl,billingModelModuleUrl} from './data-test-modules.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
import {moduleUrl,planCatalogModuleUrl,planAccessModuleUrl,financialModuleUrl,documentAmountSqlModuleUrl,localeTestModuleUrl} from './data-test-modules.mjs';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import {verifyBusinessReadiness} from './business-readiness-contract.mjs';

// A FormSheet portal can appear after the recovery effect's first frame. Keep
// the real hook and metadata; only React lifecycle and DOM timing are synthetic.
{
 const globals=['window','document','HTMLInputElement','requestAnimationFrame','cancelAnimationFrame'],saved=new Map(globals.map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const effects=[],frames=new Map();let frameId=0,input=null,scrolls=0;
 const react=moduleUrl('export const useRef=value=>({current:value});export const useEffect=callback=>globalThis.__setupFocusEffects.push(callback);');
 const search=moduleUrl("export const useSearchParams=()=>new URLSearchParams('setupField=iban&returnTo=%2Frechnungen%2FRE-TEST');");
 const navigation=moduleUrl(await fs.readFile('lib/navigation.ts','utf8'));
 const metadata=moduleUrl((await fs.readFile('lib/action-readiness.ts','utf8')).replace("'./navigation'",JSON.stringify(navigation)));
 let source=await fs.readFile('components/use-setup-field.ts','utf8');
 for(const [specifier,target] of Object.entries({'react':react,'next/navigation':search,'@/lib/action-readiness':metadata,'@/lib/navigation':navigation}))source=source.replaceAll("'"+specifier+"'",JSON.stringify(target));
 try{
  globalThis.__setupFocusEffects=effects;globalThis.window=new EventTarget();globalThis.document={activeElement:null,getElementById:id=>id==='setup-iban'?input:null};
  globalThis.HTMLInputElement=class{hidden=false;closest(){return null;}focus(){globalThis.document.activeElement=this;}scrollIntoView(){scrolls++;}};
  globalThis.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;};globalThis.cancelAnimationFrame=id=>frames.delete(id);
  const advance=()=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback();};
  const hook=await import(moduleUrl(source));
  const recovery=hook.useSetupField(['iban'],true,true,()=>{throw Error('An open recovery form must not open again');},true);
  assert.equal(recovery.returnTo,'/rechnungen/RE-TEST');const cleanups=effects.map(effect=>effect()).filter(Boolean);
  advance();assert.equal(globalThis.document.activeElement,null,'A not-yet-mounted portal is not focused');
  input=new globalThis.HTMLInputElement();globalThis.window.dispatchEvent(new Event('binso-modal-open'));advance();
  assert.equal(globalThis.document.activeElement,input,'The requested bank field gains focus after the actual modal opens');assert.equal(scrolls,1);
  const other={};globalThis.document.activeElement=other;globalThis.window.dispatchEvent(new Event('binso-modal-open'));advance();assert.equal(globalThis.document.activeElement,other,'Later dialogs do not steal focus back to a completed recovery');
  for(const cleanup of cleanups)cleanup();globalThis.window.dispatchEvent(new Event('binso-modal-open'));assert.equal(frames.size,0,'Unmount removes the modal listener and pending focus work');
 }finally{delete globalThis.__setupFocusEffects;for(const [key,descriptor] of saved){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}}
 console.log('Readiness field focus: delayed portal, exact requested field, one-time focus and lifecycle cleanup passed.');
}

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
 const args={p_kind:'invoice',p_customer_id:'10000000-0000-4000-8000-000000000001',p_number:'',p_issue_date:'2026-10-04',p_due_date:'2026-11-04',p_vat_rate:8.1,p_currency:'CHF',p_note:'Readiness fixture',p_items:[{description:'Readiness consulting',quantity:2,unit_price:100}]};
 await verifyBusinessReadiness({service:readiness,sql:(...args)=>client.query(...args),transaction,session,createDraft:()=>transaction(session,c=>mutateApiBusiness(c,session,'create_document_atomic',{...args,p_idempotency_key:randomUUID()})),issue:(c,s,number)=>process.changeDocumentStatus(c,s,number,'issue','')});
 console.log('Focused invoice readiness passed on '+(address?'native PostgreSQL':'PGlite')+'.');
}finally{delete globalThis.__readinessClient;if(address)await db.end();else await db.close();}
