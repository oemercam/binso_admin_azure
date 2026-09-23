import 'server-only'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'

const globalForDb = globalThis as unknown as { __binsoPgPool?: Pool }

function connectionString() {
  const raw = process.env.DATABASE_URL?.trim() || ''
  if (!raw) return ''
  try {
    const url = new URL(raw)
    if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full')
    return url.toString()
  } catch {
    return raw
  }
}

function sslEnabled() {
  return process.env.DATABASE_SSL?.trim().toLowerCase() !== 'false'
}

export function isDatabaseConfigured() {
  return connectionString().length > 0
}

export function databasePool() {
  const url = connectionString()
  if (!url) throw new Error('DATABASE_URL is not configured')

  if (!globalForDb.__binsoPgPool) {
    globalForDb.__binsoPgPool = new Pool({
      connectionString: url,
      max: Number(process.env.DATABASE_POOL_MAX || 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslEnabled() ? { rejectUnauthorized: true } : undefined,
      application_name: 'binso-one',
    })
  }

  return globalForDb.__binsoPgPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return databasePool().query<T>(text, values)
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await databasePool().connect()
  try {
    await client.query('begin')
    const result = await callback(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
