import { apiError, json } from "@/lib/server/http";
import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{const session=await requireOperatorSession();authorizeOperator(session,"organizations:read");
    const items=await operatorList<Record<string,unknown>>(
      "tenants",
      "id,name,uid,city,created_at,account:tenant_accounts(plan,subscription_status,account_status,user_limit,updated_at)",
      "order=created_at.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
