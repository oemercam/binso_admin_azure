import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {prepareReset,applyReset,resetMetadata} from './test-data-reset.mjs';

const db=new PGlite({extensions:{pgcrypto}});
const retained={email:'owner@fixture.invalid',objectId:'11111111-1111-4111-8111-111111111111',tenantId:'22222222-2222-4222-8222-222222222222'};
try{
 await db.exec('create extension pgcrypto;create role reset_schema_owner;grant usage,create on schema public to reset_schema_owner;set role reset_schema_owner;create table schema_migrations(version text primary key,checksum text not null,applied_at timestamptz default now())');
 for(const file of (await fs.readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort()){
  await db.exec('begin');try{await db.exec(await fs.readFile('database/migrations/'+file,'utf8'));await db.query('insert into schema_migrations(version,checksum) values($1,$2)',[file,'synthetic-checksum']);await db.exec('commit');}catch(e){await db.exec('rollback');throw e;}
 }
 await db.query(`insert into platform_operator_assignments(user_id,email,role,status,auth_source,entra_object_id,entra_tenant_id) values('retained',$1,'platform_owner','active','entra',$2,$3),('other','other@fixture.invalid','platform_support','active','entra','33333333-3333-4333-8333-333333333333',$3)`,[retained.email,retained.objectId,retained.tenantId]);
 await db.query("insert into platform_auth_sessions(user_id,token_hash,expires_at) values('retained','synthetic-owner-token',now()+interval '1 hour'),('other','synthetic-other-token',now()+interval '1 hour')");
 await db.query("insert into app_users(id,email,display_name) values('personal-owner',$1,'Retained'),('discarded','discarded@fixture.invalid','Discarded')",[retained.email]);
 const before=await resetMetadata(db,retained.email);
 const selected=new Set(before.tables.filter(t=>t.columns.includes('organization_id')||t.relname==='organizations').map(t=>t.relname));
 let changed=true;while(changed){changed=false;for(const fk of before.fks)if(selected.has(fk.target)&&!selected.has(fk.source)){selected.add(fk.source);changed=true;}}
 const options={...retained,reviewedTables:[...selected].sort()};
 await assert.rejects(()=>prepareReset(db,{...options,objectId:'wrong'}));
 await assert.rejects(()=>prepareReset(db,{...options,reviewedTables:options.reviewedTables.filter(t=>t!=='invoices')}),/scope/);
 const plan=await prepareReset(db,options);
 await assert.rejects(()=>applyReset(db,plan,'wrong'),/confirmation/);
 await assert.rejects(()=>applyReset(db,{...plan,email:'other@fixture.invalid'},plan.sha256),/modified/);
 await db.query("update organizations set status='archived' where id=$1",[before.companies[0].id]);
 await assert.rejects(()=>applyReset(db,plan,plan.sha256),/drifted/);
 assert.equal((await resetMetadata(db,retained.email)).companies.length,before.companies.length,'Drift denial never empties a table');
 await db.query('update organizations set status=$2 where id=$1',[before.companies[0].id,before.companies[0].status]);
 const fresh=await prepareReset(db,options);
 const receipt=await applyReset(db,fresh,fresh.sha256);
 assert.equal(receipt.removedCompanies,before.companies.length);assert.equal(receipt.retainedOwnerUnchanged,true);
 // Inspect as the isolated test superuser: this proves no RLS-filtered false zeros.
 await db.exec('reset role');
 for(const table of fresh.tables)assert.equal((await db.query('select count(*)::int n from public."'+table+'"')).rows[0].n,0,table);
 assert.equal((await db.query('select count(*)::int n from app_users')).rows[0].n,1);
 assert.equal((await db.query('select user_id from platform_operator_assignments')).rows[0].user_id,'retained');
 assert.equal((await db.query('select count(*)::int n from platform_auth_sessions')).rows[0].n,1);
 const after=await resetMetadata(db,retained.email);assert.deepEqual(after.policies,before.policies);assert.deepEqual(after.tables,before.tables);assert.deepEqual(after.constraints,before.constraints);
 assert.deepEqual(after.admin,before.admin);assert.deepEqual(after.personal,before.personal);
 console.log('Complete-schema reset: real table-owner/FORCE-RLS behavior, exact scope, retained owner/identity/session, wrong identity/confirmation, plan tampering, drift rollback, all target tables empty, unchanged policies/constraints/configuration passed.');
}finally{await db.close();}
