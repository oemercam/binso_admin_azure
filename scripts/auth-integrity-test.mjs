import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import pg from 'pg';
import sharp from 'sharp';
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
let actualSession,heldRead=null;
let fault=false,created=0,cookieSets=0,lockObserved=false;const recorded=[];
const query=async(sql,args,client=db)=>{
 recorded.push(sql);
 if(fault&&sql.startsWith('delete from auth_sessions'))throw new Error('synthetic reset session-delete fault');
 if(sql.includes('for update'))lockObserved=true;
 const result=await client.query(sql,args);
 if(heldRead?.matches(sql)){const barrier=heldRead;heldRead=null;barrier.ready();await barrier.release;}
 return {...result,rowCount:result.rowCount??result.affectedRows??result.rows.length};
};
const transaction=async fn=>{
 if(!native)return db.transaction(client=>fn({query:(sql,args)=>query(sql,args,client)}));
 const client=native?await db.connect():db;
 await client.query('begin');try{const result=await fn({query:(sql,args)=>query(sql,args,client)});await client.query('commit');return result}catch(error){await client.query('rollback');throw error}finally{if(native)client.release()}
};
globalThis.__integrity={query,transaction,getSession:()=>({userId:'auth-integrity-fixture',sessionId:'00000000-0000-4000-8000-000000000081',email:'integrity@fixture.invalid',organizationId:'00000000-0000-4000-8000-000000000099',role:'owner',mfaEnabled:true}),createSession:async input=>{const id=await actualSession.createSession(input);created++;return id},jar:{set(...args){cookieSets++;globalThis.__integrity.cookieOptions=args[2]},get(){},delete(){}}};
globalThis.__integrity.scanStatus='pending';globalThis.__integrity.scanCalls=0;
const adapters={
 'qrcode':import.meta.resolve('qrcode'),
 'server-only':uri(''),
 'next/headers':uri('export const cookies=async()=>globalThis.__integrity.jar;export const headers=async()=>new Headers()'),
 'next/server':uri('export class NextResponse{static json(data,init){return Response.json(data,init)}}'),
 'lib/server/db.ts':uri('export const query=(...args)=>globalThis.__integrity.query(...args);export const withTransaction=fn=>globalThis.__integrity.transaction(fn);export const withTenant=(org,user,fn)=>globalThis.__integrity.transaction(async c=>{await c.query("select set_config(\'app.organization_id\',$1,true),set_config(\'app.user_id\',$2,true)",[org,user]);return fn(c)})'),
 'lib/server/session.ts':uri('export const getSession=async()=>globalThis.__integrity.getSession();export const requireSession=getSession;export const createSession=async input=>globalThis.__integrity.createSession(input);export const endDemoSession=async()=>{}'),
 'lib/server/rate-limit.ts':uri('export const enforceRateLimit=async()=>{}'),
 'lib/server/env.ts':uri('export const env={appEncryptionKey:"isolated-auth-integrity-fixture-only",sessionTtlHours:168,sessionCookieName:"integrity_fixture_cookie",get releaseProfile(){return globalThis.__integrity.releaseProfile},get fileAccessMode(){return globalThis.__integrity.fileAccessMode},get fileScanSocket(){return globalThis.__integrity.fileScanSocket}}'),
 'lib/server/file-scan.ts':uri(`import {createHash} from 'node:crypto';import {scanBytes} from '${pathToFileURL(path.resolve('lib/server/clamav-protocol.mjs')).href}';export const scanFileWithEvidence=async body=>{globalThis.__integrity.scanCalls++;const status=globalThis.__integrity.scanStatus;if(status==='unavailable')throw new Response(null,{status:503});if(status==='clean'&&process.env.BINSO_REAL_SCANNER_SOCKET)return scanBytes(body,{socketPath:process.env.BINSO_REAL_SCANNER_SOCKET});return {status,evidence:status==='pending'?null:{engine:'ClamAV',engineVersion:'1.4.6',signaturesVersion:1,signaturesAt:new Date().toISOString(),sha256:createHash('sha256').update(body).digest('hex'),startedAt:new Date().toISOString(),completedAt:new Date().toISOString()}}}`),
 'lib/server/email-otp.ts':uri('export const consumeEmailCode=async()=>false;export const issueEmailCode=async()=>{throw Error("unexpected email flow")}'),
 'lib/server/email.ts':uri('export const sendMail=async()=>{throw Error("no external mail in fixtures")};export const mailLayout=()=>""'),
 'lib/server/registration.ts':uri('export const completeRegistrationVerification=async()=>false;export const registrationHandoff=async()=>({next:"/dashboard"});export const sendRegistrationVerification=async()=>false'),
};
const cache=new Map();
async function load(file,actualRoot=false){
 file=file.replaceAll("\\","/");
 if(adapters[file]&&!actualRoot)return adapters[file];if(cache.has(file))return cache.get(file);
 let source=ts.transpileModule(await fs.readFile(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 for(const match of [...source.matchAll(/(?:from\s*|import\s*)(['"])([^'"]+)\1/g)]){
  const name=match[2];let resolved=adapters[name];
  if(!resolved&&(name.startsWith('@/')||name.startsWith('.'))){let dependency=name.startsWith('@/')?name.slice(2):path.join(path.dirname(file),name);if(!dependency.endsWith('.ts'))dependency+='.ts';resolved=await load(dependency);}
  // Data URLs have no package resolution base. Keep the real installed package,
  // including native Sharp decoding; do not replace it with an upload mock.
  if(!resolved&&!name.startsWith('node:'))resolved=import.meta.resolve(name);
  if(resolved)source=source.replace(match[0],match[0].replace(match[1]+name+match[1],JSON.stringify(resolved)));
 }
 const result=uri(source);cache.set(file,result);return result;
}
const req=body=>({headers:new Headers(),nextUrl:new URL('https://fixture.invalid/api/auth'),body:new Response(JSON.stringify(body)).body});
async function raceAfterRead(matches,start,intervene){
 let ready,release,rejectReady;
 const reached=new Promise((resolve,reject)=>{ready=resolve;rejectReady=reject}),released=new Promise(resolve=>release=resolve);
 heldRead={matches,ready,release:released};
 const deadline=setTimeout(()=>rejectReady(new Error('Expected read barrier was not reached')),10000);
 const pending=start();
 try{await reached;await intervene();}finally{clearTimeout(deadline);heldRead=null;release();}
 return pending;
}
try{
 actualSession=await import(await load('lib/server/session.ts',true));
 const passwords=await import(await load('lib/server/password.ts')),totp=await import(await load('lib/server/totp.ts')),crypto=await import(await load('lib/server/crypto.ts'));
 const password='Synthetic-integrity-password-123',hash=await passwords.hashPassword(password),user='auth-integrity-fixture',org='00000000-0000-4000-8000-000000000099';
 await query("insert into app_users(id,email,display_name,status,password_hash,email_verified_at) values($1,'integrity@fixture.invalid','Synthetic Auth','active',$2,now())",[user,hash]);
 await query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'integrity@fixture.invalid','owner','active')",[org,user]);
 const seedFreshSession=()=>query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at,step_up_at) values('00000000-0000-4000-8000-000000000081',$1,$2,'synthetic-current-proof',now()+interval '1 hour',now()) on conflict(id) do update set step_up_at=now(),expires_at=now()+interval '1 hour'",[user,org]);
 const setup=await import(await load('app/api/auth/mfa/setup/route.ts')),confirm=await import(await load('app/api/auth/mfa/confirm/route.ts'));
 assert.equal((await setup.POST(req({}))).status,403,'Authenticator setup cannot bypass fresh authentication');
 await seedFreshSession();
 const staged=await setup.POST(req({}));assert.equal(staged.status,200);const secret=(await staged.json()).secret;
 await query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at) values('00000000-0000-4000-8000-000000000082',$1,$2,'synthetic-token-hash',now()+interval '1 hour')",[user,org]);
 assert.equal((await confirm.POST(req({code:'nototp'}))).status,400);
 const enabled=await confirm.POST(req({code:totp.totp(secret)}));assert.equal(enabled.status,200);assert.ok(lockObserved,'Confirmation reads and verifies the locked pending factor');const recovery=(await enabled.json()).recoveryCodes;assert.equal(recovery.length,8);
 assert.equal((await query('select count(*)::int n from auth_sessions where user_id=$1',[user])).rows[0].n,1,'Only the authenticated current session survives enrollment');
 await seedFreshSession();
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
 const nextToken=await tokens.createAuthToken({type:'password_reset',email:'integrity@fixture.invalid',userId:user,ttlMinutes:10});
 const thirdPassword='Synthetic-third-password-after-reset-789';
 const cookiesBeforeStaleLogin=cookieSets;
 const staleLogin=await raceAfterRead(sql=>sql.includes('select id,display_name as name,email,password_hash'),()=>login.POST(req({email:'integrity@fixture.invalid',password:resetBody.password,mfaCode:totp.totp(secret)})),async()=>assert.equal((await reset.PATCH(req({token:nextToken,password:thirdPassword}))).status,200));
 const lateSessions=(await query('select count(*)::int n from auth_sessions where user_id=$1',[user])).rows[0].n;
 assert.equal(staleLogin.status,401,'An old-password proof cannot mint a session after reset');assert.equal(lateSessions,0,'No late session survives reset');
 assert.equal(cookieSets,cookiesBeforeStaleLogin,'Rejected stale authentication never publishes a new session cookie');
 console.log(JSON.stringify({probe:'stale-login-after-committed-password-reset',status:staleLogin.status,persistedSessionsAfterReset:lateSessions,synthetic:true}));
 assert.equal((await login.POST(req({email:'integrity@fixture.invalid',password:thirdPassword,mfaCode:totp.totp(secret)}))).status,200,'Fresh credential proof still creates a real session');
 await seedFreshSession();
 const finalToken=await tokens.createAuthToken({type:'password_reset',email:'integrity@fixture.invalid',userId:user,ttlMinutes:10});
 const finalPassword='Synthetic-final-password-after-reset-012';
 const staleChange=await raceAfterRead(sql=>sql==='select password_hash from app_users where id=$1',()=>reset.PATCH(req({currentPassword:thirdPassword,password:'Synthetic-stale-password-must-not-win-345'})),async()=>assert.equal((await reset.PATCH(req({token:finalToken,password:finalPassword}))).status,200));
 assert.equal(staleChange.status,409,'A started password change cannot overwrite a completed reset');assert.ok(await passwords.verifyPassword(finalPassword,(await query('select password_hash from app_users where id=$1',[user])).rows[0].password_hash));assert.equal((await query('select count(*)::int n from auth_sessions where user_id=$1',[user])).rows[0].n,0);
 console.log(JSON.stringify({probe:'stale-password-change-after-committed-reset',status:staleChange.status,resetPasswordPreserved:true,synthetic:true}));
 const sessionInput={userId:user,organizationId:org,email:'integrity@fixture.invalid',name:'Synthetic Auth',role:'owner'};
 const finalHash=(await query('select password_hash from app_users where id=$1',[user])).rows[0].password_hash;
 await actualSession.createSession({...sessionInput,persistent:false,ttlHours:12});
 assert.equal(globalThis.__integrity.cookieOptions.expires,undefined,'Default login must not create a persistent browser cookie');
 assert.equal(globalThis.__integrity.cookieOptions.httpOnly,true);
 await actualSession.createSession({...sessionInput,persistent:true});
 assert.ok(globalThis.__integrity.cookieOptions.expires instanceof Date,'Remembered login has bounded cookie expiry');
 await query('delete from auth_sessions where user_id=$1',[user]);
 await assert.rejects(actualSession.createSession({...sessionInput,expectedAuth:{passwordHash:finalHash,mfaEnabled:false,mfaSecretEnc:null}}),e=>e.status===401,'Changed MFA state rejects stale pre-enrollment credentials');
 await query("update app_users set status='suspended' where id=$1",[user]);await assert.rejects(actualSession.createSession(sessionInput),e=>e.status===401,'Even token-based callers cannot issue a session for an inactive user');await query("update app_users set status='active' where id=$1",[user]);
 const finance=await import(await load('app/api/finance/route.ts'));
 recorded.length=0;const cashResponse=await finance.GET(new Request('https://fixture.invalid/api/finance?view=cash'));assert.equal(cashResponse.status,200);assert.ok((await cashResponse.json()).cash);const cashQueries=recorded.filter(sql=>sql.startsWith('select')&&!sql.includes('set_config')).length;assert.equal(cashQueries,4,'Cash-only consumers perform four scoped queries including the separate refund ledger');assert.equal(recorded.filter(sql=>sql.startsWith('select r.refund_date::text')).length,1,'Actual repayment dates are queried once within the scoped cash snapshot');
 recorded.length=0;const legacyResponse=await finance.GET(new Request('https://fixture.invalid/api/finance'));assert.equal(legacyResponse.status,200);assert.ok((await legacyResponse.json()).payments,'Default external API contract preserved');assert.equal(recorded.filter(sql=>sql.startsWith('select')&&!sql.includes('set_config')).length,9);
 await query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active') on conflict(organization_id) do update set plan='professional'",[sessionInput.organizationId]);
 const files=await import(await load('app/api/files/route.ts'));
 const upload=(text,key)=>{const form=new FormData();form.append('file',new File([text],'synthetic.txt',{type:'text/plain'}));form.append('purpose','document');return new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':key},body:form});};
 const first=await files.POST(upload('synthetic bytes','synthetic-upload-replay'));assert.equal(first.status,201);const uploaded=(await first.json()).item;assert.equal(uploaded.available,false);
 const replay=await files.POST(upload('synthetic bytes','synthetic-upload-replay'));assert.equal(replay.status,201);assert.equal((await replay.json()).item.id,uploaded.id);
 assert.equal((await files.POST(upload('changed bytes','synthetic-upload-replay'))).status,409,'Same key cannot upload changed content');
 assert.equal((await query('select count(*)::int n from file_objects where organization_id=$1 and original_name=$2',[org,'synthetic.txt'])).rows[0].n,1);
 const download=await import(await load('app/api/files/[id]/download/route.ts'));
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})})).status,423,'Pending files cannot be downloaded');
 await query("update file_objects set scan_status='clean' where id=$1",[uploaded.id]);const clean=await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})});assert.equal(clean.status,200);assert.equal(await clean.text(),'synthetic bytes');
 await query("update file_objects set scan_status='rejected' where id=$1",[uploaded.id]);assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})})).status,423);
 const imageBytes=await sharp({create:{width:4,height:4,channels:4,background:'#4477aa'}}).png().toBuffer();
 const imageUpload=(purpose,key,bytes=imageBytes,crop)=>{const form=new FormData();form.append('file',new File([bytes],'synthetic.png',{type:'image/png'}));form.append('purpose',purpose);if(crop!==undefined)form.append('avatarCrop',JSON.stringify(crop));return new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':key},body:form});};
 assert.equal((await files.POST(imageUpload('profile_avatar','synthetic-corrupt-image',Buffer.from('89504e470d0a1a0a','hex')))).status,400,'Signature-only PNG is not a decodable image');
 const branding=async()=>({logo:(await query('select logo_url from organizations where id=$1',[org])).rows[0].logo_url,avatar:(await query('select avatar_url from app_users where id=$1',[user])).rows[0].avatar_url});
 const initialBranding=await branding();
 const scansBeforeCrop=globalThis.__integrity.scanCalls;
 for(const crop of [null,{},[],{x:2,y:0,zoom:1},{x:0,y:0,zoom:0}])assert.equal((await files.POST(imageUpload('profile_avatar','invalid-crop-'+randomUUID(),imageBytes,crop))).status,400,'Invalid crop never reaches storage or the scanner');
 const {limitsConfig}=await import(await load('config/limits.ts'));
 assert.equal((await files.POST(imageUpload('profile_avatar','oversized-avatar-'+randomUUID(),Buffer.alloc(limitsConfig.maxFileUploadBytes+1)))).status,413,'Oversized avatar rejected before decoding');
 assert.equal(globalThis.__integrity.scanCalls,scansBeforeCrop);assert.deepEqual(await branding(),initialBranding);
 const pendingLogo=await files.POST(imageUpload('company_logo','synthetic-pending-logo'));assert.equal(pendingLogo.status,201);const pendingLogoId=(await pendingLogo.json()).item.id;
 assert.equal((await files.POST(imageUpload('profile_avatar','synthetic-pending-avatar'))).status,201);assert.deepEqual(await branding(),initialBranding,'Quarantined images never replace existing branding');
 const beforeReject=(await query('select count(*)::int n from file_objects where organization_id=$1',[org])).rows[0].n;
 globalThis.__integrity.scanStatus='rejected';assert.equal((await files.POST(imageUpload('company_logo','synthetic-rejected-logo'))).status,422);
 globalThis.__integrity.scanStatus='unavailable';assert.equal((await files.POST(imageUpload('profile_avatar','synthetic-unavailable-avatar'))).status,503);
 assert.equal((await query('select count(*)::int n from file_objects where organization_id=$1',[org])).rows[0].n,beforeReject);assert.deepEqual(await branding(),initialBranding,'Rejected/unavailable scans create neither bytes nor branding changes');
 globalThis.__integrity.scanStatus='clean';
 const cleanLogoResponse=await files.POST(imageUpload('company_logo','synthetic-clean-logo'));assert.equal(cleanLogoResponse.status,201);const cleanLogo=(await cleanLogoResponse.json()).item;assert.equal(cleanLogo.scanStatus,'clean');
 const cleanAvatarResponse=await files.POST(imageUpload('profile_avatar','synthetic-unavailable-avatar'));assert.equal(cleanAvatarResponse.status,201,'Failed scans do not consume retry keys');const cleanAvatar=(await cleanAvatarResponse.json()).item;
 const proof=(await query('select scan_evidence,sha256 from file_objects where id=$1',[cleanLogo.id])).rows[0];assert.equal(proof.scan_evidence.sha256,proof.sha256,'Clean upload provenance binds actual persisted bytes');assert.equal(proof.scan_evidence.engine,'ClamAV');
 const cleanBranding={logo:'/api/files/'+cleanLogo.id+'/download',avatar:'/api/files/'+cleanAvatar.id+'/download'};assert.deepEqual(await branding(),cleanBranding);
 if(process.env.BINSO_REAL_SCANNER_SOCKET){const form=new FormData();form.set('file',new File([Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=','base64')],'synthetic-antivirus-test.txt',{type:'text/plain'}));form.set('purpose','document');const request=new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':'real-antivirus-test-key'},body:form});assert.equal((await files.POST(request)).status,422,'Actual upload handler rejects real antivirus test signature');assert.deepEqual(await branding(),cleanBranding);}
 const scansBeforeReplay=globalThis.__integrity.scanCalls;globalThis.__integrity.scanStatus='unavailable';assert.equal((await files.POST(imageUpload('company_logo','synthetic-clean-logo'))).status,201);assert.equal(globalThis.__integrity.scanCalls,scansBeforeReplay,'Successful replays do not depend on scanner availability');
 const company=await import(await load('app/api/settings/company/route.ts'));
 for(const [logoUrl,status] of [['https://external.fixture.invalid/logo.png',400],['/api/files/'+pendingLogoId+'/download',423],['/api/files/'+cleanAvatar.id+'/download',404],['/api/files/00000000-0000-4000-8000-000000000001/download',404]]){
  assert.equal((await company.PATCH(req({logoUrl}))).status,status);assert.deepEqual(await branding(),cleanBranding);
 }
 const foreignOrg='00000000-0000-4000-8000-000000000098',foreignFile='00000000-0000-4000-8000-000000000097';await query("insert into organizations(id,name,slug) values($1,'Isolated foreign tenant','integrity-foreign-fixture')",[foreignOrg]);
 await query("insert into file_objects(id,organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,purpose) values($1,$2,$3,'synthetic-foreign.png','image/png',1,$4,'clean',$5,'company_logo')",[foreignFile,foreignOrg,foreignOrg+'/files/'+foreignFile,'a'.repeat(64),user]);
 assert.equal((await company.PATCH(req({logoUrl:'/api/files/'+foreignFile+'/download'}))).status,404,'Clean foreign tenant logo cannot be assigned');
 assert.equal((await company.PATCH(req({logoUrl:cleanBranding.logo}))).status,200);
 assert.equal((await company.PATCH(req({logoUrl:null}))).status,200);assert.equal((await branding()).logo,null,'Explicit logo removal remains supported');
 globalThis.__integrity.fileAccessMode='authenticated-unscanned';
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,423,'A file-access flag alone cannot disable quarantine');
 globalThis.__integrity.releaseProfile='production';
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,423,'Production cannot use the development exception');
 globalThis.__integrity.releaseProfile='development-20261012';
 const deferred=await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})});
 assert.equal(deferred.status,200);assert.equal(deferred.headers.get('x-binso-file-scan-status'),'pending');assert.ok(deferred.headers.get('content-disposition').startsWith('attachment;'));assert.equal(deferred.headers.get('cache-control'),'private, no-store');assert.ok(deferred.headers.get('content-security-policy').includes('sandbox'));
 const persisted=(await query('select scan_status,scan_evidence from file_objects where id=$1',[pendingLogoId])).rows[0];assert.equal(persisted.scan_status,'pending');assert.equal(persisted.scan_evidence,null,'Access does not invent a scanner verdict or proof');
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:uploaded.id})})).status,423,'Rejected files stay blocked in development');
 const ownSession=globalThis.__integrity.getSession;
 globalThis.__integrity.getSession=()=>({...ownSession(),organizationId:foreignOrg});
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,404,'Development mode retains tenant isolation');
 globalThis.__integrity.getSession=()=>{throw new Response(null,{status:401})};
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,401,'Development mode never removes authentication');
 globalThis.__integrity.getSession=ownSession;
 assert.equal((await company.PATCH(req({logoUrl:'/api/files/'+pendingLogoId+'/download'}))).status,200,'An own pending image can be referenced in the explicit development mode');
 globalThis.__integrity.scanStatus='pending';
 const developmentAvatar=await files.POST(imageUpload('profile_avatar','synthetic-development-avatar'));assert.equal(developmentAvatar.status,201);const devAvatar=(await developmentAvatar.json()).item;assert.equal(devAvatar.scanStatus,'pending');assert.equal(devAvatar.available,true);assert.equal((await branding()).avatar,'/api/files/'+devAvatar.id+'/download');
 globalThis.__integrity.fileScanSocket='/private/scanner.sock';
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,423,'Activating a scanner disables the unscanned-access exception');
 globalThis.__integrity.fileScanSocket=undefined;
 globalThis.__integrity.fileAccessMode=undefined;globalThis.__integrity.releaseProfile=undefined;
 assert.equal((await download.GET(new Request('https://fixture.invalid'),{params:Promise.resolve({id:pendingLogoId})})).status,423,'Removing the explicit mode restores quarantine immediately');
 const supportSession=globalThis.__integrity.getSession;
 const supportCases=[];
 for(const [tenant,creator] of [[org,user],[org,'another-support-user'],[foreignOrg,user]]){
  supportCases.push((await query("insert into support_cases(organization_id,case_number,created_by_user_id,category,subject) values($1,$2,$3,'technical','Synthetic attachment test') returning id",[tenant,'ATTACH-'+randomUUID(),creator])).rows[0].id);
 }
 const supportUpload=(id,key)=>{const form=new FormData();form.set('file',new File(['Synthetic support evidence'],'support-evidence.txt',{type:'text/plain'}));form.set('purpose','support_attachment');form.set('entityId',id);return new Request('https://fixture.invalid/api/files',{method:'POST',headers:{'idempotency-key':key},body:form});};
 try{
  for(const profile of ['standard','time_only']){
   globalThis.__integrity.getSession=()=>({...supportSession(),role:'member',moduleProfile:profile});
   assert.equal((await files.POST(supportUpload(supportCases[0],'support-own-'+profile))).status,201,'Own support attachment succeeds for '+profile);
  }
  const ownFiles=await files.GET({nextUrl:new URL('https://fixture.invalid/api/files')});assert.equal(ownFiles.status,200);assert.ok((await ownFiles.json()).items.every(item=>['support_attachment','profile_avatar','time_report'].includes(item.purpose)),'No omitted URL filter may reveal an unauthorized purpose');
  assert.equal((await files.GET({nextUrl:new URL('https://fixture.invalid/api/files?customerId='+supportCases[0])})).status,403,'Forbidden relation filters are rejected before selecting files');
  assert.equal((await files.POST(supportUpload(supportCases[1],'support-other-user'))).status,404,'Time-only rejects another user case');
  assert.equal((await files.POST(supportUpload(supportCases[2],'support-other-tenant'))).status,404,'Time-only rejects another tenant case');

  const removal=await import(await load('app/api/files/[id]/route.ts'));
  const attachment=(await query("select id from file_objects where support_case_id=$1 order by created_at limit 1",[supportCases[0]])).rows[0].id;
  const context={params:Promise.resolve({id:attachment})};
  assert.equal((await removal.DELETE(new Request('https://fixture.invalid/api/files/invalid',{method:'DELETE'}),{params:Promise.resolve({id:'-'.repeat(36)})})).status,404,'Malformed UUID must be rejected before a database cast');
  const removeRequest=()=>new Request('https://fixture.invalid/api/files/'+attachment,{method:'DELETE'});
  globalThis.__integrity.getSession=()=>({...supportSession(),role:'member',userId:'another-support-user'});
  assert.equal((await removal.DELETE(removeRequest(),context)).status,403,'Another uploader cannot remove an attachment');
  globalThis.__integrity.getSession=()=>({...supportSession(),organizationId:foreignOrg});
  assert.equal((await removal.DELETE(removeRequest(),context)).status,404,'Foreign tenant cannot remove an attachment');
  globalThis.__integrity.getSession=()=>({...supportSession(),role:'member',moduleProfile:'time_only'});
  assert.equal((await removal.DELETE(removeRequest(),context)).status,200,'Own permitted support attachment can be removed');
  assert.equal((await removal.DELETE(removeRequest(),context)).status,200,'Repeated removal is idempotent');
  assert.ok((await query('select archived_at from file_objects where id=$1',[attachment])).rows[0].archived_at);
  assert.equal((await query('select count(*)::int n from file_contents where file_id=$1',[attachment])).rows[0].n,1,'Removal preserves retained file bytes');
  assert.equal((await download.GET(removeRequest(),context)).status,404,'Archived attachment cannot be downloaded');
  assert.ok(!(await (await files.GET({nextUrl:new URL('https://fixture.invalid/api/files')})).json()).items.some(item=>item.id===attachment),'Archived attachment is absent from active lists');
  globalThis.__integrity.getSession=supportSession;
  const archiveCustomer=(await query("insert into customers(organization_id,customer_no,external_id,name) values($1,$2,$2,'Synthetic archival customer') returning id",[org,'ARCH-'+randomUUID()])).rows[0].id;
  const expense=(await query("insert into expenses(organization_id,customer_id,external_id,expense_date,description,category,status,created_by_user_id) values($1,$2,gen_random_uuid()::text,current_date,'Synthetic locked receipt','expense','approved',$3) returning id",[org,archiveCustomer,user])).rows[0].id;
  const receipt=(await query("insert into file_objects(organization_id,object_key,original_name,content_type,size_bytes,sha256,scan_status,created_by,purpose,expense_id) values($1::uuid,$1::text||'/files/'||$2,'receipt.txt','text/plain',0,repeat('0',64),'clean',$3,'expense_receipt',$4) returning id",[org,randomUUID(),user,expense])).rows[0].id;
  assert.equal((await removal.DELETE(removeRequest(),{params:Promise.resolve({id:receipt})})).status,409,'Approved expense evidence cannot be removed');
  assert.equal((await query('select archived_at from file_objects where id=$1',[receipt])).rows[0].archived_at,null);
  assert.equal((await removal.DELETE(removeRequest(),{params:Promise.resolve({id:pendingLogoId})})).status,403,'Branding cannot be removed through attachment API');
 }finally{globalThis.__integrity.getSession=supportSession;}
 console.log((native?'PostgreSQL physical parallel clients':'Isolated PGlite')+': auth races, upload replay, strict/default quarantine, explicit development access without verdict mutation, rejected/auth/tenant denial, standard/time-only support attachment boundaries and branding policy passed.');
}finally{delete globalThis.__integrity;if(native)await db.end();else await db.close();}
