-- F06: whole minutes, exact hourly prices, no FX and no release of issued facts.
alter table invoice_line_time_entries add column allocated_minutes integer;
alter table invoice_line_time_entries add column price_source_id uuid;
alter table invoice_line_time_entries add constraint minute_allocation_fields check((allocated_minutes is null and price_source_id is null) or (allocated_minutes is not null and allocated_minutes>0 and price_source_id is not null));
alter table invoice_line_time_entries add constraint minute_price_source_tenant_fk foreign key(organization_id,price_source_id) references time_price_sources(organization_id,id);
alter table invoice_lines add column price_base_quantity integer not null default 1 check(price_base_quantity in (1,60));
alter table invoices add column uses_minute_allocations boolean not null default false;
alter table invoice_lines add constraint minute_line_quantity check(price_base_quantity=1 or (unit='min' and quantity>0 and quantity=trunc(quantity)));
create index minute_source_usage on invoice_line_time_entries(organization_id,time_entry_id) where allocated_minutes is not null;
-- A waiting source lock must be followed by a fresh committed reservation read.
-- Reject an unsupported write snapshot rather than relying on a cluster default.
create function require_minute_write_isolation() returns void language plpgsql set search_path=pg_catalog,public as $$
begin
 if current_setting('transaction_isolation')<>'read committed' then raise exception 'Minute writes require read committed isolation' using errcode='40001';end if;
end $$;
create function protect_minute_price_isolation() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin perform require_minute_write_isolation();return new;end $$;
create trigger minute_price_isolation before insert or update on time_price_sources for each row execute function protect_minute_price_isolation();

create function app_minute_invoice_write() returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and m.role in ('owner','admin','finance') and u.status='active' and o.status in ('trial','active','grace_period') and s.plan in ('pro','professional','enterprise'))
$$;
-- Replaces the P17 closed external path with the qualified minute/source guard.
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
 if x.allocated_minutes is null or x.price_source_id is null or x.allocated_minutes<1 or not t.approved or t.submitted_at is null or not t.billable or t.archived_at is not null or t.customer_id is distinct from i.customer_id or i.archived_at is not null or l.price_base_quantity<>60 then raise exception 'Approved matching minute source required' using errcode='23514';end if;
 select * into p from time_price_sources where organization_id=x.organization_id and id=x.price_source_id and time_entry_id=t.id and side='sale' and is_current;
 if p.id is null or p.source_snapshot->>'currency'<>i.currency or (p.source_snapshot->>'unitPrice')::numeric<>l.unit_price or (p.source_snapshot->>'vatRate')::numeric<>l.vat_rate then raise exception 'Confirmed sales price and document currency must match' using errcode='23514';end if;
 select coalesce(sum(allocated_minutes),0) into used_minutes from invoice_line_time_entries where organization_id=x.organization_id and time_entry_id=t.id;
 if used_minutes+x.allocated_minutes>t.recorded_duration_minutes then raise exception 'Performance minutes already reserved' using errcode='23514',constraint='time_minutes_available';end if;
 perform set_config('app.minute_invoice',i.id::text,true);
 update invoices set uses_minute_allocations=true where organization_id=i.organization_id and id=i.id and not uses_minute_allocations;
 return new;
end $$;
drop trigger external_time_invoice_link_guard on invoice_line_time_entries;
create trigger external_time_invoice_link_guard before insert or update or delete on invoice_line_time_entries for each row execute function protect_external_time_invoice_link();

create function minute_line_complete(p_org uuid,p_line uuid) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select coalesce((select
  (case when l.price_base_quantity=1 then not exists(select 1 from invoice_line_time_entries x where x.organization_id=p_org and x.invoice_line_id=l.id and x.allocated_minutes is not null)
   else l.quantity=(select coalesce(sum(x.allocated_minutes),0) from invoice_line_time_entries x where x.organization_id=p_org and x.invoice_line_id=l.id)
    and not exists(select 1 from invoice_line_time_entries x left join time_price_sources p on p.organization_id=x.organization_id and p.id=x.price_source_id left join time_entries t on t.organization_id=x.organization_id and t.id=x.time_entry_id
     where x.organization_id=p_org and x.invoice_line_id=l.id and (p.id is null or t.id is null or x.allocated_minutes is null or p.side<>'sale' or p.time_entry_id<>x.time_entry_id or p.source_snapshot->>'currency'<>i.currency or (p.source_snapshot->>'unitPrice')::numeric<>l.unit_price or (p.source_snapshot->>'vatRate')::numeric<>l.vat_rate or t.customer_id is distinct from i.customer_id)) end)
  from invoice_lines l join invoices i on i.organization_id=l.organization_id and i.id=l.invoice_id where l.organization_id=p_org and l.id=p_line and not(i.status='draft' and i.archived_at is not null)),true)
