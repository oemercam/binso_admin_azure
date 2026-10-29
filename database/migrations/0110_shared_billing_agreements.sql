-- V8 local implementation. No historical agreement or repricing is inferred.
create function billing_amount_valid(v jsonb) returns boolean language sql immutable set search_path=pg_catalog,public,pg_temp as $$select coalesce(v='null'::jsonb or (jsonb_typeof(v)='string' and v#>>'{}' ~ '^(0|[1-9][0-9]{0,8})(\.[0-9]{1,2})?$'),false)$$;
create function billing_terms_valid(v jsonb) returns boolean language plpgsql immutable set search_path=pg_catalog,public,pg_temp as $$
declare model text;allowed text[];m jsonb;start_date date;end_date date;
begin
 if jsonb_typeof(v) is distinct from 'object' or v->'revision' is distinct from '1'::jsonb or v->>'currency' not in ('CHF','EUR') or jsonb_typeof(v->'currency') is distinct from 'string' then return false;end if;
 model=v->>'model';if model is null or model not in ('fixed','time','quantity','mixed','recurring','milestone') then return false;end if;
 allowed=array['revision','currency','model'];
 if model in ('time','mixed') and v?'hourlyRate' then allowed=allowed||'hourlyRate'::text;if not billing_amount_valid(v->'hourlyRate') then return false;end if;end if;
 if model in ('fixed','mixed','recurring') then allowed=allowed||'amount'::text;if not billing_amount_valid(v->'amount') then return false;end if;end if;
 if model='mixed' then allowed=allowed||array['additionalTime','quantity'];if jsonb_typeof(v->'additionalTime') is distinct from 'boolean' or jsonb_typeof(v->'quantity') is distinct from 'boolean' then return false;end if;end if;
 if model='recurring' then
  allowed=allowed||array['startsOn','endsOn','intervalMonths'];if v->'intervalMonths' is null or v->'intervalMonths' not in ('1'::jsonb,'3'::jsonb,'12'::jsonb) or not(v?'startsOn' and v?'endsOn') then return false;end if;
  if v->>'startsOn' is not null then start_date=(v->>'startsOn')::date;if to_char(start_date,'YYYY-MM-DD')<>v->>'startsOn' or start_date<'1900-01-01' or start_date>'9998-12-31' then return false;end if;end if;
  if v->>'endsOn' is not null then end_date=(v->>'endsOn')::date;if start_date is null or to_char(end_date,'YYYY-MM-DD')<>v->>'endsOn' or end_date<start_date or end_date>'9998-12-31' then return false;end if;end if;
 end if;
 if model='milestone' then
  allowed=allowed||'milestones'::text;if jsonb_typeof(v->'milestones') is distinct from 'array' or jsonb_array_length(v->'milestones')>100 then return false;end if;
  for m in select * from jsonb_array_elements(v->'milestones') loop
   if jsonb_typeof(m) is distinct from 'object' or exists(select 1 from jsonb_object_keys(m) k where k not in ('id','label','amount','completed')) or jsonb_typeof(m->'id') is distinct from 'string' or coalesce(m->>'id','')!~'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(m->'label') is distinct from 'string' or length(m->>'label')>200 or m->>'label' ~ '[[:cntrl:]]' or jsonb_typeof(m->'completed') is distinct from 'boolean' or not billing_amount_valid(m->'amount') then return false;end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(v->'milestones') as entry(value) group by value->>'id' having count(*)>1) then return false;end if;
 end if;
 return not exists(select 1 from jsonb_object_keys(v) k where not k=any(allowed));
exception when others then return false;
end $$;
create function billing_terms_ready(v jsonb) returns boolean language sql immutable set search_path=pg_catalog,public,pg_temp as $$
 select billing_terms_valid(v) and case v->>'model'
 when 'fixed' then v->>'amount' is not null
 when 'recurring' then v->>'amount' is not null and v->>'startsOn' is not null
 when 'time' then not(v?'hourlyRate') or v->>'hourlyRate' is not null
 when 'mixed' then (not(v?'hourlyRate') or v->>'additionalTime'<>'true' or v->>'hourlyRate' is not null) and ((v->>'amount' is not null)::integer+(v->>'additionalTime'='true')::integer+(v->>'quantity'='true')::integer)>=2
 when 'milestone' then jsonb_array_length(v->'milestones')>0 and not exists(select 1 from jsonb_array_elements(v->'milestones') m where btrim(m->>'label')='' or m->>'amount' is null)
 else true end
$$;
create table billing_agreements(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 customer_id uuid,
 scope_kind text not null check(scope_kind in ('quote','invoice','project')),
 scope_id uuid not null,
 currency text not null check(currency in ('CHF','EUR')),
 terms jsonb not null check(billing_terms_valid(terms) and terms->>'currency'=currency),
 commercial_snapshot jsonb,
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 foreign key(organization_id,customer_id) references customers(organization_id,id) deferrable initially deferred
);
create function app_billing_actor(p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public,pg_temp as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and u.status='active' and (o.status in ('active','trial','grace_period') or (not p_write and o.status='read_only')))
$$;
alter table billing_agreements enable row level security;
alter table billing_agreements force row level security;
create policy billing_agreement_read on billing_agreements for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_workforce_role() in ('owner','admin','finance','reader','manager','project_manager') and (app_workforce_role() in ('owner','admin','finance','reader') or (scope_kind='project' and app_workforce_access(customer_id,scope_id)) or (scope_kind='quote' and exists(select 1 from quotes q where q.organization_id=billing_agreements.organization_id and q.id=scope_id and q.archived_at is null)) or (scope_kind='invoice' and exists(select 1 from invoices i where i.organization_id=billing_agreements.organization_id and i.id=scope_id and i.archived_at is null))) and app_billing_actor());
create policy billing_agreement_insert on billing_agreements for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and created_by_user_id=current_setting('app.user_id',true) and app_workforce_role() in ('owner','admin','finance','manager','project_manager') and (customer_id is null or exists(select 1 from customers c where c.organization_id=billing_agreements.organization_id and c.id=customer_id and c.archived_at is null)) and exists(select 1 from organizations o where o.id=organization_id and o.status in ('active','trial','grace_period')));
alter table quotes add column billing_agreement_id uuid;
alter table projects add column billing_agreement_id uuid;
alter table invoices add column billing_agreement_id uuid;
alter table invoices add column billing_context jsonb;
alter table invoices add column billing_issued boolean not null default false;
drop index invoice_source_quote_once;
create unique index invoice_source_quote_once on invoices(organization_id,source_quote_id) where source_quote_id is not null and archived_at is null and status<>'cancelled' and billing_agreement_id is null;
alter table quotes add constraint quote_billing_agreement_fk foreign key(organization_id,billing_agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred;
alter table projects add constraint project_billing_agreement_fk foreign key(organization_id,billing_agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred;
alter table invoices add constraint invoice_billing_agreement_fk foreign key(organization_id,billing_agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred;
create index invoice_billing_agreement on invoices(organization_id,billing_agreement_id) where billing_agreement_id is not null;
alter table invoice_lines add column billing_part text check(billing_part in ('fixed','time','quantity'));
alter table quote_lines add column billing_part text check(billing_part in ('fixed','time','quantity'));
alter table invoice_lines add column billing_source_position integer check(billing_source_position between 1 and 100);
alter table time_entries add column billing_agreement_id uuid;
alter table time_entries add column billing_source_position integer check(billing_source_position between 1 and 100);
alter table time_entries add constraint time_billing_agreement_fk foreign key(organization_id,billing_agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred;

create table billing_milestone_completions(
 organization_id uuid not null references organizations(id) on delete cascade,
 agreement_id uuid not null,
 milestone_id uuid not null,
 completed_by_user_id text not null,
 completed_at timestamptz not null default now(),
 primary key(organization_id,agreement_id,milestone_id),
 foreign key(organization_id,agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred
);
alter table billing_milestone_completions enable row level security;
alter table billing_milestone_completions force row level security;
create policy billing_completion_read on billing_milestone_completions for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from billing_agreements a where a.organization_id=billing_milestone_completions.organization_id and a.id=agreement_id));
create policy billing_completion_insert on billing_milestone_completions for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and completed_by_user_id=current_setting('app.user_id',true) and app_workforce_role() in ('owner','admin','manager','project_manager') and exists(select 1 from projects p join billing_agreements a on a.organization_id=p.organization_id and a.id=p.billing_agreement_id where p.organization_id=billing_milestone_completions.organization_id and a.id=agreement_id and p.archived_at is null and exists(select 1 from jsonb_array_elements(a.terms->'milestones') m where m->>'id'=milestone_id::text)) and exists(select 1 from organizations o where o.id=organization_id and o.status in ('active','trial','grace_period')));
create table billing_closures(
 organization_id uuid not null references organizations(id) on delete cascade,
 agreement_id uuid not null,
 invoice_id uuid not null,
 closed_at timestamptz not null default now(),
 primary key(organization_id,agreement_id),
 foreign key(organization_id,agreement_id) references billing_agreements(organization_id,id) deferrable initially deferred,
 foreign key(organization_id,invoice_id) references invoices(organization_id,id) deferrable initially deferred
);
alter table billing_closures enable row level security;
alter table billing_closures force row level security;
create policy billing_closure_read on billing_closures for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and exists(select 1 from projects p where p.organization_id=billing_closures.organization_id and p.billing_agreement_id=agreement_id));
create policy billing_closure_insert on billing_closures for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance') and exists(select 1 from invoices i where i.organization_id=billing_closures.organization_id and i.id=invoice_id and i.billing_agreement_id=agreement_id and i.billing_issued and i.billing_context->>'procedure'='final'));

create function protect_billing_agreement() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op='DELETE' and pg_trigger_depth()>1 and not exists(select 1 from organizations where id=old.organization_id) then return old;end if;
 raise exception 'Billing agreements are immutable' using errcode='23514';end $$;
create trigger billing_agreement_immutable before update or delete on billing_agreements for each row execute function protect_billing_agreement();
create trigger billing_completion_immutable before update or delete on billing_milestone_completions for each row execute function protect_billing_agreement();
create trigger billing_closure_immutable before update or delete on billing_closures for each row execute function protect_billing_agreement();

create function protect_billing_root() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare a billing_agreements; linked uuid;expected numeric;changing boolean;actor text;quote_line quote_lines;snapshot_line jsonb;
begin
 changing=tg_op='INSERT' and new.billing_agreement_id is not null;
 if tg_op='UPDATE' then
  changing=new.billing_agreement_id is distinct from old.billing_agreement_id;
  if old.billing_agreement_id is not null and new.billing_agreement_id is null then raise exception 'An agreed model cannot be removed' using errcode='23514';end if;
  if tg_table_name='invoices' then changing=changing or new.billing_context is distinct from old.billing_context;end if;
 end if;
 if changing then
  actor=app_workforce_role();
  if app_member_module_profile()<>'standard' or (tg_table_name='invoices' and actor not in ('owner','admin','finance')) or (tg_table_name<>'invoices' and actor not in ('owner','admin','manager','project_manager')) or not exists(select 1 from organizations o join organization_memberships m on m.organization_id=o.id join app_users u on u.id=m.user_id where o.id=new.organization_id and o.status in ('active','trial','grace_period') and m.user_id=current_setting('app.user_id',true) and m.status='active' and u.status='active') then raise exception 'Billing model write denied' using errcode='42501';end if;
 end if;
 if tg_op='UPDATE' and new.billing_agreement_id is distinct from old.billing_agreement_id then
  if tg_table_name='quotes' then if old.status<>'draft' then raise exception 'Agreed quote is immutable' using errcode='23514';end if;
  elsif tg_table_name='invoices' then if old.status<>'draft' or old.project_id is not null or old.source_quote_id is not null or exists(select 1 from invoices other where other.organization_id=old.organization_id and other.billing_agreement_id=old.billing_agreement_id and other.id<>old.id) then raise exception 'Agreed invoice source is immutable' using errcode='23514';end if;
  elsif tg_table_name='projects' then if old.status<>'planned' or exists(select 1 from invoices other where other.organization_id=old.organization_id and other.billing_agreement_id=old.billing_agreement_id) then raise exception 'Agreed project source is immutable' using errcode='23514';end if;
  end if;
 end if;
 if new.billing_agreement_id is not null then
  select * into a from billing_agreements where organization_id=new.organization_id and id=new.billing_agreement_id;
  if not found or a.customer_id is distinct from new.customer_id then raise exception 'Billing customer mismatch' using errcode='23514';end if;
  if tg_table_name='quotes' and (a.scope_kind<>'quote' or a.scope_id<>new.id) then raise exception 'Quote agreement scope mismatch' using errcode='23514';end if;
  if tg_table_name='projects' then
   if a.scope_kind='project' and a.scope_id<>new.id then raise exception 'Project agreement scope mismatch' using errcode='23514';end if;
   if a.scope_kind='quote' then new.source_quote_id=a.scope_id;end if;
  end if;
  if tg_table_name='invoices' then
   if a.scope_kind='quote' then new.source_quote_id=a.scope_id;end if;
   if a.scope_kind='project' then new.project_id=a.scope_id;end if;
   if a.scope_kind='invoice' and a.scope_id<>new.id and (new.project_id is null or not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.billing_agreement_id=a.id)) then raise exception 'Direct invoice agreement scope mismatch' using errcode='23514';end if;
  end if;
  if tg_table_name<>'projects' then if a.currency<>new.currency then raise exception 'Billing currency mismatch' using errcode='23514';end if;end if;
  if (tg_table_name='projects' and new.status<>'planned') or (tg_table_name<>'projects' and new.status not in ('draft','cancelled')) then
   if not billing_terms_ready(a.terms) then raise exception 'Agreement incomplete' using errcode='23514';end if;
  end if;
  if tg_table_name='quotes' and new.status<>'draft' then
   if a.commercial_snapshot is not null then
    if (a.commercial_snapshot->'calculation')-'documentVersion' is distinct from new.calculation-'documentVersion' then raise exception 'Quote calculation snapshot mismatch' using errcode='23514';end if;
    for quote_line in select * from quote_lines where organization_id=new.organization_id and quote_id=new.id loop
     snapshot_line=a.commercial_snapshot->'items'->(quote_line.sort_order-1);
     if snapshot_line is null or quote_line.quantity is distinct from (snapshot_line->>'quantity')::numeric or quote_line.unit_price is distinct from (snapshot_line->>'unit_price')::numeric or quote_line.vat_rate is distinct from (snapshot_line->>'vat_rate')::numeric or quote_line.unit is distinct from snapshot_line->>'unit' then raise exception 'Quote price snapshot mismatch' using errcode='23514';end if;
     if quote_line.billing_part is null or (a.terms->>'model' in ('fixed','recurring','milestone') and quote_line.billing_part<>'fixed') or (a.terms->>'model'='time' and quote_line.billing_part<>'time') or (a.terms->>'model'='quantity' and quote_line.billing_part<>'quantity') or (a.terms->>'model'='mixed' and ((quote_line.billing_part='time' and a.terms->>'additionalTime'<>'true') or (quote_line.billing_part='quantity' and a.terms->>'quantity'<>'true') or (quote_line.billing_part='fixed' and a.terms->>'amount' is null))) then raise exception 'Quoted component is outside the agreed model' using errcode='23514';end if;
     if quote_line.billing_part='time' and quote_line.unit not in ('Stunden','Stunde','h','Std.') then raise exception 'Hourly services require an hourly unit' using errcode='23514';end if;
    end loop;
   end if;
   expected=case when a.terms->>'model' in ('fixed','recurring') then (a.terms->>'amount')::numeric when a.terms->>'model'='milestone' then (select sum((m->>'amount')::numeric) from jsonb_array_elements(a.terms->'milestones') m) else null end;
   if expected is not null and expected is distinct from (new.calculation->>'subtotal')::numeric then raise exception 'Agreed net amount must match the canonical quote calculation' using errcode='23514';end if;
   if a.terms->>'model'='milestone' and (jsonb_array_length(a.terms->'milestones')<>jsonb_array_length(new.calculation->'lines') or exists(select 1 from jsonb_array_elements(a.terms->'milestones') with ordinality m(value,n) where (value->>'amount')::numeric is distinct from (new.calculation->'lines'->(m.n::integer-1)->>'net')::numeric)) then raise exception 'Each milestone needs its matching priced quote position' using errcode='23514';end if;
   if a.terms->>'model'='mixed' and a.terms->>'amount' is not null then select coalesce(sum((entry->>'net')::numeric),0) into expected from jsonb_array_elements(new.calculation->'lines') with ordinality x(entry,n) join quote_lines q on q.organization_id=new.organization_id and q.quote_id=new.id and q.sort_order=x.n where q.billing_part='fixed';if expected<>(a.terms->>'amount')::numeric then raise exception 'Mixed fixed component must match the canonical quote calculation' using errcode='23514';end if;end if;
  end if;
 end if;
 if tg_table_name='invoices' then
  if tg_op='UPDATE' then
   if old.billing_issued and (not new.billing_issued or new.billing_context is distinct from old.billing_context) then raise exception 'Issued billing facts are immutable' using errcode='23514';end if;
  end if;
  if new.billing_agreement_id is not null and new.status not in ('draft','cancelled') then new.billing_issued=true;end if;
  if new.project_id is not null then select billing_agreement_id into linked from projects where organization_id=new.organization_id and id=new.project_id;if linked is not null and linked is distinct from new.billing_agreement_id then raise exception 'Project agreement must be inherited' using errcode='23514';end if;end if;
  if new.source_quote_id is not null then select billing_agreement_id into linked from quotes where organization_id=new.organization_id and id=new.source_quote_id;if linked is distinct from new.billing_agreement_id then raise exception 'Quote agreement must be inherited' using errcode='23514';end if;end if;
 end if;
 if tg_table_name='projects' then if new.source_quote_id is not null then select billing_agreement_id into linked from quotes where organization_id=new.organization_id and id=new.source_quote_id;if linked is not null and linked is distinct from new.billing_agreement_id then raise exception 'Accepted quote agreement must be inherited' using errcode='23514';end if;end if;end if;
 return new;
