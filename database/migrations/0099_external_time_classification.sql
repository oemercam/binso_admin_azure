-- Extend the existing time owner. Legacy entries remain explicitly unclassified.
alter table time_entries add column external_resource_id uuid;
alter table time_entries add column external_assignment_id uuid;
alter table time_entries add column recorded_duration_minutes integer;
alter table time_entries add column time_category text;
alter table time_entries add column is_work_time boolean;
alter table time_entries add column payroll_relevant boolean;
alter table time_entries add constraint time_resource_tenant_fk foreign key(organization_id,external_resource_id) references external_resources(organization_id,id);
alter table time_entries add constraint time_external_assignment_tenant_fk foreign key(organization_id,external_assignment_id) references external_resource_assignments(organization_id,id);
alter table time_entries add constraint time_classification_fields check(
 (time_category is null and is_work_time is null and payroll_relevant is null) or
 (time_category is not null and time_category in ('work','travel','break','other') and is_work_time is not null and payroll_relevant is not null
 and (not payroll_relevant or employee_id is not null)));
alter table time_entries add constraint external_time_fields check(
 (external_resource_id is null and external_assignment_id is null and recorded_duration_minutes is null) or
 (external_resource_id is not null and external_assignment_id is not null and recorded_duration_minutes is not null and recorded_duration_minutes between 1 and 1440
 and employee_id is null and supplier_id is not null and project_id is not null and worker_type='external' and report_month is null
 and time_category is not null and payroll_relevant=false and internal_cost_rate=0 and sales_rate=0
 and hours=round(recorded_duration_minutes::numeric/60,6)));

create function app_external_time_access(p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and u.status='active' and s.plan in ('business','pro','professional','enterprise')
 and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only'))
 and (not p_write or m.role in ('owner','admin','project_manager','manager')))
$$;
create policy external_time_read on time_entries as restrictive for select using(external_resource_id is null or app_external_time_access());
create policy external_time_delete on time_entries as restrictive for delete using(external_resource_id is null);
create policy external_time_replay on business_idempotency_keys as restrictive for all using(
 operation<>'time.external.create' or (app_external_time_access() and exists(select 1 from time_entries t where t.organization_id=business_idempotency_keys.organization_id and t.id::text=response_json#>>'{id}'))
) with check(operation<>'time.external.create' or app_external_time_access(true));

-- Advisory source locks preserve read-only project visibility; SELECT FOR SHARE
-- would incorrectly require the project's actor to have supplier UPDATE access.
create function lock_external_time_source() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||case when tg_table_name='suppliers' then ':external-supplier:' else ':external-resource:' end||new.id::text,0));
 return new;
end $$;
create trigger external_supplier_capture_lock before update of status,archived_at on suppliers for each row execute function lock_external_time_source();
create trigger external_resource_capture_lock before update on external_resources for each row execute function lock_external_time_source();

