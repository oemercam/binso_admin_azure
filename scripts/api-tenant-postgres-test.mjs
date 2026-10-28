import {verifyAdditionalHttpReads} from './api-additional-read-contracts.mjs';
import {verifyConcurrentTrialExpiry} from './session-expiry-native-test.mjs';
import assert from 'node:assert/strict';
import {prepareHistoricalFixtureOwner} from './fixtures/template-access.mjs';
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {createHash,createHmac,createCipheriv,randomBytes} from 'node:crypto';
import pg from 'pg';
import {moduleUrl,financialModuleUrl} from './data-test-modules.mjs';

const address=process.env.BINSO_DB_PARALLEL_TEST_URL;
if(!address)throw new Error('Explicit isolated PostgreSQL URL required');
const url=new URL(address);
assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Refuses any other database');
const pool=new pg.Pool({connectionString:address,max:8});
let server;
try{
 const pgVersion=Number((await pool.query("select current_setting('server_version_num') version")).rows[0].version);assert.ok(pgVersion>=180000&&pgVersion<190000,'Gate requires PostgreSQL 18');
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
 const get=async(path,cookie)=>{
  // Sample before the unchanged 15-second deadline cancels the SQL statement;
  // after cancellation pg_stat_activity no longer contains the responsible query.
  const actor=[...cookies].find(([,value])=>value===cookie)?.[0];
  const diagnose=async()=>{
   try{
    const activity=(await pool.query("select pid,state,wait_event_type,wait_event,extract(epoch from clock_timestamp()-query_start) seconds,pg_blocking_pids(pid) blockers,query from pg_stat_activity where datname=current_database() and pid<>pg_backend_pid() and state<>'idle'")).rows;
    console.error('Isolated database activity',JSON.stringify(activity));
    const query=activity.find(row=>row.query.startsWith('select *,count(*) over()::int total_count')&&row.query.includes('billing_predecessors'))?.query;
    if(query&&actor){
     const [tenant,role]=actor.split(':'),c=await pool.connect();
     try{await c.query('begin');await c.query('set local role binso_runtime');await c.query("set local statement_timeout='5s'");await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[organizations[Number(tenant)],'http-'+tenant+'-'+role]);
      const explained=(await c.query('explain (format json) '+query,[organizations[Number(tenant)],new Date().toISOString().slice(0,10)])).rows[0]['QUERY PLAN'][0];
      console.error('Isolated document plan',JSON.stringify({cost:explained.Plan['Total Cost'],rows:explained.Plan['Plan Rows'],jit:explained.JIT}));
     }finally{await c.query('rollback');c.release();}
    }
   }catch(diagnosticError){console.error('Isolated HTTP diagnostics unavailable',diagnosticError.message);}
  };
  let diagnostics;const timer=setTimeout(()=>{diagnostics=diagnose();},10000);timer.unref();
  try{const response=await fetch(base+path,{headers:{cookie},redirect:'manual',signal:AbortSignal.timeout(15000)});return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():await response.arrayBuffer()};}
  catch(error){console.error('Isolated HTTP read failed',{path,actor,error:error.message});await diagnostics;console.error('Isolated server tail',logs.slice(-4000));throw error;}
  finally{clearTimeout(timer);}
 };
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
 const reportDeliveryRoles=['owner','admin','finance','hr','project_manager','manager'];
 let reportFixtureId,nativeReportShare;const reportReadRoles=new Set(),reportSendReadRoles=new Set(),reportShareReadRoles=new Set();
 for(const role of roles){
  const cookie=cookies.get('0:'+role),body={query:'kind=summary&months=1',locale:'de'},key='native-report-'+role;
  const prepare=()=>fetch(base+'/api/reports/exports',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const response=await prepare();assert.equal(response.status,reportRoles.includes(role)?200:403,'Report preparation enforces the actual HTTP role: '+role);
  if(!reportRoles.includes(role)){
   assert.equal((await get('/api/reports/exports/'+reportFixtureId,cookie)).status,403);reportReadRoles.add(role);
   assert.equal((await get('/api/reports/exports/'+reportFixtureId+'/send',cookie)).status,403);reportSendReadRoles.add(role);assert.equal((await get('/api/reports/exports/'+reportFixtureId+'/share',cookie)).status,403);reportShareReadRoles.add(role);continue;
  }
  const {item}=await response.json(),own=await get('/api/reports/exports/'+item.id,cookie);assert.equal(own.status,200);assert.equal(Buffer.from(own.data).subarray(0,5).toString(),'%PDF-');
  reportFixtureId??=item.id;reportReadRoles.add(role);
  const canDeliver=reportDeliveryRoles.includes(role);
  assert.equal((await get('/api/reports/exports/'+item.id+'/send',cookie)).status,canDeliver?200:403);reportSendReadRoles.add(role);
  assert.equal((await get('/api/reports/exports/'+item.id+'/share',cookie)).status,canDeliver?200:403);reportShareReadRoles.add(role);
  const mailResponse=await fetch(base+'/api/reports/exports/'+item.id+'/send',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json','Idempotency-Key':'native-report-send-'+role},body:JSON.stringify({recipient:'synthetic@example.invalid',subject:'Synthetic',message:'No provider configured in isolated QA'})});assert.equal(mailResponse.status,canDeliver?200:403);
  if(canDeliver){const sent=await mailResponse.json();assert.equal(sent.status,'failed');assert.equal(sent.providerAccepted,false);assert.equal(sent.deliveryConfirmed,false,'Missing credentials cannot simulate delivery');}
  const shareResponse=await fetch(base+'/api/reports/exports/'+item.id+'/share',{method:'POST',headers:{cookie,Origin:base,'Content-Type':'application/json','Idempotency-Key':'native-report-share-'+role},body:JSON.stringify({action:'create',recipient:'synthetic@example.invalid',days:1})});assert.equal(shareResponse.status,canDeliver?200:403);
  if(canDeliver){const shared=(await shareResponse.json()).item;const url=new URL(shared.url);assert.equal(url.pathname,'/bericht');assert.match(url.hash,/^#[A-Za-z0-9_-]{43}$/);assert.ok(!url.search.includes(url.hash.slice(1)));if(role==='owner')nativeReportShare={...shared,token:url.hash.slice(1),pdf:Buffer.from(own.data),exportId:item.id};}
  assert.equal((await get('/api/reports/exports/'+item.id,cookies.get('1:'+role))).status,404,'Snapshots cannot cross tenants');
  const otherRole=role==='owner'?'admin':'owner';assert.equal((await get('/api/reports/exports/'+item.id,cookies.get('0:'+otherRole))).status,404,'Own-tenant role permission does not grant another creator’s snapshot');
  assert.deepEqual((await (await prepare()).json()).item,item,'Native retry keeps immutable identity');
 }
 assert.equal(reportReadRoles.size,roles.length);assert.equal(reportSendReadRoles.size,roles.length);assert.equal(reportShareReadRoles.size,roles.length);
 const queuedReports=(await pool.query("select status,attempts from mail_outbox where kind='report'")).rows;assert.equal(queuedReports.length,reportDeliveryRoles.length);assert.ok(queuedReports.every(row=>row.status==='failed'&&row.attempts===0),'Configuration guard performs no transport attempt');
 assert.ok(nativeReportShare);
 const publicReport=async body=>{const response=await fetch(base+'/api/public/report',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});return {status:response.status,data:response.headers.get('content-type')?.includes('json')?await response.json():Buffer.from(await response.arrayBuffer())};};
 assert.equal((await fetch(base+'/api/public/report')).status,405);
 const reportProof={token:nativeReportShare.token,action:'pdf',code:'123456',key:'native-report-proof'};assert.equal((await publicReport(reportProof)).status,403,'An unverified capability cannot read a report');
 assert.equal((await publicReport({token:nativeReportShare.token,action:'challenge'})).status,503,'Missing real mail credentials cannot pretend to send a recipient code');assert.equal(Number((await pool.query('select count(*) n from report_recipient_codes where link_id=$1',[nativeReportShare.id])).rows[0].n),0);
 await pool.query("insert into report_recipient_codes(organization_id,link_id,code_hash) values($1,$2,$3)",[organizations[0],nativeReportShare.id,createHmac('sha256',testEncryptionKey).update(nativeReportShare.id+'|report.pdf|123456').digest('hex')]);
 assert.equal((await publicReport({...reportProof,code:'000000'})).status,403);assert.equal((await pool.query('select attempts from report_recipient_codes where link_id=$1',[nativeReportShare.id])).rows[0].attempts,1);
 const verified=await publicReport(reportProof);assert.equal(verified.status,200);assert.deepEqual(verified.data,nativeReportShare.pdf);assert.deepEqual((await publicReport(reportProof)).data,nativeReportShare.pdf);
 assert.equal((await publicReport({...reportProof,key:'different-native-proof'})).status,403);
 const revoked=await fetch(base+'/api/reports/exports/'+nativeReportShare.exportId+'/share',{method:'POST',headers:{cookie:cookies.get('0:owner'),origin:base,'content-type':'application/json'},body:JSON.stringify({action:'revoke',linkId:nativeReportShare.id})});assert.equal(revoked.status,200);assert.equal((await publicReport(reportProof)).status,410);
 const snapshotCount=Number((await pool.query('select count(*) n from report_exports')).rows[0].n);
 assert.equal((await fetch(base+'/api/reports/exports',{method:'POST',headers:{cookie:cookies.get('0:owner'),Origin:'https://foreign.invalid','Content-Type':'application/json','Idempotency-Key':'foreign-report-request'},body:JSON.stringify({query:'months=1',locale:'de'})})).status,403);
 assert.equal(Number((await pool.query('select count(*) n from report_exports')).rows[0].n),snapshotCount,'Foreign-origin rejection has no persistent side effect');
 const readContracts=[
  ['/api/settings/readiness',['owner','admin']],
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
 readContracts.push(['/api/documents/'+encodeURIComponent(offer.quote_no)+'/followups',['owner','admin','project_manager','manager']]);
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
 for(const [path,allowed] of readContracts)for(const role of roles){const r=await get(path,cookies.get('0:'+role));assert.equal(r.status,allowed.includes(role)?200:403,role+' GET '+path+': '+JSON.stringify(r.data));
  if(path==='/api/reports'&&r.status===200){
   if(['owner','admin','finance'].includes(role)){assert.ok(Array.isArray(r.data.vat),role+' retains VAT reporting under the existing Pro fixture');for(const item of r.data.vat)assert.deepEqual(Object.keys(item).sort(),['currency','grossBeforeCredits','invoiceCount','netBeforeCredits','unallocatedCreditCount','unallocatedCreditGross','vatBeforeCredits'],'No invoice identity or invented allocated tax leaves the native boundary');}
   else assert.equal(r.data.vat,null,role+' cannot receive VAT data');
   if(role==='hr')assert.equal(r.data.offers,null,'HR has no sales grant');
   else {assert.ok(Array.isArray(r.data.offers),role+' retains its existing sales grant');for(const item of r.data.offers)assert.deepEqual(Object.keys(item).sort(),['count','currency','status','volume'],'Only offer aggregates leave the native HTTP boundary');}
  }
 }
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
 // member role, own-creator boundary and actual delivery permissions. Providers
 // are absent; allowed sends must record failure with zero transport attempts.
 for(const path of ['/api/reports/exports/[id]','/api/reports/exports/[id]/send','/api/reports/exports/[id]/share'])covered.add(path);
 for(const path of ['/api/expenses/[id]','/api/documents/[number]','/api/documents/[number]/pdf','/api/documents/[number]/versions','/api/documents/[number]/followups','/api/files/[id]/download'])covered.add(path);
 for(const path of await verifyAdditionalHttpReads({pool,base,get,cookies,roles,organizations,customer,project,employee}))covered.add(path);
 const publicEntries=new Set(['/api/auth/invitation','/api/health','/api/health/ready','/api/demo/session','/api/operator/sso/callback']);
 const uncoveredGets=[];
 for(const api of inventory.apis.filter(item=>item.methods.includes('GET'))){
  if(api.path.startsWith('/api/operator/')&&!publicEntries.has(api.path)||api.path.startsWith('/api/demo/')&&!publicEntries.has(api.path)){
   for(const role of roles)assert.equal((await get(api.path.replace(/\[[^\]]+\]/g,customer.id)+(api.path==='/api/demo/data'?'?collection=customers':''),cookies.get('0:'+role))).status,(api.path.startsWith('/api/demo/')||api.path==='/api/operator/demo-session')?410:401,role+' separate session boundary '+api.path);covered.add(api.path);
  }
  if(!covered.has(api.path)&&!publicEntries.has(api.path))uncoveredGets.push(api.path);
 }
 assert.deepEqual(uncoveredGets,[],'Every inventoried GET requires an executed HTTP contract');
 console.log('Complete GET inventory coverage: '+inventory.apis.filter(item=>item.methods.includes('GET')).length+' routes; no omitted private GETs.');
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
  const freshToken=randomBytes(32).toString('base64url');await pool.query("insert into auth_sessions(user_id,organization_id,token_hash,expires_at) values($1,$2,$3,now()+interval '1 hour')",[userId,organizations[0],createHash('sha256').update(freshToken).digest('hex')]);
  const freshCookie='binso_v213_test_session='+freshToken;
  assert.equal((await get('/api/settings/profile',freshCookie)).data.item.avatar_url,'/api/files/'+avatarId+'/download',role+' new authenticated session reads the persisted avatar');
  assert.equal((await get(path+'/download',freshCookie)).status,200,role+' own image remains accessible');
  const removed=await write('DELETE',path,{},role);assert.equal(removed.status,200,JSON.stringify(removed.data));
  assert.equal((await get('/api/settings/profile',freshCookie)).data.item.avatar_url,null,role+' removal clears the persisted profile reference');
  assert.equal((await get(path+'/download',freshCookie)).status,404,role+' removed image cannot be downloaded');
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
 const readinessPath='/api/settings/readiness?action=issue_invoice&number='+encodeURIComponent(createdInvoices.get('owner').number);
 for(const role of roles){const response=await get(readinessPath,cookies.get('0:'+role));assert.equal(response.status,finance.includes(role)?200:403,'Actual invoice preflight role '+role);if(finance.includes(role)){assert.equal(response.data.item.ready,true);assert.equal(response.data.item.number,createdInvoices.get('owner').number);}}
 assert.equal((await get(readinessPath,cookies.get('1:owner'))).status,404,'Foreign tenant cannot inspect readiness');
 for(const role of roles){const result=await write('PATCH','/api/settings/readiness',{dismissed:true},role);assert.equal(result.status,['owner','admin'].includes(role)?200:403,'Actual personal setup preference '+role);}
 assert.equal((await write('PATCH','/api/settings/readiness',{dismissed:'true'},'owner')).status,400);
 assert.equal((await write('PATCH','/api/settings/readiness',{dismissed:true,userId:'http-0-admin'},'owner')).status,400,'Recipient override rejected');
 assert.equal((await get('/api/settings/readiness',cookies.get('0:owner'))).data.item.dismissed,true);
 assert.equal((await get('/api/settings/readiness',cookies.get('1:owner'))).data.item.dismissed,false,'A preference never crosses tenants');
 assert.equal((await get('/api/settings/readiness?action=unexpected',cookies.get('0:owner'))).status,400);
 console.log('Native HTTP readiness: all eight read/write roles, personal persistence, foreign tenant, exact invoice binding, invalid boolean/recipient/action rejection passed.');
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
 // Actual HTTP overpayment: explicit reviewed balances, all eight roles, replay
 // and foreign-tenant failures. No payment provider or bank transfer is invoked.
 const receiptInvoices=new Map();
 for(const role of finance){
  const response=await fetch(base+'/api/documents',{method:'POST',headers:{cookie:cookies.get('0:'+role),origin:base,'content-type':'application/json','idempotency-key':'r7-http-isolated-invoice-'+role},body:JSON.stringify({kind:'invoice',customerId:customer.id,issueDate:'2026-10-09',dueDate:'2026-11-09',currency:'CHF',items:[{description:'Isolated actual-receipt contract',quantity:1,unitPrice:100,vatRate:8.1}]}),signal:AbortSignal.timeout(15000)});
  assert.equal(response.status,201);const row=(await response.json()).item;assert.equal((await write('POST','/api/documents/'+encodeURIComponent(row.number)+'/status',{action:'issue'},role)).status,200);receiptInvoices.set(role,row);
 }
 let receiptSequence=0;
 const postReceipt=async(body,role='owner',key='r7-http-receipt-'+(++receiptSequence),tenant=0)=>{
  const response=await fetch(base+'/api/payments',{method:'POST',headers:{cookie:cookies.get(tenant+':'+role),origin:base,'content-type':'application/json','idempotency-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
  return {status:response.status,data:await response.json()};
 };
 const receiptCount=async()=>(await pool.query('select count(*)::int n from payments where organization_id=$1',[organizations[0]])).rows[0].n;
 for(const role of roles){
  const doc=receiptInvoices.get(role)??receiptInvoices.get('owner'),canonical=(await get('/api/documents/'+encodeURIComponent(doc.number),cookies.get('0:owner'))).data.item;
  const total=Number(canonical.total),paid=Number(canonical.paid_amount),credit=Number(canonical.credit_amount??0),refund=Number(canonical.refund_amount??0),open=Math.max(0,Math.round((total-credit-paid+refund)*100)/100);
  const body={invoiceId:doc.id,paidOn:new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich'}).format(new Date()),amount:Math.round((open+10)*100)/100,method:'bank',confirmOverpayment:true,expectedBalance:{openAmount:open,paidAmount:paid,creditAmount:credit,refundAmount:refund}};
  const before=await receiptCount();
  if(!finance.includes(role)){const denied=await postReceipt(body,role);assert.equal(denied.status,403,role+' cannot record confirmed overpayment');assert.equal(await receiptCount(),before);continue;}
  assert.equal((await postReceipt({...body,confirmOverpayment:undefined,expectedBalance:undefined},role)).data.error,'payment_exceeds_balance','Ordinary excess remains blocked over real HTTP');
  for(const invalid of [{...body,confirmOverpayment:'true'},{...body,expectedBalance:undefined},{...body,expectedBalance:{openAmount:open}},{...body,amount:String(body.amount)},{...body,amount:-1},{...body,amount:1.001},{...body,paidOn:'2099-01-01'}])assert.equal((await postReceipt(invalid,role)).status,400,'Malformed confirmation/amount/date is rejected before mutation');
  const stale=await postReceipt({...body,expectedBalance:{...body.expectedBalance,paidAmount:paid+1}},role);assert.equal(stale.status,409);assert.equal(stale.data.error,'payment_balance_changed');assert.equal(await receiptCount(),before);
  const key='r7-http-confirmed-'+role,result=await postReceipt(body,role,key);assert.equal(result.status,201,JSON.stringify(result.data));assert.ok(result.data.item.id);
  const replay=await postReceipt(body,role,key);assert.equal(replay.status,201);assert.deepEqual(replay.data.item,result.data.item,'Real route replays the immutable receipt');assert.equal(await receiptCount(),before+1);
  const after=(await get('/api/documents/'+encodeURIComponent(doc.number),cookies.get('0:owner'))).data.item;
  assert.equal(Number(after.total),total,'Receipt never increases invoice/revenue');assert.equal(Number(after.customer_credit),10);assert.equal(after.payment_status,'overpaid');assert.equal(after.display_status,'overpaid');assert.equal(after.due_status,null);
  const filtered=await get('/api/documents?kind=invoice&payment_status=eq.overpaid',cookies.get('0:'+role));assert.equal(filtered.status,200);assert.ok(filtered.data.items.some(row=>row.id===doc.id));assert.ok(filtered.data.items.every(row=>row.payment_status==='overpaid'),'Real SQL filters independently before pagination');
  const candidates=await get('/api/documents?kind=invoice&payment_candidates=1&id=eq.'+encodeURIComponent(doc.id),cookies.get('0:'+role));assert.equal(candidates.status,200);assert.ok(candidates.data.items.some(row=>row.id===doc.id),'Settled invoices remain exact payment candidates');
  const foreign=await postReceipt(body,role,'r7-http-foreign-'+role,1);assert.equal(foreign.status,400);assert.equal(foreign.data.error,'invoice_invalid');assert.equal(await receiptCount(),before+1);
 }
 console.log('Native HTTP confirmed overpayment: three finance roles succeed/replay once; five roles and cross-tenant access denied; malformed/stale confirmations, ordinary excess, precision and future dates blocked; independent status axes and unchanged invoice total passed.');

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
 const capabilityQuote=(await pool.query("select id,quote_no from quotes where organization_id=$1 and customer_id=$2 and archived_at is null and status in ('sent','draft') order by id limit 1",[organizations[0],customer.id])).rows[0];
 await pool.query("update quotes set status='sent',valid_until='2099-12-31' where id=$1",[capabilityQuote.id]);
 const document=(await get('/api/documents/'+encodeURIComponent(capabilityQuote.quote_no),cookies.get('0:owner'))).data.item;
 const pdfResponse=await get('/api/documents/'+encodeURIComponent(capabilityQuote.quote_no)+'/pdf',cookies.get('0:owner'));assert.equal(pdfResponse.status,200);const pdf=Buffer.from(pdfResponse.data);
 const version=(await pool.query('insert into offer_versions(organization_id,quote_id,version,number,document,company,pdf,pdf_sha256,created_by_user_id) values($1,$2,1,$3,$4,$5,$6,$7,$8) returning id',[organizations[0],capabilityQuote.id,capabilityQuote.quote_no,JSON.stringify(document),JSON.stringify({name:'Synthetic HTTP Company'}),pdf,createHash('sha256').update(pdf).digest('hex'),'http-0-owner'])).rows[0];
 const followupPath='/api/documents/'+encodeURIComponent(capabilityQuote.quote_no)+'/followups';
 const postFollowup=async(path,body,role='owner',tenant=0)=>{const response=await fetch(base+path,{method:'POST',headers:{cookie:cookies.get(tenant+':'+role),origin:base,'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});return {status:response.status,data:await response.json()};};
 const followupToday=(await import(financialModuleUrl)).businessDate(),followupBody={action:'schedule',dueDate:followupToday,optIn:true};
 for(const role of roles){const response=await postFollowup(followupPath,followupBody,role);assert.equal(response.status,['owner','admin','project_manager','manager'].includes(role)?200:403,'Native personal reminder write '+role+': '+JSON.stringify(response.data));}
 assert.equal((await postFollowup(followupPath,{...followupBody,optIn:false})).status,400);
 assert.equal((await postFollowup(followupPath,{...followupBody,dueDate:'2026-02-30'})).status,400);
 assert.equal((await postFollowup(followupPath,{...followupBody,userId:'http-0-admin'})).status,400,'Caller cannot choose a recipient user');
 assert.equal((await postFollowup(followupPath,followupBody,'owner',1)).status,404);
 assert.equal((await postFollowup(followupPath,followupBody)).status,200,'Same plan is idempotent');
 const personalHistory=await get(followupPath,cookies.get('0:owner'));assert.equal(personalHistory.status,200);assert.equal(personalHistory.data.items.length,1);
 const ownFollowupId=personalHistory.data.items[0].id;assert.ok((await get(followupPath,cookies.get('0:admin'))).data.items.every(item=>item.id!==ownFollowupId),'Own-tenant admin cannot read another user reminder');
 assert.equal((await postFollowup(followupPath,{action:'cancel'})).status,200);assert.equal((await get(followupPath,cookies.get('0:owner'))).data.items[0].state,'cancelled');
 for(const role of roles)assert.equal((await postFollowup('/api/notifications/followups',{},role)).status,200,'Read-authorized notifications remain usable for '+role);
 console.log('Real HTTP personal offer followups: all eight write roles, explicit opt-in/date, forbidden recipient override, replay/cancel, personal and cross-tenant boundaries passed. No mail transport.');
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

 // Package 5: actual HTTP validation and authoritative persisted discount totals.
 const discountBody={kind:'invoice',customerId:customer.id,issueDate:'2026-10-22',dueDate:'2026-11-22',currency:'CHF',vatRate:8.1,discount:{kind:'percent',value:5},total:1,items:[{description:'Synthetic HTTP discount',quantity:2,unitPrice:500,vatRate:8.1,discount:{kind:'percent',value:10}}]};
 const discountRequest=async(body,role='owner',tenant=0,method='POST',path='/api/documents',key=randomBytes(16).toString('hex'))=>{const response=await fetch(base+path,{method,headers:{cookie:cookies.get(tenant+':'+role),origin:base,'content-type':'application/json','idempotency-key':key},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});return {status:response.status,data:await response.json()};};
 let discountInvoice;
 for(const role of roles){const result=await discountRequest(discountBody,role);assert.equal(result.status,finance.includes(role)?201:403,'Native discounted invoice write '+role+': '+JSON.stringify(result.data));if(finance.includes(role)){assert.equal(Number(result.data.item.total),924.26,'Client total cannot override the central result');if(role==='owner')discountInvoice=result.data.item;}}
 assert.equal((await discountRequest({...discountBody,discount:{kind:'percent',value:101}})).status,400);
 assert.equal((await discountRequest({...discountBody,discount:{kind:'fixed',value:10,currency:'EUR'}})).status,400);
 assert.equal((await discountRequest(discountBody,'owner',1)).status,400,'Foreign customer cannot be invoiced');
 const discountSaveKey=randomBytes(16).toString('hex'),discountSave={...discountBody,number:discountInvoice.number,discount:{kind:'fixed',value:100,currency:'CHF'}};
 const discountSaves=await Promise.all(Array.from({length:6},()=>discountRequest(discountSave,'owner',0,'PATCH','/api/documents/'+discountInvoice.number,discountSaveKey)));
 assert.ok(discountSaves.every(result=>result.status===200&&Number(result.data.item.total)===864.80));
 assert.equal(Number((await pool.query("select count(*) n from audit_events where entity_id=$1 and action='document.updated'",[discountInvoice.id])).rows[0].n),1);
 assert.equal((await discountRequest({...discountSave,note:'Conflicting payload'},'owner',0,'PATCH','/api/documents/'+discountInvoice.number,discountSaveKey)).status,409);
 assert.equal((await get('/api/documents/'+discountInvoice.number,cookies.get('1:owner'))).status,404);
 const previewDiscountBody={kind:'Rechnung',customerId:customer.id,date:'2026-10-22',currency:'CHF',discount:discountBody.discount,positions:discountBody.items.map(l=>({description:l.description,quantity:l.quantity,price:l.unitPrice,vatRate:l.vatRate,discount:l.discount}))};
 const previewCalculation=await discountRequest({...previewDiscountBody,output:'calculation'},'owner',0,'POST','/api/documents/preview');assert.equal(previewCalculation.status,200);assert.equal(previewCalculation.data.calculation.total,'924.26');
 const previewResponse=await fetch(base+'/api/documents/preview',{method:'POST',headers:{cookie:cookies.get('0:owner'),origin:base,'content-type':'application/json'},body:JSON.stringify(previewDiscountBody)});assert.equal(previewResponse.status,200);
 const previewPdf=await (await import('pdfjs-dist/legacy/build/pdf.mjs')).getDocument({data:new Uint8Array(await previewResponse.arrayBuffer()),useSystemFonts:true}).promise;
 let previewText='';for(let i=1;i<=previewPdf.numPages;i++)previewText+=(await (await previewPdf.getPage(i)).getTextContent()).items.map(item=>item.str??'').join(' ');await previewPdf.destroy();assert.match(previewText,/924.26/);assert.match(previewText,/69.26/);
 const editRevision=discountSaves[0].data.item.document_revision;assert.ok(editRevision);
 const concurrentEdits=await Promise.all(['A','B'].map(note=>discountRequest({...discountSave,note,expectedUpdatedAt:editRevision},'owner',0,'PATCH','/api/documents/'+discountInvoice.number)));
 assert.deepEqual(concurrentEdits.map(r=>r.status).sort(),[200,409],'Two different edits to one loaded revision have one winner');
 assert.equal(concurrentEdits.find(r=>r.status===409).data.error,'document_changed');
 const priorCustomerDiscount=(await pool.query('select discount from customers where id=$1',[customer.id])).rows[0].discount;
 try{await pool.query('update customers set discount=5 where id=$1',[customer.id]);const proposal=await discountRequest({kind:'Rechnung',customerId:customer.id,date:'2026-10-22',currency:'CHF',output:'calculation',positions:[{description:'Synthetic proposal',quantity:2,price:500,vatRate:8.1}]},'owner',0,'POST','/api/documents/preview');assert.equal(proposal.status,200);assert.equal(Number(proposal.data.customerDiscountProposal.value),5);assert.equal(proposal.data.customerDiscountProposal.applied,false);assert.equal(proposal.data.calculation.discount.kind,'none');}
 finally{await pool.query('update customers set discount=$2 where id=$1',[customer.id,priorCustomerDiscount]);}
 console.log('Native HTTP discounts: all eight roles, tenant boundary, manipulated total, validation, six parallel PATCH retries, key conflict and explicit unapplied customer proposal passed.');
 const ownRows=await get('/api/customers',cookies.get('0:owner')),foreignRows=await get('/api/customers',cookies.get('1:owner'));
 const ownIds=new Set(ownRows.data.items.map(item=>item.id));assert.ok(!foreignRows.data.items.some(item=>ownIds.has(item.id)));
 await verifyConcurrentTrialExpiry({base,pool,cookie:cookies.get('0:owner'),organizationId:organizations[0]});
 await pool.query("update auth_sessions set expires_at=now()-interval '1 second' where user_id='http-0-owner'");assert.equal((await get('/api/customers',cookies.get('0:owner'))).status,401,'Expired real database session is denied');
 console.log('Real HTTP + PostgreSQL: two isolated tenants, direct IDs in '+positive.join(', ')+', customer snapshot, legal same-number documents, all eight payment roles, operator boundary and actual session expiry passed. Synthetic sessions only.');
}finally{server?.kill();await pool.end();}
