import "server-only";
import type { PoolClient } from "pg";

export async function audit(client:PoolClient,input:{
  organizationId:string;userId?:string;action:string;entityType:string;entityId?:string;metadata?:Record<string,unknown>
}){
  await client.query(
    `insert into audit_logs (organization_id,user_id,action,entity_type,entity_id,metadata)
     values ($1,$2,$3,$4,$5,$6::jsonb)`,
    [input.organizationId,input.userId||null,input.action,input.entityType,input.entityId||null,JSON.stringify(input.metadata||{})]
  );
}
