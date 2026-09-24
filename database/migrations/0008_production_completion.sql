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
