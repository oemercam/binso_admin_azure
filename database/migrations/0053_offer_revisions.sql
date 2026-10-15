-- Preserve issued offers. A revision is a new draft linked to its predecessor.
alter table quotes add column revises_quote_id uuid;
alter table quotes add constraint quote_revision_tenant foreign key(organization_id,revises_quote_id) references quotes(organization_id,id);
alter table quotes add constraint quote_revision_not_self check(revises_quote_id is null or revises_quote_id<>id);
create unique index quote_revision_one_draft on quotes(organization_id,revises_quote_id) where revises_quote_id is not null and status='draft' and archived_at is null;
