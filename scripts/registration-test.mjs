import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';

const native=process.argv.includes('--postgres');
let db;
if(native){
 const url=new URL(process.env.BINSO_DB_PARALLEL_TEST_URL??'invalid:');
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Refuse non-disposable PostgreSQL');
 db=new pg.Pool({connectionString:url.href,max:4});
}else db=new PGlite({extensions:{pgcrypto}});
const jar=new Map(),sent=[];
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const adapters={
 'server-only':data(''),
 'next/server':data('export class NextResponse{static json(value,init){return Response.json(value,init)}}'),
 'next/headers':data('export async function cookies(){return globalThis.__registrationCookies} export async function headers(){return new Headers({"user-agent":"registration-test"})}'),
 'lib/server/db.ts':data('export async function query(sql,params){return globalThis.__registrationQuery(sql,params)} export async function withTransaction(fn){return globalThis.__registrationTransaction(fn)} export async function withTenant(org,user,fn){return globalThis.__registrationTransaction(async c=>{await c.query("select set_config(\'app.organization_id\',$1,true),set_config(\'app.user_id\',$2,true)",[org,user]);return fn(c)})}'),
 'lib/server/rate-limit.ts':data('export async function enforceRateLimit(request,bucket){globalThis.__registrationLimits.push(bucket)}'),
 'lib/server/env.ts':data('export const env={databaseUrl:"isolated-test",appUrl:"https://example.invalid",appMode:"production",appEncryptionKey:"synthetic-test-key-not-a-production-secret",sessionTtlHours:168,sessionCookieName:"binso_session"}'),
 'lib/server/email.ts':data('export function mailLayout(title,body,cta,locale){return `<html lang="${locale}">${title}${body}<a href="${cta?.url??""}">${cta?.label??""}</a></html>`} export async function sendMail(mail){globalThis.__registrationMail.push(mail);return {delivered:globalThis.__registrationDelivered}}'),
 'lib/server/repositories/demo-fixture.ts':data('export async function seedDatabaseDemo(){throw new Error("Public registration must never seed demo business data")}'),
};
const modules=new Map();
async function load(file){
 file=file.replaceAll('\\','/');if(adapters[file])return adapters[file];if(modules.has(file))return modules.get(file);
 let source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports=[...source.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)];
 for(const match of imports){const name=match[2];let dependency;if(adapters[name])dependency=adapters[name];else if(name.startsWith('@/')||name.startsWith('.')){let resolved=name.startsWith('@/')?name.slice(2):path.join(path.dirname(file),name);if(!resolved.endsWith('.ts'))resolved+='.ts';dependency=await load(resolved);}else continue;source=source.replace(match[0],match[0].replace(match[1]+name+match[1],JSON.stringify(dependency)));}
 const uri=data(source);modules.set(file,uri);return uri;
}
const asClient=connection=>({query:async(sql,params)=>{const result=await connection.query(sql,params);return {...result,rowCount:result.rowCount??result.affectedRows??result.rows.length}}});
globalThis.__registrationTransaction=async fn=>{
 if(!native)return db.transaction(async connection=>{await connection.query('set local role binso_runtime');return fn(asClient(connection))});
 const connection=await db.connect();
 try{await connection.query('begin');await connection.query('set local role binso_runtime');const result=await fn(asClient(connection));await connection.query('commit');return result}
 catch(e){await connection.query('rollback');throw e}
 finally{connection.release()}
};
globalThis.__registrationQuery=(sql,params)=>globalThis.__registrationTransaction(c=>c.query(sql,params));
globalThis.__registrationCookies={get:name=>jar.has(name)?{value:jar.get(name).value}:undefined,set:(name,value,options)=>jar.set(name,{value,options}),delete:name=>jar.delete(name)};
globalThis.__registrationMail=sent;globalThis.__registrationDelivered=false;globalThis.__registrationLimits=[];
const request=(method,body,url='https://example.invalid/api/auth/register')=>({method,nextUrl:new URL(url),headers:new Headers({'origin':'https://example.invalid'}),body:body===null?null:new Response(JSON.stringify(body)).body});
try{
 if(!native){
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(file=>file.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));
 await db.exec('reset role');
 }
 const operation=await fs.readFile('database/operations/provision-runtime-role.sql','utf8');
 if(native)await db.query(operation);else await db.exec(operation);
 const runtimeCheck=await fs.readFile('scripts/sql/runtime-role-check.sql','utf8');
 const roleProbe=native?await db.connect():db;
 try{await roleProbe.query('set role binso_runtime');if(native)await roleProbe.query(runtimeCheck);else await roleProbe.exec(runtimeCheck)}
 finally{await roleProbe.query('reset role');if(native)roleProbe.release()}
 if(native){
  await db.query('grant create on database binso_v213_test to binso_runtime');
  const ddlProbe=await db.connect();
  try{
   await ddlProbe.query('set role binso_runtime');
   await assert.rejects(()=>ddlProbe.query(runtimeCheck),e=>e.message.includes('database schemas'),'Native runtime gate rejects database CREATE rights');
   await ddlProbe.query('rollback');
  }finally{await ddlProbe.query('reset role');ddlProbe.release();await db.query('revoke create on database binso_v213_test from binso_runtime')}
  // Bind a synthetic credential only in the explicitly disposable local DB.
  const password=randomBytes(32).toString('hex');
  await db.query("alter role binso_runtime password '"+password+"'");
  const runtimeUrl=new URL(process.env.BINSO_DB_PARALLEL_TEST_URL);runtimeUrl.username='binso_runtime';runtimeUrl.password=password;
  await new Promise((resolve,reject)=>{
   const check=spawn(process.execPath,['scripts/check-runtime-db.mjs'],{env:{...process.env,DATABASE_URL:runtimeUrl.href,DATABASE_SSL:'false'},stdio:['ignore','pipe','pipe']});
   let output='';check.stdout.on('data',chunk=>output+=chunk);check.stderr.on('data',chunk=>output+=chunk);
   check.on('error',reject);check.on('exit',code=>{if(code===0){console.log(output.trim());resolve()}else reject(new Error('Isolated runtime readiness failed: '+output.replaceAll(password,'[synthetic secret]')))});
  });
  const versions=(await globalThis.__registrationQuery('select runtime_schema_versions() as version')).rows.map(row=>row.version);
  assert.ok(versions.includes('0047_runtime_auth_bootstrap.sql'));
  await assert.rejects(()=>globalThis.__registrationQuery('select version from schema_migrations'),e=>e.code==='42501','Even native readiness cannot read the ledger directly');
 }
 const register=await import(await load('app/api/auth/register/route.ts')),verify=await import(await load('app/api/auth/verify-email/route.ts')),resend=await import(await load('app/api/auth/resend-verification/route.ts'));
 const context=(await (await register.GET(request('GET',null))).json()).context;
 assert.equal(context.plan,null,'A direct entry does not silently select a paid plan');
 assert.equal(context.trialDays,14);
 const selected=(await (await register.GET(request('GET',null,'https://example.invalid/api/auth/register?plan=business&billing=yearly'))).json()).context;assert.equal(selected.plan.id,'business');assert.equal(selected.billingCycle,'yearly');
 assert.equal((await register.GET(request('GET',null,'https://example.invalid/api/auth/register?plan=forged'))).status,400);
 const translations=await import(await load('lib/i18n.ts'));
 for(const [key,values] of Object.entries(translations.registrationMessages)){assert.equal(values.length,5,key);assert.ok(values.every(value=>typeof value==='string'&&value.length>0),key);}
 const boundary=(await db.query("select p.prosecdef,p.proconfig,(select count(*)::int from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') public_execute from pg_proc p where p.oid='public.bootstrap_organization(text,text,text,text,text)'::regprocedure")).rows[0];
 assert.equal(boundary.prosecdef,true);assert.equal(boundary.public_execute,0);assert.ok(boundary.proconfig.includes('search_path=pg_catalog, public, pg_temp'));
 await globalThis.__registrationTransaction(async c=>{
  await c.query("create temporary table organization_roles(poison boolean) on commit drop");
  await c.query("insert into app_users(id,email,display_name,status) values('bootstrap-shadow-test','shadow@example.invalid','Shadow Test','active')");
  const id=(await c.query("select bootstrap_organization('bootstrap-shadow-test','shadow@example.invalid','Shadow Test','bootstrap-shadow-test','trial') as id")).rows[0].id;
  await c.query("select set_config('app.organization_id',$1,true)",[id]);
  assert.equal((await c.query('select count(*)::int n from public.organization_roles where organization_id=$1',[id])).rows[0].n,4,'A temporary table cannot shadow the privileged role-seeding trigger');
 });
 await assert.rejects(()=>globalThis.__registrationQuery("insert into organizations(name,slug) values('Forbidden Direct Create','forbidden-direct-runtime') returning id"),e=>e.code==='42501','Direct organization bootstrap must remain RLS denied');
 await assert.rejects(()=>globalThis.__registrationQuery("select bootstrap_organization('missing-user','missing@example.invalid','Bad Bootstrap','bad-bootstrap','trial')"),e=>e.code==='42501','The fixed helper cannot attach an unknown account');
 assert.equal(translations.registrationLocale('fr-CH'),'fr');assert.equal(translations.registrationLocale('untrusted'),'de');
 const body={company:'Same Company GmbH',email:'first@example.invalid',password:'a sufficiently long password',plan:'business',billingCycle:'yearly',locale:'fr-CH',acceptedTerms:true,acceptedDpa:true,...Object.fromEntries(['termsVersion','privacyVersion','dpaVersion'].map(key=>[key,context[key]]))};
 assert.equal((await register.POST(request('POST',{...body,acceptedDpa:false}))).status,400);
 assert.equal((await register.POST(request('POST',{...body,dpaVersion:'old'}))).status,409);
 let response=await register.POST(request('POST',body));assert.equal(response.status,201);let payload=await response.json();
 assert.equal(payload.emailSent,false,'An unconfigured/unsuccessful provider must not report a sent email');
 assert.equal((await db.query('select count(*)::int n from app_users where email=$1',[body.email])).rows[0].n,1);
 const receipt=jar.get('binso_registration');assert.equal(receipt.options.httpOnly,true);assert.equal(receipt.options.sameSite,'lax');
 payload=await (await register.GET(request('GET',null))).json();assert.equal(payload.state,'pending');assert.equal(payload.pending.email,body.email);assert.equal(payload.pending.company,body.company);
 const organization=(await db.query('select o.id,s.plan,s.billing_interval,s.trial_until from organizations o join organization_subscriptions s on s.organization_id=o.id join organization_memberships m on m.organization_id=o.id join app_users u on u.id=m.user_id where u.email=$1',[body.email])).rows[0];
 const firstUser=(await db.query('select id from app_users where email=$1',[body.email])).rows[0].id;
 await assert.rejects(()=>globalThis.__registrationQuery("select bootstrap_organization($1,$2,'Duplicate Account','duplicate-account','trial')",[firstUser,body.email]),e=>e.code==='42501','Existing members cannot bootstrap another organization');
 await globalThis.__registrationTransaction(async c=>{
  await c.query("select set_config('app.user_id',$1,true)",[firstUser]);
  assert.equal((await c.query('select count(*)::int n from organization_memberships')).rows[0].n,1,'Identity lookup reveals only own memberships');
  assert.equal((await c.query('select count(*)::int n from customers')).rows[0].n,0,'Identity lookup never opens tenant business records');
 });
 const cleared=(await globalThis.__registrationQuery("select nullif(current_setting('app.user_id',true),'') as user_id,nullif(current_setting('app.organization_id',true),'') as organization_id")).rows[0];
 assert.equal(cleared.user_id,null);assert.equal(cleared.organization_id,null,'Identity context never leaks between pooled requests');
 assert.equal(organization.plan,'business');assert.equal(organization.billing_interval,'yearly');assert.equal(organization.trial_until,null);
 const audit=(await db.query("select detail from audit_events where organization_id=$1 and action='organization.created'",[organization.id])).rows[0];assert.ok(String(audit.detail).includes(context.dpaVersion));
 const before=(await db.query('select count(*)::int n from organizations')).rows[0].n;
 response=await register.POST(request('POST',body));assert.equal(response.status,201);assert.equal((await response.json()).resumed,true);assert.equal((await db.query('select count(*)::int n from organizations')).rows[0].n,before,'Receipt replay cannot create another tenant');
 const link=new URL(sent[0].text.split('\n')[1]);assert.equal(link.searchParams.get('lang'),'fr');assert.ok(sent[0].html.includes('lang="fr"'));const token=link.searchParams.get('token');
 jar.clear(); // verification works in another browser, without the receipt cookie
 response=await verify.POST(request('POST',{token},'https://example.invalid/api/auth/verify-email'));assert.equal(response.status,200);payload=await response.json();assert.equal(payload.mfaSetupRequired,true);assert.ok(payload.next.includes(encodeURIComponent('/einstellungen/firma?onboarding=1')));
 assert.ok(jar.has('binso_session'),'A valid unconsumed link establishes an actual server session');
 const trialUntil=(await db.query('select trial_until from organization_subscriptions where organization_id=$1',[organization.id])).rows[0].trial_until;assert.ok(trialUntil);
 jar.clear();response=await verify.POST(request('POST',{token},'https://example.invalid/api/auth/verify-email'));payload=await response.json();assert.equal(payload.alreadyVerified,true);assert.equal(jar.has('binso_session'),false,'A consumed link cannot create another session');
 assert.equal((await db.query('select trial_until from organization_subscriptions where organization_id=$1',[organization.id])).rows[0].trial_until.toISOString(),trialUntil.toISOString(),'Replay cannot extend the trial');
 await db.query("update auth_tokens set expires_at=now()-interval '1 second' where token_type='verify_email'");assert.equal((await verify.POST(request('POST',{token},'https://example.invalid/api/auth/verify-email'))).status,400);
 const duplicate=await register.POST(request('POST',body));assert.equal(duplicate.status,409);assert.equal((await duplicate.json()).error,'registration_unavailable');
 globalThis.__registrationDelivered=true;
 response=await register.POST(request('POST',{...body,email:'second@example.invalid',locale:'tr'}));assert.equal(response.status,201);assert.equal((await response.json()).emailSent,true);
 assert.equal((await db.query('select count(*)::int n from organizations where name=$1',[body.company])).rows[0].n,2,'Equal company names must remain independent tenants');
 const secondMail=sent.at(-1),code=secondMail.text.match(/\b\d{6}\b/)[0];
 assert.equal((await verify.POST(request('POST',{email:'second@example.invalid',code:'999xxx'},'https://example.invalid/api/auth/verify-email'))).status,400);
 response=await verify.POST(request('POST',{email:'second@example.invalid',code},'https://example.invalid/api/auth/verify-email'));assert.equal(response.status,200);
 await db.query("update app_users set mfa_enabled=true where email='second@example.invalid'");
 const actualSession=await import(await load('lib/server/session.ts'));
 const secondSession=await actualSession.getSession();assert.ok(secondSession);assert.notEqual(secondSession.organizationId,organization.id);
 await db.query("update organizations set status='suspended' where id=$1",[secondSession.organizationId]);
 assert.equal(await actualSession.getSession(),null,'Suspended organizations cannot revive a valid bearer session');
 await db.query("update organizations set status='trial' where id=$1",[secondSession.organizationId]);
 await db.query("update organization_memberships set status='suspended' where organization_id=$1 and user_id=$2",[secondSession.organizationId,secondSession.userId]);
 assert.equal(await actualSession.getSession(),null,'Revoked membership invalidates an otherwise valid session');
 await db.query("update organization_memberships set status='active' where organization_id=$1 and user_id=$2",[secondSession.organizationId,secondSession.userId]);
 await db.query("update organization_subscriptions set trial_until=now()-interval '1 second' where organization_id=$1",[secondSession.organizationId]);
 assert.equal((await actualSession.getSession()).organizationStatus,'read_only','Trial expiration also runs under the scoped runtime role');
 await db.query("update organizations set status='trial' where id=$1",[secondSession.organizationId]);
 await db.query("update organization_subscriptions set status='trial',trial_until=now()+interval '14 days' where organization_id=$1",[secondSession.organizationId]);
 const companyRoute=await import(await load('app/api/settings/company/route.ts'));
 response=await companyRoute.PATCH(request('PATCH',{name:'Setup Complete GmbH',completeOnboarding:true},'https://example.invalid/api/settings/company'));assert.equal(response.status,200);
 let resumed=await (await register.GET(request('GET',null))).json();assert.equal(resumed.state,'authenticated');assert.equal(resumed.onboardingComplete,true);assert.equal(resumed.next,'/dashboard');
 assert.equal((await db.query('select name from organizations where id=$1',[organization.id])).rows[0].name,body.company,'Completing the second tenant never overwrites the first');
 await db.query("update organization_memberships set role='reader' where user_id=(select id from app_users where email='second@example.invalid')");
 response=await companyRoute.PATCH(request('PATCH',{name:'Forbidden Edit',completeOnboarding:true},'https://example.invalid/api/settings/company'));assert.equal(response.status,403,'An authenticated reader cannot complete another privileged setup mutation');
 const login=await import(await load('app/api/auth/login/route.ts'));
 jar.clear();globalThis.__registrationDelivered=false;
 response=await login.POST(request('POST',{email:body.email,password:body.password},'https://example.invalid/api/auth/login'));assert.equal(response.status,503);assert.equal(jar.has('binso_session'),false,'Failed login OTP delivery cannot fabricate authentication');
 globalThis.__registrationDelivered=true;
 response=await login.POST(request('POST',{email:body.email,password:body.password},'https://example.invalid/api/auth/login'));assert.equal(response.status,202);assert.equal((await response.json()).mfaMethod,'email');
 assert.equal((await login.POST(request('POST',{email:body.email,password:'Incorrect Synthetic Password'},'https://example.invalid/api/auth/login'))).status,401,'Wrong credentials cannot discover or activate a tenant');
 const loginCode=sent.at(-1).text.match(/\b\d{6}\b/)[0];
 response=await login.POST(request('POST',{email:body.email,password:body.password,emailCode:loginCode},'https://example.invalid/api/auth/login'));assert.equal(response.status,200);assert.ok(jar.has('binso_session'));assert.equal((await response.json()).mfaSetupRequired,true,'Existing login retains its required MFA enrollment');
 const validSessionCookie=jar.get('binso_session');
 jar.set('binso_session',{...validSessionCookie,value:'invalid-synthetic-token'});
 assert.equal(await actualSession.getSession(),null,'Unknown bearer cannot establish tenant context');
 jar.set('binso_session',validSessionCookie);
 const current=await actualSession.getSession();assert.ok(current);
 await db.query("update auth_sessions set expires_at=now()-interval '1 second' where id=$1",[current.sessionId]);
 assert.equal(await actualSession.getSession(),null,'Expired bearer cannot establish tenant context');
 const originalEmail='first@example.invalid';jar.clear();
 const known=await (await resend.POST(request('POST',{email:originalEmail}))).json(),unknown=await (await resend.POST(request('POST',{email:'unknown@example.invalid'}))).json();assert.deepEqual(known,unknown,'Public resend must not disclose account existence');
 assert.ok(globalThis.__registrationLimits.includes('register')&&globalThis.__registrationLimits.includes('verify-email')&&globalThis.__registrationLimits.includes('resend-email-verification'));
 console.log((native?'PostgreSQL restricted runtime':'PGlite restricted runtime')+' registration integration passed: server plan/contract checks, actual isolated tenant creation, delivery failure, pending receipt, duplicate replay, independent equal names, five locale catalogues, cross-browser link, consumed/expired link, trial start, OTP, existing login OTP/delivery failure, MFA/company handoff, explicit company completion, reader rejection, tenant preservation, generic public resend, direct bootstrap denial, helper ACL/ownership/path boundary, duplicate-account denial, temporary-table shadowing resistance, scoped identity-only lookup, pooled-context cleanup, revoked membership/organization denial and scoped trial expiration.');
}finally{if(native)await db.end();else await db.close();for(const key of Object.keys(globalThis).filter(key=>key.startsWith('__registration')))delete globalThis[key];}
