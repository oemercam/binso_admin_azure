import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Same isolated migrated database and real runtime role; no stubbed business logic.
export async function verifyExpensePaymentContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const sessionIds=new Map();
 for(const role of ['owner','admin','finance','hr','project_manager','manager','member','reader','foreign']){
  const userId='employee-dossier-'+role,id=randomUUID();sessionIds.set(role,id);
  await db.query("insert into auth_sessions(id,user_id,organization_id,token_hash,expires_at,step_up_at) values($1,$2,$3,$4,now()+interval '1 hour',now())",[id,userId,role==='foreign'?other:org,'synthetic-'+id]);
 }
 const as=(role,organizationId=org,extra={})=>act(role,organizationId,{sessionId:sessionIds.get(extra.userId==='employee-dossier-foreign'?'foreign':role),...extra});
 const root=load('app/api/expenses/route.ts'),detail=load('app/api/expenses/[id]/route.ts');
 const reimbursement=load('app/api/expenses/[id]/reimbursement/route.ts');
 const input={merchant:'Synthetic receipt',expenseDate:'2026-10-22',category:'travel',amount:42.35,currency:'CHF',vatRate:8.1,description:'Synthetic expense',status:'submitted',billable:false};
 const post=(body,key=randomUUID())=>root.POST(request(body,key));
 const patch=(id,body)=>detail.PATCH(request(body,randomUUID(),'PATCH'),{params:Promise.resolve({id})});
 const read=id=>detail.GET(new Request('https://employee.invalid/api/expenses/'+id),{params:Promise.resolve({id})});
 const pay=(id,reference='SYNTHETIC-PAYMENT',extra={})=>reimbursement.POST(request({reference,paidOn:'2026-10-22',amount:'42.35',currency:'CHF',...extra}),{params:Promise.resolve({id})});
 const create=async kind=>{
  as('owner');const result=await post({...input,...(kind===undefined?{}:{paymentKind:kind})});
  assert.equal(result.status,201,await result.clone().text());return (await result.json()).item.id;
 };
 const approve=async(id,kind)=>{
  as('admin');const result=await patch(id,{...input,status:'approved',...(kind===undefined?{}:{paymentKind:kind})});
  assert.equal(result.status,200,await result.clone().text());
 };
 const privateId=await create('private');
 let item=(await (await read(privateId)).json()).item;
 assert.equal(item.payment_kind,'private');assert.equal(item.claim_status,'pending_review');
 assert.equal((await pay(privateId)).status,409,'Private source alone is not an approved claim');
 assert.equal((await patch(privateId,{...input,status:'approved',paymentKind:'private'})).status,403,'Self review remains forbidden');
 await approve(privateId,'private');as('finance');
 item=(await (await read(privateId)).json()).item;assert.equal(item.claim_status,'eligible');
 setAuditFailure(true);assert.equal((await pay(privateId)).status,500);setAuditFailure(false);
 assert.equal((await (await read(privateId)).json()).item.reimbursed_at,null,'Audit failure rolls the payment confirmation back');
 assert.equal((await pay(privateId,'SYNTHETIC-PAYMENT',{amount:'42.34'})).status,409,'Stale amount rejected');
 assert.equal((await pay(privateId,'SYNTHETIC-PAYMENT',{currency:'EUR'})).status,409,'Currency mismatch rejected');
 for(const extra of [{paidOn:'2026-02-30'},{paidOn:'2999-01-01'},{amount:'42.351'},{amount:-1},{amount:'0'},{reference:''}])assert.equal((await pay(privateId,'SYNTHETIC-PAYMENT',extra)).status,400);
 await db.query("update auth_sessions set step_up_at=now()-interval '6 minutes' where id=$1",[sessionIds.get('finance')]);
 assert.equal((await pay(privateId)).status,403,'Expired explicit proof cannot confirm reimbursement');
 await db.query('update auth_sessions set step_up_at=now() where id=$1',[sessionIds.get('finance')]);
 assert.equal((await pay(privateId)).status,200);assert.equal((await pay(privateId)).status,200,'Same reference is a replay');
 assert.equal((await pay(privateId,'DIFFERENT-PAYMENT')).status,409);
 item=(await (await read(privateId)).json()).item;assert.equal(item.claim_status,'reimbursed');
 assert.equal(item.reimbursement_paid_on,'2026-10-22');assert.equal(Number(item.reimbursement_amount),42.35);assert.equal(item.reimbursement_currency,'CHF');
 for(const change of ["reimbursed_at=null","reimbursement_reference='ALTERED'","reimbursement_amount=1","reimbursement_paid_on='2026-10-21'"])await assert.rejects(()=>transaction(org,'employee-dossier-finance',c=>c.query('update expenses set '+change+' where id=$1',[privateId])),e=>e.code==='23514','Recorded evidence cannot be rewritten');
 for(const kind of ['company_card','company_direct','unknown']){
  const id=await create(kind);await approve(id,kind);as('finance');
  assert.equal((await pay(id)).status,409,'No private reimbursement for '+kind);
  assert.equal((await (await read(id)).json()).item.claim_status,kind==='unknown'?'unresolved':'not_applicable');
  await assert.rejects(()=>transaction(org,'employee-dossier-finance',c=>c.query('update expenses set reimbursed_at=now(),reimbursement_reference=$2,reimbursed_by_user_id=$3 where id=$1',[id,'BYPASS','employee-dossier-finance'])),e=>e.code==='23514','SQL independently blocks nonprivate reimbursement');
  await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query("update expenses set payment_kind='private' where id=$1",[id])),e=>e.code==='23514','Cannot reclassify a reviewed source');
 }
 const legacy=await create(undefined);as('owner');
 assert.equal((await (await read(legacy)).json()).item.payment_kind,'unknown','Old clients do not invent a payment source');
 assert.equal((await patch(legacy,{...input,paymentKind:'company_card'})).status,200,'Editable source can be classified explicitly');
 assert.equal((await patch(legacy,input)).status,200);
 assert.equal((await (await read(legacy)).json()).item.payment_kind,'company_card','Legacy PATCH preserves explicit source');
 as('admin');assert.equal((await patch(legacy,{...input,status:'approved',paymentKind:'private'})).status,400,'Approver cannot silently alter the payer during approval');
 as('owner');
 for(const paymentKind of ['bank_transfer','PRIVATE',null,{},100]){
  assert.equal((await post({...input,paymentKind})).status,400);
  assert.equal((await patch(legacy,{...input,paymentKind})).status,400);
 }
 const key=randomUUID(),replayBody={...input,paymentKind:'private'};
 const first=await post(replayBody,key);assert.equal(first.status,201);
 assert.equal((await (await post(replayBody,key)).json()).item.id,(await first.json()).item.id);
 assert.equal((await post({...replayBody,paymentKind:'company_card'},key)).status,409,'Payment source is included in the request fingerprint');
 for(const role of ['hr','project_manager','manager','member','reader']){
  as(role);assert.equal((await pay(privateId)).status,403,'Payment permission remains required for '+role);
 }
 as('owner',org,{organizationStatus:'read_only'});assert.equal((await pay(privateId)).status,403);
 as('owner',other,{userId:'employee-dossier-foreign'});assert.equal((await read(privateId)).status,404);assert.equal((await pay(privateId)).status,404);
 assert.equal((await transaction(other,'employee-dossier-foreign',c=>c.query('select id from expenses where id=$1',[privateId]))).rows.length,0);
 as('owner');
 const count=(await db.query('select count(*)::int n from expenses where organization_id=$1',[org])).rows[0].n;
 setAuditFailure(true);assert.equal((await post({...input,paymentKind:'private'})).status,500);setAuditFailure(false);
 assert.equal((await db.query('select count(*)::int n from expenses where organization_id=$1',[org])).rows[0].n,count);
 console.log('Expense payment source: actual routes, persistence/legacy preservation, review separation, private-only claims, DB bypass protection, replay, roles/tenant RLS and atomic audit rollback passed. No transfer or payroll action.');
}
