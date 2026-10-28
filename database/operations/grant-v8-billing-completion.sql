-- REVIEWED OPERATION ONLY after the V8 migrations; never run automatically.
-- Existing runtime roles need only these additive object grants. No DDL/ownership.
begin;
do $$begin
 if not exists(select 1 from pg_roles where rolname='binso_runtime' and not rolsuper and not rolbypassrls and not rolcreatedb and not rolcreaterole and not rolreplication) then
  raise exception 'Inspect the existing restricted runtime role before granting V8 objects';
 end if;
end $$;
grant select,insert,update,delete on invoice_billing_scopes,invoice_advance_allocations to binso_runtime;
grant select on billing_scope_invoices,billing_scope_lines to binso_runtime;
commit;
