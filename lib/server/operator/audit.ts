import "server-only";
import type {PoolClient} from "pg";
import {query} from "@/lib/server/db";
export async function platformAudit(input:{userId?:string;userEmail?:string;action:string;entityType:string;entityId?:string;tenantId?:string;metadata?:Record<string,unknown>},client?:Pick<PoolClient,"query">){
 const execute=client?(text:string,values:unknown[])=>client.query(text,values):query;
 await execute(`insert into platform_audit_events(actor_user_id,actor_email,action,tenant_id,entity_type,entity_id,metadata,detail) values($1,$2,$3,$4,$5,$6,$7::jsonb,$8)`,[
  input.userId||"system",input.userEmail||"system@binso.ch",input.action,input.tenantId||null,input.entityType,input.entityId||null,JSON.stringify(input.metadata||{}),input.metadata?JSON.stringify(input.metadata):null
 ]);
}
