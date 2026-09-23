import 'server-only'
import { query } from '@/lib/db/client'

export async function recordApplicationEvent(input: {
  severity: 'info' | 'warning' | 'error'
  area: string
  code: string
  message: string
  organizationId?: string | null
  userId?: string | null
  requestId?: string | null
  detail?: Record<string, unknown>
}) {
  try {
    await query(
      `insert into application_events (severity, area, code, message, organization_id, user_id, request_id, detail)
       values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
      [input.severity, input.area, input.code, input.message, input.organizationId ?? null, input.userId ?? null, input.requestId ?? null, JSON.stringify(input.detail ?? {})],
    )
  } catch {
    // Monitoring must never break the primary request path.
  }
}
