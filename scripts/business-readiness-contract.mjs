import assert from 'node:assert/strict';
export async function verifyBusinessReadiness({service,sql,transaction,session,createDraft,issue}){
 const org=session.organizationId,actor={...session,isDemo:false,organizationStatus:'active'},run=(fn,s=actor)=>transaction(s,c=>fn(c,s));
 const original=(await sql('select name,legal_name,street,postal_code,city,country_code,iban,qr_iban from organizations where id=$1',[org])).rows[0];
 const keys=Object.keys(original),restore=()=>sql('update organizations set '+keys.map((key,index)=>key+'=$'+(index+2)).join(',')+' where id=$1',[org,...Object.values(original)]);
 try{
  await sql("update organizations set name='Readiness Fixture',legal_name='',street='Hauptstrasse',postal_code='3000',city='Bern',country_code='CH',iban='CH9300762011623852957',qr_iban='' where id=$1",[org]);
  for(const role of ['owner','admin','finance','hr','project_manager','manager','member','reader']){
   if(['owner','admin'].includes(role)){const guide=await run((c,s)=>service.readSetupGuide(c,s),{...actor,role});assert.equal(guide.requiredComplete,3);assert.ok(guide.tasks.every(task=>typeof task.complete==='boolean'));assert.ok(!JSON.stringify(guide).includes('CH9300'),'Metadata must not disclose account values');}
   else await assert.rejects(()=>run((c,s)=>service.readSetupGuide(c,s),{...actor,role}),error=>error.status===403);
  }
  assert.equal((await run((c,s)=>service.readSetupGuide(c,s),{...actor,organizationStatus:'read_only'})).editable,false);
  await assert.rejects(()=>run((c,s)=>service.setSetupGuideDismissed(c,s,true),{...actor,organizationStatus:'read_only'}),e=>e.status===403);
  await assert.rejects(()=>run((c,s)=>service.setSetupGuideDismissed(c,s,true),{...actor,isDemo:true}),e=>e.status===403);
  for(const value of ['false',1,null,{},[]])await assert.rejects(()=>run((c,s)=>service.setSetupGuideDismissed(c,s,value)),e=>e.code==='preference_invalid');
  const audits=async()=>Number((await sql("select count(*) n from audit_events where organization_id=$1 and actor_user_id=$2 and action='setup_guide.preference_changed'",[org,actor.userId])).rows[0].n);
  await run((c,s)=>service.setSetupGuideDismissed(c,s,false));const before=await audits();
  await assert.rejects(()=>run((c,s)=>service.setSetupGuideDismissed({query:(text,args)=>{if(text.includes('insert into audit_events'))throw Error('Readiness audit failure');return c.query(text,args)}},s,true)),/Readiness audit failure/);
  assert.equal((await run((c,s)=>service.readSetupGuide(c,s))).dismissed,false,'Failed audit rolls preference back');
  await run((c,s)=>service.setSetupGuideDismissed(c,s,true));await run((c,s)=>service.setSetupGuideDismissed(c,s,true));assert.equal(await audits(),before+1,'Same preference is idempotent');
  assert.equal((await run((c,s)=>service.readSetupGuide(c,s))).dismissed,true,'Fresh read persists own choice');
  const other=(await sql('select id from app_users where id<>$1 order by id limit 1',[actor.userId])).rows[0];assert.ok(other);
  assert.equal((await run(c=>c.query('select * from user_setup_preferences where organization_id=$1 and user_id=$2',[org,actor.userId]),{...actor,userId:other.id})).rows.length,0,'Same tenant cannot read another personal preference');
  await assert.rejects(()=>run(c=>c.query('insert into user_setup_preferences(organization_id,user_id,dismissed) values($1,$2,true) on conflict(organization_id,user_id) do update set dismissed=true',[org,actor.userId]),{...actor,userId:other.id}),/row-level security/);
  const draft=await createDraft();
  assert.equal((await run((c,s)=>service.readInvoiceReadiness(c,s,draft.number))).ready,true);
  await sql("update organizations set iban='',qr_iban='' where id=$1",[org]);
  const owner=await run((c,s)=>service.readInvoiceReadiness(c,s,draft.number));assert.equal(owner.ready,false);assert.match(owner.recovery.href,/setupField=iban/);assert.match(owner.recovery.href,/returnTo=/);
  const finance=await run((c,s)=>service.readInvoiceReadiness(c,s,draft.number),{...actor,role:'finance'});assert.equal(finance.ready,false);assert.equal(finance.recovery,undefined,'Finance has no unauthorized settings link');
  const unconfigured=await createDraft();assert.equal(unconfigured.status,'draft','Missing banking data must not prevent draft persistence');
  await assert.rejects(()=>run((c,s)=>issue(c,s,unconfigured.number)),e=>e.code==='payment_data_invalid');
  assert.equal((await sql('select status from invoices where organization_id=$1 and invoice_no=$2',[org,unconfigured.number])).rows[0].status,'draft','Direct mutation cannot bypass final readiness');
  await assert.rejects(()=>run((c,s)=>service.readInvoiceReadiness(c,s,'FOREIGN-OR-MISSING')),e=>e.status===404);
  await sql("update organizations set iban='CH9300762011623852957' where id=$1",[org]);
  assert.equal((await run((c,s)=>service.readInvoiceReadiness(c,s,unconfigured.number))).ready,true,'Corrected settings make the same saved draft eligible, without issuing it');
  assert.equal((await sql('select status from invoices where organization_id=$1 and invoice_no=$2',[org,unconfigured.number])).rows[0].status,'draft');
 }finally{await restore();await sql('delete from user_setup_preferences where organization_id=$1 and user_id=$2',[org,actor.userId]);}
 console.log('Business readiness: real migrated/RLS personal preference, role/read-only/demo boundaries, audit rollback/replay, missing-bank draft, final issuance rejection and corrected-record recovery passed.');
}
