import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
const root=await fs.mkdtemp(path.join(os.tmpdir(),'binso-launcher-'));
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 await fs.mkdir(path.join(root,'scripts'));await fs.mkdir(path.join(root,'lib/server'),{recursive:true});
 for(const file of ['scripts/start-scanner-production.mjs','scripts/scanner-bridge.mjs','lib/server/clamav-protocol.mjs'])await fs.copyFile(file,path.join(root,file));
 for(const test of [
  {name:'exit status',body:'setTimeout(()=>process.exit(7),30)',expected:7},
  {name:'unexpected worker signal',body:'setTimeout(()=>process.kill(process.pid,"SIGKILL"),30)',expected:137},
  {name:'graceful termination',body:'process.on("SIGTERM",()=>setTimeout(()=>process.exit(0),30));setInterval(()=>{},1000)',signal:'SIGTERM',expected:0},
  {name:'interrupt forwarding',body:'setInterval(()=>{},1000)',signal:'SIGINT',expected:130},
  {name:'bounded stuck worker',body:'process.on("SIGTERM",()=>{});setInterval(()=>{},1000)',signal:'SIGTERM',expected:137,timeout:true},
 ]){
  await fs.writeFile(path.join(root,'server.js'),'console.log("WORKER:"+process.pid);'+test.body);
  const launcher=spawn(process.execPath,[path.join(root,'scripts/start-scanner-production.mjs')],{env:{...process.env,BINSO_SCANNER_SIDECAR:'false'},stdio:['ignore','pipe','pipe']});
  let logs='',workerPid,timeout;
  const ended=new Promise((resolve,reject)=>{launcher.once('error',reject);launcher.once('exit',(code,signal)=>resolve({code,signal}))});
  try{
   const ready=new Promise((resolve,reject)=>{
    timeout=setTimeout(()=>reject(Error('Worker fixture did not start')),5000);
    launcher.stdout.on('data',data=>{logs+=data;const match=logs.match(/WORKER:(\d+)/);if(match){workerPid=Number(match[1]);clearTimeout(timeout);resolve()}});
   });
   launcher.stderr.on('data',data=>{logs+=data});await ready;
   const start=performance.now();if(test.signal)launcher.kill(test.signal);
   const guard=setTimeout(()=>launcher.kill('SIGKILL'),14000);
   const result=await ended;clearTimeout(guard);
   assert.equal(result.signal,null,test.name+' must finish through the launcher');assert.equal(result.code,test.expected,test.name+': '+logs);
   if(test.timeout){assert.ok(performance.now()-start>=9900,'The normal grace period must be offered');assert.match(logs,/worker_timeout/);}
   for(let attempt=0;attempt<50;attempt++){try{process.kill(workerPid,0)}catch{workerPid=undefined;break}await wait(10)}
   assert.equal(workerPid,undefined,test.name+' cannot leave an orphan worker');
  }finally{clearTimeout(timeout);if(launcher.exitCode===null&&launcher.signalCode===null)launcher.kill('SIGKILL');if(workerPid)try{process.kill(workerPid,'SIGKILL')}catch{}}
 }
 console.log('Actual runtime launcher: normal exit, unexpected signal, graceful SIGTERM, SIGINT and bounded stubborn-worker shutdown without orphans passed.');
}finally{await fs.rm(root,{recursive:true,force:true})}
