-- External business resources are not employees or app identities.
create table external_resources(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 supplier_id uuid not null,
 name text not null check(length(btrim(name)) between 1 and 200),
 role_label text check(length(role_label)<=160),
 active boolean not null default true,
 version integer not null default 1 check(version>0),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key(organization_id,supplier_id) references suppliers(organization_id,id)
);
create table external_resource_assignments(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 resource_id uuid not null,
 project_id uuid not null,
 starts_on date not null,
 ends_on date,
 revoked_at timestamptz,
 revoked_by_user_id text,
 version integer not null default 1 check(version>0),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key(organization_id,resource_id) references external_resources(organization_id,id),
 foreign key(organization_id,project_id) references projects(organization_id,id),
 check(ends_on is null or ends_on>=starts_on),
 check((revoked_at is null)=(revoked_by_user_id is null))
);
create index external_resource_supplier on external_resources(organization_id,supplier_id);
create index external_assignment_scope on external_resource_assignments(organization_id,resource_id,project_id,starts_on) where revoked_at is null;
alter table external_resources enable row level security;
alter table external_resources force row level security;
alter table external_resource_assignments enable row level security;
alter table external_resource_assignments force row level security;

create policy external_assignment_read on external_resource_assignments for select using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and
 (app_workforce_role() in ('owner','admin','demo_template') or
 (app_workforce_role() in ('project_manager','manager') and exists(select 1 from projects p
  where p.organization_id=external_resource_assignments.organization_id and p.id=project_id and p.archived_at is null
   and app_workforce_access(p.customer_id,p.id,current_date,true)))));
create policy external_resource_read on external_resources for select using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and
 (app_workforce_role() in ('owner','admin','demo_template') or
 (app_workforce_role() in ('project_manager','manager') and exists(select 1 from external_resource_assignments a
  where a.organization_id=external_resources.organization_id and a.resource_id=external_resources.id
   and a.revoked_at is null and a.starts_on<=current_date and (a.ends_on is null or a.ends_on>=current_date)))));
create policy external_resource_insert on external_resources for insert with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template')
 and created_by_user_id=current_setting('app.user_id',true));
create policy external_resource_update on external_resources for update using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template'))
 with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template'));
create policy external_assignment_insert on external_resource_assignments for insert with check(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template')
 and created_by_user_id=current_setting('app.user_id',true));
create policy external_assignment_update on external_resource_assignments for update using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template'))
 with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','demo_template'));
-- No runtime DELETE policy: ending an assignment preserves history.
create function protect_external_resource_identity() returns trigger language plpgsql as $$
begin
 if row(new.organization_id,new.supplier_id,new.created_by_user_id,new.id) is distinct from row(old.organization_id,old.supplier_id,old.created_by_user_id,old.id) then
  raise exception 'External resource identity is immutable' using errcode='23514';
 end if;
 return new;
end $$;
create trigger external_resource_identity before update on external_resources for each row execute function protect_external_resource_identity();
create trigger external_resource_version before update on external_resources for each row execute function bump_business_record_version();

create function protect_external_assignment() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':external:'||new.resource_id::text||':'||new.project_id::text,0));
 if tg_op='UPDATE' then
  if old.revoked_at is not null or new.revoked_at is null or new.revoked_at<old.created_at or new.revoked_at>now() or new.revoked_by_user_id is distinct from current_setting('app.user_id',true)
   or (to_jsonb(new)-'revoked_at'-'revoked_by_user_id'-'version'-'updated_at') is distinct from (to_jsonb(old)-'revoked_at'-'revoked_by_user_id'-'version'-'updated_at') then
   raise exception 'External assignment history is immutable' using errcode='23514';
  end if;
 else
  if new.revoked_at is not null or not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.archived_at is null)
   or not exists(select 1 from external_resources r join suppliers s on s.organization_id=r.organization_id and s.id=r.supplier_id
   where r.organization_id=new.organization_id and r.id=new.resource_id and r.active and s.status='active' and s.archived_at is null) then
   raise exception 'Active external resource and supplier required' using errcode='23514';
  end if;
  if exists(select 1 from external_resource_assignments a where a.organization_id=new.organization_id and a.resource_id=new.resource_id and a.project_id=new.project_id and a.revoked_at is null
   and daterange(a.starts_on,a.ends_on,'[]') && daterange(new.starts_on,new.ends_on,'[]')) then
   raise exception 'External assignments overlap' using errcode='23514';
  end if;
 end if;
 return new;
end $$;
create trigger external_assignment_guard before insert or update on external_resource_assignments for each row execute function protect_external_assignment();
create trigger external_assignment_version before update on external_resource_assignments for each row execute function bump_business_record_version();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then
 grant select,insert,update on external_resources,external_resource_assignments to binso_runtime;
end if; end $$;
