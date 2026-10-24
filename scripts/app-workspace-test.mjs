import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {withoutLocalization} from './localized-source.mjs';
import {navigationAccess} from './navigation-foundation-test.mjs';
const require=createRequire(import.meta.url),read=file=>fs.readFileSync(file,'utf8');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const ast=ts.createSourceFile('workspace.tsx',withoutLocalization(read('components/binso-ux.tsx')),99,true,4);
const source="const Fragment=require('react').Fragment;\n"+ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n');
const exports={},root={current:null};let state=0,guard;
const control=({children,...props})=>React.createElement('button',props,children);
Function('require','exports','Children','isValidElement','cloneElement','useState','useRef','useEffect','useRouter','useDialogFocus','useBrowserBackGuard','ConfirmDialog','FormActions','Button','Icon','createPortal','document',compile(source))(
 require,exports,React.Children,React.isValidElement,React.cloneElement,
 initial=>[state++===1?true:initial,()=>{}],()=>root,()=>{},()=>({push(){}}),()=>root,(active,blocked,unload)=>{guard={active,unload};return()=>{}},()=>null,
 ({children})=>React.createElement('footer',null,children),control,()=>React.createElement('svg'),children=>children,{body:{}});
function render(workspace,dirty=true,busy=false,children=React.createElement('input',{defaultValue:'Unsaved'})){state=0;return renderToStaticMarkup(React.createElement(exports.FormSheet,{label:'Task',open:true,workspace,onClose(){},description:'Details',dirty,busy},children));}
const inline=render(true),modal=render(false);
const fragmented=render(true,true,false,React.createElement(React.Fragment,null,React.createElement('input'),React.createElement('div',{className:'filter-sheet-actions'},'Save')));
assert.match(fragmented,/<div class="sheet-body"[^>]*><input[^>]*><\/div><div class="filter-sheet-actions">Save<\/div>/,'Fragmented document editors retain an outer action footer');
assert.match(inline,/role="dialog"/);assert.match(inline,/aria-modal="true"/);assert.match(inline,/form-sheet-expanded/);assert.match(inline,/sheet-layer/,"Expanded route editors share the actual modal owner");
assert.match(inline,/value="Unsaved"/);assert.match(inline,/aria-label="Schliessen"/,'Workspace keeps an explicit guarded exit');
assert.match(modal,/role="dialog"/);assert.match(modal,/aria-modal="true"/);assert.match(modal,/sheet-layer/,'Short contextual forms retain actual modal behavior');
render(true,false,true);assert.deepEqual(guard,{active:true,unload:true},'A pending pristine save protects browser back/unload too');
render(true,false,false);assert.deepEqual(guard,{active:false,unload:false},'A pristine idle workspace does not trap back/unload');
const access=navigationAccess(read);
const discardConditions=[];
const findDiscard=node=>{if(ts.isIfStatement(node)&&node.thenStatement.getText(ast).includes('binso-draft-discard'))discardConditions.push(node.expression.getText(ast));ts.forEachChild(node,findDiscard)};
findDiscard(ast);
assert.equal(discardConditions.length,1,'One central page-draft discard owner');
for(const [sheets,parent,expected] of [[1,false,true],[2,false,false],[1,true,false],[2,true,false]]){
 const doc={querySelectorAll:()=>Array(sheets),querySelector:selector=>parent&&selector==='.app-editing .document-entry-page'?{}:null};
 assert.equal(Function('document','return ('+discardConditions[0]+')')(doc),expected,'Only a sole sheet without a full-page parent may clear page recovery');
}
assert.notDeepEqual(navigationAccess(file=>file==='components/app-shell.tsx'?read(file).replaceAll('mainNavigation.filter(item=>canOpen(item.href))','mainNavigation.filter(item=>true)'):read(file)),access,'A changed destination permission cannot pass the layout migration');
assert.notDeepEqual(navigationAccess(file=>file==='components/app-shell.tsx'?read(file).replace('href={item.href} className={primaryNavigationSection','href="/zahlungen" className={primaryNavigationSection'):read(file)),access,'A changed bottom navigation target cannot pass');
const display={};Function('require','exports',compile(read('lib/display-format.ts').replace('import {formatCurrency} from "./financial-status";','')))(require,display);
assert.equal(display.messageDay('2026-10-17T22:30:00Z'),'18.10.2026','Zurich midnight is a new chat day');
assert.equal(display.messageDay('2026-01-17T22:30:00Z'),'17.01.2026','Winter offset is respected');
assert.equal(display.messageDay('invalid'),'','Bad metadata never invents Today');
console.log('Actual workspace/modal rendering, guarded-exit presence, unchanged-access adversaries and Swiss chat-day boundaries passed.');

// The mobile header already owns the title: status-only metadata still needs context.
{
 const headingAst=ts.createSourceFile('binso-ux.tsx',read('components/binso-ux.tsx'),99,true,4),heading={};
 const actualHeading=headingAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='DetailHeading').getText(headingAst);
 Function('require','exports','LocalizedText','Status',compile(actualHeading))(require,heading,({children})=>children,({children})=>React.createElement('span',{className:'status'},children));
 const markup=props=>renderToStaticMarkup(React.createElement(heading.DetailHeading,{title:'Synthetic order',...props}));
 assert.match(markup({status:'Aktiv',statusPlacement:'subtitle'}),/<p class="bo-detail-meta"><span>Status<\/span><span class="status">Aktiv<\/span><\/p>/,'A status-only detail has a labeled information row, never an isolated badge');
 const described=markup({status:'Aktiv',statusPlacement:'subtitle',subtitle:'Synthetic customer'});
 assert.ok(described.includes('Synthetic customer')&&!described.includes('<span>Status</span>'),'Existing meaningful subtitles are not duplicated');
 assert.ok(!markup({}).includes('bo-detail-meta'),'A missing status never creates a new empty row');
 assert.ok(!markup({status:'Aktiv',statusPlacement:'title'}).includes('bo-detail-meta'),'Desktop title placement remains unchanged');
}

