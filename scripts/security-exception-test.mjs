import assert from 'node:assert/strict';
import {checkAdvisories} from './full-security-audit.mjs';
const advisory={github_advisory_id:'GHSA-vfj7-8cjw-p6xm',module_name:'braces',severity:'high',findings:[{version:'3.0.3',paths:['.>eslint-config-next>@next/eslint-plugin-next>fast-glob>micromatch>braces']}]};
const run=(a=advisory,now=new Date('2026-10-10T00:00:00Z'),manifest={devDependencies:{'eslint-config-next':'16.3.8'}})=>checkAdvisories({advisories:{fixture:a}},{now,manifest});
assert.equal(run().length,1);
for(const replacement of [{module_name:'other'},{severity:'critical'},{github_advisory_id:'GHSA-AAAA-BBBB-CCCC'},{findings:[{version:'3.0.4',paths:advisory.findings[0].paths}]},{findings:[{version:'3.0.3',paths:['.>production>braces']}]}])assert.throws(()=>run({...advisory,...replacement}));
assert.throws(()=>run(advisory,new Date('2026-10-24T00:00:00Z')));assert.throws(()=>run(advisory,new Date('2026-10-10'),{dependencies:{'eslint-config-next':'16.3.8'},devDependencies:{'eslint-config-next':'16.3.8'}}));
console.log('Dependency exceptions are package/version/path/dev-root/expiry bound; changed, critical and production scope are rejected.');
