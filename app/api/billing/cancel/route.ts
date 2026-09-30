import {NextRequest} from "next/server";
import {requireSession} from "@/lib/server/session";
import {authorize} from "@/lib/server/rbac";
import {query} from "@/lib/server/db";
import {updateSubscription} from "@/lib/server/stripe";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject} from "@/lib/server/validation";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"billing:write");const b=asObject(await readJson(request,8_000));const cancel=b.cancel===true;
  const subscription=(await query<{billing_subscription_id:string|null}>(`select billing_subscription_id from organization_subscriptions where organization_id=$1`,[s.organizationId])).rows[0];
  if(!subscription?.billing_subscription_id)return json({error:"Kein aktives Stripe-Abonnement gefunden."},400);
  await updateSubscription({subscriptionId:subscription.billing_subscription_id,cancelAtPeriodEnd:cancel});
  await query(`update organization_subscriptions set cancel_at_period_end=$1,updated_at=now() where organization_id=$2`,[cancel,s.organizationId]);
  return json({ok:true,cancelAtPeriodEnd:cancel});
 }catch(e){return apiError(e,request)}
}
