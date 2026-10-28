-- V8: invoice scopes share the existing agreement/capacity owner. No historical rewrites.
create table invoice_billing_scopes(
 organization_id uuid not null,invoice_id uuid not null,agreement_id uuid not null,
 project_id uuid,billing_context jsonb not null,calculation jsonb not null default '{}',
 primary key(organization_id,invoice_id,agreement_id),
 foreign key(organization_id,invoice_id) references invoices(organization_id,id),
 foreign key(organization_id,agreement_id) references billing_agreements(organization_id,id),
 foreign key(organization_id,project_id) references projects(organization_id,id));
alter table invoice_billing_scopes enable row level security;
alter table invoice_billing_scopes force row level security;
create policy invoice_scope_read on invoice_billing_scopes for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(false) and app_workforce_role() in ('owner','admin','finance','reader'));
create policy invoice_scope_write on invoice_billing_scopes for all using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance')) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance'));
alter table invoice_lines add column billing_agreement_id uuid;
alter table invoice_lines add column billing_scope_position integer check(billing_scope_position>0);
alter table invoice_lines add foreign key(organization_id,invoice_id,billing_agreement_id) references invoice_billing_scopes(organization_id,invoice_id,agreement_id) deferrable initially deferred;
alter table invoice_lines add unique(organization_id,invoice_id,billing_agreement_id,billing_scope_position) deferrable initially deferred;
create index invoice_scope_agreement on invoice_billing_scopes(organization_id,agreement_id,invoice_id);
create index invoice_scope_project on invoice_billing_scopes(organization_id,project_id,invoice_id) where project_id is not null;
create index invoice_line_agreement on invoice_lines(organization_id,billing_agreement_id,invoice_id);
create view billing_scope_invoices with (security_invoker=true) as
 select i.organization_id,i.id,i.billing_agreement_id,i.billing_context,i.calculation,i.status,i.archived_at,i.billing_issued,i.created_at,i.customer_id,i.currency,to_char(i.issue_date,'YYYY-MM-DD') issue_date,coalesce((i.calculation->>'serviceSubtotal')::numeric,i.subtotal) subtotal
 from invoices i where not exists(select 1 from invoice_billing_scopes s where s.organization_id=i.organization_id and s.invoice_id=i.id)
 union all
 select i.organization_id,i.id,s.agreement_id,s.billing_context,s.calculation,i.status,i.archived_at,i.billing_issued,i.created_at,i.customer_id,i.currency,to_char(i.issue_date,'YYYY-MM-DD') issue_date,coalesce((s.calculation->>'serviceSubtotal')::numeric,(s.calculation->>'subtotal')::numeric)
 from invoices i join invoice_billing_scopes s on s.organization_id=i.organization_id and s.invoice_id=i.id;
create view billing_scope_lines with (security_invoker=true) as
 select l.id,l.organization_id,l.invoice_id,coalesce(l.billing_scope_position,l.sort_order) sort_order,l.quantity,l.unit,l.unit_price,l.vat_rate,l.billing_part,l.billing_source_position,l.price_base_quantity,coalesce(l.billing_agreement_id,i.billing_agreement_id) billing_agreement_id
 from invoice_lines l join invoices i on i.organization_id=l.organization_id and i.id=l.invoice_id;
