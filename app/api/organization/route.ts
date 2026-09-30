import { NextRequest } from "next/server";
import { withTenant } from "@/lib/server/db";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject, stringField } from "@/lib/server/validation";
import { audit } from "@/lib/server/audit";
export const runtime="nodejs";

function splitZipCity(value:string){
 const normalized=value.trim();
 if(!normalized)return {zip:"",city:""};
 const match=normalized.match(/^(\d{4,5})\s+(.+)$/);
 return match?{zip:match[1],city:match[2].trim()}:{zip:"",city:normalized};
}

export async function GET(){
 try{
  const s=await requireSession();authorize(s,"organization:read");
  return await withTenant(s.organizationId,s.userId,async client=>{
   const result=await client.query(`
    select o.id,o.name,
           p.uid,p.address,trim(concat_ws(' ',nullif(p.zip,''),nullif(p.city,''))) as "zipCity",p.phone,
           p.industry,p.employee_range as employees,coalesce(p.settings,'{}'::jsonb) as settings,
           sub.plan,sub.billing_interval as "billingCycle",sub.billing_interval as billing_cycle,
           sub.status as "subscriptionStatus",sub.status as subscription_status,
           sub.trial_until as "trialEndsAt",sub.trial_until as trial_ends_at,
           sub.current_period_end as subscription_current_period_end,
           sub.cancel_at_period_end,
           exists(select 1 from organization_milestones m where m.organization_id=o.id and m.milestone='onboarding_completed') as "onboardingComplete"
      from organizations o
      left join company_profile p on p.organization_id=o.id
      left join organization_subscriptions sub on sub.organization_id=o.id
     where o.id=$1
     limit 1`,[s.organizationId]);
   return json({organization:result.rows[0]});
  });
 }catch(e){return apiError(e)}
}

export async function PATCH(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"organization:write");const body=asObject(await readJson(request,32_000));
  const name=stringField(body,"name",{max:180,min:2});
  const uid=stringField(body,"uid",{required:false,max:80});
  const address=stringField(body,"address",{required:false,max:240});
  const zipCity=stringField(body,"zipCity",{required:false,max:120});
  const phone=stringField(body,"phone",{required:false,max:80});
  const industry=stringField(body,"industry",{required:false,max:120});
  const employees=stringField(body,"employees",{required:false,max:50});
  const settings=body.settings&&typeof body.settings==="object"&&!Array.isArray(body.settings)?body.settings as Record<string,unknown>:undefined;
  const location=splitZipCity(zipCity||"");
  await withTenant(s.organizationId,s.userId,async client=>{
    await client.query(`update organizations set name=$1,updated_at=now() where id=$2`,[name,s.organizationId]);
    await client.query(`
      insert into company_profile(organization_id,name,address,zip,city,country,email,phone,uid,iban,bank_name,website,industry,employee_range,settings,updated_at)
      values($1,$2,$3,$4,$5,'Schweiz','',$6,$7,'','','',$8,$9,coalesce($10::jsonb,'{}'::jsonb),now())
      on conflict(organization_id) do update set
        name=excluded.name,address=excluded.address,zip=excluded.zip,city=excluded.city,phone=excluded.phone,uid=excluded.uid,
        industry=excluded.industry,employee_range=excluded.employee_range,
        settings=case when $10::jsonb is null then company_profile.settings else $10::jsonb end,
        updated_at=now()`,
      [s.organizationId,name,address||"",location.zip,location.city,phone||null,uid||null,industry||null,employees||null,settings?JSON.stringify(settings):null]);
    await client.query(`insert into organization_milestones(organization_id,milestone,source) values($1,'onboarding_completed','self_service') on conflict do nothing`,[s.organizationId]);
    await audit(client,{organizationId:s.organizationId,userId:s.userId,action:"organization.updated",entityType:"organization",entityId:s.organizationId});
  });
  return json({ok:true});
 }catch(e){return apiError(e,request)}
}
