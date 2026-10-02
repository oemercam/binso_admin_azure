import { apiError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { currentTenant } from "@/lib/server/database";
import { isBackendConfigured } from "@/lib/server/env";

export async function GET(){
  try{
    if(!isBackendConfigured()) return json({authenticated:false,configured:false},200);
    const {user}=await requireUser();
    const tenant=await currentTenant();
    return json({authenticated:true,configured:true,user:{id:user.id,email:user.email},tenant:{id:tenant.tenantId,role:tenant.role}});
  }catch(error){return apiError(error);}
}
