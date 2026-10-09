import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {inventory} from './ux-inventory.mjs';

const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.posix.join(dir,e.name)):[path.posix.join(dir,e.name)]);
function resolve(file,spec){
 const base=spec.startsWith('@/')?spec.slice(2):spec.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),spec)):null;
 return base?[base,base+'.ts',base+'.tsx',base+'.mjs',base+'.js',base+'/index.ts',base+'/index.tsx'].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile())??null:null;
}
export function integrationGraph(){
 const files=['app','components','lib','config','scripts'].flatMap(walk).filter(f=>/\.(tsx?|m?js)$/.test(f)).sort();
 const modules=files.map(file=>{
  const text=fs.readFileSync(file,'utf8'),ast=ts.createSourceFile(file,text,99,true,file.endsWith('tsx')?4:3),dependencies=[],dynamicUnknown=[],providers=[],effects=[];
  const visit=n=>{
   if((ts.isImportDeclaration(n)||ts.isExportDeclaration(n))&&n.moduleSpecifier&&ts.isStringLiteral(n.moduleSpecifier)){
    const spec=n.moduleSpecifier.text,typeOnly=!!n.importClause?.isTypeOnly||!!n.isTypeOnly;
    dependencies.push({specifier:spec,target:resolve(file,spec),kind:typeOnly?'type':'static',line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1});
   }
   if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword){
    if(n.arguments[0]&&ts.isStringLiteral(n.arguments[0]))dependencies.push({specifier:n.arguments[0].text,target:resolve(file,n.arguments[0].text),kind:'dynamic',line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1});
    else dynamicUnknown.push(n.getText(ast));
   }
   if(ts.isCallExpression(n)&&['useEffect','useLayoutEffect'].includes(n.expression.getText(ast)))effects.push(ast.getLineAndCharacterOfPosition(n.getStart()).line+1);
   if((ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n))&&n.tagName.getText(ast).endsWith('.Provider'))providers.push({name:n.tagName.getText(ast),line:ast.getLineAndCharacterOfPosition(n.getStart()).line+1});
   ts.forEachChild(n,visit);
  };visit(ast);return {file,dependencies,dynamicUnknown,providers,effects};
 });
 const graph=new Map(modules.map(m=>[m.file,m.dependencies.filter(d=>d.target&&d.kind==='static').map(d=>d.target)]));
 let index=0;const indices=new Map(),low=new Map(),stack=[],active=new Set(),cycles=[];
 const connect=v=>{indices.set(v,index);low.set(v,index++);stack.push(v);active.add(v);for(const w of graph.get(v)??[]){if(!graph.has(w))continue;if(!indices.has(w)){connect(w);low.set(v,Math.min(low.get(v),low.get(w)))}else if(active.has(w))low.set(v,Math.min(low.get(v),indices.get(w)))}if(low.get(v)===indices.get(v)){const group=[];let w;do{w=stack.pop();active.delete(w);group.push(w)}while(w!==v);if(group.length>1||(graph.get(v)??[]).includes(v))cycles.push(group.sort())}};
 for(const v of graph.keys())if(!indices.has(v))connect(v);
 const incoming=new Map();for(const m of modules)for(const d of m.dependencies)if(d.target){const list=incoming.get(d.target)??[];list.push({file:m.file,kind:d.kind,line:d.line});incoming.set(d.target,list)}
 const unreferenced=modules.filter(m=>m.file.startsWith('components/')&&!(incoming.get(m.file)?.length)).map(m=>m.file);
 return {modules,staticRuntimeCycles:cycles,unreferencedComponentCandidates:unreferenced,notes:['Module reachability is static evidence, not proof that a conditional UI rendered.','Type-only imports are excluded from runtime cycles. Non-literal dynamic imports, re-exported type bindings and external module entry points need manual review.','Unreferenced candidates are not deleted automatically: scripts, framework conventions or external consumers can use them.']};
}
const cell=v=>String(v??'').replaceAll('|','\\|').replaceAll('\n',' ');
const table=(headers,rows)=>'| '+headers.join(' | ')+' |\n| '+headers.map(()=>'---').join(' | ')+' |\n'+rows.map(r=>'| '+r.map(cell).join(' | ')+' |').join('\n')+'\n';
export function integrationReport(){
 const catalog=inventory(),graph=integrationGraph();
 const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
 const routes=catalog.routes.map(r=>({route:r.route,source:r.file,family:r.family,current:r.pageComponents,canonical:r.family==='CreatePage'?'Existing Field + FormActions; FormWizard for multi-step processes':r.family==='DetailPage'?'DetailHeading + DetailTabs + ActionsMenu':r.family==='ListPage'?'PageHeading + RecordsView/RecordRow':r.family==='ChatPage'?'MessageBubble + fixed thread/composer':r.family==='DashboardPage'?'PageHeading + MetricTiles':r.family==='SettingsPage'?'Existing settings owner + Field/FormSheet': 'Existing public/operator/redirect layout; domain-specific source retained',layouts:r.layouts,widgets:r.widgets,permission:r.permission,status:'Offen',test:'Static source inventory; runtime status must be supplied by exact-commit evidence'}));
 const sourceFingerprint=createHash('sha256').update(graph.modules.map(m=>m.file+'\n'+fs.readFileSync(m.file,'utf8')).join('\n')).digest('hex');
 const result={schema:1,sourceSha:sha,sourceFingerprint,routes,operatorVariants:catalog.operatorVariants,graph,cssAudit:catalog.cssAudit,components:catalog.componentCatalog};
 fs.writeFileSync('docs/architecture/v21-5-integration-inventory.json',JSON.stringify(result)+'\n');
 fs.writeFileSync('docs/architecture/v21-5-routes.md','# V21.5 complete source-route integration matrix\n\nGenerated by `node scripts/foundation-integration-report.mjs`. Git parent SHA: `'+sha+'`; source fingerprint: `'+sourceFingerprint+'` (includes current working files). All framework page files are included; operator dispatch variants follow separately. Embedded PDF/chat/wizard states belong to their owning route. Source reachability does not prove visual/function acceptance. The final readiness matrix must link exact tests rather than upgrade these static rows automatically.\n\n'+table(['Route','Type','Current owner','Canonical responsibility','Layouts','Permission','Function/test status'],routes.map(r=>[r.route,r.family,r.current.join(', '),r.canonical,r.layouts.join(', '),r.permission,r.test]))+'\n## Operator dispatch\n\n'+table(['Route','Owner','Status'],catalog.operatorVariants.map(v=>[v.route,v.component,'Static dispatch inspected; actual operator session required for security acceptance']))+'\n## Runtime import cycles\n\n'+(graph.staticRuntimeCycles.length?table(['Cycle group','Assessment'],graph.staticRuntimeCycles.map(g=>[g.join(' → '),'Confirmed static import cycle; initialization/runtime consequence requires investigation'])):'No static runtime-import cycles found in the scanned local source modules.\n')+'\n## Unreferenced candidates\n\n'+table(['Candidate','Assessment'],graph.unreferencedComponentCandidates.map(f=>[f,'No local literal import found; not automatic dead-code proof'])));
 console.log(JSON.stringify({routes:routes.length,operatorVariants:catalog.operatorVariants.length,modules:graph.modules.length,cycles:graph.staticRuntimeCycles,unreferenced:graph.unreferencedComponentCandidates}));return result;
}
if(process.argv[1]===fileURLToPath(import.meta.url))integrationReport();
