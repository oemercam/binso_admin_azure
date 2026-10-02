import { redirect } from "next/navigation";
import { getBackendEnv, isBackendConfigured } from "./env";
import { requireUser } from "./auth";

export async function requireOperator(){
  if(!isBackendConfigured()) return {prototype:true,role:"prototype"};
  const {user,token}=await requireUser();
  const {supabaseUrl,supabaseAnonKey}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/rest/v1/operator_users?select=role,active&user_id=eq."+encodeURIComponent(user.id)+"&active=eq.true&limit=1",{
    headers:{apikey:supabaseAnonKey,Authorization:"Bearer "+token},
    cache:"no-store",
  });
  if(!response.ok) redirect("/dashboard");
  const rows=await response.json() as Array<{role:string;active:boolean}>;
  if(!rows[0]) redirect("/dashboard");
  return {prototype:false,role:rows[0].role};
}
