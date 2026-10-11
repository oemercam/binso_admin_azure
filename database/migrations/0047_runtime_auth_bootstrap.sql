-- Identity discovery is SELECT-only and restricted to the server-verified user.
-- Business-table tenant policies and organization write policies are unchanged.
DROP POLICY IF EXISTS identity_membership_lookup ON public.organization_memberships;
CREATE POLICY identity_membership_lookup ON public.organization_memberships
  FOR SELECT USING (user_id = nullif(current_setting('app.user_id', true), ''));

-- Only this fixed operation can create the initial organization/member pair.
-- It cannot target an existing organization or accept an arbitrary member role.
CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  p_user_id text, p_email text, p_name text, p_slug text, p_mode text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $bootstrap$
DECLARE new_organization_id uuid; candidate text; attempt integer;
BEGIN
  IF p_mode IS NULL OR p_mode NOT IN ('trial','demo','subscription') OR p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 2 AND 180
     OR p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug)>180 THEN
    RAISE EXCEPTION 'Invalid organization bootstrap input' USING ERRCODE='22023';
  END IF;
  -- Serialize bootstrap for a user; an established account is never reattached.
  PERFORM 1 FROM public.app_users WHERE id=p_user_id AND lower(email)=lower(p_email) AND status='active' FOR UPDATE;
  IF NOT FOUND OR EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_id=p_user_id) THEN
    RAISE EXCEPTION 'Organization bootstrap requires a new active user' USING ERRCODE='42501';
  END IF;
  FOR attempt IN 0..50 LOOP
    candidate := CASE WHEN attempt=0 THEN p_slug ELSE p_slug||'-'||(attempt+1)::text END;
    INSERT INTO public.organizations(name,slug,status,country,currency,locale,is_demo)
      VALUES(p_name,candidate,CASE WHEN p_mode='subscription' THEN 'active' ELSE 'trial' END,'Schweiz','CHF','de-CH',p_mode='demo')
      ON CONFLICT (slug) DO NOTHING RETURNING id INTO new_organization_id;
    EXIT WHEN new_organization_id IS NOT NULL;
  END LOOP;
  IF new_organization_id IS NULL THEN
    RAISE EXCEPTION 'Organization slug allocation exhausted' USING ERRCODE='23505';
  END IF;
  INSERT INTO public.organization_memberships(organization_id,user_id,email,role,role_id,status)
    VALUES(new_organization_id,p_user_id,p_email,'owner',
      (SELECT id FROM public.organization_roles WHERE organization_roles.organization_id=new_organization_id AND code='owner' LIMIT 1),'active');
  RETURN new_organization_id;
END $bootstrap$;
REVOKE ALL ON FUNCTION public.bootstrap_organization(text,text,text,text,text) FROM PUBLIC;

-- Bootstrap invokes the existing role-seeding trigger: prevent temp-table shadowing.
ALTER FUNCTION public.seed_system_roles_for_organization() SET search_path = pg_catalog, public, pg_temp;

-- Runtime readiness may inspect applied version names without ledger DML/checksums.
CREATE OR REPLACE FUNCTION public.runtime_schema_versions() RETURNS SETOF text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp
AS $versions$
BEGIN
  RETURN QUERY SELECT version FROM public.schema_migrations ORDER BY version;
END $versions$;
REVOKE ALL ON FUNCTION public.runtime_schema_versions() FROM PUBLIC;
