-- Optional tenant policy. Existing organizations retain optional MFA until an
-- authorized administrator explicitly enables the policy after fresh proof.
alter table organizations add column if not exists employee_mfa_required boolean not null default false;
