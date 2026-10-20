import {randomUUID,timingSafeEqual} from "node:crypto";
import {env} from "@/lib/server/env";
import {provisionOrganization} from "@/lib/server/provisioning";
import {createSession,destroySession,getSession} from "@/lib/server/session";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { ApiError,assertSameOrigin, apiError, json } from "@/lib/server/http";

const demoCookie="binso_demo";
const demoMaxAge=60*60*24;

export async function GET(){
  const store=await cookies();
  const marked=store.get(demoCookie)?.value==="1";
  const active=marked&&(!env.databaseUrl||(await getSession())?.isDemo===true);
  return json({active,mode:"demo"},200);
}

export async function POST(request:NextRequest){
  try{
    assertSameOrigin(request);
    // Preserve only the existing isolated smoke/QA entry, never public provisioning.
    const provided=request.headers.get('x-binso-smoke-test');
    const expected=env.smokeTestToken;
    if(!provided||!expected||Buffer.byteLength(provided)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(provided),Buffer.from(expected))){
      throw new ApiError(404,'demo_unavailable','Der öffentliche Demo-Zugang ist nicht verfügbar.');
    }
    let databaseBacked=false;
    if(env.databaseUrl){
      const current=await getSession();
      const reset=request.nextUrl.searchParams.get('reset')==='1';
      if(!current?.isDemo||reset){
        const userId='demo-'+randomUUID(),email='nina.mueller.'+userId.slice(-8)+'@demo.example.invalid';
        const created=await provisionOrganization({userId,email,name:'Nina Müller',companyName:'Alpenblick Digital AG',plan:'business',mode:'demo'});
        if(reset&&current?.isDemo)await destroySession('binso_demo_write');
        await createSession({userId,organizationId:created.organizationId,email,name:'Nina Müller',role:'owner',ttlHours:24,cookieName:'binso_demo_write'});
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
