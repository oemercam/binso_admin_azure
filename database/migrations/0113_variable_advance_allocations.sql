-- Optimistic document tokens must not depend on a pooled connection's timezone.
create function document_revision_token(value timestamptz) returns text language sql immutable strict set search_path=pg_catalog as $$select to_char(value at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')$$;
-- Traceable reservation of previously invoiced variable advances. No payment moves.
create table invoice_advance_allocations(
 organization_id uuid not null,invoice_id uuid not null,advance_invoice_id uuid not null,agreement_id uuid not null,
 created_at timestamptz not null default now(),created_by_user_id text not null default current_setting('app.user_id',true),
 reversed_at timestamptz,reversed_by_user_id text,check((reversed_at is null)=(reversed_by_user_id is null)),
 amount numeric(12,2) not null check(amount>0),net_amount numeric(12,2) not null check(net_amount>=0),vat_amount numeric(12,2) not null check(vat_amount>=0),snapshot jsonb not null,
 primary key(organization_id,invoice_id,advance_invoice_id,agreement_id),check(invoice_id<>advance_invoice_id),check(amount=net_amount+vat_amount),
 foreign key(organization_id,invoice_id) references invoices(organization_id,id),
 foreign key(organization_id,advance_invoice_id) references invoices(organization_id,id),
 foreign key(organization_id,agreement_id) references billing_agreements(organization_id,id));
create index advance_application_source on invoice_advance_allocations(organization_id,advance_invoice_id,agreement_id);
alter table invoice_advance_allocations enable row level security;
alter table invoice_advance_allocations force row level security;
create policy advance_application_read on invoice_advance_allocations for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(false) and app_workforce_role() in ('owner','admin','finance','reader'));
create policy advance_application_write on invoice_advance_allocations for all using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance')) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance'));

