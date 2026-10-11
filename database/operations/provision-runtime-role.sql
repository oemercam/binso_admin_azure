-- REVIEWED OPERATION ONLY: not an automatic application migration.
-- Run as the schema administrator in an isolated database first.
-- Password/Entra credential binding is performed separately; no secret belongs here.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='binso_runtime') THEN
    RAISE EXCEPTION 'binso_runtime already exists; inspect it instead of overwriting privileges';
  END IF;
END $$;
CREATE ROLE binso_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
GRANT USAGE ON SCHEMA public TO binso_runtime;
-- The current server owns authentication, billing and operator flows in one pool.
-- Explicitly exclude the migration ledger. No DDL/schema ownership is granted.
DO $$ DECLARE t record; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename <> 'schema_migrations' LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO binso_runtime',t.tablename);
  END LOOP;
END $$;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO binso_runtime;
COMMIT;
-- Future tables require explicit reviewed grants. No ALTER DEFAULT PRIVILEGES.
