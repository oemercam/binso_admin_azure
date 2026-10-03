alter table public.tenants
  add column if not exists uid text,
  add column if not exists street text,
  add column if not exists postal_code text,
  add column if not exists city text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists vat_rate numeric(5,2) not null default 8.1,
  add column if not exists payment_terms_days int not null default 30 check (payment_terms_days between 0 and 365);

alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists job_title text,
  add column if not exists language text not null default 'de-CH';
