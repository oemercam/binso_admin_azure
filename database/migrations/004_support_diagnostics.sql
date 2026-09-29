begin;
alter table support_tickets add column if not exists diagnostics jsonb;
alter table support_tickets add column if not exists screenshot_data_url text;
commit;
