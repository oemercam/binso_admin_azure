alter table support_messages add column if not exists internal boolean not null default false;
alter table support_cases force row level security;
alter table support_messages force row level security;
create policy support_cases_operator on support_cases
 using(current_setting('app.platform_operator',true)='true')
 with check(current_setting('app.platform_operator',true)='true');
create policy support_messages_operator on support_messages
 using(current_setting('app.platform_operator',true)='true')
 with check(current_setting('app.platform_operator',true)='true');
