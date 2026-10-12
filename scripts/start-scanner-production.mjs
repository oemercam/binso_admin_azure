import {spawn} from 'node:child_process';
import {startScannerBridge} from './scanner-bridge.mjs';
import {scannerVersion} from '../lib/server/clamav-protocol.mjs';

let closeBridge;
if(process.env.BINSO_SCANNER_SIDECAR==='true'){
 process.umask(0o077);
 if(process.env.FILE_SCAN_SOCKET!=='/tmp/binso-scanner/clamd.sock')throw Error('Scanner socket configuration mismatch');
 closeBridge=await startScannerBridge();
}
const server=spawn(process.execPath,['server.js'],{env:{...process.env,HOSTNAME:'0.0.0.0'},stdio:'inherit'});
let previous,stopping=false;
const health=closeBridge?setInterval(()=>{void scannerVersion({socketPath:process.env.FILE_SCAN_SOCKET,deadline:Date.now()+1000}).then(()=>record('ready'),()=>record('unavailable'));},60000):undefined;
function record(state){if(state!==previous){previous=state;console.log(JSON.stringify({category:'file_scan_health',state}));}}
async function stop(signal){if(stopping)return;stopping=true;clearInterval(health);server.kill(signal);await closeBridge?.();}
process.once('SIGTERM',()=>{void stop('SIGTERM');});process.once('SIGINT',()=>{void stop('SIGINT');});
server.once('error',()=>{void stop('SIGTERM').finally(()=>{process.exitCode=1;});});
server.once('exit',(code)=>{void stop('SIGTERM').finally(()=>{process.exitCode=code??1;});});
