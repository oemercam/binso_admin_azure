import 'server-only'
import type { PoolClient } from 'pg'

export type DocumentCounterKind='customer'|'quote'|'order'|'invoice'|'contract'|'credit_note'

export async function allocateDocumentNumber(client:PoolClient,input:{organizationId:string;kind:DocumentCounterKind;prefix:string;period?:string;padding?:number}){
  const padding=Math.max(1,Math.min(12,input.padding??5))
  await client.query(`insert into business_document_counters(organization_id,kind,period,prefix,next_value) values($1,$2,$3,$4,1) on conflict(organization_id,kind,period) do nothing`,[input.organizationId,input.kind,input.period??'',input.prefix])
  const r=await client.query<{allocated:string;prefix:string}>(`update business_document_counters set next_value=next_value+1,updated_at=now() where organization_id=$1 and kind=$2 and period=$3 returning (next_value-1)::text as allocated,prefix`,[input.organizationId,input.kind,input.period??''])
  if(!r.rows[0]) throw new Error('counter_allocation_failed')
  return `${r.rows[0].prefix}${r.rows[0].allocated.padStart(padding,'0')}`
}
