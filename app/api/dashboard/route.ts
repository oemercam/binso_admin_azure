import { apiError, json } from "@/lib/server/http";
import { tenantList, tenantRpc } from "@/lib/server/database";

export async function GET(){
  try{
    const stats=await tenantRpc<Record<string,unknown>>("tenant_dashboard_stats",{});
    const invoices=await tenantList<Record<string,unknown>>(
      "documents",
      "id,kind,number,status,issue_date,total,customer:customers(name)",
      "kind=eq.invoice&order=created_at.desc&limit=5"
    );
    const payments=await tenantList<Record<string,unknown>>(
      "payments",
      "id,paid_on,amount,status,customer:customers(name),invoice:documents(number)",
      "order=created_at.desc&limit=5"
    );
    return json({stats,invoices,payments});
  }catch(error){return apiError(error);}
}
