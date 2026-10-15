import "server-only";
import {env} from "@/lib/server/env";
import {query} from "@/lib/server/db";
export type MaintenanceState={enabled:boolean;endsAt:string|null};
/** No process cache: changes take effect across all workers after commit. */
export async function maintenanceState():Promise<MaintenanceState>{
 if(env.appMode!=="production"&&!env.databaseUrl)return {enabled:false,endsAt:null};
 const result=await query<{enabled:boolean;endsAt:string|null}>(`select enabled and ends_at>now() as enabled,ends_at as "endsAt" from platform_maintenance where id=1`);
 return result.rows[0]??{enabled:false,endsAt:null};
}
