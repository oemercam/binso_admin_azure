import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { query } from "@/lib/server/db";
import { createAuthToken } from "@/lib/server/auth-tokens";
import { sendMail, mailLayout } from "@/lib/server/email";
import { env } from "@/lib/server/env";
import { domainConfig } from "@/config/domain";

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const body=await readJson<{email?:unknown}>(request,8192);const email=cleanText(body.email,320).toLowerCase();
  await enforceRateLimit(request,"password-recovery",5,60*60_000);
  if(!validEmail(email))return json({ok:true,deliveryUnconfirmed:true,message:"Die Anfrage wurde entgegengenommen. Bitte Posteingang prüfen oder später erneut versuchen."});
  const user=(await query<{id:string}>(`select id from app_users where lower(email)=lower($1) and status='active' limit 1`,[email])).rows[0];
  if(user){
   const token=await createAuthToken({type:"password_reset",email,userId:user.id,ttlMinutes:domainConfig.passwordResetMinutes});
   const url=`${env.appUrl}/passwort-zuruecksetzen?token=${encodeURIComponent(token)}`;
   await sendMail({to:email,subject:"Passwort für Binso One zurücksetzen",text:`Passwort zurücksetzen: ${url}`,html:mailLayout("Passwort zurücksetzen","<p>Über den folgenden Link kannst du ein neues Passwort für dein Binso One Konto festlegen.</p>",{label:"Passwort zurücksetzen",url})}).catch(()=>undefined);
  }
  return json({ok:true,deliveryUnconfirmed:true,message:"Die Anfrage wurde entgegengenommen. Bitte Posteingang prüfen oder später erneut versuchen."});
 }catch(error){return apiError(error);}
}
