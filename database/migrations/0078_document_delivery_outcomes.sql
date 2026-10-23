-- Preserve every historical value. Legacy failed rows have no proof that a
-- provider attempt did not occur; the application treats them as unresolved.
alter table document_deliveries drop constraint document_deliveries_status_check;
alter table document_deliveries add constraint document_deliveries_status_check
 check(status in ('sending','sent','failed','uncertain','not_attempted'));
