import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {hashPassword} from "@/lib/server/password";
import {endDemoSession} from "@/lib/server/session";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {emailField,enumField,stringField,asObject} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {issueEmailCode} from "@/lib/server/email-otp";
import {mailLayout,sendMail} from "@/lib/server/email";
import {billingCycles,domainConfig,planIds} from "@/config/domain";
import {mailText,type MailLocale} from "@/lib/server/mail-i18n";
import {provisionOrganization} from "@/lib/server/provisioning";
import {query} from "@/lib/server/db";
import {legalConfig} from "@/config/legal";

export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"register",5,15*60_000);
  const body=asObject(await readJson(request,32_000));
  const name=stringField(body,"name",{max:120,min:2});
  const company=stringField(body,"company",{max:180,min:2});
  const email=emailField(body);
  const password=stringField(body,"password",{max:256,min:12});
  const plan=enumField(body,"plan",planIds);
  const billingCycle=enumField(body,"billingCycle",billingCycles);
  const locale=(typeof body.locale==="string"&&["de","en","fr","it","tr"].includes(body.locale)?body.locale:"de") as MailLocale;
  const profileLanguage=locale==="de"?"de-CH":locale;
  if(body.acceptedTerms!==true)throw new Error("AGB und Datenschutz müssen akzeptiert werden.");
  const termsVersion=stringField(body,"termsVersion",{max:40});
  const privacyVersion=stringField(body,"privacyVersion",{max:40});
  if(termsVersion!==legalConfig.termsVersion||privacyVersion!==legalConfig.privacyVersion)throw new Error("Bitte lade die Registrierungsseite neu und bestätige die aktuelle Fassung der Bedingungen.");
  const exists=await query("select 1 from app_users where lower(email)=lower($1) limit 1",[email]);
  if(exists.rowCount)throw new Error("Für diese E-Mail besteht bereits ein Konto.");
  const userId=randomUUID();
  const provisioned=await provisionOrganization({userId,email,name,companyName:company,plan,billingCycle,mode:"trial",passwordHash:await hashPassword(password),language:profileLanguage,termsVersion,privacyVersion});
  const code=await issueEmailCode({email,purpose:"verify_email",userId,organizationId:provisioned.organizationId});
  let emailSent=true;
  try{
    await sendMail({
      to:email,
      subject:mailText("E-Mail für Binso One bestätigen",locale),
      text:`Dein Binso One Bestätigungscode lautet: ${code}. Er ist ${domainConfig.emailCodeMinutes} Minuten gültig.`,
      html:mailLayout(mailText("E-Mail-Adresse bestätigen",locale),`<p>${mailText("Bestätige deine geschäftliche E-Mail-Adresse, damit dein Binso-One-Konto vollständig aktiviert ist.",locale)}</p><div style="font-size:32px;font-weight:800;letter-spacing:.18em;margin:24px 0">${code}</div><p>Der Code ist ${domainConfig.emailCodeMinutes} Minuten gültig.</p>`)
    });
  }catch{emailSent=false}
  await endDemoSession();
  return json({ok:true,organizationId:provisioned.organizationId,onboardingComplete:false,requiresEmailVerification:true,emailSent,verificationMethod:"code"},201);
 }catch(error){return apiError(error)}
}
