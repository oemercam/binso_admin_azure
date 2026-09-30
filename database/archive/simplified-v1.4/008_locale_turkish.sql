begin;
alter table users drop constraint if exists users_language_check;
alter table users add constraint users_language_check check(language in ('de','en','fr','it','tr'));
commit;
