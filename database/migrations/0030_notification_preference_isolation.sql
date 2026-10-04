alter table notification_preferences force row level security;
drop policy if exists tenant_isolation on notification_preferences;
create policy tenant_isolation on notification_preferences
using (organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''))
with check (organization_id::text=nullif(current_setting('app.organization_id',true),'') and user_id=nullif(current_setting('app.user_id',true),''));