end $$;
create trigger quote_billing_root before insert or update on quotes for each row execute function protect_billing_root();
create trigger project_billing_root before insert or update on projects for each row execute function protect_billing_root();
create trigger invoice_billing_root before insert or update on invoices for each row execute function protect_billing_root();
create function record_billing_closure() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.billing_agreement_id is not null and new.billing_issued and new.billing_context->>'procedure'='final' and exists(select 1 from billing_agreements a where a.organization_id=new.organization_id and a.id=new.billing_agreement_id and a.terms->>'model' not in ('recurring','milestone')) then insert into billing_closures(organization_id,agreement_id,invoice_id) values(new.organization_id,new.billing_agreement_id,new.id) on conflict do nothing;end if;
 return null;
end $$;
create trigger invoice_billing_closure after insert or update on invoices for each row execute function record_billing_closure();
create function protect_closed_billing_time() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.billable then
  perform 1 from projects where organization_id=new.organization_id and id=new.project_id and billing_agreement_id is not null for share;
  if found then perform require_minute_write_isolation();end if;
 end if;
 if new.billable and exists(select 1 from projects p join billing_closures closed on closed.organization_id=p.organization_id and closed.agreement_id=p.billing_agreement_id where p.organization_id=new.organization_id and p.id=new.project_id) then raise exception 'Billing agreement already closed' using errcode='23514';end if;return new;
