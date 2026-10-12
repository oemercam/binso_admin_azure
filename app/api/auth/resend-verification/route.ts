import {NextRequest} from "next/server";
import {registrationLocale} from "@/lib/server/mail-i18n";
import {sendRegistrationVerification} from "@/lib/server/registration";
import {query,withTransaction} from "@/lib/server/db";
import {apiError,assertSameOrigin,json,readJson} from "@/lib/server/http";
import {asObject,emailField} from "@/lib/server/validation";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"resend-email-verification",4,60*60_000);
  const body=asObject(await readJson(request,8192));
  const email=emailField(body);
  const identity=(await query<{id:string}>("select id from app_users where lower(email)=lower($1) and status='active' limit 1",[email])).rows[0];
  const row=identity?await withTransaction(async client=>{
   await client.query("select set_config('app.user_id',$1,true)",[identity.id]);
   return (await client.query<{id:string;organization_id:string;language:string|null;email_verified_at:Date|null}>(
    `select u.id,m.organization_id,u.language,u.email_verified_at from app_users u
     join organization_memberships m on m.user_id=u.id and m.status='active'
     where u.id=$1 and u.status='active' order by m.created_at asc limit 1`,[identity.id])).rows[0];
  }):null;
  if(row&&!row.email_verified_at)await sendRegistrationVerification({email,userId:row.id,organizationId:row.organization_id,locale:registrationLocale(row.language)});
  // Do not expose account existence or delivery through this public endpoint.
  return json({ok:true,deliveryUnconfirmed:true});
 }catch(error){return apiError(error);}
}
