import {NextRequest} from "next/server";
import {decryptSecret} from "@/lib/server/crypto";
import {generateRecoveryCodes,hashRecoveryCode,verifyTotp} from "@/lib/server/totp";
import {getSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
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
    const user=await query<{mfa_pending_secret_enc:string|null;mfa_pending_expires_at:Date|null}>("select mfa_pending_secret_enc,mfa_pending_expires_at from app_users where id=$1 limit 1",[session.userId]);
    const pending=user.rows[0];
    if(!pending?.mfa_pending_secret_enc||!pending.mfa_pending_expires_at||pending.mfa_pending_expires_at.getTime()<=Date.now())return json({error:"setup_expired",message:"Die MFA-Einrichtung ist abgelaufen. Bitte starte sie erneut."},400);
    const secret=decryptSecret(pending.mfa_pending_secret_enc);
    if(!verifyTotp(secret,code))return json({error:"invalid_code",message:"Der Authenticator-Code ist ungültig."},400);
    const recoveryCodes=generateRecoveryCodes();
    await query(`update app_users set mfa_enabled=true,mfa_secret_enc=mfa_pending_secret_enc,recovery_code_hashes=$1::jsonb,mfa_pending_secret_enc=null,mfa_pending_expires_at=null,updated_at=now() where id=$2`,[JSON.stringify(recoveryCodes.map(hashRecoveryCode)),session.userId]);
    return json({ok:true,recoveryCodes});
  }catch(error){return apiError(error);}
}
