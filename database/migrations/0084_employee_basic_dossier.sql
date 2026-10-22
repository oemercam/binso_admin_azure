-- HR remains the owner; an employee need not have a login or email address.
-- Preserve every existing value; no identity/provisioning or sensitive-field grant.
alter table employees alter column email drop not null;
alter table employees add column end_date date;
alter table employees add column work_location text;
alter table employees add constraint employees_employment_dates
 check (end_date is null or start_date is null or end_date >= start_date);
alter table employees add constraint employees_work_location_length
 check (work_location is null or length(work_location) <= 180);
-- Existing tenant-local email uniqueness excludes NULL naturally.
-- Existing employee RLS, user identity guard and runtime grants are unchanged.
