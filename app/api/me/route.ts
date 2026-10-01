import {NextRequest} from "next/server";
import {getSession,requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,enumField,stringField} from "@/lib/server/validation";
import {tenantPermissions} from "@/lib/permissions";
import {getOrganizationPlan} from "@/lib/server/plan-access";
import {planLimits} from "@/config/plan-access";

export const runtime="nodejs";
export async function GET(){
 const session=await getSession();if(!session)return json({authenticated:false},401);
 const plan=await getOrganizationPlan(session.organizationId);
 const [userResult,orgResult]=await Promise.all([
  query<{language:string;theme:string;email_verified_at:Date|null;mfa_enabled:boolean}>(`select language,theme,email_verified_at,mfa_enabled from app_users where id=$1`,[session.userId]),
  query<{onboarding_complete:boolean;subscription_status:string;trial_ends_at:Date|null;is_demo:boolean}>(`
   select (o.is_demo or exists(select 1 from organization_milestones om where om.organization_id=o.id and om.milestone='onboarding_completed')) as onboarding_complete,
          s.status as subscription_status,s.trial_until as trial_ends_at,o.is_demo
     from organizations o left join organization_subscriptions s on s.organization_id=o.id where o.id=$1`,[session.organizationId])
 ]);
 const user=userResult.rows[0];const org=orgResult.rows[0];
 return json({authenticated:true,user:{id:session.userId,name:session.name,email:session.email,role:session.role,language:user?.language||"de",theme:user?.theme||"system",emailVerified:Boolean(user?.email_verified_at),mfaEnabled:Boolean(user?.mfa_enabled)},organizationId:session.organizationId,onboardingComplete:Boolean(org?.onboarding_complete),subscriptionStatus:org?.subscription_status||"pending",trialEndsAt:org?.trial_ends_at||null,demo:Boolean(org?.is_demo),plan,limits:planLimits[plan],permissions:tenantPermissions(session.role)});
}
export async function PATCH(request:NextRequest){
 try{assertSameOrigin(request);const s=await requireSession();const body=asObject(await readJson(request,16_000));const name=body.name!=null?stringField(body,"name",{min:2,max:120}):s.name;const language=body.language!=null?enumField(body,"language",["de","en","fr","it","tr"] as const):undefined;const theme=body.theme!=null?enumField(body,"theme",["system","light","dark"] as const):undefined;const r=await query(`update app_users set display_name=$1,language=coalesce($2,language),theme=coalesce($3,theme),updated_at=now() where id=$4 returning id,display_name as name,email,language,theme`,[name,language||null,theme||null,s.userId]);return json({user:{...r.rows[0],role:s.role}})}catch(e){return apiError(e,request)}
}
