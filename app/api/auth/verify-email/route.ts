import {NextRequest} from "next/server";
import {createHash} from "node:crypto";
import {consumeEmailCode} from "@/lib/server/email-otp";
import {createSession,endDemoSession} from "@/lib/server/session";
import {query,withTransaction} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField,stringField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {registrationHandoff,completeRegistrationVerification,type VerifiedMember} from "@/lib/server/registration";

export const runtime="nodejs";

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"verify-email",20,60*60_000);
  const body=asObject(await readJson(request,8192));
  let userId:string,email:string,completed:VerifiedMember|null;
  if(typeof body.token==='string'){
   const token=stringField(body,"token",{min:20,max:200});
   const hash=createHash("sha256").update(token).digest("hex");
   const result=await withTransaction(async client=>{
    const tokens=await client.query<{id:string;user_id:string;organization_id:string|null;email:string;consumed_at:Date|null;verified:boolean}>(
     `select t.id,t.user_id,t.organization_id,t.email,t.consumed_at,u.email_verified_at is not null as verified from auth_tokens t
      join app_users u on u.id=t.user_id and u.status='active'
      where t.token_hash=$1 and t.token_type='verify_email' and t.expires_at>now() for update of t`,[hash]);
    const record=tokens.rows[0];
    if(!record)return null;
    if(record.consumed_at)return record.verified?{alreadyVerified:true as const}:null;
    const member=await completeRegistrationVerification(client,record.user_id,record.email,record.organization_id);
    if(!member)return null;
    await client.query("update auth_tokens set consumed_at=now() where id=$1",[record.id]);
    return {alreadyVerified:false as const,userId:record.user_id,email:record.email,member};
   });
   if(!result)return json({error:"invalid_or_expired_code"},400);
   if(result.alreadyVerified)return json({ok:true,alreadyVerified:true,next:"/login"});
   ({userId,email}=result);completed=result.member;
  }else{
   email=emailField(body);const code=stringField(body,"code",{min:6,max:6});
   const user=await query<{id:string}>("select id from app_users where lower(email)=lower($1) and status='active' limit 1",[email]);
   if(!user.rows[0]||!await consumeEmailCode({email,purpose:"verify_email",code}))return json({error:"invalid_or_expired_code",message:"Der Code ist ungültig oder abgelaufen."},400);
   userId=user.rows[0].id;
   completed=await withTransaction(client=>completeRegistrationVerification(client,userId,email,null));
  }
  if(!completed)return json({error:"invalid_or_expired_code"},400);
  await endDemoSession();
  await createSession({userId,organizationId:completed.organization_id,email,name:completed.name,role:completed.role});
  return json({ok:true,...await registrationHandoff(completed.organization_id,completed.role,completed.mfa_enabled)});
 }catch(error){return apiError(error);}
}
