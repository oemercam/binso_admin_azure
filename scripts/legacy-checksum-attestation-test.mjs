import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {createAttestationPlan,applyAttestation,digest,legacyVersions} from './legacy-checksum-attestation.mjs';
import {migrationFiles,checkMigrationVersions} from './schema-contract.mjs';
const db=new PGlite({extensions:{pgcrypto}}),sha='a'.repeat(40);
const client={query:async(sql,args)=>{if(sql==='select current_database() as database,current_user as actor')return {rows:[{database:'binso_platform',actor:'synthetic_admin'}]};const result=await db.query(sql,args);return {...result,rowCount:result.affectedRows};}};
const snapshot=async()=>JSON.stringify((await db.query('select * from schema_migrations order by version')).rows);
try{
 await db.exec('create extension pgcrypto;create role schema_owner;grant usage,create on schema public to schema_owner;set role schema_owner;create table schema_migrations(version text primary key,checksum text,applied_at timestamptz not null)');
 const files=await migrationFiles();
 for(const version of files){const sql=await fs.readFile('database/migrations/'+version,'utf8');await db.exec(sql);await db.query('insert into schema_migrations values($1,$2,$3)',[version,legacyVersions.includes(version)?null:digest(sql),'2026-10-01T12:00:00.123456Z']);}
 // An unrelated historic record is preserved byte-for-byte as well.
 await db.query("insert into schema_migrations values('historical-import-marker','preserve-me','2026-09-01T00:00:00Z')");
 const original=await snapshot(),plan=await createAttestationPlan(client,sha),hash=digest(plan);
 assert.equal(plan.updates.length,16);assert.equal(await snapshot(),original,'Planning is read only');
 await assert.rejects(applyAttestation(client,sha,'0'.repeat(64)),/Reviewed plan changed/);assert.equal(await snapshot(),original);
 await assert.rejects(applyAttestation(client,'b'.repeat(40),hash),/Reviewed plan changed/);assert.equal(await snapshot(),original);
 // Changed row/timestamp after review must invalidate the reviewed plan.
 await db.query("update schema_migrations set applied_at='2026-10-02' where version=$1",[files[0]]);
 await assert.rejects(applyAttestation(client,sha,hash),/Reviewed plan changed/);
 await db.query("update schema_migrations set applied_at='2026-10-01T12:00:00.123456Z' where version=$1",[files[0]]);
 for(const [sql,args,pattern] of [
  ['update schema_migrations set checksum=$1 where version=$2',['wrong',files.at(-1)],/Non-legacy checksum/],
  ['update schema_migrations set checksum=null where version=$1',[files.at(-1)],/Non-legacy checksum/],
  ['update schema_migrations set checksum=$1 where version=$2',['already-filled',files[0]],/approved legacy NULL/],
  ['delete from schema_migrations where version=$1',[files.at(-1)],/Required migration/],
  ['alter table customers disable row level security',[],/RLS contract/],
  ['create table unexpected(id int)',[],/Unclassified application/]
 ]){
  await db.exec('begin');try{await db.query(sql,args);await assert.rejects(createAttestationPlan(client,sha),pattern)}finally{await db.exec('rollback')}
 }
 await assert.rejects(createAttestationPlan({query:(sql,args)=>sql==='select current_database() as database,current_user as actor'?Promise.resolve({rows:[{database:'wrong_database',actor:'synthetic_admin'}]}):db.query(sql,args)},sha),/Only the active/);
 // A failure after several updates rolls the entire correction back.
 let writes=0;const failing={query:(sql,args)=>{if(sql.startsWith('update public.schema_migrations')&&++writes===8)throw Error('synthetic connection failure');return client.query(sql,args)}};
 await assert.rejects(applyAttestation(failing,sha,hash),/synthetic connection failure/);assert.equal(await snapshot(),original);
 const businessBefore=JSON.stringify((await db.query('select row_to_json(o) as row from organizations o order by id')).rows);
 const receipt=await applyAttestation(client,sha,hash);
 assert.deepEqual(receipt.updatedVersions,legacyVersions);
 assert.equal((await db.query('select count(*)::int count from schema_migrations where checksum is null')).rows[0].count,0);
 await checkMigrationVersions((await db.query('select * from schema_migrations')).rows,{checksums:true});
 assert.equal(JSON.stringify((await db.query('select row_to_json(o) as row from organizations o order by id')).rows),businessBefore,'Business rows untouched');
 assert.equal((await db.query("select checksum from schema_migrations where version='historical-import-marker'")).rows[0].checksum,'preserve-me');
 await assert.rejects(applyAttestation(client,sha,hash),/approved legacy NULL/,'Replaying a completed plan cannot write');
 console.log('Legacy attestation: 16 NULL-only updates, full schema and remaining checksums, source/plan/target/drift refusal, mid-transaction rollback, unchanged business rows/timestamps/historic metadata and replay refusal passed.');
}finally{await db.close();}
