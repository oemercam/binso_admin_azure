import 'server-only'
import { Pool, type PoolClient, type QueryResultRow } from 'pg'

type DbGlobals = {
  __binsoPgPool?: Pool
  __binsoPlatformPgPool?: Pool
}

const globalForDb = globalThis as unknown as DbGlobals

function normalizeConnectionString(rawValue?: string) {
  const raw = rawValue?.trim() || ''
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

function makePool(connectionString: string, applicationName: string, max: number) {
  const pool = new Pool({
    connectionString,
    max,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 30_000,
    idle_in_transaction_session_timeout: 60_000,
    ssl: sslEnabled() ? { rejectUnauthorized: true } : undefined,
    application_name: applicationName,
  })
  pool.on('error', (error) => console.error('PostgreSQL idle connection error', { applicationName, code: (error as Error & { code?: string }).code }))
  return pool
}

function tenantConnectionString() {
  return normalizeConnectionString(process.env.DATABASE_URL)
}

function platformConnectionString() {
  return normalizeConnectionString(process.env.PLATFORM_DATABASE_URL || process.env.DATABASE_URL)
}

export function isDatabaseConfigured() {
  return tenantConnectionString().length > 0
}

export function isPlatformDatabaseConfigured() {
  return platformConnectionString().length > 0
}

export function databasePool() {
  const url = tenantConnectionString()
  if (!url) throw new Error('DATABASE_URL is not configured')
  if (!globalForDb.__binsoPgPool) {
    globalForDb.__binsoPgPool = makePool(url, 'binso-one-tenant', Number(process.env.DATABASE_POOL_MAX || 10))
  }
  return globalForDb.__binsoPgPool
}

export function platformDatabasePool() {
  const url = platformConnectionString()
  if (!url) throw new Error('PLATFORM_DATABASE_URL or DATABASE_URL is not configured')
  if (!globalForDb.__binsoPlatformPgPool) {
    globalForDb.__binsoPlatformPgPool = makePool(url, 'binso-one-platform', Number(process.env.PLATFORM_DATABASE_POOL_MAX || 5))
  }
  return globalForDb.__binsoPlatformPgPool
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return databasePool().query<T>(text, values)
}

export async function platformQuery<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []) {
  return platformDatabasePool().query<T>(text, values)
}

async function runTransaction<T>(pool: Pool, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
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

export function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  return runTransaction(databasePool(), callback)
}

export function withPlatformTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  return runTransaction(platformDatabasePool(), callback)
}

export function databaseRoleSeparationConfigured() {
  const tenant = tenantConnectionString()
  const platform = normalizeConnectionString(process.env.PLATFORM_DATABASE_URL)
  return Boolean(tenant && platform && tenant !== platform)
}
