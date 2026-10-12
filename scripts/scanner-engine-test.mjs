import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {writeTestOutput} from './test-output.mjs';
import {execFileSync,spawn} from 'node:child_process';
import {scanBytes,scannerVersion} from '../lib/server/clamav-protocol.mjs';
import {startScannerBridge} from './scanner-bridge.mjs';

const socketPath='/tmp/binso-scanner/clamd.sock',container=process.env.BINSO_SCANNER_TEST_CONTAINER;
assert.ok(container,'Explicit isolated scanner container required');
const report={qualified:false,engine:null,cases:[],baseImage:process.env.BINSO_SCANNER_BASE_IMAGE??null};
const close=await startScannerBridge();
try{
 for(let attempt=0;;attempt++){
  try{report.engine=await scannerVersion({socketPath,deadline:Date.now()+1000});break;}
  catch{if(attempt>=300)throw Error('Patched engine with current signatures did not become ready');await new Promise(resolve=>setTimeout(resolve,1000));}
 }
 const environment=execFileSync('docker',['exec',container,'sh','-c',"tr '\\0' '\\n' < /proc/1/environ"],{encoding:'utf8'});
 assert.ok(!environment.includes('BINSO_CREDENTIAL_SENTINEL'),'Scanner service must not inherit application credentials');
 const clean=Buffer.from('Binso synthetic clean scanner qualification file\n');
 const accepted=await scanBytes(clean,{socketPath});assert.equal(accepted.status,'clean');assert.match(accepted.evidence.sha256,/^[0-9a-f]{64}$/);report.cases.push('clean bytes with engine/signature/hash provenance');
 // Standard harmless antivirus detection test string, never a real malicious file.
 const eicar=Buffer.from('WDVPIVAlQEFQWzRcUFpYNTQoUF4pN0NDKTd9JEVJQ0FSLVNUQU5EQVJELUFOVElWSVJVUy1URVNULUZJTEUhJEgrSCo=','base64');
 assert.equal((await scanBytes(eicar,{socketPath})).status,'rejected');report.cases.push('official antivirus test signature rejected');
 const archive=execFileSync('python3',['-c',"import io,sys,zipfile; b=io.BytesIO(); z=zipfile.ZipFile(b,'w',zipfile.ZIP_DEFLATED); z.writestr('synthetic-limit.txt',b'A'*(30*1024*1024)); z.close(); sys.stdout.buffer.write(b.getvalue())"]);
 assert.equal((await scanBytes(archive,{socketPath})).status,'rejected','Exceeded extraction/aggregate limit cannot return clean');report.cases.push('archive scan limit fails closed');
 const parallel=await Promise.all([clean,Buffer.from('another synthetic clean file')].map(body=>scanBytes(body,{socketPath})));assert.ok(parallel.every(result=>result.status==='clean'));report.cases.push('parallel exact-byte scans');
 for(const script of ['scripts/auth-integrity-test.mjs','scripts/file-rescan-test.mjs'])await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[script],{env:{...process.env,BINSO_REAL_SCANNER_SOCKET:socketPath},stdio:'inherit'});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('Real upload handler / database / engine integration failed')));});report.cases.push('actual upload handler, byte-bound DB provenance and harmless signature rejection');
 execFileSync('docker',['stop',container],{stdio:'ignore'});
 await assert.rejects(scanBytes(clean,{socketPath,timeoutMs:1000}));report.cases.push('engine outage does not release bytes');
 execFileSync('docker',['start',container],{stdio:'ignore'});
 for(let attempt=0;;attempt++){
  try{assert.equal((await scanBytes(clean,{socketPath})).status,'clean');break;}
  catch{if(attempt>=300)throw Error('Engine did not recover after restart');await new Promise(resolve=>setTimeout(resolve,1000));}
 }
 const state=JSON.parse(execFileSync('docker',['inspect',container,'--format','{{json .State}}'],{encoding:'utf8'}));assert.equal(state.OOMKilled,false);report.cases.push('restart recovery within configured memory limit');
 report.qualified=true;console.log('REAL CLAMAV QUALIFICATION PASSED',report);
}finally{
 await close();
 const configured=process.env.BINSO_SCANNER_OUTPUT;
 const output=configured??await fs.mkdtemp(path.join(os.tmpdir(),'binso-scanner-qualification-'));
 if(configured)await fs.mkdir(output,{mode:0o700});
 await writeTestOutput(path.join(output,'results.json'),JSON.stringify(report,null,2)+'\n');
}
