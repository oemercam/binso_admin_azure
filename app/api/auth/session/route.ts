import {getOrganizationPlan} from "@/lib/server/plan-access";
import { cookies } from "next/headers";
import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
export async function GET(){
 const s=await getSession();
 if(s)return json({authenticated:true,configured:true,demo:s.isDemo===true,user:{id:s.userId,email:s.email},tenant:{id:s.organizationId,role:s.role,readOnly:s.organizationStatus==="read_only",plan:await getOrganizationPlan(s.organizationId)}});
 const store=await cookies();if(store.get("binso_demo")?.value==="1")return json({authenticated:true,configured:false,demo:true,user:{id:"demo-user",email:null},tenant:{id:"demo-tenant",role:"owner"}});
 return json({authenticated:false,configured:true,demo:false});
}
