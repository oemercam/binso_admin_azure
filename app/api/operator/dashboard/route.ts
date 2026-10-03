import { requireOperatorSession } from "@/lib/server/operator/session";
import { authorizeOperator } from "@/lib/server/operator/rbac";
import { apiError, json } from "@/lib/server/http";
import { operatorList, operatorRpc } from "@/lib/server/database";

export async function GET(){
  try{const session=await requireOperatorSession();authorizeOperator(session,"platform:read");
    const stats=await operatorRpc<Record<string,unknown>>("operator_dashboard_stats");
    const tickets=await operatorList<Record<string,unknown>>(
      "support_tickets",
      "id,tenant_id,subject,priority,status,updated_at,tenant:tenants(name)",
      "order=updated_at.desc&limit=6"
    );
    const incidents=await operatorList<Record<string,unknown>>(
      "platform_incidents",
      "id,service,title,status,started_at,resolved_at,note",
      "order=started_at.desc&limit=5"
    );
    return json({stats,tickets,incidents});
  }catch(error){return apiError(error);}
}
