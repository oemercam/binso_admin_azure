import "server-only";
import type {PoolClient} from "pg";
import {createHash} from "node:crypto";
import {cookies} from "next/headers";
import {query,withTransaction} from "./db";
import {env} from "./env";
import {ApiError} from "./http";
import {createAuthToken} from "./auth-tokens";
import {issueEmailCode} from "./email-otp";
import {mailLayout,sendMail} from "./email";
import {registrationText,type MailLocale} from "./mail-i18n";
import {billingCycles,domainConfig,planIds,type BillingCycle,type PlanId} from "@/config/domain";
import {tenantCan,type TenantRole} from "@/lib/permissions";
import {legalConfig} from "@/config/legal";
import {plans} from "@/lib/plans";

export const registrationCookie="binso_registration";
export function registrationContext(plan:unknown,billing:unknown){
 if(plan!=null&&!planIds.includes(plan as PlanId))throw new ApiError(400,"invalid_plan","Ungültiger Tarif.");
 if(billing!=null&&!billingCycles.includes(billing as BillingCycle))throw new ApiError(400,"invalid_billing","Ungültiges Abrechnungsintervall.");
 const selected=plan==null?null:plans.find(item=>item.id===plan)!;
 return {plan:selected?{id:selected.id,name:selected.name,monthly:selected.monthly,yearly:selected.yearly}:null,billingCycle:(billing??"monthly") as BillingCycle,trialDays:domainConfig.trialDays,termsVersion:legalConfig.termsVersion,privacyVersion:legalConfig.privacyVersion,dpaVersion:legalConfig.dpaVersion};
}

/** An opaque, HttpOnly receipt restores pending setup; it never creates an auth session. */
export async function pendingRegistration(){
 const token=(await cookies()).get(registrationCookie)?.value;
 if(!token||!env.databaseUrl)return null;
 const hash=createHash("sha256").update(token).digest("hex");
 const context=(await query<{user_id:string;organization_id:string}>("select user_id,organization_id from auth_tokens where token_hash=$1 and token_type='verify_email' and metadata->>'registration'='true' and expires_at>now() limit 1",[hash])).rows[0];
 if(!context)return null;
 const result=await withTransaction(async client=>{
  await client.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[context.organization_id,context.user_id]);
  return client.query<{userId:string;organizationId:string;company:string;email:string;verified:boolean;locale:MailLocale;plan:string;billingCycle:BillingCycle}>(
  `select u.id as "userId",o.id as "organizationId",o.name as company,u.email,u.email_verified_at is not null as verified,u.language as locale,s.plan,s.billing_interval as "billingCycle"
   from auth_tokens t join app_users u on u.id=t.user_id and u.status='active'
   join organization_memberships m on m.user_id=u.id and m.organization_id=t.organization_id and m.status='active'
   join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=o.id
   where t.token_hash=$1 and t.token_type='verify_email' and t.metadata->>'registration'='true' and t.expires_at>now() limit 1`,[hash]);
 });
 return result.rows[0]??null;
}

export async function sendRegistrationVerification(input:{email:string;userId:string;organizationId:string;locale:MailLocale;remember?:boolean}){
 const code=await issueEmailCode({...input,purpose:"verify_email"});
 const token=await createAuthToken({type:"verify_email",email:input.email,userId:input.userId,organizationId:input.organizationId,ttlMinutes:domainConfig.emailVerificationMinutes,metadata:{registration:true,locale:input.locale}});
 const url=new URL("/email-bestaetigen",env.appUrl);url.searchParams.set("token",token);url.searchParams.set("lang",input.locale);
 if(input.remember)(await cookies()).set(registrationCookie,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:domainConfig.emailVerificationMinutes*60});
 const t=(key:Parameters<typeof registrationText>[0],values:Record<string,string|number>={})=>registrationText(key,input.locale,values);
 const text=t("mailCode",{code,minutes:domainConfig.emailCodeMinutes});
 const linkText=t("mailLink",{hours:domainConfig.emailVerificationMinutes/60});
 try{
  if(env.appMode==="production"&&(url.protocol!=="https:"||["localhost","127.0.0.1"].includes(url.hostname)))return false;
  const result=await sendMail({to:input.email,subject:t("mailSubject"),text:`${text}\n${url.href}\n${linkText}`,html:mailLayout(t("verification"),`<p>${text}</p><p>${linkText}</p>`,{label:t("verify"),url:url.href},input.locale)});
  return result.delivered;
 }catch{return false;}
}

/** Existing MFA enrollment remains the first privileged step; company setup follows it. */
export async function registrationHandoff(organizationId:string,role:TenantRole,mfaEnabled=false){
 const result=await withTransaction(async client=>{
  await client.query("select set_config('app.organization_id',$1,true)",[organizationId]);
  return client.query<{complete:boolean}>("select exists(select 1 from organization_milestones where organization_id=$1 and milestone='onboarding_completed') as complete",[organizationId]);
 });
 const onboardingComplete=result.rows[0]?.complete===true;
 const next=onboardingComplete||!tenantCan(role,"organization:write")?"/dashboard":"/einstellungen/firma?onboarding=1";
 const mfaSetupRequired=["owner","admin","finance"].includes(role)&&!mfaEnabled;
 return {onboardingComplete,mfaSetupRequired,next:mfaSetupRequired?`/einstellungen/sicherheit?setup=1&next=${encodeURIComponent(next)}`:next};
}

export type VerifiedMember={organization_id:string;role:TenantRole;name:string;email_verified_at:Date|null;mfa_enabled:boolean;password_hash:string|null;mfa_secret_enc:string|null};
export async function completeRegistrationVerification(client:PoolClient,userId:string,email:string,organizationId?:string|null){
 await client.query("select set_config('app.user_id',$1,true)",[userId]);
 const membership=await client.query<VerifiedMember>(
  `select m.organization_id,m.role,u.display_name as name,u.email_verified_at,u.mfa_enabled,u.password_hash,u.mfa_secret_enc from app_users u
   join organization_memberships m on m.user_id=u.id and m.status='active'
   join organizations o on o.id=m.organization_id and o.status in ('trial','active','grace_period','read_only')
   where u.id=$1 and u.status='active' and lower(u.email)=lower($2) and ($3::uuid is null or m.organization_id=$3::uuid)
   and (select count(*) from organization_memberships all_m where all_m.user_id=u.id and all_m.status='active')=1
   order by m.created_at asc limit 1 for update of u`,[userId,email,organizationId??null]);
 const row=membership.rows[0];
 if(!row)return null;
 await client.query("select set_config('app.organization_id',$1,true)",[row.organization_id]);
 await client.query("update app_users set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where id=$1",[userId]);
 if(!row.email_verified_at&&row.role==='owner')await client.query("update organization_subscriptions set trial_until=coalesce(trial_until,now()+($2||' hours')::interval),updated_at=now() where organization_id=$1 and status='trial'",[row.organization_id,String(domainConfig.trialDays*24)]);
 await client.query("update auth_email_codes set consumed_at=coalesce(consumed_at,now()) where user_id=$1 and purpose='verify_email'",[userId]);
 return row;
}

