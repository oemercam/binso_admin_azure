import {pixelDifference} from './visual.mjs';
import assert from 'node:assert/strict';
import './authority-test.mjs';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {aggregate,collectEvidence,matchRoute} from './report.mjs';
import {readScope,validateScope,developmentDecision} from './release-scope.mjs';
const scope=readScope();
const releaseFixture={failures:[],rejectedEvidence:[],coverage:[...scope.requiredStaticChecks.map(id=>({id,status:'passed',checks:[]})),{id:'UX-LAY-003',status:'partial',checks:scope.requiredEngines.map(engine=>({engine,status:'passed'}))}],routes:[{route:'/dashboard',runtimeEvidence:scope.requiredEngines.flatMap(engine=>scope.requiredFixtureStates.map(state=>({engine,state})))},{route:'/dev/ux-lab',runtimeEvidence:[]},{route:'/operator/wallboard',runtimeEvidence:[]}]};
assert.equal(developmentDecision(releaseFixture,scope).ready,true,'The explicitly limited scope does not claim complete acceptance');
assert.equal(developmentDecision(releaseFixture,scope).productionAcceptance,false);
for(const mutate of [x=>x.failures.push({id:'UX-LAY-003'}),x=>x.rejectedEvidence.push({reason:'stale'}),x=>x.coverage[0].status='not-tested',x=>x.coverage.at(-1).checks.pop(),x=>x.routes.push({route:'/kunden',runtimeEvidence:[]}),x=>x.routes[0].runtimeEvidence=x.routes[0].runtimeEvidence.filter(e=>e.state!=='employee')]){const broken=structuredClone(releaseFixture);mutate(broken);assert.equal(developmentDecision(broken,scope).ready,false,'Missing evidence and measured regressions remain blocking in development');}
for(const mutate of [x=>x.productionAcceptance=true,x=>x.requiredStaticChecks=[],x=>x.excludedRuntimeRoutes.push({route:'/kunden'}),x=>x.authorization.quote='unapproved',x=>x.additionalRecurringCost=74]){const broken=structuredClone(scope);mutate(broken);assert.throws(()=>validateScope(broken),'Scope broadening and forged authorization cannot pass');}
const r=[{id:'UX-X',method:'browser'},{id:'UX-Y',method:'browser'},{id:'UX-Z',method:'physical'}];
assert.equal(aggregate(r,[])[0].status,'not-tested');assert.equal(aggregate(r,[])[2].status,'manual-required');
assert.equal(aggregate(r,[{checks:[{id:'UX-X',status:'passed'}]}])[0].status,'partial','A sampled pass cannot prove full compliance');
assert.equal(aggregate([{id:'UX-X',method:'browser',expectedCases:[{route:'/kunden',engine:'chromium',width:390,state:'normal',theme:'light'}]}],[{route:'/kunden',engine:'chromium',width:390,state:'normal',theme:'light',checks:[{id:'UX-X',status:'passed'}]}])[0].status,'passed');
assert.equal(aggregate([{id:'UX-X',method:'physical'}],[{checks:[{id:'UX-X',status:'passed',reviewer:'UX owner',approvalReference:'Device-recording',device:{physical:false,installedPwa:true}}]}])[0].status,'partial','Desktop emulation cannot satisfy physical-device approval');
assert.equal(aggregate(r,[{checks:[{id:'UX-X',status:'passed'},{id:'UX-X',status:'failed'}]}])[0].status,'failed');
// Reviewed samples cannot stand in for missing route, role, viewport or device cases.
for(const method of ['review','physical']){
 const target={route:'/kunden',engine:'webkit',width:390,state:'normal',theme:'light',role:'owner',platform:'ios'};
 const requirement={id:'UX-REVIEW',method,expectedCases:[target,{...target,width:1440}]};
 const proof=(overrides={})=>({...target,checks:[{id:'UX-REVIEW',status:'passed',reviewer:'fixture reviewer',approvalReference:'fixture approval',device:{physical:true,installedPwa:true},...overrides}]});
 const status=(requirements,evidence)=>aggregate([requirements],evidence)[0].status;
 assert.equal(status(requirement,[proof()]),'partial','A missing expected viewport remains open');
 const complete=[proof(),{...proof(),width:1440}];
 assert.equal(status(requirement,complete),'passed','Every expected case has individual approved evidence');
 assert.equal(status({...requirement,expectedCases:[]},complete),'partial','Undefined acceptance scope cannot pass');
 assert.equal(status({...requirement,expectedCases:[{}]},complete),'partial','An empty target cannot match arbitrary evidence');
 assert.equal(status({...requirement,expectedCases:[{...target,language:'de-CH'}]},complete),'partial','An additional expected dimension cannot be silently ignored');
 for(const key of ['route','engine','width','state','theme','role','platform']){
  const wrong=structuredClone(complete);wrong[0][key]=key==='width'?375:'different';
  assert.equal(status(requirement,wrong),'partial','A missing '+key+' case remains open');
 }
 for(const override of [{reviewer:undefined},{approvalReference:undefined},...(method==='physical'?[{device:{physical:false,installedPwa:true}},{device:{physical:true,installedPwa:false}}]:[])]){
  assert.equal(status(requirement,[proof(override),complete[1]]),'partial','Approval and physical-device proof cannot be substituted');
 }
 assert.equal(status(requirement,[proof({status:'failed'}),complete[1]]),'failed','A failed case dominates complete coverage');
}
assert.ok(matchRoute('/kunden/[id]','/kunden/customer-one'));assert.ok(!matchRoute('/kunden/[id]','/kunden/customer-one/bearbeiten'));
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'binso-compliance-test-'));
try{fs.writeFileSync(path.join(dir,'compliance-stale.json'),JSON.stringify({schemaVersion:1,sourceDigest:'old',registryVersion:'1.0.0',checks:[{id:'UX-X',status:'passed'}]}));assert.equal(collectEvidence([dir],{sourceDigest:'new',registryVersion:'1.0.0'}).accepted.length,0);assert.equal(collectEvidence([dir],{sourceDigest:'new',registryVersion:'1.0.0'}).rejected.length,1);}finally{fs.rmSync(dir,{recursive:true,force:true});}
// Actual binary image comparator: dimensions and changed pixels, not a mirror of control flow.
const imageDir=fs.mkdtempSync(path.join(os.tmpdir(),'binso-visual-test-'));
try{
 const {createRequire}=await import('node:module');const req=createRequire(import.meta.url);const sharp=req(req.resolve('sharp',{paths:[req.resolve('next')]}));
 const a=path.join(imageDir,'a.png'),b=path.join(imageDir,'b.png');
 await sharp({create:{width:4,height:4,channels:4,background:'#ffffff'}}).png().toFile(a);
 await sharp({create:{width:4,height:4,channels:4,background:'#000000'}}).png().toFile(b);
 assert.equal((await pixelDifference(a,a)).changedPixels,0);assert.equal((await pixelDifference(a,b)).changedPixels,16);
}finally{fs.rmSync(imageDir,{recursive:true,force:true});}
console.log('Stale evidence rejected, failures dominate, sampled pass stays partial, absent/physical evidence cannot pass.');

