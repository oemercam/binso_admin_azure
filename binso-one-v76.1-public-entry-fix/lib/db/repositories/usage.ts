import 'server-only'
import { withTenantTransaction } from '@/lib/db/tenant'
import type { UsageCounter } from '@/types/domain'

export async function incrementUsage(input: {
  organizationId: string
  userId: string
  period: string
  metric: UsageCounter['metric']
  amount?: number
}) {
  return withTenantTransaction({ organizationId: input.organizationId, userId: input.userId }, async (client) => {
    const amount = Math.max(0, Math.trunc(input.amount ?? 1))
    const result = await client.query<{ value: string; updated_at: Date }>(
      `insert into organization_usage_counters(organization_id,period,metric,value)
       values($1,$2,$3,$4)
       on conflict(organization_id,period,metric)
       do update set value=organization_usage_counters.value + excluded.value, updated_at=now()
       returning value::text,updated_at`,
      [input.organizationId, input.period, input.metric, amount],
    )
    return { organizationId: input.organizationId, period: input.period, metric: input.metric, value: Number(result.rows[0].value), updatedAt: result.rows[0].updated_at.toISOString() } satisfies UsageCounter
  })
}
