import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export function identity(){
 // Ask Git for source paths directly: downloaded evidence can exceed the
 // child-process output buffer before a JavaScript-side filter ever runs.
 const contracts=['docs/audit/v24/ux-contract.json','docs/audit/v24/reference-source.json','docs/architecture/ux-current-approval.md','docs/architecture/reference-foundation.md','docs/audit/v25-revision7/source.md','docs/audit/v25-revision7/requirements.json'];
 const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--','app/','components/','lib/','config/','public/','scripts/','ux-compliance/','package.json*','pnpm-lock.yaml*','next.config*',...contracts],{encoding:'utf8'}).split('\0'))].filter(p=>/^(app|components|lib|config|public|scripts|ux-compliance)\//.test(p)||/^(package.json|pnpm-lock.yaml|next.config)/.test(p)||contracts.includes(p)).sort();
 const hash=createHash('sha256');for(const file of files)if(fs.existsSync(file)){hash.update(file+'\0');hash.update(fs.readFileSync(file));}
 return {commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:hash.digest('hex'),registryVersion:JSON.parse(fs.readFileSync('ux-compliance/requirements.v1.json','utf8')).version};
}
