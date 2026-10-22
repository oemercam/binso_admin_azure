-- Capture actual full reimbursement evidence. Never infer dates for history.
alter table expenses add column reimbursement_paid_on date;
alter table expenses add column reimbursement_amount numeric(18,2);
alter table expenses add column reimbursement_currency text check(reimbursement_currency in ('CHF','EUR'));

create function protect_expense_reimbursement_evidence() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if tg_op='UPDATE' and old.reimbursed_at is not null then
  if row(new.reimbursed_at,new.reimbursement_reference,new.reimbursed_by_user_id,new.reimbursement_paid_on,new.reimbursement_amount,new.reimbursement_currency)
   is distinct from row(old.reimbursed_at,old.reimbursement_reference,old.reimbursed_by_user_id,old.reimbursement_paid_on,old.reimbursement_amount,old.reimbursement_currency) then
   raise exception 'Recorded reimbursement evidence is immutable' using errcode='23514';
  end if;
 elsif new.reimbursed_at is not null then
  if new.payment_kind<>'private' or new.status not in ('approved','posted')
   or new.reimbursement_paid_on is null or new.reimbursement_paid_on>(now() at time zone 'Europe/Zurich')::date
   or new.reimbursement_amount is distinct from round(new.quantity*new.unit_price,2) or new.reimbursement_amount<=0
   or new.reimbursement_currency is distinct from new.currency or nullif(btrim(new.reimbursement_reference),'') is null
   or new.reimbursed_by_user_id is distinct from current_setting('app.user_id',true)
   or app_workforce_role() not in ('owner','admin','finance') then
   raise exception 'Valid private reimbursement evidence required' using errcode='23514';
  end if;
 elsif new.reimbursement_paid_on is not null or new.reimbursement_amount is not null or new.reimbursement_currency is not null then
  raise exception 'Reimbursement evidence requires explicit confirmation' using errcode='23514';
 end if;
 return new;
end $$;
create trigger expense_reimbursement_evidence_guard before insert or update on expenses
 for each row execute function protect_expense_reimbursement_evidence();
