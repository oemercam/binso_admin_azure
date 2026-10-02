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
    const remaining=await operatorList<{id:string;scope:string;starts_at:string;ends_at:string|null}>("tenant_restrictions","id,scope,starts_at,ends_at","tenant_id=eq."+encodeURIComponent(rows[0].tenant_id)+"&active=eq.true&limit=100");
    const now=Date.now();
    const effective=remaining.filter(item=>{
      const starts=new Date(item.starts_at).getTime();
      const ends=item.ends_at?new Date(item.ends_at).getTime():Number.POSITIVE_INFINITY;
      return starts<=now&&ends>now;
    });
    const accounts=await operatorList<{account_status:string}>("tenant_accounts","account_status","tenant_id=eq."+encodeURIComponent(rows[0].tenant_id)+"&limit=1");
    if(accounts[0]&&accounts[0].account_status!=="cancelled"){
      const nextStatus=effective.some(item=>item.scope==="all")?"suspended":effective.some(item=>item.scope==="write")?"restricted":"active";
      await operatorUpdate("tenant_accounts","tenant_id=eq."+encodeURIComponent(rows[0].tenant_id),{account_status:nextStatus});
    }
    await operatorAudit("tenant.restriction.removed","tenant",rows[0].tenant_id,{restriction_id:id});
    return json({item:updated[0]});
  }catch(error){return apiError(error);}
}
