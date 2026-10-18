import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {withoutLocalization} from './localized-source.mjs';
import {navigationRules} from './design-system.mjs';
import {navigationFoundation} from './navigation-foundation-test.mjs';
import {historicalNavigationRead} from './navigation-breakpoint-contract.mjs';

// Explicit one-time generator for the owner's 2026-10-18 material decision.
// No test calls this generator and no historical reference is overwritten.
const base='015cc28455657f16292c10e7fd05d2f1ced0e98c';
const read=file=>fs.readFileSync(file,'utf8');
const before=file=>execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
const invariants=navigationFoundation(historicalNavigationRead(before),{geometryOnly:true});
assert.deepEqual(navigationFoundation(historicalNavigationRead(read),{geometryOnly:true}),invariants,'Material approval cannot change geometry, motion, markup, permissions, icons or safe-area tokens');
const source=withoutLocalization(read('components/app-shell.tsx')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];
for(const {file,rule} of navigationRules(read))for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}
const reference={base,approval:'Owner explicitly chose flat white Microsoft mobile navigation on 2026-10-18. Same destinations, rights, safe areas and motion; derived dark canvas. Historical source and geometry remain archived.',snapshot:navigationFoundation(read),invariants,customerContract:createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex')};
fs.mkdirSync('docs/assets/20261018',{recursive:true});fs.writeFileSync('docs/assets/20261018/navigation-reference.json',JSON.stringify(reference,null,2)+'\n');
const previous=JSON.parse(read('ux-compliance/navigation-baseline.v2.json'));
const baseline={...previous,schemaVersion:3,commit:base,provenance:'Explicit 2026-10-18 flat material approval. Expected bounds/destinations inherited unchanged from archived v2; only expected radius becomes 0px. Current rendered cases must independently pass these expectations; this is not physical PWA approval.',approval:reference.approval,cases:previous.cases.filter(c=>c.width<=760).map(c=>({...c,navigation:{...c.navigation,borderRadius:'0px'}}))};
fs.writeFileSync('ux-compliance/navigation-baseline.v3.json',JSON.stringify(baseline,null,2)+'\n');
console.log('Generated explicit flat-navigation contracts; historical invariants match exactly.');
