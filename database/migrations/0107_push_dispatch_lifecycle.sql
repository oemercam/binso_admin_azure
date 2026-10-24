-- Claims commit before network I/O. Uncertain sends are retained, never auto-retried.
alter table push_subscriptions add column application_server_key text;
alter table push_deliveries drop constraint push_deliveries_status_check;
alter table push_deliveries add constraint push_deliveries_status_check
 check(status in ('processing','accepted','failed','uncertain','gone','skipped'));
alter table push_deliveries add column completed_at timestamptz;
alter table push_deliveries add column provider_status integer;
alter table push_deliveries add column error_code text;
create index push_delivery_processing on push_deliveries(attempted_at) where status='processing';
create index push_notification_scan on in_app_notifications(organization_id,created_at,id);
