import { cookies } from "next/headers";
import { json } from "@/lib/server/http";
import { getSession } from "@/lib/server/session";
export async function GET(){
 const store=await cookies();if(store.get("binso_demo")?.value==="1")return json({authenticated:true,configured:false,demo:true,user:{id:"demo-user",email:null},tenant:{id:"demo-tenant",role:"owner"}});
 const s=await getSession();if(!s)return json({authenticated:false,configured:true,demo:false});
 return json({authenticated:true,configured:true,demo:false,user:{id:s.userId,email:s.email},tenant:{id:s.organizationId,role:s.role}});
}
