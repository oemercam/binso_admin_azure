-- Additive metadata only. Existing bytes, invoices and scan statuses are unchanged.
ALTER TABLE public.file_objects ADD COLUMN scan_evidence jsonb;
ALTER TABLE public.file_objects ADD CONSTRAINT file_scan_evidence_matches_bytes CHECK (
 scan_evidence IS NULL OR (
   jsonb_typeof(scan_evidence)='object'
   AND jsonb_typeof(scan_evidence->'signaturesVersion')='number'
   AND scan_evidence->>'engine'='ClamAV'
   AND scan_evidence->>'sha256'=sha256
   AND scan_evidence ?& ARRAY['engineVersion','signaturesVersion','signaturesAt','startedAt','completedAt']
 ) IS TRUE
);
