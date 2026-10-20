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
const roleApproval=process.argv.includes('--approved-authorized-targets');
const profileApproval=roleApproval||process.argv.includes('--approved-time-only');
const base=roleApproval?'d25bd5b6178f4ae54b5b57d0779e5d845e1f0ee5':profileApproval?'d707edf0e0e6e4231e50059c45af117fb59fcda2':'1a2813d01a9024bd367acff9b3fe61e599e6ed54';
const read=file=>fs.readFileSync(file,'utf8');
const before=file=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'show',base+':'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
// Only the separately tested creation restriction may evolve; existing navigation rights remain exact.
const legacyAccess=file=>file==='components/app-shell.tsx'?read(file).replace('tenantCanCreateAt(access.role,path)&&',''):read(file);
if(!profileApproval)assert.deepEqual(navigationAccess(legacyAccess),navigationAccess(before),'Existing navigation permissions and destinations remain unchanged');
if(!profileApproval)assert.ok(read('components/app-shell.tsx').includes('tenantCanCreateAt(access.role,path)&&'),'Creation must use the server-matched role restriction');
const existingIcons=file=>!profileApproval&&file==='components/ui.tsx'?read(file).replace(/^    copy: .*\r?\n/m,''):read(file);
assert.equal(navigationFoundation(existingIcons).icons,navigationFoundation(before).icons,'All existing icons stay exact; only the copy action is added');
if(profileApproval){
 const normalize=(file,reader)=>{
  if(file!=='app/design-system/navigation.css')return reader(file);
  let source=reader(file).replace(/\r\n/g,'\n');
  source=source.replace(' .mobile-dock>.bottom-nav[data-module-profile="time_only"]{grid-template-columns:repeat(2,minmax(44px,max-content))}\n','');
  if(roleApproval)for(const n of [1,2,3,4])source=source.replace(' .mobile-dock>.bottom-nav[data-visible-count="'+n+'"]{grid-template-columns:repeat('+n+',minmax(44px,max-content))}\n','');
  return source;
 };
 const old=navigationFoundation(file=>normalize(file,before)),current=navigationFoundation(file=>normalize(file,read));
 for(const key of ['rules','tokens','icons'])assert.deepEqual(current[key],old[key],'Unchanged common navigation '+key);
 execFileSync(process.execPath,['scripts/module-profile-browser-test.mjs'],{stdio:'inherit'});
}
const source=withoutLocalization(read('components/app-shell.tsx')),ast=ts.createSourceFile('shell.tsx',source,99,true,4);let navigation;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(ast)==='nav'&&node.openingElement.attributes.getText(ast).includes('bottom-nav'))navigation=node.getText(ast);ts.forEachChild(node,visit)}visit(ast);assert(navigation);
const styles=[];
for(const {file,rule} of navigationRules(read))for(const selector of rule.selectors.filter(s=>s.includes('.bottom-nav'))){let context='';for(let p=rule.parent;p?.type!=='root';p=p?.parent){if(!p)break;if(p.type==='atrule')context=p.name+' '+p.params+' / '+context}styles.push({file,selector,context,declarations:rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value,n.important])})}
const approval=roleApproval?'20 October 2026 V25.5 PL-G19 explicit authorized-target rule expands D16 to all roles and plans: only authorized existing targets, fewer than five allowed. No change to material/icons/height/position/blue FAB. Rendered comparisons against qualified d25bd5b6 cover all seven roles and three plans at 320/390/760 Light/Dark, keyboard/scroll and negative material/permission probes. Not physical PWA acceptance.':profileApproval?'20 October 2026 explicit owner approval D16: time_only shows only authorized destinations, fewer than five allowed. Existing material, icons, height, position and blue create remain. Standard-role geometry compared with d707 in a rendered Chromium adapter at 320/390/760px Light/Dark, keyboard and scroll. Not physical PWA acceptance.':'Owner requested the complete app UX package after the 76-route diagnosis: stable visible navigation labels, viewport-wide opaque safe-area background, contextual headers and the later approved labeled creation button in the content command bar, never the global header. Former compact/floating geometry is superseded. 19 October: chat hides navigation; creation is additionally restricted by the server-matched role matrix. Existing destinations and icons remain exact. Derived expectations require independent browser validation; no physical PWA acceptance.';
const reference={base,approval,access:navigationAccess(read),baseIcons:navigationFoundation(read).icons,snapshot:navigationFoundation(read),customerContract:createHash('sha256').update(JSON.stringify({navigation,styles})).digest('hex')};
fs.mkdirSync('docs/assets/20261020',{recursive:true});
fs.writeFileSync(roleApproval?'docs/assets/20261020/authorized-navigation-reference.json':profileApproval?'docs/assets/20261020/module-profile-navigation-reference.json':'docs/assets/20261018/stable-navigation-reference.json',JSON.stringify(reference,null,2)+'\n');
const cases=[];for(const theme of ['light','dark'])for(const width of [320,360,375,390,430,540,760])for(const withCreate of [true,false])cases.push({theme,width,withCreate,navigation:{x:0,width,height:68,bottomOffset:0,position:'static',borderRadius:'0px',links:['/dashboard','/kunden','/finanzen','/zeit']}});
if(!profileApproval)fs.writeFileSync('ux-compliance/navigation-baseline.v4.json',JSON.stringify({schemaVersion:4,commit:base,approval,provenance:'Derived explicit design specification, not captured current-output approval. Safe-area and scroll probes are additionally required.',toleranceCssPixels:1,cases},null,2)+'\n');
console.log('Generated stable source contract and explicit full-width geometry specification; historical v3 remains unchanged.');
