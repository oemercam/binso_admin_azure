CREATE TABLE IF NOT EXISTS offers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 customer_id uuid NOT NULL,
 project_id uuid,
 number text NOT NULL,
 status text NOT NULL DEFAULT 'Entwurf' CHECK (status IN ('Entwurf','Versendet','Angenommen','Abgelehnt','Abgelaufen')),
 currency text NOT NULL DEFAULT 'CHF',
 valid_until date NOT NULL,
 discount_basis_points integer NOT NULL DEFAULT 0 CHECK (discount_basis_points BETWEEN 0 AND 10000),
 snapshot jsonb,
 sent_at timestamptz,
 accepted_at timestamptz,
 rejected_at timestamptz,
 expired_at timestamptz,
 version integer NOT NULL DEFAULT 1,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organisation_id,number),
 UNIQUE (id,organisation_id),
 FOREIGN KEY (customer_id,organisation_id) REFERENCES customers(id,organisation_id) ON DELETE RESTRICT,
 FOREIGN KEY (project_id,organisation_id) REFERENCES projects(id,organisation_id) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS offers_org_idx ON offers(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS offer_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 offer_id uuid NOT NULL,
 position integer NOT NULL,
 description text NOT NULL,
 quantity numeric(14,4) NOT NULL CHECK (quantity>0),
 unit_price_minor bigint NOT NULL CHECK (unit_price_minor>=0),
 vat_rate numeric(5,2) NOT NULL CHECK (vat_rate>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (offer_id,position),
 FOREIGN KEY (offer_id,organisation_id) REFERENCES offers(id,organisation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 customer_id uuid NOT NULL,
 project_id uuid,
 source_offer_id uuid,
 number text NOT NULL,
 status text NOT NULL DEFAULT 'Entwurf' CHECK (status IN ('Entwurf','Versendet','Teilbezahlt','Bezahlt','Überfällig','Storniert')),
 currency text NOT NULL DEFAULT 'CHF',
 issued_at date,
 due_at date NOT NULL,
 net_minor bigint NOT NULL DEFAULT 0 CHECK (net_minor>=0),
 vat_minor bigint NOT NULL DEFAULT 0 CHECK (vat_minor>=0),
 gross_minor bigint NOT NULL DEFAULT 0 CHECK (gross_minor>=0),
 paid_minor bigint NOT NULL DEFAULT 0 CHECK (paid_minor>=0),
 snapshot jsonb,
 sent_at timestamptz,
 cancelled_at timestamptz,
 version integer NOT NULL DEFAULT 1,
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organisation_id,number),
 UNIQUE (id,organisation_id),
 FOREIGN KEY (customer_id,organisation_id) REFERENCES customers(id,organisation_id) ON DELETE RESTRICT,
 FOREIGN KEY (project_id,organisation_id) REFERENCES projects(id,organisation_id) ON DELETE RESTRICT,
 FOREIGN KEY (source_offer_id,organisation_id) REFERENCES offers(id,organisation_id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS invoices_org_due_idx ON invoices(organisation_id,due_at,status);

CREATE TABLE IF NOT EXISTS invoice_lines (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 invoice_id uuid NOT NULL,
 position integer NOT NULL,
 description text NOT NULL,
 quantity numeric(14,4) NOT NULL CHECK (quantity>0),
 unit_price_minor bigint NOT NULL CHECK (unit_price_minor>=0),
 vat_rate numeric(5,2) NOT NULL CHECK (vat_rate>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (invoice_id,position),
 FOREIGN KEY (invoice_id,organisation_id) REFERENCES invoices(id,organisation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 invoice_id uuid NOT NULL,
 amount_minor bigint NOT NULL CHECK (amount_minor>0),
 currency text NOT NULL,
 paid_at timestamptz NOT NULL,
 reference text,
 provider text,
 provider_payment_id text,
 idempotency_key text,
 created_by uuid REFERENCES users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (invoice_id,organisation_id) REFERENCES invoices(id,organisation_id) ON DELETE RESTRICT,
 UNIQUE (organisation_id,idempotency_key),
 UNIQUE (provider,provider_payment_id)
);
CREATE INDEX IF NOT EXISTS payments_org_invoice_idx ON payments(organisation_id,invoice_id,paid_at DESC);

CREATE TABLE IF NOT EXISTS reminders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 invoice_id uuid NOT NULL,
 level integer NOT NULL CHECK (level BETWEEN 1 AND 3),
 fee_minor bigint NOT NULL DEFAULT 0 CHECK (fee_minor>=0),
 status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','cancelled')),
 due_at date,
 sent_at timestamptz,
 snapshot jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (invoice_id,level),
 FOREIGN KEY (invoice_id,organisation_id) REFERENCES invoices(id,organisation_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 kind text NOT NULL,
 entity_type text,
 entity_id uuid,
 name text NOT NULL,
 storage_key text NOT NULL,
 storage_provider text NOT NULL,
 mime_type text NOT NULL,
 size bigint NOT NULL CHECK (size>=0),
 checksum_sha256 text,
 created_by uuid REFERENCES users(id),
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organisation_id,storage_key)
);
CREATE INDEX IF NOT EXISTS documents_org_entity_idx ON documents(organisation_id,entity_type,entity_id);

CREATE TABLE IF NOT EXISTS notification_preferences (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_key text NOT NULL,
 in_app boolean NOT NULL DEFAULT true,
 email boolean NOT NULL DEFAULT true,
 push boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organisation_id,user_id,event_key)
);

CREATE TABLE IF NOT EXISTS notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 event_key text NOT NULL,
 title text NOT NULL,
 body text NOT NULL,
 data jsonb,
 read_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_org_user_idx ON notifications(organisation_id,user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS support_tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 created_by uuid NOT NULL REFERENCES users(id),
 assigned_to uuid REFERENCES users(id),
 subject text NOT NULL,
 status text NOT NULL DEFAULT 'Offen' CHECK (status IN ('Offen','In Bearbeitung','Wartet auf Kunde','Gelöst','Geschlossen')),
 priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
 version integer NOT NULL DEFAULT 1,
 closed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (id,organisation_id)
);
CREATE INDEX IF NOT EXISTS support_tickets_org_idx ON support_tickets(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
 ticket_id uuid NOT NULL,
 author_user_id uuid REFERENCES users(id),
 author_type text NOT NULL CHECK (author_type IN ('customer','support','system')),
 body text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (ticket_id,organisation_id) REFERENCES support_tickets(id,organisation_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL UNIQUE REFERENCES organisations(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK (plan IN ('starter','business','pro')),
 status text NOT NULL CHECK (status IN ('Trial','Active','Past Due','Grace Period','Suspended','Cancelled')),
 provider text,
 provider_customer_id text,
 provider_subscription_id text,
 trial_ends_at timestamptz,
 current_period_starts_at timestamptz,
 current_period_ends_at timestamptz,
 grace_ends_at timestamptz,
 cancel_at_period_end boolean NOT NULL DEFAULT false,
 version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
 provider text NOT NULL,
 provider_event_id text NOT NULL,
 type text NOT NULL,
 payload jsonb NOT NULL,
 processed_at timestamptz,
 failed_at timestamptz,
 error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (provider,provider_event_id)
);

CREATE TABLE IF NOT EXISTS audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid REFERENCES organisations(id) ON DELETE SET NULL,
 actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
 action text NOT NULL,
 entity text NOT NULL,
 entity_id text,
 request_id text,
 ip_hash text,
 metadata jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_org_created_idx ON audit_events(organisation_id,created_at DESC);

CREATE TABLE IF NOT EXISTS feature_flags (
 key text PRIMARY KEY,
 enabled boolean NOT NULL DEFAULT false,
 rollout_percentage integer NOT NULL DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
 config jsonb,
 updated_by uuid REFERENCES users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS background_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,
 type text NOT NULL,
 status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
 payload jsonb NOT NULL,
 attempts integer NOT NULL DEFAULT 0 CHECK (attempts>=0),
 max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts>0),
 run_after timestamptz NOT NULL DEFAULT now(),
 locked_at timestamptz,
 locked_by text,
 completed_at timestamptz,
 last_error_code text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS background_jobs_ready_idx ON background_jobs(status,run_after) WHERE status='queued';

CREATE TABLE IF NOT EXISTS number_sequences (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('offer','invoice','reminder')),
 year integer NOT NULL,
 prefix text NOT NULL,
 next_value bigint NOT NULL DEFAULT 1 CHECK (next_value>0),
 padding integer NOT NULL DEFAULT 5 CHECK (padding BETWEEN 1 AND 12),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (organisation_id,kind,year)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 scope text NOT NULL,
 idempotency_key text NOT NULL,
 request_hash text NOT NULL,
 response_status integer,
 response_body jsonb,
 locked_at timestamptz NOT NULL DEFAULT now(),
 completed_at timestamptz,
 expires_at timestamptz NOT NULL,
 PRIMARY KEY (organisation_id,scope,idempotency_key)
);

CREATE TABLE IF NOT EXISTS platform_admins (
 user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK (role IN ('platform_admin','platform_support','platform_auditor')),
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 organisation_id uuid NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
 platform_user_id uuid NOT NULL REFERENCES users(id),
 reason text NOT NULL,
 expires_at timestamptz NOT NULL,
 revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
