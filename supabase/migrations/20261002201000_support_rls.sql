-- Tighten customer-facing support RLS. Internal notes must never be readable by tenant users.

drop policy if exists support_tickets_member_select on public.support_tickets;
drop policy if exists support_tickets_member_insert on public.support_tickets;
drop policy if exists support_tickets_member_update on public.support_tickets;
drop policy if exists support_tickets_admin_delete on public.support_tickets;

create policy support_tickets_customer_select on public.support_tickets
for select using(public.is_tenant_member(tenant_id));

create policy support_tickets_customer_insert on public.support_tickets
for insert with check(
  public.is_tenant_member(tenant_id)
  and created_by=auth.uid()
);

create policy support_tickets_admin_delete on public.support_tickets
for delete using(public.is_tenant_admin(tenant_id));

drop policy if exists support_messages_member_select on public.support_messages;
drop policy if exists support_messages_member_insert on public.support_messages;
drop policy if exists support_messages_member_update on public.support_messages;
drop policy if exists support_messages_admin_delete on public.support_messages;

create policy support_messages_customer_select on public.support_messages
for select using(
  public.is_tenant_member(tenant_id)
  and internal=false
);

create policy support_messages_customer_insert on public.support_messages
for insert with check(
  public.is_tenant_member(tenant_id)
  and internal=false
  and author_type='customer'
  and author_user_id=auth.uid()
);

create policy support_messages_admin_delete on public.support_messages
for delete using(public.is_tenant_admin(tenant_id));
