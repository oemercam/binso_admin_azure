import fs from 'node:fs/promises'
import path from 'node:path'
import pg from 'pg'

const { Client } = pg
const databaseUrl = process.env.DATABASE_URL?.trim()
if (!databaseUrl) {
  console.error('DATABASE_URL is required for db:migrate')
  process.exit(1)
}

const migrationsDir = path.join(process.cwd(), 'database', 'migrations')
const client = new Client({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL?.toLowerCase() === 'false' ? undefined : { rejectUnauthorized: true },
  application_name: 'binso-admin-platform-migrations',
})

await client.connect()
try {
  await client.query(`create table if not exists schema_migrations (
    version text primary key,
    applied_at timestamptz not null default now()
  )`)

  const files = (await fs.readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  for (const file of files) {
    const applied = await client.query('select 1 from schema_migrations where version = $1', [file])
    if (applied.rowCount) continue

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8')
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
