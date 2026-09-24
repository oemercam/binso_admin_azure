-- V72: product model clarity and pragmatic production indexes.
-- Shared plan catalogue: three self-service models; Enterprise remains individually contracted.
create table if not exists subscription_plan_catalog (
  plan_id text primary key check (plan_id in ('starter','business','professional','enterprise')),
  name text not null,
  self_service boolean not null default true,
  sort_order integer not null,
  monthly_price_chf numeric(10,2),
  included_users integer not null check (included_users > 0),
  max_storage_mb integer not null check (max_storage_mb > 0),
  updated_at timestamptz not null default now()
);

create table if not exists subscription_plan_features (
  plan_id text not null references subscription_plan_catalog(plan_id) on delete cascade,
  feature text not null,
  primary key (plan_id, feature)
);

insert into subscription_plan_catalog(plan_id,name,self_service,sort_order,monthly_price_chf,included_users,max_storage_mb)
values
  ('starter','Starter',true,10,39,3,2048),
  ('business','Business',true,20,89,10,10240),
  ('professional','Professional',true,30,149,25,51200),
  ('enterprise','Enterprise',false,90,null,100,204800)
on conflict (plan_id) do update set
  name=excluded.name,self_service=excluded.self_service,sort_order=excluded.sort_order,
  monthly_price_chf=excluded.monthly_price_chf,included_users=excluded.included_users,
  max_storage_mb=excluded.max_storage_mb,updated_at=now();

with features(plan_id, feature) as (
  values
    ('starter','crm'),('starter','quotes'),('starter','orders'),('starter','invoices'),('starter','exports'),
    ('business','crm'),('business','quotes'),('business','orders'),('business','contracts'),('business','time'),('business','invoices'),('business','finance'),('business','employees'),('business','expenses'),('business','reminders'),('business','approvals'),('business','imports'),('business','exports'),
    ('professional','crm'),('professional','quotes'),('professional','orders'),('professional','contracts'),('professional','time'),('professional','invoices'),('professional','finance'),('professional','employees'),('professional','expenses'),('professional','reminders'),('professional','approvals'),('professional','accounting'),('professional','margin'),('professional','audit'),('professional','imports'),('professional','exports'),('professional','api'),('professional','automations'),
    ('enterprise','crm'),('enterprise','quotes'),('enterprise','orders'),('enterprise','contracts'),('enterprise','time'),('enterprise','invoices'),('enterprise','finance'),('enterprise','employees'),('enterprise','expenses'),('enterprise','reminders'),('enterprise','approvals'),('enterprise','accounting'),('enterprise','margin'),('enterprise','audit'),('enterprise','imports'),('enterprise','exports'),('enterprise','api'),('enterprise','automations')
)
insert into subscription_plan_features(plan_id,feature)
select plan_id,feature from features
on conflict do nothing;

-- Keep tenant-scoped lookups fast without speculative indexing.
create index if not exists idx_customers_org_status_name on customers(organization_id, status, name);
create index if not exists idx_quotes_org_status_created on quotes(organization_id, status, created_at desc);
create index if not exists idx_orders_org_status on orders(organization_id, status);
create index if not exists idx_time_entries_org_date on time_entries(organization_id, work_date desc);
create index if not exists idx_invoices_org_status_due on invoices(organization_id, status, due_date);
create index if not exists idx_memberships_user_status_org on organization_memberships(user_id, status, organization_id);
