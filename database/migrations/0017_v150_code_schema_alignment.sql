
-- Binso One v1.5 canonical alignment.
-- This migration targets the production lineage 0001_baseline.sql .. 0016_self_service_signup.sql.
-- It extends the canonical SaaS model; it does not recreate the divergent users/sessions/records model.

create extension if not exists pgcrypto;


-- Align membership roles with the current application RBAC catalogue.
alter table organization_memberships drop constraint if exists organization_memberships_role_check;
alter table organization_memberships add constraint organization_memberships_role_check
  check (role in ('owner','admin','finance','hr','project_manager','manager','member','reader','employee'));

insert into organization_roles(organization_id,code,name,is_system)
select o.id,r.code,r.name,true
from organizations o
cross join (values
 ('hr','Personal'),('project_manager','Projektleitung'),('manager','Management'),('member','Mitarbeitende'),('reader','Lesen')
) r(code,name)
on conflict (organization_id,code) do update set name=excluded.name,is_system=true;

-- Local customer authentication remains attached to the canonical app_users identity.
alter table app_users add column if not exists password_hash text;
alter table app_users add column if not exists language text not null default 'de'
  check (language in ('de','en','fr','it','tr'));
alter table app_users add column if not exists email_verified_at timestamptz;
alter table app_users add column if not exists mfa_enabled boolean not null default false;
alter table app_users add column if not exists mfa_secret_enc text;
alter table app_users add column if not exists recovery_code_hashes jsonb not null default '[]'::jsonb;
alter table app_users add column if not exists terms_version text;
alter table app_users add column if not exists terms_accepted_at timestamptz;
alter table app_users add column if not exists privacy_version text;

create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app_users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  user_agent text,
  ip_hash text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_auth_sessions_user on auth_sessions(user_id, expires_at desc);
create index if not exists idx_auth_sessions_org on auth_sessions(organization_id, expires_at desc);
create index if not exists idx_auth_sessions_expiry on auth_sessions(expires_at);

create table if not exists auth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id text references app_users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  token_type text not null check (token_type in ('verify_email','password_reset','invitation')),
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_auth_tokens_expiry on auth_tokens(token_type, expires_at) where consumed_at is null;

-- Per-user notification preferences are identity based, while notifications remain canonical in_app_notifications.
create table if not exists notification_preferences (
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  kind text not null,
  in_app boolean not null default true,
  email boolean not null default true,
  push boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id, kind)
);
create index if not exists idx_notification_preferences_org_user on notification_preferences(organization_id, user_id);

create table if not exists organization_feature_flags (
  organization_id uuid not null references organizations(id) on delete cascade,
  flag_key text not null references platform_feature_flags(key) on delete cascade,
  enabled boolean not null,
  updated_by_user_id text,
  updated_at timestamptz not null default now(),
  primary key(organization_id,flag_key)
);

-- Platform announcements are platform content, not tenant business records.
create table if not exists platform_announcements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  title text not null,
  message text not null,
  kind text not null default 'info' check (kind in ('info','success','warning')),
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_platform_announcements_active on platform_announcements(active, starts_at desc, ends_at);

