-- AP-specific configuration on the existing company owner, never a workflow engine.
alter table organizations add column ap_approval_policy jsonb not null default '{"fourEyes":false,"limits":{}}';
alter table organizations add column ap_policy_revision integer not null default 1 check(ap_policy_revision>0);
create function valid_ap_approval_policy(p jsonb) returns boolean language plpgsql immutable set search_path=pg_catalog,public as $$
declare k text;v jsonb;
begin
 if jsonb_typeof(p) is distinct from 'object' or not(p ?& array['fourEyes','limits']) or p-array['fourEyes','limits']<>'{}'::jsonb or jsonb_typeof(p->'fourEyes') is distinct from 'boolean' or jsonb_typeof(p->'limits') is distinct from 'object' then return false;end if;
 for k,v in select * from jsonb_each(p->'limits') loop
  if k!~'^(owner|admin|finance)_(CHF|EUR)$' or jsonb_typeof(v)<>'string' or (v#>>'{}')!~'^\d{1,9}(\.\d{1,2})?$' then return false;end if;
 end loop;return true;
end $$;
alter table organizations add constraint ap_approval_policy_valid check(valid_ap_approval_policy(ap_approval_policy));
create function app_ap_policy_access(p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and m.role in ('owner','admin','finance') and u.status='active' and not o.is_demo
 and s.plan in ('business','professional','enterprise') and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only')))
$$;
create function app_ap_policy_write() returns boolean language sql stable set search_path=pg_catalog,public as $$
 select app_ap_policy_access(true) and app_workforce_role() in ('owner','admin') and exists(select 1 from auth_sessions a where a.id::text=current_setting('app.ap_policy_session',true) and a.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now())
$$;
create function protect_ap_approval_policy() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='INSERT' then
  if new.ap_policy_revision<>1 or new.ap_approval_policy<>'{"fourEyes":false,"limits":{}}'::jsonb then raise exception 'AP policy starts with its explicit default' using errcode='23514';end if;
 elsif row(new.ap_approval_policy,new.ap_policy_revision) is distinct from row(old.ap_approval_policy,old.ap_policy_revision) then
  if not app_ap_policy_write() then raise exception 'Fresh current AP policy administrator required' using errcode='42501';end if;
  if new.ap_policy_revision<>old.ap_policy_revision+1 then raise exception 'AP policy revision must advance once' using errcode='23514';end if;
 end if;return new;
end $$;
create trigger ap_approval_policy_guard before insert or update on organizations for each row execute function protect_ap_approval_policy();
create policy ap_policy_replay on business_idempotency_keys as restrictive for all
 using(operation<>'supplier_invoice.policy' or (app_ap_policy_access() and app_workforce_role() in ('owner','admin')))
 with check(operation<>'supplier_invoice.policy' or app_ap_policy_write());
