alter table app_users add column if not exists first_name text;
alter table app_users add column if not exists last_name text;
alter table app_users add column if not exists phone text;
alter table app_users add column if not exists job_title text;
alter table business_idempotency_keys force row level security;
