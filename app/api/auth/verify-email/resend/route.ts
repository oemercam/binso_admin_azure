import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {createAuthToken} from "@/lib/server/auth-tokens";
import {mailLayout,sendMail} from "@/lib/server/email";
import {env} from "@/lib/server/env";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";
export const runtime="nodejs";
export async function POST(request:NextRequest){try{assertSameOrigin(request);await enforceRateLimit(request,"verify-email-resend",4,60*60_000);const s=await requireSession();const user=(await query<{email_verified_at:Date|null}>(`select email_verified_at from users where id=$1 and organization_id=$2`,[s.userId,s.organizationId])).rows[0];if(user?.email_verified_at)return json({ok:true,alreadyVerified:true});const token=await createAuthToken({type:"verify_email",email:s.email,userId:s.userId,organizationId:s.organizationId,ttlMinutes:1440});const url=`${env.appUrl}/email-bestaetigen?token=${encodeURIComponent(token)}`;const result=await sendMail({to:s.email,subject:"E-Mail für Binso One bestätigen",text:`Bitte bestätige deine E-Mail-Adresse: ${url}`,html:mailLayout("E-Mail-Adresse bestätigen","<p>Bestätige deine geschäftliche E-Mail-Adresse, damit dein Binso-One-Konto vollständig aktiviert ist.</p>",{label:"E-Mail bestätigen",url})});return json({ok:true,delivered:result.delivered})}catch(e){return apiError(e,request)}}
