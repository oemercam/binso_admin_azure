import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';

const db=new PGlite({extensions:{pgcrypto}}),jar=new Map(),sent=[];
const data=source=>'data:text/javascript;base64,'+Buffer.from(source).toString('base64');
const adapters={
 'server-only':data(''),
 'next/server':data('export class NextResponse{static json(value,init){return Response.json(value,init)}}'),
 'next/headers':data('export async function cookies(){return globalThis.__registrationCookies} export async function headers(){return new Headers({"user-agent":"registration-test"})}'),
 'lib/server/db.ts':data('export async function query(sql,params){return globalThis.__registrationQuery(sql,params)} export async function withTransaction(fn){return globalThis.__registrationTransaction(fn)} export async function withTenant(org,user,fn){return globalThis.__registrationTransaction(fn)}'),
 'lib/server/rate-limit.ts':data('export async function enforceRateLimit(request,bucket){globalThis.__registrationLimits.push(bucket)}'),
 'lib/server/env.ts':data('export const env={databaseUrl:"isolated-test",appUrl:"https://example.invalid",appMode:"production",appEncryptionKey:"synthetic-test-key-not-a-production-secret",sessionTtlHours:168,sessionCookieName:"binso_session"}'),
 'lib/server/email.ts':data('export function mailLayout(title,body,cta,locale){return `<html lang="${locale}">${title}${body}<a href="${cta?.url??""}">${cta?.label??""}</a></html>`} export async function sendMail(mail){globalThis.__registrationMail.push(mail);return {delivered:globalThis.__registrationDelivered}}'),
 'lib/server/repositories/demo-fixture.ts':data('export async function seedDatabaseDemo(){throw new Error("Public registration must never seed demo business data")}'),
 'lib/server/subscription-lifecycle.ts':data('export async function expireUnpaidTrials(){}'),
};
const modules=new Map();
async function load(file){
 file=file.replaceAll('\\','/');if(adapters[file])return adapters[file];if(modules.has(file))return modules.get(file);
 let source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const imports=[...source.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)];
 for(const match of imports){const name=match[2];let dependency;if(adapters[name])dependency=adapters[name];else if(name.startsWith('@/')||name.startsWith('.')){let resolved=name.startsWith('@/')?name.slice(2):path.join(path.dirname(file),name);if(!resolved.endsWith('.ts'))resolved+='.ts';dependency=await load(resolved);}else continue;source=source.replace(match[0],match[0].replace(match[1]+name+match[1],JSON.stringify(dependency)));}
 const uri=data(source);modules.set(file,uri);return uri;
}
const client={query:async(sql,params)=>{const result=await db.query(sql,params);return {...result,rowCount:result.rows.length||result.affectedRows||0}}};
globalThis.__registrationQuery=client.query;
globalThis.__registrationTransaction=async fn=>{await db.exec('begin');try{const result=await fn(client);await db.exec('commit');return result}catch(e){await db.exec('rollback');throw e}};
globalThis.__registrationCookies={get:name=>jar.has(name)?{value:jar.get(name).value}:undefined,set:(name,value,options)=>jar.set(name,{value,options}),delete:name=>jar.delete(name)};
globalThis.__registrationMail=sent;globalThis.__registrationDelivered=false;globalThis.__registrationLimits=[];
const request=(method,body,url='https://example.invalid/api/auth/register')=>({method,nextUrl:new URL(url),headers:new Headers({'origin':'https://example.invalid'}),body:body===null?null:new Response(JSON.stringify(body)).body});
try{
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(file=>file.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));
 await db.exec('reset role');
 const register=await import(await load('app/api/auth/register/route.ts')),verify=await import(await load('app/api/auth/verify-email/route.ts')),resend=await import(await load('app/api/auth/resend-verification/route.ts'));
 const context=(await (await register.GET(request('GET',null))).json()).context;
 assert.equal(context.plan,null,'A direct entry does not silently select a paid plan');
 assert.equal(context.trialDays,14);
 const selected=(await (await register.GET(request('GET',null,'https://example.invalid/api/auth/register?plan=business&billing=yearly'))).json()).context;assert.equal(selected.plan.id,'business');assert.equal(selected.billingCycle,'yearly');
 assert.equal((await register.GET(request('GET',null,'https://example.invalid/api/auth/register?plan=forged'))).status,400);
 const translations=await import(await load('lib/i18n.ts'));
 for(const [key,values] of Object.entries(translations.registrationMessages)){assert.equal(values.length,5,key);assert.ok(values.every(value=>typeof value==='string'&&value.length>0),key);}
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
 const loginCode=sent.at(-1).text.match(/\b\d{6}\b/)[0];
 response=await login.POST(request('POST',{email:body.email,password:body.password,emailCode:loginCode},'https://example.invalid/api/auth/login'));assert.equal(response.status,200);assert.ok(jar.has('binso_session'));assert.equal((await response.json()).mfaSetupRequired,true,'Existing login retains its required MFA enrollment');
 const originalEmail='first@example.invalid';jar.clear();
 const known=await (await resend.POST(request('POST',{email:originalEmail}))).json(),unknown=await (await resend.POST(request('POST',{email:'unknown@example.invalid'}))).json();assert.deepEqual(known,unknown,'Public resend must not disclose account existence');
 assert.ok(globalThis.__registrationLimits.includes('register')&&globalThis.__registrationLimits.includes('verify-email')&&globalThis.__registrationLimits.includes('resend-email-verification'));
 console.log('Registration integration passed: server plan/contract checks, actual isolated tenant creation, delivery failure, pending receipt, duplicate replay, independent equal names, five locale catalogues, cross-browser link, consumed/expired link, trial start, OTP, existing login OTP/delivery failure, MFA/company handoff, explicit company completion, reader rejection, tenant preservation, generic public resend.');
}finally{await db.close();for(const key of Object.keys(globalThis).filter(key=>key.startsWith('__registration')))delete globalThis[key];}
