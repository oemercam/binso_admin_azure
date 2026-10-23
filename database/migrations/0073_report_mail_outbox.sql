-- Reuse the existing durable, monitored mail ledger. No provider, role or
-- automatic sender is provisioned; report sends require an explicit request.
alter table mail_outbox drop constraint mail_outbox_kind_check;
alter table mail_outbox add constraint mail_outbox_kind_check check(kind in ('quote','invoice','reminder','invitation','security','report'));
create index report_mail_owner_history on mail_outbox(organization_id,created_by,entity_id,created_at desc) where kind='report';
