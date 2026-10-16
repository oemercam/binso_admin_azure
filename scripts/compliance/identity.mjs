import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export function identity(){
 // Ask Git for source paths directly: downloaded evidence can exceed the
 // child-process output buffer before a JavaScript-side filter ever runs.
 const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z','--','app/','components/','lib/','public/','scripts/','ux-compliance/','package.json*','pnpm-lock.yaml*','next.config*'],{encoding:'utf8'}).split('\0'))].filter(p=>/^(app|components|lib|public|scripts|ux-compliance)\//.test(p)||/^(package.json|pnpm-lock.yaml|next.config)/.test(p)).sort();
 const hash=createHash('sha256');for(const file of files)if(fs.existsSync(file)){hash.update(file+'\0');hash.update(fs.readFileSync(file));}
 return {commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:hash.digest('hex'),registryVersion:JSON.parse(fs.readFileSync('ux-compliance/requirements.v1.json','utf8')).version};
}
