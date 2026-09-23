import { NextResponse } from 'next/server'
import { isDatabaseConfigured, query } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const databaseConfigured = isDatabaseConfigured()
  let database: 'ok' | 'not_configured' | 'error' = databaseConfigured ? 'error' : 'not_configured'

  if (databaseConfigured) {
    try {
      await query('select 1 as ok')
      database = 'ok'
    } catch {
      database = 'error'
    }
  }

  const healthy = database !== 'error'
  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    },
    { status: healthy ? 200 : 503 },
  )
}