create function protect_advance_application() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare target invoices;source record;oid uuid;tid uuid;used numeric;credits numeric;bucket jsonb;source_bucket jsonb;net_used numeric;tax_used numeric;
begin
 oid=case when tg_op='DELETE' then old.organization_id else new.organization_id end;tid=case when tg_op='DELETE' then old.invoice_id else new.invoice_id end;
 select * into target from invoices where organization_id=oid and id=tid for update;
 if tg_op='UPDATE' then
  if target.status='cancelled' and old.reversed_at is null and new.reversed_at=now() and new.reversed_by_user_id=current_setting('app.user_id',true) and app_billing_actor(true) and app_workforce_role() in ('owner','admin','finance') and (to_jsonb(new)-'reversed_at'-'reversed_by_user_id') is not distinct from (to_jsonb(old)-'reversed_at'-'reversed_by_user_id') then return new;end if;
  raise exception 'Only an audited cancellation may reverse an application' using errcode='42501';
 end if;
 if target.id is null or target.status<>'draft' or target.billing_issued or not app_billing_actor(true) or app_workforce_role() not in ('owner','admin','finance') then raise exception 'Advance application write denied' using errcode='42501';end if;
 if tg_op='DELETE' then return old;end if;
 if new.created_at is distinct from now() or new.created_by_user_id is distinct from current_setting('app.user_id',true) then raise exception 'Actual advance application actor required' using errcode='23514';end if;
 if new.reversed_at is not null or new.reversed_by_user_id is not null then raise exception 'New applications cannot be reversed' using errcode='23514';end if;
 perform require_minute_write_isolation();
 perform 1 from invoices where organization_id=new.organization_id and id=new.advance_invoice_id for update;
 select s.* into source from billing_scope_invoices s join billing_agreements a on a.organization_id=s.organization_id and a.id=s.billing_agreement_id
 where s.organization_id=new.organization_id and s.id=new.advance_invoice_id and s.billing_agreement_id=new.agreement_id and s.billing_context->>'procedure'='advance' and s.billing_issued and s.archived_at is null and s.status not in ('draft','cancelled')
 and (a.terms->>'model' in ('time','quantity') or a.terms->>'model'='mixed' and a.terms->>'amount' is null);
 if not found or source.customer_id is distinct from target.customer_id or source.currency is distinct from target.currency or not exists(select 1 from billing_scope_invoices s where s.organization_id=new.organization_id and s.id=new.invoice_id and s.billing_agreement_id=new.agreement_id and s.billing_context->>'procedure'<>'advance') then raise exception 'Advance recipient/currency/agreement mismatch' using errcode='23514';end if;
 select coalesce(sum(x.amount),0) into used from invoice_advance_allocations x join invoices i on i.organization_id=x.organization_id and i.id=x.invoice_id where x.reversed_at is null and x.organization_id=new.organization_id and x.advance_invoice_id=new.advance_invoice_id and x.agreement_id=new.agreement_id and (i.billing_issued or i.archived_at is null and i.status<>'cancelled');
 select coalesce(sum(c.amount),0) into credits from credit_notes c where c.organization_id=new.organization_id and c.invoice_id=new.advance_invoice_id;
 if credits>0 then raise exception 'Gross-only credit has no allocated tax evidence for a new advance application' using errcode='23514';end if;
 if used+new.amount+credits>(source.calculation->>'total')::numeric then raise exception 'Advance amount already allocated or credited' using errcode='23514';end if;
 if source.issue_date::date>target.issue_date then raise exception 'Advance cannot precede its invoice date' using errcode='23514';end if;
 if new.snapshot->>'advanceNumber' is distinct from (select invoice_no from invoices where organization_id=new.organization_id and id=new.advance_invoice_id) then raise exception 'Original advance number must be retained' using errcode='23514';end if;
 if new.snapshot->>'advanceInvoiceId' is distinct from new.advance_invoice_id::text or new.snapshot->>'agreementId' is distinct from new.agreement_id::text or (new.snapshot->>'amount')::numeric is distinct from new.amount then raise exception 'Advance provenance mismatch' using errcode='23514';end if;
 if jsonb_typeof(new.snapshot->'taxGroups')<>'array' or jsonb_array_length(new.snapshot->'taxGroups')=0 then raise exception 'Advance tax evidence required' using errcode='23514';end if;
 if (select count(distinct (g->>'rate',g->>'exempt')) from jsonb_array_elements(new.snapshot->'taxGroups') g)<>jsonb_array_length(new.snapshot->'taxGroups') then raise exception 'Duplicate advance tax group' using errcode='23514';end if;
 for bucket in select value from jsonb_array_elements(new.snapshot->'taxGroups') loop
  select g into source_bucket from jsonb_array_elements(source.calculation->'taxGroups') g where g->>'rate'=bucket->>'rate' and g->>'exempt'=bucket->>'exempt';
  if source_bucket is null or (bucket->>'net')::numeric<0 or (bucket->>'tax')::numeric<0 then raise exception 'Advance tax group mismatch' using errcode='23514';end if;
  select coalesce(sum((g->>'net')::numeric),0),coalesce(sum((g->>'tax')::numeric),0) into net_used,tax_used from invoice_advance_allocations x join invoices i on i.organization_id=x.organization_id and i.id=x.invoice_id cross join lateral jsonb_array_elements(x.snapshot->'taxGroups') g where x.reversed_at is null and x.organization_id=new.organization_id and x.advance_invoice_id=new.advance_invoice_id and x.agreement_id=new.agreement_id and (i.billing_issued or i.archived_at is null and i.status<>'cancelled') and g->>'rate'=bucket->>'rate' and g->>'exempt'=bucket->>'exempt';
  if net_used+(bucket->>'net')::numeric>(source_bucket->>'net')::numeric or tax_used+(bucket->>'tax')::numeric>(source_bucket->>'tax')::numeric then raise exception 'Advance tax cents already allocated' using errcode='23514';end if;
 end loop;
 if new.net_amount is distinct from (select sum((g->>'net')::numeric) from jsonb_array_elements(new.snapshot->'taxGroups') g) or new.vat_amount is distinct from (select sum((g->>'tax')::numeric) from jsonb_array_elements(new.snapshot->'taxGroups') g) then raise exception 'Advance evidence amount mismatch' using errcode='23514';end if;
 return new;
