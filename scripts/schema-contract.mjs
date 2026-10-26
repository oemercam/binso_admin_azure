import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Catalog access works for the restricted runtime without reading customer rows. */
export async function captureSchema(client){
 const tables=(await client.query(`select c.relname as name,c.relrowsecurity as rls,c.relforcerowsecurity as forced
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p') and c.relname<>'schema_migrations' order by c.relname`)).rows;
 const columns=(await client.query(`select c.relname as table_name,a.attname as name,format_type(a.atttypid,a.atttypmod) as type,a.attnotnull as required
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
 where n.nspname='public' and c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped order by c.relname,a.attnum`)).rows;
 const policies=(await client.query("select tablename,policyname,cmd,permissive,roles::text as roles,qual,with_check from pg_policies where schemaname='public' order by tablename,policyname")).rows;
 return tables.map(table=>({...table,columns:columns.filter(c=>c.table_name===table.name).map(({table_name:_,...c})=>c),policies:policies.filter(p=>p.tablename===table.name).map(({tablename:_,...p})=>p)}));
}
export async function checkSchema(client,contract){
 const actual=new Map((await captureSchema(client)).map(t=>[t.name,t]));
 for(const expected of contract.tables){
  const table=actual.get(expected.name);
  if(!table)throw Error('Missing application table: '+expected.name);
  if(table.rls!==expected.rls||table.forced!==expected.forced)throw Error('RLS contract mismatch: '+expected.name);
  const columns=new Map(table.columns.map(c=>[c.name,c]));
  for(const column of expected.columns)if(JSON.stringify(columns.get(column.name))!==JSON.stringify(column))throw Error('Column contract mismatch: '+expected.name+'.'+column.name);
  if(JSON.stringify(table.policies)!==JSON.stringify(expected.policies))throw Error('Policy contract mismatch: '+expected.name);
 }
 const unknown=[...actual.keys()].filter(name=>!contract.tables.some(t=>t.name===name));
 if(unknown.length)throw Error('Unclassified application tables: '+unknown.join(', '));
}
export async function migrationFiles(){return (await fs.readdir('database/migrations')).filter(f=>f.endsWith('.sql')).sort();}
export async function checkMigrationVersions(applied,{checksums=false}={}){
 const map=new Map(applied.map(row=>[row.version,row]));
 for(const version of await migrationFiles()){
  const row=map.get(version);if(!row)throw Error('Required migration not applied: '+version);
  if(checksums){const digest=createHash('sha256').update(await fs.readFile('database/migrations/'+version)).digest('hex');if(row.checksum!==digest)throw Error('Migration checksum mismatch: '+version);}
 }
}
