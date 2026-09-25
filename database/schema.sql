-- ============================================================================
-- SOURCE: database/migrations/0001_baseline.sql
-- ============================================================================
-- Binso Admin - PostgreSQL target schema (production design draft)
-- The v5 demo still uses browser localStorage. This schema is for the next Azure PostgreSQL step.

create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_no text not null unique,
  name text not null,
  legal_name text,
  contact_name text,
  email text,
  phone text,
  address text,
  zip text,
  city text,
  country text not null default 'Schweiz',
  uid text,
  payment_days integer not null default 30 check (payment_days between 0 and 180),
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_no text not null unique,
  name text not null,
  contact_name text,
  email text,
  uid text,
  payment_days integer not null default 30,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  entra_oid text unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('owner','admin','finance','employee')),
  employment_type text not null check (employment_type in ('salary','hourly')),
  target_hours numeric(8,2) not null default 0,
  internal_cost_rate numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  customer_id uuid not null references customers(id),
  title text not null,
  valid_until date,
  status text not null check (status in ('draft','sent','accepted','declined','expired')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  source_quote_id uuid references quotes(id),
  name text not null,
  end_customer_name text,
  prime_contractor_name text,
  mandate_ref text,
  procurement_ref text,
  budget_hours numeric(12,2) not null default 0,
  sales_rate numeric(12,2) not null default 0,
  cost_rate numeric(12,2) not null default 0,
  billing_model text not null check (billing_model in ('time','fixed','mixed')),
  status text not null check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  employee_id uuid references employees(id),
  supplier_id uuid references suppliers(id),
  person_name text not null,
  worker_type text not null check (worker_type in ('employee','hourly_employee','external')),
  work_date date not null,
  hours numeric(8,2) not null check (hours > 0),
  description text,
  billable boolean not null default true,
  approved boolean not null default false,
  sales_rate numeric(12,2) not null default 0,
  internal_cost_rate numeric(12,2) not null default 0,
  invoiced_invoice_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  customer_id uuid not null references customers(id),
  order_id uuid references orders(id),
  period text,
  issue_date date not null,
  due_date date not null,
  status text not null check (status in ('draft','sent','partial','paid','overdue','cancelled')),
  subtotal numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table time_entries
  drop constraint if exists fk_time_entries_invoice;
alter table time_entries
  add constraint fk_time_entries_invoice foreign key (invoiced_invoice_id) references invoices(id);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 8.1
);

create table if not exists invoice_line_time_entries (
  invoice_line_id uuid not null references invoice_lines(id) on delete cascade,
  time_entry_id uuid not null references time_entries(id),
  primary key (invoice_line_id, time_entry_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id),
  order_id uuid references orders(id),
  supplier_invoice_no text not null,
  invoice_date date not null,
  due_date date not null,
  net_amount numeric(14,2) not null,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null,
  status text not null check (status in ('open','paid','review')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_entries_order_date on time_entries(order_id, work_date);
create index if not exists idx_time_entries_unbilled on time_entries(order_id, invoiced_invoice_id) where billable = true and approved = true;
create index if not exists idx_invoices_customer_status on invoices(customer_id, status);
create index if not exists idx_supplier_invoices_order on supplier_invoices(order_id);

-- v6 document configuration / communication fields
alter table quotes add column if not exists intro_text text;
alter table quotes add column if not exists closing_text text;
alter table quotes add column if not exists email_to text;
alter table quotes add column if not exists email_subject text;
alter table quotes add column if not exists sent_at timestamptz;

alter table invoices add column if not exists intro_text text;
alter table invoices add column if not exists closing_text text;
alter table invoices add column if not exists email_to text;
alter table invoices add column if not exists email_subject text;
alter table invoices add column if not exists sent_at timestamptz;
alter table invoices add column if not exists reminder_level integer not null default 0 check (reminder_level between 0 and 3);

create table if not exists company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  zip text not null,
  city text not null,
  country text not null default 'Schweiz',
  email text not null,
  phone text,
  uid text,
  iban text not null,
  bank_name text,
  website text,
  updated_at timestamptz not null default now()
);

create table if not exists document_templates (
  key text primary key check (key in ('quote','invoice','reminder')),
  label text not null,
  intro_text text not null default '',
  closing_text text not null default '',
  email_subject text not null default '',
  email_text text not null default '',
  footer_text text not null default '',
  updated_at timestamptz not null default now()
);

-- v20.8 customer lifecycle: contracts, billable expenses, credit notes and customer activity
alter table quotes drop constraint if exists quotes_status_check;
alter table quotes add constraint quotes_status_check check (status in ('draft','sent','accepted','declined','expired','revised'));

alter table orders drop constraint if exists orders_billing_model_check;
alter table orders add constraint orders_billing_model_check check (billing_model in ('time','fixed','retainer','milestone','mixed'));

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  contract_no text not null unique,
  customer_id uuid not null references customers(id),
  name text not null,
  start_date date not null,
  end_date date,
  status text not null default 'draft' check (status in ('draft','active','paused','ended','cancelled')),
  auto_renew boolean not null default false,
  notice_days integer not null default 0,
  billing_interval text not null default 'none' check (billing_interval in ('none','monthly','quarterly','yearly')),
  next_invoice_date date,
  billing_day integer check (billing_day between 1 and 31),
  reference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contract_lines (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 8.1
);

alter table orders add column if not exists contract_id uuid references contracts(id);
alter table invoices add column if not exists contract_id uuid references contracts(id);
alter table invoices add column if not exists invoice_kind text not null default 'standard' check (invoice_kind in ('standard','deposit','partial','final','recurring'));
alter table invoices add column if not exists credited_amount numeric(14,2) not null default 0;

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  order_id uuid references orders(id),
  contract_id uuid references contracts(id),
  expense_date date not null,
  description text not null,
  category text not null check (category in ('expense','material','travel','other')),
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  billable boolean not null default true,
  invoiced_invoice_id uuid references invoices(id),
  created_at timestamptz not null default now()
);

create table if not exists invoice_line_expenses (
  invoice_line_id uuid not null references invoice_lines(id) on delete cascade,
  expense_id uuid not null references expenses(id),
  primary key (invoice_line_id, expense_id)
);

