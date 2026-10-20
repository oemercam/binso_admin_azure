import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
import {withoutLocalization} from './localized-source.mjs';
import {readDesignCss} from './design-system.mjs';
import {moduleUrl,planAccessModuleUrl} from './data-test-modules.mjs';
import {assertFlatMobileNavigation,verifyFlatNavigationAdversaries} from './navigation-ux-browser.mjs';
const {tenantCanOpenPath}=await import(moduleUrl(fs.readFileSync('lib/permissions.ts','utf8')));
const {planAllowsPath}=await import(planAccessModuleUrl);
const {chromium}=await import(process.env.BINSO_PLAYWRIGHT_MODULE?pathToFileURL(process.env.BINSO_PLAYWRIGHT_MODULE).href:'playwright');
const before=file=>execFileSync('git',['-c','safe.directory='+process.cwd().replaceAll('\\','/'),'show','d25bd5b6178f4ae54b5b57d0779e5d845e1f0ee5:'+file],{encoding:'utf8',maxBuffer:8*1024*1024});
const previousShell=before('components/app-shell.tsx');
const allowed=(role,profile,plan,href)=>tenantCanOpenPath(profile==='time_only'?'member':role,href,profile)&&planAllowsPath(plan,href);
function nav(source,profile,role='owner',plan='pro'){
 const ast=ts.createSourceFile('shell.tsx',withoutLocalization(source),99,true,4);let node;
 function walk(n){if(ts.isJsxElement(n)&&n.openingElement.tagName.getText(ast)==='nav'&&n.openingElement.attributes.getText(ast).includes('bottom-nav'))node=n.getText(ast);ts.forEachChild(n,walk)}walk(ast);assert(node);
 const compiled=ts.transpileModule('const element=('+node+');',{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS}}).outputText;
 const create=Function('React','Link','Icon','canOpen','active','setSheet','access',compiled+'return element;');
 return renderToStaticMarkup(create(React,({href,children,...props})=>React.createElement('a',{href,...props},children),()=>React.createElement('svg',null),href=>allowed(role,profile,plan,href),'zeit',()=>{},{moduleProfile:profile}));
}
const source=fs.readFileSync('components/app-shell.tsx','utf8'),css=readDesignCss(),oldCss=css.replace(fs.readFileSync('app/design-system/navigation.css','utf8'),before('app/design-system/navigation.css'));
const browser=await chromium.launch({headless:true,...(process.env.BINSO_CHROMIUM_EXECUTABLE?{executablePath:process.env.BINSO_CHROMIUM_EXECUTABLE}:{})});
try{
 const page=await browser.newPage();
 for(const width of [320,390,760])for(const theme of ['light','dark']){
  await page.setViewportSize({width,height:900});
  const render=async(markup,style)=>{
   await page.setContent('<html data-theme="'+theme+'"><head><style>'+style+'</style></head><body><main style="height:1600px"></main><div class="mobile-dock">'+markup+'</div></body></html>');
   await assertFlatMobileNavigation(page);
   return page.locator('.bottom-nav').evaluate(el=>({rect:[el.getBoundingClientRect().x,el.getBoundingClientRect().width,el.getBoundingClientRect().height],items:[...el.children].map(x=>{const c=getComputedStyle(x);return {href:x.getAttribute('href'),text:x.textContent,material:[c.color,c.backgroundColor,c.fontSize,c.lineHeight],rect:[x.getBoundingClientRect().x,x.getBoundingClientRect().width,x.getBoundingClientRect().height]}})}));
  };
  for(const role of ['owner','admin','finance','hr','project_manager','member','reader'])for(const plan of ['start','business','pro']){
   const previous=await render(nav(previousShell,'standard',role,plan),oldCss),current=await render(nav(source,'standard',role,plan),css);
   const expected=['/dashboard','/kunden','/finanzen','/zeit'].filter(href=>allowed(role,'standard',plan,href));
   assert.deepEqual(current.items.map(x=>x.href),[...expected,null],'Only authorized targets for '+role+'/'+plan);
   assert.deepEqual(current.rect,previous.rect,'Viewport position and navigation height stay exact');
   assert.equal(await page.locator('.bottom-nav').getAttribute('data-visible-count'),String(expected.length+1));
   for(const item of current.items){const old=previous.items.find(x=>x.href===item.href);assert.ok(old);assert.equal(item.text,old.text);assert.deepEqual(item.material,old.material);assert.equal(item.rect[2],old.rect[2]);}
   if(current.items.length===5)assert.deepEqual(current,previous,'Full five-target geometry remains exact');
  }
  const previous=await render(nav(previousShell,'time_only'),oldCss),restricted=await render(nav(source,'time_only'),css);
  assert.deepEqual(restricted,previous,'Approved time-only geometry remains exact');assert.deepEqual(restricted.items.map(x=>x.href),['/zeit',null]);
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('href')),'/zeit');await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await assertFlatMobileNavigation(page);
  if(width===390&&theme==='light'){
   await verifyFlatNavigationAdversaries(page);
   const forbidden=source.replace('{canOpen("/finanzen")&&<Link href="/finanzen"','{true&&<Link href="/finanzen"');assert.notEqual(forbidden,source);
   const bad=await render(nav(forbidden,'standard','hr','pro'),css);assert.notDeepEqual(bad.items.map(x=>x.href),['/dashboard',null],'Restoring the legacy finance shortcut is detected');
  }
 }
 console.log('Authorized navigation: all seven roles x three tariffs; exact full-five/time-only geometry, unchanged material/height/icons, forbidden-finance countercase, 320/390/760 Light/Dark, keyboard, scroll and material adversaries passed. Physical devices remain open.');
}finally{await browser.close()}
