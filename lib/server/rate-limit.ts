import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { ApiError } from "./http";
import { getBackendEnv, isBackendConfigured } from "./env";

type RateConfig={
  windowSeconds:number;
  ipLimit:number;
  identityLimit?:number;
};

function fingerprint(value:string){
  const secret=process.env.RATE_LIMIT_SECRET;
  return secret
    ? crypto.createHmac("sha256",secret).update(value,"utf8").digest("hex")
    : crypto.createHash("sha256").update(value,"utf8").digest("hex");
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

async function consume(route:string,key:string,limit:number,windowSeconds:number){
  if(!isBackendConfigured()) return true;
  const {supabaseUrl,supabaseAnonKey}=getBackendEnv();
  const response=await fetch(supabaseUrl+"/rest/v1/rpc/consume_api_rate_limit",{
    method:"POST",
    headers:{
      apikey:supabaseAnonKey,
      Authorization:"Bearer "+supabaseAnonKey,
      "Content-Type":"application/json",
    },
    body:JSON.stringify({
      p_route:route,
      p_key_hash:fingerprint(key),
      p_limit:limit,
      p_window_seconds:windowSeconds,
    }),
    cache:"no-store",
  });
  if(!response.ok){
    console.error("Rate limit backend failed",response.status);
    throw new ApiError(503,"rate_limit_unavailable","Anmeldung ist vorübergehend nicht verfügbar.");
  }
  return response.json() as Promise<boolean>;
}

export async function enforcePublicRateLimit(
  request:NextRequest,
  route:string,
  identity:string|undefined,
  config:RateConfig,
){
  const ip=clientIp(request);
  const ipAllowed=await consume(route+":ip","ip|"+ip,config.ipLimit,config.windowSeconds);
  if(!ipAllowed) throw new ApiError(429,"rate_limited","Zu viele Versuche. Bitte später erneut versuchen.");

  if(identity&&config.identityLimit){
    const normalized=identity.trim().toLowerCase().slice(0,320);
    const identityAllowed=await consume(route+":identity","identity|"+normalized,config.identityLimit,config.windowSeconds);
    if(!identityAllowed) throw new ApiError(429,"rate_limited","Zu viele Versuche. Bitte später erneut versuchen.");
  }
}
