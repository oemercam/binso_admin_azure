import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';

// A warm Next build served old responsive CSS on a static settings route after
// the source changed. Reuse compiler caches only with the same central styles.
const files=['app/binso-ui.css',...(await fs.readdir('app/styles')).filter(file=>file.endsWith('.css')).sort().map(file=>'app/styles/'+file)];
const fingerprint=createHash('sha256').update((await Promise.all(files.map(async file=>file+'\n'+await fs.readFile(file,'utf8')))).join('\n')).digest('hex');
const stamp='.next/cache/binso-ui-source.json';
const previous=await fs.readFile(stamp,'utf8').then(JSON.parse).catch(()=>null);
if(previous?.fingerprint!==fingerprint){
 await fs.rm('.next',{recursive:true,force:true});
 console.log('Central UI styles changed: discarded generated Next output and caches before compilation.');
}
await fs.mkdir('.next/cache',{recursive:true});
await fs.writeFile(stamp,JSON.stringify({schemaVersion:1,fingerprint})+'\n');
