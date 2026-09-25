-- V59 authentication and membership foundation

create table if not exists app_users (
  id text primary key,
  email text not null,
  display_name text not null,
  status text not null default 'active' check (status in ('active','suspended')),
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uq_app_users_email_ci on app_users(lower(email));
create index if not exists idx_memberships_email_ci on organization_memberships(lower(email), status);

alter table signup_requests add column if not exists user_id text;
alter table signup_requests add column if not exists organization_id uuid references organizations(id) on delete set null;
create index if not exists idx_signup_requests_user on signup_requests(user_id, created_at desc);

-- Keep identity data outside tenant RLS. It contains only the authenticated account identity,
-- not business records. Tenant authorization continues to be enforced through memberships.
