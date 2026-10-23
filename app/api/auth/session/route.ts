import {getOrganizationPlan} from "@/lib/server/plan-access";
import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
export async function GET(){
 const s=await getSession();
 if(s)return json({authenticated:true,configured:true,demo:s.isDemo===true,security:{mfaEnabled:s.mfaEnabled===true,enrollmentRequired:false},user:{id:s.userId,email:s.email},tenant:{id:s.organizationId,role:s.role,moduleProfile:s.moduleProfile??'standard',readOnly:s.organizationStatus==="read_only",plan:await getOrganizationPlan(s.organizationId)}});
 return json({authenticated:false,configured:true,demo:false});
}
