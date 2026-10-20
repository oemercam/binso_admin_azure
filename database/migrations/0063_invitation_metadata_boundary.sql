-- Pending members have no organization SELECT policy. Expose only the display
-- metadata of an unexpired, unconsumed, still-pending invitation token hash.
-- Never widen organization RLS or grant an invited identity business access.
create function read_invitation_organization(p_token_hash text,p_lock boolean default false)
returns table(organization_id uuid,organization_name text,status text)
language plpgsql security definer set search_path=pg_catalog,public,pg_temp as $$
declare target uuid;
begin
 select t.organization_id into target from public.auth_tokens t
 join public.organization_invitations i on i.id::text=t.metadata->>'invitation_id'
  and i.organization_id=t.organization_id and lower(i.email)=lower(t.email)
 where t.token_hash=p_token_hash and t.token_type='invitation'
  and t.consumed_at is null and t.expires_at>now()
  and i.status='pending' and i.expires_at>now();
 if target is null then return; end if;
 if p_lock then
  return query select o.id,o.name,o.status from public.organizations o
   where o.id=target and o.status in ('trial','active','grace_period') for update of o;
 else
  return query select o.id,o.name,o.status from public.organizations o
   where o.id=target and o.status in ('trial','active','grace_period');
 end if;
end $$;
revoke all on function read_invitation_organization(text,boolean) from public;
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then
 grant execute on function read_invitation_organization(text,boolean) to binso_runtime;
end if; end $$;
