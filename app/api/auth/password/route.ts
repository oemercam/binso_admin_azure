import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { consumeAuthToken } from "@/lib/server/auth-tokens";
import { hashPassword, verifyPassword } from "@/lib/server/password";
import {requireSession} from "@/lib/server/session";
import {requireFreshAuthentication} from '@/lib/server/fresh-authentication';
import {enforceRateLimit} from "@/lib/server/rate-limit";
import { query,withTransaction } from "@/lib/server/db";
import {verifyTotp,consumeRecoveryCode,consumePasskeyRecoveryCode} from '@/lib/server/totp';
import {decryptSecret} from '@/lib/server/crypto';
import {queueSecurityNotice,deliverSecurityNotice} from '@/lib/server/security-notice';
export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const body=await readJson<{token?:unknown;password?:unknown;currentPassword?:unknown;recoveryCode?:unknown}>(request,8192);
  const token=typeof body.token==="string"?body.token:"";const password=typeof body.password==="string"?body.password:"";
  if(password.length>256)return json({error:"password_too_long",message:"Das Passwort ist zu lang."},400);
  if(password.length<12)return json({error:"password_too_short",message:"Das Passwort muss mindestens 12 Zeichen haben."},400);
  if(!token){
    const session=await requireSession();
    if(session.isDemo)return json({error:'demo_action_unavailable',message:'Demo-Zugang benötigt kein Passwort.'},403);
    await requireFreshAuthentication(session);
    await enforceRateLimit(request,'password-change',5,15*60*1000);
    const current=typeof body.currentPassword==='string'?body.currentPassword:'';
    const user=(await query<{password_hash:string}>('select password_hash from app_users where id=$1',[session.userId])).rows[0];
    if(!user?.password_hash||!await verifyPassword(current,user.password_hash))return json({error:'reauth_required',message:'Das aktuelle Passwort stimmt nicht.'},403);
    const hash=await hashPassword(password);
    await withTransaction(async c=>{const changed=await c.query("update app_users set password_hash=$1,updated_at=now() where id=$2 and status='active' and password_hash=$3 returning id",[hash,session.userId,user.password_hash]);if(!changed.rowCount)throw new ApiError(409,"auth_state_changed","Die Sicherheitsdaten wurden geändert. Bitte erneut anmelden.");await c.query('delete from auth_sessions where user_id=$1 and id<>$2',[session.userId,session.sessionId]);await c.query('update auth_sessions set step_up_at=null where id=$1',[session.sessionId]);});
    return json({ok:true});
  }
  await enforceRateLimit(request,"password-reset",5,15*60_000);
  const hash=await hashPassword(password);
  const recovered=await withTransaction(async client=>{
    const reset=await consumeAuthToken("password_reset",token,client);
    if(!reset?.user_id)throw new ApiError(400,"reset_invalid","Link ist ungültig oder abgelaufen.");
    const identity=(await client.query("select * from app_users where id=$1 and status='active' for update",[reset.user_id])).rows[0];
    if(!identity)throw new ApiError(400,'reset_invalid','Link ist ungültig oder abgelaufen.');
    await client.query("select set_config('app.user_id',$1,true)",[reset.user_id]);
    const memberships=(await client.query("select organization_id from organization_memberships where user_id=$1 and status='active'",[reset.user_id])).rows;
    if(memberships.length!==1)throw new ApiError(400,'reset_invalid','Link ist ungültig oder abgelaufen.');
    await client.query("select set_config('app.organization_id',$1,true)",[memberships[0].organization_id]);
    const hasPasskey=!!(await client.query('select 1 from auth_passkeys where user_id=$1 and revoked_at is null',[reset.user_id])).rowCount;
    if(identity.mfa_enabled||hasPasskey){
      const code=typeof body.recoveryCode==='string'?body.recoveryCode.trim().slice(0,80):'';
      let verified=false;
      if(identity.mfa_enabled)verified=/^\d{6}$/.test(code)?!!identity.mfa_secret_enc&&verifyTotp(decryptSecret(identity.mfa_secret_enc),code):await consumeRecoveryCode(client,{userId:reset.user_id,passwordHash:identity.password_hash,mfaSecretEnc:identity.mfa_secret_enc,code});
      if(!verified&&code)verified=await consumePasskeyRecoveryCode(client,{userId:reset.user_id,passwordHash:identity.password_hash,mfaEnabled:identity.mfa_enabled,mfaSecretEnc:identity.mfa_secret_enc,code});
      if(!verified)throw new ApiError(403,'recovery_factor_required','Bestätige die Wiederherstellung mit einem Authenticator- oder Wiederherstellungscode. Alternativ kannst du dich mit einem weiteren Passkey anmelden.');
    }
    const changed=await client.query("update app_users set password_hash=$1,updated_at=now() where id=$2 and status='active' returning id",[hash,reset.user_id]);
    if(!changed.rowCount)throw new ApiError(400,"reset_invalid","Link ist ungültig oder abgelaufen.");
    await client.query("delete from auth_sessions where user_id=$1",[reset.user_id]);
    await client.query('delete from auth_passkey_challenges where user_id=$1',[reset.user_id]);
    const owner={organizationId:memberships[0].organization_id,userId:reset.user_id,email:identity.email};
    const event=await queueSecurityNotice(client,owner,'auth.password_recovered','Das Passwort deines Binso One Kontos wurde wiederhergestellt und alle Sitzungen wurden abgemeldet. Falls du dies nicht veranlasst hast, kontaktiere den Support.');
    return {owner,event};
  });
  return json({ok:true,notice:await deliverSecurityNotice(recovered.owner,recovered.event).catch(()=>'uncertain')});
 }catch(error){return apiError(error);}
}
