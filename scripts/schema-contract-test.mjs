import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {captureSchema,checkSchema,checkMigrationVersions,migrationFiles} from './schema-contract.mjs';
const db=new PGlite();
try{
 await db.exec('create table scoped(id uuid not null,organization_id uuid not null); alter table scoped enable row level security; alter table scoped force row level security; create policy tenant on scoped using (organization_id=current_setting(\'app.organization_id\',true)::uuid)');
 const contract={tables:await captureSchema(db)};await checkSchema(db,contract);
 for(const mutation of ['alter table scoped disable row level security','alter table scoped no force row level security','drop policy tenant on scoped','alter policy tenant on scoped using (true)','alter policy tenant on scoped with check (true)','alter table scoped drop column id','create table unclassified(id int)']){
  await db.exec('begin');await db.exec(mutation);await assert.rejects(checkSchema(db,contract));await db.exec('rollback');
 }
 const versions=(await migrationFiles()).map(version=>({version}));await checkMigrationVersions(versions);
 await assert.rejects(checkMigrationVersions(versions.slice(0,-1)),/Required migration/);
 await assert.rejects(checkMigrationVersions(versions,{checksums:true}),/checksum mismatch/);
 console.log('Schema gate rejects missing latest migration, changed checksum, missing columns/policies, disabled RLS/FORCE and unclassified tables.');
}finally{await db.close();}
