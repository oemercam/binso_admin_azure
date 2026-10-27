import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {PGlite} from '@electric-sql/pglite';
import {verifyMonitoringContract} from './monitoring-contract-test.mjs';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'binso-readiness-'));
const db=new PGlite();
try {
 await verifyMonitoringContract();
 await db.exec('create role schema_owner; create role runtime_probe; create role dangerous bypassrls; create table isolation_probe(id integer); alter table isolation_probe owner to schema_owner;');
 const sql=await fs.readFile('scripts/sql/runtime-role-check.sql','utf8');
 await db.exec('set role runtime_probe');await db.exec(sql);await db.exec('reset role');
 // BYPASSRLS is rejected even without table access.
 await db.exec('set role dangerous');await assert.rejects(()=>db.exec(sql),/administrative\/RLS-bypass/);await db.exec('rollback; reset role');
 // Membership permits SET ROLE, even when inheritance is disabled.
 await db.exec('grant dangerous to runtime_probe; set role runtime_probe');
 await assert.rejects(()=>db.exec(sql),/administrative\/RLS-bypass/);await db.exec('rollback; reset role; revoke dangerous from runtime_probe');
 await db.exec('grant schema_owner to runtime_probe; set role runtime_probe');
 await assert.rejects(()=>db.exec(sql),/ownership/);await db.exec('rollback; reset role; revoke schema_owner from runtime_probe');
 await db.exec('grant create on schema public to runtime_probe; set role runtime_probe');
 await assert.rejects(()=>db.exec(sql),/public-schema/);await db.exec('rollback; reset role; revoke create on schema public from runtime_probe');
 const fixture=path.join(temp,'auth.json');
 const config={properties:{platform:{enabled:true},identityProviders:{azureActiveDirectory:{enabled:true,registration:{clientId:'test-app',openIdIssuer:'https://login.microsoftonline.com/test-tenant/v2.0'}}}}};
 const auth=()=>spawnSync(process.execPath,['scripts/azure-auth-check.mjs',fixture],{env:{...process.env,AUDIT_ENTRA_TENANT_ID:'test-tenant'},encoding:'utf8'});
 await fs.writeFile(fixture,JSON.stringify(config));assert.equal(auth().status,0);
 config.properties.identityProviders.azureActiveDirectory.registration.openIdIssuer='https://login.microsoftonline.com/foreign-tenant/v2.0';
 await fs.writeFile(fixture,JSON.stringify(config));assert.notEqual(auth().status,0);
 await fs.writeFile(fixture,JSON.stringify({properties:null}));assert.notEqual(auth().status,0);
 // Execute the real Bash entry point and both real Node CLIs. Only Azure GETs
 // are replaced by a temporary preload peer; no cloud call can escape the peer.
 const peer=path.join(temp,'monitor-cli-peer.mjs');
 await fs.writeFile(peer,String.raw`
import fs from 'node:fs';
import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
const r=JSON.parse(process.env.MONITOR_FIXTURE_RESOURCES);
const data={
 [r.app]:{id:r.app,properties:{state:'Running'}},
 [r.insights]:{id:r.insights,tags:{['hidden-link:'+r.app]:'Resource'},properties:{WorkspaceResourceId:'fixture-workspace'}},
 [r.alert]:{id:r.alert,properties:{enabled:true,scopes:[r.app],criteria:{allOf:[{metricName:'Http5xx',metricNamespace:'Microsoft.Web/sites',operator:'GreaterThan',threshold:0,timeAggregation:'Total'}]},actions:[{actionGroupId:r.actionGroup}]}},
 [r.actionGroup]:{id:r.actionGroup,properties:{enabled:true,armRoleReceivers:[{name:'fixture'}]}}
};
if(process.env.CASE==='missing')data[r.insights]=null;
if(process.env.CASE==='wrong_scope')data[r.alert].properties.scopes=['foreign-app'];
if(process.env.CASE==='missing_link')data[r.insights].tags={};
if(process.env.CASE==='bad_criteria')data[r.alert].properties.criteria.allOf[0].metricName='Requests';
if(process.env.CASE==='no_receivers')data[r.actionGroup].properties.armRoleReceivers=[];
childProcess.execFileSync=(command,args)=>{
 assert.equal(command,'az');
 if(process.env.DENIED==='yes')throw Error('fixture access denied');
 let id;
 if(args[0]==='resource'&&args[1]==='show'){
  id=args[args.indexOf('--ids')+1];
  assert.equal(args[args.indexOf('--subscription')+1],id.split('/')[2]);
 }else{
  assert.equal(args[0],'rest');assert.equal(args[args.indexOf('--method')+1],'get');
  const url=new URL(args[args.indexOf('--url')+1]);assert.equal(url.hostname,'management.azure.com');id=decodeURIComponent(url.pathname);
 }
 assert(Object.values(r).includes(id),'Only canonical resource GETs are permitted');
 fs.appendFileSync(process.env.MONITOR_FIXTURE_CALLS,JSON.stringify({script:process.argv[1],id})+'\n');
 return process.env.CASE==='invalid_json'?'{broken':JSON.stringify(data[id]??null);
};
syncBuiltinESMExports();
`);
 const harness=path.join(temp,'monitor-fixture.sh');
 await fs.writeFile(harness,'#!/usr/bin/env bash\nset -euo pipefail\naz() { echo "Unexpected direct Azure command" >&2; return 9; }\nnode() { command node --import "$MONITOR_FIXTURE_IMPORT" "$@"; }\nsource "$1"\n');
 const bash=process.platform==='win32'?path.resolve(process.env.GIT_EXEC_PATH??'', '../../../bin/bash.exe'):'bash';
 if(process.platform==='win32')await fs.access(bash);
 const shellPath=file=>process.platform==='win32'?file.replace(/\\/g,'/').replace(/^([A-Za-z]):/,(_,drive)=>'/'+drive.toLowerCase()):file;
 const resourceFixture=JSON.parse(await fs.readFile('.github/model-a/readiness-resources.json','utf8'));
 let monitorIndex=0;
 const monitor=extra=>{
  const calls=path.join(temp,'calls-'+(++monitorIndex)+'.jsonl');
  return {...spawnSync(bash,[shellPath(harness),shellPath(path.resolve('scripts/production-monitoring-check.sh'))],{env:{...process.env,...extra,MONITOR_FIXTURE_IMPORT:pathToFileURL(peer).href,MONITOR_FIXTURE_RESOURCES:JSON.stringify(resourceFixture),MONITOR_FIXTURE_CALLS:calls},encoding:'utf8'}),calls};
 };
 const valid=monitor({});assert.equal(valid.status,0,valid.error?.message??valid.stderr);
 const calls=(await fs.readFile(valid.calls,'utf8')).trim().split('\n').map(line=>JSON.parse(line));
 for(const script of ['azure-readiness-check.mjs','production-monitoring-check.mjs']){
  const targets=calls.filter(call=>call.script.endsWith(script)).map(call=>call.id).sort();
  assert.deepEqual(targets,[resourceFixture.app,resourceFixture.insights,resourceFixture.alert,resourceFixture.actionGroup].sort(),'Both independent monitoring contracts must execute across the exact subscription boundary');
 }
 for(const extra of [{DENIED:'yes'},...['missing','wrong_scope','missing_link','bad_criteria','no_receivers','invalid_json'].map(CASE=>({CASE}))]){const result=monitor(extra);assert.equal(result.error,undefined);assert.notEqual(result.status,0,'Real monitoring CLI must reject '+JSON.stringify(extra));}
 console.log('Runtime role, inherited bypass/ownership, public-schema creation denial, pinned Azure issuer and real Bash monitoring failure gates passed.');
} finally {await db.close();await fs.rm(temp,{recursive:true,force:true});}
