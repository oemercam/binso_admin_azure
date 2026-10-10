import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
const native=process.argv.includes('--postgres');
let db;
if(native){
 const url=new URL(process.env.BINSO_DB_PARALLEL_TEST_URL??'invalid:');
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v213_test'&&url.username==='binso_test','Refuse non-disposable PostgreSQL');
 db=new pg.Pool({connectionString:url.href,max:12});
}else{
 db=new PGlite({extensions:{pgcrypto}});
 await db.exec('create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner');
 for(const file of (await fs.readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort())await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));
 await db.exec('reset role');
}
const uri=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
let fault=false,created=0,lockObserved=false;const recorded=[];
const query=async(sql,args,client=db)=>{
 recorded.push(sql);
 if(fault&&sql.startsWith('delete from auth_sessions'))throw new Error('synthetic reset session-delete fault');
 if(sql.includes('for update'))lockObserved=true;
 const result=await client.query(sql,args);return {...result,rowCount:result.rowCount??result.affectedRows??result.rows.length};
};
const transaction=async fn=>{
 const client=native?await db.connect():db;
 await client.query('begin');try{const result=await fn({query:(sql,args)=>query(sql,args,client)});await client.query('commit');return result}catch(error){await client.query('rollback');throw error}finally{if(native)client.release()}
};
globalThis.__integrity={query,transaction,getSession:()=>({userId:'auth-integrity-fixture',sessionId:'00000000-0000-4000-8000-000000000081',email:'integrity@fixture.invalid',organizationId:'00000000-0000-4000-8000-000000000099',role:'owner',mfaEnabled:true}),createSession:()=>{created++}};
const adapters={
 'server-only':uri(''),
 'next/server':uri('export class NextResponse{static json(data,init){return Response.json(data,init)}}'),
 'lib/server/db.ts':uri('export const query=(...args)=>globalThis.__integrity.query(...args);export const withTransaction=fn=>globalThis.__integrity.transaction(fn);export const withTenant=(org,user,fn)=>globalThis.__integrity.transaction(async c=>{await c.query("select set_config(\'app.organization_id\',$1,true),set_config(\'app.user_id\',$2,true)",[org,user]);return fn(c)})'),
 'lib/server/session.ts':uri('export const getSession=async()=>globalThis.__integrity.getSession();export const requireSession=getSession;export const createSession=async()=>globalThis.__integrity.createSession();export const endDemoSession=async()=>{}'),
 'lib/server/rate-limit.ts':uri('export const enforceRateLimit=async()=>{}'),
 'lib/server/env.ts':uri('export const env={appEncryptionKey:"isolated-auth-integrity-fixture-only"}'),
 'lib/server/email-otp.ts':uri('export const consumeEmailCode=async()=>false;export const issueEmailCode=async()=>{throw Error("unexpected email flow")}'),
 'lib/server/email.ts':uri('export const sendMail=async()=>{throw Error("no external mail in fixtures")};export const mailLayout=()=>""'),
 'lib/server/registration.ts':uri('export const completeRegistrationVerification=async()=>false;export const registrationHandoff=async()=>({next:"/dashboard"});export const sendRegistrationVerification=async()=>false'),
};
const cache=new Map();
async function load(file){
 if(adapters[file])return adapters[file];if(cache.has(file))return cache.get(file);
 let source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const match of [...source.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)]){
  const name=match[2];let resolved=adapters[name];
  if(!resolved&&(name.startsWith('@/')||name.startsWith('.'))){let dependency=name.startsWith('@/')?name.slice(2):path.join(path.dirname(file),name);if(!dependency.endsWith('.ts'))dependency+='.ts';resolved=await load(dependency);}
  if(resolved)source=source.replace(match[0],match[0].replace(match[1]+name+match[1],JSON.stringify(resolved)));
 }
 const result=uri(source);cache.set(file,result);return result;
}
const req=body=>({headers:new Headers(),nextUrl:new URL('https://fixture.invalid/api/auth'),body:new Response(JSON.stringify(body)).body});
try{
 const passwords=await import(await load('lib/server/password.ts')),totp=await import(await load('lib/server/totp.ts')),crypto=await import(await load('lib/server/crypto.ts'));
 const password='Synthetic-integrity-password-123',hash=await passwords.hashPassword(password),user='auth-integrity-fixture',org='00000000-0000-4000-8000-000000000099';
 await query("insert into app_users(id,email,display_name,status,password_hash,email_verified_at) values($1,'integrity@fixture.invalid','Synthetic Auth','active',$2,now())",[user,hash]);
 await query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'integrity@fixture.invalid','owner','active')",[org,user]);
 const setup=await import(await load('app/api/auth/mfa/setup/route.ts')),confirm=await import(await load('app/api/auth/mfa/confirm/route.ts'));
 const staged=await setup.POST(req({}));assert.equal(staged.status,200);const secret=(await staged.json()).secret;
 await query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at) values('00000000-0000-4000-8000-000000000082',$1,$2,'synthetic-token-hash',now()+interval '1 hour')",[user,org]);
 assert.equal((await confirm.POST(req({code:'nototp'}))).status,400);
 const enabled=await confirm.POST(req({code:totp.totp(secret)}));assert.equal(enabled.status,200);assert.ok(lockObserved,'Confirmation reads and verifies the locked pending factor');const recovery=(await enabled.json()).recoveryCodes;assert.equal(recovery.length,8);
 assert.equal((await query('select count(*)::int n from auth_sessions where user_id=$1',[user])).rows[0].n,0,'Other sessions revoked on enrollment');
 const factor=(await query('select mfa_secret_enc from app_users where id=$1',[user])).rows[0].mfa_secret_enc;
 assert.equal((await setup.POST(req({}))).status,409,'Enabled factor cannot be replaced by setup');assert.equal((await confirm.POST(req({code:totp.totp(secret)}))).status,409,'Enabled factor cannot be replaced by confirm');assert.equal((await query('select mfa_secret_enc from app_users where id=$1',[user])).rows[0].mfa_secret_enc,factor);
 assert.equal(crypto.decryptSecret(factor),secret);
 const login=await import(await load('app/api/auth/login/route.ts'));
 const same=await Promise.all([0,1].map(()=>login.POST(req({email:'integrity@fixture.invalid',password,mfaCode:recovery[0]}))));assert.deepEqual(same.map(r=>r.status).sort(),[200,401]);assert.equal(created,1,'One recovery code produces exactly one session');
 const distinct=await Promise.all([1,2].map(i=>login.POST(req({email:'integrity@fixture.invalid',password,mfaCode:recovery[i]}))));assert.ok(distinct.every(r=>r.status===200));assert.equal(created,3);const remaining=(await query('select recovery_code_hashes from app_users where id=$1',[user])).rows[0].recovery_code_hashes;assert.equal(remaining.length,5);assert.ok(!recovery.slice(0,3).some(c=>remaining.includes(totp.hashRecoveryCode(c))));
 const tokens=await import(await load('lib/server/auth-tokens.ts')),reset=await import(await load('app/api/auth/password/route.ts'));
 const token=await tokens.createAuthToken({type:'password_reset',email:'integrity@fixture.invalid',userId:user,ttlMinutes:10});
 const resetBody={token,password:'Synthetic-replacement-password-456'};
 fault=true;const failed=await reset.PATCH(req(resetBody));fault=false;assert.equal(failed.status,500);
 assert.equal((await query("select consumed_at from auth_tokens where user_id=$1 and token_type='password_reset'",[user])).rows[0].consumed_at,null,'Reset token rolls back with failed session revocation');assert.equal((await query('select password_hash from app_users where id=$1',[user])).rows[0].password_hash,hash,'Password change also rolls back');
 assert.equal((await reset.PATCH(req(resetBody))).status,200);assert.equal((await reset.PATCH(req(resetBody))).status,400);assert.ok(await passwords.verifyPassword(resetBody.password,(await query('select password_hash from app_users where id=$1',[user])).rows[0].password_hash));
 const finance=await import(await load('app/api/finance/route.ts'));
 recorded.length=0;const cashResponse=await finance.GET(new Request('https://fixture.invalid/api/finance?view=cash'));assert.equal(cashResponse.status,200);assert.ok((await cashResponse.json()).cash);const cashQueries=recorded.filter(sql=>sql.startsWith('select')&&!sql.includes('set_config')).length;assert.equal(cashQueries,3,'Cash-only consumers perform exactly three scoped queries');
 recorded.length=0;const legacyResponse=await finance.GET(new Request('https://fixture.invalid/api/finance'));assert.equal(legacyResponse.status,200);assert.ok((await legacyResponse.json()).payments,'Default external API contract preserved');assert.equal(recorded.filter(sql=>sql.startsWith('select')&&!sql.includes('set_config')).length,8);
 const files=await import(await load('app/api/files/route.ts'));
 const upload=(text,key)=>{const form=new FormData();form.append('file',new File([text],'synthetic.txt',{type:'text/plain'}));form.append('purpose','document');return new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':key},body:form});};
 const first=await files.POST(upload('synthetic bytes','synthetic-upload-replay'));assert.equal(first.status,201);const uploaded=(await first.json()).item;
 const replay=await files.POST(upload('synthetic bytes','synthetic-upload-replay'));assert.equal(replay.status,201);assert.equal((await replay.json()).item.id,uploaded.id);
 assert.equal((await files.POST(upload('changed bytes','synthetic-upload-replay'))).status,409,'Same key cannot upload changed content');
 assert.equal((await query('select count(*)::int n from file_objects where organization_id=$1 and original_name=$2',[org,'synthetic.txt'])).rows[0].n,1);
 const download=await import(await load('app/api/files/[id]/download/route.ts'));
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})})).status,423,'Pending files cannot be downloaded');
 await query("update file_objects set scan_status='clean' where id=$1",[uploaded.id]);const clean=await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})});assert.equal(clean.status,200);assert.equal(await clean.text(),'synthetic bytes');
 await query("update file_objects set scan_status='rejected' where id=$1",[uploaded.id]);assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})})).status,423);
 console.log((native?'PostgreSQL physical parallel clients':'Isolated PGlite')+': MFA replacement denied, locked enrollment, session revocation, same/distinct recovery-code consumption, transactional reset fault/retry/replay, upload replay/conflict and pending/clean/rejected download passed.');
}finally{delete globalThis.__integrity;if(native)await db.end();else await db.close();}
