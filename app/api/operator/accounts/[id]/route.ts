import { NextRequest } from "next/server";
import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { apiError, assertSameOrigin, cleanText, json, readJson, ApiError } from "@/lib/server/http";

import {withPlatform} from '@/lib/server/db';
import {platformAudit} from '@/lib/server/operator/audit';
import {updateOperatorBusiness} from '@/lib/server/repositories/operator-api';

type Body={plan?:unknown;subscriptionStatus?:unknown;accountStatus?:unknown;userLimit?:unknown};

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{const session=await requireOperatorSession();authorizeOperator(session,"subscriptions:manage");
    assertSameOrigin(request);
    const {id}=await params;
    const body=await readJson<Body>(request,8192);
    const patch:Record<string,unknown>={};
    const plan=cleanText(body.plan,40);
    const subscriptionStatus=cleanText(body.subscriptionStatus,40);
    const accountStatus=cleanText(body.accountStatus,40);
    if(plan){
      if(!["start","business","pro"].includes(plan)) return json({error:"plan_invalid",message:"Ungültiger Plan."},400);
      patch.plan=plan;
    }
    if(subscriptionStatus){
      if(!["trial","active","past_due","suspended","cancelled"].includes(subscriptionStatus)) return json({error:"subscription_invalid",message:"Ungültiger Abonnementstatus."},400);
      patch.subscription_status=subscriptionStatus;
    }
    if(accountStatus){
      authorizeOperator(session,"restrictions:manage");
      if(!["active","restricted","suspended","cancelled"].includes(accountStatus)) return json({error:"account_invalid",message:"Ungültiger Kontostatus."},400);
      patch.account_status=accountStatus;
    }
    if(body.userLimit!==undefined){
      const limit=Number(body.userLimit);
      if(body.userLimit!==null&&(!Number.isSafeInteger(limit)||limit<1)) return json({error:"user_limit_invalid",message:"Ungültiges Benutzerlimit."},400);
      patch.user_limit=body.userLimit===null?null:limit;
    }
    if(!Object.keys(patch).length) return json({error:"empty_patch",message:"Keine Änderung angegeben."},400);
    const item=await withPlatform(async c=>{
      await c.query('select id from organizations where id::text=$1 for update',[id]);
      const account=(await c.query('select billing_subscription_id from organization_subscriptions where organization_id::text=$1',[id])).rows[0];
      if(!account)return null;
      if((plan||subscriptionStatus)&&account.billing_subscription_id)throw new ApiError(409,'stripe_managed','Dieses Abonnement wird über Stripe verwaltet. Plan und Abonnementstatus müssen dort geändert werden.');
      if(accountStatus==='active'){
        const effective=(await c.query('select exists(select 1 from organization_restrictions where organization_id::text=$1 and active and starts_at<=now() and (ends_at is null or ends_at>now())) effective',[id])).rows[0].effective;
        if(effective)throw new ApiError(409,'restriction_active','Aktive Einschränkungen müssen zuerst aufgehoben werden.');
      }
      const rows=await updateOperatorBusiness(c,session,"tenant_accounts","tenant_id=eq."+encodeURIComponent(id),patch);
      if(!rows[0])return null;
      await platformAudit({userId:session.userId,userEmail:session.email,action:"tenant.account.updated",entityType:"tenant",entityId:id,metadata:patch},c);
      return rows[0];
    });
    return item?json({item}):json({error:"not_found",message:"Konto wurde nicht gefunden."},404);
  }catch(error){return apiError(error);}
}
