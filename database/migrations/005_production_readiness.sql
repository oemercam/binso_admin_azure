begin;

alter table users add column if not exists email_verified_at timestamptz;
alter table users add column if not exists last_login_at timestamptz;
alter table users add column if not exists mfa_enabled boolean not null default false;
alter table users add column if not exists mfa_secret_enc text;
alter table users add column if not exists recovery_code_hashes jsonb not null default '[]'::jsonb;

alter table sessions add column if not exists user_agent text;
alter table sessions add column if not exists ip_hash text;
alter table sessions add column if not exists last_seen_at timestamptz not null default now();

alter table organizations add column if not exists stripe_subscription_id text;
alter table organizations add column if not exists subscription_current_period_end timestamptz;
alter table organizations add column if not exists cancel_at_period_end boolean not null default false;
alter table organizations add column if not exists deletion_requested_at timestamptz;

create table if not exists auth_tokens(
 id uuid primary key default gen_random_uuid(),
 user_id uuid references users(id) on delete cascade,
 organization_id uuid references organizations(id) on delete cascade,
 email citext not null,
 token_hash text not null unique,
 token_type text not null check(token_type in ('verify_email','password_reset','invitation')),
 metadata jsonb not null default '{}',
 expires_at timestamptz not null,
 consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists auth_tokens_lookup_idx on auth_tokens(token_type,email,expires_at desc);

create table if not exists notifications(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 user_id uuid references users(id) on delete cascade,
 kind text not null,
 title text not null,
 message text not null,
 href text,
 read_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications(organization_id,user_id,created_at desc);

create table if not exists rate_limit_buckets(
 bucket_key text primary key,
 count integer not null,
 reset_at timestamptz not null,
 updated_at timestamptz not null default now()
);

create table if not exists stored_files(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 uploaded_by uuid references users(id) on delete set null,
 purpose text not null,
 file_name text not null,
 mime_type text not null,
 size_bytes bigint not null,
 storage_path text not null,
 created_at timestamptz not null default now()
);
create index if not exists stored_files_org_idx on stored_files(organization_id,created_at desc);


alter table platform_users add column if not exists mfa_enabled boolean not null default false;
alter table platform_users add column if not exists mfa_secret_enc text;
alter table platform_users add column if not exists recovery_code_hashes jsonb not null default '[]'::jsonb;
alter table platform_users add column if not exists last_login_at timestamptz;

create table if not exists support_access_grants(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 granted_by uuid not null references users(id) on delete cascade,
 ticket_id uuid references support_tickets(id) on delete cascade,
 reason text not null,
 scope text[] not null default array[]::text[],
 expires_at timestamptz not null,
 revoked_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists support_access_grants_org_idx on support_access_grants(organization_id,expires_at desc);

alter table webhook_events add column if not exists processed_at timestamptz;
alter table webhook_events add column if not exists processing_error text;
alter table webhook_events add column if not exists attempts integer not null default 0;

alter table support_tickets add column if not exists screenshot_url text;


-- Operator access is limited to support/feedback operational tables. Business data remains tenant-only.
drop policy if exists support_tickets_tenant on support_tickets;
create policy support_tickets_tenant on support_tickets
 using (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true')
 with check (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true');
drop policy if exists support_messages_tenant on support_messages;
create policy support_messages_tenant on support_messages
 using (current_setting('app.platform_operator',true)='true' or exists(select 1 from support_tickets t where t.id=ticket_id and t.organization_id::text=current_setting('app.organization_id',true)))
 with check (current_setting('app.platform_operator',true)='true' or exists(select 1 from support_tickets t where t.id=ticket_id and t.organization_id::text=current_setting('app.organization_id',true)));
drop policy if exists feedback_tenant on feedback_entries;
create policy feedback_tenant on feedback_entries
 using (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true')
 with check (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true');

alter table customers force row level security;
alter table records force row level security;
alter table audit_logs force row level security;
alter table support_tickets force row level security;
alter table support_messages force row level security;
alter table feedback_entries force row level security;

alter table support_access_grants enable row level security;
alter table support_access_grants force row level security;
drop policy if exists support_access_grants_tenant on support_access_grants;
create policy support_access_grants_tenant on support_access_grants
 using (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true')
 with check (organization_id::text=current_setting('app.organization_id',true) or current_setting('app.platform_operator',true)='true');

alter table notifications enable row level security;
alter table notifications force row level security;
drop policy if exists notifications_tenant on notifications;
create policy notifications_tenant on notifications
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

alter table stored_files enable row level security;
alter table stored_files force row level security;
drop policy if exists stored_files_tenant on stored_files;
create policy stored_files_tenant on stored_files
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

commit;
