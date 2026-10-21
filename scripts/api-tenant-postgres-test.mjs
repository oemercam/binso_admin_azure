import assert from 'node:assert/strict';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash,createHmac,createCipheriv,randomBytes} from 'node:crypto';
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
 await pool.query(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));
 await prepareHistoricalFixtureOwner(pool);
 const http=moduleUrl('export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}');
 const demo=await import(moduleUrl((await fs.readFile('scripts/fixtures/business-data.ts','utf8')).replace('import "server-only";','').replace("'../../lib/server/http'",JSON.stringify(http))));
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
   await pool.query("insert into auth_sessions(user_id,organization_id,token_hash,expires_at,step_up_at) values($1,$2,$3,now()+interval '1 hour',now())",[user,organizationId,createHash('sha256').update(token).digest('hex')]);
   cookies.set(index+':'+role,'binso_v213_test_session='+token);
  }
  const c=await pool.connect();try{await c.query('begin');await c.query('set local role binso_runtime');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[organizationId,'http-'+index+'-owner']);assert.equal((await c.query('select id from organizations where id=$1',[demo.demoTemplateId])).rowCount,0,'Template profile is hidden outside its explicit seeding context');await demo.seedDatabaseDemo(c,organizationId,'http-'+index+'-owner');await c.query("select set_config('app.organization_id',$1,true)",[demo.demoTemplateId]);assert.equal((await c.query("update organizations set name=name where id=$1",[demo.demoTemplateId])).rowCount,0,'Runtime cannot modify the canonical template profile');await c.query('commit');}catch(e){await c.query('rollback');throw e;}finally{c.release();}
  // Only this empty disposable database is permitted; ordinary tenant sessions
  // must exercise production permission guards, not demo exemptions.
  await pool.query('update organizations set is_demo=false where id=$1',[organizationId]);
 }
 // Explicit staff identities for valid own-time/expense write cases; no email inference.
 for(const role of ['project_manager','manager','member'])await pool.query("insert into employees(organization_id,external_id,name,email,role,employment_type,user_id) values($1,$2,$2,$3,'employee','hourly',$4)",[organizations[0],'http-linked-'+role,'linked-'+role+'@fixture.invalid','http-0-'+role]);
 const base='http://127.0.0.1:3218';
 try{await fetch(base+'/api/health');throw new Error('Refusing an occupied HTTP test port');}catch(e){if(e.message==='Refusing an occupied HTTP test port')throw e;}
 await pool.query("alter role binso_runtime password 'synthetic_v25_http_runtime'");
 const runtimeUrl=new URL(address);runtimeUrl.username='binso_runtime';runtimeUrl.password='synthetic_v25_http_runtime';
 const testEncryptionKey='synthetic-v25-http-encryption-key';
 const serverEnv={...process.env,APP_URL:base,DATABASE_URL:runtimeUrl.href,DATABASE_SSL:'false',APP_ENCRYPTION_KEY:testEncryptionKey,SESSION_COOKIE_NAME:'binso_v213_test_session'};
 for(const key of Object.keys(serverEnv))if(key.startsWith('STRIPE_')||key.startsWith('GRAPH_'))delete serverEnv[key];
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
 const offer=(await pool.query('select id,quote_no from quotes where organization_id=$1 and archived_at is null order by id limit 1',[organizations[0]])).rows[0];
 assert.equal((await get('/api/documents/'+invoice.invoice_no,cookies.get('0:owner'))).status,200);
 // Numbers may repeat legally in separate tenants: compare the returned object ID.
 const ownDocument=await get('/api/documents/'+invoice.invoice_no,cookies.get('0:owner'));
 const otherDocument=await get('/api/documents/'+invoice.invoice_no,cookies.get('1:owner'));
 if(otherDocument.status===200)assert.notEqual(otherDocument.data.item.id,ownDocument.data.item.id);
 const customer=(await pool.query('select id,name from customers where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 assert.equal((await get('/api/customers/'+customer.id+'?include=workspace',cookies.get('1:owner'))).status,404);
 const finance=['owner','admin','finance'],customerRoles=['owner','admin','finance','project_manager','manager','member','reader'];
 const projectRoles=['owner','admin','project_manager','manager','member','reader'],documentRoles=['owner','admin','finance','project_manager','manager','reader'];
 const expenseRoles=['owner','admin','finance','project_manager','manager','member'],employeeRoles=['owner','admin','hr'],teamRoles=['owner','admin','finance','hr'];
 // Independent expected-role contract: do not derive the expectation from the
 // same tenantCan function being tested by the actual HTTP handlers.
 const reportRoles=["owner","admin","finance","hr","project_manager","manager","reader"];
 let reportFixtureId;const reportReadRoles=new Set(),reportSendReadRoles=new Set();
 for(const role of roles){
  const cookie=cookies.get('0:'+role),body={query:'kind=summary&months=1',locale:'de'},key='native-report-'+role;
  const prepare=()=>fetch(base+'/api/reports/exports',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const response=await prepare();assert.equal(response.status,reportRoles.includes(role)?200:403,'Report preparation enforces the actual HTTP role: '+role);
  if(!reportRoles.includes(role)){
   assert.equal((await get('/api/reports/exports/'+reportFixtureId,cookie)).status,403);reportReadRoles.add(role);
   assert.equal((await get('/api/reports/exports/'+reportFixtureId+'/send',cookie)).status,403);reportSendReadRoles.add(role);continue;
  }
  const {item}=await response.json(),own=await get('/api/reports/exports/'+item.id,cookie);assert.equal(own.status,200);assert.equal(Buffer.from(own.data).subarray(0,5).toString(),'%PDF-');
  reportFixtureId??=item.id;reportReadRoles.add(role);
  assert.equal((await get('/api/reports/exports/'+item.id+'/send',cookie)).status,403,'Isolated demo identities never enable a real outbound report transport');
  reportSendReadRoles.add(role);
  assert.equal((await fetch(base+'/api/reports/exports/'+item.id+'/send',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json','Idempotency-Key':'native-report-send-'+role},body:JSON.stringify({recipient:'synthetic@example.invalid',subject:'Synthetic',message:'Never send from QA'})})).status,403);
  assert.equal((await get('/api/reports/exports/'+item.id,cookies.get('1:'+role))).status,404,'Snapshots cannot cross tenants');
  const otherRole=role==='owner'?'admin':'owner';assert.equal((await get('/api/reports/exports/'+item.id,cookies.get('0:'+otherRole))).status,404,'Own-tenant role permission does not grant another creator’s snapshot');
  assert.deepEqual((await (await prepare()).json()).item,item,'Native retry keeps immutable identity');
 }
 assert.equal(reportReadRoles.size,roles.length);assert.equal(reportSendReadRoles.size,roles.length);
 const snapshotCount=Number((await pool.query('select count(*) n from report_exports')).rows[0].n);
 assert.equal((await fetch(base+'/api/reports/exports',{method:'POST',headers:{cookie:cookies.get('0:owner'),Origin:'https://foreign.invalid','Content-Type':'application/json','Idempotency-Key':'foreign-report-request'},body:JSON.stringify({query:'months=1',locale:'de'})})).status,403);
 assert.equal(Number((await pool.query('select count(*) n from report_exports')).rows[0].n),snapshotCount,'Foreign-origin rejection has no persistent side effect');
 const readContracts=[
  ["/api/reports",reportRoles],
  ['/api/reports?kind=time',['owner','admin','finance','project_manager','manager']],
  ['/api/customers/archive',['owner','admin']],
  ['/api/auth/passkeys',roles],
  ['/api/time-entries/options?kind=customers',expenseRoles],
  ['/api/time-entries/options?kind=projects',expenseRoles],
  ['/api/workforce-assignments',['owner','admin']],
  ...['/api/auth/mfa','/api/auth/register','/api/auth/session','/api/auth/sessions','/api/dashboard','/api/files','/api/finance/overview','/api/integrations/status','/api/notifications','/api/search?q=Alpen','/api/settings/company','/api/settings/documents','/api/settings/notifications','/api/settings/profile','/api/support/tickets'].map(path=>[path,roles]),
  ...['/api/billing/catalog','/api/payments','/api/finance','/api/settings/subscription','/api/time-entries/billing','/api/expenses/billing'].map(path=>[path,finance]),
  ['/api/finance/overview?include=workspace',documentRoles],
  ...['/api/customers','/api/customers/'+customer.id,'/api/customers/'+customer.id+'/activity','/api/customers/'+customer.id+'/contacts','/api/customers/'+customer.id+'?include=workspace'].map(path=>[path,customerRoles]),
  ['/api/customers/duplicates?name='+encodeURIComponent(customer.name),customerRoles],
  ...['/api/documents','/api/customers/'+customer.id+'/documents'].map(path=>[path,documentRoles]),
  ...['/api/products','/api/projects'].map(path=>[path,projectRoles]),
  ...['/api/expenses','/api/expenses/options','/api/time-entries','/api/time-entries/policy','/api/time-tracker'].map(path=>[path,expenseRoles]),
  ['/api/employees',employeeRoles],['/api/settings/team/invitations',teamRoles],
 ];
 readContracts.push(['/api/documents/'+encodeURIComponent(offer.quote_no)+'/versions',documentRoles]);
 const project=(await pool.query('select id from projects where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const employee=(await pool.query('select id from employees where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const product=(await pool.query('select id from products_services where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const payment=(await pool.query('select id from payments where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const expense=(await pool.query('select id from expenses where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 const ticket=(await pool.query('select id from support_cases where organization_id=$1 order by id limit 1',[organizations[0]])).rows[0];
 readContracts.push(['/api/projects/'+project.id,projectRoles],['/api/employees/'+employee.id,employeeRoles],['/api/products/'+product.id,projectRoles],['/api/payments/'+payment.id,finance],['/api/support/tickets/'+ticket.id+'/messages',roles]);
 // Restricted runtime must receive real, narrowly scoped workforce fixtures.
 const scopedCustomers=(await pool.query("select distinct id from customers where organization_id=$1 and (id=$2 or id in(select customer_id from quotes where id=$3) or id in(select customer_id from projects where id=$4) or id in(select customer_id from expenses where id=$5))",[organizations[0],customer.id,offer.id,project.id,expense.id])).rows;
 for(const role of ['project_manager','manager','member']){
  const user='http-0-'+role,staff=(await pool.query('select id from employees where organization_id=$1 and user_id=$2',[organizations[0],user])).rows[0];
  for(const row of scopedCustomers)await pool.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,starts_on,created_by_user_id) values($1,$2,$3,$4,'2000-01-01','http-0-owner')",[organizations[0],user,staff.id,row.id]);
  const linkedProject=(await pool.query('select customer_id from projects where id=$1',[project.id])).rows[0];
  await pool.query("insert into workforce_assignments(organization_id,user_id,employee_id,customer_id,project_id,starts_on,created_by_user_id) values($1,$2,$3,$4,$5,'2000-01-01','http-0-owner')",[organizations[0],user,staff.id,linkedProject.customer_id,project.id]);
 }
 const unassigned=(await pool.query("insert into customers(organization_id,external_id,customer_no,name) values($1,'http-unassigned','HTTP-UNASSIGNED','Synthetic unassigned customer') returning id",[organizations[0]])).rows[0];
 const archivedCustomer=(await pool.query("insert into customers(organization_id,external_id,customer_no,name,archived_at) values($1,'http-archived','HTTP-ARCHIVED','Synthetic archived customer',now()) returning id",[organizations[0]])).rows[0];
 for(const role of ['project_manager','manager','member'])assert.equal((await get('/api/customers/'+unassigned.id,cookies.get('0:'+role))).status,404,role+' cannot read an unassigned customer');
 for(const [path,allowed] of readContracts)for(const role of roles){const r=await get(path,cookies.get('0:'+role));assert.equal(r.status,allowed.includes(role)?200:403,role+' GET '+path+': '+JSON.stringify(r.data));}
 // Workspace access is not accounting access. Keep expectations independent
 // of the production permission helper and verify the actual response content.
 for(const role of roles)for(const suffix of ['', '&view=cash', '&customerId='+customer.id]){
  const response=await get('/api/finance/overview?include=workspace'+suffix,cookies.get('0:'+role));
  assert.equal(response.status,documentRoles.includes(role)?200:403,role+' scoped finance workspace');
  if(!documentRoles.includes(role))continue;
  assert.ok(Number.isInteger(response.data.offers?.actionable_count)&&response.data.offers.actionable_count>=0,role+' receives the actual finite offer-count contract');
  if(finance.includes(role)){
   assert.ok(response.data.cash&&typeof response.data.cash==='object',role+' has the authorized cash workspace');
   if(!suffix.includes('view=cash'))assert.ok(Object.keys(response.data.data).length,role+' has authorized accounting data');
  }else{
   assert.equal(response.data.cash,null,role+' must not receive a cash snapshot');
   assert.deepEqual(response.data.data,{},role+' must not receive accounting records');
  }
  if(['project_manager','manager'].includes(role)){
   assert.deepEqual(response.data.invoices,[],role+' has no invoice grant');
   assert.deepEqual(response.data.documents,[],role+' has no overdue-invoice grant');
   assert.ok(response.data.offers&&typeof response.data.offers==='object',role+' retains authorized offer summary');
  }
 }
 const scopedForeign=await get('/api/finance/overview?include=workspace&customerId='+customer.id,cookies.get('1:owner'));
 assert.equal(scopedForeign.status,200);assert.equal(scopedForeign.data.invoices.length,0);assert.equal(scopedForeign.data.documents.length,0);assert.equal(Number(scopedForeign.data.offers.actionable_count),0,'A foreign customer cannot expose another tenant through workspace scope');
 const duplicatePath='/api/customers/duplicates?name='+encodeURIComponent(customer.name);
 const ownDuplicates=await get(duplicatePath,cookies.get('0:owner')),foreignDuplicates=await get(duplicatePath,cookies.get('1:owner'));
 assert.equal(ownDuplicates.status,200);assert.ok(ownDuplicates.data.items.some(item=>item.id===customer.id),'Duplicate lookup has a positive own-tenant fixture');
 assert.equal(foreignDuplicates.status,200);assert.ok(foreignDuplicates.data.items.every(item=>item.id!==customer.id),'Duplicate lookup cannot disclose the other tenant customer');
 const anonymousRegistration=await get('/api/auth/register','');assert.equal(anonymousRegistration.status,200);assert.equal(anonymousRegistration.data.state,'new');assert.equal(anonymousRegistration.data.pending,null,'Anonymous registration context contains no other tenant receipt');
 for(const index of [0,1])for(const role of roles){const registration=await get('/api/auth/register',cookies.get(index+':'+role));assert.equal(registration.status,200);assert.equal(registration.data.state,'authenticated');assert.equal(registration.data.pending,undefined,'Authenticated handoff cannot expose a pending registration receipt');assert.ok(registration.data.next.startsWith('/'),'Role-specific onboarding stays inside the app');}
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
 assert.equal((await get('/api/projects/'+project.id,cookies.get('1:owner'))).status,404,'Foreign project workspace ID stays hidden');
 const inventory=JSON.parse(await fs.readFile('docs/architecture/v21-3-data-inventory.json','utf8'));
 const covered=new Set(readContracts.map(([path])=>path.split('?')[0].replace(new RegExp(customer.id+'|'+project.id+'|'+employee.id+'|'+product.id+'|'+payment.id+'|'+ticket.id,'g'),'[id]')));
 // These dynamic IDs are created and exercised above, including the denied
 // member role, own-creator boundary and all eight demo-send denials.
 for(const path of ['/api/reports/exports/[id]','/api/reports/exports/[id]/send'])covered.add(path);
 for(const path of ['/api/expenses/[id]','/api/documents/[number]','/api/documents/[number]/pdf','/api/documents/[number]/versions','/api/files/[id]/download'])covered.add(path);
 const publicEntries=new Set(['/api/auth/invitation','/api/health','/api/health/ready','/api/demo/session','/api/operator/sso/callback']);
 for(const api of inventory.apis.filter(item=>item.methods.includes('GET'))){
  if(api.path.startsWith('/api/operator/')&&!publicEntries.has(api.path)||api.path.startsWith('/api/demo/')&&!publicEntries.has(api.path)){
   for(const role of roles)assert.equal((await get(api.path.replace(/\[[^\]]+\]/g,customer.id)+(api.path==='/api/demo/data'?'?collection=customers':''),cookies.get('0:'+role))).status,(api.path.startsWith('/api/demo/')||api.path==='/api/operator/demo-session')?410:401,role+' separate session boundary '+api.path);covered.add(api.path);
  }
  assert.ok(covered.has(api.path)||publicEntries.has(api.path),'Uncovered authenticated GET contract: '+api.path);
 }
 const write=async(method,path,body,role)=>{
  const response=await fetch(base+path,{method,headers:{cookie:cookies.get('0:'+role),origin:base,'Content-Type':'application/json','Idempotency-Key':'v215-'+role+'-'+path.replaceAll('/','-')},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  return {status:response.status,data:await response.json()};
 };

 // Personal image activation is self-scoped for every existing tenant role.
 // Real HTTP/session/runtime-role checks complement the isolated route tests.
 const avatarImage=await (await import('sharp')).default({create:{width:512,height:512,channels:3,background:'#123456'}}).png().toBuffer();
 for(const role of roles){
  const avatarId=(await pool.query('select gen_random_uuid() id')).rows[0].id,userId='http-0-'+role;
  const previous=(await pool.query('select avatar_url from app_users where id=$1',[userId])).rows[0].avatar_url;
  await pool.query("insert into file_objects(id,organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,purpose) values($1,$2,$3,'avatar.png','image/png',$4,$5,'pending',$6,'profile_avatar')",[avatarId,organizations[0],organizations[0]+'/avatar-'+role+'.png',avatarImage.length,createHash('sha256').update(avatarImage).digest('hex'),userId]);
  await pool.query('insert into file_contents(file_id,organization_id,body) values($1,$2,$3)',[avatarId,organizations[0],avatarImage]);
  const path='/api/files/'+avatarId,body={action:'activate_profile_avatar',expectedAvatarUrl:previous};
  assert.equal((await write('PATCH',path,body,role)).status,409,role+' pending avatar stays quarantined');
  await pool.query("update file_objects set scan_status='clean' where id=$1",[avatarId]);
  assert.equal((await write('PATCH',path,{...body,expectedAvatarUrl:'/api/files/changed/download'},role)).status,409,role+' stale image cannot replace current reference');
  const changed=await write('PATCH',path,body,role);assert.equal(changed.status,200,JSON.stringify(changed.data));assert.equal(changed.data.activated,true);
  assert.equal((await write('PATCH',path,body,role)).data.item.alreadyActive,true,role+' replay is harmless');
  assert.equal((await pool.query("select count(*)::int n from audit_events where organization_id=$1 and entity_id=$2 and action='avatar_activated'",[organizations[0],avatarId])).rows[0].n,1);
  if(role!=='owner')assert.equal((await write('PATCH',path,body,'owner')).status,404,'An owner cannot adopt a coworker personal image');
  const foreign=await fetch(base+path,{method:'PATCH',headers:{cookie:cookies.get('1:owner'),origin:base,'Content-Type':'application/json'},body:JSON.stringify(body)});assert.equal(foreign.status,404,'Avatar activation stays tenant-scoped');
 }
 const archiveRead=await get('/api/customers/archive',cookies.get('0:owner')),archiveRow=archiveRead.data.items.find(item=>item.id===archivedCustomer.id);assert.ok(archiveRow,'Archived HTTP contract has a positive own-tenant fixture');
 assert.ok(!(await get('/api/customers/archive',cookies.get('1:owner'))).data.items.some(item=>item.id===archivedCustomer.id),'Archive listing remains tenant-scoped under the runtime role');
 for(const role of roles.filter(role=>!['owner','admin'].includes(role)))assert.equal((await write('POST','/api/customers/archive',{id:archiveRow.id,revision:archiveRow.revision},role)).status,403,role+' cannot restore a customer');
 assert.equal((await write('POST','/api/customers/archive',{id:archiveRow.id,revision:'stale'},'owner')).status,409);
 const restoreHttp=await write('POST','/api/customers/archive',{id:archiveRow.id,revision:archiveRow.revision},'owner');assert.equal(restoreHttp.status,200,JSON.stringify(restoreHttp.data));assert.equal(restoreHttp.data.item.id,archivedCustomer.id);
 assert.equal((await write('POST','/api/customers/archive',{id:archiveRow.id,revision:archiveRow.revision},'owner')).data.item.restored,false,'HTTP retry does not repeat restoration');
 // Valid independent synthetic payloads exercise successful persistence, not just
 // validation errors. Rejected roles must not change either tenant's row count.
 const customerWriters=['owner','admin','finance'];
 const projectWriters=['owner','admin'];
 const timeWriters=['owner','admin','project_manager','manager','member'];
 const expenseWriters=['owner','admin','finance','project_manager','manager','member'];
 const offerWriters=['owner','admin','project_manager','manager'];
 const paymentInvoice=(await pool.query("select id,customer_id from invoices where organization_id=$1 and archived_at is null and status in('sent','partial','overdue') and total_amount-paid_amount>3 limit 1",[organizations[0]])).rows[0];assert.ok(paymentInvoice,'Open synthetic invoice for three legal financial role writes');
 const writeContracts=[
  ['/api/customers','customers',customerWriters,role=>({name:'Write contract '+role,contactFirstName:'Synthetic',contactLastName:'Contact',email:role+'@write.invalid'})],
  ['/api/employees','employees',['owner','admin','hr'],role=>({firstName:'Write',lastName:role,jobTitle:'Synthetic ICT',workloadPercent:80,email:role+'@employee-write.invalid',weeklyHours:42,vacationDays:25})],
  ['/api/products','products_services',['owner','admin'],role=>({name:'Synthetic product '+role,kind:'service',unit:'hour',unitPrice:125,vatRate:8.1})],
  ['/api/projects','projects',projectWriters,role=>({name:'Synthetic project '+role,customerId:customer.id})],
  ['/api/time-entries','time_entries',timeWriters,role=>({projectId:null,projectName:'Internal '+role,durationMinutes:60,startedAt:'2026-10-09',billable:false})],
  ['/api/expenses','expenses',expenseWriters,role=>({merchant:'Synthetic expense '+role,expenseDate:'2026-10-09',amount:10,currency:'CHF',vatRate:8.1,status:'draft'})],
  ['/api/support/tickets','support_cases',roles,role=>({subject:'Synthetic support '+role,message:'Isolated role contract message'})],
  ['/api/payments','payments',finance,()=>({invoiceId:paymentInvoice.id,customerId:paymentInvoice.customer_id,paidOn:'2026-10-09',amount:1,method:'bank'})],
  ['/api/documents','invoices',finance,()=>({kind:'invoice',customerId:customer.id,issueDate:'2026-10-09',dueDate:'2026-11-09',currency:'CHF',items:[{description:'Synthetic invoice line',quantity:1,unitPrice:100,vatRate:8.1}]})],
  ['/api/documents','quotes',offerWriters,()=>({kind:'offer',customerId:customer.id,issueDate:'2026-10-09',currency:'CHF',items:[{description:'Synthetic offer line',quantity:1,unitPrice:100,vatRate:8.1}]})],
 ];
 let writeCases=0;const createdInvoices=new Map();
 const missingContact=await write('POST','/api/customers',{name:'Invalid missing contact'},'owner');assert.equal(missingContact.status,400);assert.equal(missingContact.data.error,'contact_required','HTTP validation rejects a missing contact without weakening role contracts');
 for(const [path,table,allowed,payload] of writeContracts)for(const role of roles){
  const count=async org=>(await pool.query('select count(*)::int n from '+table+' where organization_id=$1',[org])).rows[0].n;
  const before=await count(organizations[0]),otherBefore=await count(organizations[1]);
  const result=await write('POST',path,payload(role),role);
  assert.equal(result.status,allowed.includes(role)?201:403,role+' valid write contract '+path+' '+JSON.stringify(result.data));
  assert.equal(await count(organizations[0]),before+(allowed.includes(role)?1:0),role+' persistence/denial '+path);
  assert.equal(await count(organizations[1]),otherBefore,'Other tenant unchanged '+path);
  if(allowed.includes(role)){assert.ok(result.data.item?.id,role+' persisted identity '+path);const saved=(await pool.query('select organization_id from '+table+' where id=$1',[result.data.item.id])).rows[0];assert.equal(saved.organization_id,organizations[0]);}
  if(table==='invoices'&&allowed.includes(role))createdInvoices.set(role,result.data.item);
  writeCases++;
 }
 // Real HTTP status changes: successful finance roles each use their own draft;
 // denied roles must leave the invoice row exactly unchanged.
 for(const role of roles){
  const item=createdInvoices.get(role)??createdInvoices.get('owner');
  const before=(await pool.query('select status,paid_amount from invoices where id=$1',[item.id])).rows[0];
  const result=await write('POST','/api/documents/'+encodeURIComponent(item.number)+'/status',{action:'issue'},role);
  assert.equal(result.status,finance.includes(role)?200:403,role+' invoice status role '+JSON.stringify(result.data));
  const after=(await pool.query('select status,paid_amount from invoices where id=$1',[item.id])).rows[0];
  if(finance.includes(role)){assert.equal(after.status,'sent');assert.equal(after.paid_amount,before.paid_amount);}
  else assert.deepEqual(after,before,'Forbidden role cannot issue invoice');
 }
 const issued=createdInvoices.get('owner');
 const invalidState=await write('POST','/api/documents/'+encodeURIComponent(issued.number)+'/status',{action:'accept'},'owner');
 assert.equal(invalidState.status,409,'Invoice cannot use offer-only accept transition');
 assert.equal((await pool.query('select status from invoices where id=$1',[issued.id])).rows[0].status,'sent');
 for(const role of roles){
  const result=await write('PATCH','/api/settings/team/members/http-1-member',{role:'admin'},role);
  assert.equal(result.status,['owner','admin'].includes(role)?404:403,role+' foreign membership role change');
  assert.equal((await pool.query("select role from organization_memberships where organization_id=$1 and user_id='http-1-member'",[organizations[1]])).rows[0].role,'member');
 }
 for(const role of roles)for(const [method,path,body] of [
  ['POST','/api/operator/announcements',{title:'Forbidden tenant action',body:'Synthetic message'}],
  ['PATCH','/api/operator/accounts/'+organizations[1],{plan:'pro'}],
  ['POST','/api/operator/restrictions',{tenantId:organizations[1],reason:'Forbidden action'}],
 ])assert.equal((await write(method,path,body,role)).status,401,role+' cannot use operator mutation '+path);
 console.log('Extended HTTP negative/status contract: eight invoice issue-role cases, forbidden invoice transition, eight cross-tenant membership changes and 24 tenant-to-operator mutation denials passed with unchanged forbidden rows. Full operator-role/provider matrix remains separate.');
 for(const role of roles){
  const original=(await pool.query('select name from customers where organization_id=$1 and id=$2',[organizations[1],(await pool.query('select id from customers where organization_id=$1 limit 1',[organizations[1]])).rows[0].id])).rows[0].name;
  const foreignCustomer=(await pool.query('select id from customers where organization_id=$1 limit 1',[organizations[1]])).rows[0].id;
  const result=await write('PATCH','/api/customers/'+foreignCustomer,{name:'Forbidden overwrite'},role);
  assert.equal(result.status,['owner','admin','finance','project_manager','manager'].includes(role)?404:403,role+' foreign customer write');
  assert.equal((await pool.query('select name from customers where id=$1',[foreignCustomer])).rows[0].name,original,'Cross-tenant write cannot mutate the object');
  const removed=await write('DELETE','/api/customers/'+foreignCustomer,{},role);
  assert.equal(removed.status,['owner','admin'].includes(role)?404:403,role+' foreign customer delete');
  assert.equal((await pool.query('select name from customers where id=$1 and archived_at is null',[foreignCustomer])).rows[0].name,original);
 }
 console.log('Authenticated valid write-role contract: '+writeCases+' actual create/persistence cases across all eight roles for customers, employees, products, projects, internal time, expenses, support, offers, invoices and payments; foreign customer PATCH/DELETE blocked with unchanged rows. Other write/status/operator contracts remain explicitly outside this coverage.');
 console.log('Authenticated read-role contract: every inventoried private GET route across all eight tenant roles, including binary PDF/files, own-record expense filtering, every operator/demo boundary; public/token entry points explicitly excluded. Write-role coverage is separate and incomplete.');
 for(const [role,allowed] of [['owner',true],['admin',true],['finance',true],['hr',false],['project_manager',false],['manager',false],['member',false],['reader',false]])assert.equal((await get('/api/payments',cookies.get('0:'+role))).status,allowed?200:403,role+' payment read policy');
 for(const role of roles)assert.equal((await get('/api/operator/dashboard',cookies.get('0:'+role))).status,401,'Tenant '+role+' cannot gain operator access');
 // Actual Next handlers and a NOBYPASSRLS database login, never a real mail provider.
 await pool.query("update app_users set mfa_enabled=false where id='http-0-owner'");
 assert.equal((await get('/api/settings/profile',cookies.get('0:owner'))).status,200,'Optional MFA cannot lock ordinary profile access');
 await pool.query("update auth_sessions set step_up_at=null where user_id='http-0-owner'");
 assert.equal((await write('PATCH','/api/settings/documents',{},'owner')).data.error,'fresh_authentication_required','Bank/settings mutations require fresh proof before validation or writes');
 await pool.query("update auth_sessions set step_up_at=now() where user_id='http-0-owner'");
 const capabilityQuote=(await pool.query("select id,quote_no from quotes where organization_id=$1 and archived_at is null and status in ('sent','draft') order by id limit 1",[organizations[0]])).rows[0];
 await pool.query("update quotes set status='sent',valid_until='2099-12-31' where id=$1",[capabilityQuote.id]);
 const document=(await get('/api/documents/'+encodeURIComponent(capabilityQuote.quote_no),cookies.get('0:owner'))).data.item;
 const pdfResponse=await get('/api/documents/'+encodeURIComponent(capabilityQuote.quote_no)+'/pdf',cookies.get('0:owner'));assert.equal(pdfResponse.status,200);const pdf=Buffer.from(pdfResponse.data);
 const version=(await pool.query('insert into offer_versions(organization_id,quote_id,version,number,document,company,pdf,pdf_sha256,created_by_user_id) values($1,$2,1,$3,$4,$5,$6,$7,$8) returning id',[organizations[0],capabilityQuote.id,capabilityQuote.quote_no,JSON.stringify(document),JSON.stringify({name:'Synthetic HTTP Company'}),pdf,createHash('sha256').update(pdf).digest('hex'),'http-0-owner'])).rows[0];
 const publicPost=async body=>{const response=await fetch(base+'/api/public/offer',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(body)});return {status:response.status,data:await response.json()}};
 const links=[];
 for(const action of ['accept','decline']){
  const token=randomBytes(32).toString('base64url'),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',createHash('sha256').update(testEncryptionKey).digest(),iv),encrypted=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]),tokenEnc=[iv,cipher.getAuthTag(),encrypted].map(bytes=>bytes.toString('base64url')).join('.');
  const link=(await pool.query("insert into offer_public_links(organization_id,version_id,token_hash,token_enc,recipient,created_by_user_id,expires_at) values($1,$2,$3,$4,'synthetic-recipient@fixture.invalid','http-0-owner',now()+interval '1 day') returning id",[organizations[0],version.id,createHash('sha256').update(token).digest('hex'),tokenEnc])).rows[0];
  const code=action==='accept'?'123456':'654321';
  await pool.query("insert into offer_recipient_codes(organization_id,link_id,action,code_hash,expires_at) values($1,$2,$3,$4,now()+interval '10 minutes')",[organizations[0],link.id,action,createHmac('sha256',testEncryptionKey).update(link.id+'|'+action+'|'+code).digest('hex')]);
  links.push({token,action,code,id:link.id});
 }
 assert.equal((await fetch(base+'/api/public/offer')).status,405,'GET cannot trigger any public offer action');
 assert.equal((await publicPost({token:links[0].token,action:'read'})).status,200);
 assert.equal((await pool.query('select status from quotes where id=$1',[capabilityQuote.id])).rows[0].status,'sent','Opening cannot decide');
 assert.equal((await publicPost({token:'x'.repeat(43),action:'read'})).status,410);
 const decisions=await Promise.all(links.map(link=>publicPost({token:link.token,action:'respond',decision:link.action,code:link.code,message:'',requestKey:randomBytes(16).toString('hex'),confirmed:true})));
 assert.deepEqual(decisions.map(result=>result.status).sort(),[200,409],'Competing HTTP decisions produce exactly one committed winner');
 assert.equal((await pool.query("select count(*)::int n from offer_public_events where link_id=any($1::uuid[]) and kind in ('accepted','declined')",[links.map(link=>link.id)])).rows[0].n,1);
 assert.equal((await get('/api/documents/'+encodeURIComponent(capabilityQuote.quote_no)+'/versions?version=1',cookies.get('1:owner'))).status,404,'Foreign tenant cannot fetch the archived PDF');
 console.log('Real HTTP public offers: restricted runtime login, GET refusal, scoped capability lookup, atomic two-client acceptance/decline and archived-PDF tenant denial passed; no Graph credentials.');
 const ownRows=await get('/api/customers',cookies.get('0:owner')),foreignRows=await get('/api/customers',cookies.get('1:owner'));
 const ownIds=new Set(ownRows.data.items.map(item=>item.id));assert.ok(!foreignRows.data.items.some(item=>ownIds.has(item.id)));
 await pool.query("update auth_sessions set expires_at=now()-interval '1 second' where user_id='http-0-owner'");assert.equal((await get('/api/customers',cookies.get('0:owner'))).status,401,'Expired real database session is denied');
 console.log('Real HTTP + PostgreSQL: two isolated tenants, direct IDs in '+positive.join(', ')+', customer snapshot, legal same-number documents, all eight payment roles, operator boundary and actual session expiry passed. Synthetic sessions only.');
}finally{server?.kill();await pool.end();}
