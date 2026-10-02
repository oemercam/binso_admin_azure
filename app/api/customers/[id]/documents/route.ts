import { apiError, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const items=await tenantList<Record<string,unknown>>(
      "documents",
      "id,kind,number,status,issue_date,due_date,valid_until,total,currency,created_at",
      "customer_id=eq."+encodeURIComponent(id)+"&order=created_at.desc&limit=100"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
