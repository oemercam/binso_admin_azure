import {NextRequest} from "next/server";
import {generateTotpSecret} from "@/lib/server/totp";
import {encryptSecret} from "@/lib/server/crypto";
import {getSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await enforceRateLimit(request,"mfa-setup",5,15*60_000);
    const session=await getSession();
    if(!session||session.isDemo)return json({error:"unauthorized",message:"Anmeldung erforderlich."},401);
    const secret=generateTotpSecret();
    const expiresAt=new Date(Date.now()+15*60_000);
    await query("update app_users set mfa_pending_secret_enc=$1,mfa_pending_expires_at=$2,updated_at=now() where id=$3",[encryptSecret(secret),expiresAt,session.userId]);
    const label=encodeURIComponent(`Binso One:${session.email}`);
    const issuer=encodeURIComponent("Binso One");
    const otpAuthUri=`otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
    return json({secret,otpAuthUri,expiresInMinutes:15});
  }catch(error){return apiError(error);}
}
