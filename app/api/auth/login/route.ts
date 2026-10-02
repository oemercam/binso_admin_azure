import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, cleanText, json, readJson, validEmail } from "@/lib/server/http";
import { passwordLogin, setAuthCookies } from "@/lib/server/auth";
import { isBackendConfigured } from "@/lib/server/env";

type LoginBody={email?:unknown;password?:unknown};

export async function POST(request:NextRequest){
  try{
    if(!isBackendConfigured()) return json({error:"backend_not_configured",message:"Backend ist noch nicht konfiguriert."},503);
    assertSameOrigin(request);
    const body=await readJson<LoginBody>(request,8192);
    const email=cleanText(body.email,320).toLowerCase();
    const password=typeof body.password==="string"?body.password:"";
    if(!validEmail(email)||password.length<8) return json({error:"invalid_credentials",message:"E-Mail oder Passwort ist nicht korrekt."},400);
    const session=await passwordLogin(email,password);
    const response=json({ok:true,user:{id:session.user.id,email:session.user.email}});
    setAuthCookies(response,session);
    return response;
  }catch(error){return apiError(error);}
}
