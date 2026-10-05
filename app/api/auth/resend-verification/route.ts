import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {createAuthToken} from "@/lib/server/auth-tokens";
import {mailLayout,sendMail} from "@/lib/server/email";
import {mailText,type MailLocale} from "@/lib/server/mail-i18n";
import {domainConfig} from "@/config/domain";
import {env} from "@/lib/server/env";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const session=await requireSession();
    await enforceRateLimit(request,"resend-email-verification",4,60*60_000);
    const user=await query<{email_verified_at:Date|null;language:string|null}>("select email_verified_at,language from app_users where id=$1 limit 1",[session.userId]);
    const row=user.rows[0];
    if(!row)return json({error:"not_found",message:"Konto nicht gefunden."},404);
    if(row.email_verified_at)return json({ok:true,alreadyVerified:true});
    const locale=(["de","en","fr","it","tr"].includes(row.language??"")?row.language:"de") as MailLocale;
    const token=await createAuthToken({type:"verify_email",email:session.email,userId:session.userId,organizationId:session.organizationId,ttlMinutes:domainConfig.emailVerificationMinutes});
    const url=`${env.appUrl}/email-bestaetigen?token=${encodeURIComponent(token)}`;
    await sendMail({to:session.email,subject:mailText("E-Mail für Binso One bestätigen",locale),text:`${mailText("Bitte bestätige deine E-Mail-Adresse:",locale)} ${url}`,html:mailLayout(mailText("E-Mail-Adresse bestätigen",locale),`<p>${mailText("Bestätige deine geschäftliche E-Mail-Adresse, damit dein Binso-One-Konto vollständig aktiviert ist.",locale)}</p><p>Der Link ist ${domainConfig.emailVerificationMinutes/60} Stunden gültig.</p>`,{label:mailText("E-Mail bestätigen",locale),url})});
    return json({ok:true});
  }catch(error){return apiError(error);}
}
