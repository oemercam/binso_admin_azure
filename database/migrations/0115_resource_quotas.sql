-- Private accounting, not a second permission model. Archived bytes still count;
-- deletion of retained copies releases bytes, deletion of documents never resets
-- their monthly creation budget. No historic business data is changed.
create table organization_quota_usage(
 organization_id uuid not null references organizations(id) on delete cascade,
 period text not null check(period='storage' or period ~ '^[0-9]{4}-[0-9]{2}$'),
 used bigint not null default 0 check(used>=0),
 api_requests bigint not null default 0 check(api_requests>=0),
 primary key(organization_id,period)
);
alter table organization_quota_usage enable row level security;
alter table organization_quota_usage force row level security;
create policy quota_read on organization_quota_usage for select using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
-- Only the schema owner executing fixed accounting functions may change counters.
create policy quota_accounting on organization_quota_usage for all using(
 organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and current_user=pg_get_userbyid((select relowner from pg_class where oid='public.organization_quota_usage'::regclass)))
 with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid
 and current_user=pg_get_userbyid((select relowner from pg_class where oid='public.organization_quota_usage'::regclass)));

-- Seed under each organization's existing administrative identity so FORCE RLS
-- remains enabled. No owner is invented. An unaccountable old organization stays
-- closed to additional storage until an administrator reconciles its inventory.
do $$ declare org record; original_org text:=current_setting('app.organization_id',true);
 original_user text:=current_setting('app.user_id',true); actor text; bytes bigint;
begin
 for org in select id from organizations loop
  perform set_config('app.organization_id',org.id::text,true);
  select user_id into actor from organization_memberships where organization_id=org.id
   and role in ('owner','admin') and status='active' order by role desc,user_id limit 1;
  if actor is null then continue; end if;
  -- A role-filtered total could miss inaccessible historical contract files.
  -- Require an already authorized inventory administrator; never grant bypass
  -- to the runtime or silently initialize a partial storage balance.
  if not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then
   raise exception 'Unfiltered quota inventory requires an authorized BYPASSRLS migration administrator' using errcode='42501';
  end if;
  perform set_config('app.user_id',actor,true);
  select coalesce(sum(n),0) into bytes from (
   select octet_length(body)::bigint n from file_contents where organization_id=org.id
   union all select octet_length(pdf)::bigint from offer_versions where organization_id=org.id
   union all select octet_length(pdf)::bigint from invoice_versions where organization_id=org.id
   union all select octet_length(pdf)::bigint from report_exports where organization_id=org.id
  ) b;
  insert into organization_quota_usage(organization_id,period,used) values(org.id,'storage',bytes);
  insert into organization_quota_usage(organization_id,period,used)
   select org.id,to_char(created_at at time zone 'Europe/Zurich','YYYY-MM'),count(*)
   from (select created_at from invoices where organization_id=org.id union all
    select created_at from quotes where organization_id=org.id) d group by 2;
 end loop;
 perform set_config('app.organization_id',coalesce(original_org,''),true);
 perform set_config('app.user_id',coalesce(original_user,''),true);
end $$;

create function initialize_organization_quota() returns trigger language plpgsql security definer
set search_path=pg_catalog,public as $$
declare previous text:=current_setting('app.organization_id',true);
begin
 perform set_config('app.organization_id',new.id::text,true);
 insert into public.organization_quota_usage(organization_id,period) values(new.id,'storage');
 perform set_config('app.organization_id',coalesce(previous,''),true);
 return new;
end $$;
create trigger organization_quota_initialize after insert on organizations
 for each row execute function initialize_organization_quota();

create function account_organization_storage() returns trigger language plpgsql security definer
set search_path=pg_catalog,public as $$
declare org uuid; delta bigint; maximum bigint; actual bigint; new_size bigint:=0; old_size bigint:=0;
 previous text:=current_setting('app.organization_id',true); administrative boolean;
