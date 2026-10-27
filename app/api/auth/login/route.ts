import {NextRequest} from "next/server";
import {query,withTransaction} from "@/lib/server/db";
import {verifyPassword} from "@/lib/server/password";
import {createSession,endDemoSession} from "@/lib/server/session";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {consumeEmailCode} from "@/lib/server/email-otp";


import {completeRegistrationVerification,registrationHandoff,sendRegistrationVerification} from "@/lib/server/registration";
import {registrationLocale} from "@/lib/server/mail-i18n";

export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"login",10,15*60_000);
  const body=asObject(await readJson(request,16_000));
  const email=emailField(body);
  const password=stringField(body,"password",{max:256,min:1});
  const emailCode=body.emailCode!=null?stringField(body,"emailCode",{max:6,min:6}):"";
  // Credential lookup is identity-only. Tenant discovery follows password proof.
  const identity=(await query<{
   id:string;name:string;email:string;password_hash:string|null;
   language:string;mfa_enabled:boolean;mfa_secret_enc:string|null;recovery_code_hashes:string[];email_verified_at:Date|null
  }>(`select id,display_name as name,email,password_hash,language,mfa_enabled,mfa_secret_enc,recovery_code_hashes,email_verified_at
      from app_users where lower(email)=lower($1) and status='active' limit 1`,[email])).rows[0];
  if(!identity?.password_hash||!(await verifyPassword(password,identity.password_hash)))return json({error:"invalid_credentials",message:"E-Mail oder Passwort ist falsch."},401);
  const membership=await withTransaction(async client=>{
   await client.query("select set_config('app.user_id',$1,true)",[identity.id]);
   return (await client.query<{organization_id:string;role:"owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader"}>(`
    select m.organization_id,m.role from organization_memberships m
    join organizations o on o.id=m.organization_id and o.status in ('trial','active','grace_period','read_only')
    where m.user_id=$1 and m.status='active'
      and (select count(*) from organization_memberships all_m where all_m.user_id=m.user_id and all_m.status='active')=1`,[identity.id])).rows[0];
  });
  if(!membership)return json({error:"invalid_credentials",message:"E-Mail oder Passwort ist falsch."},401);
  const user={...identity,...membership,password_hash:identity.password_hash};


  if(!user.email_verified_at){
    if(!emailCode){
      const delivered=await sendRegistrationVerification({email:user.email,userId:user.id,organizationId:user.organization_id,locale:registrationLocale(user.language)});
      if(!delivered)throw new ApiError(503,"mail_unavailable","Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte später erneut versuchen.");
      return json({requiresEmailVerification:true,verificationCodeSent:true},202);
    }
    if(!await consumeEmailCode({email:user.email,purpose:"verify_email",code:emailCode}))return json({error:"invalid_code",message:"Der Bestätigungscode ist ungültig oder abgelaufen.",requiresEmailVerification:true},401);
    if(!await withTransaction(client=>completeRegistrationVerification(client,user.id,user.email,user.organization_id)))return json({error:"invalid_credentials"},401);

  }

  // Customer login requires a verified email and password only. Existing factors
  // remain stored for recovery and fresh proof of sensitive account changes.
  await query("update app_users set last_login_at=now(),updated_at=now() where id=$1",[user.id]);
  await query("update platform_tenants set last_active_at=now() where organization_id=$1",[user.organization_id]);
  await endDemoSession();
  await createSession({userId:user.id,organizationId:user.organization_id,email:user.email,name:user.name,role:user.role,persistent:body.rememberMe===true,ttlHours:body.rememberMe===true?undefined:12,expectedAuth:{passwordHash:user.password_hash,mfaEnabled:user.mfa_enabled,mfaSecretEnc:user.mfa_secret_enc}});
  return json({ok:true,emailVerified:true,...await registrationHandoff(user.organization_id,user.role,user.mfa_enabled)});
 }catch(error){return apiError(error)}
}
