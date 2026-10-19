import {appControlValue} from './app-select-browser.mjs';
import assert from 'node:assert/strict';

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
