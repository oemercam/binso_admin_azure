import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PGlite} from '@electric-sql/pglite';
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'binso-readiness-'));
const db=new PGlite();
try {
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
 // Execute the actual Bash script with a shell-function peer. This avoids a
 // Python dependency and platform-specific PATH joining while retaining exact
 // argument/quoting and denial checks. No Azure CLI is invoked.
 const harness=path.join(temp,'monitor-fixture.sh');
 await fs.writeFile(harness,`#!/usr/bin/env bash
set -euo pipefail
az() {
 [ "\${DENIED:-no}" != yes ] || return 3
 local query='' next=no arg
 for arg in "$@"; do
  if [ "$next" = yes ]; then query="$arg"; break; fi
  if [ "$arg" = --query ]; then next=yes; fi
 done
 case "$query" in
  'length(@)'|'length([?enabled==\u0060true\u0060])') printf '%s\\n' "\${COUNT:-1}" ;;
  id) printf '%s\\n' '/test/app' ;;
  *) return 5 ;;
 esac
}
source "$1"
`);
 const bash=process.platform==='win32'?path.resolve(process.env.GIT_EXEC_PATH??'', '../../../bin/bash.exe'):'bash';
 if(process.platform==='win32')await fs.access(bash);
 const shellPath=file=>process.platform==='win32'?file.replace(/\\/g,'/').replace(/^([A-Za-z]):/,(_,drive)=>'/'+drive.toLowerCase()):file;
 const monitor=extra=>spawnSync(bash,[shellPath(harness),shellPath(path.resolve('scripts/production-monitoring-check.sh'))],{env:{...process.env,...extra},encoding:'utf8'});
 const valid=monitor({});assert.equal(valid.status,0,valid.error?.message??valid.stderr);
 for(const extra of [{DENIED:'yes'},{COUNT:'0'},{COUNT:'garbage'}]){const result=monitor(extra);assert.equal(result.error,undefined);assert.notEqual(result.status,0);}
 console.log('Runtime role, inherited bypass/ownership, public-schema creation denial, pinned Azure issuer and real Bash monitoring failure gates passed.');
} finally {await db.close();await fs.rm(temp,{recursive:true,force:true});}
