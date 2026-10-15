import "server-only";
import {createHash} from "node:crypto";
import {NextRequest} from "next/server";
import {env} from "@/lib/server/env";
import {query} from "@/lib/server/db";
import {limitsConfig} from "@/config/limits";

type Bucket={count:number;resetAt:number};const buckets=new Map<string,Bucket>();
let nextExpiry=Infinity;
function ip(request:NextRequest){return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||request.headers.get("x-real-ip")||"unknown"}
function bucketKey(request:NextRequest,scope:string){return createHash("sha256").update(`${scope}:${ip(request)}`).digest("hex")}
export async function enforceRateLimit(request:NextRequest,scope:string,limit:number,windowMs:number){
 const key=bucketKey(request,scope);const now=Date.now();
 if(env.appMode==="production"&&env.databaseUrl){
   const seconds=Math.ceil(windowMs/1000);const r=await query<{count:number;reset_at:Date}>(`insert into rate_limit_buckets(bucket_key,count,reset_at) values($1,1,now()+($2||' seconds')::interval) on conflict(bucket_key) do update set count=case when rate_limit_buckets.reset_at<=now() then 1 else rate_limit_buckets.count+1 end,reset_at=case when rate_limit_buckets.reset_at<=now() then now()+($2||' seconds')::interval else rate_limit_buckets.reset_at end,updated_at=now() returning count,reset_at`,[key,String(seconds)]);const b=r.rows[0];if(b&&b.count>limit)throw new Response("Too Many Requests",{status:429,headers:{"retry-after":String(Math.max(1,Math.ceil((new Date(b.reset_at).getTime()-now)/1000)))}});return;
 }
 // Prune at the earliest known expiry, including the new-key path. Never evict
 // active buckets: eviction would let a flood reset another caller's limit.
 if(now>=nextExpiry){
  nextExpiry=Infinity;
  for(const [storedKey,bucket] of buckets){
   if(bucket.resetAt<=now)buckets.delete(storedKey);
   else nextExpiry=Math.min(nextExpiry,bucket.resetAt);
  }
 }
 const current=buckets.get(key);
 if(!current){
  if(buckets.size>=limitsConfig.rateLimitMemoryBuckets)throw new Response("Too Many Requests",{status:429,headers:{"retry-after":String(Math.max(1,Math.ceil((nextExpiry-now)/1000)))}});
  const resetAt=now+windowMs;buckets.set(key,{count:1,resetAt});nextExpiry=Math.min(nextExpiry,resetAt);return;
 }
 if(current.count>=limit)throw new Response("Too Many Requests",{status:429,headers:{"retry-after":String(Math.max(1,Math.ceil((current.resetAt-now)/1000)))}});
 current.count++;
}
