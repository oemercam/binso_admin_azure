import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
export function checkAdvisories(report){
 if(!report||!report.advisories||typeof report.advisories!=='object'||Array.isArray(report.advisories))throw new Error('Invalid dependency audit report');
 for(const advisory of Object.values(report.advisories)){
  if(!advisory||!['low','moderate','high','critical'].includes(advisory.severity))throw new Error('Invalid dependency advisory');
  if(['high','critical'].includes(advisory.severity))throw new Error('Blocking dependency advisory: '+(advisory.github_advisory_id??advisory.id));
 }
 return [];
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 // Never allow a development exception to bypass the production dependency gate.
 const production=spawnSync('pnpm',['audit','--prod','--audit-level','high'],{stdio:'inherit',shell:process.platform==='win32'});
 if(production.error)throw production.error;
 if(production.status!==0)throw new Error('Production dependency audit is blocking');
 const result=spawnSync('pnpm',['audit','--audit-level','high','--json'],{encoding:'utf8',shell:process.platform==='win32'});
 if(result.error)throw result.error;
 if(result.status===0)console.log('Full dependency audit passed.');
 else{let report;try{report=JSON.parse(result.stdout)}catch{throw new Error('Dependency audit did not return valid JSON')}
 checkAdvisories(report);throw new Error('Full dependency audit failed without a valid successful exit');}
}
