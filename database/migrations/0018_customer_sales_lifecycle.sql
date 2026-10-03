-- Binso One customer-centric sales lifecycle.
-- Customer is the business relationship; contacts are optional people within that customer.
-- Quotes can become orders/projects and/or invoices. Invoice data is snapshotted, never live-linked.

alter table quotes
  add column if not exists contact_id uuid references customer_contacts(id) on delete set null,
  add column if not exists accepted_at timestamptz,
  add column if not exists declined_at timestamptz,
  add column if not exists customer_response_note text;

alter table invoices
  add column if not exists source_quote_id uuid references quotes(id) on delete set null,
  add column if not exists contact_id uuid references customer_contacts(id) on delete set null;

create index if not exists idx_quotes_customer_status
  on quotes(customer_id, status, updated_at desc);

create index if not exists idx_quotes_contact
  on quotes(contact_id) where contact_id is not null;

create index if not exists idx_invoices_source_quote
  on invoices(source_quote_id) where source_quote_id is not null;

create index if not exists idx_invoices_contact
  on invoices(contact_id) where contact_id is not null;

-- Keep response timestamps consistent with the quote lifecycle.
create or replace function enforce_quote_response_state()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    new.accepted_at := coalesce(new.accepted_at, now());
    new.declined_at := null;
  elsif new.status = 'declined' and old.status is distinct from 'declined' then
    new.declined_at := coalesce(new.declined_at, now());
    new.accepted_at := null;
  elsif new.status not in ('accepted','declined') then
    new.accepted_at := null;
    new.declined_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_quotes_response_state on quotes;
create trigger trg_quotes_response_state
before update of status on quotes
for each row execute function enforce_quote_response_state();

-- Tenant-safe integrity: a derived invoice must belong to the same customer as its source quote.
create or replace function enforce_invoice_source_quote_customer()
returns trigger
language plpgsql
as $$
declare
  quote_customer uuid;
begin
  if new.source_quote_id is null then
    return new;
  end if;

  select customer_id into quote_customer from quotes where id = new.source_quote_id;
  if quote_customer is null or quote_customer <> new.customer_id then
    raise exception 'source quote and invoice customer must match';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_invoices_source_quote_customer on invoices;
create trigger trg_invoices_source_quote_customer
before insert or update of source_quote_id, customer_id on invoices
for each row execute function enforce_invoice_source_quote_customer();
