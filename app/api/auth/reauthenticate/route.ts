import {NextRequest} from 'next/server';
import {getSession} from '@/lib/server/session';
import {query,withTenant} from '@/lib/server/db';
import {ApiError,apiError,assertSameOrigin,json,readJson} from '@/lib/server/http';
import {asObject,stringField} from '@/lib/server/validation';
import {verifyPassword} from '@/lib/server/password';
import {verifyTotp,consumeRecoveryCode,consumePasskeyRecoveryCode} from '@/lib/server/totp';
import {decryptSecret} from '@/lib/server/crypto';
import {issueEmailCode,consumeEmailCode} from '@/lib/server/email-otp';
import {mailLayout,sendMail} from '@/lib/server/email';
import {enforceRateLimit} from '@/lib/server/rate-limit';
import {audit} from '@/lib/server/audit';

export const runtime='nodejs';
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,'fresh-authentication',10,15*60_000);
 const session=await getSession({allowMfaEnrollment:true});if(!session)throw new ApiError(401,'unauthorized','Anmeldung erforderlich.');
 const body=asObject(await readJson(request,8192)),password=stringField(body,'password',{min:1,max:256});
 const identity=(await query<{password_hash:string|null;mfa_enabled:boolean;mfa_secret_enc:string|null;email:string}>("select password_hash,mfa_enabled,mfa_secret_enc,email from app_users where id=$1 and status='active'",[session.userId])).rows[0];
 if(!identity?.password_hash||!await verifyPassword(password,identity.password_hash))throw new ApiError(403,'reauthentication_invalid','Die Bestätigung ist nicht gültig.');
 const hasPasskey=await withTenant(session.organizationId,session.userId,async client=>!!(await client.query('select 1 from auth_passkeys where user_id=$1 and organization_id=$2 and revoked_at is null',[session.userId,session.organizationId])).rowCount);
 const method=identity.mfa_enabled?'totp':hasPasskey?'recovery':'email';
 if(body.action==='challenge'){
  if(method==='email'){
   const code=await issueEmailCode({email:identity.email,purpose:'step_up',userId:session.userId,organizationId:session.organizationId,sessionId:session.sessionId});
   const delivery=await sendMail({to:identity.email,subject:'Binso One – Sicherheitsbestätigung',text:`Dein Sicherheitscode lautet: ${code}. Verwende ihn nur für die soeben angeforderte Aktion in Binso One.`,html:mailLayout('Sicherheitsbestätigung',`<p>Bestätige die von dir angeforderte sicherheitsrelevante Aktion in Binso One mit diesem Code:</p><p><strong>${code}</strong></p><p>Wenn du diese Aktion nicht angefordert hast, gib den Code nicht weiter.</p>`)});
   if(!delivery.delivered)throw new ApiError(503,'mail_unavailable','Der Sicherheitscode konnte nicht versendet werden.');
  }
  return json({method,codeSent:method==='email'});
 }
 if(body.action!=='confirm')throw new ApiError(400,'invalid_action','Ungültige Sicherheitsbestätigung.');
 const code=stringField(body,'code',{min:6,max:80});
 const verified=method==='recovery'?null:method==='totp'?/^\d{6}$/.test(code)?!!identity.mfa_secret_enc&&verifyTotp(decryptSecret(identity.mfa_secret_enc),code):await consumeRecoveryCode({query},{userId:session.userId,passwordHash:identity.password_hash,mfaSecretEnc:identity.mfa_secret_enc,code}):await consumeEmailCode({email:identity.email,purpose:'step_up',code,sessionId:session.sessionId});
 if(method!=='recovery'&&!verified)throw new ApiError(403,'reauthentication_invalid','Der Sicherheitscode ist ungültig oder abgelaufen.');
 await withTenant(session.organizationId,session.userId,async client=>{
  // Enrollment and credential management use the same user lock. A pending
  // email proof must not become a weaker step-up after a passkey was enrolled.
  await client.query('select id from app_users where id=$1 for update',[session.userId]);
  if(method==='recovery'&&!await consumePasskeyRecoveryCode(client,{userId:session.userId,passwordHash:identity.password_hash,mfaEnabled:identity.mfa_enabled,mfaSecretEnc:identity.mfa_secret_enc,code}))throw new ApiError(403,'reauthentication_invalid','Der Sicherheitscode ist ungültig oder abgelaufen.');
  if(method==='email'&&(await client.query('select 1 from auth_passkeys where user_id=$1 and organization_id=$2 and revoked_at is null',[session.userId,session.organizationId])).rowCount)throw new ApiError(409,'auth_state_changed','Die Sicherheitsdaten wurden geändert. Bitte melde dich erneut an.');
  const result=await client.query(`update auth_sessions set step_up_at=now() where id=$1 and user_id=$2 and organization_id=$3 and expires_at>now()
   and exists(select 1 from app_users u where u.id=$2 and u.status='active' and u.password_hash=$4 and u.mfa_enabled=$5 and u.mfa_secret_enc is not distinct from $6)`,[session.sessionId,session.userId,session.organizationId,identity.password_hash,identity.mfa_enabled,identity.mfa_secret_enc]);
  if(result.rowCount!==1)throw new ApiError(409,'auth_state_changed','Die Sicherheitsdaten wurden geändert. Bitte melde dich erneut an.');
  await audit(client,{organizationId:session.organizationId,userId:session.userId,action:'auth.fresh_confirmation',entityType:'auth_sessions',entityId:session.sessionId,metadata:{method}});
 });
 return json({ok:true});
}catch(error){return apiError(error)}}
