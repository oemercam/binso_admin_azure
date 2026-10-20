-- V25.4 approved plan decisions. Prepared migration; production execution is separate.
-- NULL explicitly represents no regular Pro user quota, not a hidden large cap.
alter table organization_entitlements alter column max_users drop not null;
alter table organization_subscriptions alter column seats drop not null;
alter table platform_tenants alter column seats drop not null;
update organization_entitlements e set max_users=null,updated_at=now()
from organization_subscriptions s where s.organization_id=e.organization_id
and s.plan in ('professional','enterprise');
update organization_subscriptions set seats=null,updated_at=now()
where plan in ('professional','enterprise');
update platform_tenants t set seats=null
from organization_subscriptions s where s.organization_id=t.organization_id
and s.plan in ('professional','enterprise');
-- Keep normal module files/PDFs and all business records. Only the independent
-- document-management entitlement changes; file access stays object-scoped.
update organization_entitlements e set features=array_append(e.features,'projects'),updated_at=now()
from organization_subscriptions s where s.organization_id=e.organization_id
and s.plan='starter' and not ('projects'=any(e.features));
update organization_entitlements e set features=array_remove(e.features,'documents'),updated_at=now()
from organization_subscriptions s where s.organization_id=e.organization_id
and s.plan in ('starter','business') and 'documents'=any(e.features);
