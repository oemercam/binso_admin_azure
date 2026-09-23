import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

function loadLocalEnv() {
  for (const file of ['.env.local', '.env']) {
    const fullPath = path.join(process.cwd(), file)
    if (!fs.existsSync(fullPath)) continue
    try {
      process.loadEnvFile(fullPath)
    } catch (error) {
      console.error(`Failed to load ${file}:`, error)
      process.exit(1)
    }
  }
}

function normalizedDatabaseUrl(value) {
  const url = new URL(value)
  if (url.searchParams.get('sslmode') === 'require') url.searchParams.set('sslmode', 'verify-full')
  return url.toString()
}

loadLocalEnv()

const { Client } = pg
const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is required for db:migrate. Configure it in .env.local or the process environment.')
  process.exit(1)
}

const migrationsDir = path.join(process.cwd(), 'database', 'migrations')
const client = new Client({
  connectionString: normalizedDatabaseUrl(databaseUrl),
  ssl: process.env.DATABASE_SSL?.toLowerCase() === 'false' ? undefined : { rejectUnauthorized: true },
  application_name: 'binso-admin-platform-migrations',
})

await client.connect()
try {
  await client.query(`create table if not exists schema_migrations (
    version text primary key,
    applied_at timestamptz not null default now()
  )`)

  const files = (await fsp.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const applied = await client.query('select 1 from schema_migrations where version = $1', [file])
    if (applied.rowCount) continue

    const sql = await fsp.readFile(path.join(migrationsDir, file), 'utf8')
    await client.query('begin')
    try {
      await client.query(sql)
      await client.query('insert into schema_migrations(version) values ($1)', [file])
      await client.query('commit')
      console.log(`Applied ${file}`)
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  }
  console.log('Database migrations are up to date.')
} finally {
  await client.end()
}
