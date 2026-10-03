-- Binso One production schema foundation
-- Tenant isolation is enforced with PostgreSQL RLS. No service-role key is required by customer-facing routes.

create extension if not exists pgcrypto;

do $$ begin
  create type public.membership_role as enum ('owner','admin','member');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_kind as enum ('offer','invoice');
exception when duplicate_object then null; end $$;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.membership_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (tenant_id,user_id)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  sector text,
  email text,
  phone text,
  street text,
  postal_code text,
  city text,
  uid text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  kind text not null default 'service' check (kind in ('service','product')),
  sku text,
  unit text not null default 'hour',
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  vat_rate numeric(5,2) not null default 8.1 check (vat_rate >= 0),
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  job_title text,
  workload_percent int check (workload_percent between 0 and 100),
  entry_date date,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete restrict,
  kind public.document_kind not null,
  number text not null,
  status text not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  valid_until date,
  vat_rate numeric(5,2) not null default 8.1,
  note text,
  currency char(3) not null default 'CHF',
  subtotal numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id,kind,number)
);

create table if not exists public.document_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  position int not null,
  description text not null,
  quantity numeric(14,3) not null default 1,
  unit_price numeric(14,2) not null default 0,
  line_total numeric(14,2) generated always as (round(quantity * unit_price,2)) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid references public.documents(id) on delete restrict,
  customer_id uuid references public.customers(id) on delete restrict,
  paid_on date not null default current_date,
  amount numeric(14,2) not null check (amount > 0),
  method text not null default 'bank',
  note text,
  status text not null default 'booked' check (status in ('pending','booked','reversed')),
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  employee_id uuid references public.employees(id) on delete set null,
  merchant text not null,
  expense_date date not null default current_date,
  category text,
  amount numeric(14,2) not null check (amount >= 0),
  currency char(3) not null default 'CHF',
  vat_rate numeric(5,2) not null default 8.1,
  description text,
  status text not null default 'draft' check (status in ('draft','submitted','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  project_name text,
  description text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes int check (duration_minutes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  subject text not null,
  category text,
  priority text not null default 'normal' check (priority in ('low','normal','high','critical')),
  status text not null default 'open' check (status in ('new','open','in_progress','waiting_customer','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id),
  author_type text not null default 'customer' check (author_type in ('customer','operator','system')),
  body text not null,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_customers_tenant on public.customers(tenant_id);
create index if not exists idx_products_tenant on public.products(tenant_id);
create index if not exists idx_documents_tenant_kind on public.documents(tenant_id,kind);
create index if not exists idx_document_items_document on public.document_items(document_id);
create index if not exists idx_payments_tenant on public.payments(tenant_id);
create index if not exists idx_expenses_tenant on public.expenses(tenant_id);
create index if not exists idx_time_entries_tenant on public.time_entries(tenant_id);
create index if not exists idx_support_tickets_tenant on public.support_tickets(tenant_id);
create index if not exists idx_support_messages_ticket on public.support_messages(ticket_id);
create index if not exists idx_audit_tenant_created on public.audit_log(tenant_id,created_at desc);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;

do $$ declare t text;
begin
  foreach t in array array['tenants','profiles','customers','products','employees','documents','expenses','support_tickets']
  loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I',t);
    execute format('create trigger trg_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
  end loop;
end $$;

create or replace function public.is_tenant_member(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.tenant_memberships
    where tenant_id=target and user_id=auth.uid()
  );
$$;

create or replace function public.is_tenant_admin(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.tenant_memberships
    where tenant_id=target and user_id=auth.uid() and role in ('owner','admin')
  );
$$;

revoke all on function public.is_tenant_member(uuid) from public;
revoke all on function public.is_tenant_admin(uuid) from public;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.is_tenant_admin(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  new_tenant_id uuid;
  company_name text;
begin
  company_name=coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'),''),'Meine Firma');
  insert into public.profiles(user_id,display_name)
    values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)))
    on conflict(user_id) do nothing;
  insert into public.tenants(name) values(company_name) returning id into new_tenant_id;
  insert into public.tenant_memberships(tenant_id,user_id,role) values(new_tenant_id,new.id,'owner');
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.employees enable row level security;
alter table public.documents enable row level security;
alter table public.document_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;
alter table public.time_entries enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_self on public.profiles;
create policy profiles_self on public.profiles for all using(user_id=auth.uid()) with check(user_id=auth.uid());

drop policy if exists memberships_self_read on public.tenant_memberships;
create policy memberships_self_read on public.tenant_memberships for select using(user_id=auth.uid());

drop policy if exists tenants_member_read on public.tenants;
create policy tenants_member_read on public.tenants for select using(public.is_tenant_member(id));
drop policy if exists tenants_admin_update on public.tenants;
create policy tenants_admin_update on public.tenants for update using(public.is_tenant_admin(id)) with check(public.is_tenant_admin(id));

do $$ declare t text;
begin
  foreach t in array array['customers','products','employees','documents','document_items','payments','expenses','time_entries','support_tickets','support_messages']
  loop
    execute format('drop policy if exists %I_member_select on public.%I',t,t);
    execute format('drop policy if exists %I_member_insert on public.%I',t,t);
    execute format('drop policy if exists %I_member_update on public.%I',t,t);
    execute format('drop policy if exists %I_admin_delete on public.%I',t,t);
    execute format('create policy %I_member_select on public.%I for select using(public.is_tenant_member(tenant_id))',t,t);
    execute format('create policy %I_member_insert on public.%I for insert with check(public.is_tenant_member(tenant_id))',t,t);
    execute format('create policy %I_member_update on public.%I for update using(public.is_tenant_member(tenant_id)) with check(public.is_tenant_member(tenant_id))',t,t);
    execute format('create policy %I_admin_delete on public.%I for delete using(public.is_tenant_admin(tenant_id))',t,t);
  end loop;
end $$;

drop policy if exists audit_member_read on public.audit_log;
create policy audit_member_read on public.audit_log for select using(public.is_tenant_admin(tenant_id));
drop policy if exists audit_member_insert on public.audit_log;
create policy audit_member_insert on public.audit_log for insert with check(public.is_tenant_member(tenant_id) and user_id=auth.uid());
