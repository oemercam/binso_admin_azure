-- Add reminder provenance to the existing tenant-protected delivery outbox.
-- Historical deliveries remain ordinary documents; no mail or live action.
alter table document_deliveries
 add column purpose text not null default 'document' check(purpose in ('document','reminder')),
 add column reminder_stage smallint,
 add column balance_amount numeric(14,2),
 add column payment_deadline date,
 add constraint document_reminder_metadata check (
  (purpose='document' and reminder_stage is null and balance_amount is null and payment_deadline is null)
  or (purpose='reminder' and kind='invoice' and reminder_stage between 1 and 3 and reminder_stage is not null and balance_amount>0 and balance_amount is not null and payment_deadline is not null)
 );
create index document_reminder_history on document_deliveries(organization_id,document_id,completed_at desc) where purpose='reminder';
