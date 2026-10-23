-- Reuse the existing tenant-local counter; no second numbering engine.
alter table business_document_counters drop constraint business_document_counters_kind_check;
alter table business_document_counters add constraint business_document_counters_kind_check
 check(kind in ('customer','quote','order','invoice','contract','credit_note','supplier'));
-- Existing suppliers, numbers, bank fields and rights remain byte-for-byte unchanged.
