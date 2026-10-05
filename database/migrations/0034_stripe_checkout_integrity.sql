-- Checkout retries are persisted; a tenant may never acquire another tenant's session.
create table billing_checkout_sessions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references organizations(id) on delete cascade,
 request_key uuid not null,
 plan text not null check(plan in ('start','business','pro')),
 billing_interval text not null check(billing_interval in ('monthly','yearly')),
 stripe_session_id text not null unique,
 checkout_url text not null check(checkout_url like 'https://checkout.stripe.com/%'),
 expires_at timestamptz not null,
 created_at timestamptz not null default now(),
 unique(organization_id,request_key)
);
create index idx_billing_checkout_active on billing_checkout_sessions(organization_id,expires_at desc);
alter table billing_checkout_sessions enable row level security;
alter table billing_checkout_sessions force row level security;
create policy billing_checkout_tenant on billing_checkout_sessions
 using(organization_id::text=nullif(current_setting('app.organization_id',true),''))
 with check(organization_id::text=nullif(current_setting('app.organization_id',true),''));
