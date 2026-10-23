-- Additive metadata lookup only; no delivery state, recipient or existing row changes.
create index document_delivery_latest_document
 on document_deliveries(organization_id,kind,document_id,purpose,created_at desc,id desc);