-- Product feedback is a first-class product-success entity, separate from support cases.
create table if not exists product_feedback (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id text references app_users(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  category text not null,
  feedback_text text not null,
  may_contact boolean not null default false,
  context_path text,
  status text not null default 'new' check (status in ('new','reviewing','planned','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_product_feedback_created on product_feedback(created_at desc);
create index if not exists idx_product_feedback_org on product_feedback(organization_id, created_at desc);

-- Extend canonical file metadata for the Azure Blob integration and support attachments.
alter table file_objects add column if not exists blob_url text;
alter table file_objects add column if not exists purpose text;
alter table file_objects add column if not exists support_case_id uuid references support_cases(id) on delete cascade;
create index if not exists idx_file_objects_support on file_objects(organization_id, support_case_id, created_at desc);

create sequence if not exists support_case_number_seq;
do $$
declare max_no bigint;
begin
  select coalesce(max(substring(case_number from '[0-9]+$')::bigint),0) into max_no from support_cases;
  if max_no > 0 then perform setval('support_case_number_seq',max_no,true); end if;
end $$;

alter table support_access_grants add column if not exists support_case_id uuid references support_cases(id) on delete cascade;
alter table support_access_grants add column if not exists scope text[] not null default '{diagnostics}'::text[];
alter table support_access_grants add column if not exists revoked_at timestamptz;
create index if not exists idx_support_access_case on support_access_grants(organization_id,support_case_id,created_at desc);

-- Support diagnostics/access data belong to the canonical support case.
alter table support_cases add column if not exists description text;
alter table support_cases add column if not exists diagnostics jsonb not null default '{}'::jsonb;
alter table support_cases add column if not exists assigned_operator_user_id text;
alter table support_cases add column if not exists screenshot_file_id uuid references file_objects(id) on delete set null;

-- Operator local-auth fields remain on the canonical assignment row.
alter table platform_operator_assignments add column if not exists display_name text;
alter table platform_operator_assignments add column if not exists password_hash text;
alter table platform_operator_assignments add column if not exists mfa_enabled boolean not null default false;
alter table platform_operator_assignments add column if not exists mfa_secret_enc text;
alter table platform_operator_assignments add column if not exists recovery_code_hashes jsonb not null default '[]'::jsonb;
alter table platform_operator_assignments add column if not exists last_login_at timestamptz;

create table if not exists platform_auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references platform_operator_assignments(user_id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  user_agent text,
  ip_hash text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_platform_auth_sessions_user on platform_auth_sessions(user_id, expires_at desc);
create index if not exists idx_platform_auth_sessions_expiry on platform_auth_sessions(expires_at);

-- Missing business domains in the current UI are normalized as dedicated tenant tables.
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  customer_id uuid references customers(id),
  manager_employee_id uuid references employees(id),
  name text not null,
  team_text text,
  budget numeric(14,2) not null default 0,
  hours_budget numeric(12,2) not null default 0,
  progress numeric(5,2) not null default 0 check (progress between 0 and 100),
  start_date date,
  end_date date,
  status text not null default 'planned' check (status in ('planned','in_progress','active','blocked','completed','cancelled')),
  notes text,
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_projects_org_status on projects(organization_id, status, updated_at desc);

create table if not exists products_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  name text not null,
  item_type text not null check (item_type in ('service','product')),
  unit text not null,
  unit_price numeric(14,2) not null default 0,
  vat_rate numeric(5,2) not null default 8.1,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_products_services_org_status on products_services(organization_id, status, updated_at desc);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  title text not null,
  customer_id uuid references customers(id),
  project_id uuid references projects(id),
  invoice_id uuid references invoices(id),
  assignee_employee_id uuid references employees(id),
  due_date date,
  priority text not null default 'normal' check (priority in ('normal','high','critical')),
  status text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_tasks_org_status_due on tasks(organization_id, status, due_date, updated_at desc);

create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  employee_id uuid not null references employees(id),
  absence_type text not null check (absence_type in ('vacation','sick','unpaid','military_civil','other')),
  start_date date not null,
  end_date date not null,
  days numeric(6,2) not null default 1 check (days >= 0),
  status text not null default 'open' check (status in ('open','approved','rejected','cancelled')),
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date),
  unique (organization_id, external_id)
);
create index if not exists idx_absences_org_employee_dates on absences(organization_id, employee_id, start_date, end_date);

create table if not exists accounting_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  entry_date date not null,
  document_ref text not null,
  account_no text not null,
  contra_account_no text,
  amount numeric(14,2) not null,
  status text not null default 'draft' check (status in ('draft','posted','reversed')),
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_accounting_entries_org_date on accounting_entries(organization_id, entry_date desc, id desc);

create table if not exists bank_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  booking_date date not null,
  account_label text,
  description text not null,
  amount numeric(14,2) not null,
  status text not null default 'open' check (status in ('open','matched','booked','ignored')),
  invoice_id uuid references invoices(id),
  created_by_user_id text,
  version integer not null default 1,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_bank_transactions_org_date on bank_transactions(organization_id, booking_date desc, id desc);

create table if not exists vat_periods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  period text not null,
  output_vat numeric(14,2) not null default 0,
  input_vat numeric(14,2) not null default 0,
  payable numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','prepared','filed','paid','closed')),
  created_by_user_id text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id),
  unique (organization_id, period)
);

create table if not exists payroll_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  employee_id uuid references employees(id),
  period text not null,
  gross_amount numeric(14,2) not null default 0,
  deduction_amount numeric(14,2) not null default 0,
  net_amount numeric(14,2) not null default 0,
  status text not null default 'draft' check (status in ('draft','review','approved','paid','cancelled')),
  created_by_user_id text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_payroll_runs_org_period on payroll_runs(organization_id, period desc, updated_at desc);

create table if not exists business_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  name text not null,
  document_type text not null,
  customer_id uuid references customers(id),
  project_id uuid references projects(id),
  employee_id uuid references employees(id),
  supplier_id uuid references suppliers(id),
  file_object_id uuid references file_objects(id) on delete set null,
  document_date date,
  status text not null default 'current' check (status in ('current','archived')),
  created_by_user_id text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, external_id)
);
create index if not exists idx_business_documents_org_type on business_documents(organization_id, document_type, updated_at desc);

