import {requireModuleEntitlement} from "@/lib/server/plan-access";
import { NextRequest } from "next/server";
import { apiError, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"invoices:write");await requireModuleEntitlement(s.organizationId,"zeiterfassung");await requireModuleEntitlement(s.organizationId,"rechnungen");
    const ids=(request.nextUrl.searchParams.get("ids")??"").split(",").filter(Boolean).slice(0,100);
    const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`
      select t.id,t.hours,t.description,t.sales_rate,t.work_date,t.customer_id,t.project_id,
        c.name customer_name,coalesce(p.name,t.project_label,'Arbeitszeit') project_name
      from time_entries t
      join customers c on c.id=t.customer_id and c.organization_id=t.organization_id
      left join projects p on p.id=t.project_id and p.organization_id=t.organization_id
      where t.organization_id=$1 and t.archived_at is null and c.archived_at is null and t.billable=true and t.approved=true and t.invoiced_invoice_id is null
        and (cardinality($2::uuid[])=0 or t.id=any($2::uuid[]))
      order by c.name,project_name,t.work_date,t.created_at`,[s.organizationId,ids])).rows);
    return json({items});
  }catch(e){return apiError(e)}
}
