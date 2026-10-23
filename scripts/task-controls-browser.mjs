import {appControlValue,selectAppOption} from './app-select-browser.mjs';
import assert from 'node:assert/strict';

/** V4 real-route regression: immediate selection, keyboard and independent reset. */
export async function verifyRecordTools(page){
 const filter=page.getByRole('combobox',{name:'Filter',exact:true}),sort=page.getByRole('combobox',{name:'Sortieren',exact:true});
 const search=page.locator('.records-search-row').getByRole('searchbox');
 const previous={filter:await appControlValue(filter),sort:await appControlValue(sort),search:await search.inputValue()};
 await sort.click();const popup=page.getByRole('listbox',{name:'Sortieren',exact:true});await popup.waitFor();
 await popup.evaluate(async el=>{await document.fonts.ready;await Promise.all(el.getAnimations().filter(a=>Number.isFinite(a.effect?.getComputedTiming().endTime)).map(a=>a.finished.catch(()=>{})));await new Promise(resolve=>requestAnimationFrame(resolve));});
 assert.equal(await popup.locator('.records-choice-title').innerText(),'Sortieren nach');const titleBox=await popup.locator('.records-choice-title').boundingBox(),popupBox=await popup.boundingBox();assert.ok(titleBox.y>=popupBox.y&&titleBox.y+titleBox.height<=popupBox.y+popupBox.height,'The popup title must actually remain visible, not scroll above its viewport');
 assert.equal(await page.getByRole('dialog',{name:'Filter und Sortierung',exact:true}).count(),0,'Simple tools never open the retired combined bottom sheet');
 const geometry=await popup.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,left:r.left,right:r.right,top:r.top,bottom:r.bottom,viewport:innerWidth,height:innerHeight,rows:[...el.querySelectorAll('[role=option]')].filter(x=>!x.hidden).map(x=>({height:x.getBoundingClientRect().height,radius:getComputedStyle(x).borderRadius}))}});
 assert.ok(Math.abs(geometry.width-Math.min(230,geometry.viewport-24))<=1,'V4 dropdown is 230 px or the available viewport width');
 assert.ok(geometry.left>=0&&geometry.right<=geometry.viewport+1&&geometry.top>=0&&geometry.bottom<=geometry.height+1,'The anchored popup stays visible');
 assert.ok(geometry.rows.every(x=>x.height>=44&&x.radius==='0px'),'Options retain touch targets and never become pills: '+JSON.stringify(geometry.rows));
 await sort.press('End');await sort.press('Escape');assert.equal(await appControlValue(sort),previous.sort,'Escape cannot silently apply a sort');
 assert.equal(await sort.evaluate(el=>el===document.activeElement),true,'Escape restores the invoking icon');
 await search.fill('v4-search-retained');
 await selectAppOption(filter,'Inaktiv');await selectAppOption(sort,'0:desc');const searchBox=await search.boundingBox();for(const row of await page.locator('.records-active-line').all()){const box=await row.boundingBox();assert.ok(box.y>=searchBox.y+searchBox.height,'Active selections stay below search on desktop and mobile');}
 await page.getByRole('button',{name:'Sortierung zurücksetzen',exact:true}).click();
 assert.equal(await appControlValue(sort),'default');assert.equal(await appControlValue(filter),'Inaktiv','Sort reset preserves the filter');assert.equal(await search.inputValue(),'v4-search-retained','Sort reset preserves search');
 await selectAppOption(sort,'0:asc');await page.getByRole('button',{name:'Filter zurücksetzen',exact:true}).click();
 assert.equal(await appControlValue(sort),'0:asc','Filter reset preserves sorting');assert.equal(await search.inputValue(),'v4-search-retained','Filter reset preserves search');
 const clear=page.getByRole('button',{name:'Suche leeren',exact:true});assert.equal(await clear.count(),1,'Exactly one application search clear is exposed');await clear.click();
 assert.equal(await search.inputValue(),'');assert.equal(await search.evaluate(el=>el===document.activeElement),true,'Search clearing preserves focus');assert.equal(await clear.count(),0,'An empty search has no clear control');
 await selectAppOption(filter,previous.filter);await selectAppOption(sort,previous.sort);await search.fill(previous.search);await search.press('Tab');
}

/** Real route integration, reused by the existing browser suite; no fixture baselines. */
export async function verifyAppSelection(page,dialog){
 const select=dialog.getByLabel('Status',{exact:true});
 const before=await appControlValue(select);
 await select.click();
 const list=page.getByRole('listbox');await list.waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden');
 await select.press('End');await select.press('Escape');
 assert.equal(await appControlValue(select),before,'Escape cannot silently apply a filter');
 assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden','Parent filter stays locked');
 await select.click();await page.getByRole('option',{name:'Inaktiv',exact:true}).click();
 assert.equal(await appControlValue(select),'Inaktiv','App popup updates the real form control');
 assert.equal(await list.count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.style.overflow),'hidden','Selection cannot unlock its parent');
}
