import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),yaml=createRequire(require.resolve('eslint'))('js-yaml');
const read=file=>fs.readFileSync(file,'utf8');
const workflowDirectory='.github/workflows';
const files=fs.readdirSync(workflowDirectory).filter(file=>/\.ya?ml$/.test(file)).sort();
const references=text=>[...new Set(text.match(/scripts\/[\w./-]+\.(?:mjs|sh|py)/g)??[])].sort();
const roots=new Set();
const workflows=files.map(file=>{
 const source=read(workflowDirectory+'/'+file),document=yaml.load(source);
 for(const script of references(source))roots.add(script);
 return {file:workflowDirectory+'/'+file,name:document.name,triggers:document.on,permissions:document.permissions,concurrency:document.concurrency,
  secrets:[...new Set([...source.matchAll(/secrets\.([A-Z_0-9]+)/g)].map(match=>match[1]))].sort(),
  jobs:Object.entries(document.jobs).map(([name,job])=>({name,needs:job.needs,if:job.if,environment:job.environment,permissions:job.permissions,timeoutMinutes:job['timeout-minutes'],runner:job['runs-on'],matrix:job.strategy?.matrix,services:Object.keys(job.services??{}),steps:job.steps.map(step=>({name:step.name,uses:step.uses,if:step.if,scripts:references(step.run??'')}))}))};
});
const packageScripts=JSON.parse(read('package.json')).scripts;
// Include npm-script entry points as well as literal workflow references. Resolve
// repository-local imports recursively; this inventory never executes a script.
for(const command of Object.values(packageScripts))for(const script of references(command))roots.add(script);
const pending=[...roots],visited=new Map();
while(pending.length){
 const file=pending.shift();if(visited.has(file))continue;
 if(!fs.existsSync(file)){visited.set(file,{file,missing:true});continue;}
 const source=read(file),imports=[...source.matchAll(/(?:from\s+|import\s*\(|import\s+)["'](\.[^"']+)["']/g)].map(match=>path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1]))).filter(candidate=>fs.existsSync(candidate)&&fs.statSync(candidate).isFile());
 const children=[...new Set([...references(source),...imports])].sort();
 visited.set(file,{file,references:children});pending.push(...children);
}
const inventory={schemaVersion:1,scope:'Static source inventory; script references are lexical and do not prove runtime reachability.',workflows,composite:{file:'.github/actions/setup-node/action.yml',definition:yaml.load(read('.github/actions/setup-node/action.yml'))},packageScripts,scripts:[...visited.values()].sort((a,b)=>a.file.localeCompare(b.file))};
const destination='docs/audit/actions-release-20261017/inventory.json';
fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,JSON.stringify(inventory,null,2)+'\n');
console.log(`Actions inventory: ${workflows.length} workflows, ${inventory.scripts.length} script/import references -> ${destination}`);
