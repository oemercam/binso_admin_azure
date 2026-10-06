-- Preserve structured names; existing contact IDs and document references stay intact.
alter table customer_contacts add column if not exists first_name text;
alter table customer_contacts add column if not exists last_name text;
update customer_contacts set first_name=split_part(name,' ',1),last_name=case when position(' ' in name)>0 then substring(name from position(' ' in name)+1) else '' end where first_name is null;
