import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {gunzipSync} from 'node:zlib';
import {writeTestOutput} from './test-output.mjs';

// Real production HTTP responses on loopback; no mock authentication, tenant data,
// external services, browser-render claims or persisted response bodies.
const outputIndex=process.argv.indexOf('--output');
const output=outputIndex<0?undefined:process.argv[outputIndex+1];
assert.ok(output,'Use --output <report.json>');
await fs.access('.next/BUILD_ID');
const probe=net.createServer();await new Promise(resolve=>probe.listen(0,'127.0.0.1',resolve));
const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
const base='http://127.0.0.1:'+port;
const environment={...process.env,NODE_ENV:'production',APP_MODE:'local',DATABASE_URL:'',PORT:String(port),HOSTNAME:'127.0.0.1'};
for(const key of Object.keys(environment))if(/^(STRIPE_|GRAPH_|AZURE_STORAGE_|IDENTITY_|ACTIONS_ID_TOKEN_)/.test(key))environment[key]='';
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:environment,stdio:['ignore','pipe','pipe']});
let logs='';server.stdout.on('data',data=>{logs=(logs+data).slice(-4000)});server.stderr.on('data',data=>{logs=(logs+data).slice(-4000)});
const agent=new http.Agent({keepAlive:true});
function request(path){return new Promise((resolve,reject)=>{
 const start=performance.now();
 const req=http.get(base+path,{agent,headers:{'Accept-Encoding':'gzip','User-Agent':'Binso local HTTP performance probe'}},response=>{
  const firstByteMs=performance.now()-start,chunks=[];
  response.on('data',chunk=>chunks.push(chunk));response.on('error',reject);response.on('end',()=>{
   const transferred=Buffer.concat(chunks),body=response.headers['content-encoding']==='gzip'?gunzipSync(transferred):transferred;
   resolve({status:response.statusCode,firstByteMs,totalMs:performance.now()-start,transferredBytes:transferred.length,decodedBytes:body.length,encoding:response.headers['content-encoding']??'identity',cacheControl:response.headers['cache-control']??null,location:response.headers.location,body});
  });
 });req.setTimeout(15000,()=>req.destroy(Error('HTTP measurement timeout')));req.on('error',reject);
});}
const round=value=>Math.round(value*10)/10;
const stats=values=>{const sorted=values.toSorted((a,b)=>a-b);return {median:round((sorted[Math.floor((sorted.length-1)/2)]+sorted[Math.floor(sorted.length/2)])/2),p95:round(sorted[Math.ceil(sorted.length*.95)-1]),min:round(sorted[0]),max:round(sorted.at(-1))};};
try{
 for(let attempt=0;;attempt++){
  try{const health=await request('/api/health');assert.equal(health.status,200);break}catch(error){if(attempt>=120||server.exitCode!==null)throw Error(logs||error.message);await new Promise(resolve=>setTimeout(resolve,250));}
 }
 const assets=new Map(),routes=[];
 const measuredPaths=['/','/login','/registrieren','/preise','/produkt',...(process.argv.includes('--all-locales')?['en','fr','it','tr'].map(locale=>'/login?lang='+locale):[])];
 for(const path of measuredPaths){
  const first=await request(path);assert.equal(first.status,200,path);
  const html=first.body.toString('utf8'),paths=new Set();
  if(path.startsWith('/login?lang=')){
   const locale=new URL(path,base).searchParams.get('lang'),translations=JSON.parse(await fs.readFile('lib/locales/messages.json','utf8'));
   const expected=translations['Willkommen zurück'][{en:0,fr:1,it:2,tr:3}[locale]]+'.';
   const heading=html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g,'').replaceAll('&#x27;',"'").replaceAll('&amp;','&');
   assert.equal(heading,expected,'The first HTML heading is already in the selected language');
  }
  for(const tag of html.matchAll(/<(?:script|link)\b[^>]*>/g)){
   // Modern Safari/Chrome ignore legacy-only scripts; do not count them as
   // part of a module-capable browser's initial transfer estimate.
   if(/\bnomodule(?:\s|=|>)/i.test(tag[0]))continue;
   const address=tag[0].match(/\b(?:src|href)="([^"]+)"/)?.[1]?.replaceAll('&amp;','&');
   if(address&&(address.startsWith('/_next/static/')||address.startsWith('/fonts/')))paths.add(address);
  }
  for(const assetPath of paths)if(!assets.has(assetPath)){
   const response=await request(assetPath);assert.equal(response.status,200,assetPath);
   assets.set(assetPath,{path:assetPath,transferredBytes:response.transferredBytes,decodedBytes:response.decodedBytes,encoding:response.encoding,cacheControl:response.cacheControl});
  }
  const samples=[];
  for(let i=0;i<20;i++){const response=await request(path);assert.equal(response.status,200);samples.push({firstByteMs:round(response.firstByteMs),totalMs:round(response.totalMs)});}
  const resources=[...paths].map(path=>assets.get(path));
  const js=resources.filter(asset=>/\.js(?:\?|$)/.test(asset.path));
  routes.push({path,firstRequest:{firstByteMs:round(first.firstByteMs),totalMs:round(first.totalMs)},warmRequests:20,warmFirstByteMs:stats(samples.map(sample=>sample.firstByteMs)),warmTotalMs:stats(samples.map(sample=>sample.totalMs)),htmlTransferBytes:first.transferredBytes,htmlDecodedBytes:first.decodedBytes,initialJsFiles:js.length,initialJsTransferBytes:js.reduce((sum,asset)=>sum+asset.transferredBytes,0),initialJsDecodedBytes:js.reduce((sum,asset)=>sum+asset.decodedBytes,0),htmlAndDeclaredResourcesTransferBytes:first.transferredBytes+resources.reduce((sum,asset)=>sum+asset.transferredBytes,0),declaredResources:[...paths],samples});
 }
 const budgetIndex=process.argv.indexOf('--budget-kb');
 if(budgetIndex>=0){const budget=Number(process.argv[budgetIndex+1])*1000;assert.ok(Number.isFinite(budget)&&budget>0);for(const route of routes)assert.ok(route.initialJsTransferBytes<=budget,route.path+': initial JavaScript exceeds '+budget+' gzip bytes');}
 const protectedRedirects=[];
 for(const path of ['/dashboard','/kunden','/lieferanten','/abwesenheiten','/vertraege']){
  const response=await request(path);assert.equal(response.status,307,path);assert.equal(new URL(response.location,base).pathname,'/login');
  protectedRedirects.push({path,status:response.status,firstByteMs:round(response.firstByteMs),target:new URL(response.location,base).pathname});
 }
 const report={measuredAt:new Date().toISOString(),commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),buildId:(await fs.readFile('.next/BUILD_ID','utf8')).trim(),node:process.version,mode:'Local production build, loopback, one sequential client, gzip, 20 warm requests per public route; declared resources for a module-capable browser',limits:['No browser rendering, JavaScript execution, FCP, LCP, CLS or INP measurements.','No real mobile connection, production Azure latency, database or authenticated app API measurements.','Declared HTML assets only: nomodule scripts, dynamic imports, images, later browser requests and protocol header overhead are excluded.','First request means route-first in this running process, not an Azure cold start.'],routes,protectedRedirects,assets:[...assets.values()].sort((a,b)=>b.transferredBytes-a.transferredBytes)};
 await fs.mkdir(path.dirname(output),{recursive:true});
 await writeTestOutput(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({report:output,routes:routes.map(({path,warmFirstByteMs,initialJsTransferBytes,htmlAndDeclaredResourcesTransferBytes})=>({path,warmFirstByteMs,initialJsTransferBytes,htmlAndDeclaredResourcesTransferBytes})),largestAssets:report.assets.slice(0,4)},null,2));
}finally{agent.destroy();server.kill();if(server.exitCode===null)await new Promise(resolve=>server.once('exit',resolve));}
