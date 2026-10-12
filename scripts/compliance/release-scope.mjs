import fs from 'node:fs';
import {createHash} from 'node:crypto';
export const scopePath='ux-compliance/release-scope.v1.json';
export function validateScope(scope){
 const valid=scope?.schemaVersion===1&&scope.id==='development-20261012'&&scope.phase==='prelaunch-development'
  &&scope.productionAcceptance===false&&scope.additionalRecurringCost===0&&scope.fileAccessMode==='authenticated-unscanned'
  &&scope.authorization?.at==='2026-10-12T18:25:03Z'&&scope.authorization?.quote==='Ja mach alles damit wir entlich deployen können und sperrendie dateien nicht wir machen später scanner richtig';
 if(!valid)throw new Error('Missing or invalid explicit development release authorization');
 const exact=(key,values)=>Array.isArray(scope[key])&&JSON.stringify([...scope[key]].sort())===JSON.stringify([...values].sort());
 if(!exact('requiredStaticChecks',['UX-NAV-001','UX-NAV-002','UX-FIX-001','UX-ARC-001'])
  ||!exact('requiredMeasuredChecks',['UX-LAY-003'])||!exact('requiredEngines',['chromium','webkit'])
  ||!exact('requiredRouteEngines',['chromium'])
  ||!exact('requiredFixtureStates',['normal','admin','employee','empty','finance','large','negative','no-expenses','partial'])
  ||!exact('deferredProductionEvidence',['trusted-live-scanner-and-existing-file-rescan','complete-432-requirement-approval','named-pixel-and-physical-pwa-approval','full-ingress-spoof-proof','runtime-performance-and-historical-domain-review','alarm-delivery-proof'])
  ||JSON.stringify(scope.excludedRuntimeRoutes?.map(x=>x.route).sort())!==JSON.stringify(['/dev/ux-lab','/operator/wallboard']))throw new Error('Development scope cannot silently remove required evidence or add exclusions');
 return scope;
}
export function readScope(){return validateScope(JSON.parse(fs.readFileSync(scopePath,'utf8')));}
export function scopeDigest(){return createHash('sha256').update(fs.readFileSync(scopePath)).digest('hex');}
export function developmentDecision(report,scope){
 validateScope(scope);const blockers=[];
 if(report.failures.length||report.coverage.some(x=>x.status==='failed'))blockers.push('Measured regression');
 if(report.rejectedEvidence.length)blockers.push('Stale or invalid evidence');
 for(const id of scope.requiredStaticChecks)if(report.coverage.find(x=>x.id===id)?.status!=='passed')blockers.push('Missing passed static check: '+id);
 for(const id of scope.requiredMeasuredChecks)for(const engine of scope.requiredEngines)if(!report.coverage.find(x=>x.id===id)?.checks.some(c=>c.status==='passed'&&c.engine===engine))blockers.push('Missing current measurement: '+id+'/'+engine);
 const excluded=new Set(scope.excludedRuntimeRoutes.map(x=>x.route));
 for(const route of report.routes.filter(x=>!excluded.has(x.route)))for(const engine of scope.requiredRouteEngines)if(!route.runtimeEvidence.some(e=>e.engine===engine))blockers.push('Missing route/engine evidence: '+route.route+'/'+engine);
 for(const engine of scope.requiredEngines)if(!report.routes.some(r=>r.runtimeEvidence.some(e=>e.engine===engine)))blockers.push('Missing browser engine evidence: '+engine);
 const states=new Set(report.routes.flatMap(x=>x.runtimeEvidence.map(e=>e.state)));
 for(const state of scope.requiredFixtureStates)if(!states.has(state))blockers.push('Missing synthetic state: '+state);
 return {profile:scope.id,ready:blockers.length===0,productionAcceptance:false,blockers,deferredProductionEvidence:scope.deferredProductionEvidence};
}
