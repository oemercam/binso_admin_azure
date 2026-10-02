import { apiError, json } from "@/lib/server/http";
import { operatorList } from "@/lib/server/database";

export async function GET(){
  try{
    const items=await operatorList<Record<string,unknown>>(
      "payments",
      "id,tenant_id,invoice_id,customer_id,paid_on,amount,method,note,status,created_at,tenant:tenants(name),customer:customers(name),invoice:documents(number)",
      "order=paid_on.desc&limit=500"
    );
    return json({items});
  }catch(error){return apiError(error);}
}
