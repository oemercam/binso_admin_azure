-- An employment period is an HR child aggregate, never a second employee/user.
-- No inferred historical periods, wages, holidays or payroll grants.
create table employee_employment_periods (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 employee_id uuid not null,
 period_id uuid not null default gen_random_uuid(),
 revision integer not null default 1 check(revision>0),
 is_current boolean not null default true,
 starts_on date not null,
 ends_on date,
 workload_percent numeric(5,2) not null check(workload_percent between 0 and 100),
 weekly_hours numeric(6,2) not null check(weekly_hours>0 and weekly_hours<=80),
 vacation_days numeric(6,2) not null check(vacation_days between 0 and 60),
 job_title text not null check(length(btrim(job_title)) between 1 and 160),
 work_location text check(length(work_location)<=180),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 foreign key(organization_id,employee_id) references employees(organization_id,id),
 unique(organization_id,employee_id,period_id,revision),
 check(ends_on is null or ends_on>=starts_on)
);
create unique index employment_period_current_revision on employee_employment_periods(organization_id,employee_id,period_id) where is_current;
create index employment_period_employee_date on employee_employment_periods(organization_id,employee_id,starts_on);
alter table employee_employment_periods enable row level security;
alter table employee_employment_periods force row level security;
create policy employment_period_read on employee_employment_periods for select using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and app_workforce_role() in ('owner','admin','hr')
);
create policy employment_period_insert on employee_employment_periods for insert with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and app_workforce_role() in ('owner','admin','hr')
 and created_by_user_id=current_setting('app.user_id',true)
);
create policy employment_period_supersede on employee_employment_periods for update using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and app_workforce_role() in ('owner','admin','hr')
) with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and app_workforce_role() in ('owner','admin','hr')
);
-- No runtime delete policy: corrections create a new revision.
create function enforce_employment_period_revision() returns trigger language plpgsql as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':employment:'||new.employee_id::text,0));
 if tg_op='UPDATE' then
  if not old.is_current or new.is_current or (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then
   raise exception 'Employment history is immutable' using errcode='23514';
  end if;
 end if;
 if tg_op='INSERT' then
  if not new.is_current or new.revision<>coalesce((select max(p.revision)+1 from employee_employment_periods p where p.organization_id=new.organization_id and p.employee_id=new.employee_id and p.period_id=new.period_id),1) then
   raise exception 'Employment revision conflict' using errcode='23514';
  end if;
 end if;
 if new.is_current and exists(select 1 from employee_employment_periods p
  where p.organization_id=new.organization_id and p.employee_id=new.employee_id and p.is_current and p.id<>new.id
   and daterange(p.starts_on,p.ends_on,'[]') && daterange(new.starts_on,new.ends_on,'[]')) then
  raise exception 'Employment periods overlap' using errcode='23514',constraint='employment_period_no_overlap';
 end if;
 return new;
end $$;
create trigger employment_period_revision before insert or update on employee_employment_periods for each row execute function enforce_employment_period_revision();
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert,update on employee_employment_periods to binso_runtime;
 end if;
end $$;
