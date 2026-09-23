-- V60 production registration and onboarding lifecycle

alter table signup_requests add column if not exists updated_at timestamptz not null default now();
alter table signup_requests add column if not exists completed_at timestamptz;

create unique index if not exists uq_signup_requests_open_user
  on signup_requests(user_id)
  where user_id is not null and status in ('started','account_created');

create index if not exists idx_signup_requests_user_status
  on signup_requests(user_id, status, updated_at desc);

update signup_requests
   set updated_at = created_at
 where updated_at is null;
