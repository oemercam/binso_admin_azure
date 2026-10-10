import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createServer} from 'node:net';
import {duplexPair} from 'node:stream';
import {moduleUrl} from './data-test-modules.mjs';

// A controlled clamd protocol peer, not an antivirus engine or a malware-detection claim.
const http=moduleUrl(`export class ApiError extends Error{constructor(status,code,message){super(message);this.status=status;this.code=code}}`);
const memory=process.env.BINSO_FILE_SCAN_PROTOCOL_TEST_TRANSPORT==='memory';
let source=await fs.readFile('lib/server/file-scan.ts','utf8');
source=source.replace('import "server-only";','').replace('"@/config/limits"',JSON.stringify(moduleUrl('export const limitsConfig={maxFileUploadBytes:10*1024*1024}'))).replace('"./env"',JSON.stringify(moduleUrl('export const env={}'))).replace('"./http"',JSON.stringify(http));
if(memory)source=source.replace('"node:net"',JSON.stringify(moduleUrl('export const createConnection=(...args)=>globalThis.__scanConnectionFactory(...args)')));
const {scanFile}=await import(moduleUrl(source));
assert.equal(await scanFile(Buffer.from('synthetic')), 'pending');
await assert.rejects(scanFile(Buffer.alloc(10*1024*1024+1)),e=>e.status===413);
await assert.rejects(scanFile(Buffer.from('synthetic'),{socketPath:'relative.sock'}),e=>e.status===503);
const directory=await fs.mkdtemp(path.join(os.tmpdir(),'binso-scan-'));
let cases=0;
async function peer({reply,fragment=false,drop=false,stall=false,early=false,bytes=Buffer.from('synthetic'),timeoutMs=1000,expected='clean'}){
 const socketPath=path.join(directory,`s${cases++}.sock`),sockets=new Set();let received;
 const handleSocket=socket=>{
  sockets.add(socket);socket.on('close',()=>sockets.delete(socket));socket.on('error',()=>{});
  if(early){socket.end('stream: OK\0');return;}
  let buffered=Buffer.alloc(0),command=false;const chunks=[];
  socket.on('data',data=>{
   buffered=Buffer.concat([buffered,data]);
   if(!command){if(buffered.length<10)return;assert.equal(buffered.subarray(0,10).toString(),'zINSTREAM\0');buffered=buffered.subarray(10);command=true;}
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
  if(!early)assert.deepEqual(received,bytes,'Scanner receives exactly the persisted bytes, including chunk boundaries');
 }finally{for(const socket of sockets)socket.destroy();if(server)await new Promise(resolve=>server.close(resolve));delete globalThis.__scanConnectionFactory;}
}
try{
 await peer({reply:'stream: OK\0',fragment:true,bytes:Buffer.alloc(140001,0x61)});
 await peer({reply:'stream: Synthetic-Test FOUND\0',expected:'rejected'});
 for(const reply of ['stream: OK','stream: OK\0stream: Other FOUND\0','stream: read ERROR\0','other: OK\0','stream: OK\0\n','x'.repeat(1025),''])await peer({reply,expected:503});
 await peer({drop:true,expected:503});
 await peer({stall:true,timeoutMs:50,expected:503});
 await peer({early:true,bytes:Buffer.alloc(10*1024*1024),expected:503});
 if(memory)globalThis.__scanConnectionFactory=()=>{const [socket,peer]=duplexPair();queueMicrotask(()=>{socket.emit('error',new Error('synthetic unavailable socket'));peer.destroy()});return socket;};
 await assert.rejects(scanFile(Buffer.from('synthetic'),{socketPath:path.join(directory,'missing.sock')}),e=>e.status===503);
 console.log('File scanner: bounded exact-byte INSTREAM, fragmented clean verdict, rejection, malformed/contradictory/oversized replies, disconnect, total deadline, early reply and unavailable socket passed ('+(memory?'in-memory duplex transport; OS socket not tested':'real Unix socket')+'; protocol peer only, not an antivirus engine).');
 delete globalThis.__scanConnectionFactory;
}finally{await fs.rm(directory,{recursive:true,force:true});}
