import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import {planChanges,changedFiles} from './qa-plan.mjs';
const args=process.argv.slice(2),level=args[0]??'fast';
const arg=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1]};
const files=arg('--files')?.split(',')??changedFiles(arg('--base'));
const plan=planChanges(files,{level});
const started=performance.now(),timings=[];
async function run(label,command,argv,env={}){
 console.log('\nQA: '+label);const begin=performance.now();
 await new Promise((resolve,reject)=>{const child=spawn(command,argv,{stdio:'inherit',env:{...process.env,...env}});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(new Error(label+' failed ('+code+')')))});
 timings.push({label,seconds:Number(((performance.now()-begin)/1000).toFixed(2))});
}
console.log(JSON.stringify(plan,null,2));
try{
 if(level==='fast'){
  const candidates=files.filter(p=>/\.(mjs|js|ts|tsx)$/.test(p));
  const existing=await Promise.all(candidates.map(async path=>{try{await fs.access(path);return path;}catch{return null;}}));
  const lintFiles=existing.filter(Boolean);
  if(lintFiles.length)await run('changed-file lint','pnpm',['exec','eslint','--cache','--cache-location','node_modules/.cache/eslint-fast','--max-warnings=0',...lintFiles]);
  if(args.includes('--typecheck'))await run('incremental typecheck','pnpm',['typecheck']);
  for(const suite of plan.suites)await run(suite,process.execPath,['scripts/'+suite+'.mjs']);
 }else if(level==='integration'){
  await run('typecheck','pnpm',['typecheck']);
  for(const suite of plan.suites)await run(suite,process.execPath,['scripts/'+suite+'.mjs']);
  await run('build','pnpm',['build']);
 }else{
  for(const script of ['release:check','test','lint','css:check','typecheck','security:scan','security:scan:all','build'])await run(script,'pnpm',[script]);
 }
 if(plan.routes.length&&!args.includes('--no-browser')){
  const env={BINSO_UX_ROUTES:plan.routes.join(','),BINSO_UX_WIDTHS:plan.widths.join(','),BINSO_UX_THEMES:plan.themes.join(','),BINSO_UX_INTERACTIONS:plan.interactions.join(','),BINSO_UX_SCREENSHOTS:'1',BINSO_UX_REFERENCE_WIDTH:level==='fast'?'390':'',BINSO_UX_OUTPUT:'/tmp/binso-qa-'+level,BINSO_UX_PORT:level==='fast'?'3300':'3200',BINSO_UX_A11Y:plan.level==='full'?'1':'0',BINSO_UX_SERVER_MODE:level==='fast'?'dev':'start',...(arg('--url')?{BINSO_BASE_URL:arg('--url')}:{})};
  await run('scoped Chromium browser',process.execPath,['scripts/ux-browser-test.mjs'],env);
  if(plan.level==='full')await run('PWA offline and restart',process.execPath,['scripts/pwa-browser-test.mjs'],arg('--url')?{BINSO_BASE_URL:arg('--url')}:{});
  if(level!=='fast')await run('startup and session navigation',process.execPath,['scripts/loading-browser-test.mjs'],{BINSO_UX_BROWSER:'webkit',...(arg('--url')?{BINSO_BASE_URL:arg('--url')}:{})});
  if(level!=='fast')await run('scoped WebKit browser',process.execPath,['scripts/ux-browser-test.mjs'],{...env,BINSO_UX_BROWSER:'webkit',BINSO_UX_ROUTES:plan.webkitRoutes.join(','),BINSO_UX_WIDTHS:plan.webkitWidths.join(','),BINSO_UX_DEVICE:'iPhone 13'});
 }
 const report={level,effectiveCoverage:plan.level,browserExecuted:plan.routes.length>0&&!args.includes('--no-browser'),scope:plan,seconds:Number(((performance.now()-started)/1000).toFixed(2)),timings,passed:true};
 await fs.mkdir('/tmp/binso-qa-reports',{recursive:true});await fs.writeFile('/tmp/binso-qa-reports/'+level+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(error){console.error(error.message);process.exitCode=1;}
