import { apiError, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(){
  try{
    const rows=await tenantList<Record<string,unknown>>(
      "tenant_accounts",
      "tenant_id,plan,subscription_status,account_status,trial_ends_at,current_period_ends_at,user_limit,storage_limit_bytes,billing_customer_ref,billing_subscription_ref,updated_at",
      "limit=1"
    );
    if(!rows[0]) return json({error:"not_found",message:"Abonnementdaten wurden nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
