import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {validateEvidenceRun} from './evidence-run.mjs';
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'binso-acceptance-'));
const script=fileURLToPath(new URL('./production-acceptance.mjs',import.meta.url)),source='a'.repeat(40);
try{
 const runIdentity={head_sha:source,head_branch:'main',status:'completed',conclusion:'success'};
 validateEvidenceRun(runIdentity,source);
 for(const change of [{head_sha:'b'.repeat(40)},{head_branch:'untrusted-pr'},{status:'in_progress'},{conclusion:'failure'}])assert.throws(()=>validateEvidenceRun({...runIdentity,...change},source));
 const original=JSON.parse(await fs.readFile('docs/operations/production-acceptance.json','utf8'));
 await fs.mkdir(path.join(directory,'docs/operations'),{recursive:true});await fs.mkdir(path.join(directory,'docs/evidence/production'),{recursive:true});
 const bytes='Synthetic acceptance fixture; never a live approval.';await fs.writeFile(path.join(directory,'docs/evidence/production/fixture.txt'),bytes);
 const run=async register=>{await fs.writeFile(path.join(directory,'docs/operations/production-acceptance.json'),JSON.stringify(register));return spawnSync(process.execPath,[script,'--production'],{cwd:directory,env:{...process.env,BINSO_BUILD_SHA:source},encoding:'utf8'});};
 assert.notEqual((await run(original)).status,0);
 const complete=structuredClone(original);complete.productionAcceptance=true;
 for(const r of complete.requirements)r.evidence={sourceSha:source,reviewer:'synthetic fixture',verifiedAt:new Date().toISOString(),path:'docs/evidence/production/fixture.txt',sha256:createHash('sha256').update(bytes).digest('hex')};
 assert.equal((await run(complete)).status,0,'Only fully verified synthetic fixture may pass in this isolated test');
 for(const mutate of [r=>r.requirements.pop(),r=>r.requirements[0].evidence.sourceSha='b'.repeat(40),r=>r.requirements[0].evidence.path='../fixture.txt',r=>r.requirements[0].evidence.sha256='f'.repeat(64),r=>r.requirements[0].evidence.verifiedAt='2999-01-01',r=>r.requirements[0].evidence.reviewer='']){
  const changed=structuredClone(complete);mutate(changed);assert.notEqual((await run(changed)).status,0);
 }
 console.log('Production acceptance blocks missing/removed requirements, wrong SHA, traversal, altered evidence, future dates and absent reviewer.');
}finally{await fs.rm(directory,{recursive:true,force:true});}
