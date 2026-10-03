create table if not exists public.operator_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('administrator','support','finance','readonly')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.operator_users enable row level security;

drop policy if exists operator_self_read on public.operator_users;
create policy operator_self_read on public.operator_users
for select using(user_id=auth.uid() and active=true);

create or replace function public.is_operator()
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1 from public.operator_users
    where user_id=auth.uid() and active=true
  );
$$;

revoke all on function public.is_operator() from public;
grant execute on function public.is_operator() to authenticated;

-- Provision the first operator deliberately from the SQL editor after the user exists:
-- insert into public.operator_users(user_id,role)
-- select id,'administrator' from auth.users where email='operator@example.com';
