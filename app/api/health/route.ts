import { NextResponse } from 'next/server'
import { isDatabaseConfigured, query } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const production = process.env.NODE_ENV === 'production'
  const databaseConfigured = isDatabaseConfigured()
  let database: 'ok' | 'not_configured' | 'error' = databaseConfigured ? 'error' : 'not_configured'
  let migrations: 'ok' | 'missing' | 'unknown' = 'unknown'

  if (databaseConfigured) {
    try {
      await query('select 1 as ok')
      database = 'ok'
      const table = await query<{ name: string | null }>("select to_regclass('public.schema_migrations') as name")
      if (!table.rows[0]?.name) migrations = 'missing'
      else {
        const latest = await query<{ ok: number }>("select 1 as ok from schema_migrations where version = '0007_subscription_lifecycle.sql' limit 1")
        migrations = latest.rowCount ? 'ok' : 'missing'
      }
    } catch {
      database = 'error'
    }
  }

  const healthy = database === 'ok' && migrations === 'ok'
  const developmentHealthy = !production && database !== 'error'
  const status = healthy || developmentHealthy ? 'ok' : 'degraded'
  return NextResponse.json(
    {
      status,
      environment: process.env.NEXT_PUBLIC_APP_ENV || (production ? 'production' : 'development'),
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      database,
      migrations,
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503 },
  )
}
