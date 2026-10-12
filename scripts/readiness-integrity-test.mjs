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
 // Exercise actual Bash quoting and fail-closed handling against a bounded CLI peer.
 const az=path.join(temp,'az');
 await fs.writeFile(az,`#!/usr/bin/env python3
import sys,os
args=sys.argv[1:]
if os.getenv('DENIED')=='yes': sys.exit(3)
if '--query' not in args: sys.exit(4)
q=args[args.index('--query')+1]
if q not in ['length(@)','length([?enabled==\u0060true\u0060])','id']: sys.exit(5)
print('/test/app' if q=='id' else os.getenv('COUNT','1'))
`,{mode:0o755});
 const monitor=extra=>spawnSync('bash',['scripts/production-monitoring-check.sh'],{env:{...process.env,PATH:temp+':'+process.env.PATH,...extra},encoding:'utf8'});
 assert.equal(monitor({}).status,0);
 assert.notEqual(monitor({DENIED:'yes'}).status,0);
 assert.notEqual(monitor({COUNT:'0'}).status,0);
 assert.notEqual(monitor({COUNT:'garbage'}).status,0);
 console.log('Runtime role, inherited bypass/ownership, public-schema creation denial, pinned Azure issuer and real Bash monitoring failure gates passed.');
} finally {await db.close();await fs.rm(temp,{recursive:true,force:true});}
