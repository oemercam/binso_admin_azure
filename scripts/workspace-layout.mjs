import fs from 'node:fs/promises';
import path from 'node:path';
const at=process.argv.indexOf('--root');if(at<0||!process.argv[at+1])throw Error('Explicit workspace --root required');
const root=path.resolve(process.argv[at+1]);
const groups={source:[],archives:[],evidence:[],tools:[],runtime:[],privateCount:0,unclassified:[]};
for(const item of await fs.readdir(root,{withFileTypes:true})){
 const name=item.name;
 if(name.startsWith('.')||/session|secret|credential|token/i.test(name)){groups.privateCount++;continue;}
 const owner=/^(repo|system-hardening-20261026)$/.test(name)?'source':/\.zip(?:\.sha256)?$/i.test(name)?'archives':/\.(?:mjs|ps1)$/i.test(name)&&!/^runtime/.test(name)?'tools':/^runtime|^AGENTS\.md$/.test(name)?'runtime':/^(?:evidence|audit|ux-|v[0-9]|ci-|release-|final-|phase|MODEL-|quality-|deploy|production-)|\.(?:png|log|json|txt)$/i.test(name)?'evidence':'unclassified';
 groups[owner].push(name);
}
console.log(JSON.stringify({version:1,policy:'Metadata only; source and private evidence are preserved. No move/delete operations.',groups},null,2));
