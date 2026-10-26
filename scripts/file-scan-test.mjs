import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {duplexPair} from 'node:stream';
import {moduleUrl} from './data-test-modules.mjs';

// A controlled clamd protocol peer, not an antivirus engine or a malware-detection claim.
const http=moduleUrl(`export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}`);
const memory=process.env.BINSO_FILE_SCAN_PROTOCOL_TEST_TRANSPORT==='memory'||process.platform==='win32';
globalThis.__scanTestEnv={};
let source=await fs.readFile('lib/server/file-scan.ts','utf8');
let protocol=await fs.readFile('lib/server/clamav-protocol.mjs','utf8');
if(memory)protocol=protocol.replace("'node:net'",JSON.stringify(moduleUrl('export const createConnection=(...args)=>globalThis.__scanConnectionFactory(...args)')));
source=source.replace('"./clamav-protocol.mjs"',JSON.stringify(moduleUrl(protocol)));
source=source.replace('import "server-only";','').replace('"@/config/limits"',JSON.stringify(moduleUrl('export const limitsConfig={maxFileUploadBytes:10*1024*1024}'))).replace('"./env"',JSON.stringify(moduleUrl('export const env=globalThis.__scanTestEnv'))).replace('"./http"',JSON.stringify(http));
if(memory)source=source.replace('"node:net"',JSON.stringify(moduleUrl('export const createConnection=(...args)=>globalThis.__scanConnectionFactory(...args)')));
const {scanFile}=await import(moduleUrl(source));
assert.equal(await scanFile(Buffer.from('synthetic')), 'pending');
globalThis.__scanTestEnv.fileAccessMode='clean-only';
await assert.rejects(scanFile(Buffer.from('synthetic')),e=>e.status===503&&e.code==='file_scan_unavailable','Clean-only uploads must fail before persisting unusable files when no scanner exists');
delete globalThis.__scanTestEnv.fileAccessMode;
await assert.rejects(scanFile(Buffer.alloc(10*1024*1024+1)),e=>e.status===413);
await assert.rejects(scanFile(Buffer.from('synthetic'),{socketPath:'relative.sock'}),e=>e.status===503);
await assert.rejects(scanFile(Buffer.from('synthetic'),{socketPath:'C:\\synthetic\\scanner.sock'}),e=>e.status===503,'A Windows path must not be accepted as a production Unix socket');
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'binso-scan-'));
let cases=0;
async function peer({reply,fragment=false,drop=false,stall=false,early=false,bytes=Buffer.from('synthetic'),timeoutMs=1000,expected='clean',versionReply,expectBytes=true}){
 const id=cases++,socketPath=memory?`/synthetic-protocol/s${id}.sock`:path.join(directory,`s${id}.sock`),sockets=new Set();let received,versions=0;
 // Signature publication time belongs to a database version, not the current
 // wall-clock second of each VERSION request. Keep the peer stable per scan.
 const stableVersion='ClamAV 1.4.6/28000/'+new Date().toUTCString().replace('GMT','')+'\0';
 const handleSocket=socket=>{
  sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});
  if(early){socket.end('stream: OK\0');return;}
  let buffered=Buffer.alloc(0),command=false;const chunks=[];
  socket.on('data',data=>{
   buffered=Buffer.concat([buffered,data]);
   if(!command){
    const end=buffered.indexOf(0);if(end<0)return;
    const name=buffered.subarray(0,end+1).toString();
    if(name==='zVERSION\0'){socket.end(typeof versionReply==='function'?versionReply(++versions):versionReply??stableVersion);return;}
    assert.equal(name,'zINSTREAM\0');buffered=buffered.subarray(end+1);command=true;
   }
   while(buffered.length>=4){
    const length=buffered.readUInt32BE(0);assert.ok(length<=64*1024);
    if(buffered.length<4+length)return;const chunk=buffered.subarray(4,4+length);buffered=buffered.subarray(4+length);
    if(length){chunks.push(chunk);continue;}
    assert.equal(buffered.length,0);received=Buffer.concat(chunks);
    if(stall)return;if(drop){socket.destroy();return;}
    if(fragment){socket.write(reply.slice(0,4));setImmediate(()=>socket.end(reply.slice(4)));}
    else socket.end(reply);
    return;
   }
  });
 };
 const server=memory?null:createServer(handleSocket);
 if(memory)globalThis.__scanConnectionFactory=()=>{const [client,peer]=duplexPair();sockets.add(client);queueMicrotask(()=>{handleSocket(peer);client.emit('connect')});return client;};
 else await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve)});
 try{
  const result=scanFile(bytes,{socketPath,timeoutMs});
  if(typeof expected==='number')await assert.rejects(result,e=>e.status===expected&&e.code==='file_scan_unavailable');
  else assert.equal(await result,expected);
  if(!early&&expectBytes)assert.deepEqual(received,bytes,'Scanner receives exactly the persisted bytes, including chunk boundaries');
  if(!expectBytes)assert.equal(received,undefined,'Unqualified scanner does not receive upload bytes');
 }finally{for(const socket of sockets)socket.destroy();if(server)await new Promise(resolve=>server.close(resolve));delete globalThis.__scanConnectionFactory;}
}
try{
 await peer({reply:'stream: OK\0',fragment:true,bytes:Buffer.alloc(140001,0x61)});
 await peer({reply:'stream: Synthetic-Test FOUND\0',expected:'rejected'});
 for(const reply of ['stream: OK','stream: OK\0stream: Other FOUND\0','stream: read ERROR\0','other: OK\0','stream: OK\0\n','x'.repeat(1025),''])await peer({reply,expected:503});
 await peer({drop:true,expected:503});
 await peer({stall:true,timeoutMs:50,expected:503});
 await peer({early:true,bytes:Buffer.alloc(10*1024*1024),expected:503});
 for(const versionReply of ['not a scanner\0','ClamAV 1.4.3/28000/'+new Date().toUTCString().replace('GMT','')+'\0','ClamAV 1.4.6/28000/Mon Jan 01 00:00:00 2024\0','ClamAV 1.4.6/28000/Mon Jan 01 00:00:00 2035\0'])await peer({versionReply,expected:503,expectBytes:false});
 await peer({reply:'stream: OK\0',versionReply:n=>'ClamAV 1.4.6/'+(28000+n)+'/'+new Date().toUTCString().replace('GMT','')+'\0',expected:503});
 if(memory)globalThis.__scanConnectionFactory=()=>{const [socket,peer]=duplexPair();queueMicrotask(()=>{socket.emit('error',new Error('synthetic unavailable socket'));peer.destroy()});return socket;};
 await assert.rejects(scanFile(Buffer.from('synthetic'),{socketPath:path.join(directory,'missing.sock')}),e=>e.status===503);
 console.log('File scanner: bounded exact-byte INSTREAM, fragmented clean verdict, rejection, malformed/contradictory/oversized replies, disconnect, total deadline, early reply and unavailable socket passed ('+(memory?'in-memory duplex transport; OS socket not tested':'real Unix socket')+'; protocol peer only, not an antivirus engine).');
 delete globalThis.__scanConnectionFactory;
}finally{await fs.rm(directory,{recursive:true,force:true});}
