import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
export async function verifyReportMail({db,organizationId,otherOrganizationId,session,snapshotId,originalBytes,loadRoute}){
 const route=await loadRoute('app/api/reports/exports/[id]/send/route.ts');let sends=0,transport='accepted',last;
 globalThis.__reportMailConfigured=true;
 globalThis.__reportMailSend=async mail=>{sends++;last=mail;if(transport==='uncertain')throw Error('Synthetic ambiguous response');return {delivered:transport==='accepted'};};
 const body={recipient:'Synthetic.Recipient@example.invalid',subject:'Synthetic report',message:'<script>synthetic only</script>\nNo action required.'};
 const send=(key,values=body,id=snapshotId)=>route.POST({headers:new Headers({'Idempotency-Key':key}),body:values},{params:Promise.resolve({id})});
 const first=await send('report-mail-accepted');assert.equal(first.status,200,JSON.stringify(first));assert.deepEqual(Object.keys(first.data).sort(),['deliveryConfirmed','id','providerAccepted','status']);assert.equal(first.data.providerAccepted,true);assert.equal(first.data.deliveryConfirmed,false,'HTTP acceptance is never recipient delivery');assert.equal(first.data.status,'accepted');assert.equal(sends,1);
 assert.equal(last.to,'synthetic.recipient@example.invalid');assert.equal(last.attachments.length,1);assert.equal(last.attachments[0].contentType,'application/pdf');assert.deepEqual(last.attachments[0].content,originalBytes,'Transport receives exactly the immutable preview bytes');assert.ok(last.html.includes('&lt;script&gt;synthetic only&lt;/script&gt;'));assert.ok(!last.html.includes('<script>'));
 assert.deepEqual((await send('report-mail-accepted',body,snapshotId.toUpperCase())).data,first.data,'Case changes cannot circumvent replay identity');assert.equal(sends,1);
 assert.equal((await send('report-mail-accepted',{...body,subject:'Different subject'})).status,409);assert.equal(sends,1);
 for(const values of [{...body,recipient:'a@example.invalid,b@example.invalid'},{...body,subject:'Header\r\nInjected: true'},{...body,message:''},{...body,organizationId:otherOrganizationId}])assert.equal((await send('report-mail-invalid',values)).status,400);
 for(const patch of [{role:'reader'},{role:'member'},{organizationStatus:'read_only'},{isDemo:true}]){globalThis.__processSession={...session,...patch};assert.equal((await send('report-mail-denied')).status,403);}
 globalThis.__processSession={...session,organizationId:otherOrganizationId};assert.equal((await send('report-mail-other-tenant')).status,404);
 globalThis.__processSession={...session,userId:'different-report-owner'};assert.equal((await send('report-mail-other-user')).status,404);globalThis.__processSession=session;assert.equal(sends,1);
 globalThis.__reportMailConfigured=false;
 const unavailable=await send('report-mail-unconfigured',{...body,recipient:'unavailable@example.invalid'});assert.equal(unavailable.status,200);assert.equal(unavailable.data.status,'failed');assert.equal(unavailable.data.providerAccepted,false);assert.equal(sends,1,'Missing configuration never attempts a transport');
 globalThis.__reportMailConfigured=true;assert.deepEqual((await send('report-mail-unconfigured',{...body,recipient:'unavailable@example.invalid'})).data,unavailable.data,'Retrying an old key only checks its outcome');assert.equal(sends,1);
 transport='uncertain';const ambiguousBody={...body,recipient:'uncertain@example.invalid'},ambiguous=await send('report-mail-ambiguous',ambiguousBody);assert.equal(ambiguous.data.status,'uncertain');assert.equal(ambiguous.data.providerAccepted,false);assert.equal(sends,2);
 assert.deepEqual((await send('report-mail-ambiguous',ambiguousBody)).data,ambiguous.data);assert.equal(sends,2);assert.equal((await send('report-mail-new-key',ambiguousBody)).status,409,'Even a new key cannot silently resend an unresolved report to the same recipient');assert.equal(sends,2);
 transport='failed';const failed=await send('report-mail-explicit-failure',{...body,recipient:'failed@example.invalid'});assert.equal(failed.data.status,'failed');assert.equal(failed.data.deliveryConfirmed,false);assert.equal(sends,3);
 const history=await route.GET({}, {params:Promise.resolve({id:snapshotId})});assert.equal(history.status,200);assert.equal(history.data.items.length,4);for(const row of history.data.items)assert.deepEqual(Object.keys(row).sort(),['created_at','id','recipient','status','subject','updated_at']);
 const source=(await db.query('select * from report_exports where id=$1',[snapshotId])).rows[0],large=Buffer.alloc(2_000_001);originalBytes.subarray(0,5).copy(large);
 const over=(await db.query('insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',[organizationId,session.userId,source.kind,source.locale,source.query_text,source.scope_hash,source.data_as_of,large,createHash('sha256').update(large).digest('hex')])).rows[0].id;
 assert.equal((await send('report-mail-budget',body,over)).status,413);assert.equal(sends,3);
 assert.equal(Number((await db.query("select count(*) n from mail_outbox where organization_id=$1 and kind='report' and entity_id=$2 and status='accepted'",[organizationId,snapshotId])).rows[0].n),1);
 await db.query("delete from mail_outbox where organization_id=$1 and kind='report'",[organizationId]);delete globalThis.__reportMailSend;delete globalThis.__reportMailConfigured;
 console.log('Report mail: exact real PDF attachment, escaped HTML, accepted≠delivered, unavailable/failed/ambiguous/replay, role/tenant/read-only and size boundaries passed with isolated transport only.');
}
