import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {moduleUrl} from './data-test-modules.mjs';
const {authRequest}=await import(moduleUrl(await fs.readFile('lib/client/auth-request.ts','utf8')));
const original=globalThis.fetch;
let calls=0;
try{
 globalThis.fetch=async(path,options)=>{calls++;assert.equal(path,'/api/auth/register');assert.ok(options.signal instanceof AbortSignal);assert.equal(options.method,'POST');return Response.json({ok:true},{status:201})};
 assert.equal((await authRequest('/api/auth/register',{method:'POST'})).status,201);assert.equal(calls,1);
 await assert.rejects(authRequest('https://fixture.invalid/api/auth/register'));assert.equal(calls,1,'Reject external destinations before sending');
 globalThis.fetch=async()=>{calls++;throw new DOMException('Synthetic timeout','TimeoutError')};
 await assert.rejects(authRequest('/api/auth/register',{method:'POST'}),/dauert zu lange/);assert.equal(calls,2,'Never silently replay a timed-out account creation');
 globalThis.fetch=async()=>{calls++;throw new TypeError('Synthetic offline')};
 await assert.rejects(authRequest('/api/auth/register'),/Keine Verbindung/);assert.equal(calls,3);
 globalThis.fetch=async()=>Response.json({error:'registration_unavailable'},{status:409});
 assert.equal((await authRequest('/api/auth/register')).status,409,'HTTP business conflicts remain available to the caller');
 console.log('Auth requests: bounded AbortSignal, no external target, timeout/offline distinction, no automatic mutation retry and preserved HTTP conflicts passed.');
}finally{globalThis.fetch=original;}
