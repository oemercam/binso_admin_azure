import {NextRequest} from "next/server";
import {issueEmailCode} from "@/lib/server/email-otp";
import {mailLayout,sendMail} from "@/lib/server/email";
import {mailText,type MailLocale} from "@/lib/server/mail-i18n";
import {domainConfig} from "@/config/domain";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";
export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await enforceRateLimit(request,"resend-email-verification",4,60*60_000);
    const body=asObject(await readJson(request,8192));
    const email=emailField(body);
    const user=await query<{id:string;organization_id:string;language:string|null;email_verified_at:Date|null}>(
      `select u.id,m.organization_id,u.language,u.email_verified_at from app_users u
        join organization_memberships m on m.user_id=u.id and m.status='active'
        where lower(u.email)=lower($1) order by m.created_at asc limit 1`,[email]);
    const row=user.rows[0];
    if(!row||row.email_verified_at)return json({ok:true});
    const locale=(["de","en","fr","it","tr"].includes(row.language??"")?row.language:"de") as MailLocale;
    const code=await issueEmailCode({email,purpose:"verify_email",userId:row.id,organizationId:row.organization_id});
    await sendMail({to:email,subject:mailText("E-Mail für Binso One bestätigen",locale),text:`Dein Binso One Bestätigungscode lautet: ${code}. Er ist ${domainConfig.emailCodeMinutes} Minuten gültig.`,html:mailLayout(mailText("E-Mail-Adresse bestätigen",locale),`<p>Dein neuer Bestätigungscode:</p><div style="font-size:32px;font-weight:800;letter-spacing:.18em;margin:24px 0">${code}</div><p>Der Code ist ${domainConfig.emailCodeMinutes} Minuten gültig.</p>`)});
    return json({ok:true});
  }catch(error){return apiError(error);}
}
