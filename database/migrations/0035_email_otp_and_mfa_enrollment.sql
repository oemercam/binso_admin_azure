-- Email OTP and MFA enrollment hardening.
create table if not exists auth_email_codes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references app_users(id) on delete cascade,
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  purpose text not null check (purpose in ('verify_email','login')),
  code_hash text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists idx_auth_email_codes_lookup
  on auth_email_codes(lower(email),purpose,created_at desc);
create index if not exists idx_auth_email_codes_expiry
  on auth_email_codes(expires_at) where consumed_at is null;

alter table app_users add column if not exists mfa_pending_secret_enc text;
alter table app_users add column if not exists mfa_pending_expires_at timestamptz;
