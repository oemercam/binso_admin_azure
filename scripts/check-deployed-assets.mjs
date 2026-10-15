import fs from 'node:fs';
import path from 'node:path';
import {expectedStyles,stylesheetLinks as styles} from './deployed-asset-manifest.mjs';

const artifact=process.argv[2];
if(!artifact)throw new Error('Pass the extracted, verified production artifact directory.');
const base=(process.env.BINSO_BASE_URL||'http://127.0.0.1:3000').replace(/\/$/,'');
const routes=['kunden','produkte','angebote','rechnungen','zahlungen','zeit'];
for(const route of routes){
 const expected=expectedStyles(artifact,route);
 if(!expected.length)throw new Error(`/${route}: artifact has no stylesheet links.`);
 const url=new URL(base+'/'+route);url.searchParams.set('release_verify',Date.now().toString());
 const response=await fetch(url,{headers:{'cache-control':'no-cache, no-store'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`/${route}: HTTP ${response.status}`);
 const actual=styles(await response.text());
 if(JSON.stringify(actual)!==JSON.stringify(expected)){
  throw new Error(`/${route}: UI assets differ from verified artifact. Expected ${expected.join(', ')}; received ${actual.join(', ')}`);
 }
 for(const asset of actual){
  if(!asset.startsWith('/_next/static/')||asset.includes('..'))throw Error('Invalid stylesheet path '+asset);
  const bytes=fs.readFileSync(path.join(artifact,'.next',asset.slice('/_next/'.length)));
  const css=await fetch(new URL(asset,base),{headers:{'cache-control':'no-cache, no-store'},signal:AbortSignal.timeout(30000)});
  if(!css.ok||!Buffer.from(await css.arrayBuffer()).equals(bytes))throw Error('/'+route+': stylesheet bytes differ from the verified artifact: '+asset);
 }
 console.log(`Verified deployed UI assets: /${route}`);
}

// File tracing may already create public/. Validate the actual merged public
// payload as served bytes, not only Next's hashed stylesheets.
for(const relative of ['sw.js','manifest-app.webmanifest','brand/pwa-icon-192.png','fonts/pdf/LiberationSans-Regular.ttf','fonts/pdf/LiberationSans-Bold.ttf']){
 const expected=fs.readFileSync(path.join(artifact,'public',relative));
 const url=new URL(base+'/'+relative);url.searchParams.set('release_verify',Date.now().toString());
 const response=await fetch(url,{headers:{'cache-control':'no-cache, no-store'},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(`/${relative}: HTTP ${response.status}`);
 const actual=Buffer.from(await response.arrayBuffer());
 if(!actual.equals(expected))throw new Error(`/${relative}: public bytes differ from verified artifact.`);
 console.log(`Verified deployed public asset: /${relative}`);
}
