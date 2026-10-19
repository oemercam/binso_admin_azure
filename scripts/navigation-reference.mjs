// Explicit generator for the owner-approved app-workspace/navigation replacement.
// Historical references stay intact. Tests never call this generator.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {withoutLocalization} from './localized-source.mjs';
import {navigationRules} from './design-system.mjs';
import {navigationFoundation,navigationAccess} from './navigation-foundation-test.mjs';
const base='1a2813d01a9024bd367acff9b3fe61e599e6ed54';
const read=file=>fs.readFileSync(file,'utf8');
const before=file=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'show',base+':'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
// Only the separately tested creation restriction may evolve; existing navigation rights remain exact.
const legacyAccess=file=>file==='components/app-shell.tsx'?read(file).replace('tenantCanCreateAt(access.role,path)&&',''):read(file);
assert.deepEqual(navigationAccess(legacyAccess),navigationAccess(before),'Existing navigation permissions and destinations remain unchanged');
assert.ok(read('components/app-shell.tsx').includes('tenantCanCreateAt(access.role,path)&&'),'Creation must use the server-matched role restriction');
const existingIcons=file=>file==='components/ui.tsx'?read(file).replace(/^    copy: .*\r?\n/m,''):read(file);
assert.equal(navigationFoundation(existingIcons).icons,navigationFoundation(before).icons,'All existing icons stay exact; only the copy action is added');
const source=withoutLocalization(read('components/app-shell.tsx')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];
for(const {file,rule} of navigationRules(read))for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}
const approval='Owner requested the complete app UX package after the 76-route diagnosis: stable visible navigation labels, viewport-wide opaque safe-area background, contextual headers and the later approved labeled creation button in the content command bar, never the global header. Former compact/floating geometry is superseded. 19 October: chat hides navigation; creation is additionally restricted by the server-matched role matrix. Existing destinations and icons remain exact. Derived expectations require independent browser validation; no physical PWA acceptance.';
const reference={base,approval,access:navigationAccess(read),baseIcons:navigationFoundation(read).icons,snapshot:navigationFoundation(read),customerContract:createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex')};
fs.writeFileSync('docs/assets/20261018/stable-navigation-reference.json',JSON.stringify(reference,null,2)+'\n');
const cases=[];for(const theme of ['light','dark'])for(const width of [320,360,375,390,430,540,760])for(const withCreate of [true,false])cases.push({theme,width,withCreate,navigation:{x:0,width,height:68,bottomOffset:0,position:'static',borderRadius:'0px',links:['/dashboard','/kunden','/finanzen','/zeit']}});
fs.writeFileSync('ux-compliance/navigation-baseline.v4.json',JSON.stringify({schemaVersion:4,commit:base,approval,provenance:'Derived explicit design specification, not captured current-output approval. Safe-area and scroll probes are additionally required.',toleranceCssPixels:1,cases},null,2)+'\n');
console.log('Generated stable source contract and explicit full-width geometry specification; historical v3 remains unchanged.');
