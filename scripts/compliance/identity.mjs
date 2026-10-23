import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {authorityPaths,revision7Identity} from './authority.mjs';
const contracts=['AGENTS.md','docs/architecture/ux-master-v4/source.md','docs/architecture/ux-master-v4/contract.md','docs/architecture/ux-master-v4-1/source.md','docs/architecture/ux-master-v4-1/contract.md','docs/architecture/finance-analysis-final-v1/source.md','docs/architecture/finance-analysis-final-v1/contract.md','docs/architecture/ux-master-v5/source.md','docs/architecture/ux-master-v5/contract.md','docs/audit/v24/ux-contract.json','docs/audit/v24/reference-source.json','docs/architecture/ux-current-approval.md','docs/architecture/reference-foundation.md','docs/architecture/v25-revision7.md','docs/audit/v25-revision7/source.md'];
const roots=['app/','components/','lib/','config/','public/','scripts/','ux-compliance/','database/','patches/','.github/','docs/audit/v24/reference/'];
const configPattern=/^(?:package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc|\.env\.example|\.gitattributes|(?:proxy|middleware|instrumentation(?:-client)?)\.[cm]?[jt]sx?|tsconfig[^/]*\.json|next\.config[^/]*|eslint\.config\.[^/]+|postcss\.config\.[^/]+)$/;
export function isIdentitySourcePath(file){return typeof file==='string'&&!file.split('/').some(part=>part==='.'||part==='..')&&(roots.some(root=>file.startsWith(root))||configPattern.test(file)||contracts.includes(file));}
export function sourceInputs(){
 // Ask Git for source paths directly: downloaded evidence can exceed the
 // child-process output buffer before a JavaScript-side filter ever runs.
 return [...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--',...roots,'package.json','pnpm-lock.yaml','pnpm-workspace.yaml','.npmrc','.env.example','.gitattributes','proxy.*','middleware.*','instrumentation*','tsconfig*.json','next.config*','eslint.config.*','postcss.config.*',...contracts],{encoding:'utf8'}).split('\0'))].filter(isIdentitySourcePath).filter(file=>fs.existsSync(file)).sort();
}
export function sourceHasher(files,readFile=fs.readFileSync){
 const hash=createHash('sha256').update('BINSO-evidence-source-v2\0');
 for(const file of [...new Set(files)].filter(isIdentitySourcePath).sort()){hash.update(file+'\0');hash.update(readFile(file));}
 return hash;
}
export function identity(){
 const hash=sourceHasher(sourceInputs());
 if(authorityPaths.some(file=>fs.existsSync(file)))hash.update(authorityPaths[1]+'\0').update(revision7Identity());
 return {commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:hash.digest('hex'),registryVersion:JSON.parse(fs.readFileSync('ux-compliance/requirements.v1.json','utf8')).version};
}
