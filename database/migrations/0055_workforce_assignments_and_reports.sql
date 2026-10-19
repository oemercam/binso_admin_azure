-- Explicit workforce scope. Existing business records are preserved; no assignments
-- are invented. Owners/admins must review and grant access before member rollout.
alter table employees add column user_id text references app_users(id);
create unique index employees_user_identity on employees(organization_id,user_id) where user_id is not null and archived_at is null;
create table workforce_assignments(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id),
 user_id text not null,
 employee_id uuid not null,
 customer_id uuid not null,
 project_id uuid,
 starts_on date not null default current_date,
 ends_on date,
 revoked_at timestamptz,
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 foreign key(organization_id,user_id) references organization_memberships(organization_id,user_id),
 foreign key(organization_id,employee_id) references employees(organization_id,id),
 foreign key(organization_id,customer_id) references customers(organization_id,id),
 foreign key(organization_id,project_id) references projects(organization_id,id),
 check(ends_on is null or ends_on>=starts_on)
);
create index workforce_scope_lookup on workforce_assignments(organization_id,user_id,customer_id,project_id) where revoked_at is null;
alter table workforce_assignments enable row level security;
alter table workforce_assignments force row level security;
create policy tenant_isolation on workforce_assignments using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);

create function app_workforce_role() returns text language sql stable
set search_path=pg_catalog,public as $$
 select case when current_setting('app.organization_id',true)='00000000-0000-4000-8000-000000000099' then 'demo_template' else coalesce((select role from organization_memberships where organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=nullif(current_setting('app.user_id',true),'') and status='active'),'none') end
$$;
create policy workforce_read on workforce_assignments as restrictive for select using(user_id=current_setting('app.user_id',true) or app_workforce_role() in ('owner','admin'));
create policy workforce_insert on workforce_assignments as restrictive for insert with check(app_workforce_role() in ('owner','admin'));
create policy workforce_update on workforce_assignments as restrictive for update using(app_workforce_role() in ('owner','admin')) with check(app_workforce_role() in ('owner','admin'));
create policy workforce_delete on workforce_assignments as restrictive for delete using(false);

create function app_workforce_access(p_customer uuid,p_project uuid,p_date date default current_date,p_exact boolean default false) returns boolean language sql stable
set search_path=pg_catalog,public as $$
 select app_workforce_role() in ('owner','admin','finance','hr','reader','demo_template') or (p_customer is null and p_project is null and exists(select 1 from employees e where e.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and e.user_id=current_setting('app.user_id',true) and e.active and e.archived_at is null)) or exists(
  select 1 from workforce_assignments a join employees e on e.id=a.employee_id and e.organization_id=a.organization_id
  where a.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
   and a.user_id=current_setting('app.user_id',true) and e.user_id=a.user_id and e.active and e.archived_at is null
   and a.customer_id=p_customer and ((p_project is null and (not p_exact or a.project_id is null)) or a.project_id=p_project)
   and a.revoked_at is null and p_date>=a.starts_on and (a.ends_on is null or p_date<=a.ends_on)
   and current_date>=a.starts_on and (a.ends_on is null or current_date<=a.ends_on)
 )
$$;
create policy customer_workforce_scope on customers as restrictive for select using(app_workforce_access(id,null));
create policy contact_workforce_scope on customer_contacts as restrictive for select using(app_workforce_access(customer_id,null));
create policy project_workforce_scope on projects as restrictive for select using(app_workforce_access(customer_id,id));
create policy customer_workforce_create on customers as restrictive for insert with check(app_workforce_role() in ('owner','admin','finance','demo_template'));
create policy project_workforce_create on projects as restrictive for insert with check(app_workforce_role() in ('owner','admin','demo_template'));
create policy quote_workforce_scope on quotes as restrictive for select using(app_workforce_access(customer_id,null));
create policy invoice_workforce_scope on invoices as restrictive for select using(app_workforce_access(customer_id,null));
create policy quote_line_workforce_scope on quote_lines as restrictive for select using(exists(select 1 from quotes q where q.id=quote_id and q.organization_id=quote_lines.organization_id));
create policy invoice_line_workforce_scope on invoice_lines as restrictive for select using(exists(select 1 from invoices i where i.id=invoice_id and i.organization_id=invoice_lines.organization_id));

