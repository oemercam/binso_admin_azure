import { NextRequest } from "next/server";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { query } from "@/lib/server/db";
import { env } from "@/lib/server/env";
import { createCheckoutSession } from "@/lib/server/stripe";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { asObject, enumField } from "@/lib/server/validation";

export const runtime="nodejs";
const plans=["start","business","pro"] as const;
const cycles=["monthly","yearly"] as const;

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);const s=await requireSession();authorize(s,"billing:write");const body=asObject(await readJson(request,8_000));
  const plan=enumField(body,"plan",plans);const billing=enumField(body,"billing",cycles);
  const priceId=env.stripePrices[plan][billing];
  if(!priceId)throw new Error("Stripe-Preis ist nicht konfiguriert.");
  const org=await query<{status:string}>("select status from organizations where id=$1 and not is_demo",[s.organizationId]);
  if(!org.rows[0])return json({error:"Organisation nicht gefunden."},404);
  const checkout=await createCheckoutSession({
    priceId,customerEmail:s.email,organizationId:s.organizationId,
    successUrl:`${env.appUrl}/onboarding?billing=success`,
    cancelUrl:`${env.appUrl}/checkout?plan=${plan}&billing=${billing}&cancelled=1`
  });
  return json({url:checkout.url});
 }catch(e){return apiError(e)}
}
