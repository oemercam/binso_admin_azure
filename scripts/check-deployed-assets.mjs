import fs from 'node:fs';
import path from 'node:path';

const artifact=process.argv[2];
if(!artifact)throw new Error('Pass the extracted, verified production artifact directory.');
const base=(process.env.BINSO_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const routes=['kunden','produkte','angebote','rechnungen','zahlungen','zeit'];
const styles=html=>[...html.matchAll(/<link\b[^>]*>/gi)]
 .map(match=>match[0])
 .filter(tag=>/\brel=["']stylesheet["']/i.test(tag))
 .map(tag=>tag.match(/\bhref=["']([^"']+\.css)["']/i)?.[1])
 .filter(Boolean).sort();
for(const route of routes){
 const expected=styles(fs.readFileSync(path.join(artifact,'.next/server/app',route+'.html'),'utf8'));
 if(!expected.length)throw new Error(`/${route}: artifact has no stylesheet links.`);
 const url=new URL(base+'/'+route);url.searchParams.set('release_verify',Date.now().toString());
 const response=await fetch(url,{headers:{'cache-control':'no-cache, no-store'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`/${route}: HTTP ${response.status}`);
 const actual=styles(await response.text());
 if(JSON.stringify(actual)!==JSON.stringify(expected)){
  throw new Error(`/${route}: UI assets differ from verified artifact. Expected ${expected.join(', ')}; received ${actual.join(', ')}`);
 }
 console.log(`Verified deployed UI assets: /${route}`);
}
