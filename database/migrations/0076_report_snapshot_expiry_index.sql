-- Supports bounded tenant-scoped deletion of expired derived PDF copies.
-- No new privileges, policy changes or changes to issued business documents.
create index report_exports_expiry on report_exports(organization_id,expires_at,id);