end $$;
create trigger advance_application_guard before insert or update or delete on invoice_advance_allocations for each row execute function protect_advance_application();
create function check_advance_application_totals() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare actual invoices;net numeric;tax numeric;gross numeric;entry record;
begin
 select * into actual from invoices where organization_id=new.organization_id and id=new.id;
 select coalesce(sum(a.net_amount),0),coalesce(sum(a.vat_amount),0),coalesce(sum(a.amount),0) into net,tax,gross from invoice_advance_allocations a where a.organization_id=actual.organization_id and a.invoice_id=actual.id;
 if gross>0 then
  if (actual.calculation->>'serviceSubtotal')::numeric-actual.subtotal is distinct from net or (actual.calculation->>'serviceVat')::numeric-actual.vat_amount is distinct from tax or (actual.calculation->>'serviceTotal')::numeric-actual.total_amount is distinct from gross then raise exception 'Advance applications must match the actual receivable' using errcode='23514';end if;
  for entry in select * from invoice_advance_allocations a where a.organization_id=actual.organization_id and a.invoice_id=actual.id loop
   if not exists(select 1 from jsonb_array_elements(actual.calculation->'advanceApplications') a where a=entry.snapshot) then raise exception 'Advance application snapshot mismatch' using errcode='23514';end if;
  end loop;
 elsif actual.calculation ? 'advanceApplications' then raise exception 'Advance snapshot lacks reservations' using errcode='23514';
 end if;
 return null;
end $$;
create constraint trigger invoice_advance_totals after insert or update on invoices deferrable initially deferred for each row execute function check_advance_application_totals();
create trigger advance_application_check after insert or update or delete on invoice_advance_allocations for each row execute function queue_invoice_scope_check();

create function protect_applied_advance_credit() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
declare source invoices;used numeric;credited numeric;
begin
 select * into source from invoices where organization_id=new.organization_id and id=new.invoice_id for update;
 select coalesce(sum(a.amount),0) into used from invoice_advance_allocations a join invoices i on i.organization_id=a.organization_id and i.id=a.invoice_id where a.reversed_at is null and a.organization_id=new.organization_id and a.advance_invoice_id=new.invoice_id and (i.billing_issued or i.archived_at is null and i.status<>'cancelled');
 if used>0 then
  select coalesce(sum(n.amount),0) into credited from credit_notes n where n.organization_id=new.organization_id and n.invoice_id=new.invoice_id and n.id<>new.id;
  if used+credited+new.amount>source.total_amount then raise exception 'Applied advances require a traceable correction before crediting' using errcode='23514';end if;
 end if;
 return new;
end $$;
create trigger applied_advance_credit_guard before insert or update on credit_notes for each row execute function protect_applied_advance_credit();

-- Cancellation retires the target claim. Its immutable original calculation stays
-- intact; the one-way reversal records who released the financial reservation.
create function reverse_canceled_invoice_advances() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if new.status='cancelled' and old.status is distinct from new.status then
  update invoice_advance_allocations set reversed_at=now(),reversed_by_user_id=current_setting('app.user_id',true) where organization_id=new.organization_id and invoice_id=new.id and reversed_at is null;
 end if;
 return null;
end $$;
create trigger reverse_canceled_advances after update on invoices for each row when(new.status='cancelled' and old.status is distinct from new.status) execute function reverse_canceled_invoice_advances();
create function protect_used_advance_source() returns trigger language plpgsql set search_path=pg_catalog,public,pg_temp as $$
begin
 if (old.status='cancelled' and new.status<>'cancelled' or old.archived_at is not null and new.archived_at is null or old.billing_issued and new.status='draft') and exists(select 1 from invoice_advance_allocations a where a.organization_id=new.organization_id and (a.invoice_id=new.id or a.advance_invoice_id=new.id)) then raise exception 'A canceled or discarded application cannot be reactivated' using errcode='23514';end if;
 if (new.status='cancelled' and old.status is distinct from new.status or new.archived_at is not null and old.archived_at is null) and exists(select 1 from invoice_advance_allocations a join invoices t on t.organization_id=a.organization_id and t.id=a.invoice_id where a.organization_id=new.organization_id and a.advance_invoice_id=new.id and a.reversed_at is null and (t.billing_issued or t.archived_at is null and t.status<>'cancelled')) then raise exception 'Correct the applied target invoice before canceling the advance' using errcode='23514';end if;
 return new;
end $$;
create trigger used_advance_source_guard before update on invoices for each row execute function protect_used_advance_source();
