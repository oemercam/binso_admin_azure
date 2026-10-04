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
