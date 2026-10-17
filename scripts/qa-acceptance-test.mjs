import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {qaAcceptance} from './qa-acceptance.mjs';
import {planChanges} from './qa-plan.mjs';
assert.deepEqual(qaAcceptance({event:'workflow_dispatch',level:'full'}),{release:true,deployment:false},'Production default remains strict');
assert.deepEqual(qaAcceptance({event:'workflow_dispatch',level:'full',profile:'development'}),{release:false,deployment:true},'Explicit development choice still enforces deployment evidence');
assert.equal(qaAcceptance({event:'release',profile:'development'}).release,true,'Published releases cannot opt out of production acceptance');
assert.equal(qaAcceptance({event:'push',ref:'refs/heads/main'}).deployment,true);
assert.equal(qaAcceptance({event:'pull_request',plannedLevel:'full',browser:true}).deployment,true);
assert.throws(()=>qaAcceptance({profile:'unknown'}));
const main={event:'push',ref:'refs/heads/main',plannedLevel:'standard',browser:false};
const docs=['docs/architecture/v21-5-routes.md'];
const plan=planChanges(docs);
assert.deepEqual(qaAcceptance({...main,plannedLevel:plan.level,browser:plan.routes.length>0,files:plan.files}),{release:false,deployment:false},'PR #265 reproduction: prose-only main push keeps static gates without demanding absent browser evidence');
for(const files of [[],undefined,['components/ui.tsx'],[...docs,'lib/server/auth.ts'],['.github/workflows/quality.yml'],['docs/architecture/reference-foundation.md'],['docs/audit/v24/reference/IMPLEMENTIERUNG.md'],['docs/product-config.json'],['docs/product.js']]){
 assert.equal(qaAcceptance({...main,files}).deployment,true,'Unproven or non-prose browser skips retain deployment gate: '+JSON.stringify(files));
}
for(const override of [{plannedLevel:'full'},{plannedLevel:undefined},{browser:true},{browser:undefined}])assert.equal(qaAcceptance({...main,files:docs,...override}).deployment,true,'Only an explicit standard documentation plan is exempt');
assert.equal(qaAcceptance({...main,event:'release',files:docs}).release,true);
for(const profile of ['production','development']){
 const decision=qaAcceptance({...main,event:'workflow_dispatch',level:'full',profile,files:docs});
 assert.ok(decision.release||decision.deployment,'Forced full acceptance cannot inherit documentation exemption');
}
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'binso-qa-plan-'));
try{
 const output=path.join(temp,'output');
 execFileSync(process.execPath,['scripts/qa-plan.mjs','--files',docs.join(',')],{env:{...process.env,GITHUB_OUTPUT:output}});
 const entries=Object.fromEntries(fs.readFileSync(output,'utf8').trim().split('\n').map(line=>{const index=line.indexOf('=');return [line.slice(0,index),line.slice(index+1)];}));
 assert.equal(entries.browser,'false');
 assert.deepEqual(JSON.parse(entries.changed_files),docs,'Acceptance receives the actual planned file list across jobs');
 assert.equal(qaAcceptance({...main,files:JSON.parse(entries.changed_files)}).deployment,false);
}finally{fs.rmSync(temp,{recursive:true,force:true});}
const workflow=fs.readFileSync('.github/workflows/quality.yml','utf8');
assert.ok(workflow.includes("import {qaAcceptance} from './scripts/qa-acceptance.mjs'"),'Workflow executes the tested policy');
assert.ok(workflow.includes("FORCE_FULL: ${{ github.event_name == 'schedule' || github.event_name == 'release' || inputs.level == 'full' }}"),'Both profiles retain full test coverage');
assert.ok(workflow.includes('changed_files: ${{ steps.scope.outputs.changed_files }}')&&workflow.includes('QA_CHANGED_FILES: ${{ needs.plan.outputs.changed_files }}')&&workflow.includes("files:JSON.parse(process.env.QA_CHANGED_FILES||'[]')"),'Planner provenance reaches the tested acceptance policy');
assert.ok(workflow.includes('report.mjs --static --gate'),'Documentation skips never disable static compliance failures');
console.log('QA acceptance: full coverage preserved, strict production default, explicit development gate, profile mismatch and invalid profiles rejected.');
