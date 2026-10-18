import {currentNavigationRead} from './navigation-breakpoint-contract.mjs';
import {withoutLocalization} from "./localized-source.mjs";
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
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
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const original=JSON.parse(fs.readFileSync('docs/assets/v21-1/navigation-reference.json','utf8'));
 const prior=JSON.parse(fs.readFileSync('docs/assets/20261013/navigation-reference.json','utf8'));
 const reference=JSON.parse(fs.readFileSync('docs/assets/20261018/microsoft-navigation-reference.json','utf8'));
 const read=file=>fs.readFileSync(file,'utf8');
 const current=navigationFoundation(read);
 const inherited=[];postcss.parse(fs.readFileSync('app/design-system/navigation.css','utf8')).walkRules(':root',rule=>rule.walkDecls(decl=>inherited.push({context:rule.parent.params,name:decl.prop,value:decl.value})));
 assert.deepEqual(inherited,[{context:'(max-height:520px) and (orientation:landscape) and (max-width:900px)',name:'--mobile-nav-h',value:'54px'},{context:'(max-height:520px) and (orientation:landscape) and (max-width:900px)',name:'--mobile-nav-bottom',value:'6px'}],'Preserve the original inherited landscape dock values as well as its selector contract');
 assert.equal(current.logic,original.snapshot.logic,'Creation/material changes must preserve destination access and scroll logic');
 assert.equal(current.icons,original.snapshot.icons,'Existing navigation icons remain unchanged');
 assert.equal(current.markup,prior.snapshot.markup,'Mobile navigation markup and destinations remain unchanged');
 assert.deepEqual(navigationFoundation(currentNavigationRead(read),{geometryOnly:true}),reference.invariants,'Current navigation geometry, motion, safe areas and non-material tokens remain exact');
 assert.deepEqual(current,reference.snapshot,'Navigation matches the explicitly approved flat Microsoft material');
 for(const [from,to] of [['background:var(--color-bg)','background:#f3f3f5'],['border-radius:0','border-radius:30px'],['backdrop-filter:none','backdrop-filter:blur(18px)'],['box-shadow:none','box-shadow:0 3px 12px rgba(0,0,0,.2)']]){
  assert.ok(read('app/design-system/navigation.css').includes(from),'Negative control edits an actual declaration');
  assert.notDeepEqual(navigationFoundation(file=>file==='app/design-system/navigation.css'?read(file).replace(from,to):read(file)),reference.snapshot,'Old glass/round/blur material must fail the new contract');
 }
 console.log('Flat Microsoft navigation: exact material, unchanged markup/access/icons/geometry/motion/safe areas and rejecting old glass controls passed.');
}
