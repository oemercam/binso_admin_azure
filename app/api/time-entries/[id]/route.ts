import { NextRequest } from "next/server";
import { ApiError, apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { authorize } from "@/lib/server/rbac";
import { normalizeTenantRole, ownRecordOnly } from "@/lib/permissions";
import { audit } from "@/lib/server/audit";
import { withTenant } from "@/lib/server/db";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const s=await requireSession();authorize(s,"time:write");
    const body=await readJson<{action?:string}>(request,1024);
    const submit=body.action==="submit";
    if(body.action&&!['submit','approve'].includes(body.action))throw new ApiError(400,"action_invalid","Ungültige Aktion.");
    if(!submit&&!["owner","admin","project_manager","manager"].includes(normalizeTenantRole(s.role))) throw new ApiError(403,"approval_forbidden","Nur berechtigte Personen können Zeiten freigeben.");
    const {id}=await params;
    const item=await withTenant(s.organizationId,s.userId,async c=>{
      const result=await c.query(`update time_entries set ${submit?"submitted_at=coalesce(submitted_at,now())":"approved=true"} where organization_id=$1 and id=$2 and archived_at is null and billable=true and approved=false and invoiced_invoice_id is null and ($3::boolean=false or created_by_user_id=$4) returning id,approved,billable,submitted_at`,[s.organizationId,id,submit&&ownRecordOnly(s.role,"zeiterfassung"),s.userId]);
      if(!result.rowCount)throw new ApiError(404,"time_entry_not_found","Zeiteintrag wurde nicht gefunden oder kann nicht freigegeben werden.");
      await audit(c,{organizationId:s.organizationId,userId:s.userId,action:submit?"time.submitted":"time.approved",entityType:"time_entry",entityId:id});
      return result.rows[0];
    });
    return json({item});
  }catch(e){return apiError(e)}
}
