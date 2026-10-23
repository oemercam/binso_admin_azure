-- Reviewed AP revisions remain dependent on the original invoice/time/file owners.
alter table supplier_invoices add column v26_review_id uuid;
create table supplier_invoice_reviews(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,invoice_id uuid not null,
 invoice_version integer not null check(invoice_version>0),policy_revision integer not null check(policy_revision>0),
 match_id uuid,decision text not null check(decision in ('approve','query')),note text not null default '' check(length(note)<=2000 and (decision<>'query' or length(btrim(note))>=10)),
 policy_snapshot jsonb not null default '{}',created_by_user_id text not null,created_at timestamptz not null default now(),
 unique(organization_id,id),foreign key(organization_id,invoice_id) references supplier_invoices(organization_id,id),
 foreign key(organization_id,match_id) references supplier_invoice_matches(organization_id,id),check((decision='approve')=(match_id is not null)));
alter table supplier_invoices add constraint supplier_invoice_review_tenant_fk foreign key(organization_id,v26_review_id) references supplier_invoice_reviews(organization_id,id);
create table supplier_invoice_review_sources(
 organization_id uuid not null,review_id uuid not null,time_entry_id uuid not null,price_source_id uuid not null,
 primary key(organization_id,time_entry_id),foreign key(organization_id,review_id) references supplier_invoice_reviews(organization_id,id),
 foreign key(organization_id,time_entry_id) references time_entries(organization_id,id),foreign key(organization_id,price_source_id) references time_price_sources(organization_id,id));
alter table supplier_invoice_reviews enable row level security;alter table supplier_invoice_reviews force row level security;
alter table supplier_invoice_review_sources enable row level security;alter table supplier_invoice_review_sources force row level security;
create policy ap_review_read on supplier_invoice_reviews for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access());
create policy ap_review_insert on supplier_invoice_reviews for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access(true));
create policy ap_review_source_read on supplier_invoice_review_sources for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access());
create policy ap_review_source_insert on supplier_invoice_review_sources for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access(true));
create policy ap_review_replay on business_idempotency_keys as restrictive for all using(operation<>'supplier_invoice.review' or app_ap_match_access()) with check(operation<>'supplier_invoice.review' or app_ap_match_access(true));
create function app_ap_review_write() returns boolean language sql stable set search_path=pg_catalog,public as $$
 select app_ap_match_access(true) and exists(select 1 from auth_sessions a where a.id::text=current_setting('app.ap_review_session',true) and a.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and a.user_id=current_setting('app.user_id',true) and a.expires_at>now() and a.step_up_at>now()-interval '5 minutes' and a.step_up_at<=now())
$$;
-- Active membership count (solo/four-eyes) shares the review's company mutex.
create function serialize_ap_membership_change() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op='DELETE' then perform id from organizations where id=old.organization_id for update;return old;
 else perform id from organizations where id=new.organization_id for update;return new;end if;
