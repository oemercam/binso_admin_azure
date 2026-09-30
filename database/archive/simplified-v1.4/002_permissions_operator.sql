begin;

-- Customer tenant role model.
alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check check(role in ('owner','admin','finance','hr','project_manager','manager','member','reader'));

-- Separate Binso One operator identities from customer tenant identities.
create table if not exists platform_users(
 id uuid primary key default gen_random_uuid(),
 name text not null,
 email citext not null unique,
 password_hash text not null,
 role text not null check(role in ('platform_owner','platform_admin','support','billing','security_auditor')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists platform_sessions(
 id uuid primary key default gen_random_uuid(),
 platform_user_id uuid not null references platform_users(id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists platform_sessions_exp_idx on platform_sessions(expires_at);

create table if not exists platform_audit_logs(
 id bigint generated always as identity primary key,
 platform_user_id uuid references platform_users(id) on delete set null,
 action text not null,
 entity_type text not null,
 entity_id text,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create index if not exists platform_audit_time_idx on platform_audit_logs(created_at desc);

commit;
