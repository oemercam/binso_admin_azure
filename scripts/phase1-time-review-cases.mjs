import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function verifyTimeReview({db,load,request,current,foreignOrganizationId}){
 const bulk=await import(await load('app/api/time-entries/review/route.ts'));
 const org=current.organizationId,user=current.userId,peer='phase1-review-'+randomUUID();
 await db.query("insert into app_users(id,email,display_name,status) values($1,$2,'Synthetic reviewer','active')",[peer,peer+'@example.invalid']);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'member','active')",[org,peer,peer+'@example.invalid']);
 const ids=[];
 const entry=async(tenant,actor,submitted=false)=>{const id=randomUUID();ids.push(id);await db.query("insert into time_entries(id,organization_id,external_id,person_name,worker_type,work_date,hours,description,billable,approved,created_by_user_id,submitted_at) values($1::uuid,$2,$1::text,'Synthetic','employee',current_date,1,'Phase 1 isolated review',false,false,$3,case when $4::boolean then now() else null end)",[id,tenant,actor,submitted]);return id};
 const post=(ids,action)=>bulk.POST(request('POST',{ids,action},'https://example.invalid/api/time-entries/review'));
 const read=async id=>(await db.query('select approved,submitted_at from time_entries where id=$1',[id])).rows[0];
 try{
  const own1=await entry(org,user),own2=await entry(org,user),foreign=await entry(foreignOrganizationId,user),review1=await entry(org,peer,true),review2=await entry(org,peer,true);
  assert.equal((await post([own1,own1],'submit')).status,400,'Duplicate selection cannot perform or audit a transition twice');
  assert.equal((await post([], 'submit')).status,400);
  assert.equal((await post([own1], 'reject')).status,400,'Batch rejects unsupported transitions');
  assert.equal((await post([own1,foreign],'submit')).status,404,'A different tenant remains invisible');
  assert.equal((await read(own1)).submitted_at,null,'A mixed invalid selection rolls back earlier entries');
  assert.equal((await post([own1,own2],'submit')).status,200);
  for(const id of [own1,own2]){const row=await read(id);assert.ok(row.submitted_at);assert.equal(row.approved,false,'Team submission never self-approves');}
  assert.equal((await post([own1],'approve')).status,403,'Team owner cannot approve their own time');
  assert.equal((await post([review1,review2],'approve')).status,200);
  for(const id of [review1,review2])assert.equal((await read(id)).approved,true);
  const audit=(await db.query("select action,entity_id from audit_events where organization_id=$1 and entity_id=any($2::text[])",[org,[own1,own2,review1,review2]])).rows;
  assert.equal(audit.filter(row=>row.action==='time.submitted').length,2);
  assert.equal(audit.filter(row=>row.action==='time.approved').length,2);
  const untouched=await entry(org,peer,true);
  await db.query("update organization_memberships set role='member' where organization_id=$1 and user_id=$2",[org,user]);
  assert.equal((await post([untouched],'approve')).status,403,'Member role cannot invoke batch approval directly');
  assert.equal((await read(untouched)).approved,false);
 }finally{
  await db.query('update organization_memberships set role=$1 where organization_id=$2 and user_id=$3',[current.role,org,user]);
  await db.query('delete from audit_events where entity_id=any($1::text[])',[ids]);
  await db.query('delete from time_entries where id=any($1::uuid[])',[ids]);
  await db.query('delete from organization_memberships where user_id=$1',[peer]);
  await db.query('delete from app_users where id=$1',[peer]);
 }
 console.log('Phase 1 time review: real scoped atomic batch, audit, duplicate/foreign selection, role and self-approval denials passed.');
}
