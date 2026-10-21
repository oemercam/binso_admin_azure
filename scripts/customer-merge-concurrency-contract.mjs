import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

/** Physical PostgreSQL connections, never an in-memory concurrency simulation. */
export async function verifyCustomerMergeConcurrency({pool,service,session}){
 const sessionId=randomUUID(),actor={...session,sessionId,moduleProfile:'standard',isDemo:false,organizationStatus:'active'};
 await pool.query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at,step_up_at) values($1,$2,$3,$4,now()+interval '1 hour',now())",[sessionId,actor.userId,actor.organizationId,'parallel-merge-'+sessionId]);
 const customer=async()=>{const id=randomUUID();await pool.query("insert into customers(id,organization_id,external_id,customer_no,name) values($1::uuid,$2,$1::text,$1::text,'Synthetic concurrent duplicate')",[id,actor.organizationId]);return id;};
 const pair=async()=>[await customer(),await customer()];
 const [source,target]=await pair(),preview=await service.previewCustomerMerge(actor,source,target),key=randomUUID();
 const replays=await Promise.all(Array.from({length:6},()=>service.commitCustomerMerge(actor,source,target,preview.revision,key)));
 assert.ok(replays.every(result=>JSON.stringify(result)===JSON.stringify(replays[0])));assert.equal((await pool.query('select count(*)::int n from customer_merges where organization_id=$1 and source_id=$2',[actor.organizationId,source])).rows[0].n,1);
 const [cancelSource,cancelTarget]=await pair(),cancelPreview=await service.previewCustomerMerge(actor,cancelSource,cancelTarget),cancelKey=randomUUID();
 const settled=await Promise.all([service.cancelCustomerMerge(actor,cancelSource,cancelTarget,cancelPreview.revision,cancelKey),service.commitCustomerMerge(actor,cancelSource,cancelTarget,cancelPreview.revision,cancelKey)]);
 assert.deepEqual(settled[0],settled[1],'Concurrent cancel and commit settle one durable intent');
 const archived=(await pool.query('select merged_into_customer_id from customers where id=$1',[cancelSource])).rows[0].merged_into_customer_id;
 assert.equal(archived,settled[0].cancelled?null:cancelTarget,'The response matches actual persistence');
 const [competingSource,firstTarget]=await pair(),secondTarget=await customer(),first=await service.previewCustomerMerge(actor,competingSource,firstTarget),second=await service.previewCustomerMerge(actor,competingSource,secondTarget);
 const competing=await Promise.allSettled([service.commitCustomerMerge(actor,competingSource,firstTarget,first.revision,randomUUID()),service.commitCustomerMerge(actor,competingSource,secondTarget,second.revision,randomUUID())]);
 assert.equal(competing.filter(r=>r.status==='fulfilled').length,1,'Different intents cannot merge the same source twice');
 assert.ok(competing.filter(r=>r.status==='rejected').every(r=>r.reason.code==='customer_changed'));
 const [businessSource,businessTarget]=await pair(),businessPreview=await service.previewCustomerMerge(actor,businessSource,businessTarget);
 const invoiceId=randomUUID(),businessWrite=async()=>{const c=await pool.connect();try{await c.query('begin');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[actor.organizationId,actor.userId]);await c.query("insert into invoices(id,organization_id,external_id,invoice_no,customer_id,status,issue_date,due_date) values($1::uuid,$2,$1::text,$1::text,$3,'draft',current_date,current_date)",[invoiceId,actor.organizationId,businessSource]);await c.query('commit');}catch(error){await c.query('rollback');throw error;}finally{c.release();}};
 const businessRace=await Promise.allSettled([service.commitCustomerMerge(actor,businessSource,businessTarget,businessPreview.revision,randomUUID()),businessWrite()]);
 assert.equal(businessRace.filter(r=>r.status==='fulfilled').length,1,'Customer merge and new business reference cannot both commit');
 const pointer=(await pool.query('select merged_into_customer_id from customers where id=$1',[businessSource])).rows[0].merged_into_customer_id,invoice=(await pool.query('select id from invoices where id=$1',[invoiceId])).rows;
 assert.equal(!!pointer,!invoice.length,'No invoice is attached to a merged duplicate');
 console.log('Real PostgreSQL customer merge: concurrent replay, cancel/commit, competing targets and new invoice reference exclusion passed across physical connections.');
}