create table if not exists credit_notes (
  id uuid primary key default gen_random_uuid(),
  credit_no text not null unique,
  invoice_id uuid not null references invoices(id),
  customer_id uuid not null references customers(id),
  credit_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists customer_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  activity_type text not null check (activity_type in ('note','quote','order','contract','invoice','payment','reminder','credit')),
  title text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_contracts_customer_status on contracts(customer_id, status);
create index if not exists idx_contracts_next_invoice on contracts(next_invoice_date) where status = 'active';
create index if not exists idx_expenses_order_unbilled on expenses(order_id, invoiced_invoice_id) where billable = true;
create index if not exists idx_customer_activities_customer_created on customer_activities(customer_id, created_at desc);

create table if not exists customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  role_label text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_customer_contacts_customer on customer_contacts(customer_id);

-- V46 SaaS foundation: organizations / tenant ownership.
-- This block is intentionally additive so the current draft remains readable.
-- V48 will add authorization/RLS policies and make tenant isolation enforceable.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active','inactive')),
  country text not null default 'Schweiz',
  currency text not null default 'CHF' check (currency in ('CHF','EUR')),
  locale text not null default 'de-CH' check (locale in ('de-CH','fr-CH','it-CH','en-CH')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Compatibility tenant for the existing Binso demo data.
insert into organizations (id, name, slug, status, country, currency, locale)
values ('00000000-0000-4000-8000-000000000001', 'Binso GmbH', 'binso', 'active', 'Schweiz', 'CHF', 'de-CH')
on conflict (id) do nothing;

alter table customers add column if not exists organization_id uuid references organizations(id);
alter table suppliers add column if not exists organization_id uuid references organizations(id);
alter table employees add column if not exists organization_id uuid references organizations(id);
alter table quotes add column if not exists organization_id uuid references organizations(id);
alter table orders add column if not exists organization_id uuid references organizations(id);
alter table time_entries add column if not exists organization_id uuid references organizations(id);
alter table invoices add column if not exists organization_id uuid references organizations(id);
alter table payments add column if not exists organization_id uuid references organizations(id);
alter table supplier_invoices add column if not exists organization_id uuid references organizations(id);
alter table company_profile add column if not exists organization_id uuid references organizations(id);
alter table document_templates add column if not exists organization_id uuid references organizations(id);
alter table contracts add column if not exists organization_id uuid references organizations(id);
alter table expenses add column if not exists organization_id uuid references organizations(id);
alter table credit_notes add column if not exists organization_id uuid references organizations(id);
alter table customer_activities add column if not exists organization_id uuid references organizations(id);
alter table customer_contacts add column if not exists organization_id uuid references organizations(id);

update customers set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update suppliers set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update employees set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update quotes set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update orders set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update time_entries set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update invoices set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update payments set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update supplier_invoices set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update company_profile set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update document_templates set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update contracts set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update expenses set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update credit_notes set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update customer_activities set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;
update customer_contacts set organization_id = '00000000-0000-4000-8000-000000000001' where organization_id is null;

alter table customers alter column organization_id set not null;
alter table suppliers alter column organization_id set not null;
alter table employees alter column organization_id set not null;
alter table quotes alter column organization_id set not null;
alter table orders alter column organization_id set not null;
alter table time_entries alter column organization_id set not null;
alter table invoices alter column organization_id set not null;
alter table payments alter column organization_id set not null;
alter table supplier_invoices alter column organization_id set not null;
alter table company_profile alter column organization_id set not null;
alter table document_templates alter column organization_id set not null;
alter table contracts alter column organization_id set not null;
alter table expenses alter column organization_id set not null;
alter table credit_notes alter column organization_id set not null;
alter table customer_activities alter column organization_id set not null;
alter table customer_contacts alter column organization_id set not null;

-- Numbering and business identifiers are unique per organization, not globally.
alter table customers drop constraint if exists customers_customer_no_key;
alter table quotes drop constraint if exists quotes_quote_no_key;
alter table contracts drop constraint if exists contracts_contract_no_key;

create unique index if not exists uq_customers_org_customer_no on customers(organization_id, customer_no);
create unique index if not exists uq_quotes_org_quote_no on quotes(organization_id, quote_no);
create unique index if not exists uq_contracts_org_contract_no on contracts(organization_id, contract_no);
create unique index if not exists uq_organizations_slug on organizations(slug);

create index if not exists idx_customers_org on customers(organization_id);
create index if not exists idx_contacts_org on customer_contacts(organization_id);
create index if not exists idx_quotes_org on quotes(organization_id);
create index if not exists idx_orders_org on orders(organization_id);
create index if not exists idx_contracts_org on contracts(organization_id);
create index if not exists idx_invoices_org on invoices(organization_id);
create index if not exists idx_time_entries_org on time_entries(organization_id);
create index if not exists idx_employees_org on employees(organization_id);

-- V50 complete SaaS product foundation

create table if not exists organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text not null,
  email text not null,
  role text not null check (role in ('owner','admin','finance','employee')),
  status text not null default 'invited' check (status in ('invited','active','suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_memberships_user on organization_memberships(user_id, status);
create index if not exists idx_memberships_org on organization_memberships(organization_id, status);

create table if not exists organization_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  plan text not null check (plan in ('starter','business','professional','enterprise')),
  status text not null check (status in ('trial','active','past_due','cancelled')),
  seats integer not null default 1 check (seats > 0),
  trial_until timestamptz,
  billing_customer_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists organization_entitlements (
  organization_id uuid primary key references organizations(id) on delete cascade,
  features text[] not null default '{}',
  max_users integer not null default 1,
  max_storage_mb integer not null default 1024,
  updated_at timestamptz not null default now()
);

create table if not exists number_sequences (
  organization_id uuid not null references organizations(id) on delete cascade,
  kind text not null check (kind in ('customer','quote','order','contract','invoice','credit_note')),
  prefix text not null,
  next_value bigint not null default 1,
  padding integer not null default 3,
  include_year boolean not null default true,
  primary key (organization_id, kind)
);

create table if not exists audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_user_id text not null,
  actor_name text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org_created on audit_events(organization_id, created_at desc);

create table if not exists import_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by text not null,
  status text not null check (status in ('draft','validated','importing','completed','failed')),
  entity_type text not null check (entity_type in ('customers','contacts','employees','invoices')),
  file_name text not null,
  error_count integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by text not null,
  status text not null check (status in ('queued','processing','ready','failed')),
  format text not null check (format in ('csv','xlsx','zip')),
  scope text not null check (scope in ('all','customers','contacts','invoices','time')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Tenant-aware document/template uniqueness.
alter table document_templates drop constraint if exists document_templates_pkey;
alter table document_templates add primary key (organization_id, key);

-- RLS foundation. Application DB sessions must set app.organization_id and app.user_id.
-- Platform-level maintenance connections should use a dedicated role outside normal app traffic.
do $$
declare
  t text;
begin
  foreach t in array array[
    'customers','suppliers','employees','quotes','orders','time_entries','invoices',
    'payments','supplier_invoices','company_profile','document_templates','contracts',
    'expenses','credit_notes','customer_activities','customer_contacts',
    'organization_memberships','organization_subscriptions','organization_entitlements',
    'number_sequences','audit_events','import_jobs','export_jobs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;

alter table organizations enable row level security;
drop policy if exists organization_membership_access on organizations;
create policy organization_membership_access on organizations
using (
  exists (
    select 1
    from organization_memberships m
    where m.organization_id = organizations.id
      and m.user_id = current_setting('app.user_id', true)
      and m.status = 'active'
  )
);

-- Per-tenant sequence allocation must be transactional.
create or replace function next_business_number(
  p_organization_id uuid,
  p_kind text
) returns text
language plpgsql
as $$
declare
  r number_sequences%rowtype;
  value_text text;
begin
  select * into r
  from number_sequences
  where organization_id = p_organization_id and kind = p_kind
  for update;

  if not found then
    raise exception 'Missing number sequence for organization %, kind %', p_organization_id, p_kind;
  end if;

  value_text :=
    r.prefix || '-' ||
    case when r.include_year then extract(year from current_date)::int::text || '-' else '' end ||
    lpad(r.next_value::text, r.padding, '0');

  update number_sequences
  set next_value = next_value + 1
  where organization_id = p_organization_id and kind = p_kind;

  return value_text;
end;
$$;

-- V52 platform operator / commercial SaaS layer
create table if not exists platform_tenants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references organizations(id) on delete cascade,
  owner_name text not null,
  owner_email text not null,
  platform_status text not null check (platform_status in ('trial','active','past_due','suspended','cancelled')),
  seats integer not null default 1,
  monthly_revenue_chf numeric(12,2) not null default 0,
  storage_mb integer not null default 0,
  last_active_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists signup_requests (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  owner_name text not null,
  email text not null,
  plan text not null check (plan in ('starter','business','professional','enterprise')),
  status text not null check (status in ('started','account_created','trial_started','active','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists platform_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id text not null,
  actor_email text not null,
  action text not null,
  tenant_id uuid references platform_tenants(id),
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_tenants_status on platform_tenants(platform_status);
create index if not exists idx_signup_requests_created on signup_requests(created_at desc);
create index if not exists idx_platform_audit_created on platform_audit_events(created_at desc);


-- ============================================================================
-- SOURCE: database/migrations/0002_auth_memberships.sql
-- ============================================================================
-- V59 authentication and membership foundation

create table if not exists app_users (
  id text primary key,
  email text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_app_users_email_ci on app_users(lower(email));
create index if not exists idx_memberships_email_ci on organization_memberships(lower(email), status);

alter table signup_requests add column if not exists user_id text;
alter table signup_requests add column if not exists organization_id uuid references organizations(id) on delete set null;
create index if not exists idx_signup_requests_user on signup_requests(user_id, created_at desc);

-- Keep identity data outside tenant RLS. It contains only the authenticated account identity,
-- not business records. Tenant authorization continues to be enforced through memberships.

-- ============================================================================
-- SOURCE: database/migrations/0003_registration_onboarding.sql
-- ============================================================================
-- V60 production registration and onboarding lifecycle

alter table signup_requests add column if not exists updated_at timestamptz not null default now();
alter table signup_requests add column if not exists completed_at timestamptz;

create unique index if not exists uq_signup_requests_open_user
  on signup_requests(user_id)
  where user_id is not null and status in ('started','account_created');

create index if not exists idx_signup_requests_user_status
  on signup_requests(user_id, status, updated_at desc);

update signup_requests
   set updated_at = created_at
 where updated_at is null;

-- ============================================================================
-- SOURCE: database/migrations/0004_subscription_billing.sql
-- ============================================================================
-- V61 subscription and billing foundation

alter table organization_subscriptions add column if not exists billing_provider text not null default 'manual'
  check (billing_provider in ('manual','stripe'));
alter table organization_subscriptions add column if not exists billing_subscription_id text;
alter table organization_subscriptions add column if not exists billing_interval text not null default 'monthly'
  check (billing_interval in ('monthly','yearly'));
alter table organization_subscriptions add column if not exists unit_amount_chf numeric(12,2) not null default 0;
alter table organization_subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table organization_subscriptions add column if not exists cancelled_at timestamptz;
alter table organization_subscriptions add column if not exists scheduled_plan text
  check (scheduled_plan is null or scheduled_plan in ('starter','business','professional','enterprise'));
alter table organization_subscriptions add column if not exists next_billing_at timestamptz;

create unique index if not exists uq_org_subscriptions_provider_id
  on organization_subscriptions(billing_provider, billing_subscription_id)
  where billing_subscription_id is not null;

create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references organization_subscriptions(id) on delete set null,
  actor_user_id text not null,
  source text not null default 'platform_admin' check (source in ('platform_admin','customer','system','webhook')),
  event_type text not null,
  previous_plan text,
  new_plan text,
  previous_status text,
  new_status text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_subscription_events_org_created on subscription_events(organization_id, created_at desc);

create table if not exists billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe')),
  external_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received','processed','failed','ignored')),
  organization_id uuid references organizations(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, external_event_id)
);
create index if not exists idx_billing_webhook_status on billing_webhook_events(status, received_at);

-- Seed billing amounts for existing plans without overwriting provider-managed values.
update organization_subscriptions
set unit_amount_chf = case plan
  when 'starter' then 39
  when 'business' then 89
  when 'professional' then 149
  else 0
end
where unit_amount_chf = 0;

-- Keep platform overview in sync with existing subscription data.
update platform_tenants pt
set seats = s.seats,
    monthly_revenue_chf = case when s.status = 'active' then s.unit_amount_chf else 0 end,
    platform_status = case
      when pt.platform_status = 'suspended' then 'suspended'
      else s.status
    end
from organization_subscriptions s
where s.organization_id = pt.organization_id;

-- ============================================================================
-- SOURCE: database/migrations/0005_stripe_payment_provider.sql
-- ============================================================================
-- V63 Stripe payment provider integration

alter table organization_subscriptions add column if not exists billing_last_synced_at timestamptz;
alter table organization_subscriptions add column if not exists billing_last_event_id text;

create unique index if not exists uq_org_subscriptions_billing_customer
  on organization_subscriptions(billing_customer_id)
  where billing_customer_id is not null;

create index if not exists idx_org_subscriptions_billing_sync
  on organization_subscriptions(billing_provider, billing_last_synced_at desc);

create index if not exists idx_billing_webhook_org_received
  on billing_webhook_events(organization_id, received_at desc);

-- ============================================================================
-- SOURCE: database/migrations/0006_production_saas.sql
-- ============================================================================
-- V67 production SaaS hardening: durable tenant state, account profiles, push and operations.

alter table app_users add column if not exists phone text;
alter table app_users add column if not exists locale text not null default 'de-CH';
alter table app_users add column if not exists timezone text not null default 'Europe/Zurich';

create table if not exists tenant_business_state (
  organization_id uuid primary key references organizations(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  updated_by text not null,
  updated_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app_users(id) on delete cascade,
  endpoint_hash text not null,
  encrypted_payload text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint_hash)
);
create index if not exists idx_push_subscriptions_user on push_subscriptions(user_id);

create table if not exists application_events (
  id uuid primary key default gen_random_uuid(),
  severity text not null check (severity in ('info','warning','error')),
  area text not null,
  code text not null,
  message text not null,
  organization_id uuid references organizations(id) on delete set null,
  user_id text,
  request_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_application_events_severity_created on application_events(severity, created_at desc);
create index if not exists idx_application_events_org_created on application_events(organization_id, created_at desc);

alter table audit_events add column if not exists client_event_id text;
create unique index if not exists ux_audit_events_org_client_event
  on audit_events(organization_id, client_event_id)
  where client_event_id is not null;

alter table tenant_business_state enable row level security;
drop policy if exists tenant_isolation on tenant_business_state;
create policy tenant_isolation on tenant_business_state
  using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

-- Membership invitations use a temporary invited:<email> user id until that identity signs in.
-- Once authenticated, ownership is moved to the immutable external identity id.

-- JSON is the canonical full-tenant portability format; CSV remains available for tabular scopes.
alter table export_jobs drop constraint if exists export_jobs_format_check;
alter table export_jobs add constraint export_jobs_format_check check (format in ('csv','xlsx','zip','json'));

-- ============================================================================
-- SOURCE: database/migrations/0007_subscription_lifecycle.sql
-- ============================================================================
-- V68 subscription lifecycle: distinguish expired trials from cancellations.

alter table platform_tenants drop constraint if exists platform_tenants_platform_status_check;
alter table platform_tenants
  add constraint platform_tenants_platform_status_check
  check (platform_status in ('trial','active','past_due','suspended','expired','cancelled'));

-- ============================================================================
-- SOURCE: database/migrations/0008_production_completion.sql
-- ============================================================================
-- V69: durable operations; additive, no business data rewrite.
alter table organization_subscriptions drop constraint if exists organization_subscriptions_status_check;
alter table organization_subscriptions add constraint organization_subscriptions_status_check
  check (status in ('trial','active','past_due','expired','cancelled'));
alter table billing_webhook_events add column if not exists processing_started_at timestamptz;
alter table billing_webhook_events add column if not exists attempts integer not null default 0;
alter table organization_subscriptions add column if not exists stripe_subscription_created bigint;

create table if not exists mail_outbox (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  deduplication_key text not null,
  kind text not null check (kind in ('quote','invoice','reminder','invitation')),
  entity_id text not null,
  recipient text not null,
  subject text not null,
  body text not null,
  attachment_html text,
  status text not null default 'queued' check (status in ('queued','sending','accepted','failed','uncertain','cancelled')),
  attempts integer not null default 0,
  provider_request_id text,
  last_error text,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, deduplication_key)
);
create index if not exists mail_outbox_pending on mail_outbox(status, created_at);
create unique index if not exists mail_outbox_one_pending_document on mail_outbox(organization_id, kind, entity_id)
  where kind <> 'invitation' and status in ('queued','sending');
alter table mail_outbox enable row level security;
drop policy if exists tenant_isolation on mail_outbox;
create policy tenant_isolation on mail_outbox
  using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null check (status in ('running','completed','failed')),
  summary jsonb not null default '{}',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists job_runs_started on job_runs(started_at desc);

-- Storage metadata only. Private Azure Blob objects require an independently
-- authorized upload/download implementation before exposing attachments to users.
create table if not exists file_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  object_key text not null unique,
  original_name text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','rejected')),
  created_by text not null,
  created_at timestamptz not null default now(),
  check (object_key like organization_id::text || '/%')
);
alter table file_objects enable row level security;
drop policy if exists tenant_isolation on file_objects;
create policy tenant_isolation on file_objects
  using (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true), '')::uuid);

-- ============================================================================
-- SOURCE: database/migrations/0009_multitenant_rbac_business_model.sql
-- ============================================================================
-- V71 consolidated SaaS foundation: strict tenant ownership, RBAC-ready access,
-- subscription lifecycle, usage limits and audited support access.

-- 1. Tenant lifecycle. Keep business tenancy separate from subscription state.
alter table organizations drop constraint if exists organizations_status_check;
update organizations set status = 'suspended' where status = 'inactive';
alter table organizations add constraint organizations_status_check
  check (status in ('trial','active','grace_period','read_only','suspended','cancelled','archived'));

alter table organization_subscriptions drop constraint if exists organization_subscriptions_status_check;
alter table organization_subscriptions add constraint organization_subscriptions_status_check
  check (status in ('trial','active','past_due','grace_period','read_only','suspended','expired','cancelled'));
alter table organization_subscriptions add column if not exists grace_until timestamptz;

alter table platform_tenants drop constraint if exists platform_tenants_platform_status_check;
alter table platform_tenants add constraint platform_tenants_platform_status_check
  check (platform_status in ('trial','active','past_due','grace_period','read_only','suspended','expired','cancelled','archived'));

-- 2. Plan limits are data, not UI-only metadata.
alter table organization_entitlements add column if not exists max_monthly_documents integer not null default 500 check (max_monthly_documents > 0);
alter table organization_entitlements add column if not exists max_api_requests_per_month integer not null default 10000 check (max_api_requests_per_month > 0);

create table if not exists organization_usage_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  metric text not null check (metric in ('users','storage_mb','documents','api_requests')),
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, period, metric)
);

-- 3. Every persisted business child row receives tenant ownership as well.
alter table quote_lines add column if not exists organization_id uuid references organizations(id);
alter table contract_lines add column if not exists organization_id uuid references organizations(id);
alter table invoice_lines add column if not exists organization_id uuid references organizations(id);
alter table invoice_line_time_entries add column if not exists organization_id uuid references organizations(id);

update quote_lines l set organization_id = q.organization_id from quotes q where q.id = l.quote_id and l.organization_id is null;
update contract_lines l set organization_id = c.organization_id from contracts c where c.id = l.contract_id and l.organization_id is null;
update invoice_lines l set organization_id = i.organization_id from invoices i where i.id = l.invoice_id and l.organization_id is null;
update invoice_line_time_entries x set organization_id = l.organization_id from invoice_lines l where l.id = x.invoice_line_id and x.organization_id is null;

alter table quote_lines alter column organization_id set not null;
alter table contract_lines alter column organization_id set not null;
alter table invoice_lines alter column organization_id set not null;
alter table invoice_line_time_entries alter column organization_id set not null;

-- 4. Tenant-local identifiers. The same person, number or supplier may exist in different tenants.
alter table suppliers drop constraint if exists suppliers_supplier_no_key;
alter table employees drop constraint if exists employees_email_key;
alter table employees drop constraint if exists employees_entra_oid_key;
alter table invoices drop constraint if exists invoices_invoice_no_key;
create unique index if not exists uq_suppliers_org_supplier_no on suppliers(organization_id, supplier_no);
create unique index if not exists uq_employees_org_email_ci on employees(organization_id, lower(email));
create unique index if not exists uq_employees_org_entra_oid on employees(organization_id, entra_oid) where entra_oid is not null;
create unique index if not exists uq_invoices_org_invoice_no on invoices(organization_id, invoice_no);
create unique index if not exists uq_company_profile_org on company_profile(organization_id);

-- 5. Composite keys let PostgreSQL enforce that relationships never cross tenant boundaries.
create unique index if not exists uq_customers_org_id on customers(organization_id, id);
create unique index if not exists uq_suppliers_org_id on suppliers(organization_id, id);
create unique index if not exists uq_employees_org_id on employees(organization_id, id);
create unique index if not exists uq_quotes_org_id on quotes(organization_id, id);
create unique index if not exists uq_orders_org_id on orders(organization_id, id);
create unique index if not exists uq_time_entries_org_id on time_entries(organization_id, id);
create unique index if not exists uq_invoices_org_id on invoices(organization_id, id);
create unique index if not exists uq_contracts_org_id on contracts(organization_id, id);
create unique index if not exists uq_quote_lines_org_id on quote_lines(organization_id, id);
create unique index if not exists uq_contract_lines_org_id on contract_lines(organization_id, id);
create unique index if not exists uq_invoice_lines_org_id on invoice_lines(organization_id, id);

alter table quotes drop constraint if exists fk_quotes_tenant_customer;
alter table quotes add constraint fk_quotes_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table orders drop constraint if exists fk_orders_tenant_customer;
alter table orders add constraint fk_orders_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table orders drop constraint if exists fk_orders_tenant_quote;
alter table orders add constraint fk_orders_tenant_quote foreign key (organization_id, source_quote_id) references quotes(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_order;
alter table time_entries add constraint fk_time_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_employee;
alter table time_entries add constraint fk_time_tenant_employee foreign key (organization_id, employee_id) references employees(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_supplier;
alter table time_entries add constraint fk_time_tenant_supplier foreign key (organization_id, supplier_id) references suppliers(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_invoice;
alter table time_entries add constraint fk_time_tenant_invoice foreign key (organization_id, invoiced_invoice_id) references invoices(organization_id, id);
alter table invoices drop constraint if exists fk_invoices_tenant_customer;
alter table invoices add constraint fk_invoices_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table invoices drop constraint if exists fk_invoices_tenant_order;
alter table invoices add constraint fk_invoices_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table payments drop constraint if exists fk_payments_tenant_invoice;
alter table payments add constraint fk_payments_tenant_invoice foreign key (organization_id, invoice_id) references invoices(organization_id, id);
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_supplier;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_supplier foreign key (organization_id, supplier_id) references suppliers(organization_id, id);
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_order;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table contracts drop constraint if exists fk_contracts_tenant_customer;
alter table contracts add constraint fk_contracts_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table quote_lines drop constraint if exists fk_quote_lines_tenant_quote;
alter table quote_lines add constraint fk_quote_lines_tenant_quote foreign key (organization_id, quote_id) references quotes(organization_id, id) on delete cascade;
alter table contract_lines drop constraint if exists fk_contract_lines_tenant_contract;
alter table contract_lines add constraint fk_contract_lines_tenant_contract foreign key (organization_id, contract_id) references contracts(organization_id, id) on delete cascade;
alter table invoice_lines drop constraint if exists fk_invoice_lines_tenant_invoice;
alter table invoice_lines add constraint fk_invoice_lines_tenant_invoice foreign key (organization_id, invoice_id) references invoices(organization_id, id) on delete cascade;
alter table invoice_line_time_entries drop constraint if exists fk_invoice_line_time_entries_tenant_line;
alter table invoice_line_time_entries add constraint fk_invoice_line_time_entries_tenant_line foreign key (organization_id, invoice_line_id) references invoice_lines(organization_id, id) on delete cascade;
alter table invoice_line_time_entries drop constraint if exists fk_invoice_line_time_entries_tenant_time;
alter table invoice_line_time_entries add constraint fk_invoice_line_time_entries_tenant_time foreign key (organization_id, time_entry_id) references time_entries(organization_id, id);

-- 6. Explicit role catalogue. Membership.role stays as the compatible standard-role code;
-- role_id enables tenant-defined roles later without changing business tables.
create table if not exists organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (organization_id, id)
);

create table if not exists organization_role_permissions (
  organization_id uuid not null references organizations(id) on delete cascade,
  role_id uuid not null,
  permission text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, role_id, permission),
  foreign key (organization_id, role_id) references organization_roles(organization_id, id) on delete cascade
);

alter table organization_memberships add column if not exists role_id uuid;
create index if not exists idx_memberships_org_role_id on organization_memberships(organization_id, role_id);

-- 7. Support access is explicit, time-bound and auditable. Platform roles alone do not imply tenant-data access.
create table if not exists support_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by_user_id text not null,
  approved_by_user_id text,
  platform_actor_user_id text,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'requested' check (status in ('requested','approved','active','revoked','expired')),
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);
create index if not exists idx_support_access_org_status on support_access_grants(organization_id, status, valid_until);

-- 8. RLS applies to every tenant-owned table, including child, access and usage tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'quote_lines','contract_lines','invoice_lines','invoice_line_time_entries',
    'organization_roles','organization_role_permissions','organization_usage_counters','support_access_grants'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;

-- 9. Existing system roles are represented in the tenant role catalogue.
insert into organization_roles (organization_id, code, name, is_system)
select o.id, r.code, r.name, true
from organizations o
cross join (values
  ('owner','Inhaber'),
  ('admin','Administration'),
  ('finance','Finanzen'),
  ('employee','Mitarbeitende')
) as r(code,name)
on conflict (organization_id, code) do update set name = excluded.name, is_system = true;

update organization_memberships m
set role_id = r.id
from organization_roles r
where r.organization_id = m.organization_id and r.code = m.role and m.role_id is null;

-- Role permissions are seeded for discoverability/audit. Application authorization remains deny-by-default.
insert into organization_role_permissions (organization_id, role_id, permission)
select r.organization_id, r.id, p.permission
from organization_roles r
join lateral (
  select unnest(case r.code
    when 'owner' then array['organization.read','organization.manage','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','subscription.manage','billing.manage','support.request']::text[]
    when 'admin' then array['organization.read','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','support.request']::text[]
    when 'finance' then array['organization.read','members.read','customers.read','quotes.read','orders.read','contracts.read','time.read','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employee_costs.read','audit.read','exports.create','subscription.read','support.request']::text[]
    else array['organization.read','customers.read','orders.read','time.read','time.write','support.request']::text[]
  end) as permission
) p on true
where r.is_system = true
on conflict do nothing;

-- 10. New tenants automatically receive the four system role definitions.
create or replace function seed_system_roles_for_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into organization_roles (organization_id, code, name, is_system)
  values
    (new.id, 'owner', 'Inhaber', true),
    (new.id, 'admin', 'Administration', true),
    (new.id, 'finance', 'Finanzen', true),
    (new.id, 'employee', 'Mitarbeitende', true)
  on conflict (organization_id, code) do nothing;

  insert into organization_role_permissions (organization_id, role_id, permission)
  select r.organization_id, r.id, p.permission
  from organization_roles r
  join lateral (
    select unnest(case r.code
      when 'owner' then array['organization.read','organization.manage','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','subscription.manage','billing.manage','support.request']::text[]
      when 'admin' then array['organization.read','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','support.request']::text[]
      when 'finance' then array['organization.read','members.read','customers.read','quotes.read','orders.read','contracts.read','time.read','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employee_costs.read','audit.read','exports.create','subscription.read','support.request']::text[]
      else array['organization.read','customers.read','orders.read','time.read','time.write','support.request']::text[]
    end) as permission
  ) p on true
  where r.organization_id = new.id and r.is_system = true
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists trg_seed_system_roles on organizations;
create trigger trg_seed_system_roles
after insert on organizations
for each row execute function seed_system_roles_for_organization();



-- V72 shared subscription catalogue (see migration 0010 for seed data).
create table if not exists subscription_plan_catalog (plan_id text primary key, name text not null, self_service boolean not null default true, sort_order integer not null, monthly_price_chf numeric(10,2), included_users integer not null, max_storage_mb integer not null, updated_at timestamptz not null default now());
create table if not exists subscription_plan_features (plan_id text not null references subscription_plan_catalog(plan_id) on delete cascade, feature text not null, primary key(plan_id,feature));
-- V73 SaaS platform foundation: guided onboarding, digital support, operator governance and safe feature controls.

alter table signup_requests add column if not exists onboarding_status text not null default 'not_started'
  check (onboarding_status in ('not_started','in_progress','completed','skipped'));
alter table signup_requests add column if not exists onboarding_step integer not null default 1 check (onboarding_step between 1 and 5);
alter table signup_requests add column if not exists onboarding_completed_steps jsonb not null default '[]'::jsonb;
alter table signup_requests add column if not exists onboarding_module_preferences jsonb not null default '[]'::jsonb;
alter table signup_requests add column if not exists onboarding_business_settings jsonb not null default '{}'::jsonb;
alter table signup_requests add column if not exists onboarding_updated_at timestamptz;

create table if not exists support_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique,
  organization_id uuid not null references organizations(id) on delete cascade,
  created_by_user_id text not null,
  category text not null check (category in ('usage','technical','billing','account','other')),
  subject text not null check (char_length(subject) between 3 and 160),
  status text not null default 'open' check (status in ('open','in_progress','waiting_for_customer','resolved','closed')),
  internal_priority text check (internal_priority is null or internal_priority in ('low','normal','high','urgent')),
  current_page text,
  entity_type text,
  entity_id text,
  build_version text,
  browser text,
  correlation_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_support_cases_org_status_updated on support_cases(organization_id,status,updated_at desc);

create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references support_cases(id) on delete cascade,
  author_type text not null check (author_type in ('customer','operator')),
  author_user_id text not null,
  message text not null check (char_length(message) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index if not exists idx_support_messages_case_created on support_messages(case_id,created_at);

create table if not exists platform_internal_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references organizations(id) on delete cascade,
  author_user_id text not null,
  author_email text not null,
  note text not null check (char_length(note) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table if not exists platform_feature_flags (
  key text primary key,
  description text not null,
  enabled boolean not null default false,
  updated_by_user_id text,
  updated_at timestamptz not null default now()
);

create table if not exists organization_entitlement_overrides (
  organization_id uuid not null references organizations(id) on delete cascade,
  feature text not null,
  enabled boolean not null,
  reason text not null,
  updated_by_user_id text not null,
  updated_at timestamptz not null default now(),
  primary key(organization_id,feature)
);

create table if not exists in_app_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text,
  kind text not null check (kind in ('support','account','approval','billing','system')),
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_notifications_org_user_created on in_app_notifications(organization_id,user_id,created_at desc);

alter table support_cases enable row level security;
alter table support_messages enable row level security;
alter table in_app_notifications enable row level security;

do $$ begin
  create policy support_cases_tenant_policy on support_cases using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy support_messages_tenant_policy on support_messages using (
    exists(select 1 from support_cases c where c.id=case_id and c.organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  );
exception when duplicate_object then null; end $$;
do $$ begin
  create policy notifications_tenant_policy on in_app_notifications using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);
exception when duplicate_object then null; end $$;

insert into platform_feature_flags(key,description,enabled) values
 ('support_center','Digitaler In-App-Support',true),
 ('guided_onboarding','Geführtes Onboarding',true),
 ('operator_portal_v73','Erweitertes Operator-Portal',true)
on conflict (key) do nothing;
-- V74 production hardening: unified cases, pilot/demo metadata, safer RLS checks and public lead intake.

-- Support/feedback case model.
alter table support_cases add column if not exists case_type text not null default 'support'
  check (case_type in ('support','feedback','feature_request','billing'));
alter table support_cases add column if not exists classification text
  check (classification is null or classification in ('blocker','friction','request'));
alter table support_cases add column if not exists is_pilot_related boolean not null default false;
create index if not exists idx_support_cases_type_status_updated on support_cases(case_type,status,updated_at desc);

-- Race-safe human-readable case numbering.
create sequence if not exists support_case_number_seq start with 1042;
do $$
declare max_existing bigint;
begin
  select coalesce(max(nullif(regexp_replace(case_number,'[^0-9]','','g'),'')::bigint),1041)
    into max_existing
    from support_cases;
  perform setval('support_case_number_seq', greatest(max_existing,1041), true);
end $$;

-- Pilot/demo metadata belongs to the organisation, not to client-side state.
alter table organizations add column if not exists is_demo boolean not null default false;
alter table organizations add column if not exists is_pilot_customer boolean not null default false;
alter table organizations add column if not exists pilot_group text;
alter table organizations add column if not exists pilot_started_at timestamptz;
alter table organizations add column if not exists pilot_ends_at timestamptz;
alter table organizations add column if not exists pilot_status text
  check (pilot_status is null or pilot_status in ('active_pilot','pilot_review','pilot_completed','converted','not_converted','extended'));
alter table organizations add column if not exists pilot_outcome_reason text;
create index if not exists idx_organizations_pilot on organizations(is_pilot_customer,pilot_status) where is_pilot_customer=true;
create index if not exists idx_organizations_demo on organizations(is_demo) where is_demo=true;

-- Lightweight public sales/contact intake. No support conversations belong here.
create table if not exists public_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  company text,
  email text not null check (char_length(email) between 5 and 320),
  topic text not null default 'general' check (topic in ('general','sales','pilot','partnership')),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new','contacted','qualified','pilot','converted','closed')),
  source text not null default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_public_leads_status_created on public_leads(status,created_at desc);

-- Explicit WITH CHECK prevents tenant-id substitution on INSERT/UPDATE.
drop policy if exists support_cases_tenant_policy on support_cases;
create policy support_cases_tenant_policy on support_cases
  using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);

drop policy if exists support_messages_tenant_policy on support_messages;
create policy support_messages_tenant_policy on support_messages
  using (
    exists(select 1 from support_cases c where c.id=case_id and c.organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  )
  with check (
    exists(select 1 from support_cases c where c.id=case_id and c.organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  );

drop policy if exists notifications_tenant_policy on in_app_notifications;
create policy notifications_tenant_policy on in_app_notifications
  using (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid)
  with check (organization_id = nullif(current_setting('app.organization_id', true),'')::uuid);

insert into platform_feature_flags(key,description,enabled) values
 ('unified_support_feedback','Gemeinsame Case Engine für Support und Feedback',true),
 ('pilot_program','Pilotkunden und Pilotfeedback',true),
 ('public_contact_leads','Öffentliche Kontaktanfragen als Leads',true)
on conflict (key) do nothing;


-- ============================================================================
-- SOURCE: database/migrations/0013_v75_complete_product_foundation.sql
-- ============================================================================
-- V75 complete product foundation: operator separation, support/pilot/leads workflows,
-- help centre, analytics, billing reconciliation, data lifecycle, incidents and releases.

-- Functional operator roles are application data. Entra remains the eligibility/authentication boundary.
create table if not exists platform_operator_assignments (
  user_id text primary key,
  email text not null,
  role text not null check (role in ('platform_owner','platform_admin','platform_support','platform_billing','platform_auditor')),
  status text not null default 'active' check (status in ('active','suspended')),
  created_by_user_id text,
  updated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_platform_operator_email_ci on platform_operator_assignments(lower(email));

-- Operator/customer detail notes stay separate from tenant business content.
create table if not exists platform_internal_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  author_user_id text not null,
  author_email text not null,
  note text not null check (char_length(note) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists idx_platform_internal_notes_org_created on platform_internal_notes(organization_id, created_at desc);

-- Support/feedback workflow maturity.
alter table support_cases add column if not exists priority text not null default 'normal'
  check (priority in ('low','normal','high','urgent'));
alter table support_cases add column if not exists assigned_to_user_id text;
alter table support_cases add column if not exists first_response_at timestamptz;
alter table support_cases add column if not exists resolved_at timestamptz;
alter table support_cases add column if not exists merged_into_case_id uuid references support_cases(id) on delete set null;
alter table support_messages add column if not exists visibility text not null default 'customer'
  check (visibility in ('customer','internal'));
create index if not exists idx_support_cases_queue on support_cases(status,priority,updated_at desc);
create index if not exists idx_support_cases_assignee on support_cases(assigned_to_user_id,status) where assigned_to_user_id is not null;

-- Public lead workflow.
alter table public_leads add column if not exists assigned_to_user_id text;
alter table public_leads add column if not exists internal_notes text;
alter table public_leads add column if not exists converted_organization_id uuid references organizations(id) on delete set null;
alter table public_leads add column if not exists updated_at timestamptz not null default now();
create index if not exists idx_public_leads_status_updated on public_leads(status,updated_at desc);

-- Pilot goals/outcomes and lightweight product-success metrics.
alter table organizations add column if not exists pilot_goal text;
alter table organizations add column if not exists pilot_outcome text;
alter table organizations add column if not exists pilot_completed_at timestamptz;

create table if not exists organization_milestones (
  organization_id uuid not null references organizations(id) on delete cascade,
  milestone text not null check (milestone in ('onboarding_completed','first_customer','first_quote','first_order','first_time_entry','first_invoice','first_payment')),
  occurred_at timestamptz not null default now(),
  source text not null default 'system',
  primary key (organization_id,milestone)
);

create table if not exists product_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text,
  event_name text not null,
  route text,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists idx_product_events_org_occurred on product_events(organization_id,occurred_at desc);
create index if not exists idx_product_events_name_occurred on product_events(event_name,occurred_at desc);

-- Help centre, intentionally content-only and not a support-system replacement.
create table if not exists help_center_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists help_center_articles (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references help_center_categories(id) on delete set null,
  slug text not null unique,
  title text not null,
  summary text,
  body text not null,
  keywords text[] not null default '{}',
  published boolean not null default false,
  updated_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_help_articles_published on help_center_articles(published,updated_at desc);

create table if not exists help_center_feedback (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references help_center_articles(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  user_id text,
  helpful boolean not null,
  created_at timestamptz not null default now()
);

-- Data lifecycle requests make destructive actions explicit, reviewable and auditable.
create table if not exists data_lifecycle_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by_user_id text not null,
  request_type text not null check (request_type in ('export','cancel','delete')),
  status text not null default 'requested' check (status in ('requested','approved','processing','completed','rejected','cancelled')),
  reason text,
  retention_until timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_data_lifecycle_org_status on data_lifecycle_requests(organization_id,status,created_at desc);

-- Billing reconciliation and durable webhook retry/dead-letter state.
alter table billing_webhook_events add column if not exists next_retry_at timestamptz;
alter table billing_webhook_events add column if not exists dead_lettered_at timestamptz;
create table if not exists billing_reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running','completed','failed')),
  checked_subscriptions integer not null default 0,
  repaired_subscriptions integer not null default 0,
  failed_subscriptions integer not null default 0,
  detail text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Operator-visible release and incident history.
create table if not exists platform_release_events (
  id uuid primary key default gen_random_uuid(),
  build_id text not null,
  environment text not null check (environment in ('staging','production')),
  status text not null check (status in ('started','healthy','failed','rolled_back')),
  commit_sha text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_platform_release_created on platform_release_events(created_at desc);

create table if not exists platform_incidents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  severity text not null check (severity in ('minor','major','critical')),
  status text not null default 'investigating' check (status in ('investigating','identified','monitoring','resolved')),
  public_message text,
  internal_detail text,
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  updated_by_user_id text,
  updated_at timestamptz not null default now()
);
create index if not exists idx_platform_incidents_status_started on platform_incidents(status,started_at desc);

-- Distributed rate-limit buckets backed by PostgreSQL. This avoids per-instance memory limits.
create table if not exists rate_limit_buckets (
  bucket_key text primary key,
  count integer not null,
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_rate_limit_reset on rate_limit_buckets(reset_at);

-- RLS for tenant-owned workflow/analytics records.
do $$
declare t text;
begin
  foreach t in array array['organization_milestones','product_events','data_lifecycle_requests']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;

-- Seed a small, useful help centre without marketing filler.
insert into help_center_categories(slug,title,description,sort_order) values
  ('erste-schritte','Erste Schritte','Einrichtung und erste produktive Schritte.',10),
  ('abrechnung','Abrechnung','Abonnement, Rechnungen und Zahlungsstatus.',20),
  ('support','Support','Supportfälle, Diagnosekontext und Zugriff.',30)
on conflict (slug) do nothing;

insert into help_center_articles(category_id,slug,title,summary,body,keywords,published)
select c.id,'erste-schritte-kunde','Ersten Kunden erfassen','Kunden können mit den wichtigsten Angaben erfasst und später ergänzt werden.',
       'Öffne Kunden und wähle Neuer Kunde. Für den ersten Schritt genügt der Name. Weitere Angaben kannst du später ergänzen.',
       array['kunden','erfassen','erste schritte'],true
from help_center_categories c where c.slug='erste-schritte'
on conflict (slug) do nothing;

insert into help_center_articles(category_id,slug,title,summary,body,keywords,published)
select c.id,'supportfall-erstellen','Supportfall erstellen','Support und Feedback können direkt in Binso One erfasst werden.',
       'Öffne Support, wähle das passende Anliegen und beschreibe kurz das Problem. Binso One ergänzt sicheren technischen Kontext wie Route und Build-Version.',
       array['support','feedback','hilfe'],true
from help_center_categories c where c.slug='support'
on conflict (slug) do nothing;


-- ============================================================================
-- SOURCE: database/migrations/0014_v79_demo_access.sql
-- ============================================================================
-- V79: explicit self-service demo signup mode.
alter table signup_requests
  add column if not exists signup_mode text not null default 'trial'
  check (signup_mode in ('trial','demo'));

create index if not exists idx_signup_requests_mode_status
  on signup_requests(signup_mode, status, updated_at desc);
