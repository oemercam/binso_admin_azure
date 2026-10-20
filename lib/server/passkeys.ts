import 'server-only';
import {createHash,randomBytes,randomUUID} from 'node:crypto';
import {cookies} from 'next/headers';
import {generateRegistrationOptions,verifyRegistrationResponse,generateAuthenticationOptions,verifyAuthenticationResponse,type RegistrationResponseJSON,type AuthenticationResponseJSON} from '@simplewebauthn/server';
import type {PoolClient} from 'pg';
import {withPlatform,withTenant} from './db';
import {env} from './env';
import {ApiError} from './http';
import {verifyPassword} from './password';
import {verifyTotp} from './totp';
import {decryptSecret} from './crypto';
import {audit} from './audit';
import {mailLayout,sendMail} from './email';
import {createSession,endDemoSession,type SessionUser} from './session';
import {registrationHandoff} from './registration';

const cookieName='binso_passkey';
const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
type AuthRow={id:string;email:string;display_name:string;password_hash:string|null;mfa_enabled:boolean;mfa_secret_enc:string|null;status:string;email_verified_at:Date|null};
const snapshot=(row:AuthRow)=>digest(JSON.stringify([row.password_hash,row.mfa_enabled,row.mfa_secret_enc]));
export function passkeyRelyingParty(){
 let url:URL;try{url=new URL(env.appUrl);}catch{throw new ApiError(503,'passkey_unavailable','Passkeys sind nicht konfiguriert.');}
 if(url.protocol!=='https:'&&!(env.appMode!=='production'&&url.protocol==='http:'&&url.hostname==='localhost'))throw new ApiError(503,'passkey_unavailable','Passkeys benötigen eine sichere konfigurierte Herkunft.');
 return {origin:url.origin,rpID:url.hostname};
}
async function freshFactor(c:PoolClient,s:SessionUser,password:unknown,code:unknown){
 const user=(await c.query<AuthRow>(`select u.* from app_users u join auth_sessions a on a.user_id=u.id
  where u.id=$1 and u.status='active' and a.id=$2 and a.organization_id=$3 and a.expires_at>now() for update of u,a`,[s.userId,s.sessionId,s.organizationId])).rows[0];
 if(!user||!user.email_verified_at||!user.mfa_enabled||!user.mfa_secret_enc)throw new ApiError(403,'strong_factor_required','Bitte zuerst den Authenticator einrichten.');
 if(!user.password_hash||typeof password!=='string'||password.length>512||!await verifyPassword(password,user.password_hash)||typeof code!=='string'||!/^\d{6}$/.test(code)||!verifyTotp(decryptSecret(user.mfa_secret_enc),code))throw new ApiError(403,'reauth_required','Aktuelles Passwort und Authenticator-Code sind erforderlich.');
 return user;
}
async function challengeCookie(token:string){(await cookies()).set(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/auth/passkeys',maxAge:300});}
async function takeChallenge(purpose:'register'|'authenticate',session?:SessionUser){
 const jar=await cookies(),token=jar.get(cookieName)?.value;jar.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/auth/passkeys',maxAge:0});
 if(!token)throw new ApiError(400,'passkey_challenge_invalid','Die Passkey-Anfrage ist abgelaufen. Bitte neu starten.');
 // Delete/commit before verification: invalid signatures cannot retry a challenge.
 const row=await withPlatform(async c=>(await c.query(`delete from auth_passkey_challenges where token_hash=$1 and purpose=$2 and expires_at>now()
  and ($3::uuid is null or session_id=$3) returning *`,[digest(token),purpose,session?.sessionId??null])).rows[0]);
 if(!row||session&&(row.user_id!==session.userId||row.organization_id!==session.organizationId))throw new ApiError(400,'passkey_challenge_invalid','Die Passkey-Anfrage ist abgelaufen. Bitte neu starten.');
 return row;
}
async function recordNotice(c:PoolClient,s:SessionUser,action:'added'|'removed'){
 const event=randomUUID(),text=action==='added'?'Ein Passkey wurde deinem Binso One Konto hinzugefügt.':'Ein Passkey wurde entfernt und alle anderen Sitzungen wurden abgemeldet.';
 await audit(c,{organizationId:s.organizationId,userId:s.userId,action:'auth.passkey_'+action,entityType:'app_users',entityId:s.userId});
 await c.query(`insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,attachment_html,created_by)
  values($1,$2,'security',$2,$3,'Binso One Kontosicherheit',$4,$5,$6)`,[s.organizationId,event,s.email,text,mailLayout('Kontosicherheit','<p>'+text+'</p>'),s.userId]);
 return event;
}
async function deliverNotice(s:SessionUser,event:string){
 const row=await withTenant(s.organizationId,s.userId,async c=>(await c.query("update mail_outbox set status='sending',attempts=attempts+1,updated_at=now() where organization_id=$1 and deduplication_key=$2 and kind='security' and status='queued' returning *",[s.organizationId,event])).rows[0]);
 if(!row)return 'unknown';
 let status='uncertain';try{status=(await sendMail({to:row.recipient,subject:row.subject,text:row.body,html:row.attachment_html})).delivered?'accepted':'failed';}catch{/* Keep uncertainty; never resend blindly. */}
 await withTenant(s.organizationId,s.userId,c=>c.query("update mail_outbox set status=$3,updated_at=now() where organization_id=$1 and id=$2 and status='sending'",[s.organizationId,row.id,status]));
 return status;
}
export async function listPasskeys(s:SessionUser){return withTenant(s.organizationId,s.userId,async c=>(await c.query('select credential_id as id,label,created_at,last_used_at from auth_passkeys where user_id=$1 and organization_id=$2 and revoked_at is null order by created_at',[s.userId,s.organizationId])).rows);}
export async function beginPasskeyRegistration(s:SessionUser,password:unknown,code:unknown,label:unknown){
 if(s.isDemo)throw new ApiError(403,'demo_security_unavailable','Passkeys sind im Testzugang deaktiviert.');
 const {rpID}=passkeyRelyingParty();
 const prepared=await withTenant(s.organizationId,s.userId,async c=>{
  const user=await freshFactor(c,s,password,code),keys=(await c.query('select credential_id from auth_passkeys where user_id=$1 and revoked_at is null',[s.userId])).rows;
  const options=await generateRegistrationOptions({rpName:'Binso One',rpID,userName:user.email,userID:new Uint8Array(createHash('sha256').update(user.id).digest()),attestationType:'none',authenticatorSelection:{residentKey:'required',userVerification:'required'},excludeCredentials:keys.map(k=>({id:k.credential_id})),supportedAlgorithmIDs:[-7,-257]});
  const token=randomBytes(32).toString('base64url'),name=typeof label==='string'?label.trim().slice(0,100):'';
  await c.query('delete from auth_passkey_challenges where user_id=$1 and purpose=$2',[s.userId,'register']);
  await c.query("insert into auth_passkey_challenges(token_hash,challenge,purpose,user_id,organization_id,session_id,auth_snapshot,label,expires_at) values($1,$2,'register',$3,$4,$5,$6,$7,now()+interval '5 minutes')",[digest(token),options.challenge,s.userId,s.organizationId,s.sessionId,snapshot(user),name||'Passkey']);
  return {token,options};
 });await challengeCookie(prepared.token);return prepared.options;
}
export async function finishPasskeyRegistration(s:SessionUser,response:RegistrationResponseJSON){
 const challenge=await takeChallenge('register',s),{origin,rpID}=passkeyRelyingParty();
 const checked=await verifyRegistrationResponse({response,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,supportedAlgorithmIDs:[-7,-257]}).catch(()=>{throw new ApiError(400,'passkey_invalid','Der Passkey konnte nicht bestätigt werden.');});
 if(!checked.verified)throw new ApiError(400,'passkey_invalid','Der Passkey konnte nicht bestätigt werden.');
 const event=await withTenant(s.organizationId,s.userId,async c=>{
  const user=(await c.query<AuthRow>(`select u.* from app_users u join auth_sessions a on a.user_id=u.id where u.id=$1 and u.status='active' and a.id=$2 and a.expires_at>now() for update of u,a`,[s.userId,s.sessionId])).rows[0];
  if(!user||snapshot(user)!==challenge.auth_snapshot)throw new ApiError(403,'auth_state_changed','Bitte die Sicherheitsprüfung erneut durchführen.');
  const {credential,credentialDeviceType,credentialBackedUp}=checked.registrationInfo;
  await c.query('insert into auth_passkeys(credential_id,user_id,organization_id,public_key,counter,label,transports,device_type,backed_up) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[credential.id,s.userId,s.organizationId,Buffer.from(credential.publicKey),credential.counter,challenge.label,credential.transports??[],credentialDeviceType,credentialBackedUp]);
  return recordNotice(c,s,'added');
 });return {ok:true,notice:await deliverNotice(s,event)};
}
export async function removePasskey(s:SessionUser,id:unknown,password:unknown,code:unknown){
 if(s.isDemo)throw new ApiError(403,'demo_security_unavailable','Passkeys sind im Testzugang deaktiviert.');
 if(typeof id!=='string'||id.length>2048)throw new ApiError(400,'passkey_invalid','Ungültiger Passkey.');
 const event=await withTenant(s.organizationId,s.userId,async c=>{
  await freshFactor(c,s,password,code);
  const changed=await c.query('update auth_passkeys set revoked_at=now() where credential_id=$1 and user_id=$2 and organization_id=$3 and revoked_at is null returning credential_id',[id,s.userId,s.organizationId]);
  if(!changed.rowCount)throw new ApiError(404,'passkey_missing','Passkey nicht gefunden.');
  await c.query('delete from auth_sessions where user_id=$1 and id<>$2',[s.userId,s.sessionId]);
  await c.query('delete from auth_passkey_challenges where user_id=$1',[s.userId]);
  return recordNotice(c,s,'removed');
 });return {ok:true,notice:await deliverNotice(s,event)};
}
export async function beginPasskeyAuthentication(){
 const {rpID}=passkeyRelyingParty(),options=await generateAuthenticationOptions({rpID,userVerification:'required'}),token=randomBytes(32).toString('base64url');
 await withPlatform(async c=>{
  await c.query('delete from auth_passkey_challenges where expires_at<=now()');
  await c.query("insert into auth_passkey_challenges(token_hash,challenge,purpose,expires_at) values($1,$2,'authenticate',now()+interval '5 minutes')",[digest(token),options.challenge]);
 });await challengeCookie(token);return options;
}
export async function finishPasskeyAuthentication(response:AuthenticationResponseJSON,code:unknown,remember:boolean){
 const challenge=await takeChallenge('authenticate'),{origin,rpID}=passkeyRelyingParty();
 const user=await withPlatform(async c=>{
  const credential=(await c.query('select * from auth_passkeys where credential_id=$1 and revoked_at is null for update',[response.id])).rows[0];
  if(!credential)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  const checked=await verifyAuthenticationResponse({response,expectedChallenge:challenge.challenge,expectedOrigin:origin,expectedRPID:rpID,requireUserVerification:true,credential:{id:credential.credential_id,publicKey:new Uint8Array(credential.public_key),counter:Number(credential.counter),transports:credential.transports}}).catch(()=>{throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');});
  if(!checked.verified)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  // The existing identity lookup policy reveals only this proven user's
  // memberships; platform context is not a general membership-RLS bypass.
  await c.query("select set_config('app.user_id',$1,true)",[credential.user_id]);
  const identity=(await c.query<AuthRow>("select * from app_users where id=$1 and status='active' and email_verified_at is not null for update",[credential.user_id])).rows[0];
  const memberships=(await c.query<{organization_id:string;role:SessionUser['role']}>("select organization_id,role from organization_memberships where user_id=$1 and status='active'",[credential.user_id])).rows;
  if(!identity||memberships.length!==1||memberships[0].organization_id!==credential.organization_id)throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  await c.query("select set_config('app.organization_id',$1,true)",[credential.organization_id]);
  const organization=(await c.query("select status,is_demo from organizations where id=$1",[credential.organization_id])).rows[0];
  if(!organization||organization.is_demo||!['active','trial','grace_period','read_only'].includes(organization.status))throw new ApiError(401,'invalid_credentials','Anmeldung nicht möglich.');
  // Passkey equivalence is NOT approved for privileged MFA. Keep existing TOTP
  // for every enrolled user, including owner/admin/finance; no silent bypass.
  if(identity.mfa_enabled&&(typeof code!=='string'||!/^\d{6}$/.test(code)||!identity.mfa_secret_enc||!verifyTotp(decryptSecret(identity.mfa_secret_enc),code)))throw new ApiError(401,'passkey_mfa_required','Authenticator-Code erforderlich. Bitte mit dem Code erneut anmelden.');
  await c.query('update auth_passkeys set counter=$2,last_used_at=now(),backed_up=$3 where credential_id=$1',[credential.credential_id,checked.authenticationInfo.newCounter,checked.authenticationInfo.credentialBackedUp]);
  await c.query('update app_users set last_login_at=now() where id=$1',[identity.id]);
  return {...identity,...memberships[0]};
 });
 await endDemoSession();
 await createSession({userId:user.id,organizationId:user.organization_id,email:user.email,name:user.display_name,role:user.role,persistent:remember,ttlHours:remember?undefined:12,expectedPasskeyId:response.id,expectedAuth:{passwordHash:user.password_hash,mfaEnabled:user.mfa_enabled,mfaSecretEnc:user.mfa_secret_enc}});
 return {ok:true,...await registrationHandoff(user.organization_id,user.role,user.mfa_enabled)};
}
