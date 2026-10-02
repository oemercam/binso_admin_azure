import { NextRequest } from "next/server";
import { apiError, assertSameOrigin, json, readJson } from "@/lib/server/http";
import { fetchUser, setAuthCookies, TokenResponse } from "@/lib/server/auth";
import { isBackendConfigured } from "@/lib/server/env";

type Body={accessToken?:unknown;refreshToken?:unknown;expiresIn?:unknown};

export async function POST(request:NextRequest){
  try{
    if(!isBackendConfigured()) return json({error:"backend_not_configured",message:"Backend ist noch nicht konfiguriert."},503);
    assertSameOrigin(request);
    const body=await readJson<Body>(request,16384);
    const accessToken=typeof body.accessToken==="string"?body.accessToken:"";
    const refreshToken=typeof body.refreshToken==="string"?body.refreshToken:"";
    const expiresIn=Number(body.expiresIn);
    if(!accessToken||!refreshToken||!Number.isFinite(expiresIn)) return json({error:"recovery_invalid",message:"Link ist ungültig oder abgelaufen."},400);
    const user=await fetchUser(accessToken);
    const response=json({ok:true});
    setAuthCookies(response,{access_token:accessToken,refresh_token:refreshToken,expires_in:expiresIn,user} as TokenResponse);
    return response;
  }catch(error){return apiError(error);}
}
