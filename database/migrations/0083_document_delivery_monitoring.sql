-- Existing platform monitoring may read the document dispatch ledger.
-- Tenant policy remains unchanged; this policy grants no INSERT/UPDATE/DELETE.
create policy document_delivery_platform_read on document_deliveries
 for select using (current_setting('app.platform_operator',true)='true');
