-- Only unused duplicate customer identities are consolidated. Issued documents,
-- approved work, workforce assignments and every other business FK stay intact.
alter table customers add column merged_into_customer_id uuid;
alter table customers add constraint customer_merge_target_tenant foreign key(organization_id,merged_into_customer_id) references customers(organization_id,id);
alter table customers add constraint customer_merge_distinct check(merged_into_customer_id<>id);
alter table customers add constraint customer_merge_archived check(merged_into_customer_id is null or archived_at is not null);
create index customer_merge_pointer on customers(organization_id,merged_into_customer_id) where merged_into_customer_id is not null;
create table customer_merges(
 organization_id uuid not null references organizations(id) on delete cascade,
 source_id uuid not null,
 target_id uuid not null,
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 primary key(organization_id,source_id),
 foreign key(organization_id,source_id) references customers(organization_id,id) on delete cascade,
 foreign key(organization_id,target_id) references customers(organization_id,id) on delete cascade,
 check(source_id<>target_id)
);
create index customer_merge_target on customer_merges(organization_id,target_id);
alter table customer_merges enable row level security;
alter table customer_merges force row level security;
create policy tenant_scope on customer_merges using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
create policy merge_reader on customer_merges as restrictive for select using(app_workforce_role() in ('owner','admin'));
create policy merge_writer on customer_merges as restrictive for insert with check(app_workforce_role() in ('owner','admin') and created_by_user_id=current_setting('app.user_id',true));
create function protect_customer_merge() returns trigger language plpgsql
set search_path=pg_catalog,public as $$ begin
 if tg_op='UPDATE' then raise exception 'Customer merge identity is immutable' using errcode='23514'; end if;
 if app_workforce_role() not in ('owner','admin') or new.created_by_user_id is distinct from current_setting('app.user_id',true) then raise exception 'Administrative customer merge required' using errcode='42501'; end if;
 if not exists(select 1 from customers where organization_id=new.organization_id and id=new.source_id and archived_at is not null and merged_into_customer_id=new.target_id)
 or not exists(select 1 from customers where organization_id=new.organization_id and id=new.target_id and archived_at is null and merged_into_customer_id is null)
 or exists(select 1 from customer_merges where organization_id=new.organization_id and (source_id=new.target_id or target_id=new.source_id))
 then raise exception 'Invalid customer merge state' using errcode='23514'; end if;
 return new;
end $$;

-- Older polymorphic references are text rather than customer FKs. Lock an
-- actual matching customer if one exists; unrelated entity IDs remain valid.
create function reject_merged_customer_legacy_reference() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
declare reference text; scope uuid; merged_target uuid;
begin
 if tg_op='UPDATE' and (to_jsonb(new)->tg_argv[0]) is not distinct from (to_jsonb(old)->tg_argv[0]) then return new; end if;
 reference:=nullif(to_jsonb(new)->>tg_argv[0],'');
 if reference is null then return new; end if;
 scope:=nullif(to_jsonb(new)->>'organization_id','')::uuid;
 select merged_into_customer_id into merged_target from customers where organization_id=scope and id::text=lower(reference) for key share;
 if merged_target is not null then raise exception 'Customer was merged; select the retained customer' using errcode='23514'; end if;
 return new;
end $$;
do $$ declare item record; begin
 for item in
  select t.relname table_name,a.attname column_name from pg_class t
  join pg_namespace n on n.oid=t.relnamespace join pg_attribute a on a.attrelid=t.oid
  where n.nspname='public' and t.relkind='r' and not a.attisdropped
  and a.attname in ('entity_external_id','related_entity_external_id','source_external_id')
  and exists(select 1 from pg_attribute scope where scope.attrelid=t.oid and scope.attname='organization_id' and not scope.attisdropped)
 loop
  execute format('create trigger %I before insert or update of %I on public.%I for each row execute function reject_merged_customer_legacy_reference(%L)','merged_customer_legacy_'||item.column_name,item.column_name,item.table_name,item.column_name);
 end loop;
end $$;
create trigger immutable_customer_merge before insert or update on customer_merges for each row execute function protect_customer_merge();
create function prevent_customer_merge_restore() returns trigger language plpgsql
set search_path=pg_catalog,public as $$ begin
 if old.merged_into_customer_id is not null and (new.archived_at is null or new.merged_into_customer_id is distinct from old.merged_into_customer_id) then raise exception 'Merged customer cannot be restored independently' using errcode='23514'; end if;
 if new.merged_into_customer_id is not null and new.merged_into_customer_id is distinct from old.merged_into_customer_id and app_workforce_role() not in ('owner','admin') then raise exception 'Administrative customer merge required' using errcode='42501'; end if;
 return new;
end $$;
create trigger merged_customer_restore before update of archived_at,merged_into_customer_id on customers for each row execute function prevent_customer_merge_restore();
create function verify_customer_merge_receipt() returns trigger language plpgsql
set search_path=pg_catalog,public as $$ begin
 if tg_op='UPDATE' and new.merged_into_customer_id is not distinct from old.merged_into_customer_id then return new; end if;
 if new.merged_into_customer_id is not null and not exists(select 1 from customer_merges where organization_id=new.organization_id and source_id=new.id and target_id=new.merged_into_customer_id) then raise exception 'Customer merge receipt required' using errcode='23514'; end if;
 return new;
end $$;
create constraint trigger customer_merge_receipt after insert or update on customers deferrable initially deferred for each row execute function verify_customer_merge_receipt();

-- A row lock closes the race between an in-flight business INSERT and merge.
-- No security-definer function, RLS bypass or content-immutability exception.
create function reject_merged_customer_reference() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
declare reference uuid; scope uuid; found_id uuid; merged_target uuid;
begin
 if tg_op='UPDATE' and (to_jsonb(new)->tg_argv[0]) is not distinct from (to_jsonb(old)->tg_argv[0]) then return new; end if;
 reference:=nullif(to_jsonb(new)->>tg_argv[0],'')::uuid;
 if reference is null then return new; end if;
 scope:=nullif(to_jsonb(new)->>'organization_id','')::uuid;
 select id,merged_into_customer_id into found_id,merged_target from customers where id=reference and organization_id=scope for key share;
 -- Preserve authorization semantics for references hidden by the caller's RLS.
 -- Do not reveal whether an inaccessible customer exists in another scope.
 if found_id is null then raise exception 'Customer association unavailable' using errcode='42501'; end if;
 if merged_target is not null then raise exception 'Customer was merged; select the retained customer' using errcode='23514'; end if;
 return new;
end $$;
do $$ declare item record; begin
 for item in
  select distinct t.relname table_name,a.attname column_name from pg_constraint f
  join pg_class t on t.oid=f.conrelid join pg_namespace n on n.oid=t.relnamespace
  join lateral unnest(f.conkey,f.confkey) k(local_key,foreign_key) on true
  join pg_attribute a on a.attrelid=t.oid and a.attnum=k.local_key
  join pg_attribute parent on parent.attrelid=f.confrelid and parent.attnum=k.foreign_key
  where f.contype='f' and f.confrelid='public.customers'::regclass and parent.attname='id' and n.nspname='public' and t.relname<>'customer_merges'
 loop
  execute format('create trigger %I before insert or update of %I on public.%I for each row execute function reject_merged_customer_reference(%L)','merged_customer_reference_'||item.column_name,item.column_name,item.table_name,item.column_name);
 end loop;
 if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert on customer_merges to binso_runtime; end if;
end $$;
