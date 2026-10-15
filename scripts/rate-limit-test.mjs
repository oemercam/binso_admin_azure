import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const env={appMode:'local',databaseUrl:undefined};
let databaseCount=0;const calls=[];
globalThis.__v24RateLimit={env,query:async(sql,params)=>{calls.push({sql,params});return {rows:[{count:++databaseCount,reset_at:new Date(Date.now()+1000)}]}}};
const source=(await fs.readFile('lib/server/rate-limit.ts','utf8')).replace('import "server-only";','').replace('import {env} from "@/lib/server/env";','const env=globalThis.__v24RateLimit.env;').replace('import {query} from "@/lib/server/db";','const query=globalThis.__v24RateLimit.query;').replace('import {limitsConfig} from "@/config/limits";','const limitsConfig={rateLimitMemoryBuckets:3};');
const {enforceRateLimit}=await import(moduleUrl(source));
const request=ip=>({headers:new Headers({'x-forwarded-for':ip})});
const limited=promise=>assert.rejects(promise,e=>e instanceof Response&&e.status===429&&Number(e.headers.get('retry-after'))>=1);
const clock=Date.now;let now=100000;Date.now=()=>now;
try{
 await enforceRateLimit(request('1'),'login',2,1000);await enforceRateLimit(request('1'),'login',2,1000);
 await limited(enforceRateLimit(request('1'),'login',2,1000));
 await enforceRateLimit(request('2'),'login',2,5000);await enforceRateLimit(request('3'),'login',2,5000);
 await limited(enforceRateLimit(request('4'),'login',2,5000));
 await limited(enforceRateLimit(request('1'),'login',2,1000)); // Capacity never evicts an active exhausted key.
 now+=1000;
 await enforceRateLimit(request('4'),'login',2,5000); // Expiry is reclaimed on the new-key path.
 await limited(enforceRateLimit(request('5'),'login',2,5000));
 now+=5000;await enforceRateLimit(request('5'),'login',2,1000);
 // Distributed production mode still uses its atomic PostgreSQL counter.
 env.appMode='production';env.databaseUrl='synthetic';
 await enforceRateLimit(request('6'),'login',1,1000);await limited(enforceRateLimit(request('6'),'login',1,1000));
 assert.equal(calls.length,2);assert.match(calls[0].params[0],/^[a-f0-9]{64}$/);assert.equal(calls[0].params[0],calls[1].params[0]);
 assert.equal(calls[0].params[1],'1');
 console.log('Actual rate limiter: bounded new-key capacity, no active-key eviction, expiry reuse, retry delays and atomic production database path passed.');
}finally{Date.now=clock;delete globalThis.__v24RateLimit;}
