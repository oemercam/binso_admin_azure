-- V71 consolidated SaaS foundation: strict tenant ownership, RBAC-ready access,
-- subscription lifecycle, usage limits and audited support access.

-- 1. Tenant lifecycle. Keep business tenancy separate from subscription state.
alter table organizations drop constraint if exists organizations_status_check;
update organizations set status = 'suspended' where status = 'inactive';
alter table organizations add constraint organizations_status_check
  check (status in ('trial','active','grace_period','read_only','suspended','cancelled','archived'));

alter table organization_subscriptions drop constraint if exists organization_subscriptions_status_check;
alter table organization_subscriptions add constraint organization_subscriptions_status_check
  check (status in ('trial','active','past_due','grace_period','read_only','suspended','expired','cancelled'));
alter table organization_subscriptions add column if not exists grace_until timestamptz;

alter table platform_tenants drop constraint if exists platform_tenants_platform_status_check;
alter table platform_tenants add constraint platform_tenants_platform_status_check
  check (platform_status in ('trial','active','past_due','grace_period','read_only','suspended','expired','cancelled','archived'));

-- 2. Plan limits are data, not UI-only metadata.
alter table organization_entitlements add column if not exists max_monthly_documents integer not null default 500 check (max_monthly_documents > 0);
alter table organization_entitlements add column if not exists max_api_requests_per_month integer not null default 10000 check (max_api_requests_per_month > 0);

create table if not exists organization_usage_counters (
  organization_id uuid not null references organizations(id) on delete cascade,
  period text not null check (period ~ '^[0-9]{4}-[0-9]{2}$'),
  metric text not null check (metric in ('users','storage_mb','documents','api_requests')),
  value bigint not null default 0 check (value >= 0),
  updated_at timestamptz not null default now(),
  primary key (organization_id, period, metric)
);

-- 3. Every persisted business child row receives tenant ownership as well.
alter table quote_lines add column if not exists organization_id uuid references organizations(id);
alter table contract_lines add column if not exists organization_id uuid references organizations(id);
alter table invoice_lines add column if not exists organization_id uuid references organizations(id);
alter table invoice_line_time_entries add column if not exists organization_id uuid references organizations(id);

update quote_lines l set organization_id = q.organization_id from quotes q where q.id = l.quote_id and l.organization_id is null;
update contract_lines l set organization_id = c.organization_id from contracts c where c.id = l.contract_id and l.organization_id is null;
update invoice_lines l set organization_id = i.organization_id from invoices i where i.id = l.invoice_id and l.organization_id is null;
update invoice_line_time_entries x set organization_id = l.organization_id from invoice_lines l where l.id = x.invoice_line_id and x.organization_id is null;

alter table quote_lines alter column organization_id set not null;
alter table contract_lines alter column organization_id set not null;
alter table invoice_lines alter column organization_id set not null;
alter table invoice_line_time_entries alter column organization_id set not null;

-- 4. Tenant-local identifiers. The same person, number or supplier may exist in different tenants.
alter table suppliers drop constraint if exists suppliers_supplier_no_key;
alter table employees drop constraint if exists employees_email_key;
alter table employees drop constraint if exists employees_entra_oid_key;
alter table invoices drop constraint if exists invoices_invoice_no_key;
create unique index if not exists uq_suppliers_org_supplier_no on suppliers(organization_id, supplier_no);
create unique index if not exists uq_employees_org_email_ci on employees(organization_id, lower(email));
create unique index if not exists uq_employees_org_entra_oid on employees(organization_id, entra_oid) where entra_oid is not null;
create unique index if not exists uq_invoices_org_invoice_no on invoices(organization_id, invoice_no);
create unique index if not exists uq_company_profile_org on company_profile(organization_id);

