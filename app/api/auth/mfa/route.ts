import {NextRequest} from "next/server";
import {getSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,json} from "@/lib/server/http";

export const runtime="nodejs";
export async function GET(){
  try{
    const session=await getSession();
    if(!session)return json({error:"unauthorized",message:"Anmeldung erforderlich."},401);
    const user=await query<{mfa_enabled:boolean}>("select mfa_enabled from app_users where id=$1 limit 1",[session.userId]);
    const enabled=user.rows[0]?.mfa_enabled===true;
    return json({enabled,required:session.isDemo!==true&&["owner","admin","finance"].includes(session.role),role:session.role,demo:session.isDemo===true});
  }catch(error){return apiError(error);}
}
export async function DELETE(_request:NextRequest){
  return json({error:"not_supported",message:"MFA wird für geschützte Konten nicht über einen einfachen Schalter deaktiviert."},405);
}
