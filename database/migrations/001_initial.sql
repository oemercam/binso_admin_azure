begin;
create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists organizations(
 id uuid primary key,
 name text not null,
 uid text,
 address text,
 zip_city text,
 phone text,
 industry text,
 employees text,
 plan text not null check(plan in ('start','business','pro')),
 billing_cycle text not null check(billing_cycle in ('monthly','yearly')),
 subscription_status text not null check(subscription_status in ('pending','trial','active','past_due','cancelled')),
 trial_ends_at timestamptz,
 onboarding_complete boolean not null default false,
 stripe_customer_id text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists users(
 id uuid primary key,
 organization_id uuid not null references organizations(id) on delete cascade,
 name text not null,
 email citext not null unique,
 password_hash text not null,
 role text not null check(role in ('owner','admin','finance','manager','member','reader')),
 language text not null default 'de' check(language in ('de','en','fr','it')),
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists sessions(
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references users(id) on delete cascade,
 organization_id uuid not null references organizations(id) on delete cascade,
 token_hash text not null unique,
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index if not exists sessions_exp_idx on sessions(expires_at);
create index if not exists sessions_org_idx on sessions(organization_id);

create table if not exists customers(
 id uuid primary key,
 organization_id uuid not null references organizations(id) on delete cascade,
 name text not null,
 contact text,
 email text,
 phone text,
 address text,
 zip_city text,
 uid text,
 language text not null default 'de',
 payment_days integer not null default 30,
 discount numeric(7,3) not null default 0,
 status text not null default 'active',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists customers_org_name_idx on customers(organization_id,lower(name));

create table if not exists records(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 module text not null,
 status text not null,
 row_data jsonb not null default '[]',
 fields jsonb not null default '{}',
 positions jsonb,
 metadata jsonb not null default '{}',
 created_by uuid references users(id),
 updated_by uuid references users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists records_org_module_idx on records(organization_id,module,updated_at desc);

create table if not exists audit_logs(
 id bigint generated always as identity primary key,
 organization_id uuid not null references organizations(id) on delete cascade,
 user_id uuid references users(id) on delete set null,
 action text not null,
 entity_type text not null,
 entity_id text,
 metadata jsonb not null default '{}',
 created_at timestamptz not null default now()
);
create index if not exists audit_org_time_idx on audit_logs(organization_id,created_at desc);

create table if not exists webhook_events(
 provider text not null,
 event_id text not null,
 event_type text not null,
 payload jsonb not null,
 created_at timestamptz not null default now(),
 primary key(provider,event_id)
);

create table if not exists idempotency_keys(
 organization_id uuid not null references organizations(id) on delete cascade,
 key text not null,
 response jsonb,
 created_at timestamptz not null default now(),
 primary key(organization_id,key)
);

-- Tenant isolation.
alter table customers enable row level security;
alter table records enable row level security;
alter table audit_logs enable row level security;

drop policy if exists customers_tenant on customers;
create policy customers_tenant on customers
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

drop policy if exists records_tenant on records;
create policy records_tenant on records
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

drop policy if exists audit_tenant on audit_logs;
create policy audit_tenant on audit_logs
 using (organization_id::text=current_setting('app.organization_id',true))
 with check (organization_id::text=current_setting('app.organization_id',true));

commit;
