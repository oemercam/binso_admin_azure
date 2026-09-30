import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import {withTransaction} from "@/lib/server/db";
import {hashPassword} from "@/lib/server/password";
import {createSession} from "@/lib/server/session";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {addHours,domainConfig} from "@/config/domain";
import {demoRecordFixtures} from "@/lib/demo/fixtures";

export const runtime="nodejs";

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"demo",8,15*60_000);
  const organizationId=randomUUID();
  const userId=randomUUID();
  const email=`demo+${userId}@demo.binso.invalid`;
  const name="Demo Benutzer";
  const passwordHash=await hashPassword(randomUUID()+randomUUID());
  const expiresAt=addHours(new Date(),domainConfig.demoSessionHours);
  await withTransaction(async client=>{
   await client.query(`delete from organizations where uid='DEMO' and trial_ends_at<now()`);
   await client.query(`insert into organizations(id,name,uid,plan,billing_cycle,subscription_status,trial_ends_at,onboarding_complete) values($1,'Binso Demo AG','DEMO','business','monthly','trial',$2,true)`,[organizationId,expiresAt]);
   await client.query(`insert into users(id,organization_id,name,email,password_hash,role,active,email_verified_at) values($1,$2,$3,$4,$5,'owner',true,now())`,[userId,organizationId,name,email,passwordHash]);

   // records is protected by FORCE ROW LEVEL SECURITY. Establish the same
   // tenant/user context used by normal authenticated record operations before
   // seeding demo data. Do not bypass RLS for demo creation.
   await client.query(`select set_config('app.organization_id',$1,true)`,[organizationId]);
   await client.query(`select set_config('app.user_id',$1,true)`,[userId]);

   for(const item of demoRecordFixtures){
    await client.query(`insert into records(organization_id,module,status,row_data,fields,metadata,created_by,updated_by) values($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$7)`,[organizationId,item.module,item.status,JSON.stringify(item.row),JSON.stringify(item.fields),JSON.stringify({demo:true}),userId]);
   }
  });
  await createSession({userId,organizationId,email,name,role:"owner",ttlHours:domainConfig.demoSessionHours});
  return json({ok:true,onboardingComplete:true,demo:true,expiresInHours:domainConfig.demoSessionHours},201);
 }catch(error){return apiError(error,request)}
}
