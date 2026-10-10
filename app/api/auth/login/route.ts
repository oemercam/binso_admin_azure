import {NextRequest} from "next/server";
import {query,withTransaction} from "@/lib/server/db";
import {verifyPassword} from "@/lib/server/password";
import {createSession,endDemoSession} from "@/lib/server/session";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {decryptSecret} from "@/lib/server/crypto";
import {hashRecoveryCode,verifyTotp} from "@/lib/server/totp";
import {consumeEmailCode,issueEmailCode} from "@/lib/server/email-otp";
import {mailLayout,sendMail} from "@/lib/server/email";
import {domainConfig} from "@/config/domain";
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
  const mfaCode=body.mfaCode!=null?stringField(body,"mfaCode",{max:64,min:4}):"";
  const emailCode=body.emailCode!=null?stringField(body,"emailCode",{max:6,min:6}):"";
  const result=await query<{
   id:string;organization_id:string;name:string;email:string;password_hash:string|null;
   role:"owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader";
   language:string;mfa_enabled:boolean;mfa_secret_enc:string|null;recovery_code_hashes:string[];email_verified_at:Date|null
  }>(`
   select u.id,m.organization_id,u.display_name as name,u.email,u.password_hash,m.role,
          u.language,u.mfa_enabled,u.mfa_secret_enc,u.recovery_code_hashes,u.email_verified_at
     from app_users u
     join organization_memberships m on m.user_id=u.id and m.status='active'
     join organizations o on o.id=m.organization_id and o.status in ('trial','active','grace_period','read_only')
    where lower(u.email)=lower($1) and u.status='active'
    order by m.created_at asc limit 1`,[email]);
  const user=result.rows[0];
  if(!user?.password_hash||!(await verifyPassword(password,user.password_hash)))return json({error:"invalid_credentials",message:"E-Mail oder Passwort ist falsch."},401);

  let verifiedEmailNow=false;
  if(!user.email_verified_at){
    if(!emailCode){
      const delivered=await sendRegistrationVerification({email:user.email,userId:user.id,organizationId:user.organization_id,locale:registrationLocale(user.language)});
      if(!delivered)throw new ApiError(503,"mail_unavailable","Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte später erneut versuchen.");
      return json({requiresEmailVerification:true,verificationCodeSent:true},202);
    }
    if(!await consumeEmailCode({email:user.email,purpose:"verify_email",code:emailCode}))return json({error:"invalid_code",message:"Der Bestätigungscode ist ungültig oder abgelaufen.",requiresEmailVerification:true},401);
    if(!await withTransaction(client=>completeRegistrationVerification(client,user.id,user.email,user.organization_id)))return json({error:"invalid_credentials"},401);
    verifiedEmailNow=true;
  }

  if(user.mfa_enabled){
   if(!mfaCode)return json({mfaRequired:true,mfaMethod:"totp"},202);
   let ok=false;
   if(/^\d{6}$/.test(mfaCode)&&user.mfa_secret_enc)ok=verifyTotp(decryptSecret(user.mfa_secret_enc),mfaCode);
   else{
    const target=hashRecoveryCode(mfaCode);const codes=Array.isArray(user.recovery_code_hashes)?user.recovery_code_hashes:[];const idx=codes.indexOf(target);
    if(idx>=0){ok=true;await query(`update app_users set recovery_code_hashes=$1::jsonb,updated_at=now() where id=$2`,[JSON.stringify(codes.filter((_,i)=>i!==idx)),user.id])}
   }
   if(!ok)return json({error:"invalid_mfa",message:"Der MFA-Code ist ungültig.",mfaRequired:true,mfaMethod:"totp"},401);
  }else{
    if(verifiedEmailNow||!emailCode){
      const code=await issueEmailCode({email:user.email,purpose:"login",userId:user.id,organizationId:user.organization_id});
      const delivery=await sendMail({to:user.email,subject:"Binso One Anmeldecode",text:`Dein Anmeldecode lautet: ${code}.`,html:mailLayout("Anmeldung bestätigen",`<p>Verwende diesen Code, um deine Anmeldung bei Binso One abzuschliessen:</p><div style="font-size:32px;font-weight:800;letter-spacing:.18em;margin:24px 0">${code}</div><p>Der Code ist ${domainConfig.emailCodeMinutes} Minuten gültig. Wenn du dich nicht angemeldet hast, kannst du diese E-Mail ignorieren.</p>`)});
      if(!delivery.delivered)throw new ApiError(503,"mail_unavailable","Der Anmeldecode konnte nicht versendet werden. Bitte später erneut versuchen.");
      return json({mfaRequired:true,mfaMethod:"email",codeSent:true},202);
    }
    if(!await consumeEmailCode({email:user.email,purpose:"login",code:emailCode}))return json({error:"invalid_email_code",message:"Der Anmeldecode ist ungültig oder abgelaufen.",mfaRequired:true,mfaMethod:"email"},401);
  }

  await query("update app_users set last_login_at=now(),updated_at=now() where id=$1",[user.id]);
  await query("update platform_tenants set last_active_at=now() where organization_id=$1",[user.organization_id]);
  await endDemoSession();
  await createSession({userId:user.id,organizationId:user.organization_id,email:user.email,name:user.name,role:user.role});
  return json({ok:true,emailVerified:true,...await registrationHandoff(user.organization_id,user.role,user.mfa_enabled)});
 }catch(error){return apiError(error)}
}
