import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';

export async function verifySupplierBankContract({load,db,transaction,org,other,act,request,setAuditFailure}){
 const sessions=(await db.query('select id,user_id,organization_id from auth_sessions')).rows;
 const as=(role,organizationId=org)=>{const userId='employee-dossier-'+(organizationId===other?'foreign':role);return act(role,organizationId,{userId,sessionId:sessions.find(s=>s.user_id===userId&&s.organization_id===organizationId)?.id});};
 const bank=load('app/api/suppliers/[id]/bank/route.ts'),root=load('app/api/suppliers/route.ts'),detail=load('app/api/suppliers/[id]/route.ts');
 as('owner');const result=await root.POST(request({name:'Synthetic bank supplier'}));assert.equal(result.status,201);
 const id=(await result.json()).item.id;
 const read=()=>bank.GET(new Request('https://employee.invalid/api/suppliers/'+id+'/bank'),{params:Promise.resolve({id})});
 const write=(body,key=randomUUID())=>bank.PATCH(request(body,key,'PATCH'),{params:Promise.resolve({id})});
 const start=(await (await read()).json()).item;
 const iban='CH9300762011623852957',body={iban:'ch93 0076 2011 6238 5295 7',expectedRevision:start.revision},key=randomUUID();
 const sessionId=sessions.find(s=>s.user_id==='employee-dossier-owner').id;
 await db.query("update auth_sessions set step_up_at=now()-interval '6 minutes' where id=$1",[sessionId]);
 assert.equal((await write(body,key)).status,403,'Bank edits require fresh session-bound proof');
 await db.query('update auth_sessions set step_up_at=now() where id=$1',[sessionId]);
 let response=await write(body,key);assert.equal(response.status,200,await response.clone().text());
 assert.equal(Object.hasOwn((await response.json()).item,'iban'),false,'Replay record and mutation response omit bank data');
 assert.equal((await write(body,key)).status,200,'Same confirmed change replays without duplicate audit');
 let stored=(await (await read()).json()).item;assert.equal(stored.iban,iban);
 assert.equal((await write({...body,iban:''},key)).status,409,'Changed payload cannot reuse a request key');
 assert.equal((await write({...body,iban:''})).status,409,'Stale bank editor is rejected');
 for(const invalid of ['CH9300762011623852958','1','CH93','<svg>'])assert.equal((await write({iban:invalid,expectedRevision:stored.revision})).status,400);
 assert.equal((await write({iban,expectedRevision:stored.revision,organization_id:other})).status,400);
 const publicRow=await detail.GET(new Request('https://employee.invalid/api/suppliers/'+id),{params:Promise.resolve({id})});
 assert.equal(Object.hasOwn((await publicRow.json()).item,'iban'),false,'General supplier DTO remains bank-free');
 const audit=(await db.query("select detail from audit_events where organization_id=$1 and entity_id=$2 and action='supplier.bank_changed'",[org,id])).rows;
 assert.equal(audit.length,1,'Replay does not duplicate audit');assert.ok(!JSON.stringify(audit).includes(iban),'Audit never stores IBAN');
 for(const role of ['hr','project_manager','manager','member','reader']){
  as(role);assert.equal((await read()).status,403);assert.equal((await write(body)).status,403);
  await assert.rejects(()=>transaction(org,'employee-dossier-'+role,c=>c.query('update suppliers set iban=null where id=$1',[id])),e=>e.code==='42501','DB guards bank mutation independently for '+role);
 }
 as('owner',other);assert.equal((await read()).status,404);assert.equal((await write({iban:'',expectedRevision:stored.revision})).status,404);
 as('owner');setAuditFailure(true);assert.equal((await write({iban:'',expectedRevision:stored.revision})).status,500);setAuditFailure(false);
 stored=(await (await read()).json()).item;assert.equal(stored.iban,iban,'Audit failure preserves previous bank details');
 as('owner',org);act('owner',org,{sessionId,organizationStatus:'read_only'});assert.equal((await write({iban:'',expectedRevision:stored.revision})).status,403);
 as('finance');response=await write({iban:'',expectedRevision:stored.revision});assert.equal(response.status,200);assert.equal((await (await read()).json()).item.iban,null,'Explicit clearing is supported');
 as('owner');
 console.log('Supplier bank: actual GET/PATCH, central Swiss IBAN validation, fresh proof/expiry, stale/replay, public DTO/audit redaction, DB role guard, tenant isolation, clearing and atomic audit rollback passed. No payment initiated; non-CH/LI bank input remains unsupported.');
}
