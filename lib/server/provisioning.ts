import "server-only";
import {randomUUID} from "node:crypto";
import type {PoolClient} from "pg";
import {withTransaction} from "@/lib/server/db";
import {domainConfig,addDays,addHours,type PlanId} from "@/config/domain";
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

function planFeatures(plan:PlanId){
 const common=["crm","quotes","orders","time","invoices","expenses"];
 if(plan==="start")return common;
 const business=[...common,"finance","employees","accounting","projects","suppliers","documents"];
 if(plan==="business")return business;
 return [...business,"contracts","payroll","audit","exports","api","automations"];
}
function planMaxUsers(plan:PlanId){return plan==="start"?3:plan==="business"?15:10000}
function planMaxStorage(plan:PlanId){return plan==="start"?1024:plan==="business"?5120:20480}

async function uniqueSlug(client:PoolClient,name:string){
 const base=(name||"organisation").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"organisation";
 for(let i=0;i<50;i++){
   const candidate=i===0?base:`${base}-${i+1}`;
   const exists=await client.query("select 1 from organizations where slug=$1 limit 1",[candidate]);
   if(!exists.rowCount)return candidate;
 }
 return `${base}-${randomUUID().slice(0,8)}`;
}

async function seedDemo(client:PoolClient,organizationId:string,userId:string){
 const customer1=randomUUID(),customer2=randomUUID();
 const projectId=randomUUID(),quoteId=randomUUID(),orderId=randomUUID(),invoiceId=randomUUID();
 await client.query(
  `insert into customers(id,organization_id,external_id,customer_no,name,legal_name,contact_name,email,city,country,payment_days,status,created_at,updated_at)
   values
   ($1,$3,'demo-customer-1','K-DEMO-001','Alpina Architektur AG','Alpina Architektur AG','Anna Muster','kontakt@alpina-demo.ch','Zürich','Schweiz',30,'active',now(),now()),
   ($2,$3,'demo-customer-2','K-DEMO-002','Bergwerk Digital AG','Bergwerk Digital AG','Luca Beispiel','kontakt@bergwerk-demo.ch','Bern','Schweiz',30,'active',now(),now())`,
  [customer1,customer2,organizationId]
 );
 await client.query(
  `insert into projects(id,organization_id,external_id,customer_id,name,budget,hours_budget,progress,start_date,status,notes,created_by_user_id)
   values($1,$2,'demo-project-1',$3,'Website Relaunch',32000,180,65,current_date,'in_progress','Isoliertes Demo-Projekt',$4)`,
  [projectId,organizationId,customer2,userId]
 );
 await client.query(
  `insert into quotes(id,organization_id,external_id,quote_no,customer_id,title,issue_date,valid_until,status,version,created_at,updated_at)
   values($1,$2,'demo-quote-1','OF-DEMO-1042',$3,'Digital Workplace Erweiterung',current_date,current_date+30,'sent',1,now(),now())`,
  [quoteId,organizationId,customer1]
 );
 await client.query(
  `insert into quote_lines(id,organization_id,external_id,quote_id,sort_order,description,quantity,unit,unit_price,vat_rate)
   values(gen_random_uuid(),$1,'demo-quote-line-1',$2,0,'Beratung und Umsetzung',64,'h',180,$3)`,
  [organizationId,quoteId,domainConfig.defaultVatRate]
 );
 await client.query(
  `insert into orders(id,organization_id,external_id,customer_id,project_id,name,budget_hours,sales_rate,cost_rate,billing_model,status,amount,created_by_user_id,created_at,updated_at)
   values($1,$2,'demo-order-1',$3,$4,'Digital Workplace Umsetzung',180,180,110,'time','active',28900,$5,now(),now())`,
  [orderId,organizationId,customer2,projectId,userId]
 );
 await client.query(
  `insert into invoices(id,organization_id,external_id,invoice_no,customer_id,order_id,period,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount,created_at,updated_at)
   values($1,$2,'demo-invoice-1','RE-DEMO-0318',$3,$4,to_char(current_date,'YYYY-MM'),current_date,current_date+30,'sent',7234.04,585.96,7820,0,now(),now())`,
  [invoiceId,organizationId,customer2,orderId]
 );
 await client.query(
  `insert into invoice_lines(id,organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate,source_time_external_ids,source_expense_external_ids)
   values(gen_random_uuid(),$1,'demo-invoice-line-1',$2,0,'Projektleistungen',40.1891,'h',180,$3,'{}','{}')`,
  [organizationId,invoiceId,domainConfig.defaultVatRate]
 );
}

