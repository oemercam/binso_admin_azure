-- Do not infer how historical receipts were paid or rewrite old reimbursements.
alter table expenses add column payment_kind text not null default 'unknown'
 check(payment_kind in ('unknown','private','company_card','company_direct'));
comment on column expenses.payment_kind is 'Explicit payment source, independent of review/billable/reimbursed. Legacy source remains unknown.';

create function protect_expense_payment_source() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if tg_op='UPDATE' then
  if new.payment_kind is distinct from old.payment_kind and
   (old.status in ('approved','posted') or old.invoiced_invoice_id is not null or old.reimbursed_at is not null
    or (new.status in ('approved','rejected') and new.status is distinct from old.status)) then
   raise exception 'Reviewed expense payment source is immutable' using errcode='23514';
  end if;
  if new.reimbursed_at is not null and (old.reimbursed_at is null or
   row(new.reimbursed_at,new.reimbursement_reference,new.reimbursed_by_user_id) is distinct from
   row(old.reimbursed_at,old.reimbursement_reference,old.reimbursed_by_user_id)) and new.payment_kind<>'private' then
   raise exception 'Only an explicitly private expense can be reimbursed' using errcode='23514';
  end if;
 elsif new.reimbursed_at is not null and new.payment_kind<>'private' then
  raise exception 'Only an explicitly private expense can be reimbursed' using errcode='23514';
 end if;
 return new;
end $$;
create trigger expense_payment_source_guard before insert or update on expenses
 for each row execute function protect_expense_payment_source();
