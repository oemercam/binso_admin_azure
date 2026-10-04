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
    const analyticsPayments=await tenantList<Record<string,unknown>>(
      "payments",
      "id,paid_on,amount,status",
      "status=eq.booked&order=paid_on.desc&limit=500"
    );
    const analyticsInvoices=await tenantList<Record<string,unknown>>(
      "documents",
      "id,issue_date,total,status",
      "kind=eq.invoice&order=issue_date.desc&limit=500"
    );
    return json({stats,invoices,payments,analyticsPayments,analyticsInvoices:analyticsInvoices.filter(x=>!["draft","cancelled"].includes(String(x.status)))});
  }catch(error){return apiError(error);}
}
