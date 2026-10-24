import {currentNavigationRead} from './navigation-breakpoint-contract.mjs';
import {withoutLocalization} from './localized-source.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import ts from 'typescript';
const require=createRequire(import.meta.url),postcss=require(require.resolve('postcss',{paths:[require.resolve('next')]}));
// V5 moves language selection to the shared header; retain its legacy deep link.
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
assert.ok(settingsRoutes.includes('/einstellungen/sprache'),'The existing language deep link remains available');
assert.ok(!destinations.includes('/einstellungen/sprache'),'V5 exposes language in the shared header without a duplicate settings entry');
assert.match(fs.readFileSync('app/einstellungen/sprache/page.tsx','utf8'),/LanguageSettingsPage/,'Legacy language route retains its actual settings implementation');
assert.deepEqual(destinations.toSorted(),settingsRoutes.filter(route=>route!=='/einstellungen/sprache').toSorted(),'Settings catalogue covers every current subpage exactly once except the explicit V5 language deep link');
assert.match(settingsSource,/access\.canOpen\(href\)/,'Settings catalogue retains route permission filtering');
const currentNavigation=fs.readFileSync('app/design-system/navigation.css','utf8');
assert.throws(()=>currentNavigationRead(()=>currentNavigation.replace('(max-width:760px)','(max-width:1100px)'))('app/design-system/navigation.css'),/mobile dock owner|Tablet/,'Restoring the old tablet dock must fail');
assert.throws(()=>currentNavigationRead(()=>currentNavigation.replace('(max-width:760px)','(max-width:900px)'))('app/design-system/navigation.css'),/mobile dock owner/,'An arbitrary intermediate breakpoint must fail');
const source=withoutLocalization(fs.readFileSync('components/app-shell.tsx','utf8')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
await (await import('./phase1-navigation-contract.mjs')).verifyPhase1Navigation();

// The navigation also inherits the base focus outline; avoid changing it through
// a generic rule that the navigation-only selector digest cannot observe.
const base=postcss.parse(fs.readFileSync('app/design-system/foundation.css','utf8'));
const inheritedFocus=[];
base.walkRules(rule=>{if(rule.selector===':focus-visible')rule.walkDecls('outline',decl=>inheritedFocus.push(decl.value))});
assert.deepEqual(inheritedFocus,['2px solid currentColor'],'Preserve the base focus inherited by navigation links/buttons');
