import assert from 'node:assert/strict'
import pg from 'pg'

const DEMO_ORG_ID='00000000-0000-4000-8000-000000000074'
const DEMO_USER_ID=process.env.DEMO_USER_ID?.trim() || 'demo-marketing-binso'
const DEMO_EMAIL=process.env.DEMO_USER_EMAIL?.trim().toLowerCase() || 'demo-marketing@binso.ch'
const url=process.env.DATABASE_URL?.trim()
assert.ok(url,'DATABASE_URL is required')
const parsed=new URL(url)
const env=(process.env.NEXT_PUBLIC_APP_ENV||process.env.APP_ENV||process.env.NODE_ENV||'').toLowerCase()
assert.notEqual(env,'production','Refusing to seed demo data in Production')
assert.ok(process.env.ALLOW_DEMO_SEED==='true','Set ALLOW_DEMO_SEED=true explicitly for a non-production database')
assert.ok(!/prod|production/i.test(parsed.hostname+parsed.pathname),'Database URL looks like Production; refusing demo seed')

const state={
  customers:[
    {organizationId:DEMO_ORG_ID,id:'demo-customer-1',customerNo:'K-2026-001',name:'Nova Digital GmbH',contact:'Sophie Keller',email:'sophie.keller@example.com',address:'Musterstrasse 12',zip:'3000',city:'Bern',country:'Schweiz',paymentDays:30,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-2',customerNo:'K-2026-002',name:'Alpina Consulting AG',contact:'Luca Meier',email:'luca.meier@example.com',address:'Seestrasse 8',zip:'8000',city:'Zürich',country:'Schweiz',paymentDays:30,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-3',customerNo:'K-2026-003',name:'Müller Architektur AG',contact:'Lea Baumann',email:'lea.baumann@example.com',address:'Bahnhofplatz 4',zip:'9000',city:'St. Gallen',country:'Schweiz',paymentDays:20,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-4',customerNo:'K-2026-004',name:'Bergblick Immobilien AG',contact:'Noah Frei',email:'noah.frei@example.com',address:'Alpenweg 15',zip:'6000',city:'Luzern',country:'Schweiz',paymentDays:30,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-5',customerNo:'K-2026-005',name:'Nordlicht Engineering AG',contact:'Mia Schmid',email:'mia.schmid@example.com',address:'Werkstrasse 22',zip:'4051',city:'Basel',country:'Schweiz',paymentDays:30,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-6',customerNo:'K-2026-006',name:'Seeland Services GmbH',contact:'Jan Müller',email:'jan.mueller@example.com',address:'Seestrasse 19',zip:'2502',city:'Biel',country:'Schweiz',paymentDays:20,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-7',customerNo:'K-2026-007',name:'Urbanform GmbH',contact:'Elena Rossi',email:'elena.rossi@example.com',address:'Marktgasse 7',zip:'3011',city:'Bern',country:'Schweiz',paymentDays:30,status:'active'},
    {organizationId:DEMO_ORG_ID,id:'demo-customer-8',customerNo:'K-2026-008',name:'Helvetia Systems GmbH',contact:'David Steiner',email:'david.steiner@example.com',address:'Technopark 3',zip:'8005',city:'Zürich',country:'Schweiz',paymentDays:30,status:'active'}
  ],
  customerContacts:[], suppliers:[], employees:[], contracts:[], expenses:[], creditNotes:[], supplierInvoices:[], payments:[], auditEvents:[], importJobs:[], exportJobs:[],
  quotes:[{organizationId:DEMO_ORG_ID,id:'demo-quote-1',number:'AN-2026-014',customerId:'demo-customer-1',customerName:'Nova Digital GmbH',title:'Website Relaunch',validUntil:'2026-10-31',status:'accepted',version:1,lines:[{id:'demo-ql-1',description:'Konzeption und Umsetzung',quantity:40,unit:'h',unitPrice:165}],amount:6600}],
  orders:[{organizationId:DEMO_ORG_ID,id:'demo-order-1',customerId:'demo-customer-1',customerName:'Nova Digital GmbH',name:'Website Relaunch',budgetHours:80,usedHours:27.5,salesRate:165,costRate:105,billingModel:'time',status:'active'}],
  timeEntries:[{organizationId:DEMO_ORG_ID,id:'demo-time-1',orderId:'demo-order-1',orderName:'Website Relaunch',customerId:'demo-customer-1',customerName:'Nova Digital GmbH',personId:'demo-user-1',personName:'Luca Meier',workerType:'employee',date:'2026-09-22',hours:7.5,description:'Konzeption und Umsetzung',billable:true,approved:true,salesRate:165,internalCostRate:105}],
  invoices:[{organizationId:DEMO_ORG_ID,id:'demo-invoice-1',number:'RE-2026-009',customerId:'demo-customer-1',customerName:'Nova Digital GmbH',orderId:'demo-order-1',orderName:'Website Relaunch',period:'September 2026',issueDate:'2026-09-24',due:'2026-10-24',status:'sent',lines:[{id:'demo-il-1',description:'Konzeption und Umsetzung',quantity:7.5,unit:'h',unitPrice:165,vatRate:8.1,sourceTimeEntryIds:['demo-time-1']}],subtotal:1237.5,vatAmount:100.24,amount:1337.74,paidAmount:0}]
}

