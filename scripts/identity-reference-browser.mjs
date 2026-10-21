import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
/** Actual identity geometry versus the independent derived R7 reference. */
export async function assertIdentityReference({page,context,width,output}){
  assert.equal(await page.locator('.auth-workspace-intro').count(),0,'Revision7 identity has one quiet column, without the retired promotional panel');
  await page.evaluate(()=>document.fonts.ready);assert.equal(await page.evaluate(()=>[...document.fonts].some(face=>face.family==='Inter'&&face.status==='loaded')),true,'Inter is genuinely loaded from the project, not merely named in CSS');
  const actual=await page.locator('.auth-card').evaluate(card=>{const box=card.getBoundingClientRect(),heading=card.querySelector('h1'),input=card.querySelector('input[type="email"]'),passkey=card.querySelector('.auth-passkey'),form=card.querySelector('form');return {width:box.width,center:box.x+box.width/2,font:getComputedStyle(heading).fontSize,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize,passkeyBeforeForm:!!(passkey.compareDocumentPosition(form)&Node.DOCUMENT_POSITION_FOLLOWING)}});
  assert.equal(actual.passkeyBeforeForm,true,'Passkey precedes password credentials');
  const reference=await context.newPage();await reference.setContent((await fs.readFile('docs/audit/v25-revision7/identity-reference.html','utf8')).replace('../../../public/brand/logo-black.svg','data:image/svg+xml;base64,'+(await fs.readFile('public/brand/logo-black.svg')).toString('base64')).replace('../../../public/fonts/inter/inter-latin-wght-normal.woff2','data:font/woff2;base64,'+(await fs.readFile('public/fonts/inter/inter-latin-wght-normal.woff2')).toString('base64')));
  const expected=await reference.locator('section').evaluate(card=>{const box=card.getBoundingClientRect(),input=card.querySelector('input[type="email"]');return {width:box.width,center:box.x+box.width/2,font:getComputedStyle(card.querySelector('h1')).fontSize,inputHeight:input.getBoundingClientRect().height,inputFont:getComputedStyle(input).fontSize}});
  for(const key of ['width','center','inputHeight'])assert.ok(Math.abs(actual[key]-expected[key])<=1,'Identity reference geometry '+key+' at '+width);
  for(const key of ['font','inputFont'])assert.equal(actual[key],expected[key],'Identity reference typography '+key);
  await reference.screenshot({path:path.join(output,`identity-reference-${width}.png`),animations:'disabled'});await page.screenshot({path:path.join(output,`identity-actual-${width}.png`),animations:'disabled'});await reference.close();
}
