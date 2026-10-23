-- Explicit additional field grants on the existing membership, never a new role.
alter table organization_memberships add column sensitive_grants text[] not null default '{}';
alter table organization_memberships add column sensitive_grants_version integer not null default 1 check(sensitive_grants_version>0);
alter table organization_memberships add constraint sensitive_grants_known check(
 sensitive_grants<@array['hr_sensitive:read','hr_sensitive:write','family:read','family:write','payroll:read','payroll:write','payroll:review','payroll:payment']::text[]
 and array_position(sensitive_grants,null) is null and cardinality(sensitive_grants)<=8);

create function app_has_sensitive_capability(capability text) returns boolean language sql stable
set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id
 join organization_subscriptions subscription on subscription.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=nullif(current_setting('app.user_id',true),'')
 and m.status='active' and u.status='active' and m.module_profile='standard' and capability=any(m.sensitive_grants)
 and ((capability like 'payroll:%' and subscription.plan in ('pro','professional','enterprise'))
  or (capability not like 'payroll:%' and subscription.plan in ('business','pro','professional','enterprise')))
 and (o.status in ('trial','active','grace_period') or (o.status='read_only' and capability in ('hr_sensitive:read','family:read','payroll:read'))))
$$;

create function protect_sensitive_membership_grants() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
declare actor text; previous text[]; allowed text[];
begin
 actor=app_workforce_role();previous=case when tg_op='INSERT' then '{}'::text[] else old.sensitive_grants end;
 if tg_op='UPDATE' and row(new.organization_id,new.user_id) is distinct from row(old.organization_id,old.user_id)
  and (cardinality(previous)>0 or cardinality(new.sensitive_grants)>0) then
  raise exception 'Sensitive grant membership identity is immutable' using errcode='23514';
 end if;
 if tg_op='UPDATE' and row(new.role,new.status,new.module_profile) is distinct from row(old.role,old.status,old.module_profile) then
  new.sensitive_grants='{}';
  if cardinality(previous)>0 then
   insert into audit_events(organization_id,actor_user_id,actor_name,action,entity_type,entity_id,detail)
    values(new.organization_id,coalesce(nullif(current_setting('app.user_id',true),''),'system'),'System','membership.sensitive_grants_reset','organization_membership',new.user_id,'{"reason":"role_profile_or_status_changed"}');
  end if;
 end if;
 if new.sensitive_grants is distinct from previous then
  if not(tg_op='UPDATE' and row(new.role,new.status,new.module_profile) is distinct from row(old.role,old.status,old.module_profile)) then
   if actor is null or actor not in ('owner','admin') or new.organization_id is distinct from nullif(current_setting('app.organization_id',true),'')::uuid
    or (new.role='owner' and actor<>'owner') then raise exception 'Administrative sensitive grant management required' using errcode='42501'; end if;
   if not exists(select 1 from auth_sessions a where a.id::text=nullif(current_setting('app.sensitive_grant_session',true),'')
    and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now()
    and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then
    raise exception 'Fresh session-bound sensitive grant confirmation required' using errcode='42501';
   end if;
  end if;
 end if;
 if cardinality(new.sensitive_grants)>0 then
  if new.status<>'active' or new.module_profile<>'standard' then raise exception 'Active standard membership required' using errcode='23514'; end if;
  allowed=case when new.role in ('owner','admin') then array['hr_sensitive:read','hr_sensitive:write','family:read','family:write','payroll:read','payroll:write','payroll:review','payroll:payment']::text[]
   when new.role='hr' then array['hr_sensitive:read','hr_sensitive:write','family:read','family:write','payroll:read','payroll:write','payroll:review']::text[]
   when new.role='finance' then array['payroll:read','payroll:write','payroll:review','payroll:payment']::text[] else '{}'::text[] end;
  if not new.sensitive_grants<@allowed then raise exception 'Sensitive grants do not match the role' using errcode='23514'; end if;
  if ('hr_sensitive:write'=any(new.sensitive_grants) and not 'hr_sensitive:read'=any(new.sensitive_grants))
   or ('family:write'=any(new.sensitive_grants) and not 'family:read'=any(new.sensitive_grants))
   or (new.sensitive_grants&&array['payroll:write','payroll:review','payroll:payment']::text[] and not 'payroll:read'=any(new.sensitive_grants)) then
   raise exception 'Explicit corresponding read grant required' using errcode='23514';
  end if;
 end if;
 if tg_op='INSERT' then new.sensitive_grants_version=1;
 else new.sensitive_grants_version=old.sensitive_grants_version+case when new.sensitive_grants is distinct from previous then 1 else 0 end;
 end if;
 return new;
end $$;
create trigger membership_sensitive_grants before insert or update on organization_memberships
 for each row execute function protect_sensitive_membership_grants();
