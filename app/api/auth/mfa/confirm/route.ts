import {audit} from "@/lib/server/audit";
import {NextRequest} from "next/server";
import {decryptSecret} from "@/lib/server/crypto";
import {generateRecoveryCodes,hashRecoveryCode,verifyTotp} from "@/lib/server/totp";
import {getSession} from "@/lib/server/session";
import {withTransaction} from "@/lib/server/db";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await enforceRateLimit(request,"mfa-confirm",10,15*60_000);
    const session=await getSession();
    if(!session||session.isDemo)return json({error:"unauthorized",message:"Anmeldung erforderlich."},401);
    const body=asObject(await readJson(request,8192));
    const code=stringField(body,"code",{min:6,max:6});
    const recoveryCodes=await withTransaction(async client=>{
      const user=await client.query<{mfa_enabled:boolean;status:string;mfa_pending_secret_enc:string|null;mfa_pending_expires_at:Date|null}>("select mfa_enabled,status,mfa_pending_secret_enc,mfa_pending_expires_at from app_users where id=$1 for update",[session.userId]);
      const pending=user.rows[0];
      if(pending?.mfa_enabled)throw new ApiError(409,"mfa_already_enabled","Der Authenticator ist bereits eingerichtet.");
      if(pending?.status!=="active"||!pending.mfa_pending_secret_enc||!pending.mfa_pending_expires_at||pending.mfa_pending_expires_at.getTime()<=Date.now())throw new ApiError(400,"setup_expired","Die MFA-Einrichtung ist abgelaufen. Bitte starte sie erneut.");
      if(!verifyTotp(decryptSecret(pending.mfa_pending_secret_enc),code))throw new ApiError(400,"invalid_code","Der Authenticator-Code ist ungültig.");
      const codes=generateRecoveryCodes();
      await client.query(`update app_users set mfa_enabled=true,mfa_secret_enc=$1,recovery_code_hashes=$2::jsonb,mfa_pending_secret_enc=null,mfa_pending_expires_at=null,updated_at=now() where id=$3`,[pending.mfa_pending_secret_enc,JSON.stringify(codes.map(hashRecoveryCode)),session.userId]);
      await client.query("delete from auth_sessions where user_id=$1 and id<>$2",[session.userId,session.sessionId]);
      await client.query("select set_config('app.organization_id',$1,true)",[session.organizationId]);
      await audit(client,{organizationId:session.organizationId,userId:session.userId,action:"auth.mfa_enrolled",entityType:"app_users",entityId:session.userId});
      return codes;
    });
    return json({ok:true,recoveryCodes});
  }catch(error){return apiError(error);}
}
