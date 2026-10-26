import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
// Evidence is supplied AFTER the immutable source commit, never committed back
// into that commit (which would create an impossible self-referential SHA).
const register=JSON.parse(await fs.readFile(process.env.BINSO_PRODUCTION_ACCEPTANCE_REGISTER??'docs/operations/production-acceptance.json','utf8'));
const evidenceRoot=await fs.realpath(process.env.BINSO_PRODUCTION_EVIDENCE_ROOT??'.');
const sha=process.env.BINSO_BUILD_SHA??execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const required=['scanner-live','network-live','full-production-qa','restore-live','alarm-delivery','retention-live','legal-approval','physical-devices','identity-ingress','mail-delivery','commercial-domain'];
if(register.schemaVersion!==1||JSON.stringify(register.requirements.map(r=>r.id).sort())!==JSON.stringify([...required].sort()))throw Error('Production acceptance register cannot remove requirements');
const gaps=[];
for(const requirement of register.requirements){
 const e=requirement.evidence;
 if(!e){gaps.push(requirement.id);continue;}
 if(e.sourceSha!==sha||!e.reviewer||!Number.isFinite(Date.parse(e.verifiedAt))||Date.parse(e.verifiedAt)>Date.now()||!/^docs\/evidence\/production\/[a-zA-Z0-9/_-]+\.(json|txt|pdf|png)$/.test(e.path)||!/^([a-f0-9]{64})$/.test(e.sha256))throw Error('Invalid source-bound approval: '+requirement.id);
 const target=await fs.realpath(path.resolve(evidenceRoot,e.path));if(!target.startsWith(evidenceRoot+path.sep))throw Error('Evidence must stay inside its verified artifact');
 const file=await fs.readFile(target);if(!file.length||createHash('sha256').update(file).digest('hex')!==e.sha256)throw Error('Acceptance evidence missing or changed: '+requirement.id);
}
console.log(JSON.stringify({sourceSha:sha,productionAcceptance:gaps.length===0&&register.productionAcceptance===true,open:gaps},null,2));
if(process.argv.includes('--production')&&(gaps.length||register.productionAcceptance!==true))process.exitCode=1;
