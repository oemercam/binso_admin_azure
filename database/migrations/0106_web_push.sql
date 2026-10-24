-- Extend the existing device registry; legacy devices must explicitly register again.
alter table push_subscriptions rename column encrypted_payload to subscription_enc;
alter table push_subscriptions add column organization_id uuid references organizations(id) on delete cascade;
alter table push_subscriptions add column session_id uuid references auth_sessions(id) on delete cascade;
alter table push_subscriptions add column locale text not null default 'de';
alter table push_subscriptions add column last_checked_at timestamptz not null default 'epoch';
alter table push_subscriptions add column disabled_at timestamptz;
update push_subscriptions set disabled_at=now();
alter table push_subscriptions add constraint push_active_scope check(disabled_at is not null or (organization_id is not null and session_id is not null));
alter table push_subscriptions add unique(organization_id,user_id,id);
create unique index push_endpoint_scoped on push_subscriptions(endpoint_hash) where organization_id is not null;
create table push_deliveries (
 organization_id uuid not null, user_id text not null, subscription_id uuid not null, notification_id uuid not null,
 status text not null check(status in ('processing','accepted','failed','uncertain','gone')), attempted_at timestamptz not null default now(),
 primary key(subscription_id,notification_id),
 foreign key(organization_id,user_id,subscription_id) references push_subscriptions(organization_id,user_id,id) on delete cascade,
 foreign key(organization_id,notification_id) references in_app_notifications(organization_id,id) on delete cascade
);
alter table push_subscriptions enable row level security; alter table push_subscriptions force row level security;
alter table push_deliveries enable row level security; alter table push_deliveries force row level security;
create policy push_subscription_scope on push_subscriptions using ((organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true)) or current_setting('app.platform_operator',true)='true') with check ((organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true)) or current_setting('app.platform_operator',true)='true');
create policy push_delivery_scope on push_deliveries using ((organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true)) or current_setting('app.platform_operator',true)='true') with check ((organization_id=nullif(current_setting('app.organization_id',true),'')::uuid and user_id=current_setting('app.user_id',true)) or current_setting('app.platform_operator',true)='true');
create index push_subscription_active on push_subscriptions(organization_id,user_id) where disabled_at is null;
do $$ begin if exists(select 1 from pg_roles where rolname='binso_runtime') then grant select,insert,update,delete on push_subscriptions,push_deliveries to binso_runtime; end if; end $$;
