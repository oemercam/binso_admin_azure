-- Catalog-only check. Never changes roles, policies or customer data.
BEGIN READ ONLY;
DO $check$
DECLARE unsafe_roles text; owned_tables text;
BEGIN
  SELECT string_agg(quote_ident(r.rolname), ', ' ORDER BY r.rolname)
    INTO unsafe_roles FROM pg_roles r
    WHERE pg_has_role(current_user, r.oid, 'MEMBER')
      AND (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication);
  IF unsafe_roles IS NOT NULL THEN
    RAISE EXCEPTION 'Runtime role has or can assume administrative/RLS-bypass privileges: %', unsafe_roles;
  END IF;
  SELECT string_agg(quote_ident(c.relname), ', ' ORDER BY c.relname)
    INTO owned_tables FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','p')
      AND pg_has_role(current_user,c.relowner,'MEMBER');
  IF owned_tables IS NOT NULL THEN
    RAISE EXCEPTION 'Runtime role owns or can assume ownership of application tables: %', owned_tables;
  END IF;
END $check$;
SELECT current_user AS checked_role, 'restricted runtime role' AS result;
ROLLBACK;
