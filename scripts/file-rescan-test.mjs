import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {readPrivateManifest} from './private-manifest.mjs';
import {createHash} from 'node:crypto';
import {PGlite} from '@electric-sql/pglite';
import {rescanPendingFile} from '../lib/server/file-rescan.mjs';
import {scanBytes} from '../lib/server/clamav-protocol.mjs';

const privateDirectory=await fs.mkdtemp(path.join(os.tmpdir(),'binso-private-manifest-test-'));
try{
 const filename=path.join(privateDirectory,'manifest.json');
 await fs.writeFile(filename,JSON.stringify({selected:'original'}),{mode:0o600});
 if(process.platform==='win32'){
  await assert.rejects(readPrivateManifest(filename),/POSIX ownership checks/,'Unsupported permission semantics must fail closed, never trust Windows mode bits');
 }else{
 assert.deepEqual(await readPrivateManifest(filename),{selected:'original'});
 const symlink=path.join(privateDirectory,'link.json');await fs.symlink(filename,symlink);
 await assert.rejects(readPrivateManifest(symlink),'A final-component symlink must never be followed');
 await fs.chmod(filename,0o644);await assert.rejects(readPrivateManifest(filename),'Nonprivate manifests are rejected');await fs.chmod(filename,0o600);
 await assert.rejects(readPrivateManifest(privateDirectory),'A directory is not a manifest');
 const large=path.join(privateDirectory,'large.json');await fs.writeFile(large,Buffer.alloc(1024*1024+1),{mode:0o600});await assert.rejects(readPrivateManifest(large),'Bound file reads before allocation/parse');
 const originalOpen=fs.open;
 fs.open=async(...args)=>{const file=await originalOpen(...args);if(args[0]===filename){await fs.rename(filename,filename+'.old');await fs.writeFile(filename,JSON.stringify({selected:'replacement'}),{mode:0o600});}return file;};
 try{assert.deepEqual(await readPrivateManifest(filename),{selected:'original'},'Replacing the checked pathname cannot replace the opened manifest');}finally{fs.open=originalOpen;}
 }
}finally{await fs.rm(privateDirectory,{recursive:true,force:true});}
const db=new PGlite();
const organization='00000000-0000-4000-8000-000000000001',foreign='00000000-0000-4000-8000-000000000002';
const body=Buffer.from('Synthetic isolated rescan fixture\n'),hash=createHash('sha256').update(body).digest('hex');
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
try{
 await db.exec(`create role fixture_owner; create role fixture_runtime;
  grant usage,create on schema public to fixture_owner; set role fixture_owner;
  create table file_objects(id uuid primary key,organization_id uuid not null,sha256 text not null,size_bytes bigint not null,scan_status text not null);
  create table file_contents(file_id uuid primary key,organization_id uuid not null,body bytea not null);
  create table audit_events(organization_id uuid not null,actor_user_id text,actor_name text,action text,entity_type text,entity_id text,detail text);
  alter table file_objects enable row level security; alter table file_contents enable row level security; alter table audit_events enable row level security;
  create policy tenant on file_objects using(organization_id=current_setting('app.organization_id',true)::uuid);
  create policy tenant on file_contents using(organization_id=current_setting('app.organization_id',true)::uuid);
  create policy tenant on audit_events using(organization_id=current_setting('app.organization_id',true)::uuid);
  grant usage on schema public to fixture_runtime;
  grant select,update on file_objects,file_contents to fixture_runtime; grant select,insert on audit_events to fixture_runtime;`);
 await db.exec(await fs.readFile('database/migrations/0048_file_scan_evidence.sql','utf8'));
 await db.exec('reset role');
 for(let n=1;n<=8;n++){
  await db.query("insert into file_objects values($1,$2,$3,$4,'pending',null)",[id(n),n===8?foreign:organization,hash,body.length]);
  await db.query('insert into file_contents values($1,$2,$3)',[id(n),n===8?foreign:organization,n===4?Buffer.from('tampered'):body]);
 }
 const expected=n=>({id:id(n),organization_id:organization,sha256:hash,size_bytes:body.length});
 let calls=0;
 const fixtureScan=async bytes=>{calls++;assert.deepEqual(bytes,body);const now=new Date().toISOString();return {status:'clean',evidence:{engine:'ClamAV',engineVersion:'1.4.6',signaturesVersion:1,signaturesAt:now,sha256:hash,startedAt:now,completedAt:now}};};
 const scan=process.env.BINSO_REAL_SCANNER_SOCKET?bytes=>scanBytes(bytes,{socketPath:process.env.BINSO_REAL_SCANNER_SOCKET}):fixtureScan;
 const client={query:(...args)=>db.query(...args)};
 const rescan=(n,extra={})=>rescanPendingFile(client,{organization,expected:expected(n),scan,...extra});
 await db.exec('set role fixture_runtime');
 assert.equal(await rescan(1),'clean');
 assert.equal(await rescan(1),'skipped','Repeated apply never changes an already decided file');
 const rejected=async bytes=>({...await fixtureScan(bytes),status:'rejected'});
 assert.equal(await rescan(2,{scan:rejected}),'rejected');
 await assert.rejects(rescan(3,{expected:{...expected(3),sha256:'a'.repeat(64)}}),'Stale manifest cannot authorize changed bytes');
 await assert.rejects(rescan(4),'Stored body must match stored and manifest hashes');
 await assert.rejects(rescan(5,{scan:async()=>{throw Error('Synthetic scanner outage');}}));
 const faultClient={query:(sql,args)=>sql.startsWith('insert into audit_events')?Promise.reject(Error('Synthetic audit failure')):db.query(sql,args)};
 await assert.rejects(rescanPendingFile(faultClient,{organization,expected:expected(6),scan}));
 await assert.rejects(rescan(7,{scan:async bytes=>({...await fixtureScan(bytes),evidence:{... (await fixtureScan(bytes)).evidence,sha256:'a'.repeat(64)}})}));
 assert.equal(await rescan(8),'skipped','Foreign tenant bytes cannot be selected');
 await assert.rejects(rescan(8,{expected:{...expected(8),organization_id:foreign}}),'Manifest cannot change the authorized tenant');
 await db.exec('reset role');
 const rows=(await db.query('select id,scan_status,scan_evidence from file_objects order by id')).rows;
 assert.deepEqual(rows.map(row=>row.scan_status),['clean','rejected','pending','pending','pending','pending','pending','pending']);
 assert.equal(rows[0].scan_evidence.sha256,hash);assert.ok(rows.slice(2).every(row=>row.scan_evidence===null));
 assert.equal((await db.query('select count(*)::int n from audit_events')).rows[0].n,2,'Audit failure rolls status and proof back together');
 assert.deepEqual(Buffer.from((await db.query('select body from file_contents where file_id=$1',[id(1)])).rows[0].body),body,'Rescan never rewrites file contents');
 if(!process.env.BINSO_REAL_SCANNER_SOCKET)assert.equal(calls,5,'Integrity failures do not send mismatched bytes to the scanner');
 console.log('Isolated rescan: tenant isolation, hash-bound selection, rejection, retry, scanner outage and atomic audit rollback passed.');
}finally{await db.close();}
