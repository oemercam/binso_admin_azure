/** Isolated migration/HTTP fixture only; never imported by application code. */
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
}
