import assert from 'node:assert/strict';
import path from 'node:path';
/** Real public legal navigation only; no contract acceptance or text changes. */
export async function verifyLegalPage(page,{base,width,theme,output}){
 await page.goto(base+'/datenschutz');await page.locator('.legal-toc summary').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'Long legal headings remain inside the viewport');
 const toc=page.locator('.legal-toc');await toc.locator('summary').focus();await page.keyboard.press('Enter');assert.equal(await toc.getAttribute('open'),'','Native keyboard disclosure opens the contents');
 const link=toc.locator('a').first(),href=await link.getAttribute('href');assert.ok(href?.startsWith('#legal-'));
 await link.focus();await page.keyboard.press('Enter');await page.waitForFunction(id=>document.activeElement?.id===id,href.slice(1));
 assert.equal(new URL(page.url()).hash,href,'The actual address preserves a shareable section fragment');
 const target=page.locator(href);assert.equal(await target.getAttribute('tabindex'),'-1');
 assert.equal(await page.locator('.legal-version').count(),1,'Version information remains available');
 await page.screenshot({path:path.join(output,`${theme}-${width}-legal-anchor.png`),fullPage:true,animations:'disabled'});
 await page.goto(base+'/unterauftragsbearbeiter');await page.locator('.legal-content').waitFor();assert.equal(await page.locator('.legal-toc').count(),0,'Short legal pages do not gain a redundant contents control');
 return {width,theme,status:'passed',scope:'Actual public TOC keyboard/fragment/focus/overflow; legal substance and translations remain unapproved'};
}
