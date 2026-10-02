import { apiError, json } from "@/lib/server/http";
import { tenantList } from "@/lib/server/database";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const rows=await tenantList<Record<string,unknown>>("payments","id,invoice_id,customer_id,paid_on,amount,method,note,status,created_at,customer:customers(name),invoice:documents(number,total)","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Zahlung wurde nicht gefunden."},404);
    return json({item:rows[0]});
  }catch(error){return apiError(error);}
}
