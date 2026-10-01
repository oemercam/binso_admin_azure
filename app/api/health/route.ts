import {query} from "@/lib/server/db";
import {siteConfig} from "@/lib/site-config";
export const runtime="nodejs";
export async function GET(){
 let ok=true;
 try{await query("select 1")}catch{ok=false}
 return Response.json({status:ok?"ok":"degraded",service:"binso-one",version:siteConfig.version,build:siteConfig.buildCommit,timestamp:new Date().toISOString()},{status:ok?200:503,headers:{"cache-control":"no-store"}});
}
