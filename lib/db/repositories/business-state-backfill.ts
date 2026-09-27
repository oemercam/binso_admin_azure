import 'server-only'
import { platformQuery } from '@/lib/db/client'
import { withTenantTransaction } from '@/lib/db/tenant'
import { persistNormalizedCoreState, removeNormalizedCoreFromLegacyState } from '@/lib/db/repositories/normalized-business-state'

export async function backfillNormalizedBusinessState(options:{dryRun:boolean;organizationId?:string|null}) {
  const values:unknown[]=[]
  const where=options.organizationId ? (values.push(options.organizationId),' where organization_id=$1') : ''
  const rows=await platformQuery<{organization_id:string;state:Record<string,unknown>;version:string}>(`select organization_id,state,version::text from tenant_business_state${where} order by organization_id`,values)
  const result={dryRun:options.dryRun,tenants:rows.rowCount??0,migrated:0,skipped:0,failed:0,errors:[] as {organizationId:string;code:string}[]}
  for(const row of rows.rows){
    const state=row.state??{}
    const hasCore=['customers','customerContacts','quotes','orders','timeEntries','invoices','payments','employees','contracts','suppliers','supplierInvoices','expenses','creditNotes','customerActivities'].some((key)=>Array.isArray(state[key])&&state[key].length>0)
    if(!hasCore){result.skipped++;continue}
    if(options.dryRun){result.migrated++;continue}
    try{
      await withTenantTransaction({organizationId:row.organization_id,userId:'v82-backfill'},async(client)=>{
        await persistNormalizedCoreState(client,row.organization_id,state)
        await client.query('update tenant_business_state set state=$2::jsonb,updated_at=now() where organization_id=$1',[row.organization_id,JSON.stringify(removeNormalizedCoreFromLegacyState(state))])
        await client.query(`insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,detail) values($1,'v82-backfill','System','business.normalized_backfill','business_state','V82 normalized core backfill')`,[row.organization_id])
      })
      result.migrated++
    }catch(error){result.failed++;result.errors.push({organizationId:row.organization_id,code:error instanceof Error?error.message:'unknown'})}
  }
  return result
}
