import { NextRequest } from "next/server";
import { apiError, json, readJson } from "@/lib/server/http";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { query } from "@/lib/server/db";
import {validWebVital} from '@/lib/web-vitals';
export async function POST(request:NextRequest){
 try{
  await enforceRateLimit(request,"web-vitals",120,60_000);
  const body=await readJson<unknown>(request,2048);
  if(!validWebVital(body))return json({ok:false},400);
  await query("insert into web_vitals(metric,value,rating,route,created_at) values($1,$2,$3,$4,now())",[body.name,body.value,body.rating,body.route]);
  return json({ok:true},202);
 }catch(error){return apiError(error);}
}
