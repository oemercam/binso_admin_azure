-- Optional self-service UI preference; existing identities and privileges stay intact.
alter table platform_operator_assignments add column language text
 check(language in ('de','fr','it','en'));
