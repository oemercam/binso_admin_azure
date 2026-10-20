-- Only the authenticated sole owner may bypass independent review for own time.
-- No employee/other active membership may be present; organization policy stays intact.
create function app_is_solo_owner() returns boolean language sql stable
set search_path=pg_catalog,public as $$
 select app_workforce_role()='owner'
 and not exists(select 1 from organization_memberships m where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.status='active' and m.user_id<>current_setting('app.user_id',true))
 and not exists(select 1 from employees e where e.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and e.active and e.archived_at is null and e.user_id is distinct from current_setting('app.user_id',true))
$$;
