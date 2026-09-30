import {NextRequest} from "next/server";
import {query} from "@/lib/server/db";
import {createAuthToken} from "@/lib/server/auth-tokens";
import {mailLayout,sendMail} from "@/lib/server/email";
import {env} from "@/lib/server/env";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {domainConfig} from "@/config/domain";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{
 assertSameOrigin(request);await enforceRateLimit(request,"password-reset",5,15*60_000);
 const b=asObject(await readJson(request,8_000));const email=emailField(b);
 const u=(await query<{id:string;organization_id:string}>(`
  select u.id,m.organization_id from app_users u
  join organization_memberships m on m.user_id=u.id and m.status='active'
  where lower(u.email)=lower($1) and u.status='active' order by m.created_at asc limit 1`,[email])).rows[0];
 if(u){const token=await createAuthToken({type:"password_reset",email,userId:u.id,organizationId:u.organization_id,ttlMinutes:domainConfig.passwordResetMinutes});const url=`${env.appUrl}/passwort-zuruecksetzen?token=${encodeURIComponent(token)}`;await sendMail({to:email,subject:"Binso One Passwort zurücksetzen",text:`Passwort zurücksetzen: ${url}`,html:mailLayout("Passwort zurücksetzen","<p>Über diesen Link kannst du ein neues Passwort setzen. Der Link ist 30 Minuten gültig.</p>",{label:"Passwort zurücksetzen",url})})}
 return json({ok:true,message:"Falls ein Konto existiert, wurde eine E-Mail versendet."});
}catch(e){return apiError(e,request)}}