end $$;
create trigger closed_billing_time before insert or update of project_id,billable on time_entries for each row execute function protect_closed_billing_time();

create function protect_billing_time_price() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare a billing_agreements;source jsonb;
begin
 if old.billing_agreement_id is not null and (new.billing_agreement_id is distinct from old.billing_agreement_id or new.billing_source_position is distinct from old.billing_source_position or new.sales_rate is distinct from old.sales_rate) then raise exception 'Bound time price is immutable' using errcode='23514';end if;
 if new.billing_agreement_id is not null and old.billing_agreement_id is null then
  if not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance') or new.external_resource_id is not null then raise exception 'Time price binding denied' using errcode='42501';end if;
  select b.* into a from projects p join billing_agreements b on b.organization_id=p.organization_id and b.id=p.billing_agreement_id where p.organization_id=new.organization_id and p.id=new.project_id and b.id=new.billing_agreement_id;
  if not found or a.customer_id is distinct from new.customer_id then raise exception 'Time price source mismatch' using errcode='23514';end if;
  if new.billing_source_position is not null then
   source=a.commercial_snapshot->'items'->(new.billing_source_position-1);
   if source is null or (a.terms->>'model'<>'time' and source->>'billing_part' is distinct from 'time') or new.sales_rate is distinct from (source->>'unit_price')::numeric then raise exception 'Quoted hourly price mismatch' using errcode='23514';end if;
  elsif new.sales_rate is distinct from (a.terms->>'hourlyRate')::numeric then raise exception 'Agreed hourly price mismatch' using errcode='23514';end if;
 end if;return new;
