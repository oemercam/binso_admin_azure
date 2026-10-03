grant usage on schema public to binso_app;
grant select,insert,update,delete on all tables in schema public to binso_app;
grant usage,select on all sequences in schema public to binso_app;
grant execute on all functions in schema public to binso_app;
alter default privileges in schema public grant select,insert,update,delete on tables to binso_app;
alter default privileges in schema public grant usage,select on sequences to binso_app;
alter default privileges in schema public grant execute on functions to binso_app;