export async function provisionOrganization(input:{
 userId:string;email:string;name:string;companyName:string;plan:PlanId;mode:"trial"|"demo"|"subscription";
 passwordHash?:string|null;language?:"de"|"en"|"fr"|"it"|"tr";termsVersion?:string|null;privacyVersion?:string|null;
}){
 return withTransaction(async client=>{
   const email=input.email.trim().toLowerCase();
   const displayName=input.name.trim();
   const companyName=input.mode==="demo"?"Binso Demo AG":input.companyName.trim();
   const slug=await uniqueSlug(client,companyName);
   const canonicalPlan=toCanonicalPlan(input.mode==="demo"?"business":input.plan);
   const planId:PlanId=input.mode==="demo"?"business":input.plan;
   const definition=planDefinition(planId);
   const expiresAt=input.mode==="demo"?addHours(new Date(),domainConfig.demoSessionHours):input.mode==="trial"?addDays(new Date(),domainConfig.trialDays):null;

   const existing=await client.query<{id:string}>("select id from app_users where lower(email)=lower($1) limit 1",[email]);
   if(existing.rowCount&&existing.rows[0].id!==input.userId)throw new Error("Für diese E-Mail besteht bereits ein Konto.");
   await client.query(
     `insert into app_users(id,email,display_name,status,password_hash,language,email_verified_at,terms_version,terms_accepted_at,privacy_version,last_login_at,updated_at)
      values($1,$2,$3,'active',$4,$5,$6,$7,case when $7::text is null then null else now() end,$8,now(),now())
      on conflict(id) do update set email=excluded.email,display_name=excluded.display_name,password_hash=coalesce(excluded.password_hash,app_users.password_hash),language=excluded.language,updated_at=now()`,
     [input.userId,email,displayName,input.passwordHash??null,input.language??"de",input.mode==="demo"?new Date():null,input.termsVersion??null,input.privacyVersion??null]
   );
   const org=await client.query<{id:string}>(
     `insert into organizations(name,slug,status,country,currency,locale,is_demo)
      values($1,$2,$3,'Schweiz','CHF','de-CH',$4) returning id`,
     [companyName,slug,input.mode==="subscription"?"active":"trial",input.mode==="demo"]
   );
   const organizationId=org.rows[0].id;
   await client.query("select set_config('app.organization_id',$1,true)",[organizationId]);
   await client.query("select set_config('app.user_id',$1,true)",[input.userId]);
   await client.query(
     `insert into organization_memberships(organization_id,user_id,email,role,role_id,status)
      values($1,$2,$3,'owner',(select id from organization_roles where organization_id=$1 and code='owner' limit 1),'active')`,
     [organizationId,input.userId,email]
   );
   await client.query(
     `insert into organization_subscriptions(organization_id,plan,status,seats,trial_until,billing_provider,billing_interval,unit_amount_chf)
      values($1,$2,$3,$4,$5,'manual','monthly',$6)`,
     [organizationId,canonicalPlan,input.mode==="subscription"?"active":"trial",planMaxUsers(planId),expiresAt,input.mode==="demo"?0:definition.monthly]
   );
   await client.query(
     `insert into organization_entitlements(organization_id,features,max_users,max_storage_mb,max_monthly_documents,max_api_requests_per_month)
      values($1,$2,$3,$4,$5,$6)`,
     [organizationId,planFeatures(planId),planMaxUsers(planId),planMaxStorage(planId),planId==="start"?100:planId==="business"?1000:10000,planId==="start"?10000:planId==="business"?100000:1000000]
   );
   await client.query(
     `insert into platform_tenants(organization_id,owner_name,owner_email,platform_status,seats,monthly_revenue_chf,storage_mb,last_active_at)
      values($1,$2,$3,$4,$5,$6,0,now())`,
     [organizationId,displayName,email,input.mode==="subscription"?"active":"trial",planMaxUsers(planId),input.mode==="demo"?0:definition.monthly]
   );
   await client.query(
     `insert into company_profile(organization_id,name,address,zip,city,country,email,phone,uid,iban,bank_name,website)
      values($1,$2,'','','','Schweiz',$3,'','','','','')`,
     [organizationId,companyName,email]
   );
   await client.query(
     `insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
      values($1,$2,$3,$4,'organization',$1::text,$5)`,
     [organizationId,input.userId,displayName,input.mode==="demo"?"organization.demo_created":"organization.created",JSON.stringify({mode:input.mode,plan:planId})]
   );
   if(input.mode==="demo"){
     await seedDemo(client,organizationId,input.userId);
     await client.query(`insert into organization_milestones(organization_id,milestone,source) values($1,'onboarding_completed','demo') on conflict do nothing`,[organizationId]);
   }
   return {organizationId,expiresAt,plan:planId};
 });
}
