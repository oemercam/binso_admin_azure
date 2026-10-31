/** Isolated migration/HTTP fixture only; never imported by application code. */
export async function reconcileFixtureQuotas(client,org){
 if(!(await client.query("select to_regclass('public.organization_quota_usage') present")).rows[0].present)return;
 if(!(await client.query('select rolsuper or rolbypassrls allowed from pg_roles where rolname=current_user')).rows[0]?.allowed)throw new Error('Synthetic quota inventory requires the isolated schema administrator');
 await client.query(`insert into organization_quota_usage(organization_id,period,used)
 select $1,'storage',coalesce(sum(n),0) from (
  select octet_length(body)::bigint n from file_contents where organization_id=$1
  union all select octet_length(pdf)::bigint from offer_versions where organization_id=$1
  union all select octet_length(pdf)::bigint from invoice_versions where organization_id=$1
  union all select octet_length(pdf)::bigint from report_exports where organization_id=$1
 ) inventory on conflict(organization_id,period) do nothing`,[org]);
 await client.query(`insert into organization_quota_usage(organization_id,period,used)
 select $1,to_char(created_at at time zone 'Europe/Zurich','YYYY-MM'),count(*) from (
  select created_at from invoices where organization_id=$1 union all
  select created_at from quotes where organization_id=$1
 ) documents group by 2 on conflict(organization_id,period) do update set used=greatest(organization_quota_usage.used,excluded.used)`,[org]);
}
export async function prepareHistoricalFixtureOwner(client){
 const org='00000000-0000-4000-8000-000000000099';
 const row=(await client.query('select is_demo from organizations where id=$1',[org])).rows[0];
 if(row?.is_demo!==true)throw new Error('Historical synthetic fixture is absent; never create it here');
 await client.query("insert into app_users(id,email,display_name,status) values('demo-readonly','historical-owner@fixture.invalid','Synthetic fixture owner','active') on conflict(id) do nothing");
 await client.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,'demo-readonly','historical-owner@fixture.invalid','owner','active') on conflict(organization_id,user_id) do nothing",[org]);
 for(const user of ['independent-time-reviewer','independent-expense-reviewer']){
  await client.query("insert into app_users(id,email,display_name,status) values($1,$2,'Synthetic independent reviewer','active') on conflict(id) do nothing",[user,user+'@fixture.invalid']);
  await client.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'admin','active') on conflict(organization_id,user_id) do nothing",[org,user,user+'@fixture.invalid']);
 }
 await reconcileFixtureQuotas(client,org);
}
