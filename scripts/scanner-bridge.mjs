import fs from 'node:fs/promises';
import path from 'node:path';
import {createServer,createConnection} from 'node:net';

// Azure code-app sidecars share localhost, but not a mountable Unix-socket volume.
// The app-facing endpoint remains a private Unix socket. No remote host or public TCP listener.
export async function startScannerBridge(socketPath='/tmp/binso-scanner/clamd.sock'){
 if(socketPath!=='/tmp/binso-scanner/clamd.sock')throw Error('Unexpected scanner socket');
 const directory=path.dirname(socketPath);await fs.mkdir(directory,{recursive:false,mode:0o700}).catch(error=>{if(error.code!=='EEXIST')throw error;});
 const info=await fs.lstat(directory);
 if(!info.isDirectory()||info.isSymbolicLink()||info.uid!==process.getuid())throw Error('Scanner directory is not privately owned');
 await fs.chmod(directory,0o700);
 try{
  const old=await fs.lstat(socketPath);if(!old.isSocket()||old.uid!==process.getuid())throw Error('Unexpected scanner socket owner');
  await new Promise((resolve,reject)=>{const probe=createConnection({path:socketPath});const timer=setTimeout(()=>{probe.destroy();reject(Error('Existing scanner socket did not respond'));},1000);probe.once('connect',()=>{clearTimeout(timer);probe.destroy();reject(Error('Scanner bridge already running'));});probe.once('error',error=>{clearTimeout(timer);probe.destroy();['ECONNREFUSED','ENOENT'].includes(error.code)?resolve():reject(Error('Cannot replace scanner socket'));});});
  await fs.unlink(socketPath);
 }catch(error){if(error.code!=='ENOENT')throw error;}
 const connections=new Set();
 const server=createServer(client=>{
  connections.add(client);let upstream,command=Buffer.alloc(0),kind,wireBytes=0,replyBytes=0;
  const timer=setTimeout(()=>stop(),15000);
  const stop=()=>{clearTimeout(timer);client.destroy();upstream?.destroy();connections.delete(client);};
  client.on('error',stop);client.on('close',stop);
  client.on('data',data=>{
   wireBytes+=data.length;if(wireBytes>10*1024*1024+65536){stop();return;}
   if(!kind){
    command=Buffer.concat([command,data]);const end=command.indexOf(0);
    if(end<0){if(command.length>10)stop();return;}
    const name=command.subarray(0,end+1).toString();
    if(!['zINSTREAM\0','zVERSION\0'].includes(name)||name==='zVERSION\0'&&command.length!==end+1){stop();return;}
    kind=name;
    upstream=createConnection({host:'127.0.0.1',port:3310});upstream.on('error',stop);
    upstream.on('data',reply=>{replyBytes+=reply.length;if(replyBytes>1024){stop();return;}if(!client.write(reply))upstream.pause();});
    client.on('drain',()=>upstream.resume());upstream.on('drain',()=>client.resume());
    upstream.on('end',()=>{clearTimeout(timer);client.end();});
    upstream.on('close',()=>{if(!upstream.readableEnded)stop();});
    if(!upstream.write(command))client.pause();command=Buffer.alloc(0);
   }else{
    if(kind==='zVERSION\0'){stop();return;}
    if(!upstream.write(data))client.pause();
   }
  });
 });
 server.maxConnections=8;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve);});await fs.chmod(socketPath,0o600);
 return async()=>{for(const connection of connections)connection.destroy();await new Promise(resolve=>server.close(resolve));await fs.unlink(socketPath).catch(error=>{if(error.code!=='ENOENT')throw error;});};
}