-- Creator attribution supports own-only RBAC and audit without a generic records table.
do $$
declare t text;
begin
  foreach t in array array['customers','quotes','orders','time_entries','invoices','payments','employees','contracts','suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('alter table %I add column if not exists created_by_user_id text', t);
  end loop;
end $$;

-- Current customer UI attributes not present in the canonical baseline.
alter table customers add column if not exists language text not null default 'de';
alter table customers add column if not exists discount numeric(5,2) not null default 0;
alter table customers add column if not exists created_by_user_id text;

create table if not exists entity_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_external_id text not null,
  note_text text not null,
  created_by_user_id text,
  created_at timestamptz not null default now()
);
create index if not exists idx_entity_notes_lookup on entity_notes(organization_id,entity_type,entity_external_id,created_at desc);

create table if not exists entity_file_links (
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null,
  entity_external_id text not null,
  file_object_id uuid not null references file_objects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(organization_id,entity_type,entity_external_id,file_object_id)
);

alter table tasks add column if not exists related_entity_type text;
alter table tasks add column if not exists related_entity_external_id text;
alter table accounting_entries add column if not exists source_type text;
alter table accounting_entries add column if not exists source_external_id text;
alter table invoices add column if not exists recurring boolean not null default false;
alter table invoices add column if not exists recurrence_interval text;

-- Extend existing normalized domains with relationships required by the current product UI.
alter table quotes add column if not exists project_id uuid references projects(id);
alter table invoices add column if not exists project_id uuid references projects(id);
alter table payments alter column invoice_id drop not null;
alter table expenses alter column customer_id drop not null;
alter table time_entries alter column order_id drop not null;
alter table orders add column if not exists project_id uuid references projects(id);
alter table orders add column if not exists amount numeric(14,2) not null default 0;
alter table orders add column if not exists start_date date;
alter table orders add column if not exists end_date date;
alter table orders add column if not exists notes text;
alter table orders add column if not exists created_by_user_id text;

alter table time_entries add column if not exists project_id uuid references projects(id);
alter table time_entries add column if not exists product_service_id uuid references products_services(id);
alter table time_entries add column if not exists start_time time;
alter table time_entries add column if not exists end_time time;
alter table time_entries add column if not exists break_minutes integer not null default 0 check (break_minutes >= 0);
alter table time_entries add column if not exists created_by_user_id text;

