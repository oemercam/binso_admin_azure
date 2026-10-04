-- Finance analytics for Azure Database for PostgreSQL.
alter table organizations add column if not exists is_demo boolean not null default false;

create table if not exists operating_costs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  external_id text not null,
  cost_date date not null,
  category text not null check (category in ('infrastructure','software','email','banking','marketing','office','insurance','personnel','other')),
  provider text,
  description text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'CHF' check (currency in ('CHF','EUR')),
  scope text not null default 'tenant' check (scope in ('tenant','platform')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((scope='tenant' and organization_id is not null) or scope='platform')
);
create unique index if not exists uq_operating_costs_org_external on operating_costs(coalesce(organization_id,'00000000-0000-0000-0000-000000000000'::uuid),external_id);
create index if not exists idx_operating_costs_org_date on operating_costs(organization_id,cost_date desc);
create index if not exists idx_operating_costs_scope_date on operating_costs(scope,cost_date desc);
alter table operating_costs enable row level security;
alter table operating_costs force row level security;
drop policy if exists operating_costs_tenant on operating_costs;
create policy operating_costs_tenant on operating_costs
  using (scope='tenant' and organization_id::text=nullif(current_setting('app.organization_id',true),''))
  with check (scope='tenant' and organization_id::text=nullif(current_setting('app.organization_id',true),''));


-- Isolated deterministic demo workspace. Safe to rerun.
insert into organizations(id,name,slug,status,country,currency,locale,is_demo)
values('00000000-0000-4000-8000-000000000099','Binso One Demo','binso-one-demo','active','Schweiz','CHF','de-CH',true)
on conflict(id) do update set is_demo=true;

insert into customers(id,organization_id,external_id,customer_no,name,legal_name,payment_days,status,language,discount)
values
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-customer-acme','K-2026-001','Acme AG','Acme AG',30,'active','de',0),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-customer-alpin','K-2026-002','Alpin Systems AG','Alpin Systems AG',30,'active','de',0),
('10000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000099','demo-customer-nova','K-2026-003','Nova Digital GmbH','Nova Digital GmbH',20,'active','de',5)
on conflict(id) do nothing;

insert into employees(id,organization_id,external_id,name,email,role,employment_type,target_hours,internal_cost_rate,active,title,workload_percent,weekly_hours,start_date,monthly_gross)
values
('20000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-employee-1','Nina Müller','nina.mueller@example.invalid','employee','salary',168,58,true,'Consultant',100,42,'2025-01-01',7200),
('20000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-employee-2','David Schmid','david.schmid@example.invalid','employee','salary',134,64,true,'Senior Engineer',80,33.6,'2024-04-01',7800)
on conflict(id) do nothing;

insert into projects(id,organization_id,external_id,customer_id,manager_employee_id,name,team_text,budget,hours_budget,progress,start_date,end_date,status)
values
('30000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-project-1','10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Modern Workplace','Nina Müller, David Schmid',48000,320,68,'2026-08-01','2026-12-15','active'),
('30000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-project-2','10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','Cloud Migration','Nina Müller',32000,220,42,'2026-09-01','2027-01-31','in_progress')
on conflict(id) do nothing;

insert into products_services(id,organization_id,external_id,name,item_type,unit,unit_price,vat_rate,status)
values
('40000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-service-consulting','IT Consulting','service','Stunde',185,8.1,'active'),
('40000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-service-engineering','Engineering','service','Stunde',205,8.1,'active')
on conflict(id) do nothing;


insert into quotes(id,organization_id,external_id,quote_no,customer_id,title,issue_date,valid_until,status,version)
values
('50000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-quote-1','AN-2026-012','10000000-0000-4000-8000-000000000001','Modern Workplace Erweiterung','2026-10-01','2026-10-31','sent',1),
('50000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-quote-2','AN-2026-013','10000000-0000-4000-8000-000000000003','Security Review','2026-10-03','2026-11-02','draft',1)
on conflict(id) do nothing;

