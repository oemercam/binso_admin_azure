import "server-only";
import {randomUUID} from "node:crypto";
import {seedDatabaseDemo} from "./repositories/demo-fixture";
import type {PoolClient} from "pg";
import {withTransaction} from "@/lib/server/db";
import {domainConfig,addHours,type BillingCycle,type PlanId} from "@/config/domain";
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


async function uniqueSlug(client:PoolClient,name:string){
 const base=(name||"organisation").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"organisation";
 for(let i=0;i<50;i++){
   const candidate=i===0?base:`${base}-${i+1}`;
   const exists=await client.query("select 1 from organizations where slug=$1 limit 1",[candidate]);
   if(!exists.rowCount)return candidate;
 }
 return `${base}-${randomUUID().slice(0,8)}`;
}

export async function provisionOrganization(input:{
 userId:string;email:string;name:string;companyName:string;plan:PlanId;billingCycle?:BillingCycle;mode:"trial"|"demo"|"subscription";
 passwordHash?:string|null;language?:"de-CH"|"de"|"en"|"fr"|"it"|"tr";termsVersion?:string|null;privacyVersion?:string|null;
}){
 return withTransaction(async client=>{
   const email=input.email.trim().toLowerCase();
   const displayName=input.name.trim();
   const companyName=input.mode==="demo"?"Binso Demo AG":input.companyName.trim();
   const slug=await uniqueSlug(client,companyName);
   const canonicalPlan=toCanonicalPlan(input.mode==="demo"?"business":input.plan);
   const planId:PlanId=input.mode==="demo"?"business":input.plan;
   const definition=planDefinition(planId);
   const billingCycle:BillingCycle=input.mode==="demo"?"monthly":input.billingCycle??"monthly";
   const selectedAmount=billingCycle==="yearly"?definition.yearly:definition.monthly;
   const limits=subscriptionEntitlements(planId);
   const expiresAt=input.mode==="demo"?addHours(new Date(),domainConfig.demoSessionHours):null;

   const existing=await client.query<{id:string}>("select id from app_users where lower(email)=lower($1) limit 1",[email]);
   if(existing.rowCount&&existing.rows[0].id!==input.userId)throw new Error("Für diese E-Mail besteht bereits ein Konto.");
   await client.query(
     `insert into app_users(id,email,display_name,status,password_hash,language,email_verified_at,terms_version,terms_accepted_at,privacy_version,last_login_at,updated_at)
      values($1,$2,$3,'active',$4,$5,$6,$7,case when $7::text is null then null else now() end,$8,now(),now())
      on conflict(id) do update set email=excluded.email,display_name=excluded.display_name,password_hash=coalesce(excluded.password_hash,app_users.password_hash),language=excluded.language,updated_at=now()`,
     [input.userId,email,displayName,input.passwordHash??null,input.language??"de-CH",input.mode==="demo"?new Date():null,input.termsVersion??null,input.privacyVersion??null]
   );
   const org=await client.query<{id:string}>(
     `insert into organizations(name,slug,status,country,currency,locale,is_demo)
      values($1,$2,$3,'Schweiz','CHF','de-CH',$4) returning id`,
     [companyName,slug,input.mode==="subscription"?"active":"trial",input.mode==="demo"]
   );
   const organizationId=org.rows[0].id;
   await client.query(
     `insert into organization_memberships(organization_id,user_id,email,role,role_id,status)
      values($1,$2,$3,'owner',(select id from organization_roles where organization_id=$1 and code='owner' limit 1),'active')`,
     [organizationId,input.userId,email]
   );
   await client.query(
     `insert into organization_subscriptions(organization_id,plan,status,seats,trial_until,billing_provider,billing_interval,unit_amount_chf)
      values($1,$2,$3,$4,$5,'manual',$6,$7)`,
     [organizationId,canonicalPlan,input.mode==="subscription"?"active":"trial",limits.users,expiresAt,billingCycle,input.mode==="demo"?0:selectedAmount]
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
     [organizationId,input.userId,displayName,input.mode==="demo"?"organization.demo_created":"organization.created",JSON.stringify({mode:input.mode,plan:planId})]
   );
   if(input.mode==="demo"){
     await client.query("select set_config('app.organization_id',$1,true)",[organizationId]);
     await client.query("select set_config('app.user_id',$1,true)",[input.userId]);
     await seedDatabaseDemo(client,organizationId,input.userId);
     await client.query(`insert into organization_milestones(organization_id,milestone,source) values($1,'onboarding_completed','demo') on conflict do nothing`,[organizationId]);
   }
   return {organizationId,expiresAt,plan:planId};
 });
}
