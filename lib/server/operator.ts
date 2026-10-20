import "server-only";
import { redirect } from "next/navigation";
import { getOperatorSession, requireOperatorSession as requireSession } from "@/lib/server/operator/session";

export async function requireOperatorSession(){
 const session=await requireSession();
 return {...session,token:""};
}
export async function requireOperator(){
 const current=await getOperatorSession();
 if(current){const session=await requireSession();return {role:session.role,identity:{name:session.name,email:session.email}};}
 redirect("/operator/login");
}
