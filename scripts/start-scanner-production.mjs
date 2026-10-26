import {spawn} from 'node:child_process';
import {constants} from 'node:os';
import {fileURLToPath} from 'node:url';
import {startScannerBridge} from './scanner-bridge.mjs';
import {scannerVersion} from '../lib/server/clamav-protocol.mjs';

let closeBridge;
if(process.env.BINSO_SCANNER_SIDECAR==='true'){
 process.umask(0o077);
 if(process.env.FILE_SCAN_SOCKET!=='/tmp/binso-scanner/clamd.sock')throw Error('Scanner socket configuration mismatch');
 closeBridge=await startScannerBridge();
}
const server=spawn(process.execPath,['server.js'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...process.env,HOSTNAME:'0.0.0.0'},stdio:'inherit'});
let previous,stopping=false,finished=false,shutdownTimer;
const health=closeBridge?setInterval(()=>{void scannerVersion({socketPath:process.env.FILE_SCAN_SOCKET,deadline:Date.now()+1000}).then(()=>record('ready'),()=>record('unavailable'));},60000):undefined;
function record(state){if(state!==previous){previous=state;console.log(JSON.stringify({category:'file_scan_health',state}));}}
let bridgeCleanup;
function cleanupBridge(){
 return bridgeCleanup??=Promise.resolve().then(()=>closeBridge?.()).catch(()=>{
  console.error(JSON.stringify({category:'runtime_shutdown',state:'bridge_cleanup_failed'}));
  if(!process.exitCode)process.exitCode=1;
 });
}
function stop(signal){
 if(stopping||finished)return;
 stopping=true;clearInterval(health);
 // A stuck worker must not leave the launcher hanging during a platform restart.
 shutdownTimer=setTimeout(()=>{
  console.error(JSON.stringify({category:'runtime_shutdown',state:'worker_timeout'}));
  server.kill('SIGKILL');
 },10000);
 shutdownTimer.unref();
 server.kill(signal);void cleanupBridge();
}
function finish(code){
 if(finished)return;finished=true;
 clearInterval(health);clearTimeout(shutdownTimer);process.exitCode=code;
 void cleanupBridge();
}
process.once('SIGTERM',()=>stop('SIGTERM'));process.once('SIGINT',()=>stop('SIGINT'));
server.once('error',()=>finish(1));
server.once('exit',(code,signal)=>finish(code??(signal&&constants.signals[signal]?128+constants.signals[signal]:1)));
