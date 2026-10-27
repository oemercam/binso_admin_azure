import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const next=import.meta.resolve('next/server.js');
async function compile(file,imports={}){let source=(await fs.readFile(file,'utf8')).replaceAll("import 'server-only';",'').replaceAll('import "server-only";','');for(const [name,url] of Object.entries(imports))source=source.replaceAll("'"+name+"'",JSON.stringify(url)).replaceAll('"'+name+'"',JSON.stringify(url));return moduleUrl(source);}
const limitsUrl=await compile('config/limits.ts'),httpUrl=await compile('lib/server/http.ts',{'next/server':next});
const {limitsConfig}=await import(limitsUrl),{ApiError}=await import(httpUrl);
const scanUrl=await compile('lib/server/receipt-scan.ts',{'@/config/limits':limitsUrl,'./http':httpUrl});
const {scanReceipt,receiptEndpoint,receiptOperation}=await import(scanUrl);
const endpoint='https://synthetic.cognitiveservices.azure.com',operation=endpoint+'/documentintelligence/documentModels/prebuilt-receipt/analyzeResults/fixture-123?api-version=2024-11-30';
const file=new File(['Synthetic fixture, not a real receipt'],'unsafe-name.html',{type:'image/jpeg'});
const success={status:'succeeded',analyzeResult:{documents:[{fields:{MerchantName:{valueString:'Synthetic shop',confidence:.95},TransactionDate:{valueDate:'2026-10-27',confidence:.9},Total:{valueCurrency:{amount:12.35,currencyCode:'CHF'},confidence:.93},TotalTax:{valueCurrency:{amount:.93},confidence:.8}}}]}};
const input=()=>({file,endpoint,key:'synthetic-not-a-secret',signal:new AbortController().signal});
const status=expected=>error=>error instanceof ApiError&&error.status===expected;
for(const value of ['http://synthetic.cognitiveservices.azure.com','https://127.0.0.1','https://synthetic.cognitiveservices.azure.com.evil.invalid','https://user:pass@synthetic.cognitiveservices.azure.com','https://synthetic.cognitiveservices.azure.com/path','https://synthetic.cognitiveservices.azure.com?key=bad'])assert.throws(()=>receiptEndpoint(value),status(503));
assert.equal(receiptEndpoint(endpoint+'/'),endpoint);
assert.equal(receiptOperation(operation,endpoint),operation);
for(const target of [null,'https://evil.invalid/result','http://synthetic.cognitiveservices.azure.com/documentintelligence/documentModels/prebuilt-receipt/analyzeResults/abc','//evil.invalid/result','https://synthetic.cognitiveservices.azure.com@evil.invalid/result',endpoint+'/redirect',endpoint+'/documentintelligence/documentModels/prebuilt-receipt/analyzeResults/%2e%2e/private']){
 let calls=0;await assert.rejects(()=>scanReceipt(input(),{fetch:async()=>{calls++;return new Response(null,{status:202,headers:target?{'operation-location':target}:{}})},sleep:async()=>{}}),status(502));assert.equal(calls,1,'An untrusted operation never receives a polling request or the key');
}
let calls=[];
const fetchFixture=async(url,options)=>{calls.push({url,options});assert.equal(new URL(url).origin,endpoint);assert.equal(options.redirect,'error');assert.equal(options.cache,'no-store');assert.equal(options.headers['Ocp-Apim-Subscription-Key'],'synthetic-not-a-secret');return options.method==='POST'?new Response(null,{status:202,headers:{'operation-location':operation}}):Response.json(calls.length===2?{status:'running'}:success);};
const suggestion=await scanReceipt(input(),{fetch:fetchFixture,sleep:async(ms,signal)=>{assert.equal(ms,1000);assert.ok(signal instanceof AbortSignal)}});
assert.equal(calls.filter(call=>call.options.method==='POST').length,1,'A provider job is never automatically retried');assert.equal(suggestion.total,12.35);assert.equal(suggestion.date,'2026-10-27');assert.equal(suggestion.confidence,.9);assert.ok(suggestion.filename.endsWith('.jpg'),'Filename extension follows the accepted MIME type');assert.equal(new Set(calls.map(call=>call.options.signal)).size,1,'One total deadline covers upload and all polls');
for(const response of [new Response('wrong',{headers:{'content-type':'text/html'}}),new Response('{bad',{headers:{'content-type':'application/json'}}),Response.json({status:'succeeded'}),Response.json({status:'failed'}),new Response('x'.repeat(limitsConfig.receiptScanMaxResponseBytes+1),{headers:{'content-type':'application/json'}})]){
 let count=0;await assert.rejects(()=>scanReceipt(input(),{fetch:async()=>++count===1?new Response(null,{status:202,headers:{'operation-location':operation}}):response,sleep:async()=>{}}),status(502));
}
let polls=0;await assert.rejects(()=>scanReceipt(input(),{fetch:async()=>++polls===1?new Response(null,{status:202,headers:{'operation-location':operation}}):Response.json({status:'running'}),sleep:async()=>{}}),status(504));assert.equal(polls,limitsConfig.receiptScanPollAttempts+1);
const aborted=new AbortController();aborted.abort();let abortedCalls=0;await assert.rejects(()=>scanReceipt({...input(),signal:aborted.signal},{fetch:async()=>{abortedCalls++;throw Error('unreachable')}}),status(504));assert.equal(abortedCalls,0);
const uncertain=structuredClone(success);uncertain.analyzeResult.documents[0].fields.TransactionDate.valueDate='2026-02-31';uncertain.analyzeResult.documents[0].fields.Total.valueCurrency.amount=null;
let uncertainCalls=0;const partial=await scanReceipt(input(),{fetch:async()=>++uncertainCalls===1?new Response(null,{status:202,headers:{'operation-location':operation}}):Response.json(uncertain),sleep:async()=>{}});assert.equal(partial.date,'');assert.equal(partial.total,null);assert.equal(partial.confidence,0,'Incomplete suggestions cannot claim reliable extraction');

