import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {withoutLocalization} from './localized-source.mjs';
import {navigationRules} from './design-system.mjs';
import {navigationFoundation} from './navigation-foundation-test.mjs';
import {currentNavigationRead,readableNavigationSource,readableOperatorNavigationSource} from './navigation-breakpoint-contract.mjs';

// Explicit generator for the approved Microsoft/legacy-cleanup decision.
// No test calls this generator and no historical reference is overwritten.
const base='51024b189f7746cbf7fe50c9107a978cdb6b5c2f';
const read=file=>fs.readFileSync(file,'utf8');
const before=file=>execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
const migratedBefore=file=>file==='app/design-system/navigation.css'?readableNavigationSource(before(file)):file==='components/operator.tsx'?readableOperatorNavigationSource(before(file)):before(file);
for(const file of ['components/app-shell.tsx','components/operator.tsx','components/app-chrome.tsx'])assert.ok(!/dock-create-action|mobile-dock-action/.test(read(file)),'Retired action selectors must have no runtime producer');
const invariants=navigationFoundation(currentNavigationRead(migratedBefore),{geometryOnly:true});
assert.deepEqual(navigationFoundation(currentNavigationRead(read),{geometryOnly:true}),invariants,'Only dominated declarations and the explicitly approved readable labels change; real bounds, motion, markup, permissions, icons and safe areas stay exact');
const source=withoutLocalization(read('components/app-shell.tsx')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];
for(const {file,rule} of navigationRules(read))for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}
const reference={base,approval:'Owner requested a complete visible-interface readability/cascade cleanup after deployment: 12px navigation labels with adequate line space, intrinsic columns with 44px targets, compact operator labels Start/Status with full accessible names, and removal of dominated rules. Live nav bounds, rights, icons, motion and safe areas remain protected. Historical references remain unchanged.',snapshot:navigationFoundation(read),invariants,customerContract:createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex')};
fs.mkdirSync('docs/assets/20261018',{recursive:true});fs.writeFileSync('docs/assets/20261018/readable-navigation-reference.json',JSON.stringify(reference,null,2)+'\n');
console.log('Generated current Microsoft source contract after exact approved label-readability/cascade migration. Runtime navigation-baseline.v3 geometry is unchanged.');
