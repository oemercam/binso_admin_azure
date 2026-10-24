import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import {moduleUrl} from './data-test-modules.mjs';
const next=moduleUrl('export class NextResponse{static json(value,init){return Response.json(value,init)}}');
const http=await import(moduleUrl((await fs.readFile('lib/server/http.ts','utf8')).replace('"next/server"',JSON.stringify(next))));
let reads=0,cancelled=false;
const stream=new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array(8))},cancel(){cancelled=true}});
await assert.rejects(()=>http.readBoundedBody(new Request('https://fixture.invalid',{method:'POST',body:stream,duplex:'half'}),12),e=>e.status===413);assert.ok(cancelled);assert.ok(reads<=3,'Stop oversized chunked bodies without consuming all chunks');
const exact=new Request('https://fixture.invalid',{method:'POST',body:'ä'});assert.equal((await http.readBoundedBody(exact,2)).toString(),'ä');
await assert.rejects(()=>http.readBoundedBody(new Request('https://fixture.invalid',{method:'POST',headers:{'content-length':'100'},body:'x'}),12),e=>e.status===413);
await assert.rejects(()=>http.readJson(new Request('https://fixture.invalid',{method:'POST',body:'not json'})),e=>e.status===400);
assert.deepEqual(await http.readJson(new Request('https://fixture.invalid',{method:'POST',body:'{"ok":true}'})),{ok:true});
const savedOrigin=process.env.NEXT_PUBLIC_APP_URL,savedAppUrl=process.env.APP_URL;
try{
 process.env.APP_URL='https://app.fixture.invalid';
 process.env.NEXT_PUBLIC_APP_URL='https://app.fixture.invalid';
 const request=origin=>({nextUrl:new URL('https://fixture.invalid/api'),headers:new Headers({origin,'x-forwarded-host':'attacker.invalid','x-forwarded-proto':'https'})});
 http.assertSameOrigin(request('https://app.fixture.invalid'));
 http.assertSameOrigin(request('https://fixture.invalid'));
 assert.throws(()=>http.assertSameOrigin(request('https://attacker.invalid')),e=>e.status===403);
}finally{if(savedOrigin===undefined)delete process.env.NEXT_PUBLIC_APP_URL;else process.env.NEXT_PUBLIC_APP_URL=savedOrigin;if(savedAppUrl===undefined)delete process.env.APP_URL;else process.env.APP_URL=savedAppUrl;}
const limited=http.apiError(new Response('private detail',{status:429,headers:{'Retry-After':'37','Set-Cookie':'secret'}}));
assert.equal(limited.headers.get('retry-after'),'37');assert.equal(limited.headers.get('set-cookie'),null);
assert.equal(http.json({ok:true},200,new Headers({'X-Fixture':'preserved'})).headers.get('x-fixture'),'preserved');
const storageEnv=moduleUrl('export const env={azureStorageAccount:"fixture",azureStorageContainer:"private",azureStorageSas:"fixture-sas"}');
const storage=await import(moduleUrl((await fs.readFile('lib/server/storage.ts','utf8')).replace('import "server-only";','').replace('"@/lib/server/env"',JSON.stringify(storageEnv))));
const savedFetch=globalThis.fetch;let storageCalls=0;
try{
 globalThis.fetch=async(url,init)=>{storageCalls++;assert.ok(init.signal instanceof AbortSignal);assert.equal(init.redirect,'error');return new Response('fixture',{status:200});};
 await storage.putBlob({path:'fixture.txt',contentType:'text/plain',body:Buffer.from('fixture')});
 await storage.getBlobByUrl('https://fixture.blob.core.windows.net/private/fixture.txt');
 await storage.deleteBlobByUrl('https://fixture.blob.core.windows.net/private/fixture.txt');
 assert.equal(storageCalls,3);
}finally{globalThis.fetch=savedFetch;}
const nextConfig=(await import(moduleUrl(await fs.readFile('next.config.ts','utf8')))).default;
const routeHeaders=await nextConfig.headers();
for(const route of ['angebote','finanzen','projekte','einladung','email-bestaetigen','portal/login','portal/registrieren']){
 const rule=routeHeaders.find(rule=>rule.source==='/'+route+'/:path*');
 assert.ok(rule?.headers.some(header=>header.key==='Cache-Control'&&header.value.includes('no-store')),'Private route must prohibit storage: '+route);
}
const logger=await import(moduleUrl((await fs.readFile('lib/server/logger.ts','utf8')).replace('import "server-only";','')));
const error=console.error,captured=[];console.error=(...args)=>captured.push(args);
try{logger.log('error','fixed_event',{detail:'synthetic-sensitive-marker',nested:{access_token:'synthetic-token',email:'fixture@fixture.invalid'},status:503});http.apiError(new Error('synthetic-sensitive-marker'));}finally{console.error=error}
assert.ok(!JSON.stringify(captured).includes('synthetic-sensitive-marker'));assert.ok(!JSON.stringify(captured).includes('synthetic-token'));assert.ok(JSON.stringify(captured).includes('503'));
const events={},deleted=[],keys=['binso-one-shell-v6','binso-one-shell-v7','binso-one-shell-v8','other-app-cache','binso-other-feature'];let claimed=false;
vm.runInNewContext(await fs.readFile('public/sw.js','utf8'),{self:{location:{origin:'https://fixture.invalid'},clients:{claim:()=>{claimed=true}},addEventListener:(name,fn)=>events[name]=fn},caches:{keys:async()=>keys,delete:async key=>deleted.push(key)},URL});
let activated;events.activate({waitUntil:promise=>activated=promise});await activated;assert.deepEqual(deleted,['binso-one-shell-v6','binso-one-shell-v7']);assert.ok(claimed);
await import('./package-patches-test.mjs');
console.log('Bounded chunked/UTF-8/declared-size/JSON reads, sensitive-log suppression and service-worker owned-cache cleanup passed.');
