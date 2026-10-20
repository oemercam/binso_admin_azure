-- A resource ID is never an authorization identity. Keep policy/function
-- dependencies intact, but eliminate the historical fixed-ID template role.
create or replace function app_workforce_role() returns text language sql stable
set search_path=pg_catalog,public as $$
 select coalesce((select role from public.organization_memberships
  where organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
   and user_id=nullif(current_setting('app.user_id',true),'') and status='active'),'none')
$$;
