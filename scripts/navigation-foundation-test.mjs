import {withoutLocalization} from "./localized-source.mjs";
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
import {navigationContract} from './navigation-contract.mjs';
import {navigationRules} from './design-system.mjs';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function navigationFoundation(read){
 const markup=[],logic=[],icons=[],rules=[],variables=[];
 for(const file of ['components/app-shell.tsx','components/operator.tsx','components/ui.tsx','components/app-chrome.tsx']){
  const ast=ts.createSourceFile(file,withoutLocalization(read(file)),99,true,4);
  function visit(node){
   if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&/bottom-nav|operator-mobile-nav/.test(node.openingElement.attributes.getText(ast)))markup.push({file,source:(ts.isBinaryExpression(node.parent)?node.parent.getText(ast):node.getText(ast)).replace(/className=\{\x60bottom-nav \$\{navCompact \? "is-compact" : ""\}\x60\}/g,'className="bottom-nav"')});
   if(ts.isVariableDeclaration(node)&&/^(formActive|canOpen|operatorNav\b|operatorNavGroups\b|\[key,\s*detail\])/.test(node.name.getText(ast)))logic.push({file,source:node.getText(ast)});
   if(file==='components/ui.tsx'&&ts.isFunctionDeclaration(node)&&node.name?.text==='Icon')icons.push(node.getText(ast));
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 for(const {file,rule} of navigationRules(read)){
  const selectors=rule.selectors.filter(s=>/\.bottom-nav\b|\.operator-mobile-nav\b|\.mobile-dock\b|\.dock-create-action\b/.test(s));if(!selectors.length)continue;
  let context='';for(let p=rule.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context=p.name+' '+p.params+'/'+context;
  rules.push({file,selectors,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])});
 }
 const needed=new Set([...JSON.stringify(rules).matchAll(/var\((--[\w-]+)/g)].map(m=>m[1]));
 const tokenRoot=postcss.parse(read('app/design-system/theme.css'));let added;
 do{added=false;tokenRoot.walkDecls(decl=>{if(needed.has(decl.prop))for(const match of decl.value.matchAll(/var\((--[\w-]+)/g))if(!needed.has(match[1])){needed.add(match[1]);added=true;}});}while(added);
 tokenRoot.walkDecls(decl=>{if(!needed.has(decl.prop))return;const contexts=[];for(let p=decl.parent;p&&p.type!=='root';p=p.parent)contexts.unshift(p.type==='rule'?p.selector:'@'+p.name+' '+p.params);variables.push({name:decl.prop,value:decl.value,contexts});});
 return {markup:hash(markup),logic:hash(logic),icons:hash(icons),rules:hash(rules),tokens:hash(variables),tokenNames:[...needed].sort()};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const current=navigationFoundation(file=>fs.readFileSync(file,'utf8'));
 const original=navigationContract.preservedBehavior;
 assert.equal(current.logic,original.logic,'ZIP visual replacement preserves route access, roles and form safety');
 assert.equal(current.icons,original.icons,'Existing business icons remain stable');
 assert.equal(current.markup,original.markup,'Destinations and permission conditions remain unchanged; only obsolete compact styling is removed');
 console.log('ZIP customer/operator navigation retains original destinations, access conditions and icons.');
}
