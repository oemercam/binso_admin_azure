import {dashboardAnalytics} from "@/lib/server/repositories/dashboard";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import { apiError, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(){
  try{
    const stats={};
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
    const session=await requireSession();
    const analytics=await withTenant(session.organizationId,session.userId,c=>dashboardAnalytics(c,session.organizationId));
    return json({stats,invoices,payments,...analytics});
  }catch(error){return apiError(error);}
}