create function protect_invoice_scope() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare parent invoices;a billing_agreements;sid uuid;oid uuid;
begin
 sid=case when tg_op='DELETE' then old.invoice_id else new.invoice_id end;oid=case when tg_op='DELETE' then old.organization_id else new.organization_id end;
 select * into parent from invoices where organization_id=oid and id=sid for update;
 if parent.id is null or parent.status<>'draft' or parent.billing_issued or not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance') then raise exception 'Draft billing scope write denied' using errcode='42501';end if;
 if tg_op='DELETE' then return old;end if;
 if tg_op='UPDATE' and (old.organization_id,old.invoice_id,old.agreement_id) is distinct from (new.organization_id,new.invoice_id,new.agreement_id) then raise exception 'Scope identity is immutable' using errcode='23514';end if;
 select * into a from billing_agreements where organization_id=new.organization_id and id=new.agreement_id;
 if a.id is null or a.customer_id is distinct from parent.customer_id or a.currency is distinct from parent.currency or parent.billing_agreement_id is not null or parent.project_id is not null or parent.source_quote_id is not null then raise exception 'Scope recipient/currency/provenance mismatch' using errcode='23514';end if;
 if a.scope_kind='quote' and new.project_id is null and not exists(select 1 from quotes q where q.organization_id=a.organization_id and q.id=a.scope_id and q.billing_agreement_id=a.id and q.status='accepted' and q.archived_at is null) then raise exception 'Accepted quote or inherited project required' using errcode='23514';end if;
 if new.project_id is not null and not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.billing_agreement_id=a.id and p.customer_id=parent.customer_id and p.archived_at is null) then raise exception 'Scope project mismatch' using errcode='23514';end if;
 return new;