insert into invoices(id,organization_id,external_id,invoice_no,customer_id,project_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
values
('60000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-invoice-1','RE-2026-019','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','2026-10-01','2026-10-31','paid',12500,1012.50,13512.50,13512.50),
('60000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-invoice-2','RE-2026-020','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','2026-10-03','2026-11-02','sent',8900,720.90,9620.90,0),
('60000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000099','demo-invoice-3','RE-2026-018','10000000-0000-4000-8000-000000000003',null,'2026-09-05','2026-10-05','paid',7600,615.60,8215.60,8215.60)
on conflict(id) do nothing;

insert into payments(id,organization_id,external_id,invoice_id,payment_date,amount,method,reference,allocation_status)
values
('70000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-payment-1','60000000-0000-4000-8000-000000000001','2026-10-02',13512.50,'bank','RF-DEMO-001','matched'),
('70000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-payment-2','60000000-0000-4000-8000-000000000003','2026-09-12',8215.60,'bank','RF-DEMO-002','matched')
on conflict(id) do nothing;

insert into expenses(id,organization_id,external_id,customer_id,project_id,employee_id,expense_date,description,category,quantity,unit_price,billable,status)
values
('80000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-expense-1','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','2026-10-02','Bahnreise','travel',1,86,true,'approved'),
('80000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-expense-2',null,null,'20000000-0000-4000-8000-000000000002','2026-10-03','Arbeitsmaterial','material',1,148,false,'approved')
on conflict(id) do nothing;

insert into payroll_runs(id,organization_id,external_id,employee_id,period,gross_amount,deduction_amount,net_amount,status)
values
('90000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-payroll-2026-10-1','20000000-0000-4000-8000-000000000001','2026-10',7200,1120,6080,'approved'),
('90000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-payroll-2026-10-2','20000000-0000-4000-8000-000000000002','2026-10',6240,970,5270,'approved')
on conflict(id) do nothing;

insert into operating_costs(id,organization_id,external_id,cost_date,category,provider,description,amount,scope)
values
('a0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-cost-azure','2026-10-01','infrastructure','Microsoft Azure','Cloud Infrastruktur',1280,'tenant'),
('a0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-cost-software','2026-10-01','software','Software Services','Lizenzen und Dienste',620,'tenant'),
('a0000000-0000-4000-8000-000000000003',null,'demo-platform-azure','2026-10-01','infrastructure','Microsoft Azure','Binso One Plattform Infrastruktur',2840,'platform'),
('a0000000-0000-4000-8000-000000000004',null,'demo-platform-services','2026-10-01','software','Platform Services','E-Mail, Monitoring und Services',640,'platform')
on conflict(id) do nothing;


insert into time_entries(id,organization_id,external_id,project_id,employee_id,person_name,worker_type,work_date,hours,description,billable,approved,sales_rate,internal_cost_rate)
values
('c0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-time-1','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Nina Müller','employee','2026-10-02',7.5,'Konzeption und Umsetzung',true,true,185,58),
('c0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-time-2','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','David Schmid','employee','2026-10-03',6.75,'Cloud Migration',true,true,205,64)
on conflict(id) do nothing;

insert into tasks(id,organization_id,external_id,title,customer_id,project_id,assignee_employee_id,due_date,priority,status)
values
('d0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','demo-task-1','Client Rollout vorbereiten','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','2026-10-12','high','in_progress'),
('d0000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000099','demo-task-2','Migration prüfen','10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','2026-10-15','normal','open')
on conflict(id) do nothing;

insert into platform_tenants(id,organization_id,owner_name,owner_email,platform_status,seats,monthly_revenue_chf,storage_mb,last_active_at)
values('b0000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000099','Demo Admin','demo@example.invalid','active',5,490,2048,now())
on conflict(organization_id) do update set monthly_revenue_chf=excluded.monthly_revenue_chf,seats=excluded.seats,last_active_at=excluded.last_active_at;
