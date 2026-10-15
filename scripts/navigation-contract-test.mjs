import {withoutLocalization} from './localized-source.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
const source=withoutLocalization(fs.readFileSync('components/app-shell.tsx','utf8')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];for(const file of ['app/styles/app.css','app/styles/responsive.css'])postcss.parse(fs.readFileSync(file,'utf8')).walkRules(rule=>{for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}});
const reference=JSON.parse(fs.readFileSync('docs/assets/20261013/navigation-reference.json','utf8'));
const digest=createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex');
assert.equal(digest,reference.customerContract,'Navigation must match the approved 2026-10-13 glass/dock contract');
console.log('Approved customer navigation destinations and shared glass/dock style contract passed.');

// The frozen dock also inherits the base focus outline; avoid changing it through
// a generic rule that the navigation-only selector digest cannot observe.
const base=postcss.parse(fs.readFileSync('app/styles/base.css','utf8'));
const inheritedFocus=[];
base.walkRules(rule=>{if(rule.selector===':focus-visible')rule.walkDecls('outline',decl=>inheritedFocus.push(decl.value))});
assert.deepEqual(inheritedFocus,['2px solid currentColor'],'Preserve the base focus inherited by frozen navigation links/buttons');
