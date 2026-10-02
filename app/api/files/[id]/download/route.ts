import { apiError, json } from "@/lib/server/http";
import { currentTenant, tenantList } from "@/lib/server/database";
import { signStorageObject } from "@/lib/server/storage";

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const {id}=await params;
    const tenant=await currentTenant();
    const rows=await tenantList<{id:string;bucket:string;storage_path:string;original_name:string}>("files","id,bucket,storage_path,original_name","id=eq."+encodeURIComponent(id)+"&limit=1");
    if(!rows[0]) return json({error:"not_found",message:"Datei wurde nicht gefunden."},404);
    const url=await signStorageObject(rows[0].bucket,rows[0].storage_path,tenant.token,300);
    return json({url,filename:rows[0].original_name,expiresIn:300});
  }catch(error){return apiError(error);}
}
