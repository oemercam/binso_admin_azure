-- V8, locally authorized: retain every historical numeric value, including zero.
-- The unused legacy projects.budget is intentionally not reinterpreted as cost.
alter table projects alter column hours_budget drop not null;
alter table projects alter column hours_budget drop default;
alter table projects add constraint project_hours_budget_valid check(hours_budget is null or hours_budget between 0 and 1000000);

create table project_financial_budgets(
 organization_id uuid not null references organizations(id) on delete cascade,
 project_id uuid not null,
 cost_budget numeric(14,2) check(cost_budget is null or cost_budget between 0 and 999999999.99),
 currency text not null default 'CHF' check(currency in ('CHF','EUR')),
 updated_by_user_id text not null,
 updated_at timestamptz not null default now(),
 primary key(organization_id,project_id),
 foreign key(organization_id,project_id) references projects(organization_id,id) on delete cascade
);
alter table project_financial_budgets enable row level security;
alter table project_financial_budgets force row level security;
create function app_project_budget_access(p_project uuid,p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true)
 and m.status='active' and m.module_profile='standard' and u.status='active'
 and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only'))
 and ((p_write and m.role in ('owner','admin','manager','project_manager')) or (not p_write and m.role in ('owner','admin','finance','reader','manager','project_manager')))
 and exists(select 1 from projects p where p.organization_id=m.organization_id and p.id=p_project and p.archived_at is null))
$$;
create policy project_budget_read on project_financial_budgets for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_project_budget_access(project_id));
create policy project_budget_insert on project_financial_budgets for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and updated_by_user_id=current_setting('app.user_id',true) and app_project_budget_access(project_id,true));
create policy project_budget_update on project_financial_budgets for update using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_project_budget_access(project_id,true)) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and updated_by_user_id=current_setting('app.user_id',true) and app_project_budget_access(project_id,true));
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on project_financial_budgets to binso_runtime; end if; end $$;
