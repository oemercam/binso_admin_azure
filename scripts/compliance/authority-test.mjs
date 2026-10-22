import assert from 'node:assert/strict';
import './identity-source-test.mjs';
import fs from 'node:fs';
import {revision7Authority,readRevision7Authority,partitionHistoricalRegistry,authorityPaths} from './authority.mjs';
import {aggregate,currentApprovalCoverage} from './report.mjs';

const source=fs.readFileSync(authorityPaths[0],'utf8'),register=JSON.parse(fs.readFileSync(authorityPaths[1],'utf8')),registry=JSON.parse(fs.readFileSync('ux-compliance/requirements.v1.json','utf8')),authority=readRevision7Authority();
assert.equal(authority.clauseCount,573);assert.equal(authority.chapters,56);
const partition=partitionHistoricalRegistry(registry);assert.equal(partition.technical.length,40);assert.equal(partition.historical.length,392);
assert.deepEqual(partition.technical,registry.requirements.filter(row=>row.id.startsWith('UX-')),'All existing technical contracts remain byte-for-byte objects');
const initial=currentApprovalCoverage(registry,authority,[]);
assert.equal(initial.coverage.length,613);assert.equal(initial.historicalTraceability.length,392);
assert.ok(initial.coverage.filter(row=>row.id.startsWith('R7-')).every(row=>row.status==='review-required'),'Generated inventory is not executed acceptance');
const forgedRegister=structuredClone(register);for(const row of forgedRegister.requirements){row.status='passed';row.test='Everything green';}
assert.ok(aggregate(revision7Authority(source,forgedRegister).requirements,[]).every(row=>row.status==='review-required'),'Register status prose cannot mint an approval');
for(const alter of [r=>r.sourceSha256='0'.repeat(64),r=>r.requirements.pop(),r=>r.requirements[1].id=r.requirements[0].id,r=>r.requirements[0].requirement='Substituted clause',r=>r.requirements[0].sourceTextSha256='0'.repeat(64),r=>r.requirements[0].chapter=55]){
 const invalid=structuredClone(register);alter(invalid);assert.throws(()=>revision7Authority(source,invalid),'Stale, missing, duplicate or substituted source clauses block');
}
const repeated=structuredClone(register),replacedId=repeated.requirements[1].id;
repeated.requirements[1]={...repeated.requirements[0],id:replacedId};
assert.throws(()=>revision7Authority(source,repeated),'Repeating a different real source clause under a valid missing-clause ID cannot omit an obligation');
const downgraded=structuredClone(register);downgraded.requirements[0].priority='P3';assert.throws(()=>revision7Authority(source,downgraded),'Generated priorities cannot downgrade binding P0-P2 clauses to excluded work');
assert.throws(()=>revision7Authority(source+'\nUnreviewed source change',register));
const alteredSource=source+'\nUnreviewed source change',alteredRegister=structuredClone(register);alteredRegister.sourceSha256=(await import('node:crypto')).createHash('sha256').update(alteredSource).digest('hex');assert.throws(()=>revision7Authority(alteredSource,alteredRegister),'Changing both source and register cannot replace the explicitly supplied master');
assert.throws(()=>partitionHistoricalRegistry({requirements:[{id:'UNCLASSIFIED'}]}),'Unknown requirements cannot silently disappear');
const clause=authority.requirements[0],target=clause.expectedCases[0],proof={...target,checks:[{...target,id:clause.id,status:'passed',reviewer:'Synthetic independent reviewer',approvalReference:'Synthetic clause evidence'}]};
assert.equal(aggregate([clause],[proof])[0].status,'passed','Exact clause-bound independently reviewed synthetic proof exercises the approval mechanism only');
for(const key of ['sourceSha256','sourceTextSha256']){const stale=structuredClone(proof);stale.checks[0][key]='0'.repeat(64);assert.equal(aggregate([clause],[stale])[0].status,'partial','Different source or clause cannot supply acceptance');}
const noReviewer=structuredClone(proof);delete noReviewer.checks[0].reviewer;assert.equal(aggregate([clause],[noReviewer])[0].status,'partial');
const failed=structuredClone(proof);failed.checks[0].status='failed';assert.equal(aggregate([clause],[proof,failed])[0].status,'failed','A failed current case still dominates');
const oldProof={...proof,checks:[{...proof.checks[0],id:partition.historical[0].id}]};assert.ok(currentApprovalCoverage(registry,authority,[oldProof]).coverage.filter(row=>row.id.startsWith('R7-')).every(row=>row.status==='review-required'),'Historical green evidence cannot approve current source clauses');
const technical=partition.technical[0],technicalFailure={checks:[{id:technical.id,status:'failed'}]};assert.equal(currentApprovalCoverage(registry,authority,[technicalFailure]).coverage.find(row=>row.id===technical.id).status,'failed');
console.log('Revision7 authority: 573 byte-bound clauses, all40 technical contracts, 392 archived historical obligations, stale/substituted/forged-pass denial and exact independent review boundaries passed. No actual product approval issued.');