end $$;
create trigger invoice_scope_guard before insert or update or delete on invoice_billing_scopes for each row execute function protect_invoice_scope();
create or replace function check_billing_scope(p_org uuid,p_invoice uuid,p_agreement uuid,p_was_issued boolean) returns void language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare i record;a billing_agreements;model text;part text;used numeric;cap numeric;own_amount numeric;scope_key text;procedure text;other_final boolean;period_index integer;period_start date;period_end date;source_line record;source jsonb;
begin
 select * into i from billing_scope_invoices where organization_id=p_org and id=p_invoice and billing_agreement_id=p_agreement;
 if i.billing_agreement_id is null then return;end if;
 perform require_minute_write_isolation();
 perform pg_advisory_xact_lock(hashtextextended(i.organization_id::text||i.billing_agreement_id::text,0));
 select * into a from billing_agreements where organization_id=i.organization_id and id=i.billing_agreement_id;
 if not found then raise exception 'Billing agreement unavailable' using errcode='23514';end if;
 if a.customer_id is distinct from i.customer_id or a.currency is distinct from i.currency then raise exception 'Scope recipient/currency changed' using errcode='23514';end if;
 model=a.terms->>'model';
 if not billing_terms_ready(a.terms) then if i.status='draft' then return;else raise exception 'Agreement incomplete' using errcode='23514';end if;end if;
 procedure=coalesce(i.billing_context->>'procedure','standard');
 if procedure not in ('standard','advance','partial','final') or i.billing_context is null or jsonb_typeof(i.billing_context)<>'object' then raise exception 'Billing context required' using errcode='23514';end if;
 if (i.status='cancelled' or i.archived_at is not null) and not i.billing_issued then return;end if;
 if not exists(select 1 from billing_scope_lines where organization_id=i.organization_id and invoice_id=i.id and billing_agreement_id=a.id) then raise exception 'Billing positions required' using errcode='23514';end if;
 if procedure='advance' and (model in ('time','quantity') or model='mixed' and a.terms->>'amount' is null) then
  if exists(select 1 from billing_scope_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_agreement_id=a.id and (l.billing_part<>'fixed' or exists(select 1 from invoice_line_time_entries t where t.organization_id=l.organization_id and t.invoice_line_id=l.id))) then raise exception 'Variable advance is a financial claim, not a performed service' using errcode='23514';end if;
  if exists(select 1 from billing_scope_invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and x.id<>i.id and x.billing_context->>'procedure'='final' and (x.billing_issued or x.archived_at is null and x.status<>'cancelled')) then raise exception 'Agreement already closed by final invoice' using errcode='23514';end if;
  if a.commercial_snapshot is not null and exists(select 1 from billing_scope_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_agreement_id=a.id and not exists(select 1 from jsonb_array_elements(a.commercial_snapshot->'calculation'->'taxGroups') g where (g->>'rate')::numeric=l.vat_rate and (g->>'exempt')::boolean=(i.calculation->'lines'->(l.sort_order-1)->>'tax_exempt')::boolean)) then raise exception 'Advance must retain agreed tax treatment' using errcode='23514';end if;
  return;
 end if;
 for part in select billing_part from billing_scope_lines where organization_id=i.organization_id and invoice_id=i.id and billing_agreement_id=a.id loop
  if part is null or (model in ('fixed','recurring','milestone') and part<>'fixed') or (model='time' and part<>'time') or (model='quantity' and part<>'quantity') or (model='mixed' and ((part='fixed' and a.terms->>'amount' is null) or (part='time' and a.terms->>'additionalTime'<>'true') or (part='quantity' and a.terms->>'quantity'<>'true'))) then raise exception 'Position is outside the agreed model' using errcode='23514';end if;
 end loop;
 if i.status<>'draft' and exists(select 1 from billing_scope_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_agreement_id=a.id and l.billing_part='time' and l.quantity>0 and not exists(select 1 from invoice_line_time_entries x where x.organization_id=l.organization_id and x.invoice_line_id=l.id)) then raise exception 'Time must be approved and source-linked' using errcode='23514';end if;
 if exists(select 1 from billing_scope_lines l where l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_agreement_id=a.id and l.billing_part='time' and l.price_base_quantity=1 and exists(select 1 from invoice_line_time_entries present where present.organization_id=l.organization_id and present.invoice_line_id=l.id and present.allocated_minutes is null) and (l.quantity is distinct from (select sum(t.hours) from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id) or exists(select 1 from invoice_line_time_entries x join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id where x.organization_id=l.organization_id and x.invoice_line_id=l.id and (not t.approved or not t.billable or t.archived_at is not null or t.customer_id is distinct from i.customer_id or t.sales_rate is distinct from l.unit_price)))) then raise exception 'Approved hours and bound rate must match the source' using errcode='23514';end if;
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
  for source_line in select * from billing_scope_lines where organization_id=i.organization_id and invoice_id=i.id and billing_agreement_id=a.id loop
   source=a.commercial_snapshot->'items'->(source_line.billing_source_position-1);
   if model='milestone' and source_line.billing_source_position is distinct from (select n::integer from jsonb_array_elements(a.terms->'milestones') with ordinality m(value,n) where value->>'id'=scope_key) then raise exception 'Milestone source position mismatch' using errcode='23514';end if;
   if source_line.billing_source_position is null or source is null or source_line.vat_rate is distinct from (source->>'vat_rate')::numeric or (i.calculation->'lines'->(source_line.sort_order-1)->>'tax_exempt')::boolean is distinct from (a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'tax_exempt')::boolean then raise exception 'Negotiated tax and position provenance must be retained' using errcode='23514';end if;
   if model='mixed' and source->>'billing_part' is distinct from source_line.billing_part then raise exception 'A service cannot change billing components' using errcode='23514';end if;
   if (source_line.billing_part in ('time','quantity') or exists(select 1 from invoice_billing_scopes scope where scope.organization_id=i.organization_id and scope.invoice_id=i.id)) and source_line.unit_price is distinct from (source->>'unit_price')::numeric then raise exception 'Negotiated unit price must be retained' using errcode='23514';end if;
   if source_line.billing_part='fixed' then
    select coalesce(sum((entry->>'net')::numeric),0) into used from billing_scope_invoices x join billing_scope_lines q on q.organization_id=x.organization_id and q.invoice_id=x.id cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and q.sort_order=c.n and q.billing_agreement_id=x.billing_agreement_id and q.billing_source_position=source_line.billing_source_position and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and coalesce(x.billing_context->>'period','')=coalesce(i.billing_context->>'period','') and coalesce(x.billing_context->>'milestoneId','')=coalesce(i.billing_context->>'milestoneId','');
    if used>(a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'net')::numeric then raise exception 'Quoted fixed service already reserved' using errcode='23514';end if;
   end if;
   if a.commercial_snapshot->'items'->(source_line.billing_source_position-1)->'discount'->>'kind'='fixed' then
    select coalesce(sum((entry->>'positionDiscountDisplay')::numeric),0) into used from billing_scope_invoices x join billing_scope_lines q on q.organization_id=x.organization_id and q.invoice_id=x.id and q.billing_agreement_id=x.billing_agreement_id cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and coalesce(x.billing_context->>'procedure','standard')<>'advance' and q.sort_order=c.n and q.billing_source_position=source_line.billing_source_position and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (model<>'recurring' or x.billing_context->>'period'=i.billing_context->>'period');
    if used>(a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'positionDiscountDisplay')::numeric then raise exception 'Agreed position discount already allocated' using errcode='23514';end if;
   end if;
   if a.commercial_snapshot->'calculation'->'discount'->>'kind'='fixed' then
    select coalesce(sum((entry->>'documentDiscountDisplay')::numeric),0) into used from billing_scope_invoices x join billing_scope_lines q on q.organization_id=x.organization_id and q.invoice_id=x.id cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and q.sort_order=c.n and q.billing_agreement_id=x.billing_agreement_id and q.billing_source_position=source_line.billing_source_position and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (model<>'recurring' or x.billing_context->>'period'=i.billing_context->>'period');
    if used>(a.commercial_snapshot->'calculation'->'lines'->(source_line.billing_source_position-1)->>'documentDiscountDisplay')::numeric then raise exception 'Quoted discount portion already reserved' using errcode='23514';end if;
   end if;
  end loop;
  for source_line in select * from billing_scope_lines where organization_id=i.organization_id and invoice_id=i.id and billing_agreement_id=a.id and billing_part='quantity' loop
   source=a.commercial_snapshot->'items'->(source_line.billing_source_position-1);
   if source_line.billing_source_position is null or source is null or (model='mixed' and source->>'billing_part' is distinct from 'quantity') or source_line.unit_price is distinct from (source->>'unit_price')::numeric or source_line.vat_rate is distinct from (source->>'vat_rate')::numeric or source_line.unit is distinct from source->>'unit' then raise exception 'Quoted price, tax, unit and source must be retained' using errcode='23514';end if;
   select coalesce(sum(z.quantity),0) into used from billing_scope_lines z join billing_scope_invoices x on x.organization_id=z.organization_id and x.id=z.invoice_id where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and z.billing_source_position=source_line.billing_source_position and z.billing_part='quantity' and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued);
   if used>(source->>'quantity')::numeric then raise exception 'Quoted quantity already reserved' using errcode='23514';end if;
  end loop;
  if a.commercial_snapshot->'calculation'->'discount'->>'kind'='fixed' then
   select coalesce(sum((x.calculation->>'discountDisplay')::numeric),0) into used from billing_scope_invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (model<>'recurring' or x.billing_context->>'period'=i.billing_context->>'period');
   if used>(a.commercial_snapshot->'calculation'->'discount'->>'value')::numeric then raise exception 'Agreed discount already allocated' using errcode='23514';end if;
  end if;
  if model='quantity' then
   select coalesce(sum(x.subtotal),0) into used from billing_scope_invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and coalesce(x.billing_context->>'procedure','standard')<>'advance' and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued);
   if used>(a.commercial_snapshot->'calculation'->>'subtotal')::numeric or (procedure in ('standard','final') and used<>(a.commercial_snapshot->'calculation'->>'subtotal')::numeric) then raise exception 'Quoted net service capacity mismatch' using errcode='23514';end if;
  end if;
 end if;
 select exists(select 1 from billing_scope_invoices x where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and x.id<>i.id and (x.billing_issued or x.created_at<=i.created_at) and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and (coalesce(x.billing_context->>'procedure','standard')='final') and (case when model='recurring' then x.billing_context->>'period' when model='milestone' then x.billing_context->>'milestoneId' else '' end)=scope_key) into other_final;
 if other_final and not (p_was_issued) then raise exception 'Final invoice already reserves this service' using errcode='23514';end if;
 if procedure='final' and i.status<>'draft' then
  perform 1 from projects p where p.organization_id=i.organization_id and p.billing_agreement_id=a.id order by p.id for update;
  if exists(select 1 from billing_scope_invoices previous where previous.organization_id=i.organization_id and previous.billing_agreement_id=a.id and previous.id<>i.id and previous.status='draft' and previous.archived_at is null and coalesce(previous.billing_context->>'period','')=coalesce(i.billing_context->>'period','') and coalesce(previous.billing_context->>'milestoneId','')=coalesce(i.billing_context->>'milestoneId','')) then raise exception 'Issue preceding partial invoices before final settlement' using errcode='23514';end if;
  if (model='time' or (model='mixed' and a.terms->>'additionalTime'='true')) and exists(select 1 from time_entries t join projects p on p.organization_id=t.organization_id and p.id=t.project_id where t.organization_id=i.organization_id and p.billing_agreement_id=a.id and t.billable and t.archived_at is null and ((t.external_resource_id is null and t.invoiced_invoice_id is null) or (t.external_resource_id is not null and t.recorded_duration_minutes>(select coalesce(sum(x.allocated_minutes),0) from invoice_line_time_entries x where x.organization_id=t.organization_id and x.time_entry_id=t.id)))) then raise exception 'Resolve unbilled time before final settlement' using errcode='23514';end if;
  if model not in ('recurring','milestone') and exists(select 1 from active_time_trackers tracker join projects p on p.organization_id=tracker.organization_id and p.id=tracker.project_id where p.organization_id=i.organization_id and p.billing_agreement_id=a.id and (tracker.state='running' or tracker.accumulated_seconds>0)) then raise exception 'Finish active timers before final settlement' using errcode='23514';end if;
 end if;
 cap=case when model in ('fixed','mixed','recurring') then (a.terms->>'amount')::numeric when model='milestone' then (select (m->>'amount')::numeric from jsonb_array_elements(a.terms->'milestones') m where m->>'id'=scope_key and (m->>'completed'='true' or exists(select 1 from billing_milestone_completions done where done.organization_id=a.organization_id and done.agreement_id=a.id and done.milestone_id::text=scope_key))) else null end;
 if model='milestone' and cap is null then raise exception 'Milestone is incomplete' using errcode='23514';end if;
 if cap is not null then
  select coalesce(sum((entry->>'net')::numeric),0) into used from billing_scope_invoices x cross join lateral jsonb_array_elements(x.calculation->'lines') with ordinality c(entry,n) join billing_scope_lines l on l.organization_id=x.organization_id and l.invoice_id=x.id and l.billing_agreement_id=x.billing_agreement_id and l.sort_order=c.n where x.organization_id=i.organization_id and x.billing_agreement_id=a.id and (x.archived_at is null or x.billing_issued) and (x.status<>'cancelled' or x.billing_issued) and l.billing_part='fixed' and (case when model='recurring' then x.billing_context->>'period' when model='milestone' then x.billing_context->>'milestoneId' else '' end)=scope_key;
  if used>cap then raise exception 'Agreed service capacity exceeded' using errcode='23514';end if;
  select coalesce(sum((entry->>'net')::numeric),0) into own_amount from jsonb_array_elements(i.calculation->'lines') with ordinality c(entry,n) join billing_scope_lines l on l.organization_id=i.organization_id and l.invoice_id=i.id and l.billing_agreement_id=a.id and l.sort_order=c.n where l.billing_part='fixed';
  if (procedure='final' or procedure='standard' and own_amount>0) and used<>cap then raise exception 'Complete invoice must settle the remaining service' using errcode='23514';end if;
 elsif model in ('fixed','recurring','milestone') then raise exception 'Agreement incomplete' using errcode='23514';
 end if;
 if procedure='advance' and (cap is null or exists(select 1 from billing_scope_lines where organization_id=i.organization_id and invoice_id=i.id and billing_agreement_id=a.id and billing_part<>'fixed')) then raise exception 'Advance requires an agreed fixed component' using errcode='23514';end if;
 return;
