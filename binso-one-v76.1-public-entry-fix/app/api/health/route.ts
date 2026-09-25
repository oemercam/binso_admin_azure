import { NextResponse } from 'next/server'
import { isDatabaseConfigured, query } from '@/lib/db/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const production = process.env.NODE_ENV === 'production'
  let dependencyHealthy = !production && !isDatabaseConfigured()

  if (isDatabaseConfigured()) {
    try {
      await query('select 1 as ok')
      const latest = await query<{ ok: number }>("select 1 as ok from schema_migrations where version = '0010_product_simplicity_devsecops.sql' limit 1")
      dependencyHealthy = Boolean(latest.rowCount)
    } catch {
      dependencyHealthy = false
    }
  }

  const status = dependencyHealthy ? 'ok' : 'degraded'
  return NextResponse.json(
    {
      status,
      buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'unknown',
      timestamp: new Date().toISOString(),
    },
    { status: status === 'ok' ? 200 : 503, headers: { 'Cache-Control': 'no-store' } },
  )
}
