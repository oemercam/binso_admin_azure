import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

/** Actual repository, refund ledger and metrics in disposable migrated databases.
 * Parallel=true requires independent physical transactions, never PGlite Promise concurrency. */
export async function verifyInvoiceOverpayments({business,refunds,financial,metrics,cash,sql,transaction,session,createIssued,parallel=false}){
 const org=session.organizationId,today=financial.businessDate(),minor=value=>Math.round(Number(value)*100);
 const run=(fn,actor=session)=>transaction(actor,c=>fn(c,actor));
 await run(async c=>{const role=(await c.query('select current_user as role,rolsuper,rolbypassrls from pg_roles where rolname=current_user')).rows[0];assert.equal(role.role,'binso_runtime');assert.equal(role.rolsuper,false);assert.equal(role.rolbypassrls,false);});
 for(const amount of [0,-1,NaN,Infinity,0.001,financial.maxRecordedPayment+1])assert.equal(financial.paymentEntryIssue(amount,100),'amount_invalid');
 assert.equal(financial.paymentEntryIssue(101,100),'payment_exceeds_balance');
 assert.equal(financial.paymentEntryIssue(101,100,true,100),null);
 assert.equal(financial.paymentEntryIssue(101,100,true,99),'payment_balance_changed');
 assert.equal(financial.paymentEntryIssue(1,0),'payment_exceeds_balance');
 assert.equal(financial.paymentEntryIssue(1,0,true,0),null);
 const created=await createIssued(),id=created.id,number=created.number;
 const document=async()=>{const row=(await sql('select total_amount total,paid_amount,status,issue_date::text issue_date from invoices where organization_id=$1 and id=$2',[org,id])).rows[0];return {...row,credit_amount:Number((await sql('select coalesce(sum(amount),0) amount from credit_notes where organization_id=$1 and invoice_id=$2',[org,id])).rows[0].amount),refund_amount:Number((await sql('select coalesce(sum(amount),0) amount from invoice_refunds where organization_id=$1 and invoice_id=$2',[org,id])).rows[0].amount)};};
 const before=await document(),total=Number(before.total);assert.ok(total>0);assert.equal(Number(before.paid_amount),0);
 const count=async()=>Number((await sql('select count(*) n from payments where organization_id=$1 and invoice_id=$2',[org,id])).rows[0].n);
 const base={p_invoice_id:id,p_paid_on:today,p_amount:Math.round((total+10)*100)/100,p_method:'bank',p_note:'Actual received synthetic overpayment',p_idempotency_key:randomUUID()};
 const initial=financial.paymentBalance(before),confirmed={...base,p_overpayment_confirmed:true,p_expected_balance:initial};
 for(const value of [null,{}, {...initial,extra:true},{...initial,paidAmount:'0'},{...initial,paidAmount:1},{...initial,creditAmount:1},{...initial,refundAmount:1},{...initial,openAmount:total-1}])await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...confirmed,p_expected_balance:value,p_idempotency_key:randomUUID()})),e=>e.code==='payment_balance_changed');
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',base)),e=>e.code==='payment_exceeds_balance');
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...confirmed,p_overpayment_confirmed:'true'})),e=>e.code==='payment_exceeds_balance');
 for(const date of ['','2026-02-30','2026-13-01','2099-01-01'])await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...confirmed,p_paid_on:date,p_idempotency_key:randomUUID()})),e=>e.code==='payment_date_invalid');
 for(const role of ['hr','project_manager','manager','member','reader'])await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',confirmed),{...session,role}),e=>e.status===403);
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',confirmed),{...session,organizationId:'00000000-0000-4000-8000-000000000001'}),e=>e.code==='invoice_invalid');
 assert.equal(await count(),0,'Rejected confirmations/roles/dates cannot add payments');
 const beforeMetrics=await run(c=>metrics(c,org)),beforeCash=await run(c=>cash(c,org));
 // Force failure after ledger and idempotency writes: the real transaction must undo all of them.
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness({query:async(text,args)=>{if(text.includes('insert into audit_events'))throw Error('Synthetic overpayment audit failure');return c.query(text,args);}},s,'create_payment_idempotent',confirmed)),/Synthetic overpayment audit failure/);
 assert.equal(await count(),0);assert.equal(Number((await document()).paid_amount),0);
 assert.equal(Number((await sql("select count(*) n from business_idempotency_keys where organization_id=$1 and operation='create_payment_idempotent' and idempotency_key=$2",[org,confirmed.p_idempotency_key])).rows[0].n),0,'A rolled-back receipt cannot leave a replay result');
 const attempts=parallel?await Promise.all(Array.from({length:6},()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',confirmed)))):[await run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',confirmed))];
 assert.equal(new Set(attempts.map(x=>x.id)).size,1);assert.equal(await count(),1,'A repeated receipt is stored once');
 const after=await document();assert.equal(Number(after.paid_amount),base.p_amount);assert.equal(after.status,'paid');assert.equal(Number(after.total),total,'An actual overpayment never rewrites the invoice');assert.equal(financial.customerCredit(after),10);
 const afterMetrics=await run(c=>metrics(c,org));assert.deepEqual(afterMetrics.revenueEvents,beforeMetrics.revenueEvents,'Extra cash is not extra invoiced revenue');assert.equal(minor(afterMetrics.snapshot.paid)-minor(beforeMetrics.snapshot.paid),minor(total),'Only the invoice claim is counted as settled');assert.equal(minor(afterMetrics.snapshot.credit_balance)-minor(beforeMetrics.snapshot.credit_balance),1000);
 const payment=attempts[0],audit=(await sql("select detail from audit_events where organization_id=$1 and entity_id=$2 and action='payment.created'",[org,payment.id])).rows;
 assert.equal(audit.length,1);const metadata=JSON.parse(audit[0].detail);assert.equal(metadata.overpaymentConfirmed,true);assert.deepEqual(metadata.reviewedBalance,initial);assert.equal(metadata.overpaymentAmount,10);
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...confirmed,p_amount:base.p_amount+1})),e=>e.code==='idempotency_conflict');
 const refundInput={amount:6,date:today,reason:'Externally completed synthetic repayment'},refundKey=randomUUID();
 await assert.rejects(()=>run((c,s)=>refunds.recordInvoiceRefund(c,s,number,{...refundInput,amount:10.01},randomUUID())),e=>e.code==='refund_exceeds_credit');
 const refund=await run((c,s)=>refunds.recordInvoiceRefund(c,s,number,refundInput,refundKey));assert.equal((await run((c,s)=>refunds.recordInvoiceRefund(c,s,number,refundInput,refundKey))).id,refund.id);
 const refunded=await document();assert.equal(Number(refunded.paid_amount),base.p_amount,'Refund never destroys the original receipt');assert.equal(Number(refunded.refund_amount),6);assert.equal(financial.customerCredit(refunded),4);assert.equal((await run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',confirmed))).id,payment.id,'Exact receipt replay remains safe after refund');
 const paidReview=financial.paymentBalance(refunded),next={...base,p_amount:3,p_overpayment_confirmed:true,p_expected_balance:paidReview};
 const competing=parallel?await Promise.allSettled(Array.from({length:6},()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...next,p_idempotency_key:randomUUID()})))):[{status:'fulfilled',value:await run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...next,p_idempotency_key:randomUUID()}))}];
 assert.equal(competing.filter(x=>x.status==='fulfilled').length,1,'A zero-open balance still binds the reviewed receipts/credits/refunds');
 assert.ok(competing.filter(x=>x.status==='rejected').every(x=>x.reason.code==='payment_balance_changed'));
 await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...next,p_idempotency_key:randomUUID()})),e=>e.code==='payment_balance_changed');
 assert.equal(await count(),2);const final=await document();assert.equal(financial.customerCredit(final),7);
 const finalMetrics=await run(c=>metrics(c,org));assert.deepEqual(finalMetrics.revenueEvents,beforeMetrics.revenueEvents);assert.equal(minor(finalMetrics.snapshot.credit_balance)-minor(beforeMetrics.snapshot.credit_balance),700);
 const finalCash=await run(c=>cash(c,org)),sum=rows=>rows.reduce((n,x)=>n+minor(x.amount),0);
 assert.equal(sum(finalCash.payments)-sum(beforeCash.payments),minor(total)+1300);assert.equal(sum(finalCash.refunds)-sum(beforeCash.refunds),600,'Only the actual dated refund reduces cash');
 // Legacy or inconsistent counters must not be silently treated as a proven receipt ledger.
 await sql('update invoices set paid_amount=paid_amount+1 where organization_id=$1 and id=$2',[org,id]);
 try{const changed=await document();await assert.rejects(()=>run((c,s)=>business.mutateApiBusiness(c,s,'create_payment_idempotent',{...next,p_expected_balance:financial.paymentBalance(changed),p_idempotency_key:randomUUID()})),e=>e.code==='payment_ledger_mismatch');}finally{await sql('update invoices set paid_amount=$3 where organization_id=$1 and id=$2',[org,id,final.paid_amount]);}
 console.log('Actual invoice overpayments: explicit exact-balance consent, no ordinary overbooking, dates/roles/RLS, audit rollback, replay, unchanged revenue, dated refund and credit liability'+(parallel?', six physical receipt retries and competing zero-open balance confirmations':'')+' passed. No bank transfer or production data.');
}
