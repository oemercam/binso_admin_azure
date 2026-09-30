import {requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,json} from "@/lib/server/http";
export const runtime="nodejs";
export async function GET(){try{const s=await requireSession();const r=await query<{flag_key:string;enabled:boolean}>(`
 select g.key as flag_key,coalesce(o.enabled,g.enabled) as enabled
   from platform_feature_flags g
   left join organization_feature_flags o on o.flag_key=g.key and o.organization_id=$1
  order by g.key`,[s.organizationId]);return json({flags:Object.fromEntries(r.rows.map(x=>[x.flag_key,x.enabled]))})}catch(e){return apiError(e)}}
