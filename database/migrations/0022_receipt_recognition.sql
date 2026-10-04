-- Receipt recognition audit fields and document defaults separation support.
alter table expenses add column if not exists receipt_extraction jsonb not null default '{}'::jsonb;
alter table expenses add column if not exists receipt_confidence numeric(5,4);
alter table expenses add column if not exists receipt_original_name text;
alter table expenses add column if not exists receipt_normalized_name text;
alter table expenses add column if not exists receipt_verified_at timestamptz;
comment on column expenses.receipt_extraction is 'Machine-extracted receipt values before user confirmation.';
comment on column expenses.receipt_verified_at is 'Set when a user confirms or edits extracted receipt values.';
