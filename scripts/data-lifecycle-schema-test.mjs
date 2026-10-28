import fs from "node:fs/promises";
import assert from "node:assert/strict";
import {PGlite} from "@electric-sql/pglite";
import {pgcrypto} from "@electric-sql/pglite/contrib/pgcrypto";

const db=new PGlite({extensions:{pgcrypto}});
try{
  await db.exec("create extension pgcrypto; create role schema_owner; grant usage,create on schema public to schema_owner; set role schema_owner");
  for(const file of (await fs.readdir("database/migrations")).filter(name=>name.endsWith(".sql")).sort()){
    await db.exec("begin");
    try{
      await db.exec(await fs.readFile("database/migrations/"+file,"utf8"));
      await db.exec("commit");
    }catch(error){
      await db.exec("rollback");
      throw new Error(file+": "+error.message);
    }
  }
  await db.exec("reset role");

  const constraints=await db.query(`
    select con.conname,
           rel.relname as table_name,
           con.confdeltype,
           pg_get_constraintdef(con.oid) as definition
      from pg_constraint con
      join pg_class rel on rel.oid=con.conrelid
      join pg_namespace ns on ns.oid=rel.relnamespace
      join pg_class ref on ref.oid=con.confrelid
     where con.contype='f'
       and ns.nspname='public'
       and ref.relname='organizations'
     order by rel.relname,con.conname
  `);

  const organizationConstraints=constraints.rows.filter(row=>String(row.definition).toLowerCase().includes("organization_id"));
  assert.ok(organizationConstraints.length>0,"Organization foreign-key constraints must exist.");
  const restrictive=organizationConstraints.filter(row=>row.confdeltype!=="c");
  assert.ok(restrictive.length>=1,"Schema fixture must exercise at least one restrictive organization foreign key.");

  const lifecycle=await fs.readFile("scripts/organization-data-lifecycle.mjs","utf8");
  const sanitizerSource=lifecycle.slice(lifecycle.indexOf('const sensitiveKey='),lifecycle.indexOf('async function tenantTables'));
  const {sanitize,exportableTable}=Function('Buffer',sanitizerSource+';return {sanitize,exportableTable};')(Buffer);
  for(const table of ['auth_sessions','auth_tokens','auth_passkeys','auth_passkey_challenges','offer_recipient_codes'])assert.equal(exportableTable(table),false,'Authentication records never enter a business export');
  for(const table of ['customers','invoices','time_entries','file_objects','offer_versions','offer_public_events','offer_public_links'])assert.equal(exportableTable(table),true,'Business data remains exportable');
  assert.deepEqual(sanitize({recipient:'synthetic@fixture.invalid',token_enc:'private',token_hash:'private',version:2}),{recipient:'synthetic@fixture.invalid',version:2},'Capability secrets never enter an exported business record');
  assert.deepEqual(sanitize({name:'Synthetic',amount:12,nested:{challenge:'private',public_key:'private',auth_snapshot:'private',credential_id:'private',description:'Retained'}}),{name:'Synthetic',amount:12,nested:{description:'Retained'}},'Nested authentication material is excluded while business values remain');
  assert.ok(lifecycle.includes("restrictiveOrgFks"),"Final deletion must explicitly handle restrictive direct organization foreign keys.");
  assert.ok(lifecycle.includes("con.confdeltype<>'c'"),"Deletion plan must discover non-cascading organization foreign keys.");
  for(const required of [
    "BINSO_DELETE_CONFIRM",
    "BINSO_DELETE_EXPORT_CONFIRMED",
    "BINSO_EXTERNAL_BLOBS_PURGE_CONFIRMED",
    'organization.status!=="archived"',
    "Active/trial billing state blocks final deletion",
    "Tenant rows remain after organization deletion",
    "rollback"
  ]){
    assert.ok(lifecycle.includes(required),"Lifecycle deletion safeguard missing: "+required);
  }

  const lifecycleOrg='bbbbbbbb-1111-4111-a111-111111111111';
  await db.query("insert into organizations(id,name,slug,status,is_demo) values($1,'Synthetic billing lifecycle','billing-lifecycle-fixture','active',false)",[lifecycleOrg]);
  const agreement=(await db.query("insert into billing_agreements(organization_id,currency,terms,created_by_user_id,scope_kind,scope_id) values($1,'CHF',$2::jsonb,'synthetic-owner','project',gen_random_uuid()) returning id",[lifecycleOrg,JSON.stringify({revision:1,model:'fixed',currency:'CHF',amount:'100.00'})])).rows[0].id;
  await assert.rejects(()=>db.query('delete from billing_agreements where id=$1',[agreement]),error=>error.code==='23514','Direct agreement deletion remains forbidden even to an owner');
  for(const table of ['billing_agreements','billing_milestone_completions','billing_closures']){assert.equal(organizationConstraints.find(row=>row.table_name===table)?.confdeltype,'c',table+' follows the existing organization lifecycle');assert.equal(exportableTable(table),true);}
  const customer=(await db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,'billing-lifecycle-customer','LIFECYCLE','Synthetic') returning id",[lifecycleOrg])).rows[0].id;
  const invoice=(await db.query("insert into invoices(organization_id,external_id,invoice_no,customer_id,issue_date,due_date,status) values($1,'billing-lifecycle-invoice','LIFECYCLE',$2,current_date,current_date,'draft') returning id",[lifecycleOrg,customer])).rows[0].id;
  const linkedAgreement=(await db.query("insert into billing_agreements(organization_id,customer_id,currency,terms,created_by_user_id,scope_kind,scope_id) values($1,$2,'CHF',$3::jsonb,'synthetic-owner','invoice',$4) returning id",[lifecycleOrg,customer,JSON.stringify({revision:1,model:'fixed',currency:'CHF',amount:'100.00'}),invoice])).rows[0].id;
  await db.query('insert into billing_closures(organization_id,agreement_id,invoice_id) values($1,$2,$3)',[lifecycleOrg,linkedAgreement,invoice]);
  await db.exec('begin');
  await db.query('delete from invoices where id=$1',[invoice]);await db.query('delete from customers where id=$1',[customer]);
  await db.query('delete from organizations where id=$1',[lifecycleOrg]);
  await db.exec('commit');
  for(const table of ['billing_agreements','billing_closures'])assert.equal((await db.query('select count(*)::int n from '+table+' where organization_id=$1',[lifecycleOrg])).rows[0].n,0,'New tenant references leave no orphan after the controlled deletion order');
  assert.equal((await db.query('select id from billing_agreements where id=$1',[agreement])).rows.length,0,'An actual organization cascade removes its otherwise immutable agreement');
  await (await import('./report-retention-contract.mjs')).verifyReportRetention(db);
  console.log("Organization data lifecycle schema and deletion safeguards passed.");
}finally{
  await db.close();
}
