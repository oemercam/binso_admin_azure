import {randomUUID} from "node:crypto";
import {NextRequest} from "next/server";
import {createSession} from "@/lib/server/session";
import {apiError,assertSameOrigin,json} from "@/lib/server/http";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import {domainConfig} from "@/config/domain";
import {provisionOrganization} from "@/lib/server/provisioning";

export const runtime="nodejs";

export async function POST(request:NextRequest){
 try{
  assertSameOrigin(request);
  await enforceRateLimit(request,"demo",8,15*60_000);
  const userId=randomUUID();
  const email=`demo+${userId}@demo.binso.invalid`;
  const name="Demo Benutzer";
  const provisioned=await provisionOrganization({
    userId,email,name,companyName:"Binso Demo AG",plan:"business",mode:"demo",language:"de"
  });
  await createSession({userId,organizationId:provisioned.organizationId,email,name,role:"owner",ttlHours:domainConfig.demoSessionHours});
  return json({ok:true,onboardingComplete:true,demo:true,organizationId:provisioned.organizationId,expiresInHours:domainConfig.demoSessionHours},201);
 }catch(error){return apiError(error,request)}
}