create function protect_external_time() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare changing_facts boolean;
begin
 if tg_op='UPDATE' then
  if row(new.external_resource_id,new.external_assignment_id,new.supplier_id,new.worker_type,new.employee_id,new.created_by_user_id)
   is distinct from row(old.external_resource_id,old.external_assignment_id,old.supplier_id,old.worker_type,old.employee_id,old.created_by_user_id)
   and (new.external_resource_id is not null or old.external_resource_id is not null) then raise exception 'External time identity is immutable' using errcode='42501'; end if;
  if row(new.time_category,new.is_work_time,new.payroll_relevant) is distinct from row(old.time_category,old.is_work_time,old.payroll_relevant)
   and (old.approved or old.submitted_at is not null or old.invoiced_invoice_id is not null or old.created_by_user_id is distinct from current_setting('app.user_id',true)) then raise exception 'Time classification is locked' using errcode='42501'; end if;
 end if;
 if new.external_resource_id is null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':external-supplier:'||new.supplier_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':external-resource:'||new.external_resource_id::text,0));
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':external:'||new.external_resource_id::text||':'||new.project_id::text,0));
 if not app_external_time_access(true) then raise exception 'External time permission required' using errcode='42501'; end if;
 if tg_op='INSERT' then
  if new.created_by_user_id is distinct from current_setting('app.user_id',true) or new.approved or new.submitted_at is not null or new.invoiced_invoice_id is not null or new.archived_at is not null then raise exception 'External time starts unsubmitted' using errcode='42501'; end if;
  changing_facts:=true;
 else
  changing_facts:=row(new.work_date,new.project_id,new.customer_id,new.hours,new.recorded_duration_minutes,new.description,new.billable,new.time_category,new.is_work_time,new.payroll_relevant,new.person_name,new.project_label)
   is distinct from row(old.work_date,old.project_id,old.customer_id,old.hours,old.recorded_duration_minutes,old.description,old.billable,old.time_category,old.is_work_time,old.payroll_relevant,old.person_name,old.project_label);
  if changing_facts and (old.created_by_user_id is distinct from current_setting('app.user_id',true) or old.approved or old.submitted_at is not null or old.invoiced_invoice_id is not null) then raise exception 'External time content is locked' using errcode='42501'; end if;
  if row(new.project_id,new.customer_id,new.work_date,new.person_name,new.project_label) is distinct from row(old.project_id,old.customer_id,old.work_date,old.person_name,old.project_label) then raise exception 'External time context is immutable' using errcode='42501'; end if;
  if new.archived_at is distinct from old.archived_at then raise exception 'External time history must be retained' using errcode='42501'; end if;
  if new.invoiced_invoice_id is not null then raise exception 'External billing requires a qualified price allocation' using errcode='42501'; end if;
  if new.approved is distinct from old.approved and (not new.approved or old.submitted_at is null or old.created_by_user_id=current_setting('app.user_id',true) or old.invoiced_invoice_id is not null) then raise exception 'Independent submitted time review required' using errcode='42501'; end if;
  if new.submitted_at is distinct from old.submitted_at then
   if new.submitted_at is not null then
    if old.created_by_user_id is distinct from current_setting('app.user_id',true) or old.approved then raise exception 'Only creator submits external time' using errcode='42501'; end if;
   elsif old.approved or old.created_by_user_id=current_setting('app.user_id',true) or nullif(btrim(new.review_note),'') is null then raise exception 'Independent rejection with reason required' using errcode='42501'; end if;
  end if;
 end if;
 if app_workforce_role() in ('project_manager','manager') and not app_workforce_access(new.customer_id,new.project_id,new.work_date,true) then raise exception 'Assigned project required' using errcode='42501'; end if;
 if changing_facts and not exists(select 1 from external_resource_assignments a join external_resources r on r.organization_id=a.organization_id and r.id=a.resource_id join suppliers sp on sp.organization_id=r.organization_id and sp.id=r.supplier_id join projects p on p.organization_id=a.organization_id and p.id=a.project_id
  where a.organization_id=new.organization_id and a.id=new.external_assignment_id and a.resource_id=new.external_resource_id and a.project_id=new.project_id and p.customer_id is not distinct from new.customer_id and r.supplier_id=new.supplier_id
  and r.active and sp.status='active' and sp.archived_at is null and p.archived_at is null and p.status in ('planned','in_progress','active') and a.revoked_at is null
  and new.work_date>=a.starts_on and (a.ends_on is null or new.work_date<=a.ends_on) and current_date>=a.starts_on and (a.ends_on is null or current_date<=a.ends_on)) then raise exception 'Valid external assignment required' using errcode='42501'; end if;
 return new;
end $$;
create trigger external_time_guard before insert or update on time_entries for each row execute function protect_external_time();

-- Until P18/P19 qualify dated sales prices and exact partial quantities, external
-- time must never reach the existing legacy zero-rate billing path.
create function protect_external_time_invoice_link() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if exists(select 1 from time_entries t where t.id=new.time_entry_id and t.external_resource_id is not null) then raise exception 'External billing requires a qualified price allocation' using errcode='42501'; end if;
 return new;
end $$;
create trigger external_time_invoice_link_guard before insert or update on invoice_line_time_entries for each row execute function protect_external_time_invoice_link();

create or replace function enforce_workforce_time() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if app_workforce_role() not in ('owner','admin','finance','project_manager','manager','member','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Active time membership required' using errcode='42501'; end if;
 -- external_time_guard independently enforces creator, assignment and review.
 if new.external_resource_id is not null then return new; end if;
 if app_workforce_role() in ('member','project_manager','manager') then
  if new.created_by_user_id is distinct from current_setting('app.user_id',true)
   or not exists(select 1 from employees where id=new.employee_id and organization_id=new.organization_id and user_id=new.created_by_user_id and active and archived_at is null)
   or not app_workforce_access(new.customer_id,new.project_id,new.work_date,true)
  then raise exception 'Time assignment required' using errcode='42501'; end if;
 end if;
 return new;
end $$;

create or replace function protect_monthly_time_overlap() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if new.archived_at is not null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':'||coalesce(new.external_resource_id::text,new.employee_id::text,new.created_by_user_id)||':'||coalesce(new.customer_id::text,''),0));
 if exists(select 1 from time_entries t where t.organization_id=new.organization_id and t.id<>new.id and t.archived_at is null
  and ((new.external_resource_id is not null and t.external_resource_id=new.external_resource_id) or (new.external_resource_id is null and t.external_resource_id is null and (t.employee_id=new.employee_id or ((t.employee_id is null or new.employee_id is null) and t.created_by_user_id=new.created_by_user_id))))
  and t.customer_id is not distinct from new.customer_id
  and ((new.report_month is not null and coalesce(t.report_month,t.work_date)>=new.report_month and coalesce(t.report_month,t.work_date)<(new.report_month+interval '1 month'))
   or (t.report_month is not null and coalesce(new.report_month,new.work_date)>=t.report_month and coalesce(new.report_month,new.work_date)<(t.report_month+interval '1 month'))))
 then raise exception 'Monthly report overlaps existing time entries' using errcode='23514',constraint='monthly_time_no_overlap'; end if;
 return new;
end $$;
