import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json } from "@/lib/server/http";
import { operatorAudit, operatorList, operatorUpdate } from "@/lib/server/database";
import { requireOperatorSession } from "@/lib/server/operator";

export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{
    assertSameOrigin(request);
    const {id}=await params;
    const rows=await operatorList<{id:string;tenant_id:string;active:boolean}>("tenant_restrictions","id,tenant_id,active","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Einschränkung wurde nicht gefunden."},404);
    const session=await requireOperatorSession();
    const updated=await operatorUpdate("tenant_restrictions","id=eq."+encodeURIComponent(id),{active:false,removed_at:new Date().toISOString(),removed_by:session.user.id});
    const remaining=await operatorList<{id:string}>("tenant_restrictions","id","tenant_id=eq."+encodeURIComponent(rows[0].tenant_id)+"&active=eq.true&limit=1");
    if(!remaining[0]) await operatorUpdate("tenant_accounts","tenant_id=eq."+encodeURIComponent(rows[0].tenant_id),{account_status:"active"});
    await operatorAudit("tenant.restriction.removed","tenant",rows[0].tenant_id,{restriction_id:id});
    return json({item:updated[0]});
  }catch(error){return apiError(error);}
}
