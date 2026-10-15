-- Record externally completed repayments; never initiates a bank/Stripe transfer.
create table invoice_refunds (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 external_id text not null,
 invoice_id uuid not null,
 customer_id uuid not null,
 refund_date date not null,
 amount numeric(14,2) not null check(amount>0),
 reason text not null check(length(trim(reason)) between 3 and 2000),
 created_by_user_id text not null,
 created_at timestamptz not null default now(),
 unique(organization_id,external_id),
 unique(organization_id,id),
 foreign key(organization_id,invoice_id) references invoices(organization_id,id),
 foreign key(organization_id,customer_id) references customers(organization_id,id)
);
alter table invoice_refunds enable row level security;
alter table invoice_refunds force row level security;
create policy refund_scope on invoice_refunds using(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid) with check(organization_id=nullif(current_setting('app.organization_id',true),'')::uuid);
create index invoice_refunds_ledger on invoice_refunds(organization_id,invoice_id,refund_date);
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='binso_runtime') THEN
  GRANT SELECT,INSERT ON invoice_refunds TO binso_runtime;
 END IF;
END $$;
