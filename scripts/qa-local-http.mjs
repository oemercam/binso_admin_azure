/** Local HTTP validation: keep server and checks in the same process lifetime. */
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import fs from 'node:fs';
import {setTimeout as delay} from 'node:timers/promises';
if(!fs.existsSync('.next/BUILD_ID'))throw new Error('Run the production build before local HTTP QA.');
// Reserve a free loopback port; never probe an unidentified existing application.
const port=await new Promise((resolve,reject)=>{
 const probe=createServer();probe.once('error',reject);probe.listen({host:'127.0.0.1',port:0},()=>{
  const chosen=probe.address().port;probe.close(error=>error?reject(error):resolve(chosen));
 });
});
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{stdio:['ignore','pipe','pipe']});
let logs='',startError;
server.on('error',error=>{startError=error;});
server.stdout.on('data',data=>{logs+=data;});server.stderr.on('data',data=>{logs+=data;});
let checker;
const stop=()=>{checker?.kill();server.kill();};
const onSignal=()=>{stop();process.exitCode=130;};
process.once('SIGINT',onSignal);process.once('SIGTERM',onSignal);
try{
 const base=`http://127.0.0.1:${port}`;let ready=false;
 for(let attempt=0;attempt<150;attempt++){
  if(startError)throw startError;
  if(server.exitCode!==null||server.signalCode!==null)throw new Error('Local server exited: '+logs);
  if(process.exitCode===130)throw new Error('Local QA interrupted');
  if(/Ready in/.test(logs)){
   try{const response=await fetch(base+'/login',{signal:AbortSignal.timeout(2000)});if(response.ok){ready=true;break;}}catch{}
  }
  await delay(200);
 }
 if(!ready)throw new Error('Local server readiness timeout: '+logs);
 checker=spawn(process.execPath,['scripts/check-route-css.mjs'],{stdio:'inherit',env:{...process.env,BINSO_BASE_URL:base}});
 await new Promise((resolve,reject)=>{checker.once('error',reject);checker.once('exit',(code,signal)=>code===0?resolve():reject(new Error(`Local route/CSS checks failed: ${code??signal}`)));});
 console.log('Local HTTP QA passed. Browser, Unix-socket scanner and device acceptance are separate checks.');
}finally{
 stop();process.removeListener('SIGINT',onSignal);process.removeListener('SIGTERM',onSignal);
}
