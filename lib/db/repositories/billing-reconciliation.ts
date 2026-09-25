import 'server-only'
import { withPlatformTransaction } from '@/lib/db/client'

export async function reconcileBillingState(){
  return withPlatformTransaction(async client=>{
    const run=await client.query<{id:string}>(`insert into billing_reconciliation_runs(status) values('running') returning id`)
    const runId=run.rows[0].id
    try{
      const checked=await client.query<{count:string}>(`select count(*)::text count from organization_subscriptions`)
      const repaired=await client.query(`update platform_tenants pt set
        seats=s.seats,
        monthly_revenue_chf=case when s.status='active' then s.unit_amount_chf else 0 end,
        platform_status=case when pt.platform_status='suspended' then 'suspended' else s.status end
        from organization_subscriptions s
        where s.organization_id=pt.organization_id and (pt.seats is distinct from s.seats or pt.monthly_revenue_chf is distinct from case when s.status='active' then s.unit_amount_chf else 0 end or (pt.platform_status<>'suspended' and pt.platform_status is distinct from s.status))`)
      await client.query(`update billing_webhook_events set next_retry_at=coalesce(next_retry_at,now()+interval '15 minutes') where status='failed' and attempts<5 and dead_lettered_at is null`)
      await client.query(`update billing_webhook_events set dead_lettered_at=coalesce(dead_lettered_at,now()),next_retry_at=null where status='failed' and attempts>=5 and dead_lettered_at is null`)
      await client.query(`update billing_reconciliation_runs set status='completed',checked_subscriptions=$2,repaired_subscriptions=$3,completed_at=now() where id=$1`,[runId,Number(checked.rows[0]?.count??0),repaired.rowCount??0])
      return {runId,checked:Number(checked.rows[0]?.count??0),repaired:repaired.rowCount??0}
    }catch(error){
      await client.query(`update billing_reconciliation_runs set status='failed',detail=$2,completed_at=now() where id=$1`,[runId,error instanceof Error?error.message.slice(0,1000):'unknown'])
      throw error
    }
  })
}
