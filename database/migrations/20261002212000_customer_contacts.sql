create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  job_title text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_contacts_customer on public.customer_contacts(tenant_id,customer_id);

drop trigger if exists trg_touch_updated_at on public.customer_contacts;
create trigger trg_touch_updated_at
before update on public.customer_contacts
for each row execute function public.touch_updated_at();

alter table public.customer_contacts enable row level security;

drop policy if exists customer_contacts_member_select on public.customer_contacts;
create policy customer_contacts_member_select on public.customer_contacts for select using(public.is_tenant_member(tenant_id));
drop policy if exists customer_contacts_member_insert on public.customer_contacts;
create policy customer_contacts_member_insert on public.customer_contacts for insert with check(public.is_tenant_member(tenant_id));
drop policy if exists customer_contacts_member_update on public.customer_contacts;
create policy customer_contacts_member_update on public.customer_contacts for update using(public.is_tenant_member(tenant_id)) with check(public.is_tenant_member(tenant_id));
drop policy if exists customer_contacts_admin_delete on public.customer_contacts;
create policy customer_contacts_admin_delete on public.customer_contacts for delete using(public.is_tenant_admin(tenant_id));
drop policy if exists customer_contacts_operator_select on public.customer_contacts;
create policy customer_contacts_operator_select on public.customer_contacts for select using(public.is_operator());