// Real Git index regression: thousands of generated evidence paths must not
// overflow identity collection or alter the binding to actual source bytes.
const identityDir=fs.mkdtempSync(path.join(os.tmpdir(),'binso-identity-test-'));
assert(identityDir.startsWith(path.resolve(os.tmpdir())+path.sep));
const identityModule=pathToFileURL(path.resolve('scripts/compliance/identity.mjs')).href;
const git=(...args)=>execFileSync('git',args,{cwd:identityDir,encoding:'utf8',maxBuffer:4*1024*1024});
const readIdentity=()=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {identity} from ${JSON.stringify(identityModule)};console.log(JSON.stringify(identity()))`],{cwd:identityDir,encoding:'utf8'}));
try{
 git('init','-q');fs.mkdirSync(path.join(identityDir,'app'));fs.writeFileSync(path.join(identityDir,'app/page.tsx'),'source fixture');fs.writeFileSync(path.join(identityDir,'package.json'),'{}');fs.mkdirSync(path.join(identityDir,'ux-compliance'));fs.writeFileSync(path.join(identityDir,'ux-compliance/requirements.v1.json'),JSON.stringify({version:'9.9.9'}));git('add','app','package.json','ux-compliance/requirements.v1.json');
 const blob=execFileSync('git',['hash-object','-w','--stdin'],{cwd:identityDir,input:'synthetic evidence',encoding:'utf8'}).trim();
 const index=Array.from({length:8000},(_,i)=>`100644 ${blob}\tevidence/${String(i).padStart(5,'0')}-${'x'.repeat(150)}.json\n`).join('');
 execFileSync('git',['update-index','--index-info'],{cwd:identityDir,input:index});
 git('-c','user.name=Isolated Fixture','-c','user.email=fixture@example.invalid','commit','-q','-m','Synthetic identity fixture');
 assert(Buffer.byteLength(git('ls-files','-z'))>1024*1024,'Exercise the original child-process buffer boundary');
 const expected=createHash('sha256').update('BINSO-evidence-source-v2\0');for(const file of ['app/page.tsx','package.json','ux-compliance/requirements.v1.json'])expected.update(file+'\0').update(fs.readFileSync(path.join(identityDir,file)));
 const initial=readIdentity();assert.equal(initial.sourceDigest,expected.digest('hex'),'Evidence paths do not change the source digest');assert.equal(initial.registryVersion,'9.9.9');
 fs.mkdirSync(path.join(identityDir,'evidence'));fs.writeFileSync(path.join(identityDir,'evidence/untracked.json'),'new generated result');assert.equal(readIdentity().sourceDigest,initial.sourceDigest);
 fs.writeFileSync(path.join(identityDir,'app/page.tsx'),'changed source fixture');assert.notEqual(readIdentity().sourceDigest,initial.sourceDigest,'Source edits remain bound');
 for(const file of ['database/migrations/new.sql','database/operations/rights.sql','patches/fixture.patch','.github/workflows/quality.yml','pnpm-workspace.yaml','tsconfig.json','proxy.ts','AGENTS.md']){
  const previous=readIdentity().sourceDigest;fs.mkdirSync(path.dirname(path.join(identityDir,file)),{recursive:true});fs.writeFileSync(path.join(identityDir,file),'first critical source');const first=readIdentity().sourceDigest;
  assert.notEqual(first,previous,'Actual Git collection binds a new critical input: '+file);fs.writeFileSync(path.join(identityDir,file),'changed critical source');const changed=readIdentity().sourceDigest;assert.notEqual(changed,first,'Actual critical file mutation invalidates evidence: '+file);git('add',file);assert.equal(readIdentity().sourceDigest,changed,'Staging cannot hide or change source identity: '+file);
 }
 const beforeRegistry=readIdentity();fs.writeFileSync(path.join(identityDir,'ux-compliance/requirements.v1.json'),JSON.stringify({version:'9.9.10'}));const afterRegistry=readIdentity();assert.equal(afterRegistry.registryVersion,'9.9.10');assert.notEqual(afterRegistry.sourceDigest,beforeRegistry.sourceDigest,'A changed visual contract invalidates older evidence');
 fs.mkdirSync(path.join(identityDir,'components'));fs.writeFileSync(path.join(identityDir,'components/new.tsx'),'untracked source fixture');const untracked=readIdentity().sourceDigest;git('add','components/new.tsx');assert.equal(readIdentity().sourceDigest,untracked,'Untracked source is included before staging');
 fs.mkdirSync(path.join(identityDir,'docs/audit/v24'),{recursive:true});const beforeContract=readIdentity().sourceDigest;
 fs.writeFileSync(path.join(identityDir,'docs/audit/v24/ux-contract.json'),'{}');assert.notEqual(readIdentity().sourceDigest,beforeContract,'Active presentation contracts invalidate old measurements');
 const beforeConfig=readIdentity().sourceDigest;fs.mkdirSync(path.join(identityDir,'config'));fs.writeFileSync(path.join(identityDir,'config/domain.ts'),'export const role="owner"');assert.notEqual(readIdentity().sourceDigest,beforeConfig,'Domain configuration is part of source identity');
 fs.mkdirSync(path.join(identityDir,'docs/audit/v25-revision7'),{recursive:true});
 const beforeAuthority=readIdentity().sourceDigest;
 for(const file of ['source.md','requirements.json'])fs.copyFileSync(path.resolve('docs/audit/v25-revision7',file),path.join(identityDir,'docs/audit/v25-revision7',file));
 assert.notEqual(readIdentity().sourceDigest,beforeAuthority,'Current Revision7 source and normative register are bound');
 const copyPath=path.join(identityDir,'docs/audit/v25-revision7/requirements.json'),copy=JSON.parse(fs.readFileSync(copyPath,'utf8')),beforeResult=readIdentity().sourceDigest;
 copy.requirements[0].status='passed';copy.requirements[0].test='Synthetic result prose, not a review';fs.writeFileSync(copyPath,JSON.stringify(copy));
 assert.equal(readIdentity().sourceDigest,beforeResult,'Recording result prose cannot invalidate unchanged executable or normative requirements');
 copy.requirements[0].priority='P1';fs.writeFileSync(copyPath,JSON.stringify(copy));assert.throws(readIdentity,'A priority differing from the binding original cannot supply valid evidence');
 copy.requirements[0].requirement='Tampered source clause';fs.writeFileSync(copyPath,JSON.stringify(copy));assert.throws(readIdentity,'A substituted clause must block, never fall back to old evidence');
 fs.copyFileSync(path.resolve('docs/audit/v25-revision7/requirements.json'),copyPath);
 fs.appendFileSync(path.join(identityDir,'docs/audit/v25-revision7/source.md'),'\nUnapproved source drift');assert.throws(readIdentity,'Source drift without a matching register blocks');
 console.log('Source identity handles >1 MiB of generated Git paths while retaining tracked/untracked source and Revision7 source/register binding.');
}finally{fs.rmSync(identityDir,{recursive:true,force:true});}
