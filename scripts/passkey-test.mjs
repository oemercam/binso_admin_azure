import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,generateKeyPairSync,randomBytes,randomUUID,sign} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {isoCBOR} from '@simplewebauthn/server/helpers';
import ts from 'typescript';
import pg from 'pg';
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const native=process.argv.includes('--postgres');
let db;
if(native){const url=new URL(process.env.BINSO_DB_PARALLEL_TEST_URL??'invalid:');assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Refuse any non-disposable PostgreSQL');db=new pg.Pool({connectionString:url.href,max:6})}else db=new PGlite({extensions:{pgcrypto}});
const jar=new Map(),sent=[],org=randomUUID(),other=randomUUID(),user='passkey-fixture';
const s={organizationId:org,userId:user,sessionId:randomUUID(),role:'owner',email:'passkey@fixture.invalid',mfaEnabled:true};
const transaction=async fn=>{if(!native)return db.transaction(fn);const c=await db.connect();try{await c.query('begin');const result=await fn(c);await c.query('commit');return result}catch(e){await c.query('rollback');throw e}finally{c.release()}};
const runtime=async(orgId,userId,platform,fn)=>transaction(async c=>{
 await c.query('set local role binso_runtime');
 await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true),set_config('app.platform_operator',$3,true)",[orgId??'',userId??'',platform?'true':'']);
 return fn({query:async(sql,args)=>{const r=await c.query(sql,args);return {...r,rowCount:r.rowCount??(r.affectedRows||r.rows.length)}}});
});
globalThis.__passkey={s,jar,sent,runtime,appUrl:'https://fixture.invalid',createRace:null};
const adapters={
 'server-only':uri(''),
 'lib/server/rate-limit.ts':uri('export const enforceRateLimit=async()=>{};'),
 '@simplewebauthn/server':import.meta.resolve('@simplewebauthn/server'),
 'next/headers':uri('export const headers=async()=>new Headers();export const cookies=async()=>({get:n=>{const v=globalThis.__passkey.jar.get(n);return v&&{value:v.value}},set:(n,value,options)=>globalThis.__passkey.jar.set(n,{value,options}),delete:n=>globalThis.__passkey.jar.delete(n)});'),
 'next/server':uri('export class NextResponse{static json(data,options){return Response.json(data,options)}}'),
 'lib/server/env.ts':uri('export const env={get appUrl(){return globalThis.__passkey.appUrl},appMode:"production",sessionTtlHours:168,sessionCookieName:"binso_session",appEncryptionKey:"isolated-passkey-test-only"};'),
 'lib/server/db.ts':uri('export const withPlatform=fn=>globalThis.__passkey.runtime(null,null,true,fn);export const withTenant=(org,user,fn)=>globalThis.__passkey.runtime(org,user,false,fn);export const withTransaction=fn=>globalThis.__passkey.runtime(globalThis.__passkey.s.organizationId,globalThis.__passkey.s.userId,false,fn);export const query=(sql,args)=>withTransaction(c=>c.query(sql,args));'),
 'lib/server/email.ts':uri('export const mailLayout=(title,body)=>title+body;export const sendMail=async mail=>{globalThis.__passkey.sent.push(mail);return {delivered:true}};'),
 'lib/server/registration.ts':uri('export const registrationHandoff=async(org,role,enabled)=>({next:enabled?"/dashboard":"/einstellungen/sicherheit?setup=1",mfaSetupRequired:!enabled});'),
 'lib/server/maintenance.ts':uri('export const maintenanceState=async()=>({enabled:false});'),
 'lib/server/subscription-lifecycle.ts':uri('export const expireUnpaidTrials=async()=>({rows:[]});')
};
const cache=new Map();async function load(file){if(adapters[file])return adapters[file];if(cache.has(file))return cache.get(file);let source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;for(const match of [...source.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)]){const name=match[2];let dep=adapters[name];if(!dep&&(name.startsWith('@/')||name.startsWith('.'))){let p=name.startsWith('@/')?name.slice(2):path.posix.join(path.posix.dirname(file),name);if(!p.endsWith('.ts'))p+='.ts';dep=await load(p)}if(dep)source=source.replace(match[0],match[0].replace(match[1]+name+match[1],JSON.stringify(dep)))}const result=uri(source);cache.set(file,result);return result}
const hash=b=>createHash('sha256').update(b).digest(),b64=b=>Buffer.from(b).toString('base64url');
const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),jwk=pair.publicKey.export({format:'jwk'}),credential=randomBytes(32),credentialId=b64(credential);
const cose=isoCBOR.encode(new Map([[1,2],[3,-7],[-1,1],[-2,Buffer.from(jwk.x,'base64url')],[-3,Buffer.from(jwk.y,'base64url')]]));
function registration(options,{origin='https://fixture.invalid',uv=true,challenge=options.challenge}={}){
 const size=Buffer.alloc(2);size.writeUInt16BE(credential.length);
 const data=Buffer.concat([hash('fixture.invalid'),Buffer.from([uv?0x45:0x41]),Buffer.alloc(4),Buffer.alloc(16),size,credential,Buffer.from(cose)]);
 return {id:credentialId,rawId:credentialId,type:'public-key',clientExtensionResults:{},response:{clientDataJSON:b64(JSON.stringify({type:'webauthn.create',challenge,origin})),attestationObject:b64(isoCBOR.encode(new Map([['fmt','none'],['attStmt',new Map()],['authData',data]]))),transports:['internal']}};
}
function authentication(options,{origin='https://fixture.invalid',rp='fixture.invalid',uv=true,counter=1,invalidSignature=false,challenge=options.challenge}={}){
 const count=Buffer.alloc(4);count.writeUInt32BE(counter);const authData=Buffer.concat([hash(rp),Buffer.from([uv?5:1]),count]),clientData=Buffer.from(JSON.stringify({type:'webauthn.get',challenge,origin}));
 const signature=sign('sha256',Buffer.concat([authData,hash(clientData)]),pair.privateKey);if(invalidSignature)signature[signature.length-1]^=1;
 return {id:credentialId,rawId:credentialId,type:'public-key',clientExtensionResults:{},response:{authenticatorData:b64(authData),clientDataJSON:b64(clientData),signature:b64(signature),userHandle:b64(hash(user))}};
}
try{
 if(!native){await db.exec('create extension pgcrypto;create role schema_owner;grant usage,create on schema public to schema_owner;set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(x=>x.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));
 await db.exec('reset role');await db.exec(await fs.readFile('database/operations/provision-runtime-role.sql','utf8'));}
 const passwords=await import(await load('lib/server/password.ts')),totp=await import(await load('lib/server/totp.ts')),crypto=await import(await load('lib/server/crypto.ts'));
 const secret=totp.generateTotpSecret(),password='Synthetic-passkey-password-123',passwordHash=await passwords.hashPassword(password),encryptedSecret=crypto.encryptSecret(secret);
 for(const id of [org,other])await db.query("insert into organizations(id,name,slug,status) values($1,'Synthetic passkey',$2,'active')",[id,'pk-'+id]);
 await db.query("insert into app_users(id,email,display_name,status,password_hash,email_verified_at,mfa_enabled,mfa_secret_enc) values($1,$2,'Synthetic passkey','active',$3,now(),true,$4)",[user,s.email,passwordHash,encryptedSecret]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'owner','active')",[org,user,s.email]);
 await db.query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at) values($1,$2,$3,$4,now()+interval '1 hour')",[s.sessionId,user,org,hash('pk-current-token').toString('hex')]);
 const keys=await import(await load('lib/server/passkeys.ts')),session=await import(await load('lib/server/session.ts'));
 const begin=()=>keys.beginPasskeyRegistration(s,password,totp.totp(secret),'Synthetic key');
 globalThis.__passkey.appUrl='http://evil.invalid';assert.throws(()=>keys.passkeyRelyingParty(),e=>e.code==='passkey_unavailable');globalThis.__passkey.appUrl='https://fixture.invalid';
 await assert.rejects(()=>keys.beginPasskeyRegistration(s,'wrong',totp.totp(secret),'key'),e=>e.code==='reauth_required');
 await assert.rejects(()=>keys.beginPasskeyRegistration(s,password,'111xxx','key'),e=>e.code==='reauth_required');
 let options=await begin();assert.equal(options.authenticatorSelection.userVerification,'required');assert.equal(jar.get('binso_passkey').options.httpOnly,true);assert.equal(jar.get('binso_passkey').options.sameSite,'strict');
 await assert.rejects(()=>keys.finishPasskeyRegistration(s,registration(options,{origin:'https://evil.invalid'})),e=>e.code==='passkey_invalid');
 await assert.rejects(()=>keys.finishPasskeyRegistration(s,registration(options)),e=>e.code==='passkey_challenge_invalid','Failed verification consumes its challenge');
 options=await begin();await assert.rejects(()=>keys.finishPasskeyRegistration(s,registration(options,{uv:false})),e=>e.code==='passkey_invalid');
 options=await begin();await db.query("update app_users set password_hash=$2 where id=$1",[user,await passwords.hashPassword('Synthetic-replacement-password-123')]);await assert.rejects(()=>keys.finishPasskeyRegistration(s,registration(options)),e=>e.code==='auth_state_changed');await db.query('update app_users set password_hash=$2 where id=$1',[user,passwordHash]);
 options=await begin();const created=await keys.finishPasskeyRegistration(s,registration(options));assert.equal(created.ok,true);assert.equal(created.notice,'accepted');assert.equal(sent.length,1);
 assert.equal((await keys.listPasskeys(s)).length,1);assert.deepEqual(Object.keys((await keys.listPasskeys(s))[0]).sort(),['created_at','id','label','last_used_at']);
 assert.equal((await runtime(other,'other-user',false,c=>c.query('select * from auth_passkeys'))).rows.length,0,'Foreign tenant cannot read credentials');
 for(const negative of [{origin:'https://evil.invalid'},{rp:'evil.invalid'},{uv:false},{invalidSignature:true},{challenge:'not-the-challenge'}]){const opt=await keys.beginPasskeyAuthentication();await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(opt,negative),totp.totp(secret),false),e=>e.code==='invalid_credentials');}
 let auth=await keys.beginPasskeyAuthentication();await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(auth),'',false),e=>e.code==='passkey_mfa_required','Passkey does not replace privileged TOTP');assert.equal(jar.has('binso_session'),false);
 auth=await keys.beginPasskeyAuthentication();const logged=await keys.finishPasskeyAuthentication(authentication(auth),totp.totp(secret),false);assert.equal(logged.ok,true);assert.equal(logged.mfaSetupRequired,false);assert.ok(jar.has('binso_session'));
 await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(auth),totp.totp(secret),false),e=>e.code==='passkey_challenge_invalid','Replay cannot mint another session');
 auth=await keys.beginPasskeyAuthentication();await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(auth),totp.totp(secret),false),e=>e.code==='invalid_credentials','Cloned non-zero counter is rejected');
 auth=await keys.beginPasskeyAuthentication();await db.query("update auth_passkey_challenges set expires_at=now()-interval '1 second'");await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(auth,{counter:2}),totp.totp(secret),false),e=>e.code==='passkey_challenge_invalid');
 await assert.rejects(()=>keys.removePasskey(s,credentialId,'wrong',totp.totp(secret)),e=>e.code==='reauth_required');
 const removed=await keys.removePasskey(s,credentialId,password,totp.totp(secret));assert.equal(removed.ok,true);assert.equal((await keys.listPasskeys(s)).length,0);assert.equal(sent.length,2);
 assert.equal((await db.query('select count(*)::int n from auth_sessions where user_id=$1',[user])).rows[0].n,1,'Only the explicitly current session remains after credential revoke');
 await assert.rejects(()=>session.createSession({userId:user,organizationId:org,email:s.email,name:'Synthetic',role:'owner',expectedPasskeyId:credentialId,expectedAuth:{passwordHash,mfaEnabled:true,mfaSecretEnc:encryptedSecret}}),e=>e.code==='auth_state_changed','Revoked credentials cannot issue a late session');
 auth=await keys.beginPasskeyAuthentication();await assert.rejects(()=>keys.finishPasskeyAuthentication(authentication(auth,{counter:2}),totp.totp(secret),false),e=>e.code==='invalid_credentials');
 const persisted=(await db.query('select * from auth_passkeys where user_id=$1',[user])).rows[0];assert.ok(persisted.revoked_at);assert.ok(!JSON.stringify(persisted).includes(secret),'No TOTP or biometrics are persisted in the credential');
 for(const mail of sent){assert.ok(!JSON.stringify(mail).includes(secret));assert.ok(!JSON.stringify(mail).includes(password));}
 // The actual invitation owner under restricted runtime RLS must see a proven
 // identity's other memberships without exposing them in the API response.
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'starter','active')",[org]);
 await db.query('insert into organization_entitlements(organization_id,max_users) values($1,3)',[org]);
 const foreign='passkey-foreign-member';
 await db.query("insert into app_users(id,email,display_name,status,password_hash,email_verified_at) values($1,'foreign-member@fixture.invalid','Synthetic foreign','active',$2,now())",[foreign,passwordHash]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'foreign-member@fixture.invalid','member','active')",[other,foreign]);
 const invitations=await import(await load('lib/server/invitations.ts'));
 for(const status of ['active','suspended']){
  await db.query('update organization_memberships set status=$3 where organization_id=$1 and user_id=$2',[other,foreign,status]);
  await assert.rejects(()=>invitations.inviteUser(s,'foreign-member@fixture.invalid','member',randomUUID()),e=>e.code==='identity_unavailable','Historical foreign identities also require a separate email, not an implicit company transfer');
 }
 assert.equal((await db.query("select count(*)::int n from organization_invitations where organization_id=$1 and email='foreign-member@fixture.invalid'",[org])).rows[0].n,0);
 await invitations.inviteUser(s,'late-invitation@fixture.invalid','member',randomUUID());
 const invited=(await db.query("select id from app_users where email='late-invitation@fixture.invalid'")).rows[0].id;
 const link=new URL(sent.at(-1).text.split('Einladung annehmen: ')[1]),invitationToken=link.searchParams.get('token');
 await db.query("update app_users set status='active',password_hash=$2,email_verified_at=now() where id=$1",[invited,passwordHash]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'late-invitation@fixture.invalid','member','active')",[other,invited]);
 const invitationRoute=await import(await load('app/api/auth/invitation/route.ts'));
 const accepted=await invitationRoute.POST({headers:new Headers(),nextUrl:new URL('https://fixture.invalid/api/auth/invitation'),body:new Response(JSON.stringify({token:invitationToken,password})).body});
 const acceptedBody=await accepted.json();assert.equal(accepted.status,409,JSON.stringify(acceptedBody));assert.equal(acceptedBody.error,'identity_unavailable','Acceptance rechecks a foreign activation after invitation creation');
 assert.equal((await db.query('select status from organization_memberships where user_id=$1 and organization_id=$2',[invited,org])).rows[0].status,'invited','Denied acceptance preserves the pending identity and membership');
 assert.equal((await db.query("select consumed_at from auth_tokens where user_id=$1 and token_type='invitation'",[invited])).rows[0].consumed_at,null,'Denied acceptance does not burn the invitation token');
 const metadataBoundary=(await db.query("select p.prosecdef,p.proconfig,(select count(*)::int from aclexplode(p.proacl) a where a.grantee=0 and a.privilege_type='EXECUTE') public_execute from pg_proc p where p.oid='public.read_invitation_organization(text,boolean)'::regprocedure")).rows[0];
 assert.equal(metadataBoundary.prosecdef,true);assert.equal(metadataBoundary.public_execute,0);assert.ok(metadataBoundary.proconfig.includes('search_path=pg_catalog, public, pg_temp'));
 assert.equal((await runtime(null,null,true,c=>c.query('select * from read_invitation_organization($1,false)',['0'.repeat(64)]))).rows.length,0,'A forged hash reveals no organization metadata');
 await invitations.inviteUser(s,'valid-invitation@fixture.invalid','member',randomUUID());
 const normalUser=(await db.query("select id from app_users where email='valid-invitation@fixture.invalid'")).rows[0].id;
 const normalToken=new URL(sent.at(-1).text.split('Einladung annehmen: ')[1]).searchParams.get('token');
 assert.equal((await runtime(org,normalUser,false,c=>c.query('select id from organizations where id=$1',[org]))).rows.length,0,'Pending membership has no organization business access');
 const preview=await invitationRoute.GET({nextUrl:new URL('https://fixture.invalid/api/auth/invitation?token='+encodeURIComponent(normalToken))});assert.equal(preview.status,200);assert.equal((await preview.json()).organization,'Synthetic passkey');
 const normalAcceptance=await invitationRoute.POST({headers:new Headers(),nextUrl:new URL('https://fixture.invalid/api/auth/invitation'),body:new Response(JSON.stringify({token:normalToken,password,name:'Synthetic invited'})).body});assert.equal(normalAcceptance.status,200);
 assert.equal((await db.query('select status from organization_memberships where user_id=$1 and organization_id=$2',[normalUser,org])).rows[0].status,'active','A valid new identity activates within exactly one company');
 assert.equal((await invitationRoute.GET({nextUrl:new URL('https://fixture.invalid/api/auth/invitation?token='+encodeURIComponent(normalToken))})).status,400,'Consumed token metadata is no longer available');
 jar.set('binso_session',{value:'pk-current-token'});
 const memberRoute=await import(await load('app/api/settings/team/members/[userId]/route.ts'));
 const memberPatch=(id,body)=>memberRoute.PATCH({headers:new Headers(),nextUrl:new URL('https://fixture.invalid/api/settings/team/members/'+id),body:new Response(JSON.stringify(body)).body},{params:Promise.resolve({userId:id})});
 assert.equal((await memberPatch(user,{action:'deactivate'})).status,409,'Owner access cannot be removed through normal membership management');
 assert.equal((await memberPatch(foreign,{action:'deactivate'})).status,404,'A foreign direct ID cannot be suspended');
 const targetSession=randomUUID();await db.query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at) values($1,$2,$3,'synthetic-member-token',now()+interval '1 hour')",[targetSession,normalUser,org]);
 assert.equal((await memberPatch(normalUser,{role:'reader'})).status,200);
 assert.equal((await db.query('select count(*)::int n from auth_sessions where user_id=$1',[normalUser])).rows[0].n,0,'Role changes revoke sessions rather than retaining stale privileges');
 assert.equal((await memberPatch(normalUser,{role:'member',moduleProfile:'time_only'})).status,200);
 await db.query("insert into active_time_trackers(organization_id,user_id,state,active_since,accumulated_seconds,activity_label,billable) values($1,$2,'running',now()-interval '1 hour',120,'Synthetic active work',false)",[org,normalUser]);
 const retained=(await db.query("insert into time_entries(organization_id,external_id,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id) values($1,$2,'Synthetic','employee',current_date,1,'Synthetic history',false,false,$3) returning id",[org,randomUUID(),normalUser])).rows[0].id;
 const suspended=await memberPatch(normalUser,{action:'deactivate'});assert.equal(suspended.status,200);
 const paused=(await db.query('select state,accumulated_seconds,active_since from active_time_trackers where organization_id=$1 and user_id=$2',[org,normalUser])).rows[0];assert.equal(paused.state,'paused');assert.ok(paused.accumulated_seconds>=3720);assert.equal(paused.active_since,null);
 assert.equal((await db.query('select status from organization_memberships where organization_id=$1 and user_id=$2',[org,normalUser])).rows[0].status,'suspended');
 assert.equal((await db.query('select id from time_entries where id=$1',[retained])).rows.length,1,'Recorded work is retained');assert.equal((await db.query('select status from app_users where id=$1',[normalUser])).rows[0].status,'active','Firm access suspension is separate from deleting the personal identity');
 assert.equal((await memberPatch(normalUser,{action:'deactivate'})).status,200,'Repeated suspension is idempotent');
 await db.query("update organization_memberships set role='admin' where organization_id=$1 and user_id=$2",[org,user]);assert.equal((await memberPatch(user,{action:'deactivate'})).status,409,'Admins cannot suspend their own remaining access');
 await db.query("update organization_memberships set role='reader' where organization_id=$1 and user_id=$2",[org,user]);assert.equal((await memberPatch(normalUser,{role:'admin'})).status,403,'A downgraded actor cannot reuse an old admin session for privilege assignment');
 await db.query("update organization_memberships set role='owner' where organization_id=$1 and user_id=$2",[org,user]);
 console.log('Passkey: real P-256/WebAuthn registration and signature verification, RP/origin/UV/challenge/counter negatives, fresh TOTP/password, stale-proof denial, RLS, replay/expiry, preserved privileged MFA, notices and revoke/session guards passed. Physical authenticators remain untested.');
}finally{if(native)await db.end();else await db.close();delete globalThis.__passkey}
