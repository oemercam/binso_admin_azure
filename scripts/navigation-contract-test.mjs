import {currentNavigationRead} from './navigation-breakpoint-contract.mjs';
import {withoutLocalization} from './localized-source.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {navigationRules} from './design-system.mjs';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
// Every real settings subpage must remain discoverable in the shared catalogue.
// This catches the previous overview, which omitted account/security/appearance.
const settingsSource=fs.readFileSync('components/settings-navigation.tsx','utf8');
const settingsAst=ts.createSourceFile('settings.tsx',settingsSource,99,true,4);
const destinations=[];
function collectSettings(node){
 if(ts.isVariableDeclaration(node)&&node.name.getText(settingsAst)==='settingsGroups'){
  const collect=value=>{if(ts.isStringLiteral(value)&&value.text.startsWith('/einstellungen/'))destinations.push(value.text);ts.forEachChild(value,collect)};
  collect(node.initializer);
 }
 ts.forEachChild(node,collectSettings);
}
collectSettings(settingsAst);
const settingsRoutes=fs.readdirSync('app/einstellungen',{withFileTypes:true}).filter(entry=>entry.isDirectory()&&fs.existsSync('app/einstellungen/'+entry.name+'/page.tsx')).map(entry=>'/einstellungen/'+entry.name);
assert.deepEqual(destinations.toSorted(),settingsRoutes.toSorted(),'Settings catalogue covers every actual subpage exactly once');
assert.match(settingsSource,/access\.canOpen\(href\)/,'Settings catalogue retains route permission filtering');
const currentNavigation=fs.readFileSync('app/design-system/navigation.css','utf8');
assert.throws(()=>currentNavigationRead(()=>currentNavigation.replace('(max-width:760px)','(max-width:1100px)'))('app/design-system/navigation.css'),/mobile dock owner|Tablet/,'Restoring the old tablet dock must fail');
assert.throws(()=>currentNavigationRead(()=>currentNavigation.replace('(max-width:760px)','(max-width:900px)'))('app/design-system/navigation.css'),/mobile dock owner/,'An arbitrary intermediate breakpoint must fail');
const source=withoutLocalization(fs.readFileSync('components/app-shell.tsx','utf8')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];for(const {file,rule} of navigationRules(file=>fs.readFileSync(file,'utf8'))){for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}}
const reference=JSON.parse(fs.readFileSync('docs/assets/20261020/module-profile-navigation-reference.json','utf8'));
// Explicit app-navigation replacement. Historical baselines remain archived;
// navigation-foundation-test independently enforces unchanged access and destinations.
const digest=createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex');
assert.equal(digest,reference.customerContract,'Navigation matches the explicitly approved D16 role-filtered Microsoft contract');
console.log('Approved customer destinations and flat Microsoft navigation style contract passed.');

// The navigation also inherits the base focus outline; avoid changing it through
// a generic rule that the navigation-only selector digest cannot observe.
const base=postcss.parse(fs.readFileSync('app/design-system/foundation.css','utf8'));
const inheritedFocus=[];
base.walkRules(rule=>{if(rule.selector===':focus-visible')rule.walkDecls('outline',decl=>inheritedFocus.push(decl.value))});
assert.deepEqual(inheritedFocus,['2px solid currentColor'],'Preserve the base focus inherited by navigation links/buttons');
