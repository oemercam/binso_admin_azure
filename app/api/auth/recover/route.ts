import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { requestPasswordRecovery } from "@/lib/server/auth";
import { getBackendEnv, isBackendConfigured } from "@/lib/server/env";

type Body={email?:unknown};

export async function POST(request:NextRequest){
  try{
    if(!isBackendConfigured()) return json({error:"backend_not_configured",message:"Backend ist noch nicht konfiguriert."},503);
    assertSameOrigin(request);
    const body=await readJson<Body>(request,8192);
    const email=cleanText(body.email,320).toLowerCase();
    if(!validEmail(email)) return json({error:"email_invalid",message:"Bitte gültige E-Mail-Adresse eingeben."},400);
    const {appUrl}=getBackendEnv();
    await requestPasswordRecovery(email,appUrl+"/passwort-zuruecksetzen");
    // Uniform response avoids revealing whether the account exists.
    return json({ok:true,message:"Falls ein Konto existiert, wurde ein Link gesendet."});
  }catch(error){
    // Recovery endpoint intentionally returns the same public outcome for provider-side account lookup errors.
    if(error instanceof Error && error.message==="Link konnte nicht gesendet werden.") return json({ok:true,message:"Falls ein Konto existiert, wurde ein Link gesendet."});
    return apiError(error);
  }
}
