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
