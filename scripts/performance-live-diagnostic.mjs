import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import {writeTestOutput} from './test-output.mjs';
const argument=name=>{const index=process.argv.indexOf(name);return index<0?undefined:process.argv[index+1]};
const origin=new URL(argument('--base')??'invalid:');
assert.ok(origin.protocol==='https:'&&!origin.username&&!origin.password&&origin.pathname==='/'&&!origin.search&&!origin.hash,'Use a public HTTPS origin without credentials or query parameters');
const output=argument('--output');assert.ok(output,'Use --output <report.json>');
// One curl process permits real HTTP connection reuse. No account, cookies,
// credentials, concurrent load or production mutations are used.
const targets=['/api/health','/login','/brand/icon-black.svg'];
const format=JSON.stringify({url:'%{url_effective}',status:'%{http_code}',dnsSeconds:'%{time_namelookup}',connectSeconds:'%{time_connect}',tlsSeconds:'%{time_appconnect}',readySeconds:'%{time_pretransfer}',firstByteSeconds:'%{time_starttransfer}',totalSeconds:'%{time_total}',newConnections:'%{num_connects}',httpVersion:'%{http_version}'})+'\n';
const args=['--silent','--show-error','--compressed','--max-time','25','--write-out',format];
for(let cycle=0;cycle<3;cycle++)for(const target of targets)args.push('--output','/dev/null',new URL(target,origin).href);
const {stdout}=await promisify(execFile)('curl',args,{timeout:240000,maxBuffer:128*1024});
const samples=stdout.trim().split('\n').map(line=>{
 const data=JSON.parse(line);for(const key of Object.keys(data))if(key.endsWith('Seconds')||key==='status'||key==='newConnections')data[key]=Number(data[key]);
 data.afterConnectionReadyMs=Math.round((data.firstByteSeconds-data.readySeconds)*10000)/10;
 return data;
});
assert.equal(samples.length,9);for(const sample of samples)assert.equal(sample.status,200,sample.url);
const report={measuredAt:new Date().toISOString(),base:origin.origin,mode:'Nine sequential read-only public requests in one curl process; HTTP connection reuse enabled',limits:['This environment includes an HTTPS egress/proxy path. TLS timing cannot be attributed to Azure or an end-user device.','After-connection-ready timing includes request transit, proxy and application; it is not pure server execution time.','No browser rendering, logged-in data or phone connection measured.'],samples};
await fs.mkdir(path.dirname(output),{recursive:true});await writeTestOutput(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
