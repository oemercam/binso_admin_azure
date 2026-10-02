import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { setAuthCookies, signUp, TokenResponse } from "@/lib/server/auth";
import { isBackendConfigured } from "@/lib/server/env";
import { enforcePublicRateLimit } from "@/lib/server/rate-limit";

type RegisterBody={companyName?:unknown;email?:unknown;password?:unknown};

export async function POST(request:NextRequest){
  try{
    if(!isBackendConfigured()) return json({error:"backend_not_configured",message:"Backend ist noch nicht konfiguriert."},503);
    assertSameOrigin(request);
    const body=await readJson<RegisterBody>(request,8192);
    const companyName=cleanText(body.companyName,160);
    const email=cleanText(body.email,320).toLowerCase();
    const password=typeof body.password==="string"?body.password:"";
    await enforcePublicRateLimit(request,"auth.register",email,{windowSeconds:3600,ipLimit:10,identityLimit:5});
    if(companyName.length<2) return json({error:"company_required",message:"Bitte Firmennamen eingeben."},400);
    if(!validEmail(email)) return json({error:"email_invalid",message:"Bitte gültige E-Mail-Adresse eingeben."},400);
    if(password.length<8) return json({error:"password_too_short",message:"Das Passwort muss mindestens 8 Zeichen haben."},400);
    const result=await signUp(email,password,companyName);
    const response=json({ok:true,requiresConfirmation:!result.access_token,user:result.user ? {id:result.user.id,email:result.user.email}:null});
    if(result.access_token&&result.refresh_token&&result.expires_in&&result.user) setAuthCookies(response,result as TokenResponse);
    return response;
  }catch(error){return apiError(error);}
}
