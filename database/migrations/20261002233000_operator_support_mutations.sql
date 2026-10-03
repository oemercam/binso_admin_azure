-- Operator mutation policies for support workflows.
-- Operator reads were added earlier; these explicit policies enable only the mutations used by server-checked Operator routes.

drop policy if exists support_tickets_operator_update on public.support_tickets;
create policy support_tickets_operator_update on public.support_tickets
for update
using(public.is_operator())
with check(public.is_operator());

drop policy if exists support_messages_operator_insert on public.support_messages;
create policy support_messages_operator_insert on public.support_messages
for insert
with check(
  public.is_operator()
  and author_type='operator'
  and author_user_id=auth.uid()
);

drop policy if exists support_messages_operator_update on public.support_messages;
create policy support_messages_operator_update on public.support_messages
for update
using(public.is_operator())
with check(public.is_operator());
