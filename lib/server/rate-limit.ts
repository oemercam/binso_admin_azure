import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { ApiError } from "./http";
import { isBackendConfigured } from "./env";
import { privilegedSupabase } from "./service-role";

function fingerprint(value:string){
  const secret=process.env.RATE_LIMIT_SECRET;
  if(!secret) throw new ApiError(503,"rate_limit_not_configured","Sicherheitskonfiguration ist unvollständig.",{"Retry-After":"60"});
  return crypto.createHmac("sha256",secret).update(value,"utf8").digest("hex");
}

function clientIp(request:NextRequest){
  const forwarded=request.headers.get("x-forwarded-for");
  if(forwarded){
    const first=forwarded.split(",")[0]?.trim();
    if(first) return first.slice(0,128);
  }
  const real=request.headers.get("x-real-ip")?.trim();
  return real?real.slice(0,128):"unknown";
}

async function consume(route:string,key:string){
  if(!isBackendConfigured()) return true;
  try{
    return await privilegedSupabase<boolean>("rpc/consume_api_rate_limit",{
      method:"POST",
      body:{p_route:route,p_key_hash:fingerprint(key)},
    });
  }catch(error){
    if(error instanceof ApiError) throw error;
    throw new ApiError(503,"rate_limit_unavailable","Anmeldung ist vorübergehend nicht verfügbar.",{"Retry-After":"60"});
  }
}

export async function enforcePublicRateLimit(request:NextRequest,route:"auth.login"|"auth.register"|"auth.recover",identity?:string){
  const retryAfter=route==="auth.login"?"900":"3600";
  const ipAllowed=await consume(route+":ip","ip|"+clientIp(request));
  if(!ipAllowed) throw new ApiError(429,"rate_limited","Zu viele Versuche. Bitte später erneut versuchen.",{"Retry-After":retryAfter});

  if(identity){
    const normalized=identity.trim().toLowerCase().slice(0,320);
    const identityAllowed=await consume(route+":identity","identity|"+normalized);
    if(!identityAllowed) throw new ApiError(429,"rate_limited","Zu viele Versuche. Bitte später erneut versuchen.",{"Retry-After":retryAfter});
  }
}
