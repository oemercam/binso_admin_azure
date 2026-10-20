-- Expand-only guard. Existing ambiguous identities are preserved for separately
-- approved analysis/remediation; authentication refuses to choose a tenant.
create function guard_single_company_identity() returns trigger
language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.status='active' then
  if tg_op='UPDATE' then
   if old.status='active' and old.user_id=new.user_id and old.organization_id=new.organization_id then return new; end if;
  end if;
  -- A common identity row serializes activation across different tenant locks.
  perform 1 from public.app_users where id=new.user_id for update;
  if exists(select 1 from public.organization_memberships m where m.user_id=new.user_id and m.status='active' and m.organization_id<>new.organization_id) then
   raise exception 'Identity already has an active company' using errcode='23514',constraint='single_active_company_identity';
  end if;
 end if;
 return new;
end $$;
revoke all on function guard_single_company_identity() from public;
create trigger single_company_identity before insert or update of status,user_id,organization_id
 on organization_memberships for each row execute function guard_single_company_identity();
