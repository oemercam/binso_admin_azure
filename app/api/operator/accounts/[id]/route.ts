import { NextRequest } from "next/server";
import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

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
      if(!["active","restricted","suspended","cancelled"].includes(accountStatus)) return json({error:"account_invalid",message:"Ungültiger Kontostatus."},400);
      patch.account_status=accountStatus;
    }
    if(body.userLimit!==undefined){
      const limit=Number(body.userLimit);
      if(!Number.isInteger(limit)||limit<1||limit>10000) return json({error:"user_limit_invalid",message:"Ungültiges Benutzerlimit."},400);
      patch.user_limit=limit;
    }
    if(!Object.keys(patch).length) return json({error:"empty_patch",message:"Keine Änderung angegeben."},400);
    if(plan||subscriptionStatus){
      const accounts=await operatorList<{billing_subscription_ref:string|null}>("tenant_accounts","billing_subscription_ref","tenant_id=eq."+encodeURIComponent(id)+"&limit=1");
      if(accounts[0]?.billing_subscription_ref)return json({error:"stripe_managed",message:"Dieses Abonnement wird über Stripe verwaltet. Plan und Abonnementstatus müssen dort geändert werden."},409);
    }
    if(accountStatus==="active"){
      const restrictions=await operatorList<{starts_at:string;ends_at:string|null}>("tenant_restrictions","starts_at,ends_at","tenant_id=eq."+encodeURIComponent(id)+"&active=eq.true&limit=100");
      const now=Date.now();
      const effective=restrictions.some(item=>{
        const starts=new Date(item.starts_at).getTime();
        const ends=item.ends_at?new Date(item.ends_at).getTime():Number.POSITIVE_INFINITY;
        return starts<=now&&ends>now;
      });
      if(effective) return json({error:"restriction_active",message:"Aktive Einschränkungen müssen zuerst aufgehoben werden."},409);
    }
    const item=await withPlatform(async c=>{
      await c.query('select id from organizations where id::text=$1 for update',[id]);
      const rows=await updateOperatorBusiness(c,session,"tenant_accounts","tenant_id=eq."+encodeURIComponent(id),patch);
      if(!rows[0])return null;
      await platformAudit({userId:session.userId,userEmail:session.email,action:"tenant.account.updated",entityType:"tenant",entityId:id,metadata:patch},c);
      return rows[0];
    });
    return item?json({item}):json({error:"not_found",message:"Konto wurde nicht gefunden."},404);
  }catch(error){return apiError(error);}
}
