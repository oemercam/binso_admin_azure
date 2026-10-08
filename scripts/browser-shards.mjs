import {spawn} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
export function partition(values,count){return Array.from({length:count},(_,i)=>values.filter((_,j)=>j%count===i));}
export async function runShards({routes,interactions,count,env=process.env,command=process.execPath,script='scripts/ux-browser-test.mjs'}){
 const routeParts=partition(routes,count),interactionParts=partition(interactions,count),children=[];
 const output=env.BINSO_UX_OUTPUT??'/tmp/binso-ux-browser',started=Date.now();
 try{await Promise.all(routeParts.map((part,index)=>new Promise((resolve,reject)=>{
  const child=spawn(command,[script],{stdio:'inherit',env:{...env,BINSO_UX_ROUTES:part.join(','),BINSO_UX_INTERACTIONS:interactionParts[index].join(','),BINSO_UX_PORT:String(Number(env.BINSO_UX_PORT??3200)+index*2),BINSO_UX_OUTPUT:path.join(output,'shard-'+index)}});children.push(child);
  child.on('error',reject);child.on('exit',(code,signal)=>code===0?resolve():reject(new Error(`Browser shard ${index+1}/${count} failed: ${signal??code}`)));
 })));await fs.mkdir(output,{recursive:true});await fs.writeFile(path.join(output,'shards.json'),JSON.stringify({count,routeParts,interactionParts,seconds:(Date.now()-started)/1000,passed:true},null,2));
 }finally{for(const child of children)if(child.exitCode===null&&!child.killed)child.kill('SIGTERM');}
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const routes=(process.env.BINSO_UX_ROUTES??'').split(',').filter(Boolean),interactions=(process.env.BINSO_UX_INTERACTIONS??'').split(',').filter(Boolean);
 if(!routes.length)throw new Error('Explicit browser route scope is required');
 const count=process.env.BINSO_UX_BROWSER==='chromium'&&routes.length>=30?2:1;
 await runShards({routes,interactions,count});
}
