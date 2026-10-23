-- Reuse the durable monitored mail ledger for committed offer-response messages.
-- No provider, scheduler, login, role or privilege is created.
alter table mail_outbox drop constraint mail_outbox_kind_check;
alter table mail_outbox add constraint mail_outbox_kind_check check(kind in ('quote','invoice','reminder','invitation','security','report','offer_confirmation','offer_employee'));
