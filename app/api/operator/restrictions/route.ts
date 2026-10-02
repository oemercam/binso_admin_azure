import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson } from "@/lib/server/http";
import { operatorAudit, operatorInsert, operatorList, operatorUpdate } from "@/lib/server/database";
import { requireOperatorSession } from "@/lib/server/operator";

type Body={tenantId?:unknown;scope?:unknown;reason?:unknown;note?:unknown;endsAt?:unknown};

export async function GET(){
  try{
    const items=await operatorList<Record<string,unknown>>(
      "tenant_restrictions",
      "id,tenant_id,scope,reason,note,starts_at,ends_at,active,created_at,tenant:tenants(name)",
      "order=created_at.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    const body=await readJson<Body>(request,16384);
    const tenantId=cleanText(body.tenantId,80),scope=cleanText(body.scope,20),reason=cleanText(body.reason,160),note=cleanText(body.note,2000);
    if(!tenantId||!["all","write"].includes(scope)||!reason||!note) return json({error:"invalid_restriction",message:"Angaben zur Einschränkung sind unvollständig."},400);
    const session=await requireOperatorSession();
    const rows=await operatorInsert("tenant_restrictions",{tenant_id:tenantId,scope,reason,note,ends_at:cleanText(body.endsAt,40)||null,active:true,created_by:session.user.id});
    await operatorUpdate("tenant_accounts","tenant_id=eq."+encodeURIComponent(tenantId),{account_status:scope==="all"?"suspended":"restricted"});
    await operatorAudit("tenant.restriction.created","tenant",tenantId,{restriction_id:rows[0]?.id,scope,reason});
    return json({item:rows[0]},201);
  }catch(error){return apiError(error);}
}