end $$;
create trigger ap_membership_mutex before insert or update or delete on organization_memberships for each row execute function serialize_ap_membership_change();
create function protect_supplier_invoice_review() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare i supplier_invoices%rowtype;m supplier_invoice_matches%rowtype;o organizations%rowtype;facts jsonb;first_price jsonb;minutes integer;net numeric;tax numeric;cap numeric;solo boolean;
begin
 if tg_op<>'INSERT' or not app_ap_review_write() or new.created_by_user_id is distinct from current_setting('app.user_id',true) then raise exception 'Fresh current AP reviewer required' using errcode='42501';end if;
 perform require_minute_write_isolation();
 select * into o from organizations where id=new.organization_id for update;
 perform user_id from organization_memberships where organization_id=new.organization_id and user_id=current_setting('app.user_id',true) for share;
 perform id from auth_sessions where id::text=current_setting('app.ap_review_session',true) for key share;
 if not app_ap_review_write() then raise exception 'Current AP authorization changed' using errcode='42501';end if;
 select * into i from supplier_invoices where organization_id=new.organization_id and id=new.invoice_id and archived_at is null for update;
 if i.id is null or i.status<>'draft' or i.version<>new.invoice_version or o.ap_policy_revision<>new.policy_revision then raise exception 'Current AP draft and policy revision required' using errcode='40001';end if;
 if new.decision='approve' then
  if exists(select 1 from supplier_invoice_reviews q where q.organization_id=new.organization_id and q.invoice_id=i.id and q.invoice_version=i.version and q.decision='query') then raise exception 'Open AP inquiry requires a corrected draft revision' using errcode='40001';end if;
  select * into m from supplier_invoice_matches where organization_id=new.organization_id and id=new.match_id and invoice_id=i.id and invoice_version=i.version;
  if m.id is null then raise exception 'Current AP comparison required' using errcode='23514';end if;
  perform t.id from time_entries t join time_price_sources p on p.organization_id=t.organization_id and p.time_entry_id=t.id where t.organization_id=new.organization_id and p.id=any(m.price_source_ids) order by t.id for update of t;
  perform id from file_objects where organization_id=new.organization_id and supplier_invoice_id=i.id and archived_at is null order by id for share;
  facts:=supplier_invoice_match_input(i.id,i.version,m.period_start,m.period_end,m.reported_minutes,m.reported_unit_price,m.price_source_ids);
  if facts is null or facts is distinct from m.input_snapshot then raise exception 'AP comparison facts changed' using errcode='40001';end if;
  first_price:=facts#>'{sources,0,price}';
  if first_price is null or exists(select 1 from jsonb_array_elements(facts->'sources') s where s#>>'{price,contractId}' is distinct from first_price->>'contractId' or s#>>'{price,currency}' is distinct from first_price->>'currency' or s#>>'{price,unitPrice}' is distinct from first_price->>'unitPrice' or s#>>'{price,vatRate}' is distinct from first_price->>'vatRate' or s#>>'{price,taxTreatment}' is distinct from first_price->>'taxTreatment') then raise exception 'One confirmed AP condition group required' using errcode='23514';end if;
  -- Defensive numeric invariants only; the existing document engine owns the calculation.
  select sum((s->>'minutes')::integer),sum((s->>'minutes')::numeric*(s#>>'{price,unitPrice}')::numeric/60) into minutes,net from jsonb_array_elements(facts->'sources') s;
  tax:=case when first_price->>'taxTreatment'='taxable' then round(net*(first_price->>'vatRate')::numeric/100,2) else 0 end;
  if m.reported_minutes<>minutes or m.reported_unit_price<>(first_price->>'unitPrice')::numeric or i.currency is distinct from first_price->>'currency' or i.net_amount is distinct from round(net,2) or i.vat_amount is distinct from tax or i.total_amount is distinct from round(net,2)+tax or nullif(btrim(i.supplier_invoice_no),'') is null or i.invoice_date is null or i.due_date is null or jsonb_array_length(facts->'receipts')=0 or exists(select 1 from jsonb_array_elements(facts->'receipts') f where f->>'scanStatus' is distinct from 'clean') then raise exception 'Unresolved AP differences block approval' using errcode='23514';end if;
  solo:=app_workforce_role()='owner' and (select count(*) from organization_memberships mm where mm.organization_id=new.organization_id and mm.status='active')=1;
  if (o.ap_approval_policy->>'fourEyes')::boolean and not solo and current_setting('app.user_id',true) in (i.created_by_user_id,m.created_by_user_id) then raise exception 'Independent AP reviewer required' using errcode='42501';end if;
  cap:=(o.ap_approval_policy#>>array['limits',app_workforce_role()||'_'||i.currency])::numeric;
  if cap is not null and i.total_amount>cap then raise exception 'AP approval amount limit exceeded' using errcode='42501';end if;
  if exists(select 1 from supplier_invoice_review_sources x where x.organization_id=new.organization_id and x.time_entry_id in(select (s->>'timeEntryId')::uuid from jsonb_array_elements(facts->'sources') s)) then raise exception 'AP performance already approved elsewhere' using errcode='23505';end if;
 end if;
 new.policy_snapshot:=o.ap_approval_policy;new.created_at:=clock_timestamp();return new;
end $$;
create trigger ap_review_guard before insert or update or delete on supplier_invoice_reviews for each row execute function protect_supplier_invoice_review();
create function protect_ap_review_source() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_op<>'INSERT' or not app_ap_review_write() or not exists(select 1 from supplier_invoice_reviews r join supplier_invoice_matches m on m.organization_id=r.organization_id and m.id=r.match_id, jsonb_array_elements(m.input_snapshot->'sources') s where r.organization_id=new.organization_id and r.id=new.review_id and r.decision='approve' and r.created_by_user_id=current_setting('app.user_id',true) and s->>'timeEntryId'=new.time_entry_id::text and s->>'priceSourceId'=new.price_source_id::text) then raise exception 'Immutable AP allocation requires its reviewed source' using errcode='42501';end if;return new;
end $$;
create trigger ap_review_source_guard before insert or update or delete on supplier_invoice_review_sources for each row execute function protect_ap_review_source();
create function require_complete_ap_review() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if new.decision='approve' and (not exists(select 1 from supplier_invoices i where i.organization_id=new.organization_id and i.id=new.invoice_id and i.v26_review_id=new.id and i.status='open') or (select count(*) from supplier_invoice_review_sources x where x.organization_id=new.organization_id and x.review_id=new.id)<>(select cardinality(price_source_ids) from supplier_invoice_matches where organization_id=new.organization_id and id=new.match_id)) then raise exception 'AP approval and all source allocations must commit atomically' using errcode='23514';end if;return null;
end $$;
create constraint trigger ap_review_complete after insert on supplier_invoice_reviews deferrable initially deferred for each row execute function require_complete_ap_review();
-- Preserve the original draft identity/duplicate guard, adding exactly one controlled transition.
create or replace function protect_supplier_invoice_draft() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare reference_key text;
begin
 if tg_op='UPDATE' and old.v26_review_id is not null and (to_jsonb(new)-array['updated_at','version']) is distinct from (to_jsonb(old)-array['updated_at','version']) then raise exception 'Reviewed AP revision is immutable' using errcode='42501';end if;
 if tg_op='INSERT' and new.v26_review_id is not null then raise exception 'New invoice cannot fabricate a review' using errcode='23514';end if;
 if tg_op='UPDATE' and new.v26_review_id is distinct from old.v26_review_id then
  if old.status<>'draft' or new.status<>'open' or not app_ap_review_write() or not exists(select 1 from supplier_invoice_reviews r where r.organization_id=new.organization_id and r.id=new.v26_review_id and r.invoice_id=old.id and r.invoice_version=old.version and r.decision='approve' and r.created_by_user_id=current_setting('app.user_id',true)) or (to_jsonb(new)-array['v26_review_id','status','updated_at','version']) is distinct from (to_jsonb(old)-array['v26_review_id','status','updated_at','version']) then raise exception 'AP transition requires the exact reviewed draft' using errcode='42501';end if;
 elsif tg_op='UPDATE' and old.status='draft' and new.status is distinct from old.status then raise exception 'AP status requires a qualified review' using errcode='23514';end if;
 if new.status='draft' or (tg_op='UPDATE' and old.status='draft') then
  if app_workforce_role() not in ('owner','admin','finance','demo_template') and not exists(select 1 from pg_roles where rolname=current_user and (rolsuper or rolbypassrls)) then raise exception 'Purchasing membership required' using errcode='42501';end if;
  if tg_op='UPDATE' and row(new.supplier_id,new.organization_id,new.created_by_user_id) is distinct from row(old.supplier_id,old.organization_id,old.created_by_user_id) then raise exception 'Draft identity is immutable' using errcode='23514';end if;
  reference_key:=nullif(upper(btrim(new.supplier_invoice_no)),'');
  if reference_key is not null then perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||':ap-reference:'||new.supplier_id::text||':'||reference_key,0));
   if exists(select 1 from supplier_invoices i where i.organization_id=new.organization_id and i.supplier_id=new.supplier_id and i.id<>new.id and i.archived_at is null and upper(btrim(i.supplier_invoice_no))=reference_key) then raise exception 'Supplier invoice reference already exists' using errcode='23505';end if;
  end if;
 end if;return new;
end $$;
create function protect_ap_purchase_price() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 perform id from time_entries where organization_id=new.organization_id and id=new.time_entry_id for update;
 perform require_minute_write_isolation();
 if new.side='purchase' and exists(select 1 from supplier_invoice_review_sources x where x.organization_id=new.organization_id and x.time_entry_id=new.time_entry_id) then raise exception 'Approved AP purchase price is immutable' using errcode='42501';end if;return new;
end $$;
create trigger ap_purchase_price_guard before insert or update on time_price_sources for each row execute function protect_ap_purchase_price();
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert on supplier_invoice_reviews,supplier_invoice_review_sources to binso_runtime;end if;end $$;
