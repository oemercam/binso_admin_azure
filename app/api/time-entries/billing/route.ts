import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { withTenant } from "@/lib/server/db";

export async function GET(request:NextRequest){
  try{
    const s=await requireSession();authorize(s,"invoices:write");
    const ids=(request.nextUrl.searchParams.get("ids")??"").split(",").filter(Boolean).slice(0,100);
    const items=await withTenant(s.organizationId,s.userId,async c=>(await c.query(`
      select t.id,t.hours,t.description,t.sales_rate,t.work_date,t.customer_id,t.project_id,
        c.name customer_name,coalesce(p.name,t.project_label,'Arbeitszeit') project_name
      from time_entries t
      join customers c on c.id=t.customer_id and c.organization_id=t.organization_id
      left join projects p on p.id=t.project_id and p.organization_id=t.organization_id
      where t.organization_id=$1 and t.billable=true and t.approved=true and t.invoiced_invoice_id is null
        and (cardinality($2::uuid[])=0 or t.id=any($2::uuid[]))
      order by c.name,project_name,t.work_date,t.created_at`,[s.organizationId,ids])).rows);
    return json({items});
  }catch(e){return apiError(e)}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);const s=await requireSession();authorize(s,"invoices:write");
    const body=await readJson<{invoiceNumber?:unknown;timeEntryIds?:unknown}>(request,16384);
    const invoiceNumber=cleanText(body.invoiceNumber,80);
    const ids=Array.isArray(body.timeEntryIds)?body.timeEntryIds.map(String).filter(Boolean).slice(0,100):[];
    if(!invoiceNumber||!ids.length)throw new ApiError(400,"billing_invalid","Rechnung und Zeiteinträge sind erforderlich.");
    const result=await withTenant(s.organizationId,s.userId,async c=>{
      const invoice=await c.query("select id,customer_id from invoices where organization_id=$1 and invoice_no=$2",[s.organizationId,invoiceNumber]);
      if(invoice.rowCount!==1)throw new ApiError(404,"invoice_not_found","Rechnung wurde nicht gefunden.");
      const updated=await c.query(`update time_entries set invoiced_invoice_id=$3
        where organization_id=$1 and id=any($2::uuid[]) and customer_id=$4 and billable=true and approved=true and invoiced_invoice_id is null returning id`,
        [s.organizationId,ids,invoice.rows[0].id,invoice.rows[0].customer_id]);
      if(updated.rowCount!==ids.length)throw new ApiError(409,"time_entries_changed","Mindestens ein Zeiteintrag ist nicht mehr verrechenbar. Bitte Auswahl aktualisieren.");
      return updated.rows;
    });
    return json({items:result});
  }catch(e){return apiError(e)}
}
