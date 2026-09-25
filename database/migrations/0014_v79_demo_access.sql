-- V79: explicit self-service demo signup mode.
-- Demo workspaces are isolated tenants and never become billable subscriptions.
alter table signup_requests
  add column if not exists signup_mode text not null default 'trial'
  check (signup_mode in ('trial','demo'));

create index if not exists idx_signup_requests_mode_status
  on signup_requests(signup_mode, status, updated_at desc);
