-- Existing records remain unclassified; do not infer legal identity from a name.
alter table customers add column customer_type text
  check (customer_type in ('company','person'));
