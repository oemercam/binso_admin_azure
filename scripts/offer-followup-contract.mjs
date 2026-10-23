import assert from 'node:assert/strict';
/** The actual repository and migrated tables; only disposable fixture data. */
export async function verifyOfferFollowups({service,sql,transaction,session,createIssued,today,parallel=false}){
 const s={...session,isDemo:false,organizationStatus:'active'},org=s.organizationId;
 const preferenceBefore=(await sql("select in_app,updated_at from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[org,s.userId])).rows[0];
 const inTenant=(fn,actor=s)=>transaction(actor,client=>fn(client,actor));
 await inTenant(async c=>{
  const guard=(await c.query('select current_user as role,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0];
  assert.equal(guard.rolsuper,false);assert.equal(guard.rolbypassrls,false);
  assert.ok(['binso_runtime','binso_followup_fixture'].includes(guard.role),'RLS assertions must execute as the restricted runtime/test role, never the schema owner');
 });
 const offer=await createIssued(),schedule={action:'schedule',dueDate:today,optIn:true};
 assert.equal((await inTenant((c,a)=>service.offerFollowupHistory(c,a,offer.number))).items.length,0,'No default opt-in');
 for(const input of [{...schedule,optIn:false},{...schedule,dueDate:'2026-02-30'},{...schedule,dueDate:'1900-01-01'},{...schedule,dueDate:'2999-12-31'}])await assert.rejects(()=>inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,input)),e=>e.code==='followup_invalid');
 for(const actor of [{...s,role:'member'},{...s,role:'finance'},{...s,role:'reader'},{...s,moduleProfile:'time_only'},{...s,organizationStatus:'read_only'},{...s,isDemo:true}])await assert.rejects(()=>inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,schedule),actor));
 await inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,schedule));
 await inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,schedule));
 assert.equal((await inTenant((c,a)=>service.offerFollowupHistory(c,a,offer.number))).items.length,1,'Lost schedule response cannot create a second reminder');
 const future=new Date(today+'T12:00:00Z');future.setUTCDate(future.getUTCDate()+1);
 await inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,{...schedule,dueDate:future.toISOString().slice(0,10)}));
 assert.equal((await inTenant((c,a)=>service.checkOfferFollowups(c,a))).processed,0,'Future reminders remain scheduled');
 await inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,{action:'cancel'}));
 assert.equal((await inTenant((c,a)=>service.checkOfferFollowups(c,a))).processed,0);
 await inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,schedule));
 // An audit failure must roll the notification and claim back together.
 const countNotifications=async()=>Number((await sql('select count(*) n from in_app_notifications where organization_id=$1 and user_id=$2 and href=$3',[org,s.userId,'/angebote/'+encodeURIComponent(offer.number)])).rows[0].n);
 const beforeAuditFailure=await countNotifications();
 await assert.rejects(()=>inTenant((c,a)=>service.checkOfferFollowups({query:async(text,args)=>{if(text.includes('insert into audit_events'))throw Error('Synthetic audit failure');return c.query(text,args);}},a)),/Synthetic audit failure/);
 assert.equal(await countNotifications(),beforeAuditFailure,'Failed audit cannot leave an orphan notification');
 assert.equal((await inTenant((c,a)=>service.offerFollowupHistory(c,a,offer.number))).items[0].state,'scheduled');
 if(parallel)await Promise.all(Array.from({length:6},()=>inTenant((c,a)=>service.checkOfferFollowups(c,a))));
 else await inTenant((c,a)=>service.checkOfferFollowups(c,a));
 assert.equal((await inTenant((c,a)=>service.checkOfferFollowups(c,a))).processed,0,'Completed reminder is not replayed');
 const history=await inTenant((c,a)=>service.offerFollowupHistory(c,a,offer.number));assert.equal(history.items[0].state,'notified');
 const notified=(await sql("select n.id,n.user_id,n.body,n.href from in_app_notifications n join offer_followups f on f.notification_id=n.id where f.organization_id=$1 and f.user_id=$2 and f.id=$3",[org,s.userId,history.items[0].id])).rows;
 assert.equal(notified.length,1);assert.equal(notified[0].user_id,s.userId);assert.equal(notified[0].body,offer.number);assert.equal(notified[0].href,'/angebote/'+encodeURIComponent(offer.number));
 await assert.rejects(()=>inTenant((c,a)=>service.configureOfferFollowup(c,a,offer.number,schedule)),e=>e.code==='followup_completed');
 // SQL isolation is tested as the non-owner runtime role, not just a WHERE clause.
 await transaction({...s,userId:'different-synthetic-user'},async c=>assert.equal((await c.query('select id from offer_followups')).rows.length,0));
 await transaction({...s,organizationId:'00000000-0000-4000-8000-000000000001'},async c=>assert.equal((await c.query('select id from offer_followups')).rows.length,0));
 for(const mutation of ["status='accepted'","status='declined'","status='expired'","status='revised'","valid_until=current_date-1","offer_version=offer_version+1","archived_at=now()"]){
  const candidate=await createIssued();await inTenant((c,a)=>service.configureOfferFollowup(c,a,candidate.number,schedule));
  await sql('update quotes set '+mutation+' where organization_id=$1 and id=$2',[org,candidate.id]);
  await inTenant((c,a)=>service.checkOfferFollowups(c,a));
  assert.equal((await inTenant((c,a)=>service.offerFollowupHistory(c,a,candidate.number)).catch(error=>{assert.equal(error.code,'not_found');return {items:[{state:'skipped'}]};})).items[0].state,'skipped');
  assert.equal((await sql('select notification_id from offer_followups f join offer_versions v on v.organization_id=f.organization_id and v.id=f.version_id where f.organization_id=$1 and v.quote_id=$2',[org,candidate.id])).rows[0].notification_id,null,'No reminder after '+mutation);
 }
 const suppressed=await createIssued();
 await inTenant(async(c,a)=>{await c.query("insert into notification_preferences(organization_id,user_id,kind,in_app) values($1,$2,'Angebote',false) on conflict(organization_id,user_id,kind) do update set in_app=false",[org,s.userId]);await service.configureOfferFollowup(c,a,suppressed.number,schedule);await service.checkOfferFollowups(c,a);});
 assert.equal((await inTenant((c,a)=>service.offerFollowupHistory(c,a,suppressed.number))).items[0].state,'skipped');
 await inTenant(c=>preferenceBefore?c.query("update notification_preferences set in_app=$3,updated_at=$4 where organization_id=$1 and user_id=$2 and kind='Angebote'",[org,s.userId,preferenceBefore.in_app,preferenceBefore.updated_at]):c.query("delete from notification_preferences where organization_id=$1 and user_id=$2 and kind='Angebote'",[org,s.userId]));
 console.log('Personal offer followups: explicit opt-in, preview inputs, scope/RLS/role/read-only, cancellation, replay, terminal/expired/revised offers, preferences, atomic audit rollback'+(parallel?' and six physical concurrent processors':'')+' passed. No mail transport or production data used.');
}