-- Writes are checked again in the database, not just in selection endpoints.
create function enforce_workforce_time() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if app_workforce_role() not in ('owner','admin','finance','project_manager','manager','member','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Active time membership required' using errcode='42501'; end if;
 if app_workforce_role() in ('member','project_manager','manager') then
  if new.created_by_user_id is distinct from current_setting('app.user_id',true)
   or not exists(select 1 from employees where id=new.employee_id and organization_id=new.organization_id and user_id=new.created_by_user_id and active and archived_at is null)
   or not app_workforce_access(new.customer_id,new.project_id,new.work_date,true)
  then raise exception 'Time assignment required' using errcode='42501'; end if;
 end if;
 return new;
end $$;
create trigger workforce_time_write before insert or update of customer_id,project_id,employee_id,hours,work_date on time_entries for each row execute function enforce_workforce_time();
create policy time_workforce_read on time_entries as restrictive for select using(app_workforce_role() in ('owner','admin','finance','hr','reader','demo_template') or created_by_user_id=current_setting('app.user_id',true) or (app_workforce_role() in ('project_manager','manager') and app_workforce_access(customer_id,project_id,work_date,true)));
create policy expense_workforce_read on expenses as restrictive for select using(app_workforce_role() in ('owner','admin','finance','hr','reader','demo_template') or created_by_user_id=current_setting('app.user_id',true) or (app_workforce_role() in ('project_manager','manager') and app_workforce_access(customer_id,null,expense_date)));

alter table time_entries add column report_month date;
alter table time_entries add column review_note text;
alter table time_entries add constraint report_month_start check(report_month is null or (extract(day from report_month)=1 and work_date=report_month));
alter table file_objects add column time_entry_id uuid;
alter table file_objects add constraint file_time_entry_tenant_fk foreign key(organization_id,time_entry_id) references time_entries(organization_id,id);
create index file_time_report_lookup on file_objects(organization_id,time_entry_id) where time_entry_id is not null;

create function protect_monthly_time_overlap() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if new.archived_at is not null then return new; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':'||coalesce(new.employee_id::text,new.created_by_user_id)||':'||coalesce(new.customer_id::text,''),0));
 if exists(select 1 from time_entries t where t.organization_id=new.organization_id and t.id<>new.id and t.archived_at is null
  and (t.employee_id=new.employee_id or ((t.employee_id is null or new.employee_id is null) and t.created_by_user_id=new.created_by_user_id))
  and t.customer_id is not distinct from new.customer_id
  and ((new.report_month is not null and coalesce(t.report_month,t.work_date)>=new.report_month and coalesce(t.report_month,t.work_date)<(new.report_month+interval '1 month'))
   or (t.report_month is not null and coalesce(new.report_month,new.work_date)>=t.report_month and coalesce(new.report_month,new.work_date)<(t.report_month+interval '1 month'))))
 then raise exception 'Monthly report overlaps existing time entries' using errcode='23514',constraint='monthly_time_no_overlap'; end if;
 return new;
end $$;
create trigger monthly_time_overlap before insert or update of hours,work_date,report_month,customer_id,employee_id,archived_at on time_entries for each row execute function protect_monthly_time_overlap();

create policy file_workforce_scope on file_objects as restrictive for select using(
 app_workforce_role() in ('owner','admin','finance','hr','reader','demo_template') or
 (purpose='profile_avatar' and created_by=current_setting('app.user_id',true)) or purpose='company_logo' or
 (purpose='support_attachment' and exists(select 1 from support_cases s where s.id=support_case_id and s.organization_id=file_objects.organization_id and s.created_by_user_id=current_setting('app.user_id',true))) or
 (purpose='expense_receipt' and exists(select 1 from expenses e where e.id=expense_id and e.organization_id=file_objects.organization_id and (e.created_by_user_id=current_setting('app.user_id',true) or (app_workforce_role() in ('project_manager','manager') and app_workforce_access(e.customer_id,null,e.expense_date))))) or
 (purpose='time_report' and exists(select 1 from time_entries t where t.id=time_entry_id and t.organization_id=file_objects.organization_id and (t.created_by_user_id=current_setting('app.user_id',true) or (app_workforce_role() in ('project_manager','manager') and app_workforce_access(t.customer_id,t.project_id,t.work_date,true))))) or
 (purpose='customer_document' and app_workforce_access(customer_id,null)) or
 (purpose='offer_attachment' and exists(select 1 from quotes q where q.id=quote_id and q.organization_id=file_objects.organization_id and app_workforce_access(q.customer_id,null))) or
 (purpose='invoice_attachment' and exists(select 1 from invoices i where i.id=invoice_id and i.organization_id=file_objects.organization_id and app_workforce_access(i.customer_id,null))) or
 (purpose='project_document' and exists(select 1 from projects p where p.id=project_id and p.organization_id=file_objects.organization_id and app_workforce_access(p.customer_id,p.id)))
);
create policy file_content_workforce_scope on file_contents as restrictive for select using(exists(select 1 from file_objects f where f.id=file_id and f.organization_id=file_contents.organization_id));

do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select,insert,update on workforce_assignments to binso_runtime;
 end if;
end $$;

-- Preserve legacy combined addresses; never guess the house-number boundary.
alter table customers add column street text;
alter table customers add column building_number text;

