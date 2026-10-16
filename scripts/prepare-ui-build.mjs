import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';

// A warm Next build served old responsive CSS on a static settings route after
// the source changed. Reuse compiler caches only with the same central styles.
const files=[],seen=new Set();
async function collect(file){if(seen.has(file))return;seen.add(file);files.push(file);const css=await fs.readFile(file,'utf8');for(const match of css.matchAll(/@import\s+["']([^"']+)["']/g))await collect(path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])));}
await collect('app/binso-ui.css');
const fingerprint=createHash('sha256').update((await Promise.all(files.map(async file=>file+'\n'+await fs.readFile(file,'utf8')))).join('\n')).digest('hex');
const stamp='.next/cache/binso-ui-source.json';
const previous=await fs.readFile(stamp,'utf8').then(JSON.parse).catch(()=>null);
if(previous?.fingerprint!==fingerprint){
 const generated=path.resolve('.next');if(path.dirname(generated)!==process.cwd())throw Error('Build output must stay inside the project');
 await fs.rm(generated,{recursive:true,force:true});
 console.log('Central UI styles changed: discarded generated Next output and caches before compilation.');
}
await fs.mkdir('.next/cache',{recursive:true});
await fs.writeFile(stamp,JSON.stringify({schemaVersion:1,fingerprint})+'\n');
