import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import {withTransaction} from "@/lib/server/db";
import {hashPassword} from "@/lib/server/password";
import {createSession} from "@/lib/server/session";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";

export const runtime="nodejs";

const demoRows=[
 {module:"kunden",status:"Aktiv",row:["Alpina Architektur AG","Zürich","kontakt@alpina-demo.ch","Aktiv"],fields:{name:"Alpina Architektur AG",city:"Zürich",email:"kontakt@alpina-demo.ch"}},
 {module:"offerten",status:"Offen",row:["OF-2026-1042","Alpina Architektur AG","CHF 12’480","Offen"],fields:{number:"OF-2026-1042",customer:"Alpina Architektur AG",amount:"12480"}},
 {module:"auftraege",status:"In Bearbeitung",row:["AU-2026-0871","Bergwerk Digital AG","CHF 28’900","In Bearbeitung"],fields:{number:"AU-2026-0871",customer:"Bergwerk Digital AG",amount:"28900"}},
 {module:"rechnungen",status:"Offen",row:["RE-2026-0318","Alpina Architektur AG","CHF 7’820","Offen"],fields:{number:"RE-2026-0318",customer:"Alpina Architektur AG",amount:"7820"}},
 {module:"projekte",status:"Aktiv",row:["Website Relaunch","Bergwerk Digital AG","42 h","Aktiv"],fields:{name:"Website Relaunch",customer:"Bergwerk Digital AG",hours:"42"}}
];

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"demo",8,15*60_000);
  const organizationId=randomUUID();
  const userId=randomUUID();
  const email=`demo+${userId}@demo.binso.invalid`;
  const name="Demo Benutzer";
  const passwordHash=await hashPassword(randomUUID()+randomUUID());
  await withTransaction(async client=>{
   await client.query(`delete from organizations where uid='DEMO' and trial_ends_at<now()`);
   await client.query(`insert into organizations(id,name,uid,plan,billing_cycle,subscription_status,trial_ends_at,onboarding_complete) values($1,'Binso Demo AG','DEMO','business','monthly','trial',now()+interval '24 hours',true)`,[organizationId]);
   await client.query(`insert into users(id,organization_id,name,email,password_hash,role,active,email_verified_at) values($1,$2,$3,$4,$5,'owner',true,now())`,[userId,organizationId,name,email,passwordHash]);

   // records is protected by FORCE ROW LEVEL SECURITY. Establish the same
   // tenant/user context used by normal authenticated record operations before
   // seeding demo data. Do not bypass RLS for demo creation.
   await client.query(`select set_config('app.organization_id',$1,true)`,[organizationId]);
   await client.query(`select set_config('app.user_id',$1,true)`,[userId]);

   for(const item of demoRows){
    await client.query(`insert into records(organization_id,module,status,row_data,fields,metadata,created_by,updated_by) values($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$7)`,[organizationId,item.module,item.status,JSON.stringify(item.row),JSON.stringify(item.fields),JSON.stringify({demo:true}),userId]);
   }
  });
  await createSession({userId,organizationId,email,name,role:"owner"});
  return json({ok:true,onboardingComplete:true,demo:true,expiresInHours:24},201);
 }catch(error){return apiError(error,request)}
}
