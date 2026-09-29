-- Run with an administrative PostgreSQL connection after all migrations.
-- psql example:
--   psql "$ADMIN_DATABASE_URL" -v app_password='A-VERY-LONG-RANDOM-PASSWORD' -f database/bootstrap/app-role.sql

\if :{?app_password}
\else
\echo 'Missing psql variable app_password'
\quit
\endif

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='binso_app') THEN
    CREATE ROLE binso_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
END $$;

ALTER ROLE binso_app PASSWORD :'app_password';
GRANT CONNECT ON DATABASE binso TO binso_app;
GRANT USAGE ON SCHEMA public TO binso_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO binso_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO binso_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO binso_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO binso_app;
