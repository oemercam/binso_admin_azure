import { NextRequest } from "next/server";
import { query, withTenant } from "@/lib/server/db";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject, stringField } from "@/lib/server/validation";
import { audit } from "@/lib/server/audit";
export const runtime="nodejs";

export async function GET(){
 try{
  const s=await requireSession();authorize(s,"organization:read");
  const result=await query(`select id,name,uid,address,zip_city as "zipCity",phone,industry,employees,plan,billing_cycle as "billingCycle",billing_cycle,subscription_status as "subscriptionStatus",subscription_status,trial_ends_at as "trialEndsAt",trial_ends_at,subscription_current_period_end, cancel_at_period_end,onboarding_complete as "onboardingComplete",settings from organizations where id=$1`,[s.organizationId]);
  return json({organization:result.rows[0]});
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
  await withTenant(s.organizationId,s.userId,async client=>{
    await client.query(`update organizations set name=$1,uid=$2,address=$3,zip_city=$4,phone=$5,industry=$6,employees=$7,settings=coalesce($8::jsonb,settings),onboarding_complete=true,updated_at=now() where id=$9`,
      [name,uid||null,address||null,zipCity||null,phone||null,industry||null,employees||null,settings?JSON.stringify(settings):null,s.organizationId]);
    await audit(client,{organizationId:s.organizationId,userId:s.userId,action:"organization.updated",entityType:"organization",entityId:s.organizationId});
  });
  return json({ok:true});
 }catch(e){return apiError(e,request)}
}
