import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {moduleUrl} from './data-test-modules.mjs';
const base='fc596c4e67e354d464fb8eac2221ebb1ad013096';
/** New named destinations are authorized; historical dock material/geometry is not. */
export async function verifyPhase1Navigation(){
 const read=file=>fs.readFileSync(file,'utf8');
 const {mainNavigation,moreNavigation,primaryNavigationSection}=await import(moduleUrl(read('config/workspace-navigation.ts')));
 assert.deepEqual(mainNavigation.map(({href,label,icon})=>[href,label,icon]),[
  ['/dashboard','Übersicht','house'],['/kunden','Kunden','navigation-users'],['/projekte','Aufträge','briefcase-business'],['/zeit','Zeit','clock3']]);
 assert.deepEqual(moreNavigation.map(group=>[group.title,group.items.map(item=>item.href)]),[
  ['Geschäft',['/angebote','/rechnungen','/finanzen','/spesen']],['Auswertung',['/berichte']],['Verwaltung',['/einstellungen/firma','/einstellungen/team','/einstellungen']],['Hilfe',['/support','/hilfe']]]);
 for(const [route,expected]of [['/kunden/real-id','kunden'],['/projekte/real-id','projekte'],['/zeit','zeit'],['/finanzen/analyse','more'],['/einstellungen/konto','more']])assert.equal(primaryNavigationSection(route),expected);
 const old=execFileSync('git',['show',base+':app/design-system/navigation.css'],{encoding:'utf8'});
 const normalize=css=>css.replace(/font-size:[^;}]+;?/g,'').replace(/font-weight:[^;}]+;?/g,'').replace(/\r\n/g,'\n');
 const current=read('app/design-system/navigation.css');
 assert.equal(normalize(current),normalize(old),'Only authorized text typography may change in the complete dock/FAB owner');
 for(const [from,to]of [['min-width:44px','min-width:32px'],['border-radius:0','border-radius:30px'],['backdrop-filter:none','backdrop-filter:blur(18px)'],['opacity:1','opacity:0']]){
  assert.ok(current.includes(from));assert.notEqual(normalize(current.replace(from,to)),normalize(old),'Geometry/material/label mutation must fail: '+from);
 }
 const shell=read('components/app-shell.tsx');
 assert.match(shell,/mainNavigation\.filter\([^)]*canOpen/,'Primary destinations retain access filtering');
 assert.match(shell,/group\.items\.filter\([^)]*canOpen/,'More destinations retain access filtering');
 assert.doesNotMatch(shell,/navCompact|setNavCompact/,'Labels never disappear on scroll');
 const icon=read('components/ui.tsx');for(const name of ['House','Users','BriefcaseBusiness','Clock3','Ellipsis'])assert.match(icon,new RegExp('\\b'+name+'\\b'));
 const paths=source=>{const ast=ts.createSourceFile('ui.tsx',source,99,true,4);let result;const visit=node=>{if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='paths')result=node.initializer.getText(ast);ts.forEachChild(node,visit)};visit(ast);assert.ok(result);return result};
 const originalIcons=execFileSync('git',['show',base+':components/ui.tsx'],{encoding:'utf8'});
 assert.equal(paths(icon),paths(originalIcons),'All existing non-V2 icon paths remain unchanged');
 assert.notEqual(paths(icon.replace('M3 11.5 12 4l9 7.5','M3 11.5 12 5l9 7.5')),paths(originalIcons),'Existing protected icon mutation is detected');
 console.log('Phase 1 navigation: exact V2 catalogue, owning routes, permission filtering and unchanged dock/FAB geometry/material with negative probes passed. Visual acceptance remains separate.');
}
