import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

/** Actual migrated PostgreSQL, real PDF generator and actual request handlers.
 * Session/transport adapters are supplied by the isolated migration harness. */
export async function verifyReportExports({db,organizationId,otherOrganizationId,session,loadRoute,snapshotModule}){
 const create=await loadRoute('app/api/reports/exports/route.ts'),get=await loadRoute('app/api/reports/exports/[id]/route.ts');
 const query='kind=summary&months=custom&from=2026-10-01&to=2026-10-21';
 const request=(key,body={query,locale:'de'})=>({headers:new Headers({'Idempotency-Key':key}),body});
 const read=id=>get.GET({}, {params:Promise.resolve({id})});
 const count=async()=>Number((await db.query('select count(*) n from report_exports where organization_id=$1',[organizationId])).rows[0].n);
 const before=await count();
 assert.equal((await create.POST(request('short'))).status,400);assert.equal(await count(),before);
 for(const body of [{query,locale:'xx'},{query,locale:['de']},{query,locale:'de',organizationId:otherOrganizationId},{query:'kind=unknown',locale:'de'}])assert.equal((await create.POST(request('invalid-report-key',body))).status,400);
 const created=await create.POST(request('snapshot-fixture-key'));assert.equal(created.status,200,JSON.stringify(created));const item=created.data.item;
 assert.equal(item.locale,'de');assert.equal(item.kind,'summary');assert.ok(Date.parse(item.expiresAt)>Date.now());assert.equal(await count(),before+1);
 const original=await read(item.id);assert.equal(original.status,200);assert.match(original.headers.get('Cache-Control'),/no-store/);const bytes=Buffer.from(await original.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');
 const stored=(await db.query('select pdf_sha256 from report_exports where id=$1',[item.id])).rows[0];assert.equal(stored.pdf_sha256,createHash('sha256').update(bytes).digest('hex'));
 assert.deepEqual((await create.POST(request('snapshot-fixture-key'))).data.item,item,'An ambiguous client retry returns the same snapshot, not regenerated content');assert.equal(await count(),before+1);
 assert.equal((await create.POST(request('snapshot-fixture-key',{query,locale:'fr'}))).status,409);
 assert.equal((await read('not-a-uuid')).status,404);
 globalThis.__processSession={...session,userId:'different-report-owner'};assert.equal((await read(item.id)).status,404);
 globalThis.__processSession={...session,organizationId:otherOrganizationId};assert.equal((await read(item.id)).status,404);
 globalThis.__processSession={...session,role:'member'};assert.equal((await read(item.id)).status,403);
 globalThis.__processSession={...session,role:'reader'};assert.equal((await read(item.id)).status,409,'A reduced role cannot retrieve the richer historical snapshot');
 globalThis.__processSession=session;globalThis.__processReportPlan='start';assert.equal((await read(item.id)).status,409,'Reduced entitlements invalidate the old scope');delete globalThis.__processReportPlan;
 assert.deepEqual(Buffer.from(await (await read(item.id)).arrayBuffer()),bytes,'Restored authorized scope reads exactly the original bytes');
 await assert.rejects(()=>db.query('update report_exports set pdf=pdf where id=$1',[item.id]),/immutable/);
 const row=(await db.query('select * from report_exports where id=$1',[item.id])).rows[0];
 const expired=(await db.query("insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256,expires_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,now()-interval '1 second') returning id",[organizationId,session.userId,row.kind,row.locale,row.query_text,row.scope_hash,row.data_as_of,row.pdf,row.pdf_sha256])).rows[0].id;
 assert.equal((await read(expired)).status,410);
 // Corrupt stored digest must fail closed without returning even valid PDF bytes.
 const corrupt=(await db.query('insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256) values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id',[organizationId,session.userId,row.kind,row.locale,row.query_text,row.scope_hash,row.data_as_of,row.pdf,'0'.repeat(64)])).rows[0].id;
 assert.equal((await read(corrupt)).status,500);
 for(const role of ['manager','project_manager']){
  const restricted={...session,role};globalThis.__processSession=restricted;
  await globalThis.__processTransaction(organizationId,async c=>{const hash=await snapshotModule.reportAccessScope(c,restricted,'pro');assert.match(hash,/^[a-f0-9]{64}$/);});
 }
 globalThis.__processSession=session;
 await (await import('./report-mail-contract.mjs')).verifyReportMail({db,organizationId,otherOrganizationId,session,snapshotId:item.id,originalBytes:bytes,loadRoute});
 await db.query('delete from report_exports where organization_id=$1',[organizationId]);
 console.log('Immutable report snapshots: real PDF/hash, replay/conflict, creator/tenant/role/plan, scope and expiry boundaries passed. No outbound mail.');
}
