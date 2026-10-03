import { NextRequest } from "next/server";
import { apiError, cleanText, json, readJson } from "@/lib/server/http";
import { enforcePublicRateLimit } from "@/lib/server/rate-limit";
import { query } from "@/lib/server/db";

type Body={name?:unknown;value?:unknown;rating?:unknown;route?:unknown};
const metrics=new Set(["CLS","FCP","INP","LCP","TTFB"]);
const ratings=new Set(["good","needs-improvement","poor"]);

export async function POST(request:NextRequest){
  try{
    await enforcePublicRateLimit(request,"telemetry.web_vitals");
    const body=await readJson<Body>(request,2048);
    const metric=cleanText(body.name,8).toUpperCase();
    const value=Number(body.value);
    const rating=cleanText(body.rating,32);
    const route=cleanText(body.route,160);
    if(!metrics.has(metric)||!Number.isFinite(value)||value<0||!ratings.has(rating)||!route.startsWith("/")) return json({ok:false},400);
    await query("insert into web_vitals(metric,value,rating,route) values($1,$2,$3,$4)",[metric,value,rating,route]);
    return json({ok:true},202);
  }catch(error){return apiError(error);}
}
