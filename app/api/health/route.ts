import { query } from "@/lib/server/db";
import { env } from "@/lib/server/env";
export const runtime="nodejs";
export async function GET(){
 let database:"disabled"|"ok"|"error"="disabled";
 if(env.databaseUrl){
  try{await query("select 1");database="ok"}catch{database="error"}
 }
 return Response.json({status:database==="error"?"degraded":"ok",service:"binso-one",version:process.env.NEXT_PUBLIC_APP_VERSION||"1.2.0",mode:env.appMode,database,timestamp:new Date().toISOString()},{status:database==="error"?503:200,headers:{"cache-control":"no-store"}});
}