begin
 org:=case when tg_op='DELETE' then old.organization_id else new.organization_id end;
 if tg_op='UPDATE' and new.organization_id is distinct from old.organization_id then
  raise exception 'Storage ownership is immutable' using errcode='42501'; end if;
 perform set_config('app.organization_id',org::text,true);
 -- Cascading approved company erasure no longer has a parent/counter to update.
 if tg_op='DELETE' and not exists(select 1 from public.organizations where id=org) then
  perform set_config('app.organization_id',coalesce(previous,''),true);return old; end if;
 if tg_op<>'DELETE' then execute format('select octet_length(($1).%I)',tg_argv[0]) into new_size using new; end if;
 if tg_op<>'INSERT' then execute format('select octet_length(($1).%I)',tg_argv[0]) into old_size using old; end if;
 delta:=new_size-old_size;
 select rolsuper or rolbypassrls into administrative from pg_roles
  where rolname=coalesce(nullif(current_setting('role',true),'none'),session_user);
 perform set_config('app.organization_id',org::text,true);
 select max_storage_mb::bigint*1048576 into maximum from public.organization_entitlements where organization_id=org;
 if delta>0 and maximum is null and not coalesce(administrative,false) then raise exception 'Storage entitlement missing' using errcode='42501'; end if;
 update public.organization_quota_usage set used=used+delta where organization_id=org and period='storage'
  and used+delta>=0 and (delta<=0 or administrative or used+delta<=maximum) returning used into actual;
 if not found then raise exception 'Storage quota exceeded or inventory unavailable' using errcode='23514',constraint='organization_storage_quota'; end if;
 perform set_config('app.organization_id',coalesce(previous,''),true);
 if tg_op='DELETE' then return old; end if; return new;
end $$;
create trigger quota_file_contents after insert or update or delete on file_contents for each row execute function account_organization_storage('body');
create trigger quota_offer_versions after insert or update or delete on offer_versions for each row execute function account_organization_storage('pdf');
create trigger quota_invoice_versions after insert or update or delete on invoice_versions for each row execute function account_organization_storage('pdf');
create trigger quota_report_exports after insert or update or delete on report_exports for each row execute function account_organization_storage('pdf');

create function account_monthly_document() returns trigger language plpgsql security definer
set search_path=pg_catalog,public as $$
declare maximum bigint; actual bigint; month text:=to_char(now() at time zone 'Europe/Zurich','YYYY-MM');
 previous text:=current_setting('app.organization_id',true); administrative boolean;
begin
 select rolsuper or rolbypassrls into administrative from pg_roles
  where rolname=coalesce(nullif(current_setting('role',true),'none'),session_user);
 if new.organization_id is distinct from nullif(previous,'')::uuid and not coalesce(administrative,false) then
  raise exception 'Tenant accounting context required' using errcode='42501'; end if;
 perform set_config('app.organization_id',new.organization_id::text,true);
 if not coalesce(administrative,false) and not exists(select 1 from public.organization_quota_usage where organization_id=new.organization_id and period='storage') then
  raise exception 'Organization quota inventory unavailable' using errcode='42501'; end if;
 select max_monthly_documents into maximum from public.organization_entitlements where organization_id=new.organization_id;
 if maximum is null and not coalesce(administrative,false) then raise exception 'Document entitlement missing' using errcode='42501'; end if;
 insert into public.organization_quota_usage(organization_id,period,used) values(new.organization_id,month,1)
 on conflict(organization_id,period) do update set used=organization_quota_usage.used+1 returning used into actual;
 if actual>maximum and not coalesce(administrative,false) then raise exception 'Monthly document quota exceeded' using errcode='23514',constraint='organization_document_quota'; end if;
 perform set_config('app.organization_id',coalesce(previous,''),true);
 return new;
end $$;
create trigger quota_invoice_creation after insert on invoices for each row execute function account_monthly_document();
create trigger quota_quote_creation after insert on quotes for each row execute function account_monthly_document();

-- The proxy calls this once per authenticated business API request. Personal
-- account, billing, support and authentication remain usable after exhaustion.
create function consume_organization_api_request() returns boolean language plpgsql security definer
set search_path=pg_catalog,public as $$
declare org uuid:=nullif(current_setting('app.organization_id',true),'')::uuid;
 maximum bigint; actual bigint; month text:=to_char(now() at time zone 'Europe/Zurich','YYYY-MM');
begin
 if not exists(select 1 from public.organization_memberships where organization_id=org
  and user_id=current_setting('app.user_id',true) and status='active') then raise exception 'Active tenant membership required' using errcode='42501'; end if;
 select max_api_requests_per_month into maximum from public.organization_entitlements where organization_id=org;
 if maximum is null then return false; end if;
 insert into public.organization_quota_usage(organization_id,period) values(org,month) on conflict do nothing;
 update public.organization_quota_usage set api_requests=api_requests+1 where organization_id=org and period=month
  and api_requests<maximum returning api_requests into actual;
 return found;
end $$;
revoke all on function initialize_organization_quota(),account_organization_storage(),account_monthly_document() from public;
do $$ begin
 if exists(select 1 from pg_roles where rolname='binso_runtime') then
  grant select on organization_quota_usage to binso_runtime;
  grant execute on function consume_organization_api_request() to binso_runtime;
 end if;
end $$;