-- 5. Composite keys let PostgreSQL enforce that relationships never cross tenant boundaries.
create unique index if not exists uq_customers_org_id on customers(organization_id, id);
create unique index if not exists uq_suppliers_org_id on suppliers(organization_id, id);
create unique index if not exists uq_employees_org_id on employees(organization_id, id);
create unique index if not exists uq_quotes_org_id on quotes(organization_id, id);
create unique index if not exists uq_orders_org_id on orders(organization_id, id);
create unique index if not exists uq_time_entries_org_id on time_entries(organization_id, id);
create unique index if not exists uq_invoices_org_id on invoices(organization_id, id);
create unique index if not exists uq_contracts_org_id on contracts(organization_id, id);
create unique index if not exists uq_quote_lines_org_id on quote_lines(organization_id, id);
create unique index if not exists uq_contract_lines_org_id on contract_lines(organization_id, id);
create unique index if not exists uq_invoice_lines_org_id on invoice_lines(organization_id, id);

alter table quotes drop constraint if exists fk_quotes_tenant_customer;
alter table quotes add constraint fk_quotes_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table orders drop constraint if exists fk_orders_tenant_customer;
alter table orders add constraint fk_orders_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table orders drop constraint if exists fk_orders_tenant_quote;
alter table orders add constraint fk_orders_tenant_quote foreign key (organization_id, source_quote_id) references quotes(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_order;
alter table time_entries add constraint fk_time_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_employee;
alter table time_entries add constraint fk_time_tenant_employee foreign key (organization_id, employee_id) references employees(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_supplier;
alter table time_entries add constraint fk_time_tenant_supplier foreign key (organization_id, supplier_id) references suppliers(organization_id, id);
alter table time_entries drop constraint if exists fk_time_tenant_invoice;
alter table time_entries add constraint fk_time_tenant_invoice foreign key (organization_id, invoiced_invoice_id) references invoices(organization_id, id);
alter table invoices drop constraint if exists fk_invoices_tenant_customer;
alter table invoices add constraint fk_invoices_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table invoices drop constraint if exists fk_invoices_tenant_order;
alter table invoices add constraint fk_invoices_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table payments drop constraint if exists fk_payments_tenant_invoice;
alter table payments add constraint fk_payments_tenant_invoice foreign key (organization_id, invoice_id) references invoices(organization_id, id);
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_supplier;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_supplier foreign key (organization_id, supplier_id) references suppliers(organization_id, id);
alter table supplier_invoices drop constraint if exists fk_supplier_invoices_tenant_order;
alter table supplier_invoices add constraint fk_supplier_invoices_tenant_order foreign key (organization_id, order_id) references orders(organization_id, id);
alter table contracts drop constraint if exists fk_contracts_tenant_customer;
alter table contracts add constraint fk_contracts_tenant_customer foreign key (organization_id, customer_id) references customers(organization_id, id);
alter table quote_lines drop constraint if exists fk_quote_lines_tenant_quote;
alter table quote_lines add constraint fk_quote_lines_tenant_quote foreign key (organization_id, quote_id) references quotes(organization_id, id) on delete cascade;
alter table contract_lines drop constraint if exists fk_contract_lines_tenant_contract;
alter table contract_lines add constraint fk_contract_lines_tenant_contract foreign key (organization_id, contract_id) references contracts(organization_id, id) on delete cascade;
alter table invoice_lines drop constraint if exists fk_invoice_lines_tenant_invoice;
alter table invoice_lines add constraint fk_invoice_lines_tenant_invoice foreign key (organization_id, invoice_id) references invoices(organization_id, id) on delete cascade;
alter table invoice_line_time_entries drop constraint if exists fk_invoice_line_time_entries_tenant_line;
alter table invoice_line_time_entries add constraint fk_invoice_line_time_entries_tenant_line foreign key (organization_id, invoice_line_id) references invoice_lines(organization_id, id) on delete cascade;
alter table invoice_line_time_entries drop constraint if exists fk_invoice_line_time_entries_tenant_time;
alter table invoice_line_time_entries add constraint fk_invoice_line_time_entries_tenant_time foreign key (organization_id, time_entry_id) references time_entries(organization_id, id);

-- 6. Explicit role catalogue. Membership.role stays as the compatible standard-role code;
-- role_id enables tenant-defined roles later without changing business tables.
create table if not exists organization_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  code text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (organization_id, id)
);

create table if not exists organization_role_permissions (
  organization_id uuid not null references organizations(id) on delete cascade,
  role_id uuid not null,
  permission text not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, role_id, permission),
  foreign key (organization_id, role_id) references organization_roles(organization_id, id) on delete cascade
);

