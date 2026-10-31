import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
const address=process.env.BINSO_QUOTA_TEST_URL;
let pool,admin;
if(address){
 const url=new URL(address);assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&/^\/binso_quota_review_test(?:_\d+)?$/.test(url.pathname)&&url.username==='binso_test'&&!url.search&&!url.hash,'Only the dedicated disposable loopback database is allowed');
 const {Pool}=await import('pg');pool=new Pool({connectionString:address,max:6});admin=await pool.connect();
 assert.equal((await admin.query("select count(*)::int n from information_schema.tables where table_schema='public'")).rows[0].n,0,'Never reset or reuse an existing database');
 const version=Number((await admin.query("select current_setting('server_version_num') n")).rows[0].n);assert.ok(version>=180000&&version<190000,'Native qualification requires PostgreSQL 18');
}
const db=admin?{query:(...args)=>admin.query(...args),exec:sql=>admin.query(sql),close:async()=>{admin.release();await pool.end();}}:new PGlite({extensions:{pgcrypto}}),org=randomUUID(),other=randomUUID(),user='quota-owner';
const legacyOrg=randomUUID(),legacyPdf=Buffer.from('%PDF-retained-expired-fixture');
try{
 await db.exec('create extension pgcrypto');
 for(const file of (await fs.readdir('database/migrations')).filter(file=>file.endsWith('.sql')).sort()){
  const sql=await fs.readFile('database/migrations/'+file,'utf8');
  if(file==='0115_resource_quotas.sql'){
   await db.query("insert into organizations(id,name,slug,status) values($1,'Existing quota fixture',$2,'active')",[legacyOrg,'old-quota-'+legacyOrg]);
   await db.query("insert into app_users(id,email,display_name,status) values('quota-legacy-owner','quota-legacy@example.invalid','Legacy owner','active')");
   await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,'quota-legacy-owner','quota-legacy@example.invalid','owner','active')",[legacyOrg]);
   await db.query("insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256,expires_at) values($1,'quota-legacy-owner','summary','de','legacy',repeat('a',64),now(),$2,repeat('b',64),now()-interval '1 day')",[legacyOrg,legacyPdf]);
   await db.exec('begin;create role quota_filtered_migrator_fixture;grant usage,create on schema public to quota_filtered_migrator_fixture;grant all on all tables in schema public to quota_filtered_migrator_fixture;set local role quota_filtered_migrator_fixture');
   await db.query("select set_config('app.organization_id',$1,true),set_config('app.user_id','quota-legacy-owner',true)",[legacyOrg]);
   await assert.rejects(()=>db.exec(sql),error=>error.code==='42501'&&error.message.includes('Unfiltered quota inventory'),'A filtered migration inventory must never silently undercount historical bytes');
   await db.exec('rollback');
  }
  await db.exec(sql);
 }
 assert.equal(Number((await db.query("select used from organization_quota_usage where organization_id=$1 and period='storage'",[legacyOrg])).rows[0].used),legacyPdf.length,'Unfiltered migration inventory counts expired but physically retained PDFs');
 const provision=await fs.readFile('database/operations/provision-runtime-role.sql','utf8');
 const existingRole=(await db.query("select rolsuper,rolbypassrls,rolcreaterole from pg_roles where rolname='binso_runtime'")).rows[0];
 if(pool&&existingRole){
  assert.ok(!existingRole.rolsuper&&!existingRole.rolbypassrls&&!existingRole.rolcreaterole,'Never reuse a privileged runtime identity');
  // Share the established unprivileged cluster role, grant this empty fixture's
  // newly migrated objects only; never change the role or any existing database.
  await db.exec('begin;\n'+provision.slice(provision.indexOf('GRANT USAGE ON SCHEMA public')));
 }else await db.exec(provision);
 for(const id of [org,other])await db.query("insert into organizations(id,name,slug,status) values($1,'Quota fixture',$2,'active')",[id,'quota-'+id]);
 await db.query("insert into app_users(id,email,display_name,status) values($1,'quota@example.invalid','Quota','active')",[user]);
 await db.query("insert into organization_memberships(organization_id,user_id,email,role,status) values($1,$2,'quota@example.invalid','owner','active')",[org,user]);
 await db.query('insert into organization_entitlements(organization_id,max_storage_mb,max_monthly_documents,max_api_requests_per_month) values($1,1,2,2)',[org]);
 const transaction=async fn=>{const c=pool?await pool.connect():db;try{await c.query('begin');await c.query('set local role binso_runtime');await c.query("select set_config('app.organization_id',$1,true),set_config('app.user_id',$2,true)",[org,user]);const result=await fn(c);await c.query('commit');return result;}catch(error){await c.query('rollback');throw error;}finally{if(pool)c.release();}};
 const pdf=Buffer.concat([Buffer.from('%PDF-'),Buffer.alloc(700000)]);
 const insert=c=>c.query("insert into report_exports(organization_id,created_by_user_id,kind,locale,query_text,scope_hash,data_as_of,pdf,pdf_sha256) values($1,$2,'summary','de','from=2026-10-01',repeat('a',64),now(),$3,repeat('b',64)) returning id",[org,user,pdf]);
 const id=(await transaction(insert)).rows[0].id;
 await assert.rejects(()=>transaction(insert),error=>error.constraint==='organization_storage_quota');
 assert.equal(Number((await db.query("select used from organization_quota_usage where organization_id=$1 and period='storage'",[org])).rows[0].used),pdf.length,'Rejected writes roll back both bytes and counters');
 await transaction(c=>c.query('delete from report_exports where id=$1',[id]));
 assert.equal(Number((await db.query("select used from organization_quota_usage where organization_id=$1 and period='storage'",[org])).rows[0].used),0,'Retention releases actual deleted bytes');
 await transaction(async c=>{const changed=await c.query("update organization_quota_usage set used=0 where period='storage'");assert.equal(Number(changed.affectedRows??changed.rowCount),0,'Runtime cannot reset private counters');});
 await assert.rejects(()=>transaction(c=>c.query("insert into organization_quota_usage(organization_id,period) values($1,'2099-01')",[org])),error=>error.code==='42501');
 await transaction(async c=>assert.equal((await c.query('select * from organization_quota_usage where organization_id=$1',[other])).rows.length,0,'Other tenant counters stay hidden'));
 const customer=(await db.query("insert into customers(organization_id,external_id,customer_no,name) values($1,$2,'QUOTA-CUSTOMER','Quota customer') returning id",[org,randomUUID()])).rows[0].id;
 const document=number=>transaction(c=>c.query("insert into quotes(organization_id,external_id,quote_no,customer_id,title,status,created_by_user_id,issue_date) values($1,$2,$3,$4,'Quota draft','draft',$5,current_date) returning id",[org,randomUUID(),number,customer,user]));
 const first=(await document('QUOTA-1')).rows[0].id;await document('QUOTA-2');
 await assert.rejects(()=>document('QUOTA-3'),error=>error.constraint==='organization_document_quota');
 await db.query('delete from quotes where id=$1',[first]);
 await assert.rejects(()=>document('QUOTA-4'),error=>error.constraint==='organization_document_quota','Deletion cannot recycle a monthly creation budget');
 const request=()=>transaction(c=>c.query('select consume_organization_api_request() allowed'));
 assert.equal((await request()).rows[0].allowed,true);assert.equal((await request()).rows[0].allowed,true);assert.equal((await request()).rows[0].allowed,false);
 if(pool){
  const storage=await Promise.allSettled([transaction(insert),transaction(insert)]);
  assert.equal(storage.filter(result=>result.status==='fulfilled').length,1,'Concurrent writes cannot exceed the last storage allowance');
  assert.equal(storage.find(result=>result.status==='rejected').reason.constraint,'organization_storage_quota');
  await db.query('update organization_entitlements set max_monthly_documents=3,max_api_requests_per_month=3 where organization_id=$1',[org]);
  const documents=await Promise.allSettled([document('QUOTA-RACE-A'),document('QUOTA-RACE-B')]);
  assert.equal(documents.filter(result=>result.status==='fulfilled').length,1,'One remaining document slot has exactly one winner');
  assert.equal(documents.find(result=>result.status==='rejected').reason.constraint,'organization_document_quota');
  const api=await Promise.all([request(),request()]);assert.equal(api.filter(result=>result.rows[0].allowed).length,1,'One remaining API slot has exactly one winner');
  console.log('PostgreSQL 18: independent connections racing for the last storage, document and API slot passed.');
  if(process.argv.includes('--http'))await (await import('./resource-quota-http-test.mjs')).verifyQuotaHttp({connectionString:address,db,org,user});
 }
 console.log('Resource quotas: real migrated RLS, atomic rollback, retained/deleted PDF bytes, private counters, tenant isolation, document exhaustion and API exhaustion passed.');
}finally{await db.close();}
