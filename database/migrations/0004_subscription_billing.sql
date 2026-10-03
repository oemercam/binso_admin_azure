-- V61 subscription and billing foundation

alter table organization_subscriptions add column if not exists billing_provider text not null default 'manual'
  check (billing_provider in ('manual','stripe'));
alter table organization_subscriptions add column if not exists billing_subscription_id text;
alter table organization_subscriptions add column if not exists billing_interval text not null default 'monthly'
  check (billing_interval in ('monthly','yearly'));
alter table organization_subscriptions add column if not exists unit_amount_chf numeric(12,2) not null default 0;
alter table organization_subscriptions add column if not exists cancel_at_period_end boolean not null default false;
alter table organization_subscriptions add column if not exists cancelled_at timestamptz;
alter table organization_subscriptions add column if not exists scheduled_plan text
  check (scheduled_plan is null or scheduled_plan in ('starter','business','professional','enterprise'));
alter table organization_subscriptions add column if not exists next_billing_at timestamptz;

create unique index if not exists uq_org_subscriptions_provider_id
  on organization_subscriptions(billing_provider, billing_subscription_id)
  where billing_subscription_id is not null;

create table if not exists subscription_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  subscription_id uuid references organization_subscriptions(id) on delete set null,
  actor_user_id text not null,
  source text not null default 'platform_admin' check (source in ('platform_admin','customer','system','webhook')),
  event_type text not null,
  previous_plan text,
  new_plan text,
  previous_status text,
  new_status text,
  detail text,
  created_at timestamptz not null default now()
);
create index if not exists idx_subscription_events_org_created on subscription_events(organization_id, created_at desc);

create table if not exists billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('stripe')),
  external_event_id text not null,
  event_type text not null,
  status text not null default 'received' check (status in ('received','processed','failed','ignored')),
  organization_id uuid references organizations(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text,
  unique (provider, external_event_id)
);
create index if not exists idx_billing_webhook_status on billing_webhook_events(status, received_at);

-- Seed billing amounts for existing plans without overwriting provider-managed values.
update organization_subscriptions
set unit_amount_chf = case plan
  when 'starter' then 39
  when 'business' then 89
  when 'professional' then 149
  else 0
end
where unit_amount_chf = 0;

-- Keep platform overview in sync with existing subscription data.
update platform_tenants pt
set seats = s.seats,
    monthly_revenue_chf = case when s.status = 'active' then s.unit_amount_chf else 0 end,
    platform_status = case
      when pt.platform_status = 'suspended' then 'suspended'
      else s.status
    end
from organization_subscriptions s
where s.organization_id = pt.organization_id;