alter table organization_memberships add column if not exists role_id uuid;
create index if not exists idx_memberships_org_role_id on organization_memberships(organization_id, role_id);

-- 7. Support access is explicit, time-bound and auditable. Platform roles alone do not imply tenant-data access.
create table if not exists support_access_grants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  requested_by_user_id text not null,
  approved_by_user_id text,
  platform_actor_user_id text,
  reason text not null check (char_length(reason) between 5 and 1000),
  status text not null default 'requested' check (status in ('requested','approved','active','revoked','expired')),
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);
create index if not exists idx_support_access_org_status on support_access_grants(organization_id, status, valid_until);

-- 8. RLS applies to every tenant-owned table, including child, access and usage tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'quote_lines','contract_lines','invoice_lines','invoice_line_time_entries',
    'organization_roles','organization_role_permissions','organization_usage_counters','support_access_grants'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I using (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid) with check (organization_id = nullif(current_setting(''app.organization_id'', true), '''')::uuid)',
      t
    );
  end loop;
end $$;

-- 9. Existing system roles are represented in the tenant role catalogue.
insert into organization_roles (organization_id, code, name, is_system)
select o.id, r.code, r.name, true
from organizations o
cross join (values
  ('owner','Inhaber'),
  ('admin','Administration'),
  ('finance','Finanzen'),
  ('employee','Mitarbeitende')
) as r(code,name)
on conflict (organization_id, code) do update set name = excluded.name, is_system = true;

update organization_memberships m
set role_id = r.id
from organization_roles r
where r.organization_id = m.organization_id and r.code = m.role and m.role_id is null;

-- Role permissions are seeded for discoverability/audit. Application authorization remains deny-by-default.
insert into organization_role_permissions (organization_id, role_id, permission)
select r.organization_id, r.id, p.permission
from organization_roles r
join lateral (
  select unnest(case r.code
    when 'owner' then array['organization.read','organization.manage','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','subscription.manage','billing.manage','support.request']::text[]
    when 'admin' then array['organization.read','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','support.request']::text[]
    when 'finance' then array['organization.read','members.read','customers.read','quotes.read','orders.read','contracts.read','time.read','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employee_costs.read','audit.read','exports.create','subscription.read','support.request']::text[]
    else array['organization.read','customers.read','orders.read','time.read','time.write','support.request']::text[]
  end) as permission
) p on true
where r.is_system = true
on conflict do nothing;

-- 10. New tenants automatically receive the four system role definitions.
create or replace function seed_system_roles_for_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into organization_roles (organization_id, code, name, is_system)
  values
    (new.id, 'owner', 'Inhaber', true),
    (new.id, 'admin', 'Administration', true),
    (new.id, 'finance', 'Finanzen', true),
    (new.id, 'employee', 'Mitarbeitende', true)
  on conflict (organization_id, code) do nothing;

  insert into organization_role_permissions (organization_id, role_id, permission)
  select r.organization_id, r.id, p.permission
  from organization_roles r
  join lateral (
    select unnest(case r.code
      when 'owner' then array['organization.read','organization.manage','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','subscription.manage','billing.manage','support.request']::text[]
      when 'admin' then array['organization.read','members.read','members.manage','customers.read','customers.write','quotes.read','quotes.write','orders.read','orders.write','contracts.read','contracts.write','time.read','time.write','time.approve','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employees.write','employee_costs.read','settings.manage','audit.read','exports.create','subscription.read','support.request']::text[]
      when 'finance' then array['organization.read','members.read','customers.read','quotes.read','orders.read','contracts.read','time.read','invoices.read','invoices.write','payments.write','finance.read','margin.read','employees.read','employee_costs.read','audit.read','exports.create','subscription.read','support.request']::text[]
      else array['organization.read','customers.read','orders.read','time.read','time.write','support.request']::text[]
    end) as permission
  ) p on true
  where r.organization_id = new.id and r.is_system = true
  on conflict do nothing;

  return new;
end $$;

drop trigger if exists trg_seed_system_roles on organizations;
create trigger trg_seed_system_roles
after insert on organizations
for each row execute function seed_system_roles_for_organization();
