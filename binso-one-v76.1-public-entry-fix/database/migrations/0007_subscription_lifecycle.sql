-- V68 subscription lifecycle: distinguish expired trials from cancellations.

alter table platform_tenants drop constraint if exists platform_tenants_platform_status_check;
alter table platform_tenants
  add constraint platform_tenants_platform_status_check
  check (platform_status in ('trial','active','past_due','suspended','expired','cancelled'));
