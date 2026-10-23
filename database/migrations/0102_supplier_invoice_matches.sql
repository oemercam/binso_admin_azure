-- Immutable AP comparison evidence, dependent on the existing invoice/time owners.
create function app_ap_match_access(p_write boolean default false) returns boolean language sql stable set search_path=pg_catalog,public as $$
 select exists(select 1 from organization_memberships m join app_users u on u.id=m.user_id join organizations o on o.id=m.organization_id join organization_subscriptions s on s.organization_id=m.organization_id
 where m.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and m.user_id=current_setting('app.user_id',true) and m.status='active' and m.module_profile='standard' and m.role in ('owner','admin','finance') and u.status='active' and not o.is_demo
 and s.plan in ('professional','enterprise') and (o.status in ('trial','active','grace_period') or (not p_write and o.status='read_only')))
$$;
create function supplier_invoice_match_input(p_invoice uuid,p_version integer,p_from date,p_until date,p_minutes integer,p_price numeric,p_sources uuid[]) returns jsonb language sql stable set search_path=pg_catalog,public as $$
 select jsonb_build_object('invoice',jsonb_build_object('id',i.id,'version',i.version,'number',i.supplier_invoice_no,'invoiceDate',i.invoice_date::text,'dueDate',i.due_date::text,'currency',i.currency,'netAmount',i.net_amount::text,'vatAmount',i.vat_amount::text,'totalAmount',i.total_amount::text),
 'period',jsonb_build_object('start',p_from::text,'end',p_until::text),'claimed',jsonb_build_object('minutes',p_minutes,'unitPrice',p_price::numeric(12,2)::text),
 'sources',(select jsonb_agg(jsonb_build_object('priceSourceId',p.id,'timeEntryId',t.id,'timeVersion',t.version,'minutes',t.recorded_duration_minutes,'workDate',t.work_date::text,'projectId',t.project_id,'price',p.source_snapshot) order by t.id)
 from time_price_sources p join time_entries t on t.organization_id=p.organization_id and t.id=p.time_entry_id where p.organization_id=i.organization_id and p.id=any(p_sources) and p.side='purchase' and p.is_current and p.time_version=t.version and t.approved and t.submitted_at is not null and t.archived_at is null and t.external_resource_id is not null and t.supplier_id=i.supplier_id and t.work_date between p_from and p_until),
 'receipts',coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'sha256',f.sha256,'scanStatus',f.scan_status) order by f.id) from file_objects f where f.organization_id=i.organization_id and f.supplier_invoice_id=i.id and f.purpose='supplier_invoice_receipt' and f.archived_at is null),'[]'::jsonb))
 from supplier_invoices i where i.organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and i.id=p_invoice and i.version=p_version and i.archived_at is null
 and cardinality(p_sources) between 1 and 100 and cardinality(p_sources)=(select count(distinct v) from unnest(p_sources) v)
 and cardinality(p_sources)=(select count(*) from time_price_sources p join time_entries t on t.organization_id=p.organization_id and t.id=p.time_entry_id where p.organization_id=i.organization_id and p.id=any(p_sources) and p.side='purchase' and p.is_current and p.time_version=t.version and t.approved and t.submitted_at is not null and t.archived_at is null and t.external_resource_id is not null and t.supplier_id=i.supplier_id and t.work_date between p_from and p_until)
$$;
create table supplier_invoice_matches(
 id uuid primary key default gen_random_uuid(),organization_id uuid not null,invoice_id uuid not null,invoice_version integer not null check(invoice_version>0),
 period_start date not null,period_end date not null check(period_end>=period_start and period_end-period_start<=365),reported_minutes integer not null check(reported_minutes between 0 and 144000),reported_unit_price numeric(12,2) not null check(reported_unit_price>=0),
 price_source_ids uuid[] not null check(cardinality(price_source_ids) between 1 and 100),input_snapshot jsonb not null default '{}',created_by_user_id text not null,created_at timestamptz not null default now(),
 unique(organization_id,id),foreign key(organization_id,invoice_id) references supplier_invoices(organization_id,id));
alter table supplier_invoice_matches enable row level security;
alter table supplier_invoice_matches force row level security;
create policy ap_match_read on supplier_invoice_matches for select using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access());
create policy ap_match_insert on supplier_invoice_matches for insert with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and app_ap_match_access(true));
create policy ap_match_replay on business_idempotency_keys as restrictive for all
 using(operation<>'supplier_invoice.match' or app_ap_match_access())
 with check(operation<>'supplier_invoice.match' or app_ap_match_access(true));
create function protect_supplier_invoice_match() returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare expected jsonb;state text;
begin
 if tg_op<>'INSERT' then raise exception 'AP comparison evidence is immutable' using errcode='42501';end if;
 if not app_ap_match_access(true) or new.created_by_user_id is distinct from current_setting('app.user_id',true) then raise exception 'Current purchasing actor required' using errcode='42501';end if;
 perform require_minute_write_isolation();
 select status into state from supplier_invoices where organization_id=new.organization_id and id=new.invoice_id and version=new.invoice_version and archived_at is null for update;
 if state is distinct from 'draft' then raise exception 'Current draft required' using errcode='23514';end if;
 perform t.id from time_entries t join time_price_sources p on p.organization_id=t.organization_id and p.time_entry_id=t.id where t.organization_id=new.organization_id and p.id=any(new.price_source_ids) order by t.id for update of t;
 expected:=supplier_invoice_match_input(new.invoice_id,new.invoice_version,new.period_start,new.period_end,new.reported_minutes,new.reported_unit_price,new.price_source_ids);
 if expected is null then raise exception 'Current approved purchase sources required' using errcode='23514';end if;
 if new.input_snapshot<>'{}'::jsonb and new.input_snapshot is distinct from expected then raise exception 'AP comparison must use actual source facts' using errcode='23514';end if;
 new.input_snapshot:=expected;new.created_at:=clock_timestamp();return new;
end $$;
create trigger supplier_invoice_match_guard before insert or update or delete on supplier_invoice_matches for each row execute function protect_supplier_invoice_match();
