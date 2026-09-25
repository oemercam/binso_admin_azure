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
