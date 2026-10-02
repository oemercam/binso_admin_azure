import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{
    const items=await operatorList<Record<string,unknown>>(
      "tenant_accounts",
      "tenant_id,plan,subscription_status,account_status,trial_ends_at,current_period_ends_at,user_limit,storage_limit_bytes,billing_customer_ref,billing_subscription_ref,updated_at,tenant:tenants(name,uid,city)",
      "order=updated_at.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
