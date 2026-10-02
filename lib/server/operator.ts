import { redirect } from "next/navigation";
import { getBackendEnv, isBackendConfigured } from "./env";
import { requireUserNoRefresh } from "./auth";
import { ApiError } from "./http";

export async function requireOperatorSession(){
  if(!isBackendConfigured()) throw new ApiError(503,"backend_not_configured","Backend ist noch nicht konfiguriert.");
  const {user,token}=await requireUserNoRefresh();
  const {supabaseUrl,supabaseAnonKey}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/rest/v1/operator_users?select=role,active&user_id=eq."+encodeURIComponent(user.id)+"&active=eq.true&limit=1",{
    headers:{apikey:supabaseAnonKey,Authorization:"Bearer "+token},
    cache:"no-store",
  });
  if(!response.ok) throw new ApiError(403,"operator_forbidden","Kein Operator-Zugriff.");
  const rows=await response.json() as Array<{role:string;active:boolean}>;
  if(!rows[0]) throw new ApiError(403,"operator_forbidden","Kein Operator-Zugriff.");
  return {user,token,role:rows[0].role};
}

export async function requireOperator(){
  if(!isBackendConfigured()) return {prototype:true,role:"prototype"};
  try{
    const session=await requireOperatorSession();
    return {prototype:false,role:session.role};
  }catch(error){
    if(error instanceof ApiError && error.status===401) redirect("/login?next=/operator");
    if(error instanceof ApiError && error.status===403) redirect("/dashboard");
    throw error;
  }
}
