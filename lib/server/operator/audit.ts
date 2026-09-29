import "server-only";
import { query } from "@/lib/server/db";
export async function platformAudit(input:{userId?:string;action:string;entityType:string;entityId?:string;metadata?:Record<string,unknown>}){
 await query(`insert into platform_audit_logs (platform_user_id,action,entity_type,entity_id,metadata) values ($1,$2,$3,$4,$5::jsonb)`,[input.userId||null,input.action,input.entityType,input.entityId||null,JSON.stringify(input.metadata||{})]);
}
