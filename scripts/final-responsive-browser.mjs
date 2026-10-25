import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {localeTestModuleUrl,moduleUrl} from './data-test-modules.mjs';
import {selectAppOption} from './app-select-browser.mjs';
import {waitForFiniteAnimations} from './shared-control-browser.mjs';
import {writeTestOutput} from './test-output.mjs';
const {translateMessage}=await import(await localeTestModuleUrl());
const {localeTags}=await import(moduleUrl(await fs.readFile('lib/locales/config.ts','utf8')));

/** Bounded final sample, using the existing harness/API fixtures and real QA session. */
export async function verifyFinalResponsiveSample({page,base,theme,locale,navigate,capture,output}){
 const t=value=>translateMessage(value,locale),results=[];
 const settle=async()=>{await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);await waitForFiniteAnimations(page);};
 const inspect=async()=>{
  const geometry=await page.evaluate(()=>{
   const visible=el=>el.checkVisibility()&&el.getBoundingClientRect().width>0;
   const box=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
   const roots=[...document.querySelectorAll('.page-container,.desktop-appbar,.bottom-sheet,.header-panel')].filter(visible);
   const grids=[...document.querySelectorAll('.bo-metric-tiles,.detail-grid')].filter(visible).map(el=>({parent:box(el),children:[...el.children].filter(visible).map(box)}));
   const controls=[...document.querySelectorAll('.filter-sheet-actions button,.form-control,.sheet-header h2,.page-head h1')].filter(visible).map(el=>({tag:el.tagName,...box(el)}));
   return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,roots:roots.map(box),grids,controls,tables:document.querySelectorAll('table,.records-list').length,charts:document.querySelectorAll('svg[role="img"],.bo-statistics').length};
  });
  assert.equal(geometry.lang,localeTags[locale],'Actual page language matches the requested sample');
  assert.equal(geometry.theme,theme,'Actual page theme matches the requested sample');
  assert.ok(geometry.scrollWidth<=geometry.width+1,'No document-level horizontal overflow: '+JSON.stringify(geometry));
  for(const rect of [...geometry.roots,...geometry.controls])assert.ok(rect.left>=-1&&rect.right<=geometry.width+1,'Visible headings/controls stay inside the viewport: '+JSON.stringify(rect));
  for(const grid of geometry.grids)for(const child of grid.children)assert.ok(child.left>=grid.parent.left-1&&child.right<=grid.parent.right+1,'Cards remain inside their shared grid');
  return geometry;
 };
 const footer=async sheet=>{
  const actions=sheet.locator('.filter-sheet-actions,.mobile-sticky-save').filter({visible:true}).last();
  await actions.waitFor();const bounds=await actions.boundingBox();const viewport=page.viewportSize();
  assert.ok(bounds.y>=0&&bounds.y+bounds.height<=viewport.height+1,'Dialog footer actions remain reachable');
  for(const button of await actions.getByRole('button').all()){const r=await button.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=viewport.width+1,'Footer labels/buttons fit horizontally');}
 };
 for(const width of [1280,1440,1920,2560,3840]){
  await page.setViewportSize({width,height:1000});
  for(const route of ['/dashboard','/rechnungen','/kunden/customer-one','/rechnungen/neu']){
   page=await navigate(base+route+'?lang='+locale);await settle();
   const geometry=await inspect();
   const name=`${locale}-${theme}-${width}-${route.replace(/[^a-zA-Z0-9]/g,'_')}`;
   await capture(page,name);
   if(route==='/dashboard'){
    const toggle=page.locator('.desktop-navigation-toggle');await toggle.waitFor();
    const expanded=await toggle.getAttribute('aria-expanded');await toggle.click();
    await page.waitForFunction(before=>document.querySelector('.desktop-navigation-toggle')?.getAttribute('aria-expanded')!==before,expanded);
    await settle();await inspect();await capture(page,name+'-sidebar-toggled');
    await toggle.click();await page.waitForFunction(before=>document.querySelector('.desktop-navigation-toggle')?.getAttribute('aria-expanded')===before,expanded);await settle();
   }
   if(route==='/kunden/customer-one'){
    assert.equal(await page.getByRole('tab').count(),0,'V7 customer hub has no tabs');assert.deepEqual((await page.locator('.navigation-group .action-row-label').allTextContents()).map(x=>x.trim()),['Aufträge','Angebote','Rechnungen','Zahlungen','Kontakte','Dateien','Verlauf','Stammdaten'].map(t),'V7 hub preserves eight localized destinations');
    assert.equal(await page.locator('details.financial-snapshot').count(),0,'Retired customer chart is absent');
    for(const section of ['contacts','files','activity','details']){page=await navigate(base+route+'?lang='+locale+'&section='+section);await settle();await inspect();await capture(page,name+'-'+section);}
   }
   if(route==='/rechnungen/neu'){
    const form=page.locator('.app-editing .document-entry-page');await form.waitFor();await footer(form);
    await form.getByRole('button',{name:t('Weiter'),exact:true}).click();
    await page.getByRole('button',{name:t('Gesamtrabatt'),exact:true}).click();
    const sheet=page.getByRole('dialog',{name:t('Gesamtrabatt'),exact:true});await sheet.waitFor();
    await selectAppOption(sheet.getByLabel(t('Rabattart'),{exact:true}),'percent');
    await sheet.getByLabel(t('Rabatt in Prozent'),{exact:true}).fill('5');await footer(sheet);await inspect();await capture(page,name+'-dialog');
    await sheet.getByRole('button',{name:t('Abbrechen'),exact:true}).click();
    const discard=page.getByRole('alertdialog');await discard.waitFor();
    assert.equal(await sheet.isVisible(),true,'Dirty dialog stays open until the user confirms discarding changes');
    await discard.getByRole('button',{name:t('Verwerfen'),exact:true}).click();await sheet.waitFor({state:'hidden'});
   }
   results.push({locale,theme,width,route,passed:true,geometry,browserZoom:'not-tested',physicalDevice:false});
  }
 }
 await fs.mkdir(output,{recursive:true});
 await writeTestOutput(path.join(output,`sample-${locale}-${theme}.json`),JSON.stringify({scope:'Four representative routes; synthetic API fixtures, real isolated SSR session; no full V25 matrix',results},null,2)+'\n');
 console.log(`Final responsive sample passed: ${locale}/${theme}, ${results.length} route/width cases, sidebar and dialog pointer interactions.`);
 return results;
}
