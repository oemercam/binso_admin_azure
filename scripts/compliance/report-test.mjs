import {pixelDifference} from './visual.mjs';
import assert from 'node:assert/strict';
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
