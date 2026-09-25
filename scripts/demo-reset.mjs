import assert from 'node:assert/strict'
import pg from 'pg'
const DEMO_ORG_ID='00000000-0000-4000-8000-000000000074'
const url=process.env.DATABASE_URL?.trim(); assert.ok(url,'DATABASE_URL is required')
const parsed=new URL(url); const env=(process.env.NEXT_PUBLIC_APP_ENV||process.env.APP_ENV||process.env.NODE_ENV||'').toLowerCase()
assert.notEqual(env,'production','Refusing demo reset in Production')
assert.ok(process.env.ALLOW_DEMO_SEED==='true','Set ALLOW_DEMO_SEED=true explicitly')
assert.ok(!/prod|production/i.test(parsed.hostname+parsed.pathname),'Database URL looks like Production; refusing demo reset')
const client=new pg.Client({connectionString:url,ssl:process.env.DATABASE_SSL?.toLowerCase()==='false'?undefined:{rejectUnauthorized:true}})
await client.connect();try{await client.query('delete from organizations where id=$1 and is_demo=true',[DEMO_ORG_ID]);console.log('Demo tenant removed. Run pnpm demo:seed to recreate it.')}finally{await client.end()}
