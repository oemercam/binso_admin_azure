import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
export function checkAdvisories(report,{now=new Date(),manifest=JSON.parse(fs.readFileSync('package.json','utf8'))}={}){
 const path='.>eslint-config-next>@next/eslint-plugin-next>fast-glob>micromatch>braces';
 const exceptions=[];
 for(const advisory of Object.values(report.advisories??{})){
  if(!['high','critical'].includes(advisory.severity))continue;
  const allowed=advisory.github_advisory_id?.toUpperCase()==='GHSA-VFJ7-8CJW-P6XM'&&advisory.module_name==='braces'&&advisory.severity==='high'&&now<new Date('2026-10-24T00:00:00Z')&&manifest.devDependencies?.['eslint-config-next']&&!manifest.dependencies?.['eslint-config-next']&&advisory.findings?.length>0&&advisory.findings.every(f=>f.version==='3.0.3'&&f.paths?.length>0&&f.paths.every(p=>p===path));
  if(!allowed)throw new Error('Unapproved or expired dependency advisory: '+(advisory.github_advisory_id??advisory.id));
  exceptions.push(advisory.github_advisory_id);
 }
 if(!Object.keys(report.advisories??{}).length)throw new Error('Failed audit without structured advisories');
 return exceptions;
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
 const exceptions=checkAdvisories(report);if(!exceptions.length)throw new Error('Failed audit without approved high/critical findings');
 console.warn('Temporary exact dev-tool exception (expires 2026-10-24): '+exceptions.join(', '));}
}
