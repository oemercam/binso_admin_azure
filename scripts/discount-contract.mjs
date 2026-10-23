import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
export function verifyDiscountNumbers(calculate){
 const percent=value=>({kind:'percent',value:String(value)}),fixed=value=>({kind:'fixed',value:String(value),currency:'CHF'}),line=(quantity=2,unit_price=500,vat_rate=8.1,extra={})=>({quantity,unit_price,vat_rate,...extra});
 const cases=[
 [[line()],undefined,['1000.00','81.00','1081.00']],
 [[line(2,500,8.1,{discount:percent(10)})],undefined,['900.00','72.90','972.90']],
 [[line(2,500,8.1,{discount:fixed(50)})],undefined,['950.00','76.95','1026.95']],
 [[line()],percent(5),['950.00','76.95','1026.95']],
 [[line()],fixed(100),['900.00','72.90','972.90']],
 [[line(2,500,8.1,{discount:percent(10)})],percent(5),['855.00','69.26','924.26']],
 [[line(1,600),line(1,400,2.6)],fixed(100),['900.00','53.10','953.10']],
 [[line(1,600),line(1,300,2.6),line(1,100,0,{tax_exempt:true})],fixed(100),['900.00','50.76','950.76']],
 [[line(2,500,0,{tax_exempt:true})],percent(5),['950.00','0.00','950.00']],
 [[line('0.03','33.50'),line('0.03','33.50')],undefined,['2.01','0.16','2.17']],
 [[line(1,'0.01',8.1,{discount:percent(50)})],undefined,['0.01','0.00','0.01']],
 [[line(1,'0.05'),line(1,'0.15',2.6)],undefined,['0.20','0.01','0.21']],
 [[line(2,500,8.1,{discount:percent(0)})],percent(0),['1000.00','81.00','1081.00']],
 [[line(2,500,8.1,{discount:percent(100)})],percent(5),['0.00','0.00','0.00']],
 [[line(2,500,8.1,{discount:percent(10)})],percent(100),['0.00','0.00','0.00']],
 [[line(2,500,8.1,{discount:percent(10)})],fixed(900),['0.00','0.00','0.00']],
 [[line(1,1),line(1,1),line(1,1)],fixed('0.01'),['2.99','0.24','3.23']],
 [[line()],percent(7),['930.00','75.33','1005.33']]
 ];
 for(const [lines,discount,expected] of cases){const result=calculate(lines,'CHF',discount);assert.deepEqual([result.subtotal,result.vat,result.total],expected);const cents=v=>BigInt(v.replace('.',''));assert.equal(result.lines.reduce((s,l)=>s+cents(l.net),0n),cents(result.subtotal));assert.equal(result.taxGroups.reduce((s,g)=>s+cents(g.tax),0n),cents(result.vat));assert.ok(result.lines.every(l=>cents(l.net)>=0n));assert.deepEqual(calculate(lines,'CHF',discount),result);}
 assert.deepEqual(calculate([line(1,1),line(1,1),line(1,1)],'CHF',fixed('0.01')).lines.map(l=>l.documentDiscountDisplay),['0.01','0.00','0.00']);
 for(const discount of [percent(-1),percent('100.01'),fixed(-1),fixed('1000.01'),{kind:'percent',value:5,amount:10},{kind:'none',value:1},{kind:'fixed',value:1,currency:'EUR'},null])assert.throws(()=>calculate([line()],'CHF',discount),RangeError);
 assert.throws(()=>calculate([line(1,'0.01',8.1,{discount:percent(50)})],'CHF',fixed('0.01')),RangeError);
 for(const changed of [{quantity:-1},{unit_price:-1},{vat_rate:101},{quantity:'1.001'},{tax_exempt:true},{tax_exempt:'true'}])assert.throws(()=>calculate([line(2,500,8.1,changed)],'CHF'),RangeError);
 assert.throws(()=>calculate([line(999999,2000)],'CHF',percent(100)),RangeError);
 assert.equal(calculate([line()],'EUR',{kind:'fixed',value:50,currency:'EUR'}).total,'1026.95');assert.throws(()=>calculate([line()],'EUR',fixed(50)),RangeError);
 console.log('Discount numbers: all 18 contract examples, exact allocations, boundaries, invalid/negative/dual discounts, exemption and currency validation passed.');
}
export async function verifyDiscountPersistence({business,financial,sql,transaction,session,parallel=false,issue}){
 verifyDiscountNumbers(financial.calculateDocument);
 const org=session.organizationId,customer=(await sql('select id,discount from customers where organization_id=$1 and archived_at is null order by id limit 1',[org])).rows[0];
 const args={p_kind:'invoice',p_customer_id:customer.id,p_number:'',p_issue_date:'2026-10-22',p_due_date:'2026-11-22',p_valid_until:'2099-12-31',p_vat_rate:8.1,p_currency:'CHF',p_items:[{description:'Synthetic discounted service',quantity:2,unit_price:500,vat_rate:8.1,discount:{kind:'percent',value:10}}],p_discount:{kind:'percent',value:5},p_total:1};
 const pids=new Set();
 const write=(a,s=session)=>transaction(s,async c=>{if(parallel)pids.add((await c.query('select pg_backend_pid() pid')).rows[0].pid);return business.mutateApiBusiness(c,s,'create_document_atomic',{...a,p_idempotency_key:a.p_idempotency_key??randomUUID()});});
 const history=async()=>({invoices:(await sql("select to_jsonb(i)-'calculation' data from invoices i where organization_id=$1 and status<>'draft' order by id",[org])).rows,versions:(await sql('select id,pdf_sha256,document from offer_versions where organization_id=$1 order by id',[org])).rows,pdfs:(await sql('select invoice_id,pdf_sha256 from invoice_versions where organization_id=$1 order by invoice_id',[org])).rows});
 const historical=await history();
 for(const kind of ['invoice','offer']){
  const created=await write({...args,p_kind:kind});assert.equal(Number(created.total),924.26);assert.equal(Number(created.items[0].line_total),855);assert.equal(created.calculation.lines[0].discount.value,'10.00');assert.equal(created.calculation.taxGroups[0].tax,'69.26');
  const reread=await transaction(session,c=>business.listApiBusiness(c,session,'documents','id=eq.'+created.id+'&kind=eq.'+kind));assert.deepEqual(reread[0].calculation,created.calculation);
  const update={...args,p_kind:kind,p_number:created.number,p_current_number:created.number,p_idempotency_key:randomUUID(),p_discount:{kind:'fixed',value:100,currency:'CHF'}};
  const save=()=>transaction(session,c=>business.mutateApiBusiness(c,session,'update_document_atomic',update));
  const saved=parallel?await Promise.all(Array.from({length:6},save)):[await save(),await save()];assert.ok(saved.every(d=>d.id===created.id&&Number(d.total)===864.80));
  assert.equal(Number((await sql("select count(*) n from audit_events where entity_id=$1 and action='document.updated'",[created.id])).rows[0].n),1,'Same update key has one mutation/audit');
  await assert.rejects(()=>transaction(session,c=>business.mutateApiBusiness(c,session,'update_document_atomic',{...update,p_note:'Changed request'})),e=>e.code==='idempotency_conflict');
  await assert.rejects(()=>transaction(session,c=>business.mutateApiBusiness(c,session,'update_document_atomic',{...update,p_idempotency_key:randomUUID(),p_expected_updated_at:'superseded-revision'})),e=>e.code==='document_changed');
  const before=JSON.stringify((await sql('select calculation from '+(kind==='invoice'?'invoices':'quotes')+' where id=$1',[created.id])).rows);
  await assert.rejects(()=>transaction(session,async c=>{await business.mutateApiBusiness(c,session,'update_document_atomic',{...update,p_idempotency_key:randomUUID(),p_discount:{kind:'none'}});throw Error('Synthetic transaction rollback');}),/Synthetic transaction rollback/);
  assert.equal(JSON.stringify((await sql('select calculation from '+(kind==='invoice'?'invoices':'quotes')+' where id=$1',[created.id])).rows),before);
  await assert.rejects(()=>transaction(session,c=>business.mutateApiBusiness(c,session,'update_document_atomic',{...update,p_idempotency_key:randomUUID(),p_discount:undefined,p_items:args.p_items.map(({discount,...l})=>l)})),e=>e.code==='discount_confirmation_required');
  if(issue){await transaction(session,c=>issue(c,session,created.number));const archive=(await sql('select pdf,pdf_sha256'+(kind==='offer'?',document':'')+' from '+(kind==='invoice'?'invoice_versions where invoice_id=$1':'offer_versions where quote_id=$1 and version=1'),[created.id])).rows[0];assert.ok(archive);assert.equal(Buffer.from(archive.pdf).subarray(0,5).toString(),'%PDF-');if(kind==='offer')assert.equal(archive.document.calculation.total,'864.80');await assert.rejects(()=>transaction(session,c=>business.mutateApiBusiness(c,session,'update_document_atomic',{...update,p_idempotency_key:randomUUID()})),e=>e.code==='document_locked');assert.equal((await sql('select pdf_sha256 from '+(kind==='invoice'?'invoice_versions where invoice_id=$1':'offer_versions where quote_id=$1 and version=1'),[created.id])).rows[0].pdf_sha256,archive.pdf_sha256);}

 }
 pids.clear();
 const replayKey=randomUUID(),replay=()=>write({...args,p_idempotency_key:replayKey});const replays=parallel?await Promise.all(Array.from({length:6},replay)):[await replay(),await replay()];assert.equal(new Set(replays.map(d=>d.id)).size,1);if(parallel)assert.ok(pids.size>=6,'Six distinct native backend PIDs exercised discount creation replay');
 for(const discount of [{kind:'percent',value:101},{kind:'fixed',value:901,currency:'CHF'},{kind:'fixed',value:1,currency:'EUR'}])await assert.rejects(()=>write({...args,p_discount:discount}),e=>e.code==='discount_invalid');
 const zeroDoc=await write({...args,p_discount:{kind:'percent',value:100}});assert.equal(Number(zeroDoc.total),0);assert.equal(zeroDoc.status,'draft');if(issue)await assert.rejects(()=>transaction(session,c=>issue(c,session,zeroDoc.number)),e=>e.code==='document_empty');
 const counts=async()=>Number((await sql('select count(*) n from invoices where organization_id=$1',[org])).rows[0].n),count=await counts();
 await assert.rejects(()=>transaction(session,c=>business.mutateApiBusiness({query:(q,p)=>q.includes('insert into audit_events')?Promise.reject(Error('Synthetic discount audit rollback')):c.query(q,p)},session,'create_document_atomic',{...args,p_idempotency_key:randomUUID()})),/Synthetic discount audit rollback/);assert.equal(await counts(),count);
 for(const role of ['owner','admin','finance','hr','project_manager','manager','member','reader']){if(['owner','admin','finance'].includes(role))continue;await assert.rejects(()=>write(args,{...session,role}),e=>e.code==='forbidden');}
 await assert.rejects(()=>write(args,{...session,organizationId:'00000000-0000-4000-8000-000000000001'}));
 try{await sql('update customers set discount=5 where id=$1',[customer.id]);const accepted=await write({...args,p_discount:{kind:'percent',value:5},p_discount_origin:'customer'});assert.equal(accepted.calculation.customerProposal.applied,true);await assert.rejects(()=>write({...args,p_discount:{kind:'percent',value:7},p_discount_origin:'customer'}),e=>e.code==='discount_origin_invalid');const explicit=await write({...args,p_discount:{kind:'percent',value:7},p_items:[{description:'Synthetic proposal',quantity:2,unit_price:500,vat_rate:8.1}]});assert.equal(Number(explicit.total),1005.33);assert.equal(explicit.calculation.customerProposal.applied,false);await sql('update customers set discount=10 where id=$1',[customer.id]);assert.equal((await transaction(session,c=>business.listApiBusiness(c,session,'documents','id=eq.'+explicit.id)))[0].calculation.discount.value,'7.00');}finally{await sql('update customers set discount=$2 where id=$1',[customer.id,customer.discount]);}
 const oldInvoice=(await sql("select id from invoices where organization_id=$1 and status<>'draft' and calculation is null limit 1",[org])).rows[0];if(oldInvoice)await assert.rejects(()=>sql("update invoices set calculation='{}'::jsonb where id=$1",[oldInvoice.id]),/immutable/);
 await assert.rejects(()=>sql("update invoices set calculation='{}'::jsonb where id=$1",[replays[0].id]),/invoice_calculation_revision/);
 const afterHistory=await history();assert.deepEqual({invoices:afterHistory.invoices.filter(r=>historical.invoices.some(old=>old.data.id===r.data.id)),versions:afterHistory.versions.filter(r=>historical.versions.some(old=>old.id===r.id)),pdfs:afterHistory.pdfs.filter(r=>historical.pdfs.some(old=>old.invoice_id===r.invoice_id))},historical,'Historical amounts, snapshots and archived PDF hashes stay unchanged');
 console.log('Discount persistence: invoice/offer read parity, client total ignored, same-key create/update replay'+(parallel?' across six physical transactions':'')+', conflict, audit/transaction rollback, role/tenant denial, customer proposal isolation and historical snapshots/PDF hashes passed.');
}
