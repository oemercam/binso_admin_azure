import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {ESLint} from 'eslint';
import nextVitals from 'eslint-config-next/core-web-vitals';

const require=createRequire(import.meta.url),pluginRequire=createRequire(require.resolve('eslint-config-next')),
 pluginPath=pluginRequire.resolve('@next/eslint-plugin-next'),dependencyRequire=createRequire(pluginPath),
 helperPath=dependencyRequire.resolve('./utils/get-root-dirs.js');
const helper=fs.readFileSync(helperPath,'utf8');
assert.match(helper,/require\("node:fs"\)/,'Actual Next helper uses the pinned Node24 API');
assert.doesNotMatch(helper,/require\(["']fast-glob["']\)/,'Actual helper cannot fall back to the retired dependency');
assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).pnpm.overrides['@next/eslint-plugin-next>fast-glob'],'-');
assert.doesNotMatch(fs.readFileSync('pnpm-lock.yaml','utf8'),/^\s+(?:braces|micromatch|fast-glob)@/m,'Vulnerable chain is absent, not merely hidden by an audit exception');
const {getRootDirs}=dependencyRequire('./utils/get-root-dirs.js');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'binso-next-glob-'));
assert.ok(root.startsWith(path.resolve(os.tmpdir())+path.sep));
try{
 for(const name of ['one','two','client-1','client-2','Grösse mit Platz'])fs.mkdirSync(path.join(root,'apps',name,'pages'),{recursive:true});
 fs.writeFileSync(path.join(root,'apps','not-a-directory.txt'),'fixture');
 for(const name of ['index','about'])fs.writeFileSync(path.join(root,'apps','one','pages',name+'.tsx'),'export default function Page(){return null}');
 const normalized=value=>value.replaceAll('\\','/'),apps=normalized(path.join(root,'apps'));
 const cases=[[apps+'/one',['one']],[apps+'/{one,two}',['one','two']],[apps+'/{one,{two,client-1}}',['one','two','client-1']],[apps+'/client-*',['client-1','client-2']],[apps+'/client-{1..2}',['client-1','client-2']],[apps+'/Grösse mit Platz',['Grösse mit Platz']],[apps+'/absent-*',[]]];
 for(const [pattern,names] of cases)assert.deepEqual(getRootDirs({cwd:root,settings:{next:{rootDir:pattern}}}).map(normalized).sort(),names.map(name=>apps+'/'+name).sort(),'Actual Next root directory discovery: '+pattern);
 assert.deepEqual(getRootDirs({cwd:root,settings:{}}),[root],'Default root contract preserved');
 assert.deepEqual(getRootDirs({cwd:root,settings:{next:{rootDir:[apps+'/one',apps+'/two']}}}).map(normalized).sort(),[apps+'/one',apps+'/two']);
 const lint=new ESLint({overrideConfigFile:true,overrideConfig:[...nextVitals,{settings:{next:{rootDir:apps+'/{one,two}'}}}]});
 for(const [code,expected] of [['export default function Page(){return <a href="/about">About</a>}',1],['export default function Page(){return <a href="https://example.invalid/about">External</a>}',0]]){
  const result=await lint.lintText(code,{filePath:path.resolve('app/fixture.tsx')});
  assert.equal(result.flatMap(row=>row.messages).filter(row=>row.ruleId==='@next/next/no-html-link-for-pages').length,expected,'Actual Next rule remains enabled and resolves configured page roots');
 }
 for(const [depth,reason] of [[200,'safe pattern limit'],[6000,'safe pattern limit']]){
  const child=`const {getRootDirs}=require(${JSON.stringify(helperPath)});try{getRootDirs({cwd:${JSON.stringify(root)},settings:{next:{rootDir:'{'.repeat(${depth})+'x'+'}'.repeat(${depth})}}});throw Error('Expected bounded rejection')}catch(e){if(e instanceof RangeError||!e.message.includes(${JSON.stringify(reason)}))throw e;console.log('bounded rejection:'+e.name)}`;
  const output=execFileSync(process.execPath,['--max-old-space-size=128','-e',child],{timeout:5000,encoding:'utf8'});
  assert.match(output,/bounded rejection/,'Deep nesting cannot crash the process with stack exhaustion: '+depth);
 }
 console.log('Next glob dependency: exact scoped replacement, real directories/braces/Unicode/arrays/defaults, enabled Next link rule positive/negative and deep-pattern stack-exhaustion regression passed.');
}finally{fs.rmSync(root,{recursive:true,force:true});}
