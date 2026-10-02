-- Enforce account restrictions at the PostgreSQL authorization boundary.
-- Support and subscription-state reads intentionally remain available so restricted customers can seek help.

create or replace function public.tenant_can_read(target uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select public.is_tenant_member(target)
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
    and not exists(
      select 1 from public.tenant_restrictions
      where tenant_id=target
        and active=true
        and scope in ('all','write')
        and starts_at<=now()
        and (ends_at is null or ends_at>now())
    );
$$;

revoke all on function public.tenant_can_read(uuid) from public;
revoke all on function public.tenant_can_write(uuid) from public;
grant execute on function public.tenant_can_read(uuid) to authenticated;
grant execute on function public.tenant_can_write(uuid) to authenticated;

do $$ declare t text;
begin
  foreach t in array array[
    'customers','products','employees','documents','document_items','payments',
    'expenses','time_entries','customer_contacts','files'
  ]
  loop
    execute format('drop policy if exists %I_member_select on public.%I',t,t);
    execute format('drop policy if exists %I_member_insert on public.%I',t,t);
    execute format('drop policy if exists %I_member_update on public.%I',t,t);
    execute format('create policy %I_member_select on public.%I for select using(public.tenant_can_read(tenant_id))',t,t);
    execute format('create policy %I_member_insert on public.%I for insert with check(public.tenant_can_write(tenant_id))',t,t);
    execute format('create policy %I_member_update on public.%I for update using(public.tenant_can_write(tenant_id)) with check(public.tenant_can_write(tenant_id))',t,t);
  end loop;
end $$;

-- Re-create customer-contact and file policies that used purpose-specific names in earlier migrations.
drop policy if exists customer_contacts_member_select on public.customer_contacts;
drop policy if exists customer_contacts_member_insert on public.customer_contacts;
drop policy if exists customer_contacts_member_update on public.customer_contacts;
create policy customer_contacts_member_select on public.customer_contacts for select using(public.tenant_can_read(tenant_id));
create policy customer_contacts_member_insert on public.customer_contacts for insert with check(public.tenant_can_write(tenant_id));
create policy customer_contacts_member_update on public.customer_contacts for update using(public.tenant_can_write(tenant_id)) with check(public.tenant_can_write(tenant_id));

drop policy if exists files_member_select on public.files;
drop policy if exists files_member_insert on public.files;
create policy files_member_select on public.files for select using(public.tenant_can_read(tenant_id));
create policy files_member_insert on public.files for insert with check(public.tenant_can_write(tenant_id) and created_by=auth.uid());

drop policy if exists binso_storage_member_select on storage.objects;
create policy binso_storage_member_select on storage.objects
for select to authenticated
using(
  bucket_id in ('company-assets','expense-receipts','support-files')
  and public.tenant_can_read(((storage.foldername(name))[1])::uuid)
);

drop policy if exists binso_storage_member_insert on storage.objects;
create policy binso_storage_member_insert on storage.objects
for insert to authenticated
with check(
  bucket_id in ('company-assets','expense-receipts','support-files')
  and public.tenant_can_write(((storage.foldername(name))[1])::uuid)
);
