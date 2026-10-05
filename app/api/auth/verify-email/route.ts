import {NextRequest} from "next/server";
import {consumeAuthToken} from "@/lib/server/auth-tokens";
import {consumeEmailCode} from "@/lib/server/email-otp";
import {createSession,endDemoSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {domainConfig} from "@/config/domain";

export const runtime="nodejs";

async function completeVerification(userId:string,email:string,organizationId?:string|null){
  const membership=await query<{organization_id:string;role:"owner"|"admin"|"finance"|"hr"|"project_manager"|"manager"|"member"|"reader";name:string;email_verified_at:Date|null}>(
    `select m.organization_id,m.role,u.display_name as name,u.email_verified_at from app_users u
      join organization_memberships m on m.user_id=u.id and m.status='active'
      where u.id=$1 and lower(u.email)=lower($2) and ($3::uuid is null or m.organization_id=$3::uuid)
      order by m.created_at asc limit 1`,[userId,email,organizationId??null]);
  const row=membership.rows[0];
  if(!row)return null;
  const firstVerification=!row.email_verified_at;
  await query("update app_users set email_verified_at=coalesce(email_verified_at,now()),updated_at=now() where id=$1",[userId]);
  if(firstVerification)await query(`update organization_subscriptions set trial_until=now()+($2||' days')::interval,updated_at=now() where organization_id=$1 and status='trial'`,[row.organization_id,String(domainConfig.trialDays)]);
  await endDemoSession();
  await createSession({userId,organizationId:row.organization_id,email,name:row.name,role:row.role});
  return {mfaSetupRequired:["owner","admin","finance"].includes(row.role)};
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    await enforceRateLimit(request,"verify-email",20,60*60_000);
    const body=asObject(await readJson(request,8192));
    let userId:string|undefined;let email:string|undefined;let organizationId:string|null|undefined;
    if(typeof body.token==="string"&&body.token.length>=20){
      const record=await consumeAuthToken("verify_email",body.token);
      if(!record?.user_id)return json({error:"invalid_or_expired_token",message:"Bestätigungslink ist ungültig oder abgelaufen."},400);
      userId=record.user_id;email=record.email;organizationId=record.organization_id;
    }else{
      email=emailField(body);
      const code=stringField(body,"code",{min:6,max:6});
      const user=await query<{id:string}>("select id from app_users where lower(email)=lower($1) and status='active' limit 1",[email]);
      if(!user.rows[0]||!await consumeEmailCode({email,purpose:"verify_email",code}))return json({error:"invalid_or_expired_code",message:"Der Code ist ungültig oder abgelaufen."},400);
      userId=user.rows[0].id;
    }
    const completed=await completeVerification(userId,email,organizationId);
    if(!completed)return json({error:"user_not_found",message:"Konto konnte nicht bestätigt werden."},400);
    return json({ok:true,mfaSetupRequired:completed.mfaSetupRequired});
  }catch(error){return apiError(error);}
}
