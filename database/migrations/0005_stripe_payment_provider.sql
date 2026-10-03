-- V63 Stripe payment provider integration

alter table organization_subscriptions add column if not exists billing_last_synced_at timestamptz;
alter table organization_subscriptions add column if not exists billing_last_event_id text;

create unique index if not exists uq_org_subscriptions_billing_customer
  on organization_subscriptions(billing_customer_id)
  where billing_customer_id is not null;

create index if not exists idx_org_subscriptions_billing_sync
  on organization_subscriptions(billing_provider, billing_last_synced_at desc);

create index if not exists idx_billing_webhook_org_received
  on billing_webhook_events(organization_id, received_at desc);