end $$;
create trigger time_billing_price before insert or update of billing_agreement_id,billing_source_position,sales_rate on time_entries for each row execute function protect_billing_time_price();

-- Enforce actual time provenance even when an older client omits billing fields.
create function protect_billing_time_source() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare a billing_agreements; parent invoices; part text;
begin
 select i.* into parent from invoices i join invoice_lines l on l.organization_id=i.organization_id and l.invoice_id=i.id where l.organization_id=new.organization_id and l.id=new.invoice_line_id;
 select billing_part into part from invoice_lines where organization_id=new.organization_id and id=new.invoice_line_id;
 select b.* into a from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id join billing_agreements b on b.organization_id=p.organization_id and b.id=p.billing_agreement_id where t.organization_id=new.organization_id and t.id=new.time_entry_id;
 if found then
  if not (a.terms->>'model'='time' or (a.terms->>'model'='mixed' and a.terms->>'additionalTime'='true')) or parent.billing_agreement_id is distinct from a.id then raise exception 'Time is included or has a different agreement' using errcode='23514';end if;
 end if;
 if parent.billing_agreement_id is not null then
  if not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance') then raise exception 'Billing source write denied' using errcode='42501';end if;
  select * into a from billing_agreements where organization_id=parent.organization_id and id=parent.billing_agreement_id;
  if part is distinct from 'time' or not (a.terms->>'model'='time' or (a.terms->>'model'='mixed' and a.terms->>'additionalTime'='true')) then raise exception 'Additional time was not agreed' using errcode='23514';end if;
 end if;
 return new;
