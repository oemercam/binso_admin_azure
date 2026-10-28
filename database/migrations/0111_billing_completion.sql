-- V8 completion: explicit contractual time units; legacy hour/60 snapshots and arithmetic remain unchanged.
alter table contract_condition_revisions add column time_unit_minutes integer;
alter table contract_condition_revisions drop constraint contract_condition_revisions_unit_check;
alter table contract_condition_revisions add constraint contract_condition_revisions_unit_check check(unit in ('hour','minute','day','unit'));
alter table contract_condition_revisions add constraint contract_time_unit_minutes check(time_unit_minutes is null or (unit is not null and time_unit_minutes between 1 and 1440 and (unit not in ('hour','minute') or unit='hour' and time_unit_minutes=60 or unit='minute' and time_unit_minutes=1)));
alter table invoice_lines drop constraint invoice_lines_price_base_quantity_check;
alter table invoice_lines add constraint invoice_lines_price_base_quantity_check check(price_base_quantity between 1 and 1440);

create or replace function protect_time_price_source() returns trigger language plpgsql set search_path=pg_catalog,public as $$
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
 if c.id is null or r.id is null or (r.unit not in ('hour','minute','day','unit') or (r.unit in ('day','unit') and r.time_unit_minutes is null)) or t.work_date<r.starts_on or (r.ends_on is not null and t.work_date>r.ends_on) or t.work_date<c.start_date or (c.end_date is not null and t.work_date>c.end_date)
  or (c.project_id is not null and c.project_id is distinct from t.project_id) or (r.resource_id is not null and r.resource_id is distinct from t.external_resource_id)
  or (new.side='purchase' and (c.customer_id is not null or c.supplier_id is distinct from t.supplier_id))
  or (new.side='sale' and (c.supplier_id is not null or c.customer_id is null or c.customer_id is distinct from t.customer_id or not t.billable))
  or exists(select 1 from contract_condition_revisions newer where newer.organization_id=r.organization_id and newer.contract_id=r.contract_id and newer.condition_id=r.condition_id and newer.status='approved' and newer.revision>r.revision)
 then raise exception 'Approved dated price does not match performance' using errcode='23514';end if;
 expected:=jsonb_build_object('contractId',c.id,'contractVersion',c.version,'billingInterval',c.billing_interval,'conditionRevisionId',r.id,'conditionId',r.condition_id,'revision',r.revision,'side',new.side,'unit',r.unit,'unitPrice',r.unit_price::text,'currency',r.currency,'taxTreatment',r.tax_treatment,'vatRate',r.vat_rate::text,'taxReason',r.tax_reason,'expensePolicy',r.expense_policy);
 if r.unit<>'hour' then expected:=expected||jsonb_build_object('unitMinutes',case when r.unit='minute' then 1 else r.time_unit_minutes end);end if;
 if new.source_snapshot is distinct from expected then raise exception 'Price snapshot must equal the actual approved source' using errcode='23514';end if;
 return new;
end $$;

create or replace function protect_external_time_invoice_link() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare x invoice_line_time_entries%rowtype;t time_entries%rowtype;l invoice_lines%rowtype;i invoices%rowtype;p time_price_sources%rowtype;used_minutes bigint;
begin
 if tg_op='DELETE' then x:=old;else x:=new;end if;
 if tg_op='UPDATE' and old.allocated_minutes is not null then raise exception 'Minute allocation identity is immutable' using errcode='42501';end if;
 select * into t from time_entries where organization_id=x.organization_id and id=x.time_entry_id;
 if t.id is null then raise exception 'Visible performance required' using errcode='42501';end if;
 if t.external_resource_id is null then
  if x.allocated_minutes is not null or x.price_source_id is not null then raise exception 'Legacy time retains whole-entry allocation' using errcode='23514';end if;
  if tg_op='DELETE' then return old;else return new;end if;
 end if;
 perform require_minute_write_isolation();
 select * into l from invoice_lines where organization_id=x.organization_id and id=x.invoice_line_id;
 if l.id is null then raise exception 'Visible invoice line required' using errcode='42501';end if;
 select * into i from invoices where organization_id=x.organization_id and id=l.invoice_id for update;
 select * into t from time_entries where organization_id=x.organization_id and id=x.time_entry_id for update;
 if t.id is null then raise exception 'Visible performance required' using errcode='42501';end if;
 if not app_minute_invoice_write() or i.id is null or i.status<>'draft' then raise exception 'Writable draft required for minute allocation changes' using errcode='42501';end if;
 if tg_op='DELETE' then return old;end if;
 if tg_op='UPDATE' then raise exception 'Replace a draft reservation explicitly' using errcode='42501';end if;
 if x.allocated_minutes is null or x.price_source_id is null or x.allocated_minutes<1 or not t.approved or t.submitted_at is null or not t.billable or t.archived_at is not null or t.customer_id is distinct from i.customer_id or i.archived_at is not null then raise exception 'Approved matching minute source required' using errcode='23514';end if;
 select * into p from time_price_sources where organization_id=x.organization_id and id=x.price_source_id and time_entry_id=t.id and side='sale' and is_current;
 if p.id is null or coalesce((p.source_snapshot->>'unitMinutes')::integer,60)<>l.price_base_quantity or p.source_snapshot->>'currency'<>i.currency or (p.source_snapshot->>'unitPrice')::numeric<>l.unit_price or (p.source_snapshot->>'vatRate')::numeric<>l.vat_rate then raise exception 'Confirmed sales price and document currency must match' using errcode='23514';end if;
 select coalesce(sum(allocated_minutes),0) into used_minutes from invoice_line_time_entries where organization_id=x.organization_id and time_entry_id=t.id;
 if used_minutes+x.allocated_minutes>t.recorded_duration_minutes then raise exception 'Performance minutes already reserved' using errcode='23514',constraint='time_minutes_available';end if;
 perform set_config('app.minute_invoice',i.id::text,true);
 update invoices set uses_minute_allocations=true where organization_id=i.organization_id and id=i.id and not uses_minute_allocations;
 return new;
