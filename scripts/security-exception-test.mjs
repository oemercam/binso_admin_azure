import assert from 'node:assert/strict';
import {checkAdvisories} from './full-security-audit.mjs';
const advisory={github_advisory_id:'GHSA-vfj7-8cjw-p6xm',module_name:'braces',severity:'high',findings:[{version:'3.0.3',paths:['.>eslint-config-next>@next/eslint-plugin-next>fast-glob>micromatch>braces']}]};
assert.deepEqual(checkAdvisories({advisories:{}}),[]);
for(const severity of ['low','moderate'])assert.deepEqual(checkAdvisories({advisories:{fixture:{...advisory,severity}}}),[]);
for(const replacement of [{},{module_name:'other'},{severity:'critical'},{github_advisory_id:'GHSA-AAAA-BBBB-CCCC'},{findings:[{version:'3.0.4',paths:advisory.findings[0].paths}]},{findings:[{version:'3.0.3',paths:['.>production>braces']}]}])assert.throws(()=>checkAdvisories({advisories:{fixture:{...advisory,...replacement}}}),'Every high/critical finding blocks, including the previously excepted exact dev path');
for(const invalid of [null,{}, {error:'network'}, {advisories:[]},{advisories:{fixture:null}},{advisories:{fixture:{severity:'unknown'}}}])assert.throws(()=>checkAdvisories(invalid),'Malformed audit output cannot become success');
await import('./next-glob-security-test.mjs');
console.log('Full dependency gate: no high/critical exceptions; exact former advisory, production paths, unknown findings and malformed reports remain blocking.');
