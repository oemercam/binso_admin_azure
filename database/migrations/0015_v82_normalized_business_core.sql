-- V82.0 production architecture: canonical per-record persistence, optimistic concurrency,
-- tenant-aware identifiers, idempotency primitives and concurrency-safe document numbering.
-- Additive/expand migration only. Legacy tenant_business_state remains available for
-- compatibility while core domains are migrated by the application strangler layer.

-- Preserve all current domain fields while moving the source of truth out of the JSON snapshot.
alter table quotes add column if not exists issue_date date;
alter table quotes add column if not exists recipient_name text;
alter table quotes add column if not exists recipient_address text;
alter table quotes add column if not exists recipient_zip text;
alter table quotes add column if not exists recipient_city text;
alter table quotes add column if not exists recipient_country text;
alter table quotes add column if not exists recipient_email text;
alter table quotes add column if not exists reference text;
alter table quote_lines add column if not exists vat_rate numeric(5,2);
alter table time_entries add column if not exists person_external_id text;
alter table invoices add column if not exists recipient_name text;
alter table invoices add column if not exists recipient_address text;
alter table invoices add column if not exists recipient_zip text;
alter table invoices add column if not exists recipient_city text;
alter table invoices add column if not exists recipient_country text;
alter table invoices add column if not exists recipient_email text;
alter table invoices add column if not exists reference text;
alter table invoices add column if not exists last_reminder_at timestamptz;

-- Stable external IDs let the existing UI keep its string IDs while PostgreSQL keeps UUID PKs.
do $$
declare t text;
begin
  foreach t in array array['customers','customer_contacts','quotes','orders','time_entries','invoices','payments','employees','contracts'] loop
    execute format('alter table %I add column if not exists external_id text', t);
    execute format('update %I set external_id=id::text where external_id is null', t);
    execute format('alter table %I alter column external_id set not null', t);
    execute format('alter table %I add column if not exists version integer not null default 1 check (version > 0)', t);
    execute format('create unique index if not exists %I on %I(organization_id, external_id)', 'uq_'||t||'_org_external_id', t);
  end loop;
end $$;

-- Child rows are tenant-owned too; make tenant ownership explicit for RLS and tenant-aware FKs.
alter table quote_lines add column if not exists organization_id uuid references organizations(id);
alter table quote_lines add column if not exists external_id text;
update quote_lines ql set organization_id=q.organization_id, external_id=coalesce(ql.external_id, ql.id::text)
from quotes q where q.id=ql.quote_id and (ql.organization_id is null or ql.external_id is null);
alter table quote_lines alter column organization_id set not null;
alter table quote_lines alter column external_id set not null;
create unique index if not exists uq_quote_lines_org_external_id on quote_lines(organization_id, external_id);

alter table invoice_lines add column if not exists organization_id uuid references organizations(id);
alter table invoice_lines add column if not exists external_id text;
update invoice_lines il set organization_id=i.organization_id, external_id=coalesce(il.external_id, il.id::text)
from invoices i where i.id=il.invoice_id and (il.organization_id is null or il.external_id is null);
alter table invoice_lines alter column organization_id set not null;
alter table invoice_lines alter column external_id set not null;
create unique index if not exists uq_invoice_lines_org_external_id on invoice_lines(organization_id, external_id);

alter table contract_lines add column if not exists organization_id uuid references organizations(id);
alter table contract_lines add column if not exists external_id text;
update contract_lines cl set organization_id=c.organization_id, external_id=coalesce(cl.external_id, cl.id::text)
from contracts c where c.id=cl.contract_id and (cl.organization_id is null or cl.external_id is null);
alter table contract_lines alter column organization_id set not null;
alter table contract_lines alter column external_id set not null;
create unique index if not exists uq_contract_lines_org_external_id on contract_lines(organization_id, external_id);

-- Global document number uniqueness blocks legitimate identical numbering across tenants.
alter table customers drop constraint if exists customers_customer_no_key;
alter table quotes drop constraint if exists quotes_quote_no_key;
alter table invoices drop constraint if exists invoices_invoice_no_key;
alter table contracts drop constraint if exists contracts_contract_no_key;
alter table credit_notes drop constraint if exists credit_notes_credit_no_key;
create unique index if not exists uq_customers_org_customer_no on customers(organization_id, customer_no);
create unique index if not exists uq_quotes_org_quote_no on quotes(organization_id, quote_no);
create unique index if not exists uq_invoices_org_invoice_no on invoices(organization_id, invoice_no);
create unique index if not exists uq_contracts_org_contract_no on contracts(organization_id, contract_no);
create unique index if not exists uq_credit_notes_org_credit_no on credit_notes(organization_id, credit_no);

