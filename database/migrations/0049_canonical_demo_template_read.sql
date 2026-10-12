-- Only the fixed synthetic demo template is readable while seeding a new demo.
-- No write access, membership grant, or ordinary tenant access is introduced.
DROP POLICY IF EXISTS canonical_demo_template_read ON public.organizations;
CREATE POLICY canonical_demo_template_read ON public.organizations
  FOR SELECT
  USING (
    id = '00000000-0000-4000-8000-000000000099'::uuid
    AND is_demo = true
    AND nullif(current_setting('app.organization_id', true), '')::uuid = id
  );
