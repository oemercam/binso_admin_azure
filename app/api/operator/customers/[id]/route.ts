import { apiError, json } from "@/lib/server/http";
import { operatorList, operatorRpc } from "@/lib/server/database";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const overview=await operatorRpc<Record<string,unknown>>("operator_customer_overview",{p_tenant_id:id});
    const tickets=await operatorList<Record<string,unknown>>(
      "support_tickets",
      "id,subject,priority,status,created_at,updated_at",
      "tenant_id=eq."+encodeURIComponent(id)+"&order=updated_at.desc&limit=8"
    );
    const audit=await operatorList<Record<string,unknown>>(
      "audit_log",
      "id,user_id,action,entity_type,entity_id,metadata,created_at",
      "tenant_id=eq."+encodeURIComponent(id)+"&order=created_at.desc&limit=12"
    );
    return json({overview,tickets,audit});
  }catch(error){return apiError(error);}
}