end $$;
create or replace function check_billing_capacity() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare scope record;was_issued boolean;actual integer;expected integer;parent invoices;
begin
 was_issued=case when tg_op='UPDATE' then old.billing_issued else false end;
 select * into parent from invoices where organization_id=new.organization_id and id=new.id;
 if parent.billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=parent.organization_id and s.invoice_id=parent.id) then
  if parent.calculation is null or (parent.calculation->>'subtotal')::numeric is distinct from parent.subtotal or (parent.calculation->>'vat')::numeric is distinct from parent.vat_amount or (parent.calculation->>'total')::numeric is distinct from parent.total_amount or parent.subtotal+parent.vat_amount<>parent.total_amount then raise exception 'Canonical calculation and actual receivable must match' using errcode='23514';end if;
 end if;
 -- Lock every agreement in stable UUID order before inspecting any capacity.
 for scope in select billing_agreement_id from billing_scope_invoices where organization_id=new.organization_id and id=new.id and billing_agreement_id is not null order by billing_agreement_id loop
  perform pg_advisory_xact_lock(hashtextextended(new.organization_id::text||scope.billing_agreement_id::text,0));
 end loop;
 if exists(select 1 from invoice_billing_scopes where organization_id=new.organization_id and invoice_id=new.id) then
  if exists(select 1 from invoice_lines where organization_id=new.organization_id and invoice_id=new.id and (billing_agreement_id is null or billing_scope_position is null)) then raise exception 'Every consolidated position requires a scope' using errcode='23514';end if;
  if not exists(select 1 from invoices i where i.organization_id=new.organization_id and i.id=new.id and i.calculation->'billingScopes' is not null) then raise exception 'Canonical scope snapshot required' using errcode='23514';end if;
  for scope in select s.* from invoice_billing_scopes s where s.organization_id=new.organization_id and s.invoice_id=new.id loop
   if not exists(select 1 from invoices i cross join lateral jsonb_array_elements(i.calculation->'billingScopes') part where i.organization_id=scope.organization_id and i.id=scope.invoice_id and part->>'agreementId'=scope.agreement_id::text and part->'calculation'=scope.calculation) then raise exception 'Scope calculation mismatch' using errcode='23514';end if;
   select count(*) into actual from invoice_lines where organization_id=scope.organization_id and invoice_id=scope.invoice_id and billing_agreement_id=scope.agreement_id;
   expected=jsonb_array_length(scope.calculation->'lines');if actual<>expected or actual=0 then raise exception 'Scope position count mismatch' using errcode='23514';end if;
  end loop;
 end if;
 for scope in select billing_agreement_id from billing_scope_invoices where organization_id=new.organization_id and id=new.id and billing_agreement_id is not null order by billing_agreement_id loop
  perform check_billing_scope(new.organization_id,new.id,scope.billing_agreement_id,was_issued);
 end loop;
 return null;
