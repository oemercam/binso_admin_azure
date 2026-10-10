import fs from 'node:fs';
import path from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';
import {inventory} from '../ux-inventory.mjs';
import {identity} from './identity.mjs';
import {fileURLToPath} from 'node:url';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
export const matchRoute=(pattern,route)=>new RegExp('^'+pattern.split('/').map(s=>s.startsWith('[...')?'.+':s.startsWith('[')?'[^/]+':s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('/')+'$').test(route);
export function collectEvidence(folders,current){
 const accepted=[],rejected=[];
 const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.name.startsWith('compliance-')&&e.name.endsWith('.json')?[path.join(dir,e.name)]:[]):[];
 for(const file of folders.flatMap(walk)){
  try{const entry=read(file);if(entry.sourceDigest!==current.sourceDigest||entry.registryVersion!==current.registryVersion||entry.schemaVersion!==1)rejected.push({file,reason:'Stale source/registry/schema'});else if(!Array.isArray(entry.checks))rejected.push({file,reason:'Missing individual checks'});else accepted.push({...entry,evidence:file});}catch{rejected.push({file,reason:'Invalid JSON'});}
 }
 return {accepted,rejected};
}
export function aggregate(requirements,evidence){
 return requirements.map(r=>{
  const checks=evidence.flatMap(e=>e.checks.filter(c=>c.id===r.id).map(c=>({...c,route:c.route??e.route,state:c.state??e.state,theme:c.theme??e.theme,width:c.width??e.width,engine:c.engine??e.engine,evidence:e.evidence})));
  const expected=r.expectedCases??[];
  const covered=expected.length>0&&expected.every(target=>checks.some(c=>c.status==='passed'&&['route','state','theme','width','engine'].every(k=>target[k]===undefined||target[k]===c[k])));
  const reviewed=checks.length>0&&checks.every(c=>c.status==='passed'&&c.reviewer&&c.approvalReference&&(r.method!=='physical'||c.device?.installedPwa&&c.device?.physical===true));
  const status=checks.some(c=>c.status==='failed')?'failed':r.method==='static'&&checks.length&&checks.every(c=>c.status==='passed')?'passed':['review','physical'].includes(r.method)&&reviewed?'passed':!['review','physical'].includes(r.method)&&covered?'passed':checks.some(c=>['passed','partial'].includes(c.status))?'partial':r.method==='physical'?'manual-required':r.method==='review'?'review-required':'not-tested';
  return {...r,status,checks,expectedCases:expected,coverage:covered?'All explicitly registered applicable cases have passing individual evidence':checks.length?'Measured cases only; unspecified or untested route/state/engine combinations remain open':'No current individual evidence'};
 });
}
export function generate({folders=[],out='docs/ux-compliance',runStatic=false}={}){
 const current=identity(),registry=read('ux-compliance/requirements.v1.json'),inv=inventory(),evidence=collectEvidence(folders,current);
 const statics=[];
 if(runStatic)for(const [id,script] of [['UX-NAV-001','navigation-contract-test.mjs'],['UX-NAV-002','navigation-foundation-test.mjs'],['UX-FIX-001','compliance/selftest.mjs']]){
  const p=spawnSync(process.execPath,['scripts/'+script],{encoding:'utf8'});statics.push({schemaVersion:1,...current,route:'customer-app',state:'source',checks:[{id,status:p.status===0?'passed':'failed',observed:{exit:p.status,log:(p.stdout+p.stderr).slice(-6000)},selector:null}],evidence:'scripts/'+script});
 }
 const coverage=aggregate(registry.requirements,[...evidence.accepted,...statics]);
 const failures=coverage.flatMap(r=>r.checks.filter(c=>c.status==='failed').map(c=>{
  const route=inv.routes.find(x=>matchRoute(x.route,c.route)),catalog=inv.renderCatalog.filter(n=>route?.renderGraph.includes(n.key)&&c.selector&&n.classes.some(cls=>c.selector.includes('.'+cls)));
  const rules=inv.cssRules.filter(rule=>c.selector&&c.selector.split(',').some(s=>s.trim()&&rule.selector.includes(s.trim())));
  return {id:r.id,route:c.route,component:catalog.map(n=>n.key),files:[...new Set([...catalog.map(n=>n.file),...rules.map(n=>n.file)])],expected:r.expected,observed:c.observed,measurement:c,rootCause:r.id==='UX-FIN-010'?'app/styles/app.css .bo-statistics hardcodes #17191d; earlier browser assertion also enforces that superseded variant':'Not established: inspect source candidates against runtime CSSOM',priority:r.priority,status:'confirmed in measured fixture case',centralCorrection:r.id==='UX-FIN-010'?'Reconcile Statistics palette with app background tokens, axes/legend/bar contrast and approved focus motion centrally':'Correct the registered central owner after root-cause review; no route-local patch'};
 }));
 const candidates={css:inv.cssAudit.cascadeCandidates,important:inv.cssAudit.importantDeclarations,unused:inv.componentCatalog.filter(c=>!c.usedBy.length),architecture:inv.routes.filter(r=>!r.route.startsWith('/operator')).map(r=>({route:r.route,widgets:r.widgets.filter(w=>/Header|Sheet|Wizard|Field|Records|List|Statistic|Sort/.test(w.tag)),inlineStyles:inv.renderCatalog.filter(n=>r.renderGraph.includes(n.key)).flatMap(n=>n.elements.filter(e=>e.props.some(p=>/^style=/.test(p))).map(e=>({file:n.file,component:n.key,line:e.line,tag:e.tag}))),status:'candidate: requires actual live mount and owner review'}))};
 const states=['normal','loading','error','empty','create','edit','readonly','denied','interrupted'];
 const routes=inv.routes.map(r=>({...r,states:states.map(state=>({state,status:evidence.accepted.some(e=>matchRoute(r.route,e.route)&&e.state===state)?'measured':'not-tested'})),runtimeEvidence:evidence.accepted.filter(e=>matchRoute(r.route,e.route)).map(e=>({route:e.route,engine:e.engine,theme:e.theme,width:e.width,state:e.state,surfaces:e.surfaces,evidence:e.evidence})),renderProof:'Static reachability is candidate evidence. Runtime surfaces prove selector mount, not a unique React component identity.'}));
 const report={schemaVersion:1,engineVersion:'1.0.0',...current,baselineCommit:registry.baselineCommit,registryVersion:registry.version,sourceCompleteness:registry.sourceCompleteness,conflicts:registry.conflicts,inventory:{routes:routes.length,components:inv.componentCatalog.length,cssRules:inv.cssRules.length},coverage,failures,routes,rejectedEvidence:evidence.rejected,candidates,scope:'Synthetic fixtures; no production record text captured by compliance measurements',compliant:registry.approvalScopeComplete===true&&coverage.every(r=>r.status==='passed')&&failures.length===0,blockers:['Original complete V21.1–V21.5 approval artifacts unavailable','Physical installed iOS/Android PWA and OS keyboard unavailable','All route/state/role combinations have not yet been individually instrumented','Visual baseline requires reviewed same-commit capture; no auto-update','React component attribution is static reachability + selector mount; no React fiber identity claim'],remediationPlan:['P0: preserve navigation contract; complete device/permission/dirty/replay evidence','P1: centrally resolve Statistics background conflict and obsolete dark assertion','P1: triage confirmed geometry failures with CSSOM before changing owners','P1: bind imported approval requirements to individual tests and cover untested states','P2: review CSS/legacy/padding candidates; prove non-use before deletion']};
 if(report.compliant)report.blockers=[];
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(inv,null,2)+'\n');
 const esc=s=>String(s??'').replaceAll('|','\\|').replaceAll('\n',' '),table=(heads,rows)=>'| '+heads.join(' | ')+' |\n| '+heads.map(()=>'---').join(' | ')+' |\n'+rows.map(row=>'| '+row.map(esc).join(' | ')+' |').join('\n')+'\n';
 fs.writeFileSync(path.join(out,'report.md'),'# Binso One UX Compliance 1.0.0\n\nSource: `'+current.commit+'`; digest `'+current.sourceDigest+'`. Baseline `'+registry.baselineCommit+'`.\n\nNo full compliance: '+evidence.accepted.length+' current browser measurement cases; '+failures.length+' individual failed checks. '+routes.filter(r=>r.runtimeEvidence.length).length+'/'+routes.length+' source routes have runtime evidence.\n\n'+table(['ID','Route','Priority','Expected','Observed','Cause','Central correction'],failures.map(f=>[f.id,f.route,f.priority,f.expected,JSON.stringify(f.observed),f.rootCause,f.centralCorrection]))+'\n## Coverage\n\n'+table(['ID','Method','Status','Cases','Owner'],coverage.map(r=>[r.id,r.method,r.status,r.checks.length,r.owner]))+'\n## Technical blockers\n\n'+report.blockers.map(s=>'- '+s).join('\n')+'\n\n## Prioritized remediation\n\n'+report.remediationPlan.map(s=>'- '+s).join('\n')+'\n\n## Candidate review\n\n'+candidates.css.length+' CSS property cascades, '+candidates.important+' important declarations, '+candidates.unused.length+' possibly unused declarations. These are review candidates, never blanket violations. Full paths, line numbers, CSS contexts, render paths, measurements and route/state coverage are in report.json and inventory.json.\n');
 fs.writeFileSync(path.join(out,'coverage.csv'),'id,method,status,cases\n'+coverage.map(r=>[r.id,r.method,r.status,r.checks.length].join(',')).join('\n')+'\n');
 console.log(JSON.stringify({out,source:current.commit,requirements:coverage.length,routes:routes.length,measuredRoutes:routes.filter(r=>r.runtimeEvidence.length).length,browserCases:evidence.accepted.length,rejected:evidence.rejected.length,failures:failures.length,compliant:report.compliant}));return report;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),outIndex=args.indexOf('--out'),out=outIndex>=0?args.splice(outIndex,2)[1]:undefined;
 const runStatic=args.includes('--static');const report=generate({folders:args.filter(x=>!x.startsWith('--')),out,runStatic});
 if(args.includes('--gate')&&report.failures.length)process.exitCode=1;
 if(args.includes('--release')&&!report.compliant)process.exitCode=1;
}