alter table expenses add column if not exists employee_id uuid references employees(id);
alter table expenses add column if not exists project_id uuid references projects(id);
alter table expenses add column if not exists receipt_file_id uuid references file_objects(id) on delete set null;
alter table expenses add column if not exists status text not null default 'open' check (status in ('open','approved','posted','rejected'));
alter table expenses add column if not exists created_by_user_id text;

alter table payments add column if not exists payer_customer_id uuid references customers(id);
alter table payments add column if not exists allocation_status text not null default 'matched' check (allocation_status in ('matched','partial','open'));
alter table payments add column if not exists created_by_user_id text;

alter table suppliers add column if not exists phone text;
alter table suppliers add column if not exists address text;
alter table suppliers add column if not exists iban text;
alter table suppliers add column if not exists updated_at timestamptz not null default now();
alter table suppliers add column if not exists created_by_user_id text;

alter table supplier_invoices add column if not exists expense_account text;
alter table supplier_invoices add column if not exists receipt_file_id uuid references file_objects(id) on delete set null;
alter table supplier_invoices add column if not exists created_by_user_id text;

alter table employees add column if not exists title text;
alter table employees add column if not exists phone text;
alter table employees add column if not exists address text;
alter table employees add column if not exists ahv_number text;
alter table employees add column if not exists iban text;
alter table employees add column if not exists workload_percent numeric(5,2) not null default 100;
alter table employees add column if not exists weekly_hours numeric(6,2) not null default 42;
alter table employees add column if not exists vacation_days numeric(6,2) not null default 25;
alter table employees add column if not exists start_date date;
alter table employees add column if not exists monthly_gross numeric(14,2);
alter table employees add column if not exists child_allowance numeric(14,2) not null default 0;
alter table employees add column if not exists withholding_tax_rate numeric(5,2) not null default 0;
alter table employees add column if not exists bvg_deduction numeric(14,2);
alter table employees add column if not exists created_by_user_id text;

alter table contracts alter column customer_id drop not null;
alter table contracts add column if not exists supplier_id uuid references suppliers(id);
alter table contracts add column if not exists contract_value numeric(14,2) not null default 0;
alter table contracts add column if not exists created_by_user_id text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='contracts_exactly_one_party') then
    alter table contracts add constraint contracts_exactly_one_party
      check ((customer_id is not null)::int + (supplier_id is not null)::int = 1) not valid;
  end if;
end $$;

-- Tenant isolation for the new domains.
do $$
declare t text;
begin
  foreach t in array array[
    'projects','products_services','tasks','absences','accounting_entries','bank_transactions',
    'vat_periods','payroll_runs','business_documents','product_feedback','notification_preferences','organization_feature_flags','entity_notes','entity_file_links'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($p$create policy tenant_isolation on %I
      using (organization_id::text = nullif(current_setting('app.organization_id', true), ''))
      with check (organization_id::text = nullif(current_setting('app.organization_id', true), ''))$p$, t);
  end loop;
end $$;



-- The application role may also own tables in smaller deployments. FORCE RLS ensures
-- ownership never bypasses tenant isolation for tenant business data. Cross-tenant
-- operator/platform tables are intentionally excluded and use explicit operator authorization.
do $$
declare t text;
begin
  foreach t in array array[
    'customers','customer_contacts','quotes','quote_lines','orders','time_entries','invoices','invoice_lines',
    'invoice_line_time_entries','payments','employees','contracts','contract_lines','suppliers','supplier_invoices',
    'expenses','credit_notes','customer_activities','projects','products_services','tasks','absences',
    'accounting_entries','bank_transactions','vat_periods','payroll_runs','business_documents','entity_notes','entity_file_links'
  ] loop
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- Application audit metadata used by the operator governance UI.
alter table platform_audit_events add column if not exists entity_type text;
alter table platform_audit_events add column if not exists entity_id text;
alter table platform_audit_events add column if not exists metadata jsonb not null default '{}'::jsonb;

-- Retry-safe response persistence on the canonical business idempotency registry.
alter table business_idempotency_keys add column if not exists response_status integer;
alter table business_idempotency_keys add column if not exists response_body jsonb;