end $$;
create or replace function protect_billing_root() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
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
   if a.scope_kind='invoice' and a.scope_id<>new.id and (new.project_id is null or not exists(select 1 from projects p where p.organization_id=new.organization_id and p.id=new.project_id and p.billing_agreement_id=a.id)) and not exists(select 1 from invoices origin where origin.organization_id=new.organization_id and origin.id=a.scope_id and origin.billing_agreement_id=a.id and origin.customer_id=new.customer_id and origin.currency=new.currency and origin.billing_issued and origin.status not in ('draft','cancelled') and origin.archived_at is null) then raise exception 'Direct invoice agreement scope mismatch' using errcode='23514';end if;
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
  if (new.billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=new.organization_id and s.invoice_id=new.id)) and new.status not in ('draft','cancelled') then new.billing_issued=true;end if;
  if new.project_id is not null then select billing_agreement_id into linked from projects where organization_id=new.organization_id and id=new.project_id;if linked is not null and linked is distinct from new.billing_agreement_id then raise exception 'Project agreement must be inherited' using errcode='23514';end if;end if;
  if new.source_quote_id is not null then select billing_agreement_id into linked from quotes where organization_id=new.organization_id and id=new.source_quote_id;if linked is distinct from new.billing_agreement_id then raise exception 'Quote agreement must be inherited' using errcode='23514';end if;end if;
 end if;
 if tg_table_name='projects' then if new.source_quote_id is not null then select billing_agreement_id into linked from quotes where organization_id=new.organization_id and id=new.source_quote_id;if linked is not null and linked is distinct from new.billing_agreement_id then raise exception 'Accepted quote agreement must be inherited' using errcode='23514';end if;end if;end if;
 return new;
