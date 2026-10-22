import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function verifySupplierInvoiceContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const root=load('app/api/suppliers/route.ts'),route=load('app/api/suppliers/[id]/invoices/route.ts');
 act('owner');let response=await root.POST(request({name:'Synthetic AP supplier'}));assert.equal(response.status,201);const supplierId=(await response.json()).item.id;
 const write=(body,key=randomUUID(),id=supplierId)=>route.POST(request(body,key),{params:Promise.resolve({id})});
 const list=(id=supplierId)=>route.GET(new Request('https://employee.invalid/api/suppliers/'+id+'/invoices'),{params:Promise.resolve({id})});
 const key=randomUUID();response=await write({},key);assert.equal(response.status,201,await response.clone().text());const empty=(await response.json()).item;
 assert.equal(empty.status,'draft');for(const field of ['supplier_invoice_no','invoice_date','due_date','net_amount','vat_amount','total_amount','currency'])assert.equal(empty[field],null,'Incomplete draft preserves unknown '+field);
 assert.equal((await (await write({},key)).json()).item.id,empty.id,'Draft retry does not create a second invoice');
 const payload={id:empty.id,expectedRevision:empty.version,number:'AP-001',invoiceDate:'2026-10-22',dueDate:'2026-11-21',netAmount:'10.01',vatAmount:'0.81',totalAmount:'10.82',currency:'CHF',note:''},updateKey=randomUUID();
 response=await write(payload,updateKey);assert.equal(response.status,201,await response.clone().text());const updated=(await response.json()).item;assert.equal(updated.version,2);assert.equal(updated.status,'draft');
 assert.equal((await write(payload,updateKey)).status,201);assert.equal((await write(payload)).status,409,'Stale draft cannot overwrite a newer revision');
 assert.equal((await write({number:' ap-001 ',currency:'EUR'})).status,409,'Same supplier/reference is conservatively blocked across currencies');
 for(const extra of [{totalAmount:'10.83'},{totalAmount:'10.821'},{vatAmount:'-1'},{invoiceDate:'2026-02-30'},{dueDate:'2026-01-01'},{status:'paid'},{supplier_id:randomUUID()},{receipt_file_id:randomUUID()}])assert.equal((await write({...payload,...extra})).status,400);
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query("update supplier_invoices set status='paid' where id=$1",[empty.id])),e=>e.code==='23514','No draft release/payment through direct SQL');
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query("insert into supplier_invoices(organization_id,supplier_id,external_id,supplier_invoice_no,status,created_by_user_id) values($1,$2,$3,'AP-001','draft',$4)",[org,supplierId,randomUUID(),'employee-dossier-owner'])),e=>e.code==='23505','Database independently blocks duplicate drafts');
 for(const role of ['owner','admin','finance']){act(role);assert.equal((await list()).status,200);}
 for(const role of ['hr','project_manager','manager','member','reader']){
  act(role);assert.equal((await list()).status,403);assert.equal((await write({})).status,403);
  assert.equal((await transaction(org,'employee-dossier-'+role,c=>c.query('select id from supplier_invoices where id=$1',[empty.id]))).rows.length,0,'New AP drafts are hidden by RLS');
 }
 act('owner',org,{organizationStatus:'read_only'});assert.equal((await write({})).status,403);
 act('owner',other,{userId:'employee-dossier-foreign'});assert.equal((await list()).status,404);assert.equal((await write({})).status,404);
 assert.equal((await transaction(other,'employee-dossier-foreign',c=>c.query('select id from supplier_invoices where id=$1',[empty.id]))).rows.length,0);
 act('owner');setAuditFailure(true);assert.equal((await write({...payload,expectedRevision:updated.version,note:'Rollback'})).status,500);setAuditFailure(false);
 assert.equal((await db.query('select version from supplier_invoices where id=$1',[empty.id])).rows[0].version,updated.version,'Failed audit rolls draft and revision back');
 const legacy=(await db.query("insert into supplier_invoices(organization_id,supplier_id,external_id,supplier_invoice_no,invoice_date,due_date,net_amount,vat_amount,total_amount,status) values($1,$2,$3,'HISTORIC-AP','2025-01-01','2025-01-31',100,8.1,108.1,'paid') returning id,version",[org,supplierId,randomUUID()])).rows[0];
 assert.equal((await write({id:legacy.id,expectedRevision:legacy.version,note:'changed'})).status,409,'Historical invoice cannot be edited by draft API');
 assert.equal((await db.query('select currency from supplier_invoices where id=$1',[legacy.id])).rows[0].currency,null,'No historical currency inferred');
 await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);assert.equal((await write({})).status,403);await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[org]);
 console.log('AP drafts: actual incomplete persistence, exact decimal consistency, supplier/reference duplicates, immutable legacy, optimistic revision/replay, roles/tenant RLS, audit rollback and no approval/payment transition passed. File attachment and multi-order allocation remain separate.');
}
