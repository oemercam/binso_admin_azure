import pg from 'pg'
import process from 'node:process'

const raw=process.env.DATABASE_TEST_URL?.trim()
if(!raw) throw new Error('DATABASE_TEST_URL is required; production DATABASE_URL is intentionally ignored.')
const url=new URL(raw)
if(!['127.0.0.1','localhost'].includes(url.hostname) && process.env.ALLOW_V82_STAGING_SCALE_SEED!=='1') throw new Error('Scale seed is restricted to loopback unless ALLOW_V82_STAGING_SCALE_SEED=1 is explicitly set.')
const client=new pg.Client({connectionString:url.toString(),connectionTimeoutMillis:5000})
await client.connect()
try{
  const org=(await client.query(`insert into organizations(name,slug,status) values('V82 Scale Test',$1,'active') on conflict(slug) do update set name=excluded.name returning id`,[`v82-scale-${Date.now()}`])).rows[0].id
  await client.query('begin')
  await client.query("select set_config('app.organization_id',$1,true)",[org])
  await client.query(`insert into customers(organization_id,external_id,customer_no,name,country,payment_days,status)
    select $1,'scale-c-'||g,'SC-'||g,'Scale Customer '||g,'Schweiz',30,'active' from generate_series(1,1000) g`,[org])
  const customer=(await client.query('select id from customers where organization_id=$1 order by id limit 1',[org])).rows[0].id
  await client.query(`insert into orders(organization_id,external_id,customer_id,name,budget_hours,sales_rate,cost_rate,billing_model,status)
    values($1,'scale-order-1',$2,'Scale Order',100000,150,80,'time','active')`,[org,customer])
  const order=(await client.query("select id from orders where organization_id=$1 and external_id='scale-order-1'",[org])).rows[0].id
  await client.query(`insert into invoices(organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
    select $1,'scale-i-'||g,'SI-'||g,$2,current_date,current_date+30,'sent',100,8.1,108.1,0 from generate_series(1,10000) g`,[org,customer])
  await client.query(`insert into time_entries(organization_id,external_id,order_id,person_name,worker_type,work_date,hours,billable,approved,sales_rate,internal_cost_rate)
    select $1,'scale-t-'||g,$2,'Scale Person','employee',current_date-(g%365),1,true,true,150,80 from generate_series(1,100000) g`,[org,order])
  await client.query('commit')
  console.log(JSON.stringify({organizationId:org,customers:1000,invoices:10000,timeEntries:100000},null,2))
}catch(error){await client.query('rollback').catch(()=>undefined);throw error}finally{await client.end()}
