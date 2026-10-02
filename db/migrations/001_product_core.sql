CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organisations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL,
 slug text NOT NULL UNIQUE,
 locale text NOT NULL DEFAULT 'de-CH',
 document_locale text NOT NULL DEFAULT 'de-CH',
 currency text NOT NULL DEFAULT 'CHF',
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL,
 email_normalized text NOT NULL UNIQUE,
 name text NOT NULL,
 password_hash text,
 email_verified_at timestamptz,
 locale text NOT NULL DEFAULT 'de-CH',
 mfa_enabled boolean NOT NULL DEFAULT false,
 disabled_at timestamptz,
 last_login_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('owner','admin','employee','accounting')),
 status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','invited','disabled')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organisation_id,user_id)
);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id,status);
CREATE UNIQUE INDEX IF NOT EXISTS memberships_owner_idx ON memberships(organisation_id) WHERE role='owner' AND status='active';

CREATE TABLE IF NOT EXISTS invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 email_normalized text NOT NULL,
 role text NOT NULL CHECK (role IN ('admin','employee','accounting')),
 token_hash text NOT NULL UNIQUE,
 invited_by uuid NOT NULL REFERENCES users(id),
 expires_at timestamptz NOT NULL,
 accepted_at timestamptz,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invitations_org_idx ON invitations(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS auth_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id,expires_at DESC);

CREATE TABLE IF NOT EXISTS auth_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('email_verification','password_reset','mfa_challenge')),
 token_hash text NOT NULL UNIQUE,
 expires_at timestamptz NOT NULL,
 used_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 name text NOT NULL,
 email text,
 phone text,
 address text,
 postal_code text,
 city text,
 country_code text NOT NULL DEFAULT 'CH',
 status text NOT NULL DEFAULT 'Aktiv',
 version integer NOT NULL DEFAULT 1,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,organisation_id)
);
CREATE INDEX IF NOT EXISTS customers_org_idx ON customers(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS customer_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 customer_id uuid NOT NULL,
 name text NOT NULL,
 email text,
 phone text,
 role text,
 is_primary boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (customer_id,organisation_id) REFERENCES customers(id,organisation_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS customer_contacts_org_customer_idx ON customer_contacts(organisation_id,customer_id);

CREATE TABLE IF NOT EXISTS projects (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 customer_id uuid NOT NULL,
 name text NOT NULL,
 status text NOT NULL DEFAULT 'Entwurf' CHECK (status IN ('Entwurf','Aktiv','Pausiert','Abgeschlossen','Archiviert')),
 description text,
 budget_minor bigint CHECK (budget_minor IS NULL OR budget_minor>=0),
 version integer NOT NULL DEFAULT 1,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,organisation_id),
 FOREIGN KEY (customer_id,organisation_id) REFERENCES customers(id,organisation_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS projects_org_idx ON projects(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS project_members (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 project_id uuid NOT NULL,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (project_id,user_id),
 FOREIGN KEY (project_id,organisation_id) REFERENCES projects(id,organisation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS time_entries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
 project_id uuid NOT NULL,
 started_at timestamptz NOT NULL,
 paused_at timestamptz,
 ended_at timestamptz,
 paused_seconds integer NOT NULL DEFAULT 0 CHECK (paused_seconds>=0),
 status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','paused','stopped')),
 note text,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (project_id,organisation_id) REFERENCES projects(id,organisation_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS time_entries_org_user_idx ON time_entries(organisation_id,user_id,started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS time_entries_active_idx ON time_entries(organisation_id,user_id) WHERE status IN ('running','paused');
