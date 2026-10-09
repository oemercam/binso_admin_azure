import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash,randomBytes} from 'node:crypto';
import pg from 'pg';
import {moduleUrl} from './data-test-modules.mjs';

const address=process.env.BINSO_DB_PARALLEL_TEST_URL;
if(!address)throw new Error('Explicit isolated PostgreSQL URL required');
const url=new URL(address);
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Refuses any other database');
const pool=new pg.Pool({connectionString:address,max:8});
let server;
try{
 assert.equal((await pool.query("select count(*)::int n from information_schema.tables where table_schema='public'")).rows[0].n,0,'Never resets an existing database');
 for(const name of (await fs.readdir('database/migrations')).filter(name=>name.endsWith('.sql')).sort())await pool.query(await fs.readFile('database/migrations/'+name,'utf8'));
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const demo=await import(moduleUrl((await fs.readFile('lib/server/repositories/demo-fixture.ts','utf8')).replace('import "server-only";','').replace("'../http'",JSON.stringify(http))));
 const roles=['owner','admin','finance','hr','project_manager','manager','member','reader'];
 const organizations=['00000000-0000-4000-8000-000000000071','00000000-0000-4000-8000-000000000072'];
 const cookies=new Map();
 for(const [index,organizationId] of organizations.entries()){
  await pool.query("insert into organizations(id,name,slug,is_demo,status) values($1,$2,$3,true,'active')",[organizationId,'HTTP synthetic '+index,'http-synthetic-'+index]);
  await pool.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active')",[organizationId]);
  for(const role of roles){
   const user='http-'+index+'-'+role,token=randomBytes(32).toString('base64url');
   await pool.query("insert into app_users(id,email,display_name,status,mfa_enabled) values($1,$2,$1,'active',true)",[user,user+'@fixture.invalid']);
   await pool.query("insert into organization_memberships(organization_id,user_id,role,status) values($1,$2,$3,'active')",[organizationId,user,role]);
   await pool.query("insert into auth_sessions(user_id,organization_id,token_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')",[user,organizationId,createHash('sha256').update(token).digest('hex')]);
   cookies.set(index+':'+role,'binso_v213_test_session='+token);
  }
  const c=await pool.connect();try{await c.query('begin');await demo.seedDatabaseDemo(c,organizationId,'http-'+index+'-owner');await c.query('commit');}catch(e){await c.query('rollback');throw e;}finally{c.release();}
 }
 const base='http://127.0.0.1:3218';
 try{await fetch(base+'/api/health');throw new Error('Refusing an occupied HTTP test port');}catch(e){if(e.message==='Refusing an occupied HTTP test port')throw e;}
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3218'],{stdio:['ignore','pipe','pipe'],env:{...process.env,DATABASE_URL:address,DATABASE_SSL:'false',SESSION_COOKIE_NAME:'binso_v213_test_session'}});
 let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
 for(let i=0;;i++){if(server.exitCode!==null)throw new Error('Synthetic HTTP server exited: '+logs);try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i>80)throw new Error('Synthetic server unavailable');await new Promise(resolve=>setTimeout(resolve,250));}
 const get=async(path,cookie)=>{const response=await fetch(base+path,{headers:{cookie},redirect:'manual',signal:AbortSignal.timeout(15000)});return {status:response.status,data:await response.json()};};
 const positive=[];
 for(const [path,table] of [['customers','customers'],['employees','employees'],['products','products_services'],['expenses','expenses'],['payments','payments']]){
  const own=(await pool.query('select id from '+table+' where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];assert.ok(own,path+' fixture');
  assert.equal((await get('/api/'+path+'/'+own.id,cookies.get('0:owner'))).status,200,path+' positive read');
  const foreign=await get('/api/'+path+'/'+own.id,cookies.get('1:owner'));assert.equal(foreign.status,404,path+' foreign direct ID');positive.push(path);
 }
 const invoice=(await pool.query('select invoice_no from invoices where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 assert.equal((await get('/api/documents/'+invoice.invoice_no,cookies.get('0:owner'))).status,200);
 // Numbers may repeat legally in separate tenants: compare the returned object ID.
 const ownDocument=await get('/api/documents/'+invoice.invoice_no,cookies.get('0:owner'));
 const otherDocument=await get('/api/documents/'+invoice.invoice_no,cookies.get('1:owner'));
 if(otherDocument.status===200)assert.notEqual(otherDocument.data.item.id,ownDocument.data.item.id);
 const customer=(await pool.query('select id from customers where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 assert.equal((await get('/api/customers/'+customer.id+'?include=workspace',cookies.get('1:owner'))).status,404);
 for(const [role,allowed] of [['owner',true],['admin',true],['finance',true],['hr',false],['project_manager',false],['manager',false],['member',false],['reader',false]])assert.equal((await get('/api/payments',cookies.get('0:'+role))).status,allowed?200:403,role+' payment read policy');
 for(const role of roles)assert.equal((await get('/api/operator/dashboard',cookies.get('0:'+role))).status,401,'Tenant '+role+' cannot gain operator access');
 const ownRows=await get('/api/customers',cookies.get('0:owner')),foreignRows=await get('/api/customers',cookies.get('1:owner'));
 const ownIds=new Set(ownRows.data.items.map(item=>item.id));assert.ok(!foreignRows.data.items.some(item=>ownIds.has(item.id)));
 await pool.query("update auth_sessions set expires_at=now()-interval '1 second' where user_id='http-0-owner'");assert.equal((await get('/api/customers',cookies.get('0:owner'))).status,401,'Expired real database session is denied');
 console.log('Real HTTP + PostgreSQL: two isolated tenants, direct IDs in '+positive.join(', ')+', customer snapshot, legal same-number documents, all eight payment roles, operator boundary and actual session expiry passed. Synthetic sessions only.');
}finally{server?.kill();await pool.end();}
