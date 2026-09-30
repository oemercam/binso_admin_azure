begin;

alter table stored_files add column if not exists support_ticket_id uuid references support_tickets(id) on delete cascade;
create index if not exists stored_files_support_ticket_idx on stored_files(organization_id,support_ticket_id,created_at);


create sequence if not exists support_ticket_number_seq;
do $$
declare max_no bigint;
begin
 select coalesce(max(substring(ticket_number from '[0-9]+$')::bigint),0) into max_no from support_tickets;
 if max_no > 0 then
  perform setval('support_ticket_number_seq',max_no,true);
 end if;
end $$;

commit;
