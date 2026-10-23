-- A dependent performance snapshot, never another contract or calculation owner.
alter table contract_condition_revisions add constraint condition_revision_tenant_identity unique(organization_id,id);
create table time_price_sources(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,
 time_entry_id uuid not null,side text not null check(side in ('purchase','sale')),
 revision integer not null check(revision>0),is_current boolean not null default true,
 contract_id uuid not null,condition_revision_id uuid not null,
 time_version integer not null check(time_version>0),source_snapshot jsonb not null check(jsonb_typeof(source_snapshot)='object'),
 created_by_user_id text not null,created_at timestamptz not null default now(),
 unique(organization_id,id),unique(organization_id,time_entry_id,side,revision),
 foreign key(organization_id,time_entry_id) references time_entries(organization_id,id),
 foreign key(organization_id,contract_id) references contracts(organization_id,id),
 foreign key(organization_id,condition_revision_id) references contract_condition_revisions(organization_id,id)
);
create unique index current_time_price_source on time_price_sources(organization_id,time_entry_id,side) where is_current;
alter table time_price_sources enable row level security;
alter table time_price_sources force row level security;
create function app_time_price_access(p_time uuid,p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and m.role in ('owner','admin','finance') and u.status='active' and s.plan in ('pro','professional','enterprise')
 and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only'))
 and exists(select 1 from time_entries t where t.organization_id=m.organization_id and t.id=p_time and t.external_resource_id is not null and t.archived_at is null and t.approved and t.submitted_at is not null))
$$;
create policy time_price_read on time_price_sources for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_time_price_access(time_entry_id));
create policy time_price_insert on time_price_sources for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_time_price_access(time_entry_id,true) and created_by_user_id=current_setting('app.user_id',true));
create policy time_price_update on time_price_sources for update using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_time_price_access(time_entry_id,true)) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_time_price_access(time_entry_id,true));
create policy time_price_replay on business_idempotency_keys as restrictive for all using(operation<>'time.price.bind' or exists(select 1 from time_price_sources p where p.organization_id=business_idempotency_keys.organization_id and p.id::text=response_json#>>'{item,id}')) with check(operation<>'time.price.bind' or exists(select 1 from time_price_sources p where p.organization_id=business_idempotency_keys.organization_id and p.id::text=response_json#>>'{item,id}' and app_time_price_access(p.time_entry_id,true)));

create function protect_time_price_source() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare t time_entries%rowtype;c contracts%rowtype;r contract_condition_revisions%rowtype;expected jsonb;next_revision integer;
begin
 select * into t from time_entries where organization_id=new.organization_id and id=new.time_entry_id for update;
 if t.id is null or not app_time_price_access(t.id,true) then raise exception 'Approved external performance and financial permission required' using errcode='42501'; end if;
 if not exists(select 1 from auth_sessions a where a.id::text=current_setting('app.time_price_session',true) and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh price source confirmation required' using errcode='42501';end if;
 if exists(select 1 from invoice_line_time_entries x where x.organization_id=new.organization_id and x.time_entry_id=t.id) or t.invoiced_invoice_id is not null then raise exception 'Allocated performance price is immutable' using errcode='42501';end if;
 if tg_op='UPDATE' then
  if not old.is_current or new.is_current or (to_jsonb(new)-'is_current') is distinct from (to_jsonb(old)-'is_current') then raise exception 'Price source history is immutable' using errcode='42501';end if;
  return new;
 end if;
 if not new.is_current or new.created_by_user_id is distinct from current_setting('app.user_id',true) or new.created_at is distinct from now() or new.time_version<>t.version then raise exception 'Current confirmed performance revision required' using errcode='23514';end if;
 select coalesce(max(revision),0)+1 into next_revision from time_price_sources where organization_id=new.organization_id and time_entry_id=t.id and side=new.side;
 if new.revision<>next_revision then raise exception 'Price source revision conflict' using errcode='23514';end if;
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':commercial-contract:'||new.contract_id::text,0));
 select * into c from contracts where organization_id=new.organization_id and id=new.contract_id and is_v26_contract and archived_at is null and status='active';
 select * into r from contract_condition_revisions where organization_id=new.organization_id and id=new.condition_revision_id and contract_id=new.contract_id and status='approved';
 if c.id is null or r.id is null or r.unit<>'hour' or t.work_date<r.starts_on or (r.ends_on is not null and t.work_date>r.ends_on) or t.work_date<c.start_date or (c.end_date is not null and t.work_date>c.end_date)
  or (c.project_id is not null and c.project_id is distinct from t.project_id) or (r.resource_id is not null and r.resource_id is distinct from t.external_resource_id)
  or (new.side='purchase' and (c.customer_id is not null or c.supplier_id is distinct from t.supplier_id))
  or (new.side='sale' and (c.supplier_id is not null or c.customer_id is null or c.customer_id is distinct from t.customer_id or not t.billable))
  or exists(select 1 from contract_condition_revisions newer where newer.organization_id=r.organization_id and newer.contract_id=r.contract_id and newer.condition_id=r.condition_id and newer.status='approved' and newer.revision>r.revision)
 then raise exception 'Approved dated price does not match performance' using errcode='23514';end if;
 expected:=jsonb_build_object('contractId',c.id,'contractVersion',c.version,'billingInterval',c.billing_interval,'conditionRevisionId',r.id,'conditionId',r.condition_id,'revision',r.revision,'side',new.side,'unit',r.unit,'unitPrice',r.unit_price::text,'currency',r.currency,'taxTreatment',r.tax_treatment,'vatRate',r.vat_rate::text,'taxReason',r.tax_reason,'expensePolicy',r.expense_policy);
 if new.source_snapshot is distinct from expected then raise exception 'Price snapshot must equal the actual approved source' using errcode='23514';end if;
 return new;
end $$;
create trigger time_price_source_guard before insert or update on time_price_sources for each row execute function protect_time_price_source();
create function require_current_time_price_source() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if (select count(*) from time_price_sources where organization_id=new.organization_id and time_entry_id=new.time_entry_id and side=new.side and is_current)<>1 then raise exception 'A price source revision must retain one current snapshot' using errcode='23514';end if;
 return null;
end $$;
create constraint trigger current_time_price_source_required after insert or update on time_price_sources deferrable initially deferred for each row execute function require_current_time_price_source();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on time_price_sources to binso_runtime;end if;end $$;
