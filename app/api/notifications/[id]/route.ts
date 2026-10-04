import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { requireSession } from "@/lib/server/session";
import { withTenant } from "@/lib/server/db";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const s=await requireSession();
    await withTenant(s.organizationId,s.userId,c=>c.query("update in_app_notifications set read_at=coalesce(read_at,now()) where id::text=$1 and organization_id=$2 and (user_id is null or user_id=$3)",[id,s.organizationId,s.userId]));
    return json({ok:true});
  }catch(error){return apiError(error);}
}
