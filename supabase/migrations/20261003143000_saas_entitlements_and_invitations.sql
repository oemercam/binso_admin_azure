-- SaaS plan entitlements, user limits and company invitations.
-- Enforcement lives in PostgreSQL so direct REST access cannot bypass application UI checks.

create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role public.membership_role not null default 'member',
  status text not null default 'pending' check(status in ('pending','accepted','revoked','expired')),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists uq_tenant_pending_invitation
  on public.tenant_invitations(tenant_id,lower(email)) where status='pending';
create index if not exists idx_tenant_memberships_tenant on public.tenant_memberships(tenant_id);
create index if not exists idx_tenant_invitations_tenant_status on public.tenant_invitations(tenant_id,status,expires_at);
create index if not exists idx_documents_tenant_created on public.documents(tenant_id,created_at desc);
create index if not exists idx_customers_tenant_created on public.customers(tenant_id,created_at desc);
create index if not exists idx_payments_tenant_paid on public.payments(tenant_id,paid_on desc);
create index if not exists idx_expenses_tenant_date on public.expenses(tenant_id,expense_date desc);
create index if not exists idx_time_entries_tenant_created on public.time_entries(tenant_id,created_at desc);
create index if not exists idx_support_tickets_tenant_updated on public.support_tickets(tenant_id,updated_at desc);

alter table public.tenant_invitations enable row level security;

create or replace function public.tenant_has_feature(target uuid, feature text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select exists(
    select 1 from public.tenant_accounts a
    where a.tenant_id=target
      and public.tenant_account_allows_access(target)
      and case feature
        when 'core' then true
        when 'employees' then a.plan in ('trial','business','pro')
        when 'expenses' then a.plan in ('trial','business','pro')
        when 'time_tracking' then a.plan in ('trial','business','pro')
        when 'advanced_roles' then a.plan='pro'
        else false
      end
  );
$$;
revoke all on function public.tenant_has_feature(uuid,text) from public;
grant execute on function public.tenant_has_feature(uuid,text) to authenticated;

drop policy if exists employees_member_select on public.employees;
drop policy if exists employees_member_insert on public.employees;
drop policy if exists employees_member_update on public.employees;
create policy employees_member_select on public.employees for select using(public.tenant_can_read(tenant_id) and public.tenant_has_feature(tenant_id,'employees'));
create policy employees_member_insert on public.employees for insert with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'employees'));
create policy employees_member_update on public.employees for update using(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'employees')) with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'employees'));

drop policy if exists expenses_member_select on public.expenses;
drop policy if exists expenses_member_insert on public.expenses;
drop policy if exists expenses_member_update on public.expenses;
create policy expenses_member_select on public.expenses for select using(public.tenant_can_read(tenant_id) and public.tenant_has_feature(tenant_id,'expenses'));
create policy expenses_member_insert on public.expenses for insert with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'expenses'));
create policy expenses_member_update on public.expenses for update using(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'expenses')) with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'expenses'));

drop policy if exists time_entries_member_select on public.time_entries;
drop policy if exists time_entries_member_insert on public.time_entries;
drop policy if exists time_entries_member_update on public.time_entries;
create policy time_entries_member_select on public.time_entries for select using(public.tenant_can_read(tenant_id) and public.tenant_has_feature(tenant_id,'time_tracking'));
create policy time_entries_member_insert on public.time_entries for insert with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'time_tracking'));
create policy time_entries_member_update on public.time_entries for update using(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'time_tracking')) with check(public.tenant_can_write(tenant_id) and public.tenant_has_feature(tenant_id,'time_tracking'));

create policy tenant_invitations_admin_select on public.tenant_invitations
for select using(public.is_tenant_admin(tenant_id));
create policy tenant_invitations_admin_update on public.tenant_invitations
for update using(public.is_tenant_admin(tenant_id)) with check(public.is_tenant_admin(tenant_id));

create or replace function public.create_tenant_invitation(p_tenant_id uuid,p_email text,p_role public.membership_role default 'member')
returns uuid
language plpgsql security definer set search_path=public
as $$
declare invitation_id uuid; member_count int; pending_count int; allowed_count int;
begin
  if not public.is_tenant_admin(p_tenant_id) or not public.tenant_account_allows_access(p_tenant_id) then raise exception 'not authorized'; end if;
  if p_email is null or length(trim(p_email))<3 then raise exception 'invalid email'; end if;
  select user_limit into allowed_count from public.tenant_accounts where tenant_id=p_tenant_id;
  select count(*) into member_count from public.tenant_memberships where tenant_id=p_tenant_id;
  select count(*) into pending_count from public.tenant_invitations where tenant_id=p_tenant_id and status='pending' and expires_at>now();
  if member_count+pending_count>=allowed_count then raise exception 'user limit reached'; end if;
  update public.tenant_invitations set status='expired' where tenant_id=p_tenant_id and status='pending' and expires_at<=now();
  insert into public.tenant_invitations(tenant_id,email,role,invited_by)
  values(p_tenant_id,lower(trim(p_email)),p_role,auth.uid()) returning id into invitation_id;
  return invitation_id;
end $$;
revoke all on function public.create_tenant_invitation(uuid,text,public.membership_role) from public;
grant execute on function public.create_tenant_invitation(uuid,text,public.membership_role) to authenticated;

-- Invited Auth users join the intended tenant instead of creating a second company.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
declare new_tenant_id uuid; company_name text; invited_tenant uuid; invited_role public.membership_role; invitation uuid;
begin
  insert into public.profiles(user_id,display_name)
    values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)))
    on conflict(user_id) do nothing;

  begin invited_tenant:=(new.raw_user_meta_data->>'invited_tenant_id')::uuid; exception when others then invited_tenant:=null; end;
  begin invitation:=(new.raw_user_meta_data->>'invitation_id')::uuid; exception when others then invitation:=null; end;
  invited_role:=case when new.raw_user_meta_data->>'invited_role' in ('owner','admin','member') then (new.raw_user_meta_data->>'invited_role')::public.membership_role else 'member' end;

  if invited_tenant is not null and invitation is not null and exists(
    select 1 from public.tenant_invitations i where i.id=invitation and i.tenant_id=invited_tenant and i.status='pending'
      and i.expires_at>now() and lower(i.email)=lower(coalesce(new.email,''))
  ) then
    insert into public.tenant_memberships(tenant_id,user_id,role) values(invited_tenant,new.id,invited_role) on conflict do nothing;
    update public.tenant_invitations set status='accepted',accepted_at=now() where id=invitation;
    return new;
  end if;

  company_name=coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'),''),'Meine Firma');
  insert into public.tenants(name) values(company_name) returning id into new_tenant_id;
  insert into public.tenant_memberships(tenant_id,user_id,role) values(new_tenant_id,new.id,'owner');
  return new;
end $$;
