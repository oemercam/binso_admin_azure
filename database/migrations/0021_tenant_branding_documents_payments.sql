-- Binso One tenant branding, document, payment and mail settings.
alter table organizations add column if not exists legal_name text;
alter table organizations add column if not exists legal_form text;
alter table organizations add column if not exists uid text;
alter table organizations add column if not exists vat_number text;
alter table organizations add column if not exists street text;
alter table organizations add column if not exists building_number text;
alter table organizations add column if not exists postal_code text;
alter table organizations add column if not exists city text;
alter table organizations add column if not exists country_code text not null default 'CH';
alter table organizations add column if not exists email text;
alter table organizations add column if not exists phone text;
alter table organizations add column if not exists website text;
alter table organizations add column if not exists logo_url text;
alter table organizations add column if not exists vat_rate numeric(5,2) not null default 8.1;
alter table organizations add column if not exists payment_terms_days integer not null default 30 check (payment_terms_days between 0 and 365);
alter table organizations add column if not exists iban text;
alter table organizations add column if not exists qr_iban text;
alter table organizations add column if not exists invoice_intro_text text;
alter table organizations add column if not exists invoice_footer_text text;
alter table organizations add column if not exists quote_intro_text text;
alter table organizations add column if not exists quote_footer_text text;
alter table organizations add column if not exists mail_sender_name text;
alter table organizations add column if not exists mail_reply_to text;
alter table organizations add column if not exists mail_signature text;

alter table invoices add column if not exists issuer_snapshot jsonb not null default '{}'::jsonb;
alter table invoices add column if not exists customer_snapshot jsonb not null default '{}'::jsonb;
alter table invoices add column if not exists payment_snapshot jsonb not null default '{}'::jsonb;
alter table invoices add column if not exists document_snapshot jsonb not null default '{}'::jsonb;
alter table quotes add column if not exists issuer_snapshot jsonb not null default '{}'::jsonb;
alter table quotes add column if not exists customer_snapshot jsonb not null default '{}'::jsonb;
alter table quotes add column if not exists document_snapshot jsonb not null default '{}'::jsonb;

comment on column invoices.issuer_snapshot is 'Immutable issuer identity and branding captured when the invoice is issued.';
comment on column invoices.customer_snapshot is 'Immutable recipient identity and address captured when the invoice is issued.';
comment on column invoices.payment_snapshot is 'Immutable IBAN/QR-IBAN/reference settings captured when the invoice is issued.';

create table if not exists web_vitals (
 id bigserial primary key,
 metric text not null,
 value numeric not null,
 rating text not null,
 route text not null,
 created_at timestamptz not null default now()
);
create index if not exists idx_web_vitals_created on web_vitals(created_at desc);
