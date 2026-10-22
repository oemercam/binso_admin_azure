import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export async function verifyOfferResponseMail({portal,token,linkId,session,sql}){
 const org=session.organizationId,originalTx=globalThis.__publicTransaction;
 const prior=(await sql("select email from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[org,session.userId])).rows[0];
 const preference=value=>sql("insert into notification_preferences(organization_id,user_id,kind,email,in_app) values($1,$2,'Angebote',$3,true) on conflict(organization_id,user_id,kind) do update set email=excluded.email",[org,session.userId,value]);
 // Advance only this synthetic link's challenge history after verifying the real rate limit.
 let challenges=0;
 const prepare=async()=>{if(challenges===5){await assert.rejects(()=>portal.requestOfferCode(token,'question'),e=>e.code==='code_rate_limited');await sql("update offer_recipient_codes set created_at=now()-interval '16 minutes' where link_id=$1",[linkId]);challenges=0;}challenges++;globalThis.__publicMailAvailable=true;globalThis.__publicMailThrow=false;await portal.requestOfferCode(token,'question');return {action:'question',code:globalThis.__publicMails.at(-1).text.match(/: (\d{6})\./)[1],body:'Durable synthetic reply '+randomUUID(),requestKey:randomUUID(),confirmed:true}};
 const rows=async input=>(await sql("select kind,status,attempts from mail_outbox where organization_id=$1 and entity_id=$2 order by kind",[org,linkId+':'+input.requestKey])).rows;
 const events=async input=>Number((await sql("select count(*) n from offer_public_events where organization_id=$1 and link_id=$2 and request_key=$3",[org,linkId,input.requestKey])).rows[0].n);
 try{
  await preference(true);
  const failed=await prepare();globalThis.__publicMailAvailable=false;assert.equal((await portal.respondToOffer(token,failed)).notification,'unconfirmed');assert.deepEqual((await rows(failed)).map(row=>row.status),['failed','failed']);assert.equal(await events(failed),1);
  globalThis.__publicMailAvailable=true;const before=globalThis.__publicMails.length;assert.equal((await portal.respondToOffer(token,failed)).confirmation,'already_recorded');assert.equal(globalThis.__publicMails.length,before+2);assert.deepEqual((await rows(failed)).map(row=>row.status),['accepted','accepted']);assert.ok((await rows(failed)).every(row=>row.attempts===2));await portal.respondToOffer(token,failed);assert.equal(globalThis.__publicMails.length,before+2,'Accepted messages never repeat');assert.equal(await events(failed),1);
  const ambiguous=await prepare();globalThis.__publicMailThrow=true;assert.equal((await portal.respondToOffer(token,ambiguous)).notification,'unconfirmed');assert.deepEqual((await rows(ambiguous)).map(row=>row.status),['uncertain','uncertain']);const uncertainCount=globalThis.__publicMails.length;globalThis.__publicMailThrow=false;await portal.respondToOffer(token,ambiguous);assert.equal(globalThis.__publicMails.length,uncertainCount,'Unknown outcomes cannot be blindly retried');assert.equal(await events(ambiguous),1);
  const interrupted=await prepare();let failClaim=true;
  globalThis.__publicTransaction=fn=>originalTx(c=>fn({query:(text,args)=>{if(failClaim&&text.includes("update mail_outbox set status='sending'"))throw Error('Synthetic claim interruption');return c.query(text,args)}}));
  const queuedBefore=globalThis.__publicMails.length;assert.equal((await portal.respondToOffer(token,interrupted)).notification,'unconfirmed');assert.deepEqual((await rows(interrupted)).map(row=>row.status),['queued','queued']);assert.equal(globalThis.__publicMails.length,queuedBefore);assert.equal(await events(interrupted),1);failClaim=false;await portal.respondToOffer(token,interrupted);assert.deepEqual((await rows(interrupted)).map(row=>row.status),['accepted','accepted']);assert.equal(globalThis.__publicMails.length,queuedBefore+2);assert.equal(await events(interrupted),1);
  const rolledBack=await prepare();let failQueue=true;
  globalThis.__publicTransaction=fn=>originalTx(c=>fn({query:(text,args)=>{if(failQueue&&text.includes('insert into mail_outbox'))throw Error('Synthetic response outbox failure');return c.query(text,args)}}));
  await assert.rejects(()=>portal.respondToOffer(token,rolledBack),/Synthetic response outbox failure/);assert.equal(await events(rolledBack),0);assert.equal((await rows(rolledBack)).length,0,'Decision and mail intent roll back together');failQueue=false;await portal.respondToOffer(token,rolledBack);assert.equal(await events(rolledBack),1);globalThis.__publicTransaction=originalTx;
  const optedOut=await prepare();globalThis.__publicMailAvailable=false;await portal.respondToOffer(token,optedOut);await preference(false);globalThis.__publicMailAvailable=true;const count=globalThis.__publicMails.length;await portal.respondToOffer(token,optedOut);assert.equal(globalThis.__publicMails.length,count+1,'Retry honours current employee opt-out');assert.deepEqual((await rows(optedOut)).map(row=>row.status),['accepted','cancelled']);
  await preference(true);
  const auditRollback=await prepare();
  globalThis.__publicTransaction=fn=>originalTx(c=>fn({query:(text,args)=>{if(text.includes('insert into audit_events'))throw Error('Synthetic response audit failure');return c.query(text,args)}}));
  await assert.rejects(()=>portal.respondToOffer(token,auditRollback),/Synthetic response audit failure/);globalThis.__publicTransaction=originalTx;
  assert.equal(await events(auditRollback),0);assert.equal((await rows(auditRollback)).length,0,'Audit failure rolls back response and jobs');
  await portal.respondToOffer(token,auditRollback);assert.equal(await events(auditRollback),1,'Rolled-back code remains usable');
  const lostResult=await prepare();
  globalThis.__publicTransaction=fn=>originalTx(c=>fn({query:(text,args)=>{if(text.includes('insert into audit_events')&&args.includes('offer.response.mail.result'))throw Error('Synthetic result audit interruption');return c.query(text,args)}}));
  await portal.respondToOffer(token,lostResult);globalThis.__publicTransaction=originalTx;
  assert.deepEqual((await rows(lostResult)).map(row=>row.status),['sending','sending'],'Unrecorded provider result stays blocked');
  const sentCount=globalThis.__publicMails.length;await portal.respondToOffer(token,lostResult);assert.equal(globalThis.__publicMails.length,sentCount,'Sending after interruption is never blindly resent');
  const auditRows=(await sql("select action,detail from audit_events where organization_id=$1 and action like 'offer.%'",[org])).rows;
  assert.ok(auditRows.some(row=>row.action==='offer.response.mail.claimed'));assert.ok(auditRows.some(row=>row.action==='offer.response.mail.result'));
  assert.equal(JSON.stringify(auditRows).includes(token),false,'Capability cannot leak into audit');
  assert.equal(JSON.stringify((await sql('select title,body,href from in_app_notifications where organization_id=$1',[org])).rows).includes(token),false,'Internal notification contains no capability');
  const identity=(await sql('select email,email_verified_at from app_users where id=$1',[session.userId])).rows[0];
  try{
   await sql('update app_users set email_verified_at=now() where id=$1',[session.userId]);
   const verified=await prepare(),start=globalThis.__publicMails.length;await portal.respondToOffer(token,verified);
   assert.ok(globalThis.__publicMails.slice(start).every(mail=>mail.replyTo===identity.email),'Reply-To uses the verified active tenant identity');
   await sql('update app_users set email_verified_at=null where id=$1',[session.userId]);
   const unverified=await prepare(),unverifiedStart=globalThis.__publicMails.length;await portal.respondToOffer(token,unverified);
   assert.ok(globalThis.__publicMails.slice(unverifiedStart).every(mail=>mail.replyTo===undefined),'Unverified Reply-To is omitted');
  }finally{await sql('update app_users set email_verified_at=$2 where id=$1',[session.userId,identity.email_verified_at]);}
  await originalTx(async c=>{await c.query("select set_config('app.offer_token_hash','',true)");assert.equal((await c.query("select id from mail_outbox where organization_id=$1 and kind in ('offer_confirmation','offer_employee')",[org])).rows.length,0)});
 }finally{globalThis.__publicTransaction=originalTx;globalThis.__publicMailAvailable=true;globalThis.__publicMailThrow=false;if(prior)await preference(prior.email);else await sql("delete from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[org,session.userId]);}
 console.log('Offer response outbox: atomic decision/intent, queued crash recovery, definite-failure replay, accepted/ambiguous deduplication, current opt-out, RLS and single decision passed. No real mail delivery.');
}

export async function verifyOfferDecisionSafety({portal,createLink,sql,session}){
 const originalTx=globalThis.__publicTransaction;
 for(const action of ['accept','decline']){
  const {link,url}=await createLink(),token=new URL(url).hash.slice(1);
  await portal.requestOfferCode(token,action);const code=globalThis.__publicMails.at(-1).text.match(/: (\d{6})\./)[1];
  const input={action,code,body:'Synthetic decision',requestKey:randomUUID(),confirmed:true};
  const state=async()=>(await sql('select q.status,q.decision_at from quotes q join offer_versions v on v.quote_id=q.id and v.organization_id=q.organization_id where v.id=$1',[link.version_id])).rows[0];
  const initial=await state(),before=globalThis.__publicMails.length;
  globalThis.__publicTransaction=fn=>originalTx(c=>fn({query:(text,args)=>{if(text.includes('insert into audit_events'))throw Error('Synthetic decision audit failure');return c.query(text,args)}}));
  await assert.rejects(()=>portal.respondToOffer(token,input),/Synthetic decision audit failure/);globalThis.__publicTransaction=originalTx;
  assert.deepEqual(await state(),initial,'Audit error rolls back the actual quote decision');
  assert.equal((await sql('select id from offer_public_events where link_id=$1',[link.id])).rows.length,0);
  assert.equal((await sql('select id from mail_outbox where entity_id=$1',[link.id+':'+input.requestKey])).rows.length,0);assert.equal(globalThis.__publicMails.length,before);
  await portal.respondToOffer(token,input);const decided=await state();assert.equal(decided.status,action==='accept'?'accepted':'declined');assert.ok(decided.decision_at);
  await portal.respondToOffer(token,input);await assert.rejects(()=>portal.respondToOffer(token,{...input,requestKey:randomUUID(),action:action==='accept'?'decline':'accept'}),e=>e.code==='decision_recorded');assert.deepEqual(await state(),decided);
  for(const [column,value] of [['revoked_at',new Date()],['expires_at',new Date(0)]]){
   await sql('update offer_public_links set '+column+'=$2 where id=$1',[link.id,value]);await assert.rejects(()=>portal.respondToOffer(token,input),e=>e.code==='offer_unavailable');
   await sql('update offer_public_links set revoked_at=null,expires_at=now()+interval \'1 day\' where id=$1',[link.id]);
  }
  await assert.rejects(()=>portal.respondToOffer('x'.repeat(43),input),e=>e.code==='offer_unavailable');
  await sql('update quotes set offer_version=offer_version+1 where id=(select quote_id from offer_versions where id=$1)',[link.version_id]);
  await assert.rejects(()=>portal.respondToOffer(token,input),e=>e.code==='offer_unavailable','A superseded version cannot resume mail');
  await sql('update quotes set offer_version=offer_version-1 where id=(select quote_id from offer_versions where id=$1)',[link.version_id]);
  // This quote has no workforce assignment: project_manager/manager remain scope-denied by RLS.
  const membership=(await sql('select role from organization_memberships where organization_id=$1 and user_id=$2',[session.organizationId,session.userId])).rows[0];
  try{for(const role of ['owner','admin','finance','hr','project_manager','manager','member','reader']){await sql('update organization_memberships set role=$3 where organization_id=$1 and user_id=$2',[session.organizationId,session.userId,role]);if(['owner','admin'].includes(role))assert.equal((await portal.respondToOffer(token,input)).confirmation,'already_recorded');else await assert.rejects(()=>portal.respondToOffer(token,input),e=>e.code==='offer_unavailable');}}
  finally{await sql('update organization_memberships set role=$3 where organization_id=$1 and user_id=$2',[session.organizationId,session.userId,membership.role]);}
 }
 console.log('Offer decisions: accept/decline, quote/event/job/audit rollback, stable replay, opposite decision denial, expired/revoked/invalid capability and fresh role revocation passed.');
}
