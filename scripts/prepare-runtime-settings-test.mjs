import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'binso-settings-'));
try{
 const output=path.join(directory,'settings.json');
 const run=extra=>spawnSync(process.execPath,['scripts/prepare-runtime-settings.mjs'],{env:{...process.env,BINSO_RUNTIME_URL:'postgres://runtime:synthetic@localhost/test?sslmode=verify-full',BINSO_SETTINGS_FILE:output,BINSO_APPROVE_SCANNER:'false',BINSO_QUALIFIED_SCANNER:'false',...extra},encoding:'utf8'});
 assert.equal(run({}).status,0);
 let settings=JSON.parse(await fs.readFile(output,'utf8'));assert.equal(settings.DATABASE_SSL_REJECT_UNAUTHORIZED,'true');assert.equal(settings.FILE_SCAN_SOCKET,'');
 assert.notEqual(run({BINSO_RUNTIME_URL:'postgres://runtime:synthetic@localhost/test?sslmode=no-verify'}).status,0);
 assert.notEqual(run({BINSO_QUALIFIED_SCANNER:'true'}).status,0);
 assert.equal(run({BINSO_QUALIFIED_SCANNER:'true',BINSO_APPROVE_SCANNER:'true'}).status,0);
 settings=JSON.parse(await fs.readFile(output,'utf8'));assert.equal(settings.BINSO_SCANNER_SIDECAR,'true');assert.equal(settings.FILE_SCAN_SOCKET,'/tmp/binso-scanner/clamd.sock');
 for(const ip of ['0.0.0.0','127.0.0.1','10.0.0.1/8','1.2.3.4;echo unsafe','::1'])assert.notEqual(spawnSync(process.execPath,['scripts/validate-runner-ip.mjs',ip]).status,0);
 assert.equal(spawnSync(process.execPath,['scripts/validate-runner-ip.mjs','203.0.113.5']).status,0);
 console.log('Runtime settings enforce effective verified TLS and explicit scanner activation; runner firewall rejects broad or injected ranges.');
}finally{await fs.rm(directory,{recursive:true,force:true});}
