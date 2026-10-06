import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { normalizeTenantRole } from "@/lib/permissions";
import { withTenant } from "@/lib/server/db";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const s=await requireSession();authorize(s,"time:write");
    if(!["owner","admin","project_manager","manager"].includes(normalizeTenantRole(s.role))) throw new ApiError(403,"approval_forbidden","Nur berechtigte Personen können Zeiten freigeben.");
    const {id}=await params;
    const item=await withTenant(s.organizationId,s.userId,async c=>{
      const result=await c.query(`update time_entries set approved=true where organization_id=$1 and id=$2 and billable=true and invoiced_invoice_id is null returning id,approved,billable`,[s.organizationId,id]);
      if(!result.rowCount)throw new ApiError(404,"time_entry_not_found","Zeiteintrag wurde nicht gefunden oder kann nicht freigegeben werden.");
      return result.rows[0];
    });
    return json({item});
  }catch(e){return apiError(e)}
}