end $$;
create or replace function protect_billing_time_source() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare a billing_agreements; parent invoices; part text;
begin
 select i.* into parent from invoices i join invoice_lines l on l.organization_id=i.organization_id and l.invoice_id=i.id where l.organization_id=new.organization_id and l.id=new.invoice_line_id;
 select billing_part,coalesce(billing_agreement_id,parent.billing_agreement_id) into part,parent.billing_agreement_id from invoice_lines where organization_id=new.organization_id and id=new.invoice_line_id;
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
create or replace function queue_billing_line_check() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op<>'INSERT' then if exists(select 1 from invoices where organization_id=old.organization_id and id=old.invoice_id and (billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=invoices.organization_id and s.invoice_id=invoices.id))) and (not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance')) then raise exception 'Billing line write denied' using errcode='42501';end if;end if;
 if tg_op<>'DELETE' then if exists(select 1 from invoices where organization_id=new.organization_id and id=new.invoice_id and (billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=invoices.organization_id and s.invoice_id=invoices.id))) and (not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance')) then raise exception 'Billing line write denied' using errcode='42501';end if;end if;
 if tg_op<>'INSERT' then update invoices set billing_context=billing_context where organization_id=old.organization_id and id=old.invoice_id and (billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=invoices.organization_id and s.invoice_id=invoices.id));end if;
 if tg_op<>'DELETE' then update invoices set billing_context=billing_context where organization_id=new.organization_id and id=new.invoice_id and (billing_agreement_id is not null or exists(select 1 from invoice_billing_scopes s where s.organization_id=invoices.organization_id and s.invoice_id=invoices.id));end if;
 return null;
