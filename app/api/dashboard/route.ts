import {tenantCan} from "@/lib/permissions";
import {dashboardAnalytics} from "@/lib/server/repositories/dashboard";
import {requireSession} from "@/lib/server/session";
import {withTenant} from "@/lib/server/db";
import { apiError, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(){
  try{
    const session=await requireSession();
    const canInvoices=tenantCan(session.role,"invoices:read"),canPayments=tenantCan(session.role,"payments:read");
    const invoices=canInvoices?await tenantList<Record<string,unknown>>(
      "documents",
      "id,kind,number,status,issue_date,due_date,total,paid_amount,currency,customer:customers(name)",
      "kind=eq.invoice&order=issue_date.desc&limit=5"
    ):[];
    const payments=canPayments?await tenantList<Record<string,unknown>>(
      "payments",
      "id,paid_on,amount,status,customer:customers(name),invoice:documents(number,currency)",
      "order=paid_on.desc&limit=5"
    ):[];
    const analytics=canInvoices&&canPayments?await withTenant(session.organizationId,session.userId,c=>dashboardAnalytics(c,session.organizationId)):{analyticsInvoices:[],analyticsPayments:[],customerCount:0};
    return json({stats:{customer_count:analytics.customerCount},invoices,payments,canInvoices,canPayments,...analytics});
  }catch(error){return apiError(error);}
}
