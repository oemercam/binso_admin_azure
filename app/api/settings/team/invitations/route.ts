import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { currentTenant, tenantList, tenantRpc } from "@/lib/server/database";
import { inviteSupabaseUser, privilegedSupabase } from "@/lib/server/service-role";

type InviteBody={email?:unknown;role?:unknown};

export async function GET(){
  try{
    const tenant=await currentTenant();
    if(!["owner","admin"].includes(tenant.role)) return json({error:"forbidden",message:"Keine Berechtigung."},403);
    const [members,invitations,accounts]=await Promise.all([
      tenantList<Record<string,unknown>>("tenant_memberships","user_id,role,created_at,profile:profiles(display_name)","order=created_at.asc"),
      tenantList<Record<string,unknown>>("tenant_invitations","id,email,role,status,expires_at,created_at","order=created_at.desc"),
      tenantList<{user_limit:number;plan:string}>("tenant_accounts","user_limit,plan","limit=1"),
    ]);
    return json({members,invitations,userLimit:accounts[0]?.user_limit??1,plan:accounts[0]?.plan??"trial"});
  }catch(error){return apiError(error);}
}

export async function POST(request:NextRequest){
  let invitationId="";
  try{
    assertSameOrigin(request);
    const tenant=await currentTenant();
    if(!["owner","admin"].includes(tenant.role)) return json({error:"forbidden",message:"Keine Berechtigung."},403);
    const body=await readJson<InviteBody>(request,8192);
    const email=cleanText(body.email,320).toLowerCase();
    const role=body.role==="admin"?"admin":"member";
    if(!validEmail(email)) return json({error:"email_invalid",message:"Bitte gültige E-Mail-Adresse eingeben."},400);
    invitationId=await tenantRpc<string>("create_tenant_invitation",{p_email:email,p_role:role});
    await inviteSupabaseUser(email,{invited_tenant_id:tenant.tenantId,invited_role:role,invitation_id:invitationId});
    return json({ok:true,id:invitationId},201);
  }catch(error){
    if(invitationId){
      await privilegedSupabase("tenant_invitations?id=eq."+encodeURIComponent(invitationId),{method:"PATCH",body:{status:"revoked"}}).catch(()=>undefined);
    }
    return apiError(error);
  }
}