end $$;
create function queue_invoice_scope_check() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if tg_op<>'INSERT' then update invoices set billing_context=billing_context where organization_id=old.organization_id and id=old.invoice_id;end if;
 if tg_op<>'DELETE' then update invoices set billing_context=billing_context where organization_id=new.organization_id and id=new.invoice_id;end if;
 return null;
end $$;
create trigger invoice_scope_check after insert or update or delete on invoice_billing_scopes for each row execute function queue_invoice_scope_check();
create or replace function record_billing_closure() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.billing_issued then insert into billing_closures(organization_id,agreement_id,invoice_id)
 select s.organization_id,s.billing_agreement_id,s.id from billing_scope_invoices s join billing_agreements a on a.organization_id=s.organization_id and a.id=s.billing_agreement_id where s.organization_id=new.organization_id and s.id=new.id and s.billing_context->>'procedure'='final' and a.terms->>'model' not in ('recurring','milestone') on conflict do nothing;end if;
 return null;
end $$;

-- Human-readable provenance only; all money remains in the existing engine.
create function billing_agreement_label(p_org uuid,p_id uuid) returns text language sql stable set search_path=pg_catalog,public,pg_temp as $$
 select coalesce(p.name,q.quote_no,i.invoice_no) from billing_agreements b
 left join projects p on b.scope_kind='project' and p.organization_id=b.organization_id and p.id=b.scope_id
 left join quotes q on b.scope_kind='quote' and q.organization_id=b.organization_id and q.id=b.scope_id
 left join invoices i on b.scope_kind='invoice' and i.organization_id=b.organization_id and i.id=b.scope_id
 where b.organization_id=p_org and b.id=p_id
$$;
