-- Production account-state enforcement.
-- RLS remains the final authorization boundary even if a client bypasses UI feature gates.

create or replace function public.tenant_account_allows_access(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.tenant_accounts a
    where a.tenant_id=target
      and a.account_status='active'
      and (
        a.subscription_status='active'
        or (
          a.subscription_status='trial'
          and (a.trial_ends_at is null or a.trial_ends_at>now())
        )
      )
  );
$$;

create or replace function public.tenant_can_read(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_tenant_member(target)
    and public.tenant_account_allows_access(target)
    and not exists(
      select 1 from public.tenant_restrictions
      where tenant_id=target
        and active=true
        and scope='all'
        and starts_at<=now()
        and (ends_at is null or ends_at>now())
    );
$$;

create or replace function public.tenant_can_write(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_tenant_member(target)
    and public.tenant_account_allows_access(target)
    and not exists(
      select 1 from public.tenant_restrictions
      where tenant_id=target
        and active=true
        and scope in ('all','write')
        and starts_at<=now()
        and (ends_at is null or ends_at>now())
    );
$$;

revoke all on function public.tenant_account_allows_access(uuid) from public;
revoke all on function public.tenant_can_read(uuid) from public;
revoke all on function public.tenant_can_write(uuid) from public;
grant execute on function public.tenant_account_allows_access(uuid) to authenticated;
grant execute on function public.tenant_can_read(uuid) to authenticated;
grant execute on function public.tenant_can_write(uuid) to authenticated;

create index if not exists idx_tenant_accounts_lifecycle
  on public.tenant_accounts(tenant_id,account_status,subscription_status,trial_ends_at);
