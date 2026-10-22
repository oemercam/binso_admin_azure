-- Additive opt-in calculation snapshots. Existing amounts and PDFs stay untouched.
alter table quotes add column calculation jsonb;
alter table invoices add column calculation jsonb;
alter table quotes add constraint quote_calculation_revision check(calculation is null or coalesce((calculation->>'revision'='1' and calculation->>'currency'=currency and jsonb_typeof(calculation->'lines')='array'),false));
alter table invoices add constraint invoice_calculation_revision check(calculation is null or coalesce((calculation->>'revision'='1' and calculation->>'currency'=currency and jsonb_typeof(calculation->'lines')='array' and (calculation->>'subtotal')::numeric=subtotal and (calculation->>'vat')::numeric=vat_amount and (calculation->>'total')::numeric=total_amount),false));
create function protect_document_calculation() returns trigger language plpgsql as $$ begin
 if old.status<>'draft' and new.calculation is distinct from old.calculation then raise exception 'Issued document calculation is immutable'; end if;
 return new;
end $$;
create trigger quote_calculation_immutable before update on quotes for each row execute function protect_document_calculation();
create trigger invoice_calculation_immutable before update on invoices for each row execute function protect_document_calculation();
