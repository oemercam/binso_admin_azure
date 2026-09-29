import {requireSession} from "@/lib/server/session";
import {query} from "@/lib/server/db";
import {apiError,json} from "@/lib/server/http";

export const runtime="nodejs";

export async function GET(){
  try{
    const s=await requireSession();
    const r=await query<{flag_key:string;enabled:boolean}>(
      `select distinct on(flag_key) flag_key,enabled
       from feature_flags
       where organization_id is null or organization_id=$1
       order by flag_key,(organization_id is not null) desc,updated_at desc`,
      [s.organizationId]
    );
    return json({flags:Object.fromEntries(r.rows.map(x=>[x.flag_key,x.enabled]))});
  }catch(e){
    return apiError(e);
  }
}
