-- Additive, session-bound proof for sensitive operations. No existing MFA state changes.
alter table auth_sessions add column step_up_at timestamptz;
alter table auth_email_codes add column session_id uuid references auth_sessions(id) on delete cascade;
alter table auth_email_codes drop constraint auth_email_codes_purpose_check;
alter table auth_email_codes add constraint auth_email_codes_purpose_check check(purpose in ('verify_email','login','step_up'));
alter table auth_email_codes add constraint step_up_requires_session check(purpose<>'step_up' or session_id is not null);
create index auth_email_codes_session_scope on auth_email_codes(session_id,created_at desc) where purpose='step_up' and consumed_at is null;
