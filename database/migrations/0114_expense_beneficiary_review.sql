-- An independent review excludes both the author and the actual beneficiary.
-- Do not rewrite historical reviews or the immutable reimbursement evidence.
create function protect_expense_beneficiary_review() returns trigger language plpgsql
set search_path=pg_catalog,public as $$
begin
 if new.status in ('approved','rejected') and new.status is distinct from old.status
  and exists(select 1 from public.employees e where e.organization_id=new.organization_id
   and e.id=new.employee_id and e.user_id=current_setting('app.user_id',true)) then
  raise exception 'Independent expense beneficiary review required' using errcode='42501';
 end if;
 return new;
end $$;
create trigger expense_beneficiary_review_guard before update on expenses
 for each row execute function protect_expense_beneficiary_review();
