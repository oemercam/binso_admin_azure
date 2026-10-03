-- Self-service registration: demo, free trial or direct paid subscription.
-- Replace the V79 mode constraint so paid checkout can be selected before onboarding.
do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
    from pg_constraint
   where conrelid = 'signup_requests'::regclass
     and contype = 'c'
     and pg_get_constraintdef(oid) like '%signup_mode%';
  if constraint_name is not null then
    execute format('alter table signup_requests drop constraint %I', constraint_name);
  end if;
end $$;

alter table signup_requests
  add constraint signup_requests_signup_mode_check
  check (signup_mode in ('trial','subscription','demo'));
