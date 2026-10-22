alter table absences drop constraint absences_absence_type_check;
alter table absences add constraint absences_absence_type_check check(absence_type in ('vacation','sick','accident','unpaid','military_civil','other'));
alter table absences add column is_v26_request boolean not null default false;
alter table absences add column employment_revision_id uuid;
alter table absences add column reviewed_by_user_id text;
alter table absences add column reviewed_at timestamptz;
alter table absences add constraint absence_employment_tenant_fk foreign key(organization_id,employee_id,employment_revision_id) references employee_employment_periods(organization_id,employee_id,id);
alter table absences add constraint absence_request_fields check(not is_v26_request or (employment_revision_id is not null and created_by_user_id is not null and days>0 and days<=end_date-start_date+1));
create function app_own_employee(p_employee uuid) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from employees e join organization_memberships m on m.organization_id=e.organization_id and m.user_id=e.user_id join app_users u on u.id=m.user_id join organization_subscriptions s on s.organization_id=e.organization_id join organizations o on o.id=e.organization_id
 where e.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and e.id=p_employee and e.user_id=current_setting('app.user_id',true) and e.active and e.archived_at is null and m.status='active' and m.module_profile='standard' and u.status='active' and s.plan in ('business','pro','professional','enterprise') and o.status in ('trial','active','grace_period','read_only'))
$$;
-- Identity-bound self-service does not grant employees:read or another person's dossier.
create policy employment_self_read on employee_employment_periods for select using(app_own_employee(employee_id));
create function app_absence_access(p_employee uuid,p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select (app_has_sensitive_capability(case when p_write then 'hr_sensitive:write' else 'hr_sensitive:read' end))
 or (app_own_employee(p_employee) and (not p_write or exists(select 1 from organization_memberships m join organizations o on o.id=m.organization_id where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.role<>'reader' and o.status in ('trial','active','grace_period'))))
$$;
create policy absence_private_read on absences as restrictive for select using(app_absence_access(employee_id));
create policy absence_private_insert on absences as restrictive for insert with check(app_absence_access(employee_id,true));
create policy absence_private_update on absences as restrictive for update using(app_absence_access(employee_id,true)) with check(app_absence_access(employee_id,true));
create policy absence_no_delete on absences as restrictive for delete using(false);
create policy absence_replay_scope on business_idempotency_keys as restrictive for all using(
 operation not in ('absence.request','absence.transition') or exists(select 1 from absences a where a.id::text=response_json#>>'{item,id}' and a.organization_id=business_idempotency_keys.organization_id)
) with check(
 operation not in ('absence.request','absence.transition') or exists(select 1 from absences a where a.id::text=response_json#>>'{item,id}' and a.organization_id=business_idempotency_keys.organization_id and app_absence_access(a.employee_id,true))
);
create function protect_absence_request() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare beneficiary text;employment employee_employment_periods%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':employment:'||new.employee_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':absence:'||new.employee_id::text,0));
 if tg_op='INSERT' then
  if not new.is_v26_request or new.status<>'open' or new.created_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_by_user_id is not null or new.reviewed_at is not null then raise exception 'New absence request required' using errcode='23514';end if;
  select * into employment from employee_employment_periods where organization_id=new.organization_id and employee_id=new.employee_id and id=new.employment_revision_id and is_current;
  if employment.id is null or new.start_date<employment.starts_on or (employment.ends_on is not null and new.end_date>employment.ends_on) then raise exception 'Current employment revision and matching absence dates required' using errcode='23514';end if;
 else
  if not old.is_v26_request or (to_jsonb(new)-'status'-'reviewed_by_user_id'-'reviewed_at'-'version'-'updated_at') is distinct from (to_jsonb(old)-'status'-'reviewed_by_user_id'-'reviewed_at'-'version'-'updated_at') or not ((old.status='open' and new.status in ('approved','rejected','cancelled')) or (old.status='approved' and new.status='cancelled')) then raise exception 'Absence history or transition is immutable' using errcode='23514';end if;
  if new.status in ('approved','rejected') or old.status='approved' then
   select user_id into beneficiary from employees where organization_id=new.organization_id and id=new.employee_id;
   if not app_has_sensitive_capability('hr_sensitive:write') or new.reviewed_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_by_user_id=new.created_by_user_id or new.reviewed_by_user_id=beneficiary or new.reviewed_at is null or new.reviewed_at>now() then raise exception 'Independent HR review required' using errcode='42501';end if;
   if not exists(select 1 from auth_sessions a where a.id::text=nullif(current_setting('app.absence_review_session',true),'') and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh absence review proof required' using errcode='42501';end if;
   if new.status='approved' and not exists(select 1 from employee_employment_periods p where p.organization_id=new.organization_id and p.employee_id=new.employee_id and p.id=new.employment_revision_id and p.is_current) then raise exception 'Employment source changed' using errcode='23514';end if;
  else
   if not app_own_employee(new.employee_id) and not app_has_sensitive_capability('hr_sensitive:write') then raise exception 'Absence withdrawal requires self or HR access' using errcode='42501';end if;
   if new.reviewed_at is not null or new.reviewed_by_user_id is not null then raise exception 'Withdrawal is not an approval' using errcode='23514';end if;
  end if;
 end if;
 if new.status in ('open','approved') and exists(select 1 from absences a where a.organization_id=new.organization_id and a.employee_id=new.employee_id and a.id<>new.id and a.archived_at is null and a.status in ('open','approved') and daterange(a.start_date,a.end_date,'[]')&&daterange(new.start_date,new.end_date,'[]')) then raise exception 'Absence periods overlap' using errcode='23514',constraint='absence_period_no_overlap';end if;
 return new;
end $$;
create trigger absence_request_guard before insert or update on absences for each row execute function protect_absence_request();
create trigger absence_request_version before update on absences for each row execute function bump_business_record_version();