// The retired visible update UI cannot return through customer or operator shells.
assert.equal(fs.existsSync('components/app-version-notice.tsx'),false);
for(const file of ['components/app-shell.tsx','components/operator.tsx','app/design-system/layout.css'])assert.doesNotMatch(read(file),/AppVersionNotice|app-version-notice/);
assert.doesNotMatch(read('components/pwa-register.tsx'),/location\.reload|Neue Version verfügbar/,'Silent SW lifecycle never reloads an active editor');

// Actual ActionsMenu state: keep the modal between a busy action's first and second tap.
const menuAst=ts.createSourceFile('binso-ux.tsx',read('components/binso-ux.tsx'),99,true,4),menuFunction=menuAst.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='ActionsMenu').getText(menuAst);
const menuExports={},menuStates=[];let menuCursor=0,menuEffects=[],menuFrames=[];
class MenuTarget{closest(){return this}}
Function('require','exports','useState','useEffect','RowActions','ActionSheet','requestAnimationFrame','cancelAnimationFrame','Element',compile(menuFunction))(require,menuExports,initial=>{const at=menuCursor++;if(!(at in menuStates))menuStates[at]=initial;return [menuStates[at],value=>{menuStates[at]=value}]},effect=>menuEffects.push(effect),control,control,callback=>{menuFrames.push(callback);return menuFrames.length},()=>{},MenuTarget);
const menuRender=busy=>{menuCursor=0;menuEffects=[];return React.Children.toArray(menuExports.ActionsMenu({label:'Actions',children:'Export',busy}).props.children)};
let menu=menuRender(false);menu[0].props.onClick();menu=menuRender(false);menu[1].props.children.props.onClick({target:new MenuTarget()});
menu=menuRender(true);menuEffects.forEach(effect=>effect());assert.equal(menu[1].props.open,true);assert.equal(menuFrames.length,0,'An in-flight action never removes the overlay and exposes the page to a second tap');
menu=menuRender(false);menuEffects.forEach(effect=>effect());menuFrames.forEach(frame=>frame());menuFrames=[];menu=menuRender(false);assert.equal(menu[1].props.open,false,'The action menu closes after the operation has completed');

// Render the actual role overview, including legitimate zeroes and restricted data.
{
 const pageSource=read('components/pages/dashboard.tsx'),pageAst=ts.createSourceFile('dashboard.tsx',pageSource,99,true,4),actual=pageAst.statements.filter(node=>ts.isFunctionDeclaration(node)&&['DashboardPage','DashboardOverview'].includes(node.name?.text)).map(node=>node.getText(pageAst)).join('\n');
 const dashboard={},financial=await import((await import('./data-test-modules.mjs')).financialModuleUrl);
 let payload;
 const Wrapper=({children})=>React.createElement('main',null,children),Text=({children})=>children,Row=({title,meta,value})=>React.createElement('div',null,title,' ',meta,' ',value),Heading=({title})=>React.createElement('h2',null,title),Cash=({afterMetrics})=>React.createElement('section',{'data-cash':true},afterMetrics);
 Function('require','exports','useBackendMode','useApiQuery','isProductionBackendEnabled','financialStatus','formatCurrency','AppShell','QuickCreateAction','CashOverview','LocalizedText','ListRow','SectionTitle','Link','DocumentSummaryRow','LoadingState','ErrorState','EmptyState','useDashboardGreeting','useTranslation','SetupGuideView',compile(actual))(require,dashboard,()=>true,()=>({data:payload,loading:false,error:null,refresh(){}}),()=>true,financial.financialStatus,financial.formatCurrency,Wrapper,()=>null,Cash,Text,Row,Heading,({children,href})=>React.createElement('a',{href},children),()=>null,()=>null,()=>null,({title})=>title,()=>'Guten Tag',()=>value=>value,()=>null);
 const render=()=>renderToStaticMarkup(React.createElement(dashboard.DashboardPage));
 payload={canFinance:false,canInvoices:false,work:{hours:198,pending:1,expenses:0,timeReviews:null,expenseReviews:null},stats:{customer_count:1,project_count:2}};
 const member=render();assert.match(member,/198 h/);assert.doesNotMatch(member,/data-cash|Zeitfreigaben|Zuletzt bearbeitete Rechnungen/,'Member focus contains own work, never finance or review controls');
 payload={canFinance:true,canInvoices:true,cash:{},work:{hours:0,pending:0,expenses:0,timeReviews:2,expenseReviews:3},stats:{customer_count:5,project_count:3,employee_count:3}};
 const owner=render();assert.match(owner,/data-cash/);assert.match(owner,/Zeitfreigaben/);assert.match(owner,/Spesenfreigaben/);assert.match(owner,/Mitarbeiter/);
 payload={canFinance:false,canInvoices:false,work:{hours:null,pending:null,expenses:null,timeReviews:null,expenseReviews:null},stats:{customer_count:null,project_count:null,employee_count:3}};
 const hr=render();assert.match(hr,/Mitarbeiter/);assert.doesNotMatch(hr,/Meine Arbeit|Kundenbestand|data-cash/,'HR is not shown empty work groups or financial numbers');
 console.log('Actual role dashboard: owner/employee/HR focus, legitimate zeroes and forbidden section negatives passed.');
}
