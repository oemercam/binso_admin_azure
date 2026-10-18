// Small isolated render check of real shared markup/CSS; no backend or full matrix.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {withoutLocalization} from './localized-source.mjs';
import {assertStableAppNavigation,verifyStableAppNavigation} from './app-workspace-browser.mjs';
import {assertMobileHeaderTargets,verifyHeaderTargetRegression} from './shared-control-browser.mjs';
const require=createRequire(import.meta.url),read=file=>fs.readFile(file,'utf8');
const compile=source=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const ast=ts.createSourceFile('ui.tsx',withoutLocalization(await read('components/ui.tsx')),99,true,4);
const ui={};Function('require','exports','Children','cloneElement','isValidElement','useId','usePageAccess','Link',compile(ast.statements.filter(n=>!ts.isImportDeclaration(n)).map(n=>n.getText(ast)).join('\n')))(require,ui,React.Children,React.cloneElement,React.isValidElement,React.useId,()=>({write:true,canOpen:()=>true}),({children,...props})=>React.createElement('a',props,children));
const uxAst=ts.createSourceFile('ux.tsx',withoutLocalization(await read('components/binso-ux.tsx')),99,true,4),ux={};
Function('require','exports','Button',compile(uxAst.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='CreateAction').getText(uxAst)))(require,ux,ui.Button);
const shell=ts.createSourceFile('shell.tsx',withoutLocalization(await read('components/app-shell.tsx')),99,true,4);let nav;
function visit(node){if(ts.isJsxElement(node)&&node.openingElement.tagName.getText(shell)==='nav'&&node.openingElement.attributes.getText(shell).includes('bottom-nav'))nav=node.getText(shell);ts.forEachChild(node,visit)}visit(shell);
const fixture={};Function('require','exports','Link','Icon','canOpen','active','setSheet',compile('export function Nav(){return '+nav+'}'))(require,fixture,({children,...props})=>React.createElement('a',props,children),ui.Icon,()=>true,'kunden',()=>{});
const manifest=JSON.parse(await read('app/design-system/manifest.json')),css=(await Promise.all(manifest.sources.map(({path})=>read(path)))).join('\n');
const markup=renderToStaticMarkup(React.createElement('div',{className:'app-root app-section-kunden'},React.createElement('div',{className:'app-main'},React.createElement('header',{className:'mobile-header app-header'},React.createElement('div',{className:'mobile-header-leading'},React.createElement('h1',{className:'mobile-section-title'},'Kunden')),React.createElement('div',{className:'mobile-header-actions app-header-actions'},React.createElement(ux.CreateAction,{href:'/kunden/neu',label:'Neuer Kunde'}),React.createElement(ui.IconButton,{label:'Suche',icon:'search'}),React.createElement(ui.IconButton,{label:'Benachrichtigungen',icon:'bell'}),React.createElement('button',{className:'avatar avatar-button','aria-label':'Benutzerkonto'},React.createElement('span',{className:'person-avatar person-avatar-small'},'AB')))),React.createElement('main',{className:'page-container'},React.createElement('p',null,'Synthetic shared-component fixture'),React.createElement('div',{className:'fixture-spacer'}),React.createElement('button',null,'Last action')),React.createElement('div',{className:'mobile-dock'},React.createElement(fixture.Nav)))));
const chrome={};Function('require','exports',compile(await read('components/app-chrome.tsx')))(require,chrome);
const detailMarkup=renderToStaticMarkup(React.createElement('div',{className:'app-root'},React.createElement(chrome.AppHeader,{className:'mobile-header mobile-header-detail',detail:true,contentHeader:true,leadingClassName:'mobile-header-leading',actionClassName:'mobile-detail-actions',leading:React.createElement(React.Fragment,null,React.createElement('a',{href:'/rechnungen',className:'mobile-back','aria-label':'Zurück'},React.createElement(ui.Icon,{name:'back'})),React.createElement('div',{className:'mobile-header-context'},React.createElement('h1',{className:'mobile-header-title'},'RE-2026-123456'),React.createElement(ui.Status,null,'Entwurf'))),actions:React.createElement('div',{className:'document-header-icons'},React.createElement(ui.IconButton,{label:'Bearbeiten',icon:'edit'}),React.createElement(ui.IconButton,{label:'Weitere Aktionen',icon:'more'}))})));
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const footerMarkup=renderToStaticMarkup(React.createElement('main',{className:'page-container'},React.createElement('section',{className:'form-workspace'},React.createElement('form',null,React.createElement('div',{className:'sheet-form-footer'},React.createElement(ui.FormActions,null,React.createElement(ui.Button,{variant:'secondary'},'Abbrechen'),React.createElement(ui.Button,{type:'submit'},'Ticket erstellen')))))));
const browser=await engines.chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage();let cases=0;
 for(const width of [320,390,760])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:740});await page.setContent('<!doctype html><html data-theme="'+theme+'"><style>'+css+'\n.fixture-spacer{height:1400px}</style><body>'+markup+'</body></html>');
  await assertStableAppNavigation(page);await verifyStableAppNavigation(page);cases++;
 }
 for(const width of [320,390]){
  await page.setViewportSize({width,height:740});await page.setContent('<!doctype html><html data-theme="light"><style>'+css+'</style><body>'+detailMarkup+'</body></html>');
  await assertMobileHeaderTargets(page);await page.getByRole('heading',{name:'RE-2026-123456',exact:true}).waitFor();
  await verifyHeaderTargetRegression(page);cases++;
 }
 for(const width of [320,390]){
  await page.setViewportSize({width,height:740});await page.setContent('<!doctype html><html data-theme="light"><style>'+css+'</style><body>'+footerMarkup+'</body></html>');
  const fits=()=>page.locator('.sheet-form-footer').evaluate(footer=>Array.from(footer.querySelectorAll('.button')).every(button=>{const box=button.getBoundingClientRect();return box.left>=0&&box.right<=innerWidth&&box.height>=44&&button.scrollWidth<=button.clientWidth+1}));
  assert.ok(await fits(),'Workspace actions fit narrow screens without clipped labels');
  const old=await page.addStyleTag({content:'.form-workspace .sheet-form-footer .mobile-sticky-save{width:auto;min-width:auto}.form-workspace .sheet-form-footer .button{white-space:nowrap}'});
  assert.equal(await fits(),false,'Negative control catches the retired overflowing footer');await old.evaluate(el=>el.remove());cases++;
 }
 console.log('Real CreateAction/Button/AppHeader/FormActions, source navigation and all 14 CSS owners: '+cases+' render cases with scroll, safe area, distinct title/status and negative target/layout controls passed.');
}finally{await browser.close()}
