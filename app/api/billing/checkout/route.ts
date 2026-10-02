import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { currentCompany, currentTenant, tenantList, tenantRpc } from "@/lib/server/database";
import { createCheckoutSession, createStripeCustomer } from "@/lib/server/stripe";

type Body={plan?:unknown};

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<Body>(request,8192);
    const plan=body.plan==="start"||body.plan==="business"||body.plan==="pro"?body.plan:null;
    if(!plan) return json({error:"plan_invalid",message:"Ungültiger Plan."},400);

    const tenant=await currentTenant();
    const company=await currentCompany();
    const accounts=await tenantList<{billing_customer_ref?:string|null;billing_subscription_ref?:string|null}>(
      "tenant_accounts","billing_customer_ref,billing_subscription_ref","limit=1"
    );
    if(accounts[0]?.billing_subscription_ref) return json({error:"subscription_exists",message:"Ein Abonnement ist bereits verbunden. Verwende das Billing-Portal für Änderungen."},409);
    let customerId=accounts[0]?.billing_customer_ref??null;

    if(!customerId){
      customerId=await createStripeCustomer({
        tenantId:tenant.tenantId,
        companyName:String(company.name??"Binso One Kunde"),
        email:tenant.user.email,
      });
      await tenantRpc("set_current_tenant_billing_customer",{p_customer_ref:customerId});
    }

    const url=await createCheckoutSession({tenantId:tenant.tenantId,customerId,plan});
    return json({url});
  }catch(error){return apiError(error);}
}