// Execute the actual route with actual HTTP/RBAC owners; only identity/provider
// and the shared limiter's external persistence are isolated fixture boundaries.
const permissionUrl=await compile('lib/permissions.ts');
const rbacUrl=await compile('lib/server/rbac.ts',{'@/lib/permissions':permissionUrl});
let session={organizationId:'tenant-one',userId:'actor-one',role:'owner',moduleProfile:'standard',organizationStatus:'active'},scopes=[],providerCalls=0,denyRate=false;
globalThis.__receiptFixture={session:()=>session,limit:(...args)=>{scopes.push(args.slice(1));if(denyRate)throw new Response('limit',{status:429})},scan:()=>{providerCalls++;return suggestion}};
const sessionUrl=moduleUrl('export async function requireSession(){const s=globalThis.__receiptFixture.session();if(!s)throw new Response("denied",{status:401});return s}');
const limiterUrl=moduleUrl('export async function enforceRateLimit(...args){return globalThis.__receiptFixture.limit(...args)}');
// Keep the real endpoint validator (and its ApiError) with an isolated provider call.
const scanBoundaryUrl=moduleUrl(`export {receiptEndpoint} from ${JSON.stringify(scanUrl)};export async function scanReceipt(){return globalThis.__receiptFixture.scan()}`);
const routeUrl=await compile('app/api/expenses/scan-receipt/route.ts',{'next/server':next,'@/lib/server/http':httpUrl,'@/lib/server/session':sessionUrl,'@/lib/server/rbac':rbacUrl,'@/config/limits':limitsUrl,'@/lib/server/receipt-scan':scanBoundaryUrl,'@/lib/server/rate-limit':limiterUrl});
const route=await import(routeUrl),{NextRequest}=await import(next),oldEndpoint=process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT,oldKey=process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY,oldAppUrl=process.env.APP_URL;
const request=(origin='https://app.fixture.invalid')=>{const body=new FormData();body.set('file',file);return new NextRequest('https://app.fixture.invalid/api/expenses/scan-receipt',{method:'POST',headers:{origin},body})};
try{
 process.env.APP_URL='https://app.fixture.invalid';process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=endpoint;process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY='synthetic-not-a-secret';
 assert.equal((await route.POST(request('https://evil.invalid'))).status,403);assert.equal(providerCalls,0);
 for(const denied of [null,{...session,role:'reader'},{...session,organizationStatus:'read_only'},{...session,role:'member',moduleProfile:'time_only'}]){const owner=session;session=denied;assert.ok([401,403].includes((await route.POST(request())).status));session=owner;}assert.equal(providerCalls,0);
 denyRate=true;assert.equal((await route.POST(request())).status,429);assert.equal(providerCalls,0);denyRate=false;
 const response=await route.POST(request());assert.equal(response.status,200);assert.equal((await response.json()).total,12.35);assert.equal(providerCalls,1);assert.deepEqual(scopes.at(-1),['receipt-scan:tenant-one:actor-one',20,60000]);
 const bad=new NextRequest('https://app.fixture.invalid/api/expenses/scan-receipt',{method:'POST',headers:{origin:'https://app.fixture.invalid','content-type':'multipart/form-data; boundary=missing'},body:'malformed'});assert.equal((await route.POST(bad)).status,400);assert.equal(providerCalls,1);
 process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT='';assert.equal((await route.POST(request())).status,503);assert.equal(providerCalls,1);
}finally{if(oldAppUrl===undefined)delete process.env.APP_URL;else process.env.APP_URL=oldAppUrl;if(oldEndpoint===undefined)delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;else process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT=oldEndpoint;if(oldKey===undefined)delete process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;else process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY=oldKey;delete globalThis.__receiptFixture;}
console.log('Receipt scan: actual owner/route, credential-bound URL and redirect denial, bounded JSON/polls/cancellation, typed uncertain suggestions, CSRF/RBAC/read-only/profile/rate denial and malformed-upload boundaries passed. No real provider called or expense booked.');
