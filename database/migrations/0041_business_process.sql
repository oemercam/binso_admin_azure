-- Extend the existing project and time model without rewriting historical records.
alter table projects add column source_quote_id uuid;
alter table projects add constraint projects_source_quote_tenant_fk foreign key (organization_id,source_quote_id) references quotes(organization_id,id);
create unique index projects_source_quote_once on projects(organization_id,source_quote_id) where source_quote_id is not null and archived_at is null;
alter table time_entries add column submitted_at timestamptz;
alter table organizations add column time_approval_required boolean not null default true;
