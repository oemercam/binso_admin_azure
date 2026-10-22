import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

// Share the migrated isolated DB/session fixture with the HR business harness.
// These cases still execute actual supplier routes, repository, SQL and audit.
export async function verifySupplierContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const root=load('app/api/suppliers/route.ts'),detail=load('app/api/suppliers/[id]/route.ts');
 const input={name:'Synthetic Partner AG',contactName:'Synthetic Contact',email:'',phone:'',address:'Bern',uid:'',paymentDays:30,status:'active'};
 const read=id=>detail.GET(new Request('https://employee.invalid/api/suppliers/'+id),{params:Promise.resolve({id})});
 const post=(body,key=randomUUID())=>root.POST(request(body,key));
 const patch=(id,body,key=randomUUID())=>detail.PATCH(request(body,key,'PATCH'),{params:Promise.resolve({id})});
 act('owner');
 const identitiesBefore=(await db.query('select count(*)::int n from app_users')).rows[0].n;
 const employeesBefore=(await db.query('select count(*)::int n from employees')).rows[0].n;
 const key=randomUUID(),created=await post(input,key);assert.equal(created.status,201,await created.clone().text());
 const item=(await created.json()).item,id=item.id;assert.match(item.supplier_no,/^L-\d+$/);
 assert.equal((await (await post(input,key)).json()).item.id,id,'Supplier create replay does not allocate a second number');
 assert.equal((await post({...input,name:'Changed'},key)).status,409);
 assert.equal((await post(input)).status,409,'Possible duplicate requires review');
 for(const extra of [{iban:'CH-private'},{organization_id:other},{supplier_no:'L-FAKE'},{user_id:'privileged'}])assert.equal((await post({...input,...extra})).status,400);
 for(const extra of [{name:''},{email:'invalid'},{paymentDays:-1},{paymentDays:181},{status:'paid'}])assert.equal((await post({...input,...extra})).status,400);
 const change={...input,phone:'031 000 00 00',expectedRevision:item.revision},changeKey=randomUUID();
 let response=await patch(id,change,changeKey);assert.equal(response.status,200,await response.clone().text());const updated=(await response.json()).item;
 assert.equal((await patch(id,change,changeKey)).status,200,'A lost update response replays the same saved result');
 assert.equal((await patch(id,{...change,phone:'Stale'})).status,409,'Stale supplier revision rejected');
 const persisted=await read(id);assert.equal(persisted.status,200);assert.equal((await persisted.json()).item.phone,'031 000 00 00');
 for(const field of ['iban','settlement_override','created_by_user_id'])assert.equal(Object.hasOwn(updated,field),false,'General supplier DTO omits '+field);
 for(const role of ['owner','admin','finance']){act(role);assert.equal((await read(id)).status,200);}
 for(const role of ['hr','project_manager','manager','member','reader']){act(role);assert.equal((await read(id)).status,403);assert.equal((await post(input)).status,403);assert.equal((await patch(id,change)).status,403);}
 act('owner',org,{organizationStatus:'read_only'});assert.equal((await post(input)).status,403);
 act('owner');await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);assert.equal((await read(id)).status,403);
 await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[org]);
 act('owner',other,{userId:'employee-dossier-foreign'});assert.equal((await read(id)).status,404);assert.equal((await patch(id,change)).status,404);
 assert.equal((await transaction(other,'employee-dossier-foreign',c=>c.query('select id from suppliers where id=$1',[id]))).rows.length,0);
 act('owner');setAuditFailure(true);
 assert.equal((await patch(id,{...input,phone:'Rollback',expectedRevision:updated.revision})).status,500);setAuditFailure(false);
 assert.equal((await (await read(id)).json()).item.phone,'031 000 00 00','Supplier mutation rolls back when audit fails');
 const counter=(await transaction(org,'employee-dossier-owner',c=>c.query("select next_value from business_document_counters where organization_id=$1 and kind='supplier'",[org]))).rows;
 setAuditFailure(true);assert.equal((await post({...input,name:'Rollback Partner'})).status,500);setAuditFailure(false);
 assert.deepEqual((await transaction(org,'employee-dossier-owner',c=>c.query("select next_value from business_document_counters where organization_id=$1 and kind='supplier'",[org]))).rows,counter,'Failed supplier create rolls numbering back');
 assert.equal((await db.query('select count(*)::int n from app_users')).rows[0].n,identitiesBefore);
 assert.equal((await db.query('select count(*)::int n from employees')).rows[0].n,employeesBefore,'Supplier never creates an employee or identity');
 console.log('Supplier: actual routes, safe DTO, central numbering, persistence/replay/stale revision, duplicate review, roles/plan/RLS and atomic audit/counter rollback passed. Bank changes/payments remain unavailable.');
}
