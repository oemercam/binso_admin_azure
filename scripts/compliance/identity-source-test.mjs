import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sourceHasher,sourceInputs,isIdentitySourcePath} from './identity.mjs';
const files=new Map([
 ['app/page.tsx','current application'],['proxy.ts','current authentication boundary'],['database/migrations/0078_document_delivery_outcomes.sql','current constraint'],
 ['database/operations/provision-runtime-role.sql','current rights'],['patches/fixture.patch','current patch'],
 ['.github/workflows/quality.yml','current gate'],['pnpm-workspace.yaml','current package rules'],
 ['eslint.config.mjs','current lint'],['tsconfig.json','current types'],['AGENTS.md','current instructions'],
 ['docs/audit/v24/reference/source.zip','actual approved source'],
 ['docs/audit/v25-revision7/ci-fixture.json','untrusted result'],['evidence/fixture.json','untrusted result']
]);
const digest=()=>sourceHasher([...files.keys()],file=>Buffer.from(files.get(file))).digest('hex'),baseline=digest();
for(const file of files.keys()){
 const previous=files.get(file);files.set(file,previous+' changed');
 assert.equal(digest()!==baseline,!file.startsWith('evidence/')&&!file.includes('/ci-fixture.json'),'Source/rights/gate/patch changes invalidate proof; mutable result notes cannot mint acceptance: '+file);
 files.set(file,previous);
}
assert.equal(sourceHasher([...files.keys()].reverse().concat('app/page.tsx'),file=>Buffer.from(files.get(file))).digest('hex'),baseline,'Stable ordering and duplicate paths');
assert.equal(isIdentitySourcePath('database/../evidence/fixture.json'),false);
assert.equal(isIdentitySourcePath('docs/audit/v25-revision7/requirements.json'),false,'Normative requirement projection is bound separately; mutable result prose is not raw source');
const actual=sourceInputs();
for(const file of ['database/migrations/0078_document_delivery_outcomes.sql','database/operations/provision-runtime-role.sql','.github/workflows/quality.yml','pnpm-workspace.yaml','tsconfig.json','proxy.ts','AGENTS.md'])assert.ok(actual.includes(file),'Actual Git enumeration includes '+file);
for(const file of Object.values(JSON.parse(fs.readFileSync('package.json','utf8')).pnpm.patchedDependencies))assert.ok(actual.includes(file),'Actual package patch bytes are bound, not only the declared lock hash');
console.log('Evidence source identity: actual Git database/rights/workflow/patch/config sources bound; mutations invalidate proof, result archives excluded and normative projection retained.');
