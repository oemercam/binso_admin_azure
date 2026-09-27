import 'server-only'
import { createHash } from 'node:crypto'
import type { PoolClient } from 'pg'

export function requestHash(value:unknown){return createHash('sha256').update(JSON.stringify(value)).digest('hex')}

export async function claimIdempotency(client:PoolClient,input:{organizationId:string;operation:string;key:string;requestHash:string;userId:string}){
  const r=await client.query<{request_hash:string;response_json:unknown}>(`insert into business_idempotency_keys(organization_id,operation,idempotency_key,request_hash,created_by_user_id,expires_at)
    values($1,$2,$3,$4,$5,now()+interval '7 days') on conflict(organization_id,operation,idempotency_key) do update set idempotency_key=excluded.idempotency_key returning request_hash,response_json`,[input.organizationId,input.operation,input.key,input.requestHash,input.userId])
  const row=r.rows[0]
  if(row.request_hash!==input.requestHash) throw new Error('idempotency_conflict')
  return row.response_json
}

export async function completeIdempotency(client:PoolClient,input:{organizationId:string;operation:string;key:string;response:unknown}){
  await client.query('update business_idempotency_keys set response_json=$4::jsonb where organization_id=$1 and operation=$2 and idempotency_key=$3',[input.organizationId,input.operation,input.key,JSON.stringify(input.response)])
}
