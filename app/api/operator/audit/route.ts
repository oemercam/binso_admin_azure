import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{
    const items=await operatorList<Record<string,unknown>>(
      "operator_audit",
      "id,operator_user_id,action,target_type,target_id,metadata,created_at",
      "order=created_at.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
