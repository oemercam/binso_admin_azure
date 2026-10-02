import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";
import { createPortalSession } from "@/lib/server/stripe";

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const accounts=await tenantList<{billing_customer_ref?:string|null}>(
      "tenant_accounts","billing_customer_ref","limit=1"
    );
    const customerId=accounts[0]?.billing_customer_ref;
    if(!customerId) return json({error:"billing_not_connected",message:"Noch kein Stripe-Konto verbunden."},409);
    return json({url:await createPortalSession(customerId)});
  }catch(error){return apiError(error);}
}
