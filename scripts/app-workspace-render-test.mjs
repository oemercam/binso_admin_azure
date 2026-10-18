// Small isolated render check of real shared markup/CSS; no backend or full matrix.
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {withoutLocalization} from './localized-source.mjs';
import {assertStableAppNavigation,verifyStableAppNavigation} from './app-workspace-browser.mjs';
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
const engines=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const browser=await engines.chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage();let cases=0;
 for(const width of [320,390,760])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:740});await page.setContent('<!doctype html><html data-theme="'+theme+'"><style>'+css+'\n.fixture-spacer{height:1400px}</style><body>'+markup+'</body></html>');
  await assertStableAppNavigation(page);await verifyStableAppNavigation(page);cases++;
 }
 console.log('Real CreateAction/Button, source navigation and all 14 CSS owners: '+cases+' narrow/theme render cases with scroll, 34px safe area and hidden-label adversary passed.');
}finally{await browser.close()}
