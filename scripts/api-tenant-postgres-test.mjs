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
 const pgVersion=Number((await pool.query("select current_setting('server_version_num') version")).rows[0].version);assert.ok(pgVersion>=160000&&pgVersion<170000,'Gate requires PostgreSQL 16');
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
   await pool.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,$4,'active')",[organizationId,user,user+'@fixture.invalid',role]);
   await pool.query("insert into auth_sessions(user_id,organization_id,token_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')",[user,organizationId,createHash('sha256').update(token).digest('hex')]);
   cookies.set(index+':'+role,'binso_v213_test_session='+token);
  }
  const c=await pool.connect();try{await c.query('begin');await demo.seedDatabaseDemo(c,organizationId,'http-'+index+'-owner');await c.query('commit');}catch(e){await c.query('rollback');throw e;}finally{c.release();}
  // Only this empty disposable database is permitted; ordinary tenant sessions
  // must exercise production permission guards, not demo exemptions.
  await pool.query('update organizations set is_demo=false where id=$1',[organizationId]);
 }
 const base='http://127.0.0.1:3218';
 try{await fetch(base+'/api/health');throw new Error('Refusing an occupied HTTP test port');}catch(e){if(e.message==='Refusing an occupied HTTP test port')throw e;}
 const serverEnv={...process.env,DATABASE_URL:address,DATABASE_SSL:'false',SESSION_COOKIE_NAME:'binso_v213_test_session'};
 for(const key of Object.keys(serverEnv))if(key.startsWith('STRIPE_'))delete serverEnv[key];
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3218'],{stdio:['ignore','pipe','pipe'],env:serverEnv});
 let logs='';server.stdout.on('data',data=>{logs+=data});server.stderr.on('data',data=>{logs+=data});
 for(let i=0;;i++){if(server.exitCode!==null)throw new Error('Synthetic HTTP server exited: '+logs);try{if((await fetch(base+'/api/health')).ok)break;}catch{}if(i>80)throw new Error('Synthetic server unavailable');await new Promise(resolve=>setTimeout(resolve,250));}
 const get=async(path,cookie)=>{const response=await fetch(base+path,{headers:{cookie},redirect:'manual',signal:AbortSignal.timeout(15000)});return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.arrayBuffer()};};
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
 const finance=['owner','admin','finance'],customerRoles=['owner','admin','finance','project_manager','manager','member','reader'];
 const projectRoles=['owner','admin','project_manager','manager','member','reader'],documentRoles=['owner','admin','finance','project_manager','manager','reader'];
 const expenseRoles=['owner','admin','finance','project_manager','manager','member'],employeeRoles=['owner','admin','hr'],teamRoles=['owner','admin','finance','hr'];
 // Independent expected-role contract: do not derive the expectation from the
 // same tenantCan function being tested by the actual HTTP handlers.
 const readContracts=[
  ...['/api/auth/mfa','/api/auth/session','/api/auth/sessions','/api/dashboard','/api/files','/api/finance/overview','/api/integrations/status','/api/notifications','/api/search?q=Alpen','/api/settings/company','/api/settings/documents','/api/settings/notifications','/api/settings/profile','/api/support/tickets'].map(path=>[path,roles]),
  ...['/api/billing/catalog','/api/payments','/api/finance','/api/finance/overview?include=workspace','/api/settings/subscription','/api/time-entries/billing','/api/expenses/billing'].map(path=>[path,finance]),
  ...['/api/customers','/api/customers/'+customer.id,'/api/customers/'+customer.id+'/activity','/api/customers/'+customer.id+'/contacts','/api/customers/'+customer.id+'?include=workspace'].map(path=>[path,customerRoles]),
  ...['/api/documents','/api/customers/'+customer.id+'/documents'].map(path=>[path,documentRoles]),
  ...['/api/products','/api/projects'].map(path=>[path,projectRoles]),
  ...['/api/expenses','/api/expenses/options','/api/time-entries','/api/time-entries/policy','/api/time-tracker'].map(path=>[path,expenseRoles]),
  ['/api/employees',employeeRoles],['/api/settings/team/invitations',teamRoles],
 ];
 const employee=(await pool.query('select id from employees where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const product=(await pool.query('select id from products_services where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const payment=(await pool.query('select id from payments where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const expense=(await pool.query('select id from expenses where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const ticket=(await pool.query('select id from support_cases where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 readContracts.push(['/api/employees/'+employee.id,employeeRoles],['/api/products/'+product.id,projectRoles],['/api/payments/'+payment.id,finance],['/api/support/tickets/'+ticket.id+'/messages',roles]);
 for(const [path,allowed] of readContracts)for(const role of roles){const r=await get(path,cookies.get('0:'+role));assert.equal(r.status,allowed.includes(role)?200:403,role+' GET '+path+': '+JSON.stringify(r.data));}
 // Own-record scope is stronger than the permission to list expense records.
 for(const role of roles)assert.equal((await get('/api/expenses/'+expense.id,cookies.get('0:'+role))).status,role==='member'?404:expenseRoles.includes(role)?200:403,role+' expense direct ID');
 for(const role of roles){
  const r=await get('/api/documents/'+invoice.invoice_no,cookies.get('0:'+role));
  const allowed=[...finance,'reader'].includes(role);assert.equal(r.status,allowed?200:documentRoles.includes(role)?404:403,role+' invoice detail');
  assert.equal((await get('/api/documents/'+invoice.invoice_no+'/pdf',cookies.get('0:'+role))).status,allowed?200:documentRoles.includes(role)?404:403,role+' invoice PDF');
  assert.equal((await get('/api/auth/session',cookies.get('0:'+role))).data.demo,false,'Ordinary tenant guard, no demo exemption');
 }
 const fileId='00000000-0000-4000-8000-000000000081',bytes=Buffer.from('Synthetic attachment');
 await pool.query("insert into file_objects(id,organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,purpose,customer_id) values($1,$2::uuid,($2::uuid)::text||'/http-test.txt','http-test.txt','text/plain',$3,$4,'clean','http-0-owner','customer_document',$5)",[fileId,organizations[0],bytes.length,createHash('sha256').update(bytes).digest('hex'),customer.id]);
 await pool.query('insert into file_contents(file_id,organization_id,body) values($1,$2,$3)',[fileId,organizations[0],bytes]);
 for(const role of roles){const downloaded=await get('/api/files/'+fileId+'/download',cookies.get('0:'+role));assert.equal(downloaded.status,customerRoles.includes(role)?200:403,role+' customer file read');if(downloaded.status===200)assert.equal(Buffer.from(downloaded.data).toString(),bytes.toString());assert.equal((await get('/api/files/'+fileId+'/download',cookies.get('1:'+role))).status,404,role+' foreign file ID');}
 const inventory=JSON.parse(await fs.readFile('docs/architecture/v21-3-data-inventory.json','utf8'));
 const covered=new Set(readContracts.map(([path])=>path.split('?')[0].replace(new RegExp(customer.id+'|'+employee.id+'|'+product.id+'|'+payment.id+'|'+ticket.id,'g'),'[id]')));
 for(const path of ['/api/expenses/[id]','/api/documents/[number]','/api/documents/[number]/pdf','/api/files/[id]/download'])covered.add(path);
 const publicEntries=new Set(['/api/auth/invitation','/api/health','/api/health/ready','/api/demo/session','/api/operator/sso/callback']);
 for(const api of inventory.apis.filter(item=>item.methods.includes('GET'))){
  if(api.path.startsWith('/api/operator/')&&!publicEntries.has(api.path)||api.path.startsWith('/api/demo/')&&!publicEntries.has(api.path)){
   for(const role of roles)assert.equal((await get(api.path.replace(/\[[^\]]+\]/g,customer.id)+(api.path==='/api/demo/data'?'?collection=customers':''),cookies.get('0:'+role))).status,401,role+' separate session boundary '+api.path);covered.add(api.path);
  }
  assert.ok(covered.has(api.path)||publicEntries.has(api.path),'Uncovered authenticated GET contract: '+api.path);
 }
 const write=async(method,path,body,role)=>{
  const response=await fetch(base+path,{method,headers:{cookie:cookies.get('0:'+role),origin:base,'Content-Type':'application/json','Idempotency-Key':'v215-'+role+'-'+path.replaceAll('/','-')},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  return {status:response.status,data:await response.json()};
 };
 // Valid independent synthetic payloads exercise successful persistence, not just
 // validation errors. Rejected roles must not change either tenant's row count.
 const customerWriters=['owner','admin','finance','project_manager','manager'];
 const projectWriters=['owner','admin','project_manager','manager'];
 const paymentInvoice=(await pool.query("select id,customer_id from invoices where organization_id=$1 and archived_at is null and status in('sent','partial','overdue') and total_amount-paid_amount>3 limit 1",[organizations[0]])).rows[0];assert.ok(paymentInvoice,'Open synthetic invoice for three legal financial role writes');
 const writeContracts=[
  ['/api/customers','customers',customerWriters,role=>({name:'Write contract '+role,email:role+'@write.invalid'})],
  ['/api/employees','employees',['owner','admin','hr'],role=>({firstName:'Write',lastName:role,jobTitle:'Synthetic ICT',workloadPercent:80,email:role+'@employee-write.invalid',weeklyHours:42,vacationDays:25})],
  ['/api/products','products_services',['owner','admin'],role=>({name:'Synthetic product '+role,kind:'service',unit:'hour',unitPrice:125,vatRate:8.1})],
  ['/api/projects','projects',projectWriters,role=>({name:'Synthetic project '+role,customerId:customer.id})],
  ['/api/time-entries','time_entries',[...projectWriters,'member'],role=>({projectId:null,projectName:'Internal '+role,durationMinutes:60,startedAt:'2026-10-09',billable:false})],
  ['/api/expenses','expenses',[...customerWriters,'member'],role=>({merchant:'Synthetic expense '+role,expenseDate:'2026-10-09',amount:10,currency:'CHF',vatRate:8.1,status:'draft'})],
  ['/api/support/tickets','support_cases',roles,role=>({subject:'Synthetic support '+role,message:'Isolated role contract message'})],
  ['/api/payments','payments',finance,()=>({invoiceId:paymentInvoice.id,customerId:paymentInvoice.customer_id,paidOn:'2026-10-09',amount:1,method:'bank'})],
  ['/api/documents','invoices',finance,()=>({kind:'invoice',customerId:customer.id,issueDate:'2026-10-09',dueDate:'2026-11-09',currency:'CHF',items:[{description:'Synthetic invoice line',quantity:1,unitPrice:100,vatRate:8.1}]})],
  ['/api/documents','quotes',projectWriters,()=>({kind:'offer',customerId:customer.id,issueDate:'2026-10-09',currency:'CHF',items:[{description:'Synthetic offer line',quantity:1,unitPrice:100,vatRate:8.1}]})],
 ];
 let writeCases=0;
 for(const [path,table,allowed,payload] of writeContracts)for(const role of roles){
  const count=async org=>(await pool.query('select count(*)::int n from '+table+' where organization_id=$1',[org])).rows[0].n;
  const before=await count(organizations[0]),otherBefore=await count(organizations[1]);
  const result=await write('POST',path,payload(role),role);
  assert.equal(result.status,allowed.includes(role)?201:403,role+' valid write contract '+path+' '+JSON.stringify(result.data));
  assert.equal(await count(organizations[0]),before+(allowed.includes(role)?1:0),role+' persistence/denial '+path);
  assert.equal(await count(organizations[1]),otherBefore,'Other tenant unchanged '+path);
  if(allowed.includes(role)){assert.ok(result.data.item?.id,role+' persisted identity '+path);const saved=(await pool.query('select organization_id from '+table+' where id=$1',[result.data.item.id])).rows[0];assert.equal(saved.organization_id,organizations[0]);}
  writeCases++;
 }
 for(const role of roles){
  const original=(await pool.query('select name from customers where organization_id=$1 and id=$2',[organizations[1],(await pool.query('select id from customers where organization_id=$1 limit 1',[organizations[1]])).rows[0].id])).rows[0].name;
  const foreignCustomer=(await pool.query('select id from customers where organization_id=$1 limit 1',[organizations[1]])).rows[0].id;
  const result=await write('PATCH','/api/customers/'+foreignCustomer,{name:'Forbidden overwrite'},role);
  assert.equal(result.status,customerWriters.includes(role)?404:403,role+' foreign customer write');
  assert.equal((await pool.query('select name from customers where id=$1',[foreignCustomer])).rows[0].name,original,'Cross-tenant write cannot mutate the object');
  const removed=await write('DELETE','/api/customers/'+foreignCustomer,{},role);
  assert.equal(removed.status,['owner','admin'].includes(role)?404:403,role+' foreign customer delete');
  assert.equal((await pool.query('select name from customers where id=$1 and archived_at is null',[foreignCustomer])).rows[0].name,original);
 }
 console.log('Authenticated valid write-role contract: '+writeCases+' actual create/persistence cases across all eight roles for customers, employees, products, projects, internal time, expenses, support, offers, invoices and payments; foreign customer PATCH/DELETE blocked with unchanged rows. Other write/status/operator contracts remain explicitly outside this coverage.');
 console.log('Authenticated read-role contract: every inventoried private GET route across all eight tenant roles, including binary PDF/files, own-record expense filtering, every operator/demo boundary; public/token entry points explicitly excluded. Write-role coverage is separate and incomplete.');
 for(const [role,allowed] of [['owner',true],['admin',true],['finance',true],['hr',false],['project_manager',false],['manager',false],['member',false],['reader',false]])assert.equal((await get('/api/payments',cookies.get('0:'+role))).status,allowed?200:403,role+' payment read policy');
 for(const role of roles)assert.equal((await get('/api/operator/dashboard',cookies.get('0:'+role))).status,401,'Tenant '+role+' cannot gain operator access');
 const ownRows=await get('/api/customers',cookies.get('0:owner')),foreignRows=await get('/api/customers',cookies.get('1:owner'));
 const ownIds=new Set(ownRows.data.items.map(item=>item.id));assert.ok(!foreignRows.data.items.some(item=>ownIds.has(item.id)));
 await pool.query("update auth_sessions set expires_at=now()-interval '1 second' where user_id='http-0-owner'");assert.equal((await get('/api/customers',cookies.get('0:owner'))).status,401,'Expired real database session is denied');
 console.log('Real HTTP + PostgreSQL: two isolated tenants, direct IDs in '+positive.join(', ')+', customer snapshot, legal same-number documents, all eight payment roles, operator boundary and actual session expiry passed. Synthetic sessions only.');
}finally{server?.kill();await pool.end();}
