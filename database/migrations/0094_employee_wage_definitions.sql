-- HR contract metadata; never backfill or calculate from legacy monthly_gross.
create unique index employment_revision_employee_fk on employee_employment_periods(organization_id,employee_id,id);
create table employee_wage_definitions(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,employee_id uuid not null,
 definition_id uuid not null default gen_random_uuid(),revision integer not null default 1 check(revision>0),is_current boolean not null default true,
 employment_revision_id uuid not null,starts_on date not null,ends_on date,
 model text not null check(model in ('monthly','hourly','annual')),
 amount numeric(12,2) not null check(amount>0),currency text not null check(currency in ('CHF','EUR')),
 annual_basis text check(annual_basis in ('including_13th','excluding_13th','without_13th')),
 thirteenth_entitled boolean not null,payout_day smallint check(payout_day between 1 and 28),
 payout_last_day boolean not null,thirteenth_payout_month smallint check(thirteenth_payout_month between 1 and 12),
 created_by_user_id text not null,created_at timestamptz not null default now(),
 foreign key(organization_id,employee_id) references employees(organization_id,id),
 foreign key(organization_id,employee_id,employment_revision_id) references employee_employment_periods(organization_id,employee_id,id),
 unique(organization_id,employee_id,definition_id,revision),
 check(ends_on is null or ends_on>=starts_on),
 check((model='annual' and annual_basis is not null and thirteenth_entitled=(annual_basis<>'without_13th')) or (model<>'annual' and annual_basis is null)),
 check((payout_last_day and payout_day is null) or (not payout_last_day and payout_day is not null)),
 check(thirteenth_entitled=(thirteenth_payout_month is not null))
);
create unique index wage_definition_current on employee_wage_definitions(organization_id,employee_id,definition_id) where is_current;
create index wage_definition_employee_date on employee_wage_definitions(organization_id,employee_id,starts_on);
alter table employee_wage_definitions enable row level security;
alter table employee_wage_definitions force row level security;
create policy wage_definition_read on employee_wage_definitions for select using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_has_sensitive_capability('hr_sensitive:read'));
create policy wage_definition_insert on employee_wage_definitions for insert with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_has_sensitive_capability('hr_sensitive:write') and created_by_user_id=current_setting('app.user_id',true));
create policy wage_definition_supersede on employee_wage_definitions for update using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_has_sensitive_capability('hr_sensitive:write')) with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_has_sensitive_capability('hr_sensitive:write'));
-- No delete policy. All monetary changes are new immutable revisions.
create function enforce_wage_definition_revision() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare employment employee_employment_periods%rowtype;previous employee_wage_definitions%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':employment:'||new.employee_id::text,0));
 if tg_op='UPDATE' then
  if not old.is_current or new.is_current or (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then raise exception 'Wage history is immutable' using errcode='23514';end if;
 else
  select * into employment from employee_employment_periods where organization_id=new.organization_id and employee_id=new.employee_id and id=new.employment_revision_id and is_current;
  if employment.id is null or new.starts_on<employment.starts_on or (employment.ends_on is not null and (new.ends_on is null or new.ends_on>employment.ends_on)) then raise exception 'Current employment revision and matching wage dates required' using errcode='23514';end if;
  select * into previous from employee_wage_definitions where organization_id=new.organization_id and employee_id=new.employee_id and definition_id=new.definition_id order by revision desc limit 1;
  if not new.is_current or new.revision<>coalesce(previous.revision+1,1) or previous.is_current then raise exception 'Wage revision conflict' using errcode='23514';end if;
  if previous.id is not null and not exists(select 1 from employee_employment_periods p where p.organization_id=new.organization_id and p.employee_id=new.employee_id and p.id=previous.employment_revision_id and p.period_id=employment.period_id) then raise exception 'Wage employment identity is immutable' using errcode='23514';end if;
  if exists(select 1 from employee_wage_definitions w where w.organization_id=new.organization_id and w.employee_id=new.employee_id and w.is_current and daterange(w.starts_on,w.ends_on,'[]')&&daterange(new.starts_on,new.ends_on,'[]')) then raise exception 'Wage periods overlap' using errcode='23514',constraint='wage_period_no_overlap';end if;
 end if;
 return new;
end $$;
create trigger wage_definition_revision before insert or update on employee_wage_definitions for each row execute function enforce_wage_definition_revision();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on employee_wage_definitions to binso_runtime;end if;end $$;
