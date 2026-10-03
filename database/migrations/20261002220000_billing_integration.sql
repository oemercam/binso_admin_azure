-- Binso One v0.9 billing integration foundation.
-- Webhook writes are idempotent and only granted to Supabase service_role.

create table if not exists public.billing_events (
  event_id text primary key,
  event_type text not null,
  tenant_id uuid references public.tenants(id) on delete set null,
  customer_ref text,
  subscription_ref text,
  subscription_status text,
  current_period_ends_at timestamptz,
  processed_at timestamptz not null default now()
);

create index if not exists idx_billing_events_tenant on public.billing_events(tenant_id,processed_at desc);
create index if not exists idx_tenant_accounts_customer_ref on public.tenant_accounts(billing_customer_ref);

alter table public.billing_events enable row level security;

drop policy if exists billing_events_operator_select on public.billing_events;
create policy billing_events_operator_select on public.billing_events
for select using(public.is_operator());

create or replace function public.set_current_tenant_billing_customer(p_tenant_id uuid, p_customer_ref text)
returns void
language plpgsql
security definer
set search_path=public
as $$
declare
  target_tenant uuid;
begin
  if auth.uid() is null or nullif(trim(p_customer_ref),'') is null then
    raise exception 'not authorized';
  end if;

  select tenant_id into target_tenant
  from public.tenant_memberships
  where user_id=auth.uid() and tenant_id=p_tenant_id
  limit 1;

  if target_tenant is null then raise exception 'tenant missing'; end if;

  update public.tenant_accounts
  set billing_customer_ref=case
      when billing_customer_ref is null or billing_customer_ref=p_customer_ref then p_customer_ref
      else billing_customer_ref
    end,
    updated_at=now()
  where tenant_id=target_tenant;
end $$;

revoke all on function public.set_current_tenant_billing_customer(uuid,text) from public;
grant execute on function public.set_current_tenant_billing_customer(uuid,text) to authenticated;

create or replace function public.apply_stripe_billing_event(
  p_event_id text,
  p_event_type text,
  p_tenant_id uuid,
  p_customer_ref text,
  p_subscription_ref text,
  p_subscription_status text,
  p_plan text,
  p_current_period_end timestamptz
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  inserted_count int;
  target_tenant uuid;
begin
  insert into public.billing_events(event_id,event_type,tenant_id,customer_ref,subscription_ref,subscription_status,current_period_ends_at)
  values(p_event_id,p_event_type,p_tenant_id,p_customer_ref,p_subscription_ref,p_subscription_status,p_current_period_end)
  on conflict(event_id) do nothing;

  get diagnostics inserted_count=row_count;
  if inserted_count=0 then return false; end if;

  target_tenant:=p_tenant_id;
  if target_tenant is null and nullif(p_customer_ref,'') is not null then
    select tenant_id into target_tenant
    from public.tenant_accounts
    where billing_customer_ref=p_customer_ref
    limit 1;
  end if;

  if target_tenant is null then return true; end if;

  update public.tenant_accounts
  set billing_customer_ref=coalesce(nullif(p_customer_ref,''),billing_customer_ref),
      billing_subscription_ref=coalesce(nullif(p_subscription_ref,''),billing_subscription_ref),
      subscription_status=coalesce(nullif(p_subscription_status,''),subscription_status),
      plan=case when p_plan in ('trial','start','business','pro') then p_plan else plan end,
      current_period_ends_at=coalesce(p_current_period_end,current_period_ends_at),
      updated_at=now()
  where tenant_id=target_tenant;

  return true;
end $$;

revoke all on function public.apply_stripe_billing_event(text,text,uuid,text,text,text,text,timestamptz) from public;
grant execute on function public.apply_stripe_billing_event(text,text,uuid,text,text,text,text,timestamptz) to service_role;
