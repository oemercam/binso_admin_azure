-- Binso Admin - PostgreSQL target schema (production design draft)
-- The v5 demo still uses browser localStorage. This schema is for the next Azure PostgreSQL step.

create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  customer_no text not null unique,
  name text not null,
  legal_name text,
  contact_name text,
  email text,
  phone text,
  address text,
  zip text,
  city text,
  country text not null default 'Schweiz',
  uid text,
  payment_days integer not null default 30 check (payment_days between 0 and 180),
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_no text not null unique,
  name text not null,
  contact_name text,
  email text,
  uid text,
  payment_days integer not null default 30,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  entra_oid text unique,
  name text not null,
  email text not null unique,
  role text not null check (role in ('owner','admin','finance','employee')),
  employment_type text not null check (employment_type in ('salary','hourly')),
  target_hours numeric(8,2) not null default 0,
  internal_cost_rate numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  quote_no text not null unique,
  customer_id uuid not null references customers(id),
  title text not null,
  valid_until date,
  status text not null check (status in ('draft','sent','accepted','declined','expired')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_lines (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  source_quote_id uuid references quotes(id),
  name text not null,
  end_customer_name text,
  prime_contractor_name text,
  mandate_ref text,
  procurement_ref text,
  budget_hours numeric(12,2) not null default 0,
  sales_rate numeric(12,2) not null default 0,
  cost_rate numeric(12,2) not null default 0,
  billing_model text not null check (billing_model in ('time','fixed','mixed')),
  status text not null check (status in ('active','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists time_entries (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id),
  employee_id uuid references employees(id),
  supplier_id uuid references suppliers(id),
  person_name text not null,
  worker_type text not null check (worker_type in ('employee','hourly_employee','external')),
  work_date date not null,
  hours numeric(8,2) not null check (hours > 0),
  description text,
  billable boolean not null default true,
  approved boolean not null default false,
  sales_rate numeric(12,2) not null default 0,
  internal_cost_rate numeric(12,2) not null default 0,
  invoiced_invoice_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique,
  customer_id uuid not null references customers(id),
  order_id uuid references orders(id),
  period text,
  issue_date date not null,
  due_date date not null,
  status text not null check (status in ('draft','sent','partial','paid','overdue','cancelled')),
  subtotal numeric(14,2) not null default 0,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table time_entries
  drop constraint if exists fk_time_entries_invoice;
alter table time_entries
  add constraint fk_time_entries_invoice foreign key (invoiced_invoice_id) references invoices(id);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  sort_order integer not null default 0,
  description text not null,
  quantity numeric(12,2) not null,
  unit text not null,
  unit_price numeric(12,2) not null,
  vat_rate numeric(5,2) not null default 8.1
);

create table if not exists invoice_line_time_entries (
  invoice_line_id uuid not null references invoice_lines(id) on delete cascade,
  time_entry_id uuid not null references time_entries(id),
  primary key (invoice_line_id, time_entry_id)
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  method text not null,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id),
  order_id uuid references orders(id),
  supplier_invoice_no text not null,
  invoice_date date not null,
  due_date date not null,
  net_amount numeric(14,2) not null,
  vat_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null,
  status text not null check (status in ('open','paid','review')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_time_entries_order_date on time_entries(order_id, work_date);
create index if not exists idx_time_entries_unbilled on time_entries(order_id, invoiced_invoice_id) where billable = true and approved = true;
create index if not exists idx_invoices_customer_status on invoices(customer_id, status);
create index if not exists idx_supplier_invoices_order on supplier_invoices(order_id);

-- v6 document configuration / communication fields
alter table quotes add column if not exists intro_text text;
alter table quotes add column if not exists closing_text text;
alter table quotes add column if not exists email_to text;
alter table quotes add column if not exists email_subject text;
alter table quotes add column if not exists sent_at timestamptz;

alter table invoices add column if not exists intro_text text;
alter table invoices add column if not exists closing_text text;
alter table invoices add column if not exists email_to text;
alter table invoices add column if not exists email_subject text;
alter table invoices add column if not exists sent_at timestamptz;
alter table invoices add column if not exists reminder_level integer not null default 0 check (reminder_level between 0 and 3);

create table if not exists company_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  zip text not null,
  city text not null,
  country text not null default 'Schweiz',
  email text not null,
  phone text,
  uid text,
  iban text not null,
  bank_name text,
  website text,
  updated_at timestamptz not null default now()
);

create table if not exists document_templates (
  key text primary key check (key in ('quote','invoice','reminder')),
  label text not null,
  intro_text text not null default '',
  closing_text text not null default '',
  email_subject text not null default '',
  email_text text not null default '',
  footer_text text not null default '',
  updated_at timestamptz not null default now()
);
