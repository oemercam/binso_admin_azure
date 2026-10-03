import "server-only";
import type { PoolClient } from "pg";

export async function audit(client:PoolClient,input:{
  organizationId:string;userId?:string;userName?:string;action:string;entityType:string;entityId?:string;metadata?:Record<string,unknown>
}){
 const detail=input.metadata&&Object.keys(input.metadata).length?JSON.stringify(input.metadata):null;
 await client.query(
   `insert into audit_events (organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
    values ($1,$2,$3,$4,$5,$6,$7)`,
   [input.organizationId,input.userId||"system",input.userName||"System",input.action,input.entityType,input.entityId||null,detail]
 );
}
