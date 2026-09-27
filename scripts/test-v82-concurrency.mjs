import assert from 'node:assert/strict'
import pg from 'pg'

const url = new URL(process.env.DATABASE_TEST_URL || 'postgresql://invalid@127.0.0.1/binso_v69_test')
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname) && url.pathname === '/binso_v69_test', 'Requires isolated loopback binso_v69_test database')

const admin = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 })
await admin.connect()
let organizationId
try {
  const slug = `v82-concurrency-${Date.now()}`
  organizationId = (await admin.query("insert into organizations(name,slug,status) values('V82 Concurrency',$1,'active') returning id", [slug])).rows[0].id
  await admin.query("insert into business_document_counters(organization_id,kind,period,prefix,next_value) values($1,'invoice','2099','RE-2099-',1)", [organizationId])

  const allocate = async () => {
    const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 })
    await client.connect()
    try {
      const result = await client.query(
        "update business_document_counters set next_value=next_value+1,updated_at=now() where organization_id=$1 and kind='invoice' and period='2099' returning next_value-1 as allocated",
        [organizationId],
      )
      return Number(result.rows[0].allocated)
    } finally {
      await client.end()
    }
  }

  const values = await Promise.all(Array.from({ length: 20 }, allocate))
  assert.equal(new Set(values).size, 20, 'Concurrent allocations must be unique')
  assert.deepEqual([...values].sort((a, b) => a - b), Array.from({ length: 20 }, (_, index) => index + 1))
  const next = await admin.query("select next_value from business_document_counters where organization_id=$1 and kind='invoice' and period='2099'", [organizationId])
  assert.equal(Number(next.rows[0].next_value), 21)
  console.log('V82 concurrency check passed: 20 simultaneous document-number allocations were unique and gap-free.')
} finally {
  if (organizationId) await admin.query('delete from organizations where id=$1', [organizationId]).catch(() => undefined)
  await admin.end()
}
