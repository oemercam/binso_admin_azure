-- Future provisioning is real-account only; retain function identity, grants and fixed search_path.
CREATE OR REPLACE FUNCTION public.bootstrap_organization(
  p_user_id text, p_email text, p_name text, p_slug text, p_mode text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $bootstrap$
DECLARE new_organization_id uuid; candidate text; attempt integer;
BEGIN
  IF p_mode IS NULL OR p_mode NOT IN ('trial','subscription') OR p_name IS NULL OR length(trim(p_name)) NOT BETWEEN 2 AND 180
     OR p_slug IS NULL OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug)>180 THEN
    RAISE EXCEPTION 'Invalid organization bootstrap input' USING ERRCODE='22023';
  END IF;
  -- Serialize bootstrap for a user; an established account is never reattached.
  PERFORM 1 FROM public.app_users WHERE id=p_user_id AND lower(email)=lower(p_email) AND status='active' FOR UPDATE;
  IF NOT FOUND OR EXISTS (SELECT 1 FROM public.organization_memberships WHERE user_id=p_user_id) THEN
    RAISE EXCEPTION 'Organization bootstrap requires a new active user' USING ERRCODE='42501';
  END IF;
  FOR attempt IN 0..59 LOOP
    candidate := CASE WHEN attempt=0 THEN p_slug WHEN attempt<50 THEN p_slug||'-'||(attempt+1)::text
      ELSE p_slug||'-'||substr(pg_catalog.gen_random_uuid()::text,1,8) END;
    INSERT INTO public.organizations(name,slug,status,country,currency,locale,is_demo)
      VALUES(p_name,candidate,CASE WHEN p_mode='subscription' THEN 'active' ELSE 'trial' END,'Schweiz','CHF','de-CH',false)
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
