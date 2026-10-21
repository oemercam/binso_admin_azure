import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

/** Runs the actual repository against the fully migrated isolated database. */
export async function verifyCustomerMerge({db,service,session,customerWorkspace,handler}){
 const original=globalThis.__processSession,originalTransaction=globalThis.__processTransaction,organizationId=randomUUID(),userId=randomUUID(),sessionId=randomUUID();
 await db.query("insert into organizations(id,name,slug,status,is_demo) values($1,'Synthetic merge',$2,'active',false)",[organizationId,'merge-'+organizationId]);
 await db.query("insert into app_users(id,email,display_name,status) values($1,$2,'Synthetic merge owner','active')",[userId,userId+'@example.invalid']);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,$3,'owner','active')",[organizationId,userId,userId+'@example.invalid']);
 await db.query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at,step_up_at) values($1,$2,$3,$4,now()+interval '1 hour',now())",[sessionId,userId,organizationId,'merge-'+sessionId]);
 await db.query("insert into organization_subscriptions(organization_id,plan,status) values($1,'professional','active')",[organizationId]);
 const actor={...session,organizationId,userId,sessionId,role:'owner',moduleProfile:'standard',isDemo:false,organizationStatus:'active'};
 const customer=async(name='Synthetic duplicate',phone=null)=>{const id=randomUUID();await db.query("insert into customers(id,organization_id,external_id,customer_no,name,phone) values($1::uuid,$2,$1::text,$1::text,$3,$4)",[id,organizationId,name,phone]);return id;};
 const pair=async()=>[await customer(),await customer('Synthetic duplicate','kept phone')];
 try{
  globalThis.__processSession=actor;
  globalThis.__processTransaction=(org,work)=>originalTransaction(org,async client=>{await client.query('set local role binso_runtime');return work(client);});
  const [source,target]=await pair();
  await db.query("update customers set email='source@example.invalid',phone='source phone' where id=$1",[source]);
  const contact=randomUUID(),targetContact=randomUUID(),activity=randomUUID();
  await db.query("insert into customer_contacts(id,organization_id,external_id,customer_id,name,first_name,last_name,is_primary) values($1::uuid,$2,$1::text,$3,'Synthetic Contact','Synthetic','Contact',true)",[contact,organizationId,source]);
  await db.query("insert into customer_contacts(id,organization_id,external_id,customer_id,name,first_name,last_name,is_primary) values($1::uuid,$2,$1::text,$3,'Retained Contact','Retained','Contact',true)",[targetContact,organizationId,target]);
  await db.query("insert into customer_activities(id,organization_id,external_id,customer_id,activity_type,title,detail) values($1::uuid,$2,$1::text,$3,'note','Synthetic activity','No production data')",[activity,organizationId,source]);
  const preview=await service.previewCustomerMerge(actor,source,target);assert.equal(preview.eligible,true);assert.equal(preview.contactsToMove,1);assert.equal(preview.activitiesToMove,1);
  const request=body=>({headers:new Headers(),body});
  assert.equal((await handler.POST(request({action:'preview',sourceId:source,targetId:target}))).status,200);
  for(const body of [{action:'preview',sourceId:source,targetId:source},{action:'preview',sourceId:source,targetId:target,confirmed:true},{action:'commit',sourceId:source,targetId:target,revision:preview.revision},{action:'status',key:'invalid'},{action:'cancel',sourceId:source,targetId:target,revision:preview.revision,confirmed:true}])assert.equal((await handler.POST(request(body))).status,400,'Malformed or unconfirmed API intent is rejected');
  globalThis.__processSession={...actor,role:'reader'};assert.equal((await handler.POST(request(null))).status,403,'Authorization runs before reading invalid bodies');globalThis.__processSession=actor;
  await assert.rejects(()=>service.previewCustomerMerge({...actor,organizationId:randomUUID()},source,target),e=>e.status===404,'Runtime RLS excludes foreign customers');
  await assert.rejects(()=>service.commitCustomerMerge({...actor,organizationStatus:'read_only'},source,target,preview.revision,randomUUID()),e=>e.status===403);
  for(const role of ['reader','finance','hr','project_manager','member'])await assert.rejects(()=>service.previewCustomerMerge({...actor,role},source,target),e=>e.status===403,role+' cannot consolidate');
  await db.query('update auth_sessions set step_up_at=null where id=$1',[sessionId]);
  await assert.rejects(()=>service.commitCustomerMerge(actor,source,target,preview.revision,randomUUID()),e=>e.code==='fresh_authentication_required');
  await db.query('update auth_sessions set step_up_at=now() where id=$1',[sessionId]);
  const key=randomUUID(),receipt=await service.commitCustomerMerge(actor,source,target,preview.revision,key);
  assert.deepEqual(receipt.item,{merged:true,id:target,sourceId:source,contactsMoved:1,activitiesMoved:1});
  assert.deepEqual(await service.commitCustomerMerge(actor,source,target,preview.revision,key),receipt,'Same intent replays, without another transfer');
  const rows=(await db.query('select id,email,phone,archived_at,merged_into_customer_id from customers where organization_id=$1',[organizationId])).rows;
  assert.equal(rows.find(r=>r.id===target).email,'source@example.invalid');assert.equal(rows.find(r=>r.id===target).phone,'kept phone');
  assert.equal(rows.find(r=>r.id===source).merged_into_customer_id,target);assert.ok(rows.find(r=>r.id===source).archived_at);
  assert.equal((await db.query('select customer_id from customer_contacts where id=$1',[contact])).rows[0].customer_id,target);
  assert.equal((await db.query('select is_primary from customer_contacts where id=$1',[contact])).rows[0].is_primary,false);
  assert.equal((await db.query('select is_primary from customer_contacts where id=$1',[targetContact])).rows[0].is_primary,true,'Existing target primary is preserved');
  assert.equal((await db.query('select customer_id from customer_activities where id=$1',[activity])).rows[0].customer_id,target);
  assert.deepEqual(await globalThis.__processTransaction(organizationId,c=>customerWorkspace(c,actor,source)),{redirectTo:target},'Old source URLs resolve only through the current authorized target projection');
  await db.query('update customers set archived_at=now() where id=$1',[target]);
  await assert.rejects(()=>globalThis.__processTransaction(organizationId,c=>customerWorkspace(c,actor,source)),e=>e.status===404,'An archived or inaccessible target is not silently exposed');
  await db.query('update customers set archived_at=null where id=$1',[target]);
  assert.equal((await service.customerMergeStatus(actor,key)).state,'completed');
  assert.deepEqual(await service.cancelCustomerMerge(actor,source,target,preview.revision,key),receipt,'Completed consolidation is never rolled back by cancellation');
  const [cancelSource,cancelTarget]=await pair(),cancelPreview=await service.previewCustomerMerge(actor,cancelSource,cancelTarget),cancelKey=randomUUID();
  const cancelled=await service.cancelCustomerMerge(actor,cancelSource,cancelTarget,cancelPreview.revision,cancelKey);
  assert.equal(cancelled.cancelled,true);assert.deepEqual(await service.commitCustomerMerge(actor,cancelSource,cancelTarget,cancelPreview.revision,cancelKey),cancelled,'A late request cannot execute a cancelled intent');
  assert.equal((await service.customerMergeStatus(actor,cancelKey)).state,'cancelled');
  assert.equal((await db.query('select archived_at from customers where id=$1',[cancelSource])).rows[0].archived_at,null);
  const [staleSource,staleTarget]=await pair(),stale=await service.previewCustomerMerge(actor,staleSource,staleTarget);
  await db.query("update customers set phone='changed after review' where id=$1",[staleSource]);
  await assert.rejects(()=>service.commitCustomerMerge(actor,staleSource,staleTarget,stale.revision,randomUUID()),e=>e.code==='customer_changed');
  const unrelated=await customer('Different legal identity');assert.equal((await service.previewCustomerMerge(actor,unrelated,staleTarget)).eligible,false);
  await db.query("update customers set uid='CHE-111.111.111' where id=$1",[staleSource]);await db.query("update customers set uid='CHE-222.222.222' where id=$1",[staleTarget]);
  assert.equal((await service.previewCustomerMerge(actor,staleSource,staleTarget)).eligible,false,'Conflicting UID blocks a matching name');
  const [usedSource,usedTarget]=await pair();
  await db.query("insert into invoices(organization_id,external_id,invoice_no,customer_id,status,issue_date,due_date) values($1,$2,$2,$3,'draft',current_date,current_date)",[organizationId,randomUUID(),usedSource]);
  const used=await service.previewCustomerMerge(actor,usedSource,usedTarget);assert.equal(used.eligible,false);assert.ok(used.blockers.includes('Rechnungen'));
  await assert.rejects(()=>service.commitCustomerMerge(actor,usedSource,usedTarget,used.revision,randomUUID()),e=>e.code==='customer_merge_blocked');
  const [legacySource,legacyTarget]=await pair();
  await db.query("insert into entity_notes(organization_id,entity_type,entity_external_id,note_text) values($1,'customer',$2,'Synthetic legacy note')",[organizationId,legacySource]);
  assert.equal((await service.previewCustomerMerge(actor,legacySource,legacyTarget)).eligible,false,'Legacy associations without an FK still block');
  await assert.rejects(()=>db.query("insert into entity_notes(organization_id,entity_type,entity_external_id,note_text) values($1,'customer',$2,'Synthetic late note')",[organizationId,source]),'Late polymorphic references cannot point to a merged source');
  const [rollbackSource,rollbackTarget]=await pair(),rollbackPreview=await service.previewCustomerMerge(actor,rollbackSource,rollbackTarget),rollbackKey=randomUUID();
  await db.exec("create function qa_merge_audit_failure() returns trigger language plpgsql as $$ begin if new.action='customer.merged' then raise exception 'Synthetic audit unavailable'; end if; return new; end $$; create trigger qa_merge_audit_failure before insert on audit_events for each row execute function qa_merge_audit_failure();");
  try{await assert.rejects(()=>service.commitCustomerMerge(actor,rollbackSource,rollbackTarget,rollbackPreview.revision,rollbackKey),/Synthetic audit unavailable/);}finally{await db.exec('drop trigger qa_merge_audit_failure on audit_events; drop function qa_merge_audit_failure();');}
  assert.equal((await db.query('select merged_into_customer_id from customers where id=$1',[rollbackSource])).rows[0].merged_into_customer_id,null,'Audit failure rolls back the customer mutation');
  assert.equal((await service.customerMergeStatus(actor,rollbackKey)).state,'not_recorded','Failed audit cannot leave a success receipt');
  await assert.rejects(()=>db.query('update customers set archived_at=null where id=$1',[source]));
  await assert.rejects(()=>db.query("insert into invoices(organization_id,external_id,invoice_no,customer_id,status,issue_date,due_date) values($1,$2,$2,$3,'draft',current_date,current_date)",[organizationId,randomUUID(),source]),'New business records cannot reference the retired duplicate');
 }finally{globalThis.__processSession=original;globalThis.__processTransaction=originalTransaction;}
 console.log('Customer consolidation: actual migrated persistence, missing proof, roles, fill-only preservation, contacts/activity, replay/cancellation, stale preview, UID conflict and business-reference guards passed.');
}