const client=new pg.Client({connectionString:url,ssl:process.env.DATABASE_SSL?.toLowerCase()==='false'?undefined:{rejectUnauthorized:true}})
await client.connect()
try{
  await client.query('begin')
  await client.query(`insert into organizations(id,name,slug,status,country,currency,locale,is_demo,is_pilot_customer) values($1,'Binso Demo AG','binso-demo','active','Schweiz','CHF','de-CH',true,false) on conflict(id) do update set name=excluded.name,is_demo=true,updated_at=now()`,[DEMO_ORG_ID])
  await client.query(`insert into app_users(id,email,display_name,status) values($1,$2,'Demo Marketing','active') on conflict(id) do update set email=excluded.email,display_name=excluded.display_name,status='active',updated_at=now()`,[DEMO_USER_ID,DEMO_EMAIL])
  for (const [code,name] of [['owner','Owner'],['admin','Admin'],['finance','Finance'],['employee','Employee']]) await client.query(`insert into organization_roles(organization_id,code,name,is_system) values($1,$2,$3,true) on conflict(organization_id,code) do nothing`,[DEMO_ORG_ID,code,name])
  await client.query(`insert into organization_memberships(organization_id,user_id,email,role,role_id,status) values($1,$2,$3,'owner',(select id from organization_roles where organization_id=$1 and code='owner'),'active') on conflict(organization_id,user_id) do update set email=excluded.email,role='owner',role_id=excluded.role_id,status='active',updated_at=now()`,[DEMO_ORG_ID,DEMO_USER_ID,DEMO_EMAIL])
  await client.query(`insert into organization_subscriptions(organization_id,plan,status,seats,billing_provider,billing_interval,unit_amount_chf) values($1,'professional','active',10,'manual','monthly',0) on conflict(organization_id) do update set plan='professional',status='active',seats=10,billing_provider='manual',unit_amount_chf=0,updated_at=now()`,[DEMO_ORG_ID])
  await client.query(`insert into organization_entitlements(organization_id,features,max_users,max_storage_mb,max_monthly_documents,max_api_requests_per_month) values($1,$2,10,10240,5000,100000) on conflict(organization_id) do update set features=excluded.features,max_users=excluded.max_users,max_storage_mb=excluded.max_storage_mb,max_monthly_documents=excluded.max_monthly_documents,max_api_requests_per_month=excluded.max_api_requests_per_month,updated_at=now()`,[DEMO_ORG_ID,['crm','quotes','orders','contracts','time','invoices','finance','employees','audit','imports','exports','expenses','reminders','approvals','accounting','margin','automations']])
  await client.query(`insert into platform_tenants(organization_id,owner_name,owner_email,platform_status,seats,monthly_revenue_chf,storage_mb,last_active_at) values($1,'Demo Marketing',$2,'active',10,0,0,now()) on conflict(organization_id) do update set owner_name=excluded.owner_name,owner_email=excluded.owner_email,platform_status='active',last_active_at=now()`,[DEMO_ORG_ID,DEMO_EMAIL])
  await client.query(`insert into company_profile(organization_id,name,address,zip,city,country,email,iban) values($1,'Binso Demo AG','Demoallee 10','3000','Bern','Schweiz',$2,'') on conflict(organization_id) do update set name=excluded.name,address=excluded.address,zip=excluded.zip,city=excluded.city,country=excluded.country,email=excluded.email`,[DEMO_ORG_ID,DEMO_EMAIL])
  await client.query(`insert into tenant_business_state(organization_id,state,version,updated_by,updated_at) values($1,$2::jsonb,1,$3,now()) on conflict(organization_id) do update set state=excluded.state,version=tenant_business_state.version+1,updated_by=excluded.updated_by,updated_at=now()`,[DEMO_ORG_ID,JSON.stringify(state),DEMO_USER_ID])
  for (const milestone of ['onboarding_completed','first_customer','first_quote','first_order','first_time_entry','first_invoice']) {
    await client.query(`insert into organization_milestones(organization_id,milestone,source) values($1,$2,'demo_seed') on conflict do nothing`,[DEMO_ORG_ID,milestone])
  }
  await client.query('commit')
  console.log(`Demo tenant ready: Binso Demo AG (${DEMO_ORG_ID}) for ${DEMO_EMAIL}`)
}catch(error){await client.query('rollback');throw error}finally{await client.end()}
