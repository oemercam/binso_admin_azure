import {createConnection} from 'node:net';
import {createHash} from 'node:crypto';
const unavailable=()=>new Error('Scanner verification unavailable');
export async function scannerVersion({socketPath,deadline,maxSignatureAgeMs=72*3600000}){
 const response=await exchange(socketPath,deadline,async write=>write(Buffer.from('zVERSION\0')));
 const match=response.match(/^ClamAV (\d+)\.(\d+)\.(\d+)\/(\d+)\/([^\x00\r\n]+)\0$/);
 if(!match)throw unavailable();
 const [,major,minor,patch,signatures,date]=match;
 if(Number(major)!==1||!(Number(minor)===4&&Number(patch)>=6||Number(minor)===5&&Number(patch)>=4))throw unavailable();
 const timestamp=Date.parse(date+' UTC'),age=Date.now()-timestamp;
 if(!Number.isSafeInteger(Number(signatures))||Number(signatures)<=0||!Number.isFinite(timestamp)||age< -300000||age>maxSignatureAgeMs)throw unavailable();
 return {engine:'ClamAV',engineVersion:major+'.'+minor+'.'+patch,signaturesVersion:Number(signatures),signaturesAt:new Date(timestamp).toISOString()};
}
export async function scanBytes(body,{socketPath,maxBytes=10*1024*1024,timeoutMs=15000}){
 if(!Buffer.isBuffer(body)||body.length===0||body.length>maxBytes||!socketPath?.startsWith('/')||!Number.isFinite(timeoutMs)||timeoutMs<=0||timeoutMs>15000)throw unavailable();
 const startedAt=new Date().toISOString(),deadline=Date.now()+timeoutMs;
 const before=await scannerVersion({socketPath,deadline});
 const response=await exchange(socketPath,deadline,async write=>{
  await write(Buffer.from('zINSTREAM\0'));
  for(let offset=0;offset<body.length;offset+=65536){
   const chunk=body.subarray(offset,offset+65536),length=Buffer.alloc(4);length.writeUInt32BE(chunk.length);
   await write(Buffer.concat([length,chunk]));
  }
  await write(Buffer.alloc(4));
 });
 let status;
 if(response==='stream: OK\0')status='clean';
 else if(/^stream: [^\x00\r\n]+ FOUND\0$/.test(response))status='rejected';
 else throw unavailable();
 const after=await scannerVersion({socketPath,deadline});
 if(JSON.stringify(before)!==JSON.stringify(after))throw unavailable();
 return {status,evidence:{...after,sha256:createHash('sha256').update(body).digest('hex'),startedAt,completedAt:new Date().toISOString()}};
}
function exchange(socketPath,deadline,send){
 return new Promise((resolve,reject)=>{
  const remaining=deadline-Date.now();if(remaining<=0){reject(unavailable());return;}
  const socket=createConnection({path:socketPath});let reply=Buffer.alloc(0),sent=false,settled=false;
  const finish=(ok=false)=>{if(settled)return;settled=true;clearTimeout(timer);socket.destroy();ok?resolve(reply.toString('utf8')):reject(unavailable());};
  const timer=setTimeout(()=>finish(),remaining);
  socket.on('error',()=>finish());socket.on('close',()=>finish());
  socket.on('data',chunk=>{if(!sent||reply.length+chunk.length>1024){finish();return;}reply=Buffer.concat([reply,chunk]);});
  socket.on('end',()=>finish(true));
  socket.once('connect',()=>{void (async()=>{
   const write=bytes=>new Promise((done,fail)=>socket.write(bytes,error=>error?fail(error):done()));
   const finalWrite=bytes=>{sent=true;return write(bytes);};
   await send(bytes=>bytes.length===4&&bytes.equals(Buffer.alloc(4))||bytes.toString()==='zVERSION\0'?finalWrite(bytes):write(bytes));
  })().catch(()=>finish());});
 });
}
