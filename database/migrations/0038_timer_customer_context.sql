-- Persist customer-only work across pause/reload/finish; additive, no data deletion.
alter table active_time_trackers add column if not exists customer_id uuid;
alter table active_time_trackers add constraint active_time_trackers_customer_tenant_fk
  foreign key (organization_id,customer_id) references customers(organization_id,id);
update active_time_trackers t set customer_id=p.customer_id
from projects p where p.id=t.project_id and p.organization_id=t.organization_id and t.customer_id is null;