end $$;

create or replace function minute_line_complete(p_org uuid,p_line uuid) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select coalesce((select
  (case when l.price_base_quantity=1 and not exists(select 1 from invoice_line_time_entries x where x.organization_id=p_org and x.invoice_line_id=l.id and x.allocated_minutes is not null) then true
   else l.quantity=(select coalesce(sum(x.allocated_minutes),0) from invoice_line_time_entries x where x.organization_id=p_org and x.invoice_line_id=l.id)
    and not exists(select 1 from invoice_line_time_entries x left join time_price_sources p on p.organization_id=x.organization_id and p.id=x.price_source_id left join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id
     where x.organization_id=p_org and x.invoice_line_id=l.id and (p.id is null or t.id is null or coalesce((p.source_snapshot->>'unitMinutes')::integer,60)<>l.price_base_quantity or x.allocated_minutes is null or p.side<>'sale' or p.time_entry_id<>x.time_entry_id or p.source_snapshot->>'currency'<>i.currency or (p.source_snapshot->>'unitPrice')::numeric<>l.unit_price or (p.source_snapshot->>'vatRate')::numeric<>l.vat_rate or t.customer_id is distinct from i.customer_id)) end)
  from invoice_lines l join invoices i on i.organization_id=l.organization_id and i.id=l.invoice_id where l.organization_id=p_org and l.id=p_line and not(i.status='draft' and i.archived_at is not null)),true)
$$;

create or replace function protect_minute_invoice_line() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare parent invoices%rowtype;
begin
 if tg_op='INSERT' then return new;end if;
 if old.price_base_quantity=1 and not exists(select 1 from invoice_line_time_entries x where x.organization_id=old.organization_id and x.invoice_line_id=old.id and x.allocated_minutes is not null) then if tg_op='DELETE' then return old;else return new;end if;end if;
 select * into parent from invoices where organization_id=old.organization_id and id=old.invoice_id for update;
 if parent.id is null or parent.status<>'draft' or not app_minute_invoice_write() then raise exception 'Issued minute positions are immutable' using errcode='42501';end if;
 if tg_op='DELETE' then delete from invoice_line_time_entries where organization_id=old.organization_id and invoice_line_id=old.id and allocated_minutes is not null;return old;end if;
 if row(new.organization_id,new.invoice_id,new.id) is distinct from row(old.organization_id,old.invoice_id,old.id) then raise exception 'Minute invoice identity is immutable' using errcode='42501';end if;
 return new;
end $$;

create or replace function check_billing_capacity() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
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
 if exists(select 1 from invoice_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_part='time' and l.price_base_quantity=1 and exists(select 1 from invoice_line_time_entries present where present.organization_id=l.organization_id and present.invoice_line_id=l.id and present.allocated_minutes is null) and (l.quantity is distinct from (select sum(t.hours) from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id) or exists(select 1 from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id and (not t.approved or not t.billable or t.archived_at is not null or t.customer_id is distinct from i.customer_id or t.sales_rate is distinct from l.unit_price)))) then raise exception 'Approved hours and bound rate must match the source' using errcode='23514';end if;
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
