import {randomUUID} from "node:crypto";
import {env} from "@/lib/server/env";
import {provisionOrganization} from "@/lib/server/provisioning";
import {createSession,destroySession,getSession} from "@/lib/server/session";
import {enforceRateLimit} from "@/lib/server/rate-limit";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { assertSameOrigin, apiError, json } from "@/lib/server/http";

const demoCookie="binso_demo";
const demoMaxAge=60*60*24;

export async function GET(){
  const store=await cookies();
  return json({active:store.get(demoCookie)?.value==="1",mode:"demo"},200);
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    let databaseBacked=false;
    if(env.databaseUrl){
      const current=await getSession();
      if(!current?.isDemo){
        const smokeToken=request.headers.get("x-binso-smoke-test");
        const trustedSmoke=Boolean(env.smokeTestToken&&smokeToken&&smokeToken===env.smokeTestToken);
        if(!trustedSmoke)await enforceRateLimit(request,'demo-provision',10,60*60*1000);
        const userId='demo-'+randomUUID(),email=userId+'@example.invalid';
        const created=await provisionOrganization({userId,email,name:'Demo Benutzer',companyName:'Demo',plan:'business',mode:'demo'});
        await createSession({userId,organizationId:created.organizationId,email,name:'Demo Benutzer',role:'owner',ttlHours:24,cookieName:'binso_demo_write'});
      }
      databaseBacked=true;
    }
    const response=json({ok:true,active:true,mode:"demo",databaseBacked,expiresIn:demoMaxAge});
    response.cookies.set(demoCookie,"1",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:demoMaxAge,
    });
    return response;
  }catch(error){return apiError(error);}
}

export async function DELETE(request:NextRequest){
  try{
    assertSameOrigin(request);
    await destroySession("binso_demo_write");
    const response=json({ok:true,active:false,mode:"demo"});
    response.cookies.set(demoCookie,"",{
      httpOnly:true,
      secure:process.env.NODE_ENV==="production",
      sameSite:"lax",
      path:"/",
      maxAge:0,
    });
    return response;
  }catch(error){return apiError(error);}
}
