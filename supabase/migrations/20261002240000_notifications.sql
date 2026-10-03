-- Binso One v0.11 in-app notification foundation.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_key text,
  kind text not null check (kind in ('support','billing','document','payment','system','announcement')),
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_notifications_event
  on public.notifications(tenant_id,user_id,event_key)
  where event_key is not null;

create index if not exists idx_notifications_user_created
  on public.notifications(tenant_id,user_id,created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_member_select on public.notifications;
create policy notifications_member_select on public.notifications
for select using(
  public.is_tenant_member(tenant_id)
  and user_id=auth.uid()
);

drop policy if exists notifications_member_update on public.notifications;
create policy notifications_member_update on public.notifications
for update using(
  public.is_tenant_member(tenant_id)
  and user_id=auth.uid()
) with check(
  public.is_tenant_member(tenant_id)
  and user_id=auth.uid()
);

drop policy if exists notifications_operator_select on public.notifications;
create policy notifications_operator_select on public.notifications
for select using(public.is_operator());

create or replace function public.notify_support_reply()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.author_type='operator' and new.internal=false then
    insert into public.notifications(tenant_id,user_id,event_key,kind,title,body,href)
    select
      t.tenant_id,
      t.created_by,
      'support-reply:'||new.id::text,
      'support',
      'Neue Support-Antwort',
      t.subject,
      '/support/'||t.id::text
    from public.support_tickets t
    where t.id=new.ticket_id and t.tenant_id=new.tenant_id
    on conflict do nothing;
  end if;
  return new;
end $$;

drop trigger if exists trg_notify_support_reply on public.support_messages;
create trigger trg_notify_support_reply
after insert on public.support_messages
for each row execute function public.notify_support_reply();

create or replace function public.notify_payment_recorded()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.notifications(tenant_id,user_id,event_key,kind,title,body,href)
  select
    new.tenant_id,
    m.user_id,
    'payment:'||new.id::text,
    'payment',
    'Zahlung erfasst',
    'CHF '||to_char(new.amount,'FM9999999990.00')||' wurde verbucht.',
    '/zahlungen/'||new.id::text
  from public.tenant_memberships m
  where m.tenant_id=new.tenant_id
  on conflict do nothing;
  return new;
end $$;

drop trigger if exists trg_notify_payment_recorded on public.payments;
create trigger trg_notify_payment_recorded
after insert on public.payments
for each row execute function public.notify_payment_recorded();

create or replace function public.current_notifications(p_limit int default 50)
returns setof public.notifications
language sql
stable
security invoker
set search_path=public
as $$
  select n.*
  from public.notifications n
  where public.is_tenant_member(n.tenant_id)
    and n.user_id=auth.uid()
  order by n.created_at desc
  limit greatest(1,least(coalesce(p_limit,50),100));
$$;

grant execute on function public.current_notifications(int) to authenticated;

create or replace function public.mark_notification_read(p_notification_id uuid)
returns void
language plpgsql
security invoker
set search_path=public
as $$
begin
  update public.notifications
  set read_at=coalesce(read_at,now())
  where id=p_notification_id
    and user_id=auth.uid()
    and public.is_tenant_member(tenant_id);
end $$;

create or replace function public.mark_all_notifications_read()
returns int
language plpgsql
security invoker
set search_path=public
as $$
declare
  changed int;
begin
  update public.notifications
  set read_at=now()
  where user_id=auth.uid()
    and read_at is null
    and public.is_tenant_member(tenant_id);
  get diagnostics changed=row_count;
  return changed;
end $$;

revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
