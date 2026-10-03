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
