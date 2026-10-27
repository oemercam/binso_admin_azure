import 'server-only';
import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse,type RegistrationResponseJSON,type AuthenticationResponseJSON} from '@simplewebauthn/server';
import type {PoolClient} from 'pg';
import {withPlatform,withTenant} from './db';
import {env} from './env';
import {ApiError} from './http';
import {generatePasskeyRecoveryCodes,hashRecoveryCode} from './totp';
import {decryptSecret,encryptSecret} from './crypto';
import {audit} from './audit';
import {queueSecurityNotice,deliverSecurityNotice} from './security-notice';
import {createSession,endDemoSession,type SessionUser} from './session';
import {registrationHandoff} from './registration';
import {requireFreshAuthentication} from './fresh-authentication';

const cookieName='binso_passkey';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
const deliverNotice=(s:SessionUser,event:string)=>deliverSecurityNotice(s,event).catch(()=>'uncertain');
type AuthRow={id:string;email:string;display_name:string;password_hash:string|null;mfa_enabled:boolean;mfa_secret_enc:string|null;status:string;email_verified_at:Date|null;passkey_recovery_hashes?:string[]};
// Short-lived reauthentication state, never a password verifier. Encrypt the
// state with existing authenticated encryption; no fast hash of security fields.
const authState=(row:AuthRow)=>JSON.stringify(['passkey-auth-state-v1',row.id,row.password_hash,row.mfa_enabled,row.mfa_secret_enc]);
const snapshot=(row:AuthRow)=>encryptSecret(authState(row));
function snapshotMatches(row:AuthRow,proof:string){
 try{const expected=Buffer.from(authState(row)),actual=Buffer.from(decryptSecret(proof));return expected.length===actual.length&&timingSafeEqual(expected,actual);}catch{return false;}
}
export function passkeyRelyingParty(){
 if(env.passkeysEnabled===false)throw new ApiError(503,'passkey_unavailable','Passkeys sind nicht verfügbar. Bitte mit Passwort anmelden.');
 let url:URL;try{url=new URL(env.appUrl);}catch{throw new ApiError(503,'passkey_unavailable','Passkeys sind nicht konfiguriert.');}
 if(url.username||url.password||url.pathname!=='/'||url.search||url.hash||url.protocol!=='https:'&&!(env.appMode!=='production'&&url.protocol==='http:'&&url.hostname==='localhost'))throw new ApiError(503,'passkey_unavailable','Passkeys benötigen eine sichere konfigurierte Herkunft.');
 return {origin:url.origin,rpID:url.hostname};
}
async function freshFactor(c:PoolClient,s:SessionUser){
 const user=(await c.query<AuthRow>(`select u.* from app_users u join auth_sessions a on a.user_id=u.id
  where u.id=$1 and u.status='active' and a.id=$2 and a.organization_id=$3 and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now() for update of u,a`,[s.userId,s.sessionId,s.organizationId])).rows[0];
 if(!user||!user.email_verified_at)throw new ApiError(403,'fresh_authentication_required','Bitte bestätige diese sicherheitsrelevante Aktion erneut.');
 return user;
}
async function challengeCookie(token:string){(await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/auth/passkeys',maxAge:300});}
async function takeChallenge(purpose:'register'|'authenticate',session?:SessionUser){
 const jar=await cookies(),token=jar.get(cookieName)?.value;jar.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/auth/passkeys',maxAge:0});
 if(!token)throw new ApiError(400,'passkey_challenge_invalid','Die Passkey-Anfrage ist abgelaufen. Bitte neu starten.');
 // Delete/commit before verification: invalid signatures cannot retry a challenge.
 const row=await withPlatform(async c=>(await c.query(`delete from auth_passkey_challenges where token_hash=$1 and purpose=$2 and expires_at>now()
  and session_id is not distinct from $3::uuid returning *`,[digest(token),purpose,session?.sessionId??null])).rows[0]);
 if(!row||session&&(row.user_id!==session.userId||row.organization_id!==session.organizationId))throw new ApiError(400,'passkey_challenge_invalid','Die Passkey-Anfrage ist abgelaufen. Bitte neu starten.');
 return row;
}
async function recordNotice(c:PoolClient,s:SessionUser,action:'added'|'removed'|'renamed'|'recovery_changed'){
 const text=action==='added'?'Ein Passkey wurde deinem Binso One Konto hinzugefügt.':action==='removed'?'Ein Passkey wurde entfernt und alle anderen Sitzungen wurden abgemeldet.':action==='renamed'?'Die Bezeichnung eines Passkeys wurde geändert.':'Neue Passkey-Wiederherstellungscodes wurden erstellt. Die bisherigen Codes sind ungültig.';
 return queueSecurityNotice(c,s,'auth.passkey_'+action,text);
}
export async function listPasskeys(s:SessionUser){return withTenant(s.organizationId,s.userId,async c=>(await c.query('select credential_id as id,label,created_at,last_used_at from auth_passkeys where user_id=$1 and organization_id=$2 and revoked_at is null order by created_at',[s.userId,s.organizationId])).rows);}
export async function passkeyOffer(s:SessionUser){if(env.passkeysEnabled===false)return false;return withTenant(s.organizationId,s.userId,async c=>(await c.query(`select
 (u.passkey_prompt_after is null or u.passkey_prompt_after<=now())
 and u.email_verified_at is not null
 and exists(select 1 from organization_milestones where organization_id=$2 and milestone='onboarding_completed')
 and not exists(select 1 from auth_passkeys where user_id=$1 and revoked_at is null) as due
 from app_users u where u.id=$1 and u.status='active'`,[s.userId,s.organizationId])).rows[0]?.due===true);}
export async function deferPasskeyOffer(s:SessionUser){await withTenant(s.organizationId,s.userId,c=>c.query("update app_users set passkey_prompt_after=now()+interval '30 days' where id=$1",[s.userId]));return {ok:true};}
export async function renamePasskey(s:SessionUser,id:unknown,label:unknown){
 if(typeof id!=='string'||id.length>2048||typeof label!=='string'||!label.trim()||label.trim().length>100)throw new ApiError(400,'passkey_invalid','Ungültiger Passkey.');
 const event=await withTenant(s.organizationId,s.userId,async c=>{await freshFactor(c,s);
  if(!(await c.query('update auth_passkeys set label=$4 where credential_id=$1 and user_id=$2 and organization_id=$3 and revoked_at is null returning credential_id',[id,s.userId,s.organizationId,label.trim()])).rowCount)throw new ApiError(404,'passkey_missing','Passkey nicht gefunden.');
  await c.query('update auth_sessions set step_up_at=null where id=$1',[s.sessionId]);return recordNotice(c,s,'renamed');
 });return {ok:true,notice:await deliverNotice(s,event)};
}
export async function rotatePasskeyRecovery(s:SessionUser){
 const codes=generatePasskeyRecoveryCodes();
 const event=await withTenant(s.organizationId,s.userId,async c=>{await freshFactor(c,s);
  if(!(await c.query('select 1 from auth_passkeys where user_id=$1 and organization_id=$2 and revoked_at is null',[s.userId,s.organizationId])).rowCount)throw new ApiError(409,'passkey_missing','Passkey nicht gefunden.');
  await c.query('update app_users set passkey_recovery_hashes=$2::jsonb where id=$1',[s.userId,JSON.stringify(codes.map(hashRecoveryCode))]);
  await c.query('update auth_sessions set step_up_at=null where id=$1',[s.sessionId]);return recordNotice(c,s,'recovery_changed');
 });return {ok:true,recoveryCodes:codes,notice:await deliverNotice(s,event)};
}
export async function beginPasskeyRegistration(s:SessionUser,_password:unknown,_code:unknown,label:unknown){
 if(s.isDemo)throw new ApiError(403,'demo_security_unavailable','Passkeys sind im Testzugang deaktiviert.');
 const {rpID}=passkeyRelyingParty();
 const prepared=await withTenant(s.organizationId,s.userId,async c=>{
  const user=await freshFactor(c,s),keys=(await c.query('select credential_id from auth_passkeys where user_id=$1 and revoked_at is null',[s.userId])).rows;
  if(keys.length>=10)throw new ApiError(409,'passkey_limit','Es können höchstens zehn Passkeys eingerichtet werden.');
  const options=await generateRegistrationOptions({rpName:'Binso One',rpID,userName:user.email,userID:new Uint8Array(createHash('sha256').update(user.id).digest()),attestationType:'none',authenticatorSelection:{residentKey:'required',userVerification:'required'},excludeCredentials:keys.map(k=>({id:k.credential_id})),supportedAlgorithmIDs:[-7,-257]});
  const token=randomBytes(32).toString('base64url'),name=typeof label==='string'?label.trim().slice(0,100):'';
  await c.query('delete from auth_passkey_challenges where user_id=$1 and purpose=$2',[s.userId,'register']);
  await c.query("insert into auth_passkey_challenges(token_hash,challenge,purpose,user_id,organization_id,session_id,auth_snapshot,label,expires_at) values($1,$2,'register',$3,$4,$5,$6,$7,now()+interval '5 minutes')",[digest(token),options.challenge,s.userId,s.organizationId,s.sessionId,snapshot(user),name||'Passkey']);
  return {token,options};
 });await challengeCookie(prepared.token);return prepared.options;
}
export async function finishPasskeyRegistration(s:SessionUser,response:RegistrationResponseJSON){
 await requireFreshAuthentication(s);
 const challenge=await takeChallenge('register',s),{origin,rpID}=passkeyRelyingParty();
 const checked=await verifyRegistrationResponse({response,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,supportedAlgorithmIDs:[-7,-257]}).catch(()=>{throw new ApiError(400,'passkey_invalid','Der Passkey konnte nicht bestätigt werden.');});
 if(!checked.verified)throw new ApiError(400,'passkey_invalid','Der Passkey konnte nicht bestätigt werden.');
 const event=await withTenant(s.organizationId,s.userId,async c=>{
  const user=await freshFactor(c,s);
  if(!snapshotMatches(user,challenge.auth_snapshot))throw new ApiError(403,'auth_state_changed','Bitte die Sicherheitsprüfung erneut durchführen.');
  const {credential,credentialDeviceType,credentialBackedUp}=checked.registrationInfo;
  await c.query('insert into auth_passkeys(credential_id,user_id,organization_id,public_key,counter,label,transports,device_type,backed_up) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[credential.id,s.userId,s.organizationId,Buffer.from(credential.publicKey),credential.counter,challenge.label,credential.transports??[],credentialDeviceType,credentialBackedUp]);
  await c.query('update auth_sessions set step_up_at=null where id=$1',[s.sessionId]);
  const recoveryCodes=!user.passkey_recovery_hashes?.length?generatePasskeyRecoveryCodes():[];
  if(recoveryCodes.length)await c.query('update app_users set passkey_recovery_hashes=$2::jsonb where id=$1',[s.userId,JSON.stringify(recoveryCodes.map(hashRecoveryCode))]);
  return {event:await recordNotice(c,s,'added'),recoveryCodes};
 });return {ok:true,recoveryCodes:event.recoveryCodes,notice:await deliverNotice(s,event.event)};
}
export async function removePasskey(s:SessionUser,id:unknown,_password:unknown,_code:unknown){
 if(s.isDemo)throw new ApiError(403,'demo_security_unavailable','Passkeys sind im Testzugang deaktiviert.');
 if(typeof id!=='string'||id.length>2048)throw new ApiError(400,'passkey_invalid','Ungültiger Passkey.');
 const event=await withTenant(s.organizationId,s.userId,async c=>{
  const user=await freshFactor(c,s);
  const remaining=(await c.query('select 1 from auth_passkeys where user_id=$1 and organization_id=$2 and credential_id<>$3 and revoked_at is null',[s.userId,s.organizationId,id])).rowCount;
  const policy=(await c.query('select employee_mfa_required from organizations where id=$1',[s.organizationId])).rows[0];
  if(!remaining&&(!user.password_hash||!user.email_verified_at||policy?.employee_mfa_required&&!user.mfa_enabled))throw new ApiError(409,'last_signin_method','Richte zuerst eine weitere starke Anmeldemethode ein.');
  const changed=await c.query('update auth_passkeys set revoked_at=now() where credential_id=$1 and user_id=$2 and organization_id=$3 and revoked_at is null returning credential_id',[id,s.userId,s.organizationId]);
  if(!changed.rowCount)throw new ApiError(404,'passkey_missing','Passkey nicht gefunden.');
  await c.query('delete from auth_sessions where user_id=$1 and id<>$2',[s.userId,s.sessionId]);
  await c.query('update auth_sessions set step_up_at=null where id=$1',[s.sessionId]);
  await c.query('delete from auth_passkey_challenges where user_id=$1',[s.userId]);
  return recordNotice(c,s,'removed');
 });return {ok:true,notice:await deliverNotice(s,event)};
}
export async function beginPasskeyAuthentication(s?:SessionUser){
 const {rpID}=passkeyRelyingParty(),options=await generateAuthenticationOptions({rpID,userVerification:'required'}),token=randomBytes(32).toString('base64url');
 await withPlatform(async c=>{
  await c.query('delete from auth_passkey_challenges where expires_at<=now()');
  let proof:string|null=null;
  if(s){const identity=(await c.query<AuthRow>("select * from app_users where id=$1 and status='active' and email_verified_at is not null",[s.userId])).rows[0];if(!identity||s.isDemo)throw new ApiError(403,'passkey_invalid','Ungültiger Passkey.');proof=snapshot(identity);}
  await c.query("insert into auth_passkey_challenges(token_hash,challenge,purpose,user_id,organization_id,session_id,auth_snapshot,expires_at) values($1,$2,'authenticate',$3,$4,$5,$6,now()+interval '5 minutes')",[digest(token),options.challenge,s?.userId??null,s?.organizationId??null,s?.sessionId??null,proof]);
 });await challengeCookie(token);return options;
}
export async function finishPasskeyAuthentication(response:AuthenticationResponseJSON,_code:unknown,remember:boolean,s?:SessionUser){
 const challenge=await takeChallenge('authenticate',s),{origin,rpID}=passkeyRelyingParty();
 const user=await withPlatform(async c=>{
  const candidate=(await c.query('select user_id from auth_passkeys where credential_id=$1 and revoked_at is null',[response.id])).rows[0];
  if(!candidate||s&&candidate.user_id!==s.userId)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  // Same user->credential lock order as management and session issuance.
  await c.query('select id from app_users where id=$1 for update',[candidate.user_id]);
  const credential=(await c.query('select * from auth_passkeys where credential_id=$1 and revoked_at is null for update',[response.id])).rows[0];
  if(!credential)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  const checked=await verifyAuthenticationResponse({response,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,credential:{id:credential.credential_id,publicKey:new Uint8Array(credential.public_key),counter:Number(credential.counter),transports:credential.transports}}).catch(()=>{throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');});
  if(!checked.verified||checked.authenticationInfo.credentialDeviceType!==credential.device_type)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  // The existing identity lookup policy reveals only this proven user's
  // memberships; platform context is not a general membership-RLS bypass.
  await c.query("select set_config('app.user_id',$1,true)",[credential.user_id]);
  const identity=(await c.query<AuthRow>("select * from app_users where id=$1 and status='active' and email_verified_at is not null for update",[credential.user_id])).rows[0];
  const memberships=(await c.query<{organization_id:string;role:SessionUser['role']}>("select organization_id,role from organization_memberships where user_id=$1 and status='active'",[credential.user_id])).rows;
  if(!identity||memberships.length!==1||memberships[0].organization_id!==credential.organization_id)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  await c.query("select set_config('app.organization_id',$1,true)",[credential.organization_id]);
  const organization=(await c.query("select status,is_demo from organizations where id=$1",[credential.organization_id])).rows[0];
  if(!organization||organization.is_demo||!['active','trial','grace_period','read_only'].includes(organization.status))throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  // Explicit passkey policy: signature + required UV satisfies strong login.
  // Password/TOTP alternatives retain their independent existing checks.
  if(response.response.userHandle&&response.response.userHandle!==createHash('sha256').update(identity.id).digest('base64url'))throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  if(s&&(identity.id!==s.userId||credential.organization_id!==s.organizationId||!snapshotMatches(identity,challenge.auth_snapshot)))throw new ApiError(403,'auth_state_changed','Bitte die Sicherheitsprüfung erneut durchführen.');
  await c.query('update auth_passkeys set counter=$2,last_used_at=now(),backed_up=$3 where credential_id=$1',[credential.credential_id,checked.authenticationInfo.newCounter,checked.authenticationInfo.credentialBackedUp]);
  await c.query('update app_users set last_login_at=now() where id=$1',[identity.id]);
  if(s){
   const changed=await c.query('update auth_sessions set step_up_at=now(),passkey_verified=true where id=$1 and user_id=$2 and organization_id=$3 and expires_at>now() returning id',[s.sessionId,s.userId,s.organizationId]);
   if(!changed.rowCount)throw new ApiError(401,'unauthorized','Anmeldung erforderlich.');
  }
  if(s)await audit(c,{organizationId:credential.organization_id,userId:identity.id,action:'auth.fresh_confirmation',entityType:'auth_sessions',entityId:s.sessionId,metadata:{method:'passkey',userVerified:true}});
  return {...identity,...memberships[0]};
 });
 if(s)return {ok:true};
 await endDemoSession();
 await createSession({userId:user.id,organizationId:user.organization_id,email:user.email,name:user.display_name,role:user.role,persistent:remember,ttlHours:remember?undefined:12,expectedPasskeyId:response.id,expectedAuth:{passwordHash:user.password_hash,mfaEnabled:user.mfa_enabled,mfaSecretEnc:user.mfa_secret_enc}});
 return {ok:true,...await registrationHandoff(user.organization_id,user.role,true)};
}
