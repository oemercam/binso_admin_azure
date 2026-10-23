import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function verifySupplierReceiptContract({load,mock,db,transaction,org,other,act,request}){
 assert.ok(!load('lib/server/env.ts').env.fileScanSocket,'This fixture never contacts a real scanner');
 mock('lib/server/storage.ts',{getBlobByUrl:()=>{throw Error('External blob access is not allowed in this fixture');}});
 const {NextRequest}=await import('next/server.js');
 const suppliers=load('app/api/suppliers/route.ts'),invoices=load('app/api/suppliers/[id]/invoices/route.ts'),files=load('app/api/files/route.ts'),download=load('app/api/files/[id]/download/route.ts'),fileDetail=load('app/api/files/[id]/route.ts');
 act('owner');let response=await suppliers.POST(request({name:'Synthetic receipt supplier'}));assert.equal(response.status,201);const supplier=(await response.json()).item.id;
 response=await invoices.POST(request({}),{params:Promise.resolve({id:supplier})});assert.equal(response.status,201);const invoice=(await response.json()).item.id;
 const content=Buffer.from('%PDF-1.4\nSynthetic isolated receipt\n%%EOF');
 const upload=(id=invoice,bytes=content,mime='application/pdf',key=randomUUID())=>{const form=new FormData();form.append('purpose','supplier_invoice_receipt');form.append('entityId',id);form.append('file',new File([bytes],'synthetic.pdf',{type:mime}));return files.POST(new NextRequest('https://employee.invalid/api/files',{method:'POST',headers:{origin:'https://employee.invalid','idempotency-key':key},body:form}));};
 const read=id=>download.GET(new Request('https://employee.invalid/api/files/'+id+'/download'),{params:Promise.resolve({id})});
 const list=id=>files.GET(new NextRequest('https://employee.invalid/api/files?supplierInvoiceId='+id));
 assert.equal((await upload(invoice,Buffer.from('fake PDF'))).status,400,'Declared MIME does not bypass actual content validation');
 assert.equal((await upload(invoice,content,'image/heic')).status,400,'No unsafe format allowlist expansion');
 const key=randomUUID();response=await upload(invoice,content,'application/pdf',key);assert.equal(response.status,201,await response.clone().text());const item=(await response.json()).item;
 assert.equal(item.supplier_invoice_id,invoice);assert.equal(item.scanStatus,'pending');assert.equal(item.available,false);
 assert.equal((await (await upload(invoice,content,'application/pdf',key)).json()).item.id,item.id,'Upload replay keeps one receipt');
 assert.equal((await read(item.id)).status,423,'Quarantined receipt cannot download');
 const access=load('lib/server/file-access.ts'),originalAccess=access.canAccessFile;
 try{access.canAccessFile=()=>true;assert.equal((await read(item.id)).status,423,'Even a prelaunch allowance cannot release an unscanned AP receipt');}finally{access.canAccessFile=originalAccess;}
 assert.equal((await (await list(invoice)).json()).items.length,1);
 for(const role of ['hr','project_manager','manager','member','reader']){
  act(role);assert.equal((await list(invoice)).status,403);assert.equal((await upload()).status,403);assert.equal((await read(item.id)).status,404,'New AP receipt is hidden by runtime RLS');
  assert.equal((await transaction(org,'employee-dossier-'+role,c=>c.query('select file_id from file_contents where file_id=$1',[item.id]))).rows.length,0,'Stored bytes inherit the file owner RLS');
 }
 act('owner',other,{userId:'employee-dossier-foreign'});assert.equal((await upload()).status,404);assert.equal((await read(item.id)).status,404);
 act('owner');
 // Synthetic verdict transition tests download enforcement only, never malware detection.
 await db.query("update file_objects set scan_status='clean' where id=$1",[item.id]);
 response=await read(item.id);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),content);
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query("update file_objects set purpose='document',supplier_invoice_id=null where id=$1",[item.id])),e=>e.code==='23514','Cannot detach a receipt into a less restricted purpose');
 await assert.rejects(()=>transaction(org,'employee-dossier-owner',c=>c.query("update file_objects set created_by='employee-dossier-finance' where id=$1",[item.id])),e=>e.code==='23514','Receipt author cannot be changed');
 await db.query("update organization_subscriptions set plan='starter' where organization_id=$1",[org]);assert.equal((await read(item.id)).status,403);assert.equal((await list(invoice)).status,403);
 const unfiltered=await files.GET(new NextRequest('https://employee.invalid/api/files'));assert.equal(unfiltered.status,200);assert.ok(!(await unfiltered.json()).items.some(file=>file.id===item.id),'Omitting filters cannot bypass AP entitlement');
 await db.query("update organization_subscriptions set plan='business' where organization_id=$1",[org]);
 response=await fileDetail.DELETE(request({},randomUUID(),'DELETE'),{params:Promise.resolve({id:item.id})});assert.equal(response.status,200,await response.clone().text());assert.equal((await read(item.id)).status,404);assert.equal((await (await list(invoice)).json()).items.length,0,'Controlled removal hides the active reference');
 assert.equal((await db.query('select supplier_invoice_id,archived_at is not null archived from file_objects where id=$1',[item.id])).rows[0].supplier_invoice_id,invoice,'Retention keeps the receipt association');
 console.log('AP receipts: actual central upload/list/download/archive, content/MIME/HEIC denial, pending quarantine, synthetic clean enforcement, tenant/role/content RLS, entitlement and owner immutability/replay passed. Real antivirus/provider qualification remains external.');
}