-- Employee e-mail must also be tenant-scoped.
alter table employees drop constraint if exists employees_email_key;

-- Stable pagination/index access paths based on actual tenant/list query patterns.
create index if not exists idx_customers_org_status_created on customers(organization_id,status,created_at desc,id desc);
create index if not exists idx_contacts_org_customer on customer_contacts(organization_id,customer_id,created_at desc);
create index if not exists idx_quotes_org_status_created on quotes(organization_id,status,created_at desc,id desc);
create index if not exists idx_quotes_org_customer_created on quotes(organization_id,customer_id,created_at desc);
create index if not exists idx_orders_org_status_created on orders(organization_id,status,created_at desc,id desc);
create index if not exists idx_orders_org_customer_created on orders(organization_id,customer_id,created_at desc);
create index if not exists idx_time_org_date on time_entries(organization_id,work_date desc,id desc);
create index if not exists idx_time_org_order_date on time_entries(organization_id,order_id,work_date desc,id desc);
create index if not exists idx_invoices_org_status_created on invoices(organization_id,status,created_at desc,id desc);
create index if not exists idx_invoices_org_customer_created on invoices(organization_id,customer_id,created_at desc);
create index if not exists idx_payments_org_invoice_date on payments(organization_id,invoice_id,payment_date desc,id desc);
create index if not exists idx_employees_org_active_name on employees(organization_id,active,name,id);
create index if not exists idx_contracts_org_status_created on contracts(organization_id,status,created_at desc,id desc);

-- Tenant-aware relational integrity. Existing single-column UUID FKs remain for compatibility;
-- these composite NOT VALID FKs additionally guarantee that new child references cannot cross tenants.
create unique index if not exists uq_customers_org_id on customers(organization_id,id);
create unique index if not exists uq_quotes_org_id on quotes(organization_id,id);
create unique index if not exists uq_orders_org_id on orders(organization_id,id);
create unique index if not exists uq_invoices_org_id on invoices(organization_id,id);
create unique index if not exists uq_contracts_org_id on contracts(organization_id,id);
create unique index if not exists uq_employees_org_id on employees(organization_id,id);
create unique index if not exists uq_suppliers_org_id on suppliers(organization_id,id);

alter table customer_contacts drop constraint if exists fk_customer_contacts_tenant_customer;
alter table customer_contacts add constraint fk_customer_contacts_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table quotes drop constraint if exists fk_quotes_tenant_customer;
alter table quotes add constraint fk_quotes_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table quote_lines drop constraint if exists fk_quote_lines_tenant_quote;
alter table quote_lines add constraint fk_quote_lines_tenant_quote foreign key(organization_id,quote_id) references quotes(organization_id,id) not valid;
alter table orders drop constraint if exists fk_orders_tenant_customer;
alter table orders add constraint fk_orders_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table orders drop constraint if exists fk_orders_tenant_quote;
alter table orders add constraint fk_orders_tenant_quote foreign key(organization_id,source_quote_id) references quotes(organization_id,id) not valid;
alter table orders drop constraint if exists fk_orders_tenant_contract;
alter table orders add constraint fk_orders_tenant_contract foreign key(organization_id,contract_id) references contracts(organization_id,id) not valid;
alter table time_entries drop constraint if exists fk_time_entries_tenant_order;
alter table time_entries add constraint fk_time_entries_tenant_order foreign key(organization_id,order_id) references orders(organization_id,id) not valid;
alter table time_entries drop constraint if exists fk_time_entries_tenant_invoice;
alter table time_entries add constraint fk_time_entries_tenant_invoice foreign key(organization_id,invoiced_invoice_id) references invoices(organization_id,id) not valid;
alter table invoices drop constraint if exists fk_invoices_tenant_customer;
alter table invoices add constraint fk_invoices_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table invoices drop constraint if exists fk_invoices_tenant_order;
alter table invoices add constraint fk_invoices_tenant_order foreign key(organization_id,order_id) references orders(organization_id,id) not valid;
alter table invoices drop constraint if exists fk_invoices_tenant_contract;
alter table invoices add constraint fk_invoices_tenant_contract foreign key(organization_id,contract_id) references contracts(organization_id,id) not valid;
alter table invoice_lines drop constraint if exists fk_invoice_lines_tenant_invoice;
alter table invoice_lines add constraint fk_invoice_lines_tenant_invoice foreign key(organization_id,invoice_id) references invoices(organization_id,id) not valid;
alter table payments drop constraint if exists fk_payments_tenant_invoice;
alter table payments add constraint fk_payments_tenant_invoice foreign key(organization_id,invoice_id) references invoices(organization_id,id) not valid;
alter table contracts drop constraint if exists fk_contracts_tenant_customer;
alter table contracts add constraint fk_contracts_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table contract_lines drop constraint if exists fk_contract_lines_tenant_contract;
alter table contract_lines add constraint fk_contract_lines_tenant_contract foreign key(organization_id,contract_id) references contracts(organization_id,id) not valid;

