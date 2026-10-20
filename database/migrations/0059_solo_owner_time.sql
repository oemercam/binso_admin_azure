-- Only the authenticated sole owner may bypass independent review for own time.
-- No employee/other active membership may be present; organization policy stays intact.
create function app_is_solo_owner() returns boolean language sql stable
set search_path=pg_catalog,public as $$
 select app_workforce_role()='owner'
 and not exists(select 1 from organization_memberships m where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.status='active' and m.user_id<>current_setting('app.user_id',true))
 and not exists(select 1 from employees e where e.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and e.active and e.archived_at is null and e.user_id is distinct from current_setting('app.user_id',true))
$$;

-- The approved solo-owner exception does not permit employee self-review.
create or replace function protect_time_review() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if new.created_by_user_id is distinct from old.created_by_user_id then raise exception 'Time author is immutable' using errcode='42501'; end if;
 if app_workforce_role() not in ('owner','admin','finance','project_manager','manager','member','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Active time membership required' using errcode='42501'; end if;
 if new.approved and not old.approved then
  if (new.created_by_user_id=current_setting('app.user_id',true) and not app_is_solo_owner()) or app_workforce_role() not in ('owner','admin','project_manager','manager','demo_template')
  then raise exception 'Independent time approval required' using errcode='42501'; end if;
 end if;
 if (old.approved or old.submitted_at is not null or old.invoiced_invoice_id is not null)
  and row(new.hours,new.work_date,new.customer_id,new.project_id,new.employee_id,new.report_month,new.description,new.created_by_user_id)
   is distinct from row(old.hours,old.work_date,old.customer_id,old.project_id,old.employee_id,old.report_month,old.description,old.created_by_user_id)
 then raise exception 'Finalized time content is immutable' using errcode='42501'; end if;
 return new;
end $$;
