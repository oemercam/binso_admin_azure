-- Extend the existing identity/session owners. No credential or identity rewrite.
alter table auth_sessions add column passkey_verified boolean not null default false;
alter table app_users add column passkey_prompt_after timestamptz;
alter table app_users add column passkey_recovery_hashes jsonb not null default '[]'::jsonb
 check(jsonb_typeof(passkey_recovery_hashes)='array');