$$;
create function check_minute_line_complete() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare org uuid;line_id uuid;
begin
 if tg_table_name='invoice_lines' then if tg_op='DELETE' then org:=old.organization_id;line_id:=old.id;else org:=new.organization_id;line_id:=new.id;end if;
 else if tg_op='DELETE' then org:=old.organization_id;line_id:=old.invoice_line_id;else org:=new.organization_id;line_id:=new.invoice_line_id;end if;end if;
 if not minute_line_complete(org,line_id) then raise exception 'Invoice quantity must match its exact price-bound minute reservations' using errcode='23514';end if;return null;
end $$;
create constraint trigger minute_line_complete after insert or update or delete on invoice_lines deferrable initially deferred for each row execute function check_minute_line_complete();
create constraint trigger minute_links_complete after insert or update or delete on invoice_line_time_entries deferrable initially deferred for each row execute function check_minute_line_complete();

-- Remove reservations while the draft parent is still visible, before FK cascade.
create function protect_minute_invoice_line() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare parent invoices%rowtype;
begin
 if tg_op='INSERT' then return new;end if;
 if old.price_base_quantity<>60 and not exists(select 1 from invoice_line_time_entries x where x.organization_id=old.organization_id and x.invoice_line_id=old.id and x.allocated_minutes is not null) then if tg_op='DELETE' then return old;else return new;end if;end if;
 select * into parent from invoices where organization_id=old.organization_id and id=old.invoice_id for update;
 if parent.id is null or parent.status<>'draft' or not app_minute_invoice_write() then raise exception 'Issued minute positions are immutable' using errcode='42501';end if;
 if tg_op='DELETE' then delete from invoice_line_time_entries where organization_id=old.organization_id and invoice_line_id=old.id and allocated_minutes is not null;return old;end if;
 if row(new.organization_id,new.invoice_id,new.id) is distinct from row(old.organization_id,old.invoice_id,old.id) then raise exception 'Minute invoice identity is immutable' using errcode='42501';end if;
 return new;
end $$;
create trigger minute_invoice_line_guard before insert or update or delete on invoice_lines for each row execute function protect_minute_invoice_line();
create function protect_minute_invoice() returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if not old.uses_minute_allocations then
  if tg_op='UPDATE' and new.uses_minute_allocations and current_setting('app.minute_invoice',true) is distinct from old.id::text then raise exception 'Minute usage marker is maintained by allocation' using errcode='42501';end if;
  if tg_op='DELETE' then return old;else return new;end if;
 end if;
 if tg_op='UPDATE' and (not new.uses_minute_allocations or (old.archived_at is not null and new.archived_at is null)) then raise exception 'Minute history cannot be reset or restored silently' using errcode='42501';end if;
 if tg_op='DELETE' or (new.archived_at is not null and old.archived_at is null) then
  if old.status<>'draft' or not app_minute_invoice_write() then raise exception 'Only unissued draft minute reservations may be discarded' using errcode='42501';end if;
  delete from invoice_line_time_entries x using invoice_lines l where x.organization_id=old.organization_id and l.organization_id=x.organization_id and l.id=x.invoice_line_id and l.invoice_id=old.id and x.allocated_minutes is not null;
  if tg_op='DELETE' then return old;else return new;end if;
 end if;
 if row(new.currency,new.customer_id) is distinct from row(old.currency,old.customer_id) and exists(select 1 from invoice_lines l join invoice_line_time_entries x on x.organization_id=l.organization_id and x.invoice_line_id=l.id where l.organization_id=old.organization_id and l.invoice_id=old.id and x.allocated_minutes is not null) then raise exception 'Replace draft allocations before changing currency or customer' using errcode='23514';end if;
 if new.status<>'draft' and (not exists(select 1 from invoice_lines l where l.organization_id=old.organization_id and l.invoice_id=old.id) or new.calculation is null or exists(select 1 from invoice_lines l where l.organization_id=old.organization_id and l.invoice_id=old.id and not minute_line_complete(old.organization_id,l.id))) then raise exception 'Complete minute source proof required before issue' using errcode='23514';end if;
 return new;
end $$;
create trigger minute_invoice_guard before update or delete on invoices for each row execute function protect_minute_invoice();
