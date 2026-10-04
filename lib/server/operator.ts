import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getOperatorSession, requireOperatorSession as requireSession } from "@/lib/server/operator/session";

export async function requireOperatorSession(){
 const session=await requireSession();
 return {...session,token:""};
}
export async function requireOperator(){
 const session=await getOperatorSession();
 if(session)return {prototype:false,role:session.role};
 const jar=await cookies();
 if(jar.get("binso_operator_demo")?.value==="1")return {prototype:true,role:"readonly" as const};
 redirect("/operator/login");
}
