import {NextRequest} from "next/server";
import {query} from "@/lib/server/db";
import {verifyPassword} from "@/lib/server/password";
import {createOperatorSession} from "@/lib/server/operator/session";
import {platformAudit} from "@/lib/server/operator/audit";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import type {OperatorRole} from "@/lib/permissions";
import {decryptSecret} from "@/lib/server/crypto";
import {hashRecoveryCode,verifyTotp} from "@/lib/server/totp";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,"operator-login",8,15*60_000);
 const body=asObject(await readJson(request,16_000));const email=emailField(body);const password=stringField(body,"password",{max:256,min:1});const mfaCode=body.mfaCode!=null?stringField(body,"mfaCode",{max:64,min:4}):"";
 const result=await query<{user_id:string;display_name:string|null;email:string;password_hash:string|null;role:OperatorRole;mfa_enabled:boolean;mfa_secret_enc:string|null;recovery_code_hashes:string[]}>(`select user_id,display_name,email,password_hash,role,mfa_enabled,mfa_secret_enc,recovery_code_hashes from platform_operator_assignments where lower(email)=lower($1) and status='active' limit 1`,[email]);
 const user=result.rows[0];if(!user||!user.password_hash||!(await verifyPassword(password,user.password_hash)))return json({error:"E-Mail oder Passwort ist falsch."},401);
 if(user.mfa_enabled){if(!mfaCode)return json({mfaRequired:true},202);let ok=false;if(/^\d{6}$/.test(mfaCode)&&user.mfa_secret_enc)ok=verifyTotp(decryptSecret(user.mfa_secret_enc),mfaCode);else{const target=hashRecoveryCode(mfaCode);const codes=Array.isArray(user.recovery_code_hashes)?user.recovery_code_hashes:[];const idx=codes.indexOf(target);if(idx>=0){ok=true;await query(`update platform_operator_assignments set recovery_code_hashes=$1::jsonb where user_id=$2`,[JSON.stringify(codes.filter((_,i)=>i!==idx)),user.user_id])}}if(!ok)return json({error:"Der MFA-Code ist ungültig.",mfaRequired:true},401)}
 const name=user.display_name||user.email;await query(`update platform_operator_assignments set last_login_at=now(),updated_at=now() where user_id=$1`,[user.user_id]);await createOperatorSession({userId:user.user_id,email:user.email,name,role:user.role});await platformAudit({userId:user.user_id,userEmail:user.email,action:"operator.login",entityType:"platform_operator",entityId:user.user_id});return json({ok:true});
}catch(e){return apiError(e,request)}}
