import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function navigationFoundation(read){
 const markup=[],logic=[],icons=[],rules=[],variables=[];
 for(const file of ['components/app-shell.tsx','components/operator.tsx','components/ui.tsx']){
  const ast=ts.createSourceFile(file,read(file),99,true,4);
  function visit(node){
   if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&/bottom-nav|operator-mobile-nav/.test(node.openingElement.attributes.getText(ast)))markup.push({file,source:ts.isBinaryExpression(node.parent)?node.parent.getText(ast):node.getText(ast)});
   if(ts.isVariableDeclaration(node)&&/^(formActive|canOpen|\[navCompact,|operatorNav\b|operatorNavGroups\b|\[key,\s*detail\])/.test(node.name.getText(ast)))logic.push({file,source:node.getText(ast)});
   if(ts.isCallExpression(node)&&node.expression.getText(ast)==='useEffect'&&node.getText(ast).includes('setNavCompact'))logic.push({file,source:node.getText(ast)});
   if(file==='components/ui.tsx'&&ts.isFunctionDeclaration(node)&&node.name?.text==='Icon')icons.push(node.getText(ast));
   ts.forEachChild(node,visit);
  }visit(ast);
 }
 for(const file of ['app/styles/base.css','app/styles/app.css','app/styles/operator.css','app/styles/responsive.css'])postcss.parse(read(file)).walkRules(rule=>{
  const selectors=rule.selectors.filter(s=>/\.bottom-nav\b|\.operator-mobile-nav\b/.test(s));if(!selectors.length)return;
  let context='';for(let p=rule.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context=p.name+' '+p.params+'/'+context;
  rules.push({file,selectors,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])});
 });
 const needed=new Set([...JSON.stringify(rules).matchAll(/var\((--[\w-]+)/g)].map(m=>m[1]));
 const tokenRoot=postcss.parse(read('app/styles/tokens.css'));let added;
 do{added=false;tokenRoot.walkDecls(decl=>{if(needed.has(decl.prop))for(const match of decl.value.matchAll(/var\((--[\w-]+)/g))if(!needed.has(match[1])){needed.add(match[1]);added=true;}});}while(added);
 tokenRoot.walkDecls(decl=>{if(!needed.has(decl.prop))return;const contexts=[];for(let p=decl.parent;p&&p.type!=='root';p=p.parent)contexts.unshift(p.type==='rule'?p.selector:'@'+p.name+' '+p.params);variables.push({name:decl.prop,value:decl.value,contexts});});
 return {markup:hash(markup),logic:hash(logic),icons:hash(icons),rules:hash(rules),tokens:hash(variables),tokenNames:[...needed].sort()};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const reference=JSON.parse(fs.readFileSync('docs/assets/v21-1/navigation-reference.json','utf8'));
 assert.deepEqual(navigationFoundation(file=>fs.readFileSync(file,'utf8')),reference.snapshot,'Navigation JSX, display/access/scroll logic, icons, both navigation CSS contracts and their transitive theme/safe-area tokens must remain unchanged');
 console.log('Customer and operator bottom navigation: markup, access/display/scroll logic, icons, styles and transitive tokens unchanged against '+reference.commit+'.');
}
