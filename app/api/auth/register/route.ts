import {NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {hashPassword} from "@/lib/server/password";
import {endDemoSession,getSession} from "@/lib/server/session";
import {ApiError,apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {emailField,stringField,asObject} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {registrationLocale} from "@/lib/server/mail-i18n";
import {provisionOrganization} from "@/lib/server/provisioning";
import {query} from "@/lib/server/db";
import {env} from "@/lib/server/env";
import {pendingRegistration,registrationContext,registrationHandoff,sendRegistrationVerification} from "@/lib/server/registration";

export const runtime="nodejs";
export async function GET(request:NextRequest){
 try{
  const context=registrationContext(request.nextUrl.searchParams.get("plan"),request.nextUrl.searchParams.get("billing"));
  const session=env.databaseUrl?await getSession():null;
  if(session&&!session.isDemo)return json({context,state:"authenticated",...await registrationHandoff(session.organizationId,session.role,session.mfaEnabled)});
  const pending=await pendingRegistration();
  return json({context,state:pending?(pending.verified?"verified":"pending"):"new",pending:pending?{company:pending.company,email:pending.email,locale:pending.locale,plan:pending.plan,billingCycle:pending.billingCycle}:null});
 }catch(error){return apiError(error);}
}
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"register",5,15*60_000);
  const body=asObject(await readJson(request,32_000));
  const company=stringField(body,"company",{max:180,min:2});
  const email=emailField(body);
  const password=stringField(body,"password",{max:256,min:12});
  const context=registrationContext(body.plan??null,body.billingCycle??null);
  const locale=registrationLocale(body.locale);
  if(body.acceptedTerms!==true||body.acceptedDpa!==true)throw new ApiError(400,"terms_required","Bitte die Vertragsbedingungen bestätigen.");
  if(body.termsVersion!==context.termsVersion||body.privacyVersion!==context.privacyVersion||body.dpaVersion!==context.dpaVersion)throw new ApiError(409,"legal_version_changed","Bitte die aktuellen Vertragsbedingungen erneut prüfen.");
  const pending=await pendingRegistration();
  if(pending&&!pending.verified&&pending.email===email&&pending.company===company)return json({ok:true,onboardingComplete:false,requiresEmailVerification:true,verificationMethod:"link_and_code",resumed:true},201);
  const exists=await query("select 1 from app_users where lower(email)=lower($1) limit 1",[email]);
  if(exists.rowCount)throw new ApiError(409,"registration_unavailable","Bitte die Anmeldung oder Passwort-Wiederherstellung verwenden, um sicher fortzufahren.");
  const userId=randomUUID();
  const provisioned=await provisionOrganization({userId,email,name:company,companyName:company,plan:context.plan?.id??"start",billingCycle:context.billingCycle,mode:"trial",passwordHash:await hashPassword(password),language:locale,termsVersion:context.termsVersion,privacyVersion:context.privacyVersion,dpaVersion:context.dpaVersion});
  const emailSent=await sendRegistrationVerification({email,userId,organizationId:provisioned.organizationId,locale,remember:true});
  await endDemoSession();
  return json({ok:true,onboardingComplete:false,requiresEmailVerification:true,emailSent,verificationMethod:"link_and_code"},201);
 }catch(error){
  if(error&&typeof error==='object'&&'code' in error&&error.code==='23505')return json({error:"registration_unavailable",message:"Bitte die Anmeldung oder Passwort-Wiederherstellung verwenden, um sicher fortzufahren."},409);
  return apiError(error);
 }
}
