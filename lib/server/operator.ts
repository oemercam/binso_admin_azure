import "server-only";
import { redirect } from "next/navigation";
import { getOperatorSession, requireOperatorSession as requireSession } from "@/lib/server/operator/session";

export async function requireOperatorSession(){
 const session=await requireSession();
 return {...session,token:""};
}
export async function requireOperator(){
 const session=await getOperatorSession();
 if(!session)redirect("/operator/login");
 return {prototype:false,role:session.role};
}
