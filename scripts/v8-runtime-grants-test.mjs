import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import pg from 'pg';
const address=process.env.BINSO_RUNTIME_GRANTS_TEST_URL;
if(address){const url=new URL(address);assert.ok(['postgres:','postgresql:'].includes(url.protocol)&&['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/binso_v8_grants_test'&&url.username==='binso_test'&&!url.search&&!url.hash,'Only the isolated empty grant-test database is allowed');}
const connection=address?new pg.Client({connectionString:address}):new PGlite();
if(address)await connection.connect();
const adapt=sql=>address?sql.replaceAll('binso_runtime','binso_runtime_grants_fixture'):sql;
const db={exec:sql=>address?connection.query(adapt(sql)):connection.exec(adapt(sql)),query:(sql,values)=>connection.query(adapt(sql),values)};
try{
 if(address){assert.equal((await db.query("select count(*)::int n from information_schema.tables where table_schema='public'")).rows[0].n,0,'Never reset an existing schema');const version=Number((await db.query("select current_setting('server_version_num') version")).rows[0].version);assert.ok(version>=180000&&version<190000,'Native grant qualification requires PostgreSQL 18');}
 await db.exec(`create role binso_runtime nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
 create table invoice_billing_scopes(id integer);alter table invoice_billing_scopes enable row level security;alter table invoice_billing_scopes force row level security;
 create table invoice_advance_allocations(id integer);alter table invoice_advance_allocations enable row level security;alter table invoice_advance_allocations force row level security;
 create view billing_scope_invoices with(security_invoker=true) as select * from invoice_billing_scopes;
 create view billing_scope_lines with(security_invoker=true) as select * from invoice_advance_allocations;
 create table unrelated_private_table(id integer);`);
 const sql=await fs.readFile('database/operations/grant-v8-billing-completion.sql','utf8');
 await db.exec(sql);await db.exec(sql); // Explicit retries are safe.
 for(const name of ['invoice_billing_scopes','invoice_advance_allocations'])for(const privilege of ['SELECT','INSERT','UPDATE','DELETE'])assert.equal((await db.query("select has_table_privilege('binso_runtime',$1,$2) allowed",[name,privilege])).rows[0].allowed,true);
 for(const name of ['billing_scope_invoices','billing_scope_lines'])assert.equal((await db.query("select has_table_privilege('binso_runtime',$1,'SELECT') allowed",[name])).rows[0].allowed,true);
 assert.equal((await db.query("select has_table_privilege('binso_runtime','unrelated_private_table','SELECT') allowed")).rows[0].allowed,false);
 assert.equal((await db.query("select rolsuper or rolbypassrls or rolcreatedb or rolcreaterole or rolreplication unsafe from pg_roles where rolname='binso_runtime'")).rows[0].unsafe,false);
 await db.exec('set role binso_runtime');
 assert.equal((await db.query('select * from invoice_billing_scopes')).rows.length,0,'Object access retains RLS denial without a tenant policy');
 await assert.rejects(()=>db.exec('insert into invoice_billing_scopes values(1)'),/row.level security/i);
 await db.exec('reset role');
 await db.exec('alter role binso_runtime bypassrls');
 await assert.rejects(()=>db.exec(sql),/Inspect the existing restricted runtime role/);await db.exec('rollback;alter role binso_runtime nobypassrls');
 console.log('Reviewed V8 runtime grants: exact object access, retry, unrelated-table denial, unchanged role flags and enforced RLS passed; unsafe role rejected.');
}finally{if(address)await connection.end();else await connection.close();}
