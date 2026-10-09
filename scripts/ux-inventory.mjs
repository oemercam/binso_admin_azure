import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const walkFiles=(dir)=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walkFiles(path.posix.join(dir,e.name)):[path.posix.join(dir,e.name)]);
const sources=new Map();
const resolve=(file,spec)=>{const base=spec.startsWith('@/')?spec.slice(2):spec.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),spec)):null;if(!base)return null;return [base,base+'.tsx',base+'.ts',base+'/index.tsx',base+'/index.ts'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile())??null;};
function source(file){
 if(sources.has(file))return sources.get(file);
 const ast=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,file.endsWith('tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS),imports=new Map(),nodes=new Map(),exports=new Map();
 const parsed={file,ast,imports,nodes,exports};sources.set(file,parsed);
 for(const n of ast.statements){
  if(ts.isImportDeclaration(n)&&n.importClause){const target=resolve(file,n.moduleSpecifier.text);if(!target)continue;if(n.importClause.name)imports.set(n.importClause.name.text,[target,'default']);for(const b of n.importClause.namedBindings?.elements??[])imports.set(b.name.text,[target,(b.propertyName??b.name).text]);}
  if(ts.isFunctionDeclaration(n)||ts.isClassDeclaration(n)||ts.isTypeAliasDeclaration(n)||ts.isInterfaceDeclaration(n)){const name=n.name?.text??'default';nodes.set(name,n);if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword))exports.set('default',name);}
  if(ts.isVariableStatement(n))for(const d of n.declarationList.declarations)if(ts.isIdentifier(d.name))nodes.set(d.name.text,d);
  if(ts.isExportDeclaration(n)&&!n.moduleSpecifier&&n.exportClause&&ts.isNamedExports(n.exportClause))for(const e of n.exportClause.elements)exports.set(e.name.text,(e.propertyName??e.name).text);
  if(ts.isExportDeclaration(n)&&n.moduleSpecifier&&n.exportClause&&ts.isNamedExports(n.exportClause)){const target=resolve(file,n.moduleSpecifier.text);if(target)for(const e of n.exportClause.elements)exports.set(e.name.text,[target,(e.propertyName??e.name).text]);}
 }
 return parsed;
}
export function dependencyGraph(file,name='default',visited=new Set()){
 const parsed=source(file),exp=parsed.exports.get(name);if(Array.isArray(exp))return dependencyGraph(...exp,visited);if(typeof exp==='string')name=exp;
 const key=file+'#'+name;if(visited.has(key))return [];visited.add(key);const node=parsed.nodes.get(name);if(!node)return [];
 const refs=new Set(),classes=new Set(),apis=new Set(),collections=new Set(),widgets=[],jsxUses=[];
 const visit=n=>{
  if(ts.isIdentifier(n))refs.add(n.text);
  if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){const tag=n.tagName.getText(parsed.ast);jsxUses.push({tag,line:parsed.ast.getLineAndCharacterOfPosition(n.getStart()).line+1,props:n.attributes.properties.map(p=>p.getText(parsed.ast))});if(/Sheet|Dialog|Tabs|Records|List|Table|Upload|Preview|Modal|Chat|Field|Viewer/.test(tag)||['input','select','textarea','form','table','dialog'].includes(tag))widgets.push({tag,line:parsed.ast.getLineAndCharacterOfPosition(n.getStart()).line+1});}
  if(ts.isJsxAttribute(n)&&n.name.getText(parsed.ast)==='className'&&n.initializer){const strings=[];const gather=x=>{if(ts.isStringLiteral(x)||ts.isNoSubstitutionTemplateLiteral(x))strings.push(x.text);if(ts.isTemplateExpression(x)){strings.push(x.head.text,...x.templateSpans.map(s=>s.literal.text));}ts.forEachChild(x,gather)};gather(n.initializer);for(const s of strings)for(const c of s.split(/\s+/))if(/^[\w-]+$/.test(c))classes.add(c);}
  if(ts.isStringLiteral(n)&&n.text.startsWith('/api/'))apis.add(n.text);
  if(ts.isCallExpression(n)&&n.expression.getText(parsed.ast)==='useDemoRows'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0]))collections.add(n.arguments[0].text);
  ts.forEachChild(n,visit);
 };visit(node);
 const result=[{key,file,name,line:parsed.ast.getLineAndCharacterOfPosition(node.getStart()).line+1,classes:[...classes],apis:[...apis],collections:[...collections],widgets,jsxUses}];
 for(const ref of refs){const imported=parsed.imports.get(ref);if(imported)result.push(...dependencyGraph(...imported,visited));else if(parsed.nodes.has(ref)&&ref!==name)result.push(...dependencyGraph(file,ref,visited));}
 return result;
}
export function pageRoute(file){return '/'+path.posix.dirname(file).replace(/^app\/?/,'').split('/').filter(x=>x&&!/^\(.*\)$/.test(x)).join('/');}
export function inventory(){
 const cssOrder=[...fs.readFileSync('app/binso-ui.css','utf8').matchAll(/@import "\.\/([^\"]+)"/g)].map(m=>'app/'+m[1]);
 const rules=[],duplicates=[],groups=new Map();let important=0;
 for(const file of cssOrder){const css=postcss.parse(fs.readFileSync(file,'utf8'),{from:file});css.walkRules(rule=>{const contexts=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')contexts.unshift('@'+p.name+' '+p.params);const declarations=rule.nodes.filter(n=>n.type==='decl').map(n=>({property:n.prop,value:n.value,important:!!n.important}));important+=declarations.filter(d=>d.important).length;const entry={id:rules.length,file,line:rule.source.start.line,selector:rule.selector,context:contexts.join(' > '),declarations};rules.push(entry);for(const selector of rule.selectors){const k=file+'|'+entry.context+'|'+selector;if(groups.has(k))duplicates.push({selector,file,context:entry.context,earlier:groups.get(k),later:entry.id});groups.set(k,entry.id);}});}
 const transpiled=ts.transpileModule(fs.readFileSync('lib/permissions.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;const permissionModule={exports:{}};new Function('module','exports',transpiled)(permissionModule,permissionModule.exports);
 const routes=walkFiles('app').filter(f=>f.endsWith('/page.tsx')).sort().map(file=>{
  const route=pageRoute(file),visited=new Set(),layouts=[];for(let dir=path.posix.dirname(file);dir==='app'||dir.startsWith('app/');dir=path.posix.dirname(dir)){const layout=dir+'/layout.tsx';if(fs.existsSync(layout))layouts.unshift(layout);}const graph=[...dependencyGraph(file,'default',visited),...layouts.flatMap(layout=>dependencyGraph(layout,'default',visited))],classes=new Set(graph.flatMap(n=>n.classes)),components=graph.filter(n=>n.file.startsWith('components/')).map(n=>n.key),data=[...new Set(graph.flatMap(n=>n.apis))],collections=[...new Set(graph.flatMap(n=>n.collections))];
  const family=route==='/dashboard'||route==='/operator'?'DashboardPage':graph.some(n=>n.name==='SupportChat')?'ChatPage':route.endsWith('/neu')||/registrieren|einladung/.test(route)?'CreatePage':route.endsWith('/bearbeiten')||graph.some(n=>/Form$/.test(n.name)&&/\[id\]/.test(route))?'EditPage':/\[/.test(route)?'DetailPage':graph.some(n=>/Page$/.test(n.name)&&/RecordsView|DocumentList/.test(n.name))||graph.some(n=>n.name==='RecordsView'||n.name==='DocumentList')?'ListPage':route.startsWith('/einstellungen')?'EditPage':'DashboardPage';
  const permission=route.startsWith('/operator')?'requireOperator / section-specific operator grants':route.startsWith('/portal')?'Portal session / public registration':permissionModule.exports.routePermission(route)??'Public or route-level session: see source';
  const cssRules=rules.filter(r=>[...r.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)].some(m=>classes.has(m[1]))).map(r=>r.id);
  return {layouts,module:route.split('/')[1]||'public',route,family,file,components,cssRules,data,collections,permission,viewVariants:route.startsWith('/operator')?['OperatorShell navigation variants']:route.startsWith('/preview')?['Read-only preview']:!route.startsWith('/einstellungen')&&/login|registrieren|preise|produkt$|portal|demo$/.test(route)?['Public/authentication view']:[],widgets:graph.flatMap(n=>n.widgets.map(w=>({...w,component:n.key}))),deviations:['Visual verification required; static inventory does not prove correctness']};
 });
 const componentFiles=walkFiles('components').filter(f=>f.endsWith('.tsx')),componentCatalog=[];
 for(const file of componentFiles){const parsed=source(file);for(const [name,node]of parsed.nodes){let hasJsx=false;const check=n=>{if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)||ts.isJsxFragment(n))hasJsx=true;ts.forEachChild(n,check)};check(node);if(hasJsx)componentCatalog.push({file,name,jsxUses:dependencyGraph(file,name).find(n=>n.key===file+"#"+name)?.jsxUses??[],line:parsed.ast.getLineAndCharacterOfPosition(node.getStart()).line+1,usedBy:routes.filter(r=>r.components.includes(file+'#'+name)).map(r=>r.route)});}}
 return {schema:2,cssOrder,routes,componentCatalog,cssRules:rules,cssAudit:{repeatedSelectorContexts:duplicates,importantDeclarations:important},notes:['Ancestor layouts and local export aliases are included. JSX props are code expressions, not claims about their runtime values. Component catalog contains AST-confirmed JSX definitions only.', 'Route-level static dependency traversal; dynamic routes and conditional branches are included, not presumed active.','CSS rule IDs link to full selectors, declaration values, media contexts and source lines. Repeated selectors are candidates, not confirmed defects.','Additional page families DocumentPreviewPage and ChatPage occur as embedded views; widgets preserve their owning route.','Dynamic API arguments remain prefixes; collections are listed separately. Backend endpoints enforce tenant entitlements and RLS independently.']};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const result=inventory();fs.mkdirSync('docs/architecture',{recursive:true});fs.writeFileSync('docs/architecture/ux-inventory.json',JSON.stringify(result,null,2)+'\n');
 const cell=x=>String(x).replaceAll('|','\\|').replaceAll('\n',' ');
 const rows=result.routes.map(r=>[r.module,r.route,r.family,r.components.join(', '),r.cssRules.length+' rules (see JSON catalog)',[...r.data,...r.collections.map(c=>'collection:'+c)].join(', ')||'Static content / nested layout',r.permission,r.deviations.join(';')].map(cell).join(' | '));
 fs.writeFileSync('docs/architecture/routes.md','# Code-derived route and component inventory\n\nGenerated with `pnpm ux:inventory`. Full component, widget and CSS catalogs: `ux-inventory.json`. Static evidence is not visual acceptance.\n\n| Module | Route | Page family | Components | CSS rules | Data | Permissions | UX verification |\n| --- | --- | --- | --- | --- | --- | --- | --- |\n'+rows.map(r=>'| '+r+' |').join('\n')+'\n');
 console.log(JSON.stringify({routes:result.routes.length,components:result.componentCatalog.length,cssRules:result.cssRules.length,repeatedSelectorContexts:result.cssAudit.repeatedSelectorContexts.length,important:result.cssAudit.importantDeclarations}));
}
