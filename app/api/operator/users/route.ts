import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{
    const items=await operatorList<Record<string,unknown>>(
      "operator_users",
      "user_id,role,active,created_at",
      "order=created_at.asc&limit=200"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
