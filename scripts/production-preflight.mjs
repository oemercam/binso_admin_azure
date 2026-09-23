import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

function loadLocalEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(process.cwd(), file)
    if (fs.existsSync(fullPath)) process.loadEnvFile(fullPath)
  }
}

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exitCode = 1
}

function required(name) {
  const value = process.env[name]?.trim()
  if (!value) fail(`${name} is not configured.`)
  return value || ''
}

function normalizedDatabaseUrl(value) {
  try {
    const url = new URL(value)
    if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full')
    return url.toString()
  } catch {
    return value
  }
}

loadLocalEnv()

const baseUrl = required('APP_BASE_URL')
if (baseUrl && !/^https:\/\//i.test(baseUrl)) fail('APP_BASE_URL must use HTTPS in production.')
const authMode = required('AUTH_MODE').toLowerCase()
if (authMode !== 'azure') fail('AUTH_MODE must be azure for production.')
required('AUTH_PROVIDER_NAME')
required('DATABASE_URL')
required('STRIPE_SECRET_KEY')
required('STRIPE_WEBHOOK_SECRET')
required('STRIPE_PRICE_STARTER')
required('STRIPE_PRICE_BUSINESS')
required('STRIPE_PRICE_PROFESSIONAL')
required('INTERNAL_JOB_SECRET')

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
if (vapidPublic) {
  const encryptionKey = required('PUSH_SUBSCRIPTION_ENCRYPTION_KEY')
  if (encryptionKey) {
    try {
      if (Buffer.from(encryptionKey, 'base64').length !== 32) fail('PUSH_SUBSCRIPTION_ENCRYPTION_KEY must decode to exactly 32 bytes.')
    } catch { fail('PUSH_SUBSCRIPTION_ENCRYPTION_KEY is not valid Base64.') }
  }
}

const emailMode = required('EMAIL_DELIVERY_MODE').toLowerCase()
if (emailMode !== 'graph') fail('EMAIL_DELIVERY_MODE must be graph for production so organization invitations are deliverable.')
required('GRAPH_TENANT_ID')
required('GRAPH_CLIENT_ID')
required('GRAPH_CLIENT_SECRET')
required('GRAPH_SENDER_USER_ID')

if (process.exitCode) process.exit(process.exitCode)

const migrationsDir = path.join(process.cwd(), 'database', 'migrations')
const migrationFiles = (await fsp.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
const latestMigration = migrationFiles.at(-1)
const { Client } = pg
const client = new Client({
  connectionString: normalizedDatabaseUrl(process.env.DATABASE_URL.trim()),
  ssl: process.env.DATABASE_SSL?.toLowerCase() === 'false' ? undefined : { rejectUnauthorized: true },
  application_name: 'binso-one-preflight',
  connectionTimeoutMillis: 10_000,
})

try {
  await client.connect()
  await client.query('select 1')
  const migrationTable = await client.query("select to_regclass('public.schema_migrations') as name")
  if (!migrationTable.rows[0]?.name) fail('schema_migrations table is missing. Run pnpm db:migrate.')
  else if (latestMigration) {
    const applied = await client.query('select 1 from schema_migrations where version = $1', [latestMigration])
    if (!applied.rowCount) fail(`Latest migration ${latestMigration} is not applied.`)
  }
} catch (error) {
  fail(`Database preflight failed: ${error instanceof Error ? error.message : 'unknown error'}`)
} finally {
  await client.end().catch(() => undefined)
}

if (process.exitCode) process.exit(process.exitCode)
console.log(`Production preflight passed. Latest migration: ${latestMigration ?? 'none'}.`)
