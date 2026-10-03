import { cookies } from "next/headers";
import { apiError, json } from "@/lib/server/http";
import { requireUser } from "@/lib/server/auth";
import { currentTenant } from "@/lib/server/database";
import { isBackendConfigured } from "@/lib/server/env";

export async function GET(){
  try{
    const store=await cookies();
    if(store.get("binso_demo")?.value==="1"){
      return json({
        authenticated:true,
        configured:false,
        demo:true,
        user:{id:"demo-user",email:null},
        tenant:{id:"demo-tenant",role:"owner"},
      },200);
    }

    if(!isBackendConfigured()) return json({authenticated:false,configured:false,demo:false},200);
    const {user}=await requireUser();
    const tenant=await currentTenant();
    return json({authenticated:true,configured:true,demo:false,user:{id:user.id,email:user.email},tenant:{id:tenant.tenantId,role:tenant.role}});
  }catch(error){return apiError(error);}
}