create function enforce_workforce_assignment() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if tg_op='UPDATE' and new.revoked_at is not null and (to_jsonb(new)-'revoked_at')=(to_jsonb(old)-'revoked_at') then return new; end if;
 if not exists(select 1 from employees e join organization_memberships m on m.organization_id=e.organization_id and m.user_id=e.user_id
  where e.organization_id=new.organization_id and e.id=new.employee_id and e.user_id=new.user_id and e.active and e.archived_at is null and m.status='active')
  or (new.project_id is not null and not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.customer_id=new.customer_id and p.archived_at is null))
 then raise exception 'Assignment identity or customer mismatch' using errcode='23514'; end if;
 return new;
end $$;
create trigger workforce_assignment_identity before insert or update on workforce_assignments for each row execute function enforce_workforce_assignment();

-- Direct SQL writes must obey the same review separation and immutable-history
-- boundary as the API. Initial legacy/demo seeds keep their existing semantics.
create function protect_time_review() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if new.created_by_user_id is distinct from old.created_by_user_id then raise exception 'Time author is immutable' using errcode='42501'; end if;
 if app_workforce_role() not in ('owner','admin','finance','project_manager','manager','member','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Active time membership required' using errcode='42501'; end if;
 if new.approved and not old.approved then
  if new.created_by_user_id=current_setting('app.user_id',true) or app_workforce_role() not in ('owner','admin','project_manager','manager','demo_template')
  then raise exception 'Independent time approval required' using errcode='42501'; end if;
 end if;
 if (old.approved or old.submitted_at is not null or old.invoiced_invoice_id is not null)
  and row(new.hours,new.work_date,new.customer_id,new.project_id,new.employee_id,new.report_month,new.description,new.created_by_user_id)
   is distinct from row(old.hours,old.work_date,old.customer_id,old.project_id,old.employee_id,old.report_month,old.description,old.created_by_user_id)
 then raise exception 'Finalized time content is immutable' using errcode='42501'; end if;
 return new;
end $$;
create trigger time_review_guard before update on time_entries for each row execute function protect_time_review();

create function protect_expense_workforce() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if app_workforce_role() not in ('owner','admin','finance','project_manager','manager','member','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Active expense membership required' using errcode='42501'; end if;
 if tg_op='INSERT' and app_workforce_role() in ('member','project_manager','manager') then
  if new.created_by_user_id is distinct from current_setting('app.user_id',true)
   or not exists(select 1 from employees e where e.organization_id=new.organization_id and e.id=new.employee_id and e.user_id=new.created_by_user_id and e.active and e.archived_at is null)
   or (new.customer_id is not null and not app_workforce_access(new.customer_id,null,new.expense_date))
  then raise exception 'Expense assignment required' using errcode='42501'; end if;
 end if;
 if tg_op='UPDATE' then
  if new.created_by_user_id is distinct from old.created_by_user_id then raise exception 'Expense author is immutable' using errcode='42501'; end if;
  if new.status in ('approved','rejected') and new.status is distinct from old.status then
   if new.created_by_user_id=current_setting('app.user_id',true) or app_workforce_role() not in ('owner','admin','project_manager','manager','demo_template')
    or (app_workforce_role() in ('project_manager','manager') and not app_workforce_access(new.customer_id,null,new.expense_date))
   then raise exception 'Independent expense review required' using errcode='42501'; end if;
  end if;
  if (old.status in ('approved','posted') or (new.status in ('approved','rejected') and new.status is distinct from old.status) or old.invoiced_invoice_id is not null or old.reimbursed_at is not null
    or (app_workforce_role() in ('member','project_manager','manager') and old.created_by_user_id is distinct from current_setting('app.user_id',true)))
   and row(new.customer_id,new.employee_id,new.quantity,new.unit_price,new.currency,new.expense_date,new.description,new.created_by_user_id,new.merchant,new.category,new.category_label,new.vat_rate,new.billable)
    is distinct from row(old.customer_id,old.employee_id,old.quantity,old.unit_price,old.currency,old.expense_date,old.description,old.created_by_user_id,old.merchant,old.category,old.category_label,old.vat_rate,old.billable)
   then raise exception 'Expense content is immutable' using errcode='42501'; end if;
 end if;
 return new;
end $$;
create trigger expense_workforce_guard before insert or update on expenses for each row execute function protect_expense_workforce();

create function protect_employee_identity() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' and new.user_id is null then return new; end if;
 if tg_op='UPDATE' and new.user_id is not distinct from old.user_id then return new; end if;
 if app_workforce_role() not in ('owner','admin','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls))
 then raise exception 'Administrative employee identity binding required' using errcode='42501'; end if;
 return new;
end $$;
create trigger employee_identity_guard before insert or update of user_id on employees for each row execute function protect_employee_identity();
