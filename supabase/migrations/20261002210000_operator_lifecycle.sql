-- Binso One v0.8 operator and lifecycle foundation.
-- These tables model platform state. External billing-provider truth remains a separate integration.

create table if not exists public.tenant_accounts (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  plan text not null default 'trial' check (plan in ('trial','start','business','pro')),
  subscription_status text not null default 'trial' check (subscription_status in ('trial','active','past_due','suspended','cancelled')),
  account_status text not null default 'active' check (account_status in ('active','restricted','suspended','cancelled')),
  trial_ends_at timestamptz,
  current_period_ends_at timestamptz,
  user_limit int not null default 3 check (user_limit > 0),
  storage_limit_bytes bigint not null default 2147483648 check (storage_limit_bytes >= 0),
  billing_customer_ref text,
  billing_subscription_ref text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_restrictions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  scope text not null check (scope in ('all','write')),
  reason text not null,
  note text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  removed_at timestamptz,
  removed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.platform_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  kind text not null default 'information' check (kind in ('information','maintenance','incident','feature')),
  audience text not null default 'all' check (audience in ('all','start','business','pro')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  published boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_incidents (
  id uuid primary key default gen_random_uuid(),
  service text not null,
  title text not null,
  status text not null check (status in ('operational','degraded','partial_outage','major_outage','maintenance','resolved')),
  started_at timestamptz not null default now(),
  resolved_at timestamptz,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.operator_audit (
  id bigint generated always as identity primary key,
  operator_user_id uuid not null references auth.users(id),
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_tenant_accounts_status on public.tenant_accounts(account_status,subscription_status);
create index if not exists idx_tenant_restrictions_active on public.tenant_restrictions(tenant_id,active);
create index if not exists idx_announcements_active on public.platform_announcements(published,starts_at);
create index if not exists idx_incidents_started on public.platform_incidents(started_at desc);
create index if not exists idx_operator_audit_created on public.operator_audit(created_at desc);

create or replace function public.ensure_tenant_account()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.tenant_accounts(tenant_id,plan,subscription_status,account_status,trial_ends_at,current_period_ends_at,user_limit)
  values(new.id,'trial','trial','active',now()+interval '30 days',now()+interval '30 days',3)
  on conflict(tenant_id) do nothing;
  return new;
end $$;

drop trigger if exists on_tenant_created_account on public.tenants;
create trigger on_tenant_created_account
after insert on public.tenants
for each row execute function public.ensure_tenant_account();

insert into public.tenant_accounts(tenant_id,plan,subscription_status,account_status,trial_ends_at,current_period_ends_at,user_limit)
select id,'trial','trial','active',created_at+interval '30 days',created_at+interval '30 days',3
from public.tenants
on conflict(tenant_id) do nothing;

alter table public.tenant_accounts enable row level security;
alter table public.tenant_restrictions enable row level security;
alter table public.platform_announcements enable row level security;
alter table public.platform_incidents enable row level security;
alter table public.operator_audit enable row level security;

-- Customer-side account state.
drop policy if exists tenant_account_member_read on public.tenant_accounts;
create policy tenant_account_member_read on public.tenant_accounts
for select using(public.is_tenant_member(tenant_id));

drop policy if exists tenant_restriction_member_read on public.tenant_restrictions;
create policy tenant_restriction_member_read on public.tenant_restrictions
for select using(public.is_tenant_member(tenant_id));

drop policy if exists announcements_authenticated_read on public.platform_announcements;
create policy announcements_authenticated_read on public.platform_announcements
for select using(
  published=true
  and starts_at<=now()
  and (ends_at is null or ends_at>now())
);

drop policy if exists incidents_authenticated_read on public.platform_incidents;
create policy incidents_authenticated_read on public.platform_incidents
for select using(true);

-- Operator read access to tenant data. is_operator() is security-definer and only returns a boolean.
do $$ declare t text;
begin
  foreach t in array array[
    'tenants','tenant_memberships','customers','products','employees','documents','document_items',
    'payments','expenses','time_entries','support_tickets','support_messages','audit_log',
    'tenant_accounts','tenant_restrictions'
  ]
  loop
    execute format('drop policy if exists %I_operator_select on public.%I',t,t);
    execute format('create policy %I_operator_select on public.%I for select using(public.is_operator())',t,t);
  end loop;
end $$;

drop policy if exists announcements_operator_all on public.platform_announcements;
create policy announcements_operator_all on public.platform_announcements
for all using(public.is_operator()) with check(public.is_operator());

drop policy if exists incidents_operator_all on public.platform_incidents;
create policy incidents_operator_all on public.platform_incidents
for all using(public.is_operator()) with check(public.is_operator());

drop policy if exists operator_audit_operator_select on public.operator_audit;
create policy operator_audit_operator_select on public.operator_audit
for select using(public.is_operator());

drop policy if exists operator_audit_operator_insert on public.operator_audit;
create policy operator_audit_operator_insert on public.operator_audit
for insert with check(public.is_operator() and operator_user_id=auth.uid());

drop policy if exists tenant_accounts_operator_update on public.tenant_accounts;
create policy tenant_accounts_operator_update on public.tenant_accounts
for update using(public.is_operator()) with check(public.is_operator());

drop policy if exists tenant_restrictions_operator_insert on public.tenant_restrictions;
create policy tenant_restrictions_operator_insert on public.tenant_restrictions
for insert with check(public.is_operator() and created_by=auth.uid());

drop policy if exists tenant_restrictions_operator_update on public.tenant_restrictions;
create policy tenant_restrictions_operator_update on public.tenant_restrictions
for update using(public.is_operator()) with check(public.is_operator());

create or replace function public.touch_platform_announcement_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists trg_touch_platform_announcement on public.platform_announcements;
create trigger trg_touch_platform_announcement
before update on public.platform_announcements
for each row execute function public.touch_platform_announcement_updated_at();
