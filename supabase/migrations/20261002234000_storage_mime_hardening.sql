-- Tighten private upload MIME types. User-supplied SVG is intentionally excluded.

update storage.buckets
set allowed_mime_types=array['image/png','image/jpeg','image/webp']
where id='company-assets';
