import {withoutLocalization} from "./localized-source.mjs";
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {navigationRules} from './design-system.mjs';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function navigationFoundation(read,{geometryOnly=false}={}){
 const markup=[],logic=[],icons=[],rules=[],variables=[];
 for(const file of ['components/app-shell.tsx','components/operator.tsx','components/ui.tsx','components/app-chrome.tsx']){
  const ast=ts.createSourceFile(file,withoutLocalization(read(file)),99,true,4);
  function visit(node){
   if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&/bottom-nav|operator-mobile-nav/.test(node.openingElement.attributes.getText(ast)))markup.push({file,source:ts.isBinaryExpression(node.parent)?node.parent.getText(ast):node.getText(ast)});
   if(ts.isVariableDeclaration(node)&&/^(formActive|canOpen|\[navCompact,|operatorNav\b|operatorNavGroups\b|\[key,\s*detail\])/.test(node.name.getText(ast)))logic.push({file,source:node.getText(ast)});
   if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.getText(ast).includes('setNavCompact'))logic.push({file,source:node.getText(ast)});
   if(file==='components/ui.tsx'&&ts.isFunctionDeclaration(node)&&node.name?.text==='Icon')icons.push(node.getText(ast));
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 for(const {file,rule} of navigationRules(read)){
  const selectors=rule.selectors.filter(s=>/\.bottom-nav\b|\.operator-mobile-nav\b|\.mobile-dock\b|\.dock-create-action\b/.test(s));if(!selectors.length)continue;
  let context='';for(let p=rule.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context=p.name+' '+p.params+'/'+context;
  const presentation=new Set(['background','color','border','border-top-color','border-radius','box-shadow','backdrop-filter','-webkit-backdrop-filter']);
  const declarations=rule.nodes.filter(n=>n.type==='decl'&&(!geometryOnly||!presentation.has(n.prop))).map(n=>[n.prop,n.value,n.important]);
  if(declarations.length)rules.push({file,selectors,context,declarations});
 }
 const needed=new Set([...JSON.stringify(rules).matchAll(/var\((--[\w-]+)/g)].map(m=>m[1]));
 const tokenRoot=postcss.parse(read('app/design-system/theme.css'));let added;
 do{added=false;tokenRoot.walkDecls(decl=>{if(needed.has(decl.prop))for(const match of decl.value.matchAll(/var\((--[\w-]+)/g))if(!needed.has(match[1])){needed.add(match[1]);added=true;}});}while(added);
 tokenRoot.walkDecls(decl=>{if(!needed.has(decl.prop))return;const contexts=[];for(let p=decl.parent;p&&p.type!=='root';p=p.parent)contexts.unshift(p.type==='rule'?p.selector:'@'+p.name+' '+p.params);variables.push({name:decl.prop,value:decl.value,contexts});});
 return {markup:hash(markup),logic:hash(logic),icons:hash(icons),rules:hash(rules),tokens:hash(variables),tokenNames:[...needed].sort()};
}
/** Approval-independent invariants: no route, permission, icon or domain change. */
export function navigationAccess(read){
 const permissions=[],destinations=[];
 for(const file of ['components/app-shell.tsx','components/operator.tsx']){
  const ast=ts.createSourceFile(file,withoutLocalization(read(file)),99,true,4);
  function visit(node){
   if(ts.isVariableDeclaration(node)&&/^(formActive|canOpen|operatorNav|operatorNavGroups|settingsWrite|personalSettings|canWrite)$/.test(node.name.getText(ast)))permissions.push({file,source:node.getText(ast)});
   if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&/bottom-nav|operator-mobile-nav/.test(node.openingElement.attributes.getText(ast)))destinations.push({file,source:node.children.map(child=>child.getText(ast)).join('')});
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 return {permissions:hash(permissions),destinations:hash(destinations)};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const reference=JSON.parse(fs.readFileSync('docs/assets/20261020/authorized-navigation-reference.json','utf8'));
 const read=file=>fs.readFileSync(file,'utf8'),current=navigationFoundation(read);
 assert.deepEqual(navigationAccess(read),reference.access,'Approved role-filtered destinations and access checks remain exact');
 // V4 adds a sort icon and updates the filter glyph, neither of which is used
 // by navigation. Bind every other icon AND the SVG renderer to the original
 // immutable reference, rather than replacing its approved hash with today's.
 const iconSource=source=>{const ast=ts.createSourceFile('ui.tsx',withoutLocalization(source),99,true,4);return {ast,node:ast.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='Icon')};};
 const original=execFileSync('git',['show',reference.base+':components/ui.tsx'],{encoding:'utf8'});
 const frozen=iconSource(original);assert.equal(hash([frozen.node.getText(frozen.ast)]),reference.baseIcons,'The historical icon source still matches the approved reference');
 const protectedIcons=source=>{const {ast,node}=iconSource(source);const transformed=ts.transform(node,[context=>root=>{const visit=child=>ts.isVariableDeclaration(child)&&child.name.getText(ast)==='paths'&&ts.isObjectLiteralExpression(child.initializer)?ts.factory.updateVariableDeclaration(child,child.name,child.exclamationToken,child.type,ts.factory.updateObjectLiteralExpression(child.initializer,child.initializer.properties.filter(property=>!['filter','sort'].includes(property.name?.getText(ast).replaceAll('"',''))))):ts.visitEachChild(child,visit,context);return ts.visitNode(root,visit);}]);try{return ts.createPrinter().printNode(ts.EmitHint.Unspecified,transformed.transformed[0],ast);}finally{transformed.dispose();}};
 assert.equal(protectedIcons(read('components/ui.tsx')),protectedIcons(original),'Every protected icon and the common SVG renderer remain unchanged');
 const tampered=read('components/ui.tsx').replace('M3 11.5 12 4l9 7.5','M3 11.5 12 5l9 7.5');assert.notEqual(protectedIcons(tampered),protectedIcons(original),'Changing the actual home icon remains a failing counterexample');
 assert.deepEqual({...current,icons:reference.snapshot.icons},reference.snapshot,'Stable app navigation matches its approved source contract; protected icons are independently compared above');
 assert.doesNotMatch(read('components/app-shell.tsx'),/navCompact|setNavCompact/,'Scroll never hides app navigation labels');
 for(const [from,to] of [['background:var(--color-bg)','background:#f3f3f5'],['border-radius:0','border-radius:30px'],['backdrop-filter:none','backdrop-filter:blur(18px)'],['box-shadow:none','box-shadow:0 3px 12px rgba(0,0,0,.2)'],['opacity:1','opacity:0']]){
  assert.ok(read('app/design-system/navigation.css').includes(from),'Negative control edits an actual declaration');
  assert.notDeepEqual(navigationFoundation(file=>file==='app/design-system/navigation.css'?read(file).replace(from,to):read(file)),reference.snapshot,'Old glass, floating geometry and disappearing labels must fail');
 }
 console.log('Stable Microsoft navigation: unchanged destinations/rights/icons; source contract and old-material/hidden-label counterexamples passed.');
}
