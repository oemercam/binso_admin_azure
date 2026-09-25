import assert from 'node:assert/strict'
import pg from 'pg'

// Refuse accidental execution against a real tenant database.
const url = new URL(process.env.DATABASE_TEST_URL || 'postgresql://invalid@127.0.0.1/binso_v69_test')
assert.ok(['127.0.0.1','localhost'].includes(url.hostname) && url.pathname === '/binso_v69_test', 'Requires isolated loopback binso_v69_test database')
const client = new pg.Client({ connectionString: url.toString(), connectionTimeoutMillis: 5000 })
await client.connect()
try {
  await client.query('begin')
  const tenants = await client.query("insert into organizations(name,slug,status) values ('Test A','v69-test-a','active'),('Test B','v69-test-b','active') returning id")
  const [a,b] = tenants.rows.map(row => row.id)
  await client.query("insert into tenant_business_state(organization_id,state,updated_by) values ($1,'{\"secret\":\"A\"}','test'),($2,'{\"secret\":\"B\"}','test')", [a,b])
  await client.query('create role binso_v69_rls_test nologin')
  await client.query('grant usage on schema public to binso_v69_rls_test')
  await client.query('grant select,insert on tenant_business_state to binso_v69_rls_test')
  await client.query('grant select,insert,update on support_cases,support_messages,in_app_notifications to binso_v69_rls_test')
  await client.query('grant usage,select on sequence support_case_number_seq to binso_v69_rls_test')
  await client.query('set local role binso_v69_rls_test')
  assert.equal((await client.query('select * from tenant_business_state')).rowCount, 0)
  await client.query("select set_config('app.organization_id',$1,true)", [a])
  const own = await client.query('select state from tenant_business_state')
  assert.equal(own.rowCount, 1)
  assert.equal(own.rows[0].state.secret, 'A')
  assert.equal((await client.query('select * from tenant_business_state where organization_id=$1', [b])).rowCount, 0)
  const caseNumber = `BS-${(await client.query("select nextval('support_case_number_seq')::text as n")).rows[0].n}`
  const support = await client.query("insert into support_cases(case_number,organization_id,created_by_user_id,case_type,category,subject) values($1,$2,'user-a','feedback','usage','RLS feedback') returning id", [caseNumber,a])
  assert.equal(support.rowCount, 1)
  await assert.rejects(client.query("insert into support_cases(case_number,organization_id,created_by_user_id,case_type,category,subject) values($1,$2,'user-a','support','technical','Cross tenant')", [`${caseNumber}-x`,b]), error => error.code === '42501')
  await client.query('reset role')
  const mail = [a, 'test-key', 'invoice', 'invoice-1', 'test@example.invalid', 'Test', 'Test', 'test']
  await client.query('insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,created_by) values ($1,$2,$3,$4,$5,$6,$7,$8)', mail)
  await client.query('savepoint duplicate_mail')
  await assert.rejects(client.query('insert into mail_outbox(organization_id,deduplication_key,kind,entity_id,recipient,subject,body,created_by) values ($1,$2,$3,$4,$5,$6,$7,$8)', [a, 'another-key', ...mail.slice(2)]), error => error.code === '23505')
  await client.query('rollback to savepoint duplicate_mail')
  console.log('PostgreSQL integration checks passed: tenant RLS, support WITH CHECK, case numbering and pending document deduplication.')
} finally {
  await client.query('rollback').catch(() => undefined)
  await client.end()
}
