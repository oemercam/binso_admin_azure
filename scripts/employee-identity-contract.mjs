import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function verifyEmployeeIdentityContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const sessions=(await db.query('select id,user_id,organization_id from auth_sessions')).rows;
 const as=(role,organizationId=org,extra={})=>{const userId='employee-dossier-'+(organizationId===other?'foreign':role);return act(role,organizationId,{userId,sessionId:sessions.find(s=>s.user_id===userId&&s.organization_id===organizationId)?.id,...extra});};
 const route=load('app/api/workforce-assignments/route.ts'),employees=load('app/api/employees/route.ts');
 const dossier=async name=>{as('owner');const r=await employees.POST(request({firstName:'Synthetic',lastName:name,jobTitle:'Consultant',workloadPercent:80,weeklyHours:32,vacationDays:25,entryDate:'2026-01-01'}));assert.equal(r.status,201);return (await r.json()).item.id;};
 const id=await dossier('Identity'),second=await dossier('Second identity'),userId='employee-dossier-member';
 const body={mode:'bind_identity',employeeId:id,userId,expectedUserId:null},key=randomUUID();
 const write=(input=body,k=randomUUID())=>route.POST(request(input,k));
 const accounts=(await db.query('select count(*)::int n from app_users')).rows[0].n;
 const assignments=(await db.query('select count(*)::int n from workforce_assignments where organization_id=$1',[org])).rows[0].n;
 const ownerSession=sessions.find(s=>s.user_id==='employee-dossier-owner').id;
 await db.query("update auth_sessions set step_up_at=now()-interval '6 minutes' where id=$1",[ownerSession]);
 assert.equal((await write()).status,403,'Explicit identity binding requires fresh proof');
 await db.query('update auth_sessions set step_up_at=now() where id=$1',[ownerSession]);
 let result=await write(body,key);assert.equal(result.status,201,await result.clone().text());
 assert.deepEqual((await result.json()).item,{id,user_id:userId});
 assert.equal((await write(body,key)).status,201,'Lost binding response replays safely');
 assert.equal((await write({...body,userId:'employee-dossier-reader'},key)).status,409);
 assert.equal((await write({...body,userId:'employee-dossier-reader',expectedUserId:userId})).status,409,'No silent reassignment of an already linked dossier');
 assert.equal((await write({...body,employeeId:second})).status,409,'One active dossier per account');
 for(const role of ['finance','hr','project_manager','manager','member','reader']){as(role);assert.equal((await write()).status,403,'HR alone cannot manage identities');}
 as('owner',other);assert.equal((await write()).status,404);
 as('owner',org,{organizationStatus:'read_only'});assert.equal((await write()).status,403);
 as('owner');
 assert.equal((await write({...body,employeeId:second,userId:'employee-dossier-foreign'})).status,409,'Foreign account cannot be linked');
 assert.equal((await write({...body,employeeId:second,userId:'employee-dossier-reader',monthlyGross:1})).status,400);
 await db.query("update organization_memberships set status='invited' where organization_id=$1 and user_id='employee-dossier-reader'",[org]);
 assert.equal((await write({...body,employeeId:second,userId:'employee-dossier-reader'})).status,409,'Inactive membership is not an active account');
 await db.query("update organization_memberships set status='active' where organization_id=$1 and user_id='employee-dossier-reader'",[org]);
 await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);assert.equal((await write()).status,403);
 await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[org]);
 setAuditFailure(true);assert.equal((await write({...body,employeeId:second,userId:'employee-dossier-reader'})).status,500);setAuditFailure(false);
 assert.equal((await transaction(org,'employee-dossier-owner',c=>c.query('select user_id from employees where id=$1',[second]))).rows[0].user_id,null);
 assert.equal((await db.query('select count(*)::int n from app_users')).rows[0].n,accounts,'No account implicitly created');
 assert.equal((await db.query('select count(*)::int n from workforce_assignments where organization_id=$1',[org])).rows[0].n,assignments,'Binding alone grants no customer/project access');
 as('owner');
 console.log('Employee identity: actual explicit binding, active same-tenant membership, one dossier per identity, no silent relink/account/project grant, freshness/replay/roles/plan and audit rollback passed. Invitation rotation remains separate.');
}
