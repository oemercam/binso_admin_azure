-- The runtime role predates this table; provisioning intentionally grants no
-- default privileges on future tables. Preserve FORCE RLS and operator policy.
DO $grant$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'binso_runtime') THEN
    GRANT SELECT ON TABLE public.platform_maintenance TO binso_runtime;
    GRANT UPDATE (enabled, ends_at, updated_at, updated_by_user_id)
      ON TABLE public.platform_maintenance TO binso_runtime;
  END IF;
END $grant$;
