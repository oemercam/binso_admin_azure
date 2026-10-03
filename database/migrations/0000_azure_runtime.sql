create extension if not exists pgcrypto;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin; exception when duplicate_object then null; end $$;
do $$ begin create role binso_app nologin; exception when duplicate_object then null; end $$;
do $$ begin execute format('grant binso_app to %I',current_user); exception when insufficient_privilege then raise exception 'Database administrator must be able to SET ROLE binso_app'; end $$;
create schema if not exists auth;
create table if not exists auth.users(
 id uuid primary key default gen_random_uuid(),email text not null,password_hash text not null,raw_user_meta_data jsonb not null default '{}'::jsonb,
 email_confirmed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create unique index if not exists uq_auth_users_email on auth.users(lower(email));
create or replace function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('app.user_id',true),'')::uuid $$;
create table if not exists public.auth_sessions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 access_hash text not null unique,refresh_hash text not null unique,expires_at timestamptz not null,refresh_expires_at timestamptz not null,created_at timestamptz not null default now()
);
create index if not exists idx_auth_sessions_user on public.auth_sessions(user_id);
create index if not exists idx_auth_sessions_expiry on public.auth_sessions(refresh_expires_at);
create table if not exists public.auth_recovery_sessions(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 access_hash text not null unique,refresh_hash text not null unique,expires_at timestamptz not null,created_at timestamptz not null default now()
);
create table if not exists public.auth_tokens(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
 token_hash text not null unique,token_type text not null check(token_type in ('verify_email')),expires_at timestamptz not null,created_at timestamptz not null default now()
);
grant usage on schema public,auth to binso_app;
grant select on auth.users to binso_app;