-- Atomic per-tenant counters; allocation uses UPDATE ... RETURNING inside the caller transaction.
create table if not exists business_document_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  kind text not null check (kind in ('customer','quote','order','invoice','contract','credit_note')),
  period text not null default '',
  prefix text not null default '',
  next_value bigint not null default 1 check (next_value > 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, kind, period)
);

-- Generic idempotency registry for retry-safe business mutations.
create table if not exists business_idempotency_keys (
  organization_id uuid not null references organizations(id) on delete cascade,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  response_json jsonb,
  created_by_user_id text,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  primary key (organization_id, operation, idempotency_key)
);
create index if not exists idx_business_idempotency_expiry on business_idempotency_keys(expires_at) where expires_at is not null;

-- RLS on all newly tenant-addressable tables and child rows.
do $$
declare t text;
begin
  foreach t in array array['customers','customer_contacts','quotes','quote_lines','orders','time_entries','invoices','invoice_lines','payments','employees','contracts','contract_lines','business_document_counters','business_idempotency_keys'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($p$create policy tenant_isolation on %I
      using (organization_id::text = nullif(current_setting('app.organization_id', true), ''))
      with check (organization_id::text = nullif(current_setting('app.organization_id', true), ''))$p$, t);
  end loop;
end $$;

-- Optimistic concurrency trigger for the core mutable records.
create or replace function bump_business_record_version() returns trigger language plpgsql as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['customers','quotes','orders','invoices','contracts'] loop
    execute format('drop trigger if exists trg_%I_version on %I', t, t);
    execute format('create trigger trg_%I_version before update on %I for each row execute function bump_business_record_version()', t, t);
  end loop;
end $$;

-- V82.0 fidelity extension: preserve workflow overrides, source links and the remaining
-- finance/workforce collections while the JSON snapshot is strangled out.
alter table customers add column if not exists workflow_override jsonb;
alter table employees add column if not exists settlement_override jsonb;
alter table suppliers add column if not exists settlement_override jsonb;
alter table contracts add column if not exists workflow_override jsonb;
alter table invoices add column if not exists source_quote_id uuid;
alter table invoice_lines add column if not exists source_time_external_ids text[] not null default '{}';
alter table invoice_lines add column if not exists source_expense_external_ids text[] not null default '{}';

-- Explicit archive marker. Financial records remain retained; application list queries
-- hide only records that were deliberately archived through a future policy-controlled action.
do $$
declare t text;
begin
  foreach t in array array['customers','customer_contacts','quotes','orders','time_entries','invoices','payments','employees','contracts','suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('alter table %I add column if not exists archived_at timestamptz', t);
  end loop;
end $$;

-- Extend stable external IDs to finance/supporting business records that are still used by
-- BusinessStore. This prevents those collections from remaining authoritative JSON data.
do $$
declare t text;
begin
  foreach t in array array['suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('alter table %I add column if not exists external_id text', t);
    execute format('update %I set external_id=id::text where external_id is null', t);
    execute format('alter table %I alter column external_id set not null', t);
    execute format('alter table %I add column if not exists version integer not null default 1 check (version > 0)', t);
    execute format('create unique index if not exists %I on %I(organization_id, external_id)', 'uq_'||t||'_org_external_id', t);
  end loop;
end $$;

create unique index if not exists uq_expenses_org_id on expenses(organization_id,id);
create unique index if not exists uq_credit_notes_org_id on credit_notes(organization_id,id);
create unique index if not exists uq_supplier_invoices_org_id on supplier_invoices(organization_id,id);
create unique index if not exists uq_customer_activities_org_id on customer_activities(organization_id,id);

-- Tenant-local credit numbering is allocated atomically through business_document_counters.
alter table credit_notes drop constraint if exists credit_notes_credit_no_key;
create unique index if not exists uq_credit_notes_org_credit_no on credit_notes(organization_id,credit_no);

-- Tenant-aware source relationships introduced by V82.
alter table invoices drop constraint if exists fk_invoices_tenant_source_quote;
alter table invoices add constraint fk_invoices_tenant_source_quote foreign key(organization_id,source_quote_id) references quotes(organization_id,id) not valid;
alter table expenses drop constraint if exists fk_expenses_tenant_customer;
alter table expenses add constraint fk_expenses_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table expenses drop constraint if exists fk_expenses_tenant_order;
alter table expenses add constraint fk_expenses_tenant_order foreign key(organization_id,order_id) references orders(organization_id,id) not valid;
alter table expenses drop constraint if exists fk_expenses_tenant_contract;
alter table expenses add constraint fk_expenses_tenant_contract foreign key(organization_id,contract_id) references contracts(organization_id,id) not valid;
alter table expenses drop constraint if exists fk_expenses_tenant_invoice;
alter table expenses add constraint fk_expenses_tenant_invoice foreign key(organization_id,invoiced_invoice_id) references invoices(organization_id,id) not valid;
alter table credit_notes drop constraint if exists fk_credit_notes_tenant_invoice;
alter table credit_notes add constraint fk_credit_notes_tenant_invoice foreign key(organization_id,invoice_id) references invoices(organization_id,id) not valid;
alter table credit_notes drop constraint if exists fk_credit_notes_tenant_customer;
alter table credit_notes add constraint fk_credit_notes_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_supplier;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_supplier foreign key(organization_id,supplier_id) references suppliers(organization_id,id) not valid;
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_order;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_order foreign key(organization_id,order_id) references orders(organization_id,id) not valid;
alter table customer_activities drop constraint if exists fk_customer_activities_tenant_customer;
alter table customer_activities add constraint fk_customer_activities_tenant_customer foreign key(organization_id,customer_id) references customers(organization_id,id) not valid;

-- Query paths for the newly normalized finance records.
create index if not exists idx_suppliers_org_status_created on suppliers(organization_id,status,created_at desc,id desc);
create index if not exists idx_supplier_invoices_org_status_created on supplier_invoices(organization_id,status,created_at desc,id desc);
create index if not exists idx_expenses_org_date on expenses(organization_id,expense_date desc,id desc);
create index if not exists idx_expenses_org_customer_date on expenses(organization_id,customer_id,expense_date desc,id desc);
create index if not exists idx_credit_notes_org_date on credit_notes(organization_id,credit_date desc,id desc);
create index if not exists idx_customer_activities_org_customer_created on customer_activities(organization_id,customer_id,created_at desc,id desc);

-- RLS must also cover the newly normalized supporting collections.
do $$
declare t text;
begin
  foreach t in array array['suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format($p$create policy tenant_isolation on %I
      using (organization_id::text = nullif(current_setting('app.organization_id', true), ''))
      with check (organization_id::text = nullif(current_setting('app.organization_id', true), ''))$p$, t);
  end loop;
end $$;

-- Tenant-own invoice source association rows as well.
alter table invoice_line_expenses add column if not exists organization_id uuid references organizations(id);
update invoice_line_expenses x set organization_id=l.organization_id from invoice_lines l where l.id=x.invoice_line_id and x.organization_id is null;
alter table invoice_line_expenses alter column organization_id set not null;
alter table invoice_line_expenses enable row level security;
drop policy if exists tenant_isolation on invoice_line_expenses;
create policy tenant_isolation on invoice_line_expenses
  using (organization_id::text = nullif(current_setting('app.organization_id', true), ''))
  with check (organization_id::text = nullif(current_setting('app.organization_id', true), ''));

alter table supplier_invoices add column if not exists period text;
alter table supplier_invoices add column if not exists hours numeric(12,2);

alter table invoice_line_expenses drop constraint if exists fk_invoice_line_expenses_tenant_line;
alter table invoice_line_expenses add constraint fk_invoice_line_expenses_tenant_line foreign key(organization_id,invoice_line_id) references invoice_lines(organization_id,id) on delete cascade not valid;
alter table invoice_line_expenses drop constraint if exists fk_invoice_line_expenses_tenant_expense;
alter table invoice_line_expenses add constraint fk_invoice_line_expenses_tenant_expense foreign key(organization_id,expense_id) references expenses(organization_id,id) not valid;

-- Every V82 mutable normalized row carries an update timestamp + revision counter.
do $$
declare t text;
begin
  foreach t in array array['customers','customer_contacts','quotes','orders','time_entries','invoices','payments','employees','contracts','suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('alter table %I add column if not exists updated_at timestamptz not null default now()', t);
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array['customer_contacts','time_entries','payments','employees','suppliers','supplier_invoices','expenses','credit_notes','customer_activities'] loop
    execute format('drop trigger if exists trg_%I_version on %I', t, t);
    execute format('create trigger trg_%I_version before update on %I for each row execute function bump_business_record_version()', t, t);
  end loop;
end $$;
