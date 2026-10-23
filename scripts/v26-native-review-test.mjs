import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {randomUUID,randomBytes} from 'node:crypto';import ts from 'typescript';import pg from 'pg';
const address=process.env.BINSO_V26_NATIVE_TEST_URL;if(!address)throw Error('Explicit isolated test URL required');const url=new URL(address);assert.ok(['127.0.0.1','localhost'].includes(url.hostname)&&/^\/binso_v26_readiness_test(?:_[0-9]+)?$/.test(url.pathname)&&url.username==='binso_test'&&!url.search&&!url.hash,'Only the dedicated disposable loopback database is allowed');
const pool=new pg.Pool({connectionString:address,max:12,connectionTimeoutMillis:5000,application_name:'binso-v26-readiness'});const db={query:(...a)=>pool.query(...a),exec:sql=>pool.query(sql)};let session,auditFailure=false;
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

const transaction=async(org,user,fn,options={})=>{const c=await pool.connect();try{await c.query(options.isolation==='repeatable read'?'begin isolation level repeatable read':'begin');await c.query('set local role binso_runtime');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true),set_config('app.platform_operator','false',true)",[org,user]);const result=await fn(c);await c.query('commit');return result;}catch(e){await c.query('rollback');throw e;}finally{c.release();}};
mock('lib/server/db.ts',{withTenant:transaction,withPlatform:unavailable});mock('lib/server/session.ts',{requireSession:async()=>session});
const realAudit=load('lib/server/audit.ts').audit;mock('lib/server/audit.ts',{audit:async(...args)=>{await realAudit(...args);if(auditFailure)throw Error('Synthetic audit outage');}});
const {NextRequest}=require('next/server');const request=(body,key=randomUUID(),method='POST')=>new NextRequest('https://employee.invalid/api/employees',{method,headers:{origin:'https://employee.invalid','content-type':'application/json','idempotency-key':key},body:JSON.stringify(body)});const org=(await db.query("select organization_id from organization_memberships where user_id='employee-dossier-owner'")).rows[0]?.organization_id,other=(await db.query("select organization_id from organization_memberships where user_id='employee-dossier-foreign'")).rows[0]?.organization_id;assert.ok(org&&other&&org!==other,'Requires the preserved synthetic native fixture');const act=(role,organizationId=org,extra={})=>session={organizationId,userId:'employee-dossier-'+role,role,moduleProfile:'standard',organizationStatus:'active',...extra};
await (await import('./supplier-invoice-review-contract.mjs')).verifySupplierInvoiceReview({load,db,transaction,org,other,act,request,setAuditFailure:v=>{auditFailure=v}}).finally(()=>pool.end());
