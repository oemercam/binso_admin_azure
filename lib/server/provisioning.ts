import "server-only";
import {withTransaction} from "@/lib/server/db";
import {type BillingCycle,type PlanId} from "@/config/domain";
import {subscriptionEntitlements} from '@/lib/subscription-plans';
import {plans} from "@/lib/plans";

export type CanonicalPlan="starter"|"business"|"professional";
export function toCanonicalPlan(plan:PlanId):CanonicalPlan{
 if(plan==="start")return "starter";
 if(plan==="pro")return "professional";
 return "business";
}

function planDefinition(plan:PlanId){
 const definition=plans.find(item=>item.id===plan);
 if(!definition)throw new Error(`Unknown plan: ${plan}`);
 return definition;
}


export async function provisionOrganization(input:{
 userId:string;email:string;name:string;companyName:string;plan:PlanId;billingCycle?:BillingCycle;mode:"trial"|"subscription";
 firstName?:string;lastName?:string;passwordHash?:string|null;language?:"de"|"en"|"fr"|"it"|"tr";termsVersion?:string|null;privacyVersion?:string|null;dpaVersion?:string|null;
}){
 if(input.mode!=="trial"&&input.mode!=="subscription")throw new Error("Demo-Provisionierung wurde entfernt.");
 return withTransaction(async client=>{
   const email=input.email.trim().toLowerCase();
   const displayName=input.name.trim();
   const companyName=input.companyName.trim();
   const slug=(companyName||"organisation").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,160).replace(/-+$/g,"")||"organisation";
   const canonicalPlan=toCanonicalPlan(input.plan);
   const planId:PlanId=input.plan;
   const definition=planDefinition(planId);
   const billingCycle:BillingCycle=input.billingCycle??"monthly";
   const selectedAmount=billingCycle==="yearly"?definition.yearly:definition.monthly;
   const limits=subscriptionEntitlements(planId);
   const expiresAt=null;

   const existing=await client.query<{id:string}>("select id from app_users where lower(email)=lower($1) limit 1",[email]);
   if(existing.rowCount&&existing.rows[0].id!==input.userId)throw new Error("Für diese E-Mail besteht bereits ein Konto.");
   await client.query(
     `insert into app_users(id,email,display_name,status,password_hash,language,email_verified_at,terms_version,terms_accepted_at,privacy_version,last_login_at,updated_at)
      values($1,$2,$3,'active',$4,$5,$6,$7,case when $7::text is null then null else now() end,$8,now(),now())
      on conflict(id) do update set email=excluded.email,display_name=excluded.display_name,password_hash=coalesce(excluded.password_hash,app_users.password_hash),language=excluded.language,updated_at=now()`,
     [input.userId,email,displayName,input.passwordHash??null,input.language??"de",null,input.termsVersion??null,input.privacyVersion??null]
   );
   // Structured names are explicit; never infer family names from a display name.
   if(input.firstName!==undefined&&input.lastName!==undefined)await client.query("update app_users set first_name=$1,last_name=$2 where id=$3",[input.firstName,input.lastName,input.userId]);
   const org=await client.query<{id:string}>(
     "select public.bootstrap_organization($1,$2,$3,$4,$5) as id",
     [input.userId,email,companyName,slug,input.mode]
   );
   const organizationId=org.rows[0].id;
   await client.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[organizationId,input.userId]);
   await client.query(
     `insert into organization_subscriptions(organization_id,plan,status,seats,trial_until,billing_provider,billing_interval,unit_amount_chf)
      values($1,$2,$3,$4,$5,'manual',$6,$7)`,
     [organizationId,canonicalPlan,input.mode==="subscription"?"active":"trial",limits.users,expiresAt,billingCycle,selectedAmount]
   );
   await client.query(
     `insert into organization_entitlements(organization_id,features,max_users,max_storage_mb,max_monthly_documents,max_api_requests_per_month)
      values($1,$2,$3,$4,$5,$6)`,
     [organizationId,limits.features,limits.users,limits.storageMb,limits.monthlyDocuments,limits.monthlyApiRequests]
   );
   await client.query(
     `insert into platform_tenants(organization_id,owner_name,owner_email,platform_status,seats,monthly_revenue_chf,storage_mb,last_active_at)
      values($1,$2,$3,$4,$5,$6,0,now())`,
     [organizationId,displayName,email,input.mode==="subscription"?"active":"trial",limits.users,input.mode==="subscription"?definition.monthly:0]
   );
   await client.query(
     `insert into company_profile(organization_id,name,address,zip,city,country,email,phone,uid,iban,bank_name,website)
      values($1,$2,'','','','Schweiz',$3,'','','','','')`,
     [organizationId,companyName,email]
   );
   await client.query(
     `insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
      values($1::uuid,$2,$3,$4,'organization',$1::text,$5)`,
     [organizationId,input.userId,displayName,"organization.created",JSON.stringify({mode:input.mode,plan:planId,billingCycle,termsVersion:input.termsVersion??null,privacyVersion:input.privacyVersion??null,dpaVersion:input.dpaVersion??null,contractAccepted:!!input.termsVersion,privacyNoticeAcknowledged:!!input.privacyVersion})]
   );
   return {organizationId,expiresAt,plan:planId};
 });
}