end $$;
create trigger billing_time_source before insert or update on invoice_line_time_entries for each row execute function protect_billing_time_source();

-- A single reservation scope is shared by all quote/project/direct invoices.
-- Credits never silently restore performed-service capacity. Discarded drafts do.
create function check_billing_capacity() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare i invoices;a billing_agreements;model text;part text;used numeric;cap numeric;own_amount numeric;scope_key text;procedure text;other_final boolean;period_index integer;period_start date;period_end date;source_line invoice_lines;source jsonb;
begin
 select * into i from invoices where organization_id=new.organization_id and id=new.id;
 if i.billing_agreement_id is null then return null;end if;
 perform require_minute_write_isolation();
 perform pg_advisory_xact_lock(hashtextextended(i.organization_id::text||i.billing_agreement_id::text,0));
 select * into a from billing_agreements where organization_id=i.organization_id and id=i.billing_agreement_id;
 if not found then raise exception 'Billing agreement unavailable' using errcode='23514';end if;
 model=a.terms->>'model';
 if not billing_terms_ready(a.terms) then if i.status='draft' then return null;else raise exception 'Agreement incomplete' using errcode='23514';end if;end if;
 procedure=coalesce(i.billing_context->>'procedure','standard');
 if procedure not in ('standard','advance','partial','final') or i.billing_context is null or jsonb_typeof(i.billing_context)<>'object' then raise exception 'Billing context required' using errcode='23514';end if;
 if (i.status='cancelled' or i.archived_at is not null) and not i.billing_issued then return null;end if;
 if not exists(select 1 from invoice_lines where organization_id=i.organization_id and invoice_id=i.id) then raise exception 'Billing positions required' using errcode='23514';end if;
 for part in select billing_part from invoice_lines where organization_id=i.organization_id and invoice_id=i.id loop
  if part is null or (model in ('fixed','recurring','milestone') and part<>'fixed') or (model='time' and part<>'time') or (model='quantity' and part<>'quantity') or (model='mixed' and ((part='fixed' and a.terms->>'amount' is null) or (part='time' and a.terms->>'additionalTime'<>'true') or (part='quantity' and a.terms->>'quantity'<>'true'))) then raise exception 'Position is outside the agreed model' using errcode='23514';end if;
 end loop;
 if i.status<>'draft' and exists(select 1 from invoice_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_part='time' and l.quantity>0 and not exists(select 1 from invoice_line_time_entries x where x.organization_id=l.organization_id and x.invoice_line_id=l.id)) then raise exception 'Time must be approved and source-linked' using errcode='23514';end if;
 if exists(select 1 from invoice_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_part='time' and l.price_base_quantity=1 and exists(select 1 from invoice_line_time_entries present where present.organization_id=l.organization_id and present.invoice_line_id=l.id) and (l.quantity is distinct from (select sum(t.hours) from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id) or exists(select 1 from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id and (not t.approved or not t.billable or t.archived_at is not null or t.customer_id is distinct from i.customer_id or t.sales_rate is distinct from l.unit_price)))) then raise exception 'Approved hours and bound rate must match the source' using errcode='23514';end if;
 scope_key=case when model='recurring' then i.billing_context->>'period' when model='milestone' then i.billing_context->>'milestoneId' else '' end;
 if model in ('recurring','milestone') and scope_key is null then raise exception 'Period or milestone required' using errcode='23514';end if;
 if model='recurring' then
  if scope_key!~'^(0|[1-9][0-9]{0,5})$' or scope_key::integer>120000 or a.terms->>'startsOn' is null or a.terms->>'intervalMonths' not in ('1','3','12') then raise exception 'Invalid recurring period' using errcode='23514';end if;
  period_index=scope_key::integer;
  period_start=((a.terms->>'startsOn')::date+make_interval(months=>period_index*(a.terms->>'intervalMonths')::integer))::date;
  period_end=((a.terms->>'startsOn')::date+make_interval(months=>(period_index+1)*(a.terms->>'intervalMonths')::integer))::date-1;
  if a.terms->>'endsOn' is not null then if period_start>(a.terms->>'endsOn')::date then raise exception 'Recurring agreement ended' using errcode='23514';end if;period_end=least(period_end,(a.terms->>'endsOn')::date);end if;
  if i.billing_context->>'periodStartsOn' is distinct from period_start::text or i.billing_context->>'periodEndsOn' is distinct from period_end::text then raise exception 'Recurring dates do not match the agreement' using errcode='23514';end if;
 end if;
 if a.commercial_snapshot is not null then
  for source_line in select * from invoice_lines where organization_id=i.organization_id and invoice_id=i.id loop
   source=a.commercial_snapshot->'items'->(source_line.billing_source_position-1);
   if model='milestone' and source_line.billing_source_position is distinct from (select n::integer from jsonb_array_elements(a.terms->'milestones') with ordinality m(value,n) where value->>'id'=scope_key) then raise exception 'Milestone source position mismatch' using errcode='23514';end if;
   if source_line.billing_source_position is null or source is null or source_line.vat_rate is distinct from (source->>'vat_rate')::numeric or (i.calculation->'lines'->(source_line.sort_order-1)->>'tax_exempt')::boolean is distinct from (a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'tax_exempt')::boolean then raise exception 'Negotiated tax and position provenance must be retained' using errcode='23514';end if;
   if model='mixed' and source->>'billing_part' is distinct from source_line.billing_part then raise exception 'A service cannot change billing components' using errcode='23514';end if;
   if source_line.billing_part in ('time','quantity') and source_line.unit_price is distinct from (source->>'unit_price')::numeric then raise exception 'Negotiated unit price must be retained' using errcode='23514';end if;
   if source_line.billing_part='fixed' then
    select coalesce(sum((entry->>'net')::numeric),0) into used from invoices x join invoice_lines q on q.organization_id=x.organization_id and q.invoice_id=x.id cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and q.sort_order=c.n and q.billing_source_position=source_line.billing_source_position and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and coalesce(x.billing_context->>'period','')=coalesce(i.billing_context->>'period','') and coalesce(x.billing_context->>'milestoneId','')=coalesce(i.billing_context->>'milestoneId','');
    if used>(a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'net')::numeric then raise exception 'Quoted fixed service already reserved' using errcode='23514';end if;
   end if;
   if a.commercial_snapshot->'calculation'->'discount'->>'kind'='fixed' then
    select coalesce(sum((entry->>'documentDiscountDisplay')::numeric),0) into used from invoices x join invoice_lines q on q.organization_id=x.organization_id and q.invoice_id=x.id cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and q.sort_order=c.n and q.billing_source_position=source_line.billing_source_position and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (model<>'recurring' or x.billing_context->>'period'=i.billing_context->>'period');
    if used>(a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'documentDiscountDisplay')::numeric then raise exception 'Quoted discount portion already reserved' using errcode='23514';end if;
   end if;
  end loop;
  for source_line in select * from invoice_lines where organization_id=i.organization_id and invoice_id=i.id and billing_part='quantity' loop
   source=a.commercial_snapshot->'items'->(source_line.billing_source_position-1);
   if source_line.billing_source_position is null or source is null or (model='mixed' and source->>'billing_part' is distinct from 'quantity') or source_line.unit_price is distinct from (source->>'unit_price')::numeric or source_line.vat_rate is distinct from (source->>'vat_rate')::numeric or source_line.unit is distinct from source->>'unit' then raise exception 'Quoted price, tax, unit and source must be retained' using errcode='23514';end if;
   select coalesce(sum(z.quantity),0) into used from invoice_lines z join invoices x on x.organization_id=z.organization_id and x.id=z.invoice_id where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and z.billing_source_position=source_line.billing_source_position and z.billing_part='quantity' and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued);
   if used>(source->>'quantity')::numeric then raise exception 'Quoted quantity already reserved' using errcode='23514';end if;
  end loop;
  if a.commercial_snapshot->'calculation'->'discount'->>'kind'='fixed' then
   select coalesce(sum((x.calculation->>'discountDisplay')::numeric),0) into used from invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (model<>'recurring' or x.billing_context->>'period'=i.billing_context->>'period');
   if used>(a.commercial_snapshot->'calculation'->'discount'->>'value')::numeric then raise exception 'Agreed discount already allocated' using errcode='23514';end if;
  end if;
  if model='quantity' then
   select coalesce(sum(x.subtotal),0) into used from invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued);
   if used>(a.commercial_snapshot->'calculation'->>'subtotal')::numeric or (procedure in ('standard','final') and used<>(a.commercial_snapshot->'calculation'->>'subtotal')::numeric) then raise exception 'Quoted net service capacity mismatch' using errcode='23514';end if;
  end if;
 end if;
 select exists(select 1 from invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and x.id<>i.id and (x.billing_issued or x.created_at<=i.created_at) and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (coalesce(x.billing_context->>'procedure','standard')='final') and (case when model='recurring' then x.billing_context->>'period' when model='milestone' then x.billing_context->>'milestoneId' else '' end)=scope_key) into other_final;
 if other_final and not (tg_op='UPDATE' and old.billing_issued) then raise exception 'Final invoice already reserves this service' using errcode='23514';end if;
 if procedure='final' and i.status<>'draft' then
  perform 1 from projects p where p.organization_id=i.organization_id and p.billing_agreement_id=a.id order by p.id for update;
  if exists(select 1 from invoices previous where previous.organization_id=i.organization_id and previous.billing_agreement_id=a.id and previous.id<>i.id and previous.status='draft' and previous.archived_at is null and coalesce(previous.billing_context->>'period','')=coalesce(i.billing_context->>'period','') and coalesce(previous.billing_context->>'milestoneId','')=coalesce(i.billing_context->>'milestoneId','')) then raise exception 'Issue preceding partial invoices before final settlement' using errcode='23514';end if;
  if (model='time' or (model='mixed' and a.terms->>'additionalTime'='true')) and exists(select 1 from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=i.organization_id and p.billing_agreement_id=a.id and t.billable and t.archived_at is null and ((t.external_resource_id is null and t.invoiced_invoice_id is null) or (t.external_resource_id is not null and t.recorded_duration_minutes>(select coalesce(sum(x.allocated_minutes),0) from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id)))) then raise exception 'Resolve unbilled time before final settlement' using errcode='23514';end if;
  if model not in ('recurring','milestone') and exists(select 1 from active_time_trackers tracker join projects p on p.organization_id=tracker.organization_id and p.id=tracker.project_id where p.organization_id=i.organization_id and p.billing_agreement_id=a.id and (tracker.state='running' or tracker.accumulated_seconds>0)) then raise exception 'Finish active timers before final settlement' using errcode='23514';end if;
 end if;
 cap=case when model in ('fixed','mixed','recurring') then (a.terms->>'amount')::numeric when model='milestone' then (select (m->>'amount')::numeric from jsonb_array_elements(a.terms->'milestones') m where m->>'id'=scope_key and (m->>'completed'='true' or exists(select 1 from billing_milestone_completions done where done.organization_id=a.organization_id and done.agreement_id=a.id and done.milestone_id::text=scope_key))) else null end;
 if model='milestone' and cap is null then raise exception 'Milestone is incomplete' using errcode='23514';end if;
 if cap is not null then
  select coalesce(sum((entry->>'net')::numeric),0) into used from invoices x cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) join invoice_lines l on l.organization_id=x.organization_id and l.invoice_id=x.id and l.sort_order=c.n where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and l.billing_part='fixed' and (case when model='recurring' then x.billing_context->>'period' when model='milestone' then x.billing_context->>'milestoneId' else '' end)=scope_key;
  if used>cap then raise exception 'Agreed service capacity exceeded' using errcode='23514';end if;
  select coalesce(sum((entry->>'net')::numeric),0) into own_amount from jsonb_array_elements(i.calculation->'lines') with ordinality c(entry,n) join invoice_lines l on l.organization_id=i.organization_id and l.invoice_id=i.id and l.sort_order=c.n where l.billing_part='fixed';
  if (procedure='final' or procedure='standard' and own_amount>0) and used<>cap then raise exception 'Complete invoice must settle the remaining service' using errcode='23514';end if;
 elsif model in ('fixed','recurring','milestone') then raise exception 'Agreement incomplete' using errcode='23514';
 end if;
 if procedure='advance' and (cap is null or exists(select 1 from invoice_lines where organization_id=i.organization_id and invoice_id=i.id and billing_part<>'fixed')) then raise exception 'Advance requires an agreed fixed component' using errcode='23514';end if;
 return null;
end $$;
create constraint trigger invoice_billing_capacity after insert or update on invoices deferrable initially deferred for each row execute function check_billing_capacity();

create function queue_billing_line_check() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op<>'INSERT' then if exists(select 1 from invoices where organization_id=old.organization_id and id=old.invoice_id and billing_agreement_id is not null) and (not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance')) then raise exception 'Billing line write denied' using errcode='42501';end if;end if;
 if tg_op<>'DELETE' then if exists(select 1 from invoices where organization_id=new.organization_id and id=new.invoice_id and billing_agreement_id is not null) and (not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance')) then raise exception 'Billing line write denied' using errcode='42501';end if;end if;
 if tg_op<>'INSERT' then update invoices set billing_context=billing_context where organization_id=old.organization_id and id=old.invoice_id and billing_agreement_id is not null;end if;
 if tg_op<>'DELETE' then update invoices set billing_context=billing_context where organization_id=new.organization_id and id=new.invoice_id and billing_agreement_id is not null;end if;
 return null;
end $$;
create trigger billing_line_check after insert or update or delete on invoice_lines for each row execute function queue_billing_line_check();

do $$begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert on billing_agreements,billing_milestone_completions,billing_closures to binso_runtime;end if;end $$;
