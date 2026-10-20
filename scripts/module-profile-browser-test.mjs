import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {withoutLocalization} from './localized-source.mjs';
import {readDesignCss} from './design-system.mjs';
import {moduleUrl} from './data-test-modules.mjs';
import {assertFlatMobileNavigation,verifyFlatNavigationAdversaries} from './navigation-ux-browser.mjs';
const {tenantCanOpenPath}=await import(moduleUrl(fs.readFileSync('lib/permissions.ts','utf8')));
const {chromium}=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const before=file=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'show','d707edf0e0e6e4231e50059c45af117fb59fcda2:'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
function nav(source,profile,role='owner'){const ast=ts.createSourceFile('shell.tsx',withoutLocalization(source),99,true,4);let node;function walk(n){if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='nav'&&n.openingElement.attributes.getText(ast).includes('bottom-nav'))node=n.getText(ast);ts.forEachChild(n,walk)}walk(ast);assert(node);const compiled=ts.transpileModule('const element=('+node+');',{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;const create=Function('React','Link','Icon','canOpen','active','setSheet','access',compiled+'return element;');return renderToStaticMarkup(create(React,({href,children,...props})=>React.createElement('a',{href,...props},children),()=>React.createElement('svg',null),href=>tenantCanOpenPath(profile==='time_only'?'member':role,href,profile),'zeit',()=>{},{moduleProfile:profile}));}
const css=readDesignCss(),oldCss=css.replace(fs.readFileSync('app/design-system/navigation.css','utf8'),before('app/design-system/navigation.css'));
const browser=await chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
try{const page=await browser.newPage();for(const width of [320,390,760])for(const theme of ['light','dark']){
 await page.setViewportSize({width,height:900});const render=async(markup,style)=>{await page.setContent('<html data-theme="'+theme+'"><head><style>'+style+'</style></head><body><main style="height:1600px"></main><div class="mobile-dock">'+markup+'</div></body></html>');await assertFlatMobileNavigation(page);return page.locator('.bottom-nav').evaluate(el=>({rect:[el.getBoundingClientRect().x,el.getBoundingClientRect().width,el.getBoundingClientRect().height],items:[...el.children].map(x=>({href:x.getAttribute('href'),text:x.textContent,rect:[x.getBoundingClientRect().x,x.getBoundingClientRect().width,x.getBoundingClientRect().height]}))}));};
 for(const role of ['owner','admin','finance','hr','project_manager','member','reader']){const previousRole=await render(nav(before('components/app-shell.tsx'),'standard',role),oldCss),currentRole=await render(nav(fs.readFileSync('components/app-shell.tsx','utf8'),'standard',role),css);assert.deepEqual(currentRole,previousRole,'Standard navigation preserved for '+role);}
 const previous=await render(nav(before('components/app-shell.tsx'),'standard'),oldCss);const standard=await render(nav(fs.readFileSync('components/app-shell.tsx','utf8'),'standard'),css);assert.deepEqual(standard,previous,'Standard navigation geometry/labels/destinations preserved');
 const restricted=await render(nav(fs.readFileSync('components/app-shell.tsx','utf8'),'time_only'),css);assert.deepEqual(restricted.items.map(x=>x.href),['/zeit',null]);assert.equal(restricted.rect[2],previous.rect[2]);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('href')),'/zeit');await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await assertFlatMobileNavigation(page);if(width===390&&theme==='light')await verifyFlatNavigationAdversaries(page);
}console.log('Navigation rendered comparison: standard unchanged; approved time-only 2 targets; 320/390/760, Light/Dark, keyboard, scrolling and material adversaries passed. No physical-device acceptance.');}finally{await browser.close()}
