-- Platform billing is a separate ledger, never the invoices of a tenant's customers.
select set_config('app.organization_id','00000000-0000-4000-8000-000000000099',true);
select set_config('app.platform_operator','true',true);
alter table operating_costs add column if not exists is_demo boolean not null default false;
update operating_costs set is_demo=true where external_id like 'demo-%';
alter table operating_costs add constraint operating_costs_scope_owner check
  ((scope='tenant' and organization_id is not null) or (scope='platform' and organization_id is null));
create table platform_billing_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete restrict,
  provider text not null check (provider in ('stripe','manual','demo')),
  external_id text not null,
  payment_date date not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'CHF' check (currency in ('CHF','EUR')),
  created_at timestamptz not null default now(),
  unique(provider,external_id)
);
create index idx_platform_billing_payment_date on platform_billing_payments(payment_date,organization_id);
alter table platform_billing_payments enable row level security;
alter table platform_billing_payments force row level security;
create policy platform_billing_operator on platform_billing_payments
  using (current_setting('app.platform_operator',true)='true')
  with check (current_setting('app.platform_operator',true)='true');
create index if not exists idx_finance_payments_org_date on payments(organization_id,payment_date) where archived_at is null;
create index if not exists idx_finance_expenses_org_date on expenses(organization_id,expense_date) where archived_at is null;

-- Fixed fixture dates are deliberately reproducible, including the previous calendar year.
select set_config('app.organization_id','00000000-0000-4000-8000-000000000099',true);
select set_config('app.platform_operator','true',true);
insert into invoice_lines(organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate)
select organization_id,'demo-line-'||external_id,id,1,'IT Dienstleistungen',1,'Pauschal',subtotal,8.1
from invoices where organization_id='00000000-0000-4000-8000-000000000099'
on conflict(organization_id,external_id) do nothing;
insert into quote_lines(organization_id,external_id,quote_id,sort_order,description,quantity,unit,unit_price,vat_rate)
select organization_id,'demo-line-'||external_id,id,1,title,40,'Stunde',185,8.1
from quotes where organization_id='00000000-0000-4000-8000-000000000099'
on conflict(organization_id,external_id) do nothing;
insert into invoices(organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status,subtotal,vat_amount,total_amount,paid_amount)
select '00000000-0000-4000-8000-000000000099','demo-history-'||to_char(d,'YYYY-MM'),
 'DEMO-RE-'||to_char(d,'YYYY-MM'),'10000000-0000-4000-8000-000000000001',d::date,(d+interval '30 days')::date,
 'paid',5000+extract(month from d)*350,round((5000+extract(month from d)*350)*0.081,2),
 round((5000+extract(month from d)*350)*1.081,2),round((5000+extract(month from d)*350)*1.081,2)
from generate_series('2025-01-01'::date,'2026-09-01'::date,'1 month') d
on conflict(organization_id,external_id) do nothing;
insert into payments(organization_id,external_id,invoice_id,payment_date,amount,method,allocation_status)
select organization_id,'demo-history-payment-'||external_id,id,issue_date+10,total_amount,'bank','matched'
from invoices where organization_id='00000000-0000-4000-8000-000000000099' and external_id like 'demo-history-%'
on conflict(organization_id,external_id) do nothing;
insert into invoice_lines(organization_id,external_id,invoice_id,sort_order,description,quantity,unit,unit_price,vat_rate)
select organization_id,'demo-line-'||external_id,id,1,'Monatliche IT Dienstleistungen',1,'Pauschal',subtotal,8.1
from invoices where organization_id='00000000-0000-4000-8000-000000000099'
on conflict(organization_id,external_id) do nothing;
insert into operating_costs(organization_id,external_id,cost_date,category,description,amount,is_demo)
select '00000000-0000-4000-8000-000000000099','demo-history-cost-'||to_char(d,'YYYY-MM'),d::date,'software','Demo: Lizenzen',450+extract(month from d)*25,true
from generate_series('2025-01-01'::date,'2026-09-01'::date,'1 month') d
on conflict do nothing;
insert into payroll_runs(organization_id,external_id,employee_id,period,gross_amount,deduction_amount,net_amount,status)
select '00000000-0000-4000-8000-000000000099','demo-history-payroll-'||to_char(d,'YYYY-MM'),
 '20000000-0000-4000-8000-000000000001',to_char(d,'YYYY-MM'),7200,1120,6080,'paid'
from generate_series('2025-01-01'::date,'2026-09-01'::date,'1 month') d
on conflict(organization_id,external_id) do nothing;
insert into platform_billing_payments(organization_id,provider,external_id,payment_date,amount)
select '00000000-0000-4000-8000-000000000099','demo','demo-platform-'||to_char(d,'YYYY-MM'),d::date,390+extract(month from d)*10
from generate_series('2025-01-01'::date,'2026-10-01'::date,'1 month') d
on conflict(provider,external_id) do nothing;
