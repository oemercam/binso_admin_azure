import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import pg from 'pg';
import {scanBytes} from '../lib/server/clamav-protocol.mjs';
import {rescanPendingFile} from '../lib/server/file-rescan.mjs';
import {readPrivateManifest} from './private-manifest.mjs';
if(typeof process.getuid!=='function')throw Error('Controlled rescan requires Linux/POSIX file ownership; no Windows permission fallback is allowed.');

// Operator-run only. Dry run creates a bounded, hash-bound manifest; apply never selects new files.
const option=name=>{const at=process.argv.indexOf(name);return at<0?undefined:process.argv[at+1];};
const organization=option('--organization'),manifestPath=option('--manifest'),apply=process.argv.includes('--apply');
assert.match(organization??'',/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,'Explicit organization UUID required');
assert.ok(manifestPath,'Explicit private manifest path required');
assert.ok(process.env.DATABASE_URL,'Restricted runtime connection required');
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:true},max:1,connectionTimeoutMillis:10000});
const report={selected:0,clean:0,rejected:0,skipped:0,failed:0,unattempted:0};
try{
 const role=(await pool.query('select current_user as role')).rows[0].role;
 assert.equal(role,'binso_runtime','Do not rescan with administrative or RLS-bypass credentials');
 const client=await pool.connect();
 try{
  if(!apply){
   await client.query('BEGIN READ ONLY');await client.query("select set_config('app.organization_id',$1,true)",[organization]);
   const files=(await client.query("select f.id,f.organization_id,f.sha256,f.size_bytes from file_objects f join file_contents b on b.file_id=f.id and b.organization_id=f.organization_id where f.organization_id=$1 and f.scan_status='pending' order by f.id limit 500",[organization])).rows;
   await client.query('ROLLBACK');
   const manifest={schemaVersion:1,organization,createdAt:new Date().toISOString(),files};
   await fs.writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n',{mode:0o600,flag:'wx'});
   console.log({operation:'rescan-dry-run',files:files.length,changes:0});
  }else{
   const manifest=await readPrivateManifest(manifestPath);
   assert.equal(manifest.schemaVersion,1);assert.equal(manifest.organization,organization);
   assert.ok(Array.isArray(manifest.files)&&manifest.files.length<=500);
   assert.equal(new Set(manifest.files.map(file=>file.id)).size,manifest.files.length,'Duplicate manifest file');
   assert.ok(process.env.FILE_SCAN_SOCKET?.startsWith('/'),'Local scanner required');
   report.selected=manifest.files.length;
   let consecutiveFailures=0;
   for(const expected of manifest.files){
    try{
     const status=await rescanPendingFile(client,{organization,expected,scan:body=>scanBytes(body,{socketPath:process.env.FILE_SCAN_SOCKET})});
     report[status]++;consecutiveFailures=0;
    }catch{report.failed++;consecutiveFailures++;console.error('One file remained quarantined; scanner or integrity verification failed.');
     if(consecutiveFailures>=3){report.unattempted=report.selected-report.clean-report.rejected-report.skipped-report.failed;break;}
    }
   }
   console.log({operation:'rescan-apply',...report});if(report.failed)process.exitCode=1;
  }
 }finally{client.release();}
}finally{await pool.end();}
