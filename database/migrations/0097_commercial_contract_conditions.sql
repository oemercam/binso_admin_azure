alter table contracts add column is_v26_contract boolean not null default false;
alter table contracts add column project_id uuid;
alter table contracts add column reviewed_by_user_id text;
alter table contracts add column reviewed_at timestamptz;
alter table contracts add constraint contract_project_tenant_fk foreign key(organization_id,project_id) references projects(organization_id,id);
create function app_commercial_access(p_customer uuid,p_supplier uuid,p_project uuid,p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and u.status='active' and s.plan in ('pro','professional','enterprise')
 and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only'))
 and ((p_write and m.role in ('owner','admin')) or (not p_write and (m.role in ('owner','admin','finance') or (p_supplier is null and p_customer is not null and (m.role='reader' or (m.role in ('manager','project_manager') and app_workforce_access(p_customer,p_project,current_date,true))))))))
$$;
create policy commercial_contract_read on contracts as restrictive for select using(not is_v26_contract or app_commercial_access(customer_id,supplier_id,project_id));
create policy commercial_contract_insert on contracts as restrictive for insert with check(not is_v26_contract or app_commercial_access(customer_id,supplier_id,project_id,true));
create policy commercial_contract_update on contracts as restrictive for update using(not is_v26_contract or app_commercial_access(customer_id,supplier_id,project_id,true)) with check(not is_v26_contract or app_commercial_access(customer_id,supplier_id,project_id,true));
create policy commercial_contract_delete on contracts as restrictive for delete using(not is_v26_contract);
create table contract_condition_revisions(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,contract_id uuid not null,
 condition_id uuid not null default gen_random_uuid(),revision integer not null default 1 check(revision>0),is_current boolean not null default true,
 resource_id uuid,starts_on date not null,ends_on date,
 unit text check(unit in ('hour','day','unit')),unit_price numeric(12,2) check(unit_price>=0),currency text check(currency in ('CHF','EUR')),
 tax_treatment text check(tax_treatment in ('taxable','exempt','out_of_scope')),vat_rate numeric(5,2) check(vat_rate between 0 and 100),tax_reason text check(length(tax_reason)<=300),
 expense_policy text check(expense_policy in ('included','excluded','separate_actual')),
 status text not null default 'draft' check(status in ('draft','approved','rejected')),
 created_by_user_id text not null,reviewed_by_user_id text,reviewed_at timestamptz,created_at timestamptz not null default now(),
 foreign key(organization_id,contract_id) references contracts(organization_id,id),
 foreign key(organization_id,resource_id) references external_resources(organization_id,id),
 unique(organization_id,contract_id,condition_id,revision),check(ends_on is null or ends_on>=starts_on),
 check((status='draft' and reviewed_by_user_id is null and reviewed_at is null) or (status<>'draft' and reviewed_by_user_id is not null and reviewed_at is not null)),
 check(status<>'approved' or (unit is not null and unit_price is not null and currency is not null and expense_policy is not null and tax_treatment is not null and vat_rate is not null and (tax_treatment='taxable' or (tax_treatment in ('exempt','out_of_scope') and vat_rate=0 and tax_reason is not null and length(btrim(tax_reason))>0))))
);
create unique index contract_condition_current on contract_condition_revisions(organization_id,contract_id,condition_id) where is_current;
create index contract_condition_effective on contract_condition_revisions(organization_id,contract_id,condition_id,revision desc) where status='approved';
alter table contract_condition_revisions enable row level security;
alter table contract_condition_revisions force row level security;
create policy contract_condition_read on contract_condition_revisions for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from contracts c where c.organization_id=contract_condition_revisions.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id)));
create policy contract_condition_insert on contract_condition_revisions for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and created_by_user_id=current_setting('app.user_id',true) and exists(select 1 from contracts c where c.organization_id=contract_condition_revisions.organization_id and c.id=contract_id and c.is_v26_contract and app_commercial_access(c.customer_id,c.supplier_id,c.project_id,true)));
create policy contract_condition_update on contract_condition_revisions for update using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from contracts c where c.organization_id=contract_condition_revisions.organization_id and c.id=contract_id and c.is_v26_contract and app_commercial_access(c.customer_id,c.supplier_id,c.project_id,true))) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from contracts c where c.organization_id=contract_condition_revisions.organization_id and c.id=contract_id and app_commercial_access(c.customer_id,c.supplier_id,c.project_id,true)));
create policy commercial_replay_scope on business_idempotency_keys as restrictive for all using(
 operation not in ('commercial_contract.create','commercial_contract.update','commercial_contract.transition','contract_condition.create','contract_condition.revise','contract_condition.review') or exists(select 1 from contracts c where c.organization_id=business_idempotency_keys.organization_id and c.id::text=response_json#>>'{contractId}' and app_commercial_access(c.customer_id,c.supplier_id,c.project_id))
) with check(
 operation not in ('commercial_contract.create','commercial_contract.update','commercial_contract.transition','contract_condition.create','contract_condition.revise','contract_condition.review') or exists(select 1 from contracts c where c.organization_id=business_idempotency_keys.organization_id and c.id::text=response_json#>>'{contractId}' and app_commercial_access(c.customer_id,c.supplier_id,c.project_id,true))
);
create function protect_commercial_contract() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='UPDATE' and new.is_v26_contract is distinct from old.is_v26_contract then raise exception 'Historical contracts cannot be reclassified' using errcode='23514';end if;
 if tg_op='UPDATE' and old.is_v26_contract and (not new.is_v26_contract or row(new.organization_id,new.id,new.external_id,new.contract_no,new.customer_id,new.supplier_id,new.project_id,new.created_by_user_id) is distinct from row(old.organization_id,old.id,old.external_id,old.contract_no,old.customer_id,old.supplier_id,old.project_id,old.created_by_user_id)) then raise exception 'Contract party and identity are immutable' using errcode='23514';end if;
 if not new.is_v26_contract then return new;end if;
 if tg_op='INSERT' and (new.status<>'draft' or new.created_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_at is not null or new.reviewed_by_user_id is not null) then raise exception 'New contracts must be drafts' using errcode='23514';end if;
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':commercial-contract:'||new.id::text,0));
 if new.project_id is not null and not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.archived_at is null and (new.customer_id is null or p.customer_id=new.customer_id)) then raise exception 'Contract project belongs to another customer or tenant' using errcode='23514';end if;
 if new.end_date is not null and new.end_date<new.start_date then raise exception 'Invalid contract period' using errcode='23514';end if;
 if tg_op='UPDATE' then
  if not (new.status='active' and old.status<>'active') and row(new.reviewed_at,new.reviewed_by_user_id) is distinct from row(old.reviewed_at,old.reviewed_by_user_id) then raise exception 'Contract review evidence is immutable' using errcode='23514';end if;
  if old.status<>'draft' and (to_jsonb(new)-'status'-'reviewed_by_user_id'-'reviewed_at'-'version'-'updated_at') is distinct from (to_jsonb(old)-'status'-'reviewed_by_user_id'-'reviewed_at'-'version'-'updated_at') then raise exception 'Released contract metadata is immutable' using errcode='23514';end if;
  if new.status is distinct from old.status and not ((old.status='draft' and new.status in ('active','cancelled')) or (old.status='active' and new.status in ('paused','ended','cancelled')) or (old.status='paused' and new.status in ('active','ended','cancelled'))) then raise exception 'Invalid contract transition' using errcode='23514';end if;
  if new.status='active' and old.status<>'active' then
   if new.reviewed_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_by_user_id=new.created_by_user_id or new.reviewed_at is null or new.reviewed_at>now() then raise exception 'Independent contract review required' using errcode='42501';end if;
   if not exists(select 1 from auth_sessions a where a.id::text=current_setting('app.contract_review_session',true) and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh contract review proof required' using errcode='42501';end if;
   if not exists(select 1 from contract_condition_revisions r where r.organization_id=new.organization_id and r.contract_id=new.id and r.status='approved') then raise exception 'Approved conditions required' using errcode='23514';end if;
  end if;
 end if;
 return new;
end $$;
create trigger commercial_contract_guard before insert or update on contracts for each row execute function protect_commercial_contract();
create function protect_contract_condition() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare parent contracts%rowtype;previous contract_condition_revisions%rowtype;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':commercial-contract:'||new.contract_id::text,0));
 select * into parent from contracts where organization_id=new.organization_id and id=new.contract_id and is_v26_contract and archived_at is null;
 if parent.id is null or parent.status not in ('draft','active','paused') then raise exception 'Editable contract required' using errcode='23514';end if;
 if tg_op='UPDATE' then
  if old.status='draft' and old.is_current and not new.is_current and (to_jsonb(new)-'is_current')=(to_jsonb(old)-'is_current') then return new;end if;
  if old.status in ('approved','rejected') and old.is_current and not new.is_current and (to_jsonb(new)-'is_current')=(to_jsonb(old)-'is_current') then return new;end if;
  if old.status<>'draft' or not old.is_current or not new.is_current or new.status not in ('approved','rejected') or (to_jsonb(new)-'status'-'reviewed_by_user_id'-'reviewed_at') is distinct from (to_jsonb(old)-'status'-'reviewed_by_user_id'-'reviewed_at') then raise exception 'Condition revision inputs are immutable' using errcode='23514';end if;
  if new.reviewed_by_user_id is distinct from current_setting('app.user_id',true) or new.reviewed_by_user_id=new.created_by_user_id or new.reviewed_at is null or new.reviewed_at>now() then raise exception 'Independent condition review required' using errcode='42501';end if;
  if not exists(select 1 from auth_sessions a where a.id::text=current_setting('app.contract_review_session',true) and a.organization_id=new.organization_id and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now()) then raise exception 'Fresh condition review proof required' using errcode='42501';end if;
 else
  select * into previous from contract_condition_revisions where organization_id=new.organization_id and contract_id=new.contract_id and condition_id=new.condition_id order by revision desc limit 1;
  if not new.is_current or new.status<>'draft' or new.revision<>coalesce(previous.revision+1,1) or previous.is_current or (previous.id is not null and new.resource_id is distinct from previous.resource_id) then raise exception 'Condition revision conflict' using errcode='23514';end if;
 end if;
 if new.starts_on<parent.start_date or (parent.end_date is not null and (new.ends_on is null or new.ends_on>parent.end_date)) then raise exception 'Condition period exceeds contract' using errcode='23514';end if;
 if new.resource_id is not null and (parent.supplier_id is null and parent.project_id is null or not exists(select 1 from external_resources r where r.organization_id=new.organization_id and r.id=new.resource_id and r.active and (parent.supplier_id is null or r.supplier_id=parent.supplier_id))) then raise exception 'Contract resource supplier mismatch' using errcode='23514';end if;
 if new.status='approved' and exists(select 1 from (select distinct on (condition_id) * from contract_condition_revisions where organization_id=new.organization_id and contract_id=new.contract_id and status='approved' and condition_id<>new.condition_id order by condition_id,revision desc) r where r.resource_id is not distinct from new.resource_id and daterange(r.starts_on,r.ends_on,'[]')&&daterange(new.starts_on,new.ends_on,'[]')) then raise exception 'Approved contract conditions overlap' using errcode='23514',constraint='contract_condition_no_overlap';end if;
 return new;
end $$;
create trigger contract_condition_guard before insert or update on contract_condition_revisions for each row execute function protect_contract_condition();
create function bump_condition_contract_version() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 update contracts set updated_at=now() where organization_id=new.organization_id and id=new.contract_id;
 return new;
end $$;
create trigger contract_condition_parent_version after insert or update on contract_condition_revisions for each row execute function bump_condition_contract_version();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update on contract_condition_revisions to binso_runtime;end if;end $$;
