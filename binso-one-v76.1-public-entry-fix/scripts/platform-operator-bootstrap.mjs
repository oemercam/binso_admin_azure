import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

for (const file of ['.env.local', '.env']) {
  const full = path.join(process.cwd(), file)
  if (fs.existsSync(full)) process.loadEnvFile(full)
}

if (process.env.ALLOW_PLATFORM_OPERATOR_BOOTSTRAP?.trim().toLowerCase() !== 'true') {
  throw new Error('Set ALLOW_PLATFORM_OPERATOR_BOOTSTRAP=true explicitly for this one-time operation.')
}

const connectionString = process.env.PLATFORM_DATABASE_URL?.trim()
if (!connectionString) throw new Error('PLATFORM_DATABASE_URL is required for operator bootstrap.')

const userId = process.env.PLATFORM_BOOTSTRAP_USER_ID?.trim()
const email = process.env.PLATFORM_BOOTSTRAP_EMAIL?.trim().toLowerCase()
const role = process.env.PLATFORM_BOOTSTRAP_ROLE?.trim() || 'platform_owner'
const roles = new Set(['platform_owner', 'platform_admin', 'platform_support', 'platform_billing', 'platform_auditor'])

if (!userId) throw new Error('PLATFORM_BOOTSTRAP_USER_ID is required.')
if (!email?.endsWith('@binso.ch')) throw new Error('PLATFORM_BOOTSTRAP_EMAIL must be an official @binso.ch account.')
if (!roles.has(role)) throw new Error('PLATFORM_BOOTSTRAP_ROLE is invalid.')

const client = new pg.Client({
  connectionString,
  ssl: process.env.DATABASE_SSL?.trim().toLowerCase() === 'false' ? undefined : { rejectUnauthorized: true },
  application_name: 'binso-one-platform-bootstrap',
  connectionTimeoutMillis: 10_000,
})

try {
  await client.connect()
  await client.query('begin')
  await client.query(
    `insert into platform_operator_assignments(user_id,email,role,status,created_by_user_id,updated_by_user_id)
     values($1,$2,$3,'active',$1,$1)
     on conflict(user_id) do update set email=excluded.email,role=excluded.role,status='active',updated_by_user_id=excluded.updated_by_user_id,updated_at=now()`,
    [userId, email, role],
  )
  await client.query(
    `insert into platform_audit_events(actor_user_id,actor_email,action,detail)
     values($1,$2,'operator.bootstrap',$3)`,
    [userId, email, `${email}; ${role}`],
  )
  await client.query('commit')
  console.log(`Platform operator bootstrapped: ${email} (${role}). Disable ALLOW_PLATFORM_OPERATOR_BOOTSTRAP now.`)
} catch (error) {
  await client.query('rollback').catch(() => undefined)
  throw error
} finally {
  await client.end().catch(() => undefined)
}
