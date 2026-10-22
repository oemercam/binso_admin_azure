import {requireModuleEntitlement} from "@/lib/server/plan-access";
import { NextRequest } from "next/server";
import { apiError, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"invoices:write");await requireModuleEntitlement(s.organizationId,"zeiterfassung");await requireModuleEntitlement(s.organizationId,"rechnungen");
    const minutes=request.nextUrl.searchParams.get('minuteAllocations')==='1';
    const ids=(request.nextUrl.searchParams.get("ids")??"").split(",").filter(Boolean).slice(0,100);
    const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`
      select t.id,t.hours,t.description,case when t.external_resource_id is null then t.sales_rate else (ps.source_snapshot->>'unitPrice')::numeric end sales_rate,t.work_date,t.customer_id,t.project_id,t.external_resource_id,ps.id price_source_id,ps.source_snapshot->>'currency' price_currency,ps.source_snapshot->>'vatRate' vat_rate,ps.source_snapshot->>'taxTreatment' tax_treatment,
        case when t.external_resource_id is null then null else (select coalesce(sum(x.allocated_minutes),0)::int from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id) end allocated_minutes,
        case when t.external_resource_id is null then null else t.recorded_duration_minutes-(select coalesce(sum(x.allocated_minutes),0)::int from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id) end remaining_minutes,
        c.name customer_name,coalesce(p.name,t.project_label,'Arbeitszeit') project_name
      from time_entries t
      join customers c on c.id=t.customer_id and c.organization_id=t.organization_id
      left join projects p on p.id=t.project_id and p.organization_id=t.organization_id
      left join time_price_sources ps on ps.organization_id=t.organization_id and ps.time_entry_id=t.id and ps.side='sale' and ps.is_current
      where (t.external_resource_id is null or ($3::boolean and ps.id is not null and t.recorded_duration_minutes>(select coalesce(sum(x.allocated_minutes),0) from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id))) and t.organization_id=$1 and t.archived_at is null and c.archived_at is null and t.billable=true and t.approved=true and t.invoiced_invoice_id is null
        and (cardinality($2::uuid[])=0 or t.id=any($2::uuid[]))
      order by c.name,project_name,t.work_date,t.created_at`,[s.organizationId,ids,minutes])).rows);
    return json({items});
  }catch(e){return apiError(e)}
}
