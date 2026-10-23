import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Platform transaction mirrors the existing isolated auth owner with the same
// restricted runtime role. Only the external mail transport is synthetic.
export async function verifyInvitationContract({load,mock,db,org,other,act,request,setAuditFailure}){
 const mails=[];let transportAvailable=true;
 const {mailLayout}=load('lib/server/email.ts');
 mock('lib/server/email.ts',{mailLayout,sendMail:async mail=>{mails.push(mail);return {delivered:transportAvailable};}});
 const invite=load('app/api/settings/team/invitations/route.ts'),resend=load('app/api/settings/team/invitations/[id]/route.ts'),accept=load('app/api/auth/invitation/route.ts');
 const {NextRequest}=await import('next/server.js');
 const sessions=(await db.query('select id,user_id,organization_id from auth_sessions')).rows;
 const as=(role,organizationId=org,extra={})=>{const userId='employee-dossier-'+(organizationId===other?'foreign':role);return act(role,organizationId,{userId,sessionId:sessions.find(s=>s.user_id===userId&&s.organization_id===organizationId)?.id,...extra});};
 const create=(email,key=randomUUID())=>invite.POST(request({email,role:'member',moduleProfile:'time_only'},key));
 const again=(id,key=randomUUID())=>resend.POST(request({},key),{params:Promise.resolve({id})});
 const token=()=>new URL(mails.at(-1).text.match(/https?:\/\/\S+/)[0]).searchParams.get('token');
 const preview=t=>accept.GET(new NextRequest('https://employee.invalid/api/auth/invitation?token='+encodeURIComponent(t)));
 for(const id of [org,other])await db.query('insert into organization_entitlements(organization_id,max_users) values($1,9) on conflict(organization_id) do update set max_users=9',[id]);
 as('owner');let result=await create('synthetic-invite@example.invalid');assert.equal(result.status,201,await result.clone().text());
 const old=(await result.json()).id,oldToken=token();
 assert.equal((await preview(oldToken)).status,200);assert.equal((await preview(oldToken)).status,200,'GET does not consume an invitation');
 const key=randomUUID();result=await again(old,key);assert.equal(result.status,201,await result.clone().text());
 const next=(await result.json()).id,newToken=token();assert.notEqual(old,next);assert.notEqual(newToken,oldToken);
 assert.equal((await preview(oldToken)).status,400,'Old token is unusable after explicit resend');
 assert.equal((await preview(newToken)).status,200);
 const rotated=(await db.query('select role,module_profile,status,expires_at-created_at ttl from organization_invitations where id=$1',[next])).rows[0];
 assert.equal((await db.query("select expires_at=created_at+interval '7 days' valid from organization_invitations where id=$1",[next])).rows[0].valid,true,'New invitation has exactly seven days');
 assert.equal(rotated.role,'member');assert.equal(rotated.module_profile,'time_only');
 assert.equal((await db.query("select consumed_at is not null consumed from auth_tokens where metadata->>'invitation_id'=$1",[old])).rows[0].consumed,true);
 const mailCount=mails.length;assert.equal((await again(old,key)).status,201);assert.equal(mails.length,mailCount,'Same request does not resend accepted mail');
 assert.equal((await again(old)).status,409,'A different request cannot rotate the revoked invitation again');
 for(const role of ['finance','hr','project_manager','manager','member','reader']){as(role);assert.equal((await again(next)).status,403);}
 as('owner',other);assert.equal((await again(next)).status,404);
 as('owner',org,{organizationStatus:'read_only'});assert.equal((await again(next)).status,403);
 as('owner');setAuditFailure(true);assert.equal((await again(next)).status,500);setAuditFailure(false);
 assert.equal((await preview(newToken)).status,200,'Failed audit restores previous invitation/token');assert.equal(mails.length,mailCount,'Rolled-back replacement never sends mail');
 result=await accept.POST(request({token:newToken,password:'Synthetic-password-123!',firstName:'Synthetic',lastName:'Invite'}));assert.equal(result.status,200,await result.clone().text());
 assert.equal((await preview(newToken)).status,400);assert.equal((await accept.POST(request({token:newToken,password:'Synthetic-password-123!'}))).status,400,'Invitation is single use');
 const member=(await db.query("select m.status,m.module_profile from organization_memberships m where m.organization_id=$1 and m.email='synthetic-invite@example.invalid'",[org])).rows[0];assert.equal(member.status,'active');assert.equal(member.module_profile,'time_only');
 as('owner');await db.query('update organization_entitlements set max_users=15 where organization_id=$1',[org]);
 result=await create('synthetic-retry@example.invalid');assert.equal(result.status,201);const failedOld=(await result.json()).id;
 transportAvailable=false;const failedKey=randomUUID();assert.equal((await again(failedOld,failedKey)).status,503);const failedToken=token();
 assert.equal((await preview(failedToken)).status,200,'Failed transport preserves the newly issued invitation');
 transportAvailable=true;assert.equal((await again(failedOld,failedKey)).status,201);assert.equal(token(),failedToken,'Explicit same-key retry keeps the token and outbox');
 const pending=(await db.query("select id from organization_invitations where organization_id=$1 and email='synthetic-retry@example.invalid' and status='pending'",[org])).rows;assert.equal(pending.length,1);
 result=await resend.DELETE(request({},randomUUID(),'DELETE'),{params:Promise.resolve({id:pending[0].id})});assert.equal(result.status,200);assert.equal((await preview(failedToken)).status,400,'Revocation consumes the token too');
 as('owner');assert.equal((await create('dossier-foreign@example.invalid')).status,409,'An identity in another company is not invited into a second one');
 const existingId=randomUUID(),password='Synthetic-existing-password-123!',hash=await load('lib/server/password.ts').hashPassword(password);
 await db.query("insert into app_users(id,email,display_name,status,password_hash) values($1,'synthetic-existing@example.invalid','Synthetic active','active',$2)",[existingId,hash]);
 result=await create('synthetic-existing@example.invalid');assert.equal(result.status,201);const existingToken=token();
 assert.equal((await accept.POST(request({token:existingToken,password:'Synthetic-wrong-password-123!'}))).status,403,'A token alone cannot take over an existing account');
 assert.equal((await preview(existingToken)).status,200,'Wrong password does not consume a valid invitation');
 assert.equal((await accept.POST(request({token:existingToken,password}))).status,200);
 assert.equal((await db.query('select password_hash from app_users where id=$1',[existingId])).rows[0].password_hash,hash,'Existing account password stays unchanged');
 result=await create('synthetic-expired@example.invalid');assert.equal(result.status,201);const expired=(await result.json()).id,expiredToken=token();
 await db.query("update auth_tokens set expires_at=now()-interval '1 second' where metadata->>'invitation_id'=$1",[expired]);assert.equal((await preview(expiredToken)).status,400,'Expired token cannot preview');
 console.log('Invitations: real runtime auth routes/SQL, GET non-consumption, seven-day token rotation, full-seat replacement, role/profile preservation, single-use activation, retry/outbox deduplication, revoke, tenant/roles and atomic rollback passed. External delivery is synthetic and remains unqualified.');
}
