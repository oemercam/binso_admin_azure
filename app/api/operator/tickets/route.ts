import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{const session=await requireOperatorSession();authorizeOperator(session,"support:manage");
    const items=await operatorList<Record<string,unknown>>(
      "support_tickets",
      "id,tenant_id,created_by,subject,category,priority,status,created_at,updated_at,tenant:tenants(name)",
      "order=updated_at.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
